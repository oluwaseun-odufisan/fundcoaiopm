import express from 'express';
import validator from 'validator';
import sanitizeHtml from 'sanitize-html';
import mongoose from 'mongoose';
import Chat from '../models/chatModel.js';
import Message from '../models/messageModel.js';
import userModel from '../models/userModel.js';
import authMiddleware from '../middleware/auth.js';
import { uploadFileToIPFS } from '../pinning/pinata.js';
const router = express.Router();
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await userModel.find({ _id: { $ne: req.user._id } }).select('_id name email').lean();
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});
router.post('/individual', authMiddleware, async (req, res) => {
    const { recipientId } = req.body;
    if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
        return res.status(400).json({ success: false, message: 'Valid recipient ID required' });
    }
    try {
        const recipient = await userModel.findById(recipientId).select('_id name').lean();
        if (!recipient) {
            return res.status(404).json({ success: false, message: 'Recipient not found' });
        }
        let chat = await Chat.findOne({
            type: 'individual',
            members: { $all: [req.user._id, recipientId], $size: 2 },
        }).lean();
        if (!chat) {
            chat = new Chat({
                type: 'individual',
                members: [req.user._id, recipientId],
                updatedAt: Date.now(),
            });
            await chat.save();
            chat = chat.toObject();
        }
        const populatedChat = await Chat.findById(chat._id)
            .select('_id type members updatedAt')
            .populate('members', '_id name lastActive')  // Updated: Include lastActive
            .lean();
        res.json({ success: true, chat: populatedChat });
    } catch (error) {
        console.error('Error creating individual chat:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to create chat' });
    }
});
router.get('/groups', authMiddleware, async (req, res) => {
    try {
        const groups = await Chat.find({
            type: 'group',
            members: req.user._id,
        })
            .select('_id name members updatedAt')
            .populate('members', '_id name lastActive')  // Updated: Include lastActive
            .lean();
        res.json({ success: true, groups });
    } catch (error) {
        console.error('Error fetching groups:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to fetch groups' });
    }
});
router.post('/groups', authMiddleware, async (req, res) => {
    const { name, members } = req.body;
    if (!members || !Array.isArray(members) || members.length < 1) {
        return res.status(400).json({
            success: false,
            message: 'At least one member required',
        });
    }
    const sanitizedName = sanitizeHtml(name || 'Unnamed Group', { allowedTags: [], allowedAttributes: {} });
    if (!validator.isLength(sanitizedName, { min: 1, max: 50 })) {
        return res.status(400).json({
            success: false,
            message: 'Group name must be between 1 and 50 characters',
        });
    }
    try {
        const uniqueMembers = [...new Set(members)];
        const invalidIds = uniqueMembers.filter((id) => !mongoose.isValidObjectId(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid member IDs: ${invalidIds.join(', ')}`,
            });
        }
        const validMembers = await userModel.find({ _id: { $in: uniqueMembers } }).select('_id name').lean();
        if (validMembers.length !== uniqueMembers.length) {
            const foundIds = validMembers.map((m) => m._id.toString());
            const missingIds = uniqueMembers.filter((id) => !foundIds.includes(id));
            return res.status(400).json({
                success: false,
                message: `Members not found: ${missingIds.join(', ')}`,
            });
        }
        const chat = new Chat({
            type: 'group',
            name: sanitizedName,
            members: [...new Set([...uniqueMembers, req.user._id])],
            updatedAt: Date.now(),
        });
        await chat.save();
        const populatedChat = await Chat.findById(chat._id)
            .select('_id type name members updatedAt')
            .populate('members', '_id name lastActive')  // Updated: Include lastActive
            .lean();
        if (!req.io) {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        req.io.to(chat._id.toString()).emit('groupCreated', {
            success: true,
            group: populatedChat,
        });
        res.json({ success: true, group: populatedChat });
    } catch (error) {
        console.error('Error creating group:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to create group' });
    }
});
router.put('/groups/:groupId/members', authMiddleware, async (req, res) => {
    const { members } = req.body;
    const { groupId } = req.params;
    if (!mongoose.isValidObjectId(groupId)) {
        return res.status(400).json({ success: false, message: 'Invalid group ID' });
    }
    if (!members || !Array.isArray(members) || members.length < 1) {
        return res.status(400).json({ success: false, message: 'At least one member required' });
    }
    try {
        const uniqueMembers = [...new Set(members)];
        const invalidIds = uniqueMembers.filter((id) => !mongoose.isValidObjectId(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid member IDs: ${invalidIds.join(', ')}`,
            });
        }
        const chat = await Chat.findOne({ _id: groupId, type: 'group', members: req.user._id });
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Group not found or access denied' });
        }
        const validMembers = await userModel.find({ _id: { $in: uniqueMembers } }).select('_id name').lean();
        if (validMembers.length !== uniqueMembers.length) {
            const foundIds = validMembers.map((m) => m._id.toString());
            const missingIds = uniqueMembers.filter((id) => !foundIds.includes(id));
            return res.status(400).json({
                success: false,
                message: `Members not found: ${missingIds.join(', ')}`,
            });
        }
        const newMembers = uniqueMembers.filter((id) => !chat.members.includes(id));
        if (newMembers.length === 0) {
            return res.status(400).json({ success: false, message: 'No new members to add' });
        }
        chat.members = [...new Set([...chat.members, ...newMembers])];
        chat.updatedAt = Date.now();
        await chat.save();
        const populatedChat = await Chat.findById(chat._id)
            .select('_id type name members updatedAt')
            .populate('members', '_id name lastActive')  // Updated: Include lastActive
            .lean();
        if (!req.io) {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        req.io.to(chat._id.toString()).emit('groupUpdated', {
            success: true,
            group: populatedChat,
        });
        res.json({ success: true, group: populatedChat });
    } catch (error) {
        console.error('Error adding group members:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to add members' });
    }
});
router.get('/:chatId/messages', authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    if (!mongoose.isValidObjectId(chatId)) {
        return res.status(400).json({ success: false, message: 'Invalid chat ID' });
    }
    try {
        const chat = await Chat.findOne({ _id: chatId, members: req.user._id }).select('_id').lean();
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found or access denied' });
        }
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const messages = await Message.find({ chatId })
            .select('_id chatId sender content fileUrl fileName contentType createdAt isDeleted isEdited')
            .populate('sender', '_id name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10))
            .lean();
        const totalMessages = await Message.countDocuments({ chatId });
        const totalPages = Math.ceil(totalMessages / parseInt(limit, 10));
        res.json({
            success: true,
            messages: messages.reverse(),
            pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages,
                totalMessages,
            },
        });
    } catch (error) {
        console.error('Error fetching messages:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
});
router.post('/:chatId/messages', authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const { content, fileUrl, contentType, fileName } = req.body;
    if (!mongoose.isValidObjectId(chatId)) {
        return res.status(400).json({ success: false, message: 'Invalid chat ID' });
    }
    if (!content && !fileUrl) {
        return res.status(400).json({ success: false, message: 'Message content or file required' });
    }
    const sanitizedContent = content ? sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} }) : '';
    if (sanitizedContent && !validator.isLength(sanitizedContent, { min: 1, max: 1000 })) {
        return res.status(400).json({ success: false, message: 'Message content must be between 1 and 1000 characters' });
    }
    if (fileUrl && !validator.isURL(fileUrl)) {
        return res.status(400).json({ success: false, message: 'Invalid file URL' });
    }
    try {
        const chat = await Chat.findOne({ _id: chatId, members: req.user._id });
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found or access denied' });
        }
        const message = new Message({
            chatId,
            sender: req.user._id,
            content: sanitizedContent,
            fileUrl,
            contentType,
            fileName,
        });
        await message.save();
        
        // Added: Update sender's lastActive on message send
        const sender = await userModel.findById(req.user._id);
        sender.lastActive = new Date();
        await sender.save();

        const populatedMessage = await Message.findById(message._id).populate('sender', '_id name').lean();
        chat.updatedAt = Date.now();
        await chat.save();
        if (!req.io) {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        req.io.to(chatId).emit('message', populatedMessage);
        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Error sending message:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});
