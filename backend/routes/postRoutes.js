import express from 'express';
import validator from 'validator';
import sanitizeHtml from 'sanitize-html';
import mongoose from 'mongoose';
import Post from '../models/postModel.js';
import authMiddleware from '../middleware/auth.js';
import { uploadFileToIPFS } from '../pinning/pinata.js';

const router = express.Router();

// Create a post
router.post('/', authMiddleware, async (req, res, next) => {
    const { content, fileUrl, contentType } = req.body;

    if (!content && !fileUrl) {
        return res.status(400).json({ success: false, message: 'Post content or file required' });
    }

    const sanitizedContent = content ? sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} }) : '';
    if (sanitizedContent && !validator.isLength(sanitizedContent, { min: 1, max: 1000 })) {
        return res.status(400).json({ success: false, message: 'Post content must be between 1 and 1000 characters' });
    }

    if (fileUrl && !validator.isURL(fileUrl)) {
        return res.status(400).json({ success: false, message: 'Invalid file URL' });
    }

    try {
        const post = new Post({
            user: req.user._id,
            content: sanitizedContent,
            fileUrl,
            contentType,
        });
        await post.save();
        await post.populate('user', 'name _id');
        req.io.emit('newPost', post);
        res.json({ success: true, post });
    } catch (error) {
        console.error('Error creating post:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create post' });
        next(error);
    }
});

// Update a post
router.put('/:id', authMiddleware, async (req, res, next) => {
    const { id } = req.params;
    const { content, fileUrl, contentType } = req.body;

    if (!content && !fileUrl) {
        return res.status(400).json({ success: false, message: 'Post content or file required' });
    }

    const sanitizedContent = content ? sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} }) : '';
    if (sanitizedContent && !validator.isLength(sanitizedContent, { min: 1, max: 1000 })) {
        return res.status(400).json({ success: false, message: 'Post content must be between 1 and 1000 characters' });
    }

    if (fileUrl && !validator.isURL(fileUrl)) {
        return res.status(400).json({ success: false, message: 'Invalid file URL' });
    }

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    try {
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
        }

        post.content = sanitizedContent || post.content;
        post.fileUrl = fileUrl !== undefined ? fileUrl : post.fileUrl;
        post.contentType = contentType !== undefined ? contentType : post.contentType;
        await post.save();
        await post.populate('user', 'name _id');
        req.io.emit('postUpdated', post);
        res.json({ success: true, post });
    } catch (error) {
        console.error('Error updating post:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update post' });
        next(error);
    }
});

// Delete a post
router.delete('/:id', authMiddleware, async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    try {
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
        }

        await post.deleteOne();
        req.io.emit('postDeleted', id);
        res.json({ success: true, message: 'Post deleted' });
    } catch (error) {
        console.error('Error deleting post:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete post' });
        next(error);
    }
});

// Fetch posts (paginated)
router.get('/', authMiddleware, async (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (pageNum < 1 || limitNum < 1) {
        return res.status(400).json({ success: false, message: 'Invalid page or limit' });
    }

    try {
        const posts = await Post.find()
            .populate('user', 'name _id')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);
        res.json({ success: true, posts });
    } catch (error) {
        console.error('Error fetching posts:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch posts' });
        next(error);
    }
});

// Upload file
router.post('/upload', authMiddleware, async (req, res, next) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const file = req.files.file;
        if (file.size > 50 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: 'File size exceeds 50MB' });
        }

        const buffer = file.data;
        const fileName = file.name;
        const mimeType = file.mimetype;
        const cid = await uploadFileToIPFS(buffer, fileName, mimeType);
        const fileUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
        const contentType = mimeType.split('/')[0];

        res.json({ success: true, fileUrl, contentType });
    } catch (error) {
        console.error('Error uploading file:', error.message);
        res.status(500).json({ success: false, message: error.message });
        next(error);
    }
});

export default router;