import mongoose from 'mongoose';
import axios from 'axios';
import sanitizeHtml from 'sanitize-html';
import Post from '../models/postModel.js';
import User from '../models/userModel.js';

const sanitize = (str) =>
    sanitizeHtml(str || '', { allowedTags: [], allowedAttributes: {} }).trim();

const emitEvent = async (event, data) => {
    try {
        await axios.post(`${process.env.USER_API_URL}/api/emit`, { event, data });
    } catch (_) {}
};

// ── SCOPE FILTER ──────────────────────────────────────────────────────────────
// Executives can post announcements but cannot delete arbitrary posts (only super-admin can)
// Team-leads can moderate (hide) posts from their sector's users

const getSectorUserIds = async (admin) => {
    if (admin.role === 'team-lead') {
        if (!admin.managedSector) return null;
        const users = await User.find({ unitSector: admin.managedSector }).select('_id');
        return users.map(u => u._id);
    }
    return null; // executive / super-admin: no restriction
};

// ── GET ALL POSTS ─────────────────────────────────────────────────────────────
export const getAllPosts = async (req, res) => {
    try {
        const { search, filter, userId, unitSector, page = 1, limit = 20, hidden } = req.query;

        const query = {};

        // Team-lead scope
        if (req.admin.role === 'team-lead') {
            const ids = await getSectorUserIds(req.admin);
            if (!ids) return res.status(403).json({ success: false, message: 'No managed sector assigned' });
            query.user = { $in: ids };
        }

        if (userId) query.user = userId;

        if (unitSector && req.admin.role !== 'team-lead') {
            const sectorUsers = await User.find({ unitSector }).select('_id');
            query.user = { $in: sectorUsers.map(u => u._id) };
        }

        if (search) query.$text = { $search: sanitize(search) };

        if (filter === 'announcements') query.isAnnouncement = true;
        if (filter === 'pinned')        query.isPinned = true;
        if (filter === 'media')         query.fileUrl = { $exists: true, $ne: '' };

        // By default show non-hidden posts; super-admin can see hidden too
        if (hidden === 'true' && req.admin.role === 'super-admin') {
            query.hiddenByAdmin = true;
        } else if (req.admin.role !== 'super-admin') {
            query.hiddenByAdmin = { $ne: true };
        }

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await Post.countDocuments(query);

        const posts = await Post.find(query)
            .populate('user', 'firstName lastName email unitSector position avatar')
            .populate('comments.user', 'firstName lastName email avatar')
            .sort({ isPinned: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            posts,
            pagination: {
                total,
                page:       parseInt(page),
                limit:      parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('Get all posts error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET SINGLE POST ───────────────────────────────────────────────────────────
export const getPostById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        const post = await Post.findById(req.params.id)
            .populate('user',          'firstName lastName email unitSector position avatar')
            .populate('comments.user', 'firstName lastName email avatar');

        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        res.json({ success: true, post });
    } catch (err) {
        console.error('Get post by id error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── POST ANNOUNCEMENT (executive and above) ───────────────────────────────────
// Executives can post official org-wide announcements
export const createAnnouncement = async (req, res) => {
    try {
        const { content, fileUrl, contentType, isPinned } = req.body;
        const clean = sanitize(content);

        if (!clean && !fileUrl) {
            return res.status(400).json({ success: false, message: 'Announcement must have content or a file' });
        }

        // Find admin's linked user account (if any) OR use a system user
        // For the post, we need a user _id as owner — the admin posts on behalf of themselves
        // If admin doesn't have a user account, we post as the first super-admin user found
        // Best practice: admins should also have user accounts registered with the same email

        const adminUserAccount = await User.findOne({ email: req.admin.email });
        if (!adminUserAccount) {
            return res.status(400).json({
                success: false,
                message: 'No user account linked to this admin email. Please create a user account with the same email first.',
            });
        }

        const post = await Post.create({
            user:           adminUserAccount._id,
            content:        clean,
            fileUrl:        fileUrl || '',
            contentType:    contentType || '',
            isAnnouncement: true,
            isPinned:       isPinned || false,
        });

        await post.populate('user', 'firstName lastName email unitSector position avatar');

        // Broadcast to all connected users
        await emitEvent('post:new', post);

        res.status(201).json({ success: true, post });
    } catch (err) {
        console.error('Create announcement error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── HIDE / UNHIDE POST (team-lead for their sector, super-admin for all) ───────
export const toggleHidePost = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        const { reason } = req.body;
        const post = await Post.findById(req.params.id).populate('user', 'unitSector');

        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        // Team-lead can only moderate posts from their sector
        if (req.admin.role === 'team-lead' && post.user?.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: Post not in your team' });
        }

        post.hiddenByAdmin = !post.hiddenByAdmin;
        post.hiddenReason  = post.hiddenByAdmin ? (reason || 'Removed by moderator') : '';
        await post.save();

        // Emit update to all clients
        await emitEvent('post:updated', { _id: post._id, hiddenByAdmin: post.hiddenByAdmin });

        res.json({
            success: true,
            message: post.hiddenByAdmin ? 'Post hidden' : 'Post restored',
            hiddenByAdmin: post.hiddenByAdmin,
        });
    } catch (err) {
        console.error('Toggle hide post error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── PIN / UNPIN POST (executive and above) ─────────────────────────────────────
export const togglePinPost = async (req, res) => {
    try {
        if (req.admin.role === 'team-lead') {
            return res.status(403).json({ success: false, message: 'Team leads cannot pin posts' });
        }
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        post.isPinned = !post.isPinned;
        await post.save();

        await emitEvent('post:updated', { _id: post._id, isPinned: post.isPinned });

        res.json({ success: true, message: post.isPinned ? 'Post pinned' : 'Post unpinned', isPinned: post.isPinned });
    } catch (err) {
        console.error('Toggle pin post error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── DELETE POST (super-admin only) ────────────────────────────────────────────
export const deletePost = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        await emitEvent('post:deleted', { _id: req.params.id });

        res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
        console.error('Delete post error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── DELETE COMMENT (team-lead and above for their scope, super-admin for all) ──
export const deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).populate('user', 'unitSector');
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        if (req.admin.role === 'team-lead' && post.user?.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: Post not in your team' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

        comment.deleteOne();
        await post.save();
        await post.populate('user', 'firstName lastName email unitSector position avatar');

        await emitEvent('post:updated', post);

        res.json({ success: true, message: 'Comment removed', post });
    } catch (err) {
        console.error('Delete comment error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET POST STATS ────────────────────────────────────────────────────────────
export const getPostStats = async (req, res) => {
    try {
        const scopeQuery = {};
        if (req.admin.role === 'team-lead') {
            const ids = await getSectorUserIds(req.admin);
            if (!ids) return res.status(403).json({ success: false, message: 'No managed sector assigned' });
            scopeQuery.user = { $in: ids };
        }

        const [total, announcements, pinned, hidden, withMedia] = await Promise.all([
            Post.countDocuments(scopeQuery),
            Post.countDocuments({ ...scopeQuery, isAnnouncement: true }),
            Post.countDocuments({ ...scopeQuery, isPinned: true }),
            Post.countDocuments({ ...scopeQuery, hiddenByAdmin: true }),
            Post.countDocuments({ ...scopeQuery, fileUrl: { $exists: true, $ne: '' } }),
        ]);

        res.json({ success: true, stats: { total, announcements, pinned, hidden, withMedia } });
    } catch (err) {
        console.error('Post stats error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};