import Post from '../models/postModel.js';
import sanitizeHtml from 'sanitize-html';

const sanitize = (str) => sanitizeHtml(str || '', { allowedTags: [], allowedAttributes: {} }).trim();

const POPULATE_USER = { path: 'user', select: 'firstName lastName otherName _id avatar position' };
const POPULATE_COMMENTS = { path: 'comments.user', select: 'firstName lastName _id avatar' };

// ── Get all posts (admin view) ────────────────────────────────────────────────
export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, filter } = req.query;
    const query = {};

    if (search) query.$text = { $search: search };
    if (filter === 'announcements') query.isAnnouncement = true;
    if (filter === 'media') query.fileUrl = { $exists: true, $ne: '' };

    // Team filter for non-super-admin
    if (req.teamMemberIds && filter !== 'announcements') {
      query.user = { $in: req.teamMemberIds };
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate([POPULATE_USER, POPULATE_COMMENTS])
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Post.countDocuments(query),
    ]);

    res.json({
      success: true, posts, total,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getAllPosts error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

// ── Create announcement ───────────────────────────────────────────────────────
export const createAnnouncement = async (req, res) => {
  try {
    const { content, scope = 'all' } = req.body;
    const clean = sanitize(content);
    if (!clean) return res.status(400).json({ success: false, message: 'Announcement content required' });

    // Team leads can only post to their team
    if (req.user.role === 'team-lead' && scope === 'all') {
      return res.status(403).json({ success: false, message: 'Team leads can only post team announcements' });
    }

    const post = new Post({
      user: req.user._id, content: clean,
      isAnnouncement: true, announcementScope: scope,
    });
    await post.save();
    await post.populate([POPULATE_USER, POPULATE_COMMENTS]);

    if (req.io) req.io.emit('post:new', post.toObject());
    res.status(201).json({ success: true, post: post.toObject() });
  } catch (err) {
    console.error('createAnnouncement error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create announcement' });
  }
};

// ── Delete post (moderation) ──────────────────────────────────────────────────
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    // Team leads can only delete posts from their team
    if (req.user.role === 'team-lead' && req.teamMemberIds) {
      if (!req.teamMemberIds.map(String).includes(String(post.user))) {
        return res.status(403).json({ success: false, message: 'Can only moderate your team posts' });
      }
    }

    await post.deleteOne();
    if (req.io) req.io.emit('post:deleted', { _id: req.params.id });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

// ── Delete comment (moderation) ───────────────────────────────────────────────
export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    comment.deleteOne();
    await post.save();
    await post.populate([POPULATE_USER, POPULATE_COMMENTS]);

    if (req.io) req.io.emit('post:updated', post.toObject());
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};