router.put('/messages/:messageId', authMiddleware, async (req, res) => {
    const { messageId } = req.params;
    const { content } = req.body;
    if (!mongoose.isValidObjectId(messageId)) {
        return res.status(400).json({ success: false, message: 'Invalid message ID' });
    }
    if (!content || !validator.isLength(content, { min: 1, max: 1000 })) {
        return res.status(400).json({ success: false, message: 'Valid message content required' });
    }
    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized to edit this message' });
        }
        if (message.isDeleted) {
            return res.status(400).json({ success: false, message: 'Cannot edit a deleted message' });
        }
        message.content = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });
        message.isEdited = true;
        await message.save();
        const populatedMessage = await Message.findById(message._id).populate('sender', '_id name').lean();
        if (!req.io) {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        req.io.to(message.chatId.toString()).emit('messageUpdated', populatedMessage);
        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Error editing message:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to edit message' });
    }
});
router.delete('/messages/:messageId', authMiddleware, async (req, res) => {
    const { messageId } = req.params;
    if (!mongoose.isValidObjectId(messageId)) {
        return res.status(400).json({ success: false, message: 'Invalid message ID' });
    }
    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized to delete this message' });
        }
        message.isDeleted = true;
        message.content = 'This message was deleted';
        message.fileUrl = null;
        message.fileName = null;
        message.contentType = '';
        await message.save();
        const populatedMessage = await Message.findById(message._id).populate('sender', '_id name').lean();
        if (!req.io) {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        req.io.to(message.chatId.toString()).emit('messageDeleted', populatedMessage);
        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Error deleting message:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
});
router.post('/upload', authMiddleware, async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const file = req.files.file;
        if (file.size > 50 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: 'File size exceeds 50MB' });
        }
        const buffer = file.data;
        const fileName = sanitizeHtml(file.name, { allowedTags: [], allowedAttributes: {} });
        const mimeType = file.mimetype;
        const cid = await uploadFileToIPFS(buffer, fileName, mimeType);
        const fileUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
        const contentType = mimeType.split('/')[0];
        res.json({ success: true, fileUrl, contentType, fileName });
    } catch (error) {
        console.error('Error uploading chat file:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to upload file' });
    }
});
router.get('/timestamps', authMiddleware, async (req, res) => {
    try {
        const lastMessages = await Message.aggregate([
            { $match: { chatId: { $in: await Chat.find({ members: req.user._id }).distinct('_id') } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$chatId',
                    createdAt: { $first: '$createdAt' },
                },
            },
        ]);
        const timestamps = lastMessages.reduce((acc, msg) => {
            acc[msg._id.toString()] = msg.createdAt.toISOString();
            return acc;
        }, {});
        const chatsWithoutMessages = await Chat.find({
            members: req.user._id,
            _id: { $nin: lastMessages.map((msg) => msg._id) },
        }).select('_id updatedAt');
        chatsWithoutMessages.forEach((chat) => {
            timestamps[chat._id.toString()] = chat.updatedAt.toISOString();
        });
        res.json({ success: true, timestamps });
    } catch (error) {
        console.error('Error fetching chat timestamps:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to fetch timestamps' });
    }
});
export default router;