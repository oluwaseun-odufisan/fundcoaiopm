// controllers/chatController.js
import validator from 'validator';
import sanitizeHtml from 'sanitize-html';
import mongoose from 'mongoose';
import Chat from '../models/chatModel.js';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';
import { uploadFileToIPFS } from '../pinning/pinata.js';

// Safe full name helper
const getFullName = (user) => {
    if (!user) return 'Unknown User';
    if (user.fullName) return user.fullName.trim();
    if (user.firstName || user.lastName) {
        return `${user.firstName || ''} ${user.lastName || ''} ${user.otherName || ''}`.trim();
    }
    return user.name?.trim() || 'Unknown User';
};

// Fetch all users except current user
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user._id } })
            .select('firstName lastName otherName avatar online lastActive')
            .lean();
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

// Create or get individual chat
export const createIndividualChat = async (req, res) => {
    const { recipientId } = req.body;
    if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
        return res.status(400).json({ success: false, message: 'Valid recipient ID required' });
    }
    try {
        const recipient = await User.findById(recipientId)
            .select('firstName lastName otherName avatar online lastActive')
            .lean();
        if (!recipient) {
            return res.status(404).json({ success: false, message: 'Recipient not found' });
        }
        let chat = await Chat.findOne({
            type: 'individual',
            members: { $all: [req.user._id, recipientId], $size: 2 },
        }).populate('members', 'firstName lastName otherName avatar online lastActive').lean();
        if (!chat) {
            chat = new Chat({
                type: 'individual',
                members: [req.user._id, recipientId],
                unreadCounts: new Map([[req.user._id.toString(), 0], [recipientId.toString(), 0]]),
                updatedAt: Date.now(),
            });
            await chat.save();
            chat = await Chat.findById(chat._id)
                .populate('members', 'firstName lastName otherName avatar online lastActive')
                .lean();
        }
        res.json({ success: true, chat });
    } catch (error) {
        console.error('Error creating individual chat:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to create chat' });
    }
};

// Fetch all groups for user
export const getGroups = async (req, res) => {
    try {
        const groups = await Chat.find({
            type: 'group',
            members: req.user._id,
        })
            .select('_id name avatar adminId members updatedAt unreadCounts')
            .populate('members', 'firstName lastName otherName avatar online lastActive')
            .populate('adminId', 'firstName lastName')
            .lean();
        res.json({ success: true, groups });
    } catch (error) {
        console.error('Error fetching groups:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to fetch groups' });
    }
};

// Create new group
export const createGroup = async (req, res) => {
    const { name, members, avatar } = req.body;
    if (!members || !Array.isArray(members) || members.length < 1) {
        return res.status(400).json({ success: false, message: 'At least one member required' });
    }
    const sanitizedName = sanitizeHtml(name || 'Unnamed Group', { allowedTags: [], allowedAttributes: {} });
    if (!validator.isLength(sanitizedName, { min: 1, max: 50 })) {
        return res.status(400).json({ success: false, message: 'Group name must be between 1 and 50 characters' });
    }
    try {
        const uniqueMemberStrings = [...new Set(members)];
        const invalidIds = uniqueMemberStrings.filter((id) => !mongoose.isValidObjectId(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({ success: false, message: `Invalid member IDs: ${invalidIds.join(', ')}` });
        }
        const uniqueMembers = uniqueMemberStrings.map(id => new mongoose.Types.ObjectId(id));
        const validMembers = await User.find({ _id: { $in: uniqueMembers } })
            .select('firstName lastName otherName avatar online lastActive')
            .lean();
        if (validMembers.length !== uniqueMemberStrings.length) {
            const foundIds = validMembers.map((m) => m._id.toString());
            const missingIds = uniqueMemberStrings.filter((id) => !foundIds.includes(id));
            return res.status(400).json({ success: false, message: `Members not found: ${missingIds.join(', ')}` });
        }
        const allMembers = [...new Set([...uniqueMembers, req.user._id])];
        const unreadMap = new Map();
        allMembers.forEach(id => unreadMap.set(id.toString(), 0));
        const chat = new Chat({
            type: 'group',
            name: sanitizedName,
            avatar: avatar && validator.isURL(avatar) ? avatar : '',
            adminId: req.user._id,
            members: allMembers,
            unreadCounts: unreadMap,
            updatedAt: Date.now(),
        });
        await chat.save();
        const populatedChat = await Chat.findById(chat._id)
            .select('_id type name avatar adminId members updatedAt unreadCounts')
            .populate('members', 'firstName lastName otherName avatar online lastActive')
            .populate('adminId', 'firstName lastName')
            .lean();
        req.io.to(chat._id.toString()).emit('groupCreated', { success: true, group: populatedChat });
        res.json({ success: true, group: populatedChat });
    } catch (error) {
        console.error('Error creating group:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to create group' });
    }
};

// Add members to group
export const addGroupMembers = async (req, res) => {
    const { members } = req.body;
    const { groupId } = req.params;
    if (!mongoose.isValidObjectId(groupId)) {
        return res.status(400).json({ success: false, message: 'Invalid group ID' });
    }
    if (!members || !Array.isArray(members) || members.length < 1) {
        return res.status(400).json({ success: false, message: 'At least one member required' });
    }
    try {
        const uniqueMemberStrings = [...new Set(members)];
        const invalidIds = uniqueMemberStrings.filter((id) => !mongoose.isValidObjectId(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({ success: false, message: `Invalid member IDs: ${invalidIds.join(', ')}` });
        }
        const uniqueMembers = uniqueMemberStrings.map(id => new mongoose.Types.ObjectId(id));
        const chat = await Chat.findOne({ _id: groupId, type: 'group', members: req.user._id });
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Group not found or access denied' });
        }
        const validMembers = await User.find({ _id: { $in: uniqueMembers } })
            .select('firstName lastName otherName avatar online lastActive')
            .lean();
        if (validMembers.length !== uniqueMemberStrings.length) {
            const foundIds = validMembers.map((m) => m._id.toString());
            const missingIds = uniqueMemberStrings.filter((id) => !foundIds.includes(id));
            return res.status(400).json({ success: false, message: `Members not found: ${missingIds.join(', ')}` });
        }
        const newMembers = uniqueMembers.filter((id) => !chat.members.includes(id));
        if (newMembers.length === 0) {
            return res.status(400).json({ success: false, message: 'No new members to add' });
        }
        newMembers.forEach(id => chat.unreadCounts.set(id.toString(), 0));
        chat.members = [...new Set([...chat.members, ...newMembers])];
        chat.updatedAt = Date.now();
        await chat.save();
        const populatedChat = await Chat.findById(chat._id)
            .select('_id type name avatar adminId members updatedAt unreadCounts')
            .populate('members', 'firstName lastName otherName avatar online lastActive')
            .populate('adminId', 'firstName lastName')
            .lean();
        req.io.to(chat._id.toString()).emit('groupUpdated', { success: true, group: populatedChat });
        res.json({ success: true, group: populatedChat });
    } catch (error) {
        console.error('Error adding group members:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to add members' });
    }
};

// Fetch messages for chat
export const getChatMessages = async (req, res) => {
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
            .select('_id chatId sender content fileUrl fileName contentType createdAt isDeleted isEdited reactions replyTo readBy')
            .populate('sender', 'firstName lastName otherName avatar')
            .populate('replyTo', '_id content sender')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10))
            .lean();
        const totalMessages = await Message.countDocuments({ chatId });
        const totalPages = Math.ceil(totalMessages / parseInt(limit, 10));
        // Reset unread for user
        chat.unreadCounts.set(req.user._id.toString(), 0);
        await chat.save();
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
};

// Send message
export const sendMessage = async (req, res) => {
    const { chatId } = req.params;
    const { content, fileUrl, contentType, fileName, replyTo } = req.body;
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
    if (replyTo && !mongoose.isValidObjectId(replyTo)) {
        return res.status(400).json({ success: false, message: 'Invalid replyTo ID' });
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
            replyTo: replyTo || null,
            readBy: [{ userId: req.user._id, timestamp: new Date() }],
        });
        await message.save();
        // Update sender's lastActive
        const sender = await User.findById(req.user._id);
        sender.lastActive = new Date();
        await sender.save();
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName otherName avatar')
            .populate({
                path: 'replyTo',
                select: '_id content sender',
                populate: { path: 'sender', select: 'firstName lastName otherName' }
            })
            .lean();
        chat.updatedAt = Date.now();
        // Increment unread for other members
        chat.members.forEach((memberId) => {
            if (memberId.toString() !== req.user._id.toString()) {
                const currentCount = chat.unreadCounts.get(memberId.toString()) || 0;
                chat.unreadCounts.set(memberId.toString(), currentCount + 1);
                req.io.to(`user:${memberId.toString()}`).emit('unreadUpdate', { chatId, count: currentCount + 1 });
            }
        });
        await chat.save();
        req.io.to(chatId.toString()).emit('message', populatedMessage);
        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Error sending message:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

// Edit message
export const editMessage = async (req, res) => {
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
        if (new Date() - new Date(message.createdAt) > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: 'Edit time limit exceeded' });
        }
        message.content = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });
        message.isEdited = true;
        await message.save();
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName otherName avatar')
            .populate({
                path: 'replyTo',
                select: '_id content sender',
                populate: { path: 'sender', select: 'firstName lastName otherName' }
            })
            .lean();
        req.io.to(message.chatId.toString()).emit('messageUpdated', populatedMessage);
        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Error editing message:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to edit message' });
    }
};

// Delete message
export const deleteMessage = async (req, res) => {
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
        message.contentType = 'text';
        message.reactions = [];
        await message.save();
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName otherName avatar')
            .populate({
                path: 'replyTo',
                select: '_id content sender',
                populate: { path: 'sender', select: 'firstName lastName otherName' }
            })
            .lean();
        req.io.to(message.chatId.toString()).emit('messageDeleted', populatedMessage);
        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Error deleting message:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
};

// Upload file
export const uploadChatFile = async (req, res) => {
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
};

// Fetch chat timestamps
export const getChatTimestamps = async (req, res) => {
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
};

// Get total unread count
export const getUnreadTotal = async (req, res) => {
    try {
        const total = await Chat.aggregate([
            { $match: { members: req.user._id } },
            { $group: { _id: null, total: { $sum: { $ifNull: [ `$unreadCounts.${req.user._id.toString()}`, 0 ] } } } }
        ]);
        res.json({ success: true, total: total[0]?.total || 0 });
    } catch (error) {
        console.error('Error fetching unread total:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to fetch unread total' });
    }
};

// Mark message as read
export const markMessageRead = async (req, res) => {
    const { messageId } = req.params;
    if (!mongoose.isValidObjectId(messageId)) {
        return res.status(400).json({ success: false, message: 'Invalid message ID' });
    }
    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        if (!message.readBy.some((rb) => rb.userId.toString() === req.user._id.toString())) {
            message.readBy.push({ userId: req.user._id, timestamp: new Date() });
            await message.save();
        }
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName otherName avatar')
            .populate({
                path: 'replyTo',
                select: '_id content sender',
                populate: { path: 'sender', select: 'firstName lastName otherName' }
            })
            .lean();
        req.io.to(message.chatId.toString()).emit('messageRead', populatedMessage);
        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Error marking message as read:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to mark message as read' });
    }
};

// Add reaction
export const addReaction = async (req, res) => {
    const { messageId } = req.params;
    const { emoji } = req.body;
    if (!mongoose.isValidObjectId(messageId)) {
        return res.status(400).json({ success: false, message: 'Invalid message ID' });
    }
    if (!emoji || !validator.isLength(emoji, { min: 1, max: 10 })) {
        return res.status(400).json({ success: false, message: 'Valid emoji required' });
    }
    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        if (message.isDeleted) {
            return res.status(400).json({ success: false, message: 'Cannot react to deleted message' });
        }
        const existingReaction = message.reactions.find(r => r.userId.toString() === req.user._id.toString());
        if (existingReaction) {
            existingReaction.emoji = emoji;
            existingReaction.timestamp = new Date();
        } else {
            message.reactions.push({ userId: req.user._id, emoji, timestamp: new Date() });
        }
        await message.save();
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName otherName avatar')
            .populate({
                path: 'replyTo',
                select: '_id content sender',
                populate: { path: 'sender', select: 'firstName lastName otherName' }
            })
            .lean();
        req.io.to(message.chatId.toString()).emit('messageUpdated', populatedMessage);
        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Error adding reaction:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to add reaction' });
    }
};

// Remove reaction
export const removeReaction = async (req, res) => {
    const { messageId } = req.params;
    if (!mongoose.isValidObjectId(messageId)) {
        return res.status(400).json({ success: false, message: 'Invalid message ID' });
    }
    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        message.reactions = message.reactions.filter(r => r.userId.toString() !== req.user._id.toString());
        await message.save();
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName otherName avatar')
            .populate({
                path: 'replyTo',
                select: '_id content sender',
                populate: { path: 'sender', select: 'firstName lastName otherName' }
            })
            .lean();
        req.io.to(message.chatId.toString()).emit('messageUpdated', populatedMessage);
        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Error removing reaction:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to remove reaction' });
    }
};