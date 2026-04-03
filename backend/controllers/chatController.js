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
        // Attach the caller's unread count for this chat
        const unreadCount = chat.unreadCounts
            ? (chat.unreadCounts[req.user._id.toString()] ?? 0)
            : 0;
        res.json({ success: true, chat: { ...chat, myUnreadCount: unreadCount } });
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

        // Attach each group's unread count for the calling user
        const groupsWithUnread = groups.map((g) => ({
            ...g,
            myUnreadCount: g.unreadCounts
                ? (g.unreadCounts[req.user._id.toString()] ?? 0)
                : 0,
        }));

        res.json({ success: true, groups: groupsWithUnread });
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

        // Exclude the creator from member validation — they may or may not be in the list
        const nonCreatorIds = uniqueMemberStrings.filter(id => id !== req.user._id.toString());
        const nonCreatorObjectIds = nonCreatorIds.map(id => new mongoose.Types.ObjectId(id));

        const validMembers = await User.find({ _id: { $in: nonCreatorObjectIds.length ? nonCreatorObjectIds : uniqueMembers } })
            .select('firstName lastName otherName avatar online lastActive')
            .lean();

        // Only validate non-creator members exist
        if (nonCreatorIds.length > 0 && validMembers.length !== nonCreatorIds.length) {
            const foundIds = validMembers.map((m) => m._id.toString());
            const missingIds = nonCreatorIds.filter((id) => !foundIds.includes(id));
            return res.status(400).json({ success: false, message: `Members not found: ${missingIds.join(', ')}` });
        }

        // Build allMembers using string dedup then convert — ObjectId Set dedup is unreliable
        const allMemberStrings = [...new Set([...uniqueMemberStrings, req.user._id.toString()])];
        const allMembers = allMemberStrings.map(id => new mongoose.Types.ObjectId(id));
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

// getChatMessages — parallel access-check + fetch + count
export const getChatMessages = async (req, res) => {
    const { chatId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    if (!mongoose.isValidObjectId(chatId)) {
        return res.status(400).json({ success: false, message: 'Invalid chat ID' });
    }
    try {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Run access check, message fetch, and count all in parallel
        const [chat, messages, totalMessages] = await Promise.all([
            Chat.findOne({ _id: chatId, members: req.user._id }).select('_id').lean(),
            Message.find({ chatId })
                .select('_id chatId sender content fileUrl fileName contentType createdAt isDeleted isEdited reactions replyTo readBy')
                .populate('sender', 'firstName lastName otherName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Message.countDocuments({ chatId }),
        ]);

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found or access denied' });
        }

        res.json({
            success: true,
            messages: messages.reverse(),
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalMessages / limitNum),
                totalMessages,
            },
        });
    } catch (error) {
        console.error('Error fetching messages:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
};

// Send message (real-time fixed)
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
        // Fetch only what we need: membership check + current unreadCounts + members list
        const chat = await Chat.findOne(
            { _id: chatId, members: req.user._id },
            { members: 1, unreadCounts: 1 }
        ).lean();
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found or access denied' });
        }

        // Save message and fetch sender info in parallel
        const [message, senderDoc] = await Promise.all([
            Message.create({
                chatId,
                sender: req.user._id,
                content: sanitizedContent,
                fileUrl,
                contentType,
                fileName,
                replyTo: replyTo || null,
            }),
            User.findById(req.user._id)
                .select('firstName lastName otherName avatar')
                .lean(),
        ]);

        // Fire-and-forget lastActive update — does not block response
        User.updateOne({ _id: req.user._id }, { $set: { lastActive: new Date() } }).catch(() => {});

        // Build the populated message object from data we already have — no extra DB read
        const populatedMessage = {
            _id: message._id,
            chatId: message.chatId,
            sender: senderDoc,
            content: message.content,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            contentType: message.contentType,
            isDeleted: false,
            isEdited: false,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        };

        // Build atomic $set for unread increments — one DB write instead of full document save
        const unreadIncrements = {};
        const now = Date.now();

        chat.members.forEach((memberId) => {
            const mid = memberId.toString();
            if (mid !== req.user._id.toString()) {
                const currentCount = (chat.unreadCounts && chat.unreadCounts[mid]) || 0;
                const newCount = currentCount + 1;
                unreadIncrements[`unreadCounts.${mid}`] = newCount;
                req.io.to(`user:${mid}`).emit('unreadUpdate', {
                    chatId,
                    count: newCount,
                    message: populatedMessage,
                });
            }
        });

        // Single atomic update: bump updatedAt + all unread counters at once
        Chat.findByIdAndUpdate(chatId, {
            $set: { updatedAt: now, ...unreadIncrements },
        }).catch((err) => console.error('Chat update error:', err.message));

        // Broadcast to everyone in the chat room
        req.io.to(chatId.toString()).emit('message', populatedMessage);

        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Error sending message:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

// Mark chat as read — resets unread count for the calling user
export const markChatRead = async (req, res) => {
    const { chatId } = req.params;
    if (!mongoose.isValidObjectId(chatId)) {
        return res.status(400).json({ success: false, message: 'Invalid chat ID' });
    }
    try {
        // Atomic update — no need to load the whole document
        const result = await Chat.findOneAndUpdate(
            { _id: chatId, members: req.user._id },
            { $set: { [`unreadCounts.${req.user._id.toString()}`]: 0 } },
            { new: false, projection: { _id: 1 } }
        );
        if (!result) {
            return res.status(404).json({ success: false, message: 'Chat not found or access denied' });
        }
        res.json({ success: true, chatId, count: 0 });
    } catch (error) {
        console.error('Error marking chat as read:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to mark chat as read' });
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
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
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
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
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

// Fetch chat timestamps — single aggregate, no sub-queries
export const getChatTimestamps = async (req, res) => {
    try {
        // Get all chats in one query, then aggregate messages in one pipeline
        const userChats = await Chat.find({ members: req.user._id }).select('_id updatedAt').lean();
        const chatIds = userChats.map((c) => c._id);

        const lastMsgAgg = await Message.aggregate([
            { $match: { chatId: { $in: chatIds } } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$chatId', createdAt: { $first: '$createdAt' } } },
        ]);

        const hasMsgSet = new Set(lastMsgAgg.map((m) => m._id.toString()));
        const timestamps = {};

        // Only record timestamps for chats that have actual messages.
        // No updatedAt fallback — that causes empty chats to show fake recent times.
        lastMsgAgg.forEach((m) => { timestamps[m._id.toString()] = m.createdAt.toISOString(); });

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

// Get all unread counts for the current user (one map of chatId -> count)
export const getAllUnreadCounts = async (req, res) => {
    try {
        const chats = await Chat.find({ members: req.user._id })
            .select('_id unreadCounts')
            .lean();
        const counts = {};
        chats.forEach((chat) => {
            const count = chat.unreadCounts
                ? (chat.unreadCounts[req.user._id.toString()] ?? 0)
                : 0;
            if (count > 0) counts[chat._id.toString()] = count;
        });
        res.json({ success: true, counts });
    } catch (error) {
        console.error('Error fetching all unread counts:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to fetch unread counts' });
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
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
        if (!message.readBy.some((rb) => rb.userId.toString() === req.user._id.toString())) {
            message.readBy.push({ userId: req.user._id, timestamp: new Date() });
            await message.save();
        }
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName otherName avatar')
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
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
        if (message.isDeleted) return res.status(400).json({ success: false, message: 'Cannot react to deleted message' });
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
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
        message.reactions = message.reactions.filter(r => r.userId.toString() !== req.user._id.toString());
        await message.save();
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName otherName avatar')
            .lean();
        req.io.to(message.chatId.toString()).emit('messageUpdated', populatedMessage);
        res.json({ success: true, message: populatedMessage });
    } catch (error) {
        console.error('Error removing reaction:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to remove reaction' });
    }
};


// Get a map of {userId -> chatId} for all individual chats the caller is in.
// Eliminates the N+1 POST /individual calls on the frontend.
export const getUserChatMap = async (req, res) => {
    try {
        const chats = await Chat.find({
            type: 'individual',
            members: req.user._id,
        }).select('_id members').lean();

        const map = {};
        chats.forEach((chat) => {
            const otherId = chat.members.find(
                (m) => m.toString() !== req.user._id.toString()
            );
            if (otherId) map[otherId.toString()] = chat._id.toString();
        });

        res.json({ success: true, map });
    } catch (error) {
        console.error('Error fetching user chat map:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to fetch user chat map' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/chats/init  —  Single endpoint that replaces 5+ separate calls.
// Returns: users, groups (with unread), individual chat map, last messages
// per chat, timestamps, and unread counts — all in one round trip.
// ─────────────────────────────────────────────────────────────────────────────
export const getInitialData = async (req, res) => {
    try {
        const userId = req.user._id;

        // ── 1. Parallel: all users + all chats the caller belongs to ──────────
        const [allUsers, allChats] = await Promise.all([
            User.find({ _id: { $ne: userId } })
                .select('firstName lastName otherName avatar online lastActive')
                .lean(),
            Chat.find({ members: userId })
                .select('_id type name avatar adminId members updatedAt unreadCounts')
                .populate('members', 'firstName lastName otherName avatar online lastActive')
                .populate('adminId', 'firstName lastName')
                .lean(),
        ]);

        const chatIds = allChats.map((c) => c._id);

        // ── 2. One aggregate: last message per chat (content + sender) ────────
        const lastMessageDocs = await Message.aggregate([
            { $match: { chatId: { $in: chatIds } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$chatId',
                    messageId: { $first: '$_id' },
                    content: { $first: '$content' },
                    contentType: { $first: '$contentType' },
                    fileUrl: { $first: '$fileUrl' },
                    isDeleted: { $first: '$isDeleted' },
                    createdAt: { $first: '$createdAt' },
                    senderId: { $first: '$sender' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'senderId',
                    foreignField: '_id',
                    as: 'senderArr',
                    pipeline: [{ $project: { firstName: 1, lastName: 1, otherName: 1, avatar: 1 } }],
                },
            },
            { $addFields: { sender: { $arrayElemAt: ['$senderArr', 0] } } },
            { $project: { senderArr: 0 } },
        ]);

        // ── 3. Build response maps ─────────────────────────────────────────────
        const lastMsgMap = {};     // chatId -> last message object
        const timestampMap = {};   // chatId -> ISO string

        lastMessageDocs.forEach((doc) => {
            const cid = doc._id.toString();
            lastMsgMap[cid] = {
                _id: doc.messageId,
                chatId: doc._id,
                content: doc.content,
                contentType: doc.contentType,
                fileUrl: doc.fileUrl,
                isDeleted: doc.isDeleted,
                createdAt: doc.createdAt,
                sender: doc.sender,
            };
            timestampMap[cid] = doc.createdAt.toISOString();
        });

        // Do NOT fall back to chat.updatedAt for chats with no messages.
        // Using updatedAt causes chats to appear at the top of the list with a fake recent
        // timestamp even when no messages have been exchanged. The frontend sorts by
        // lastMessage presence, and we mirror that here for consistency.
        // (Groups/chats with no messages will sort alphabetically on the frontend.)

        // ── 4. Split chats into groups vs individual, build chat map ──────────
        const groups = [];
        const userChatMap = {};   // otherId -> chatId (for individual chats)
        const unreadCounts = {};  // chatId -> count

        allChats.forEach((chat) => {
            const cid = chat._id.toString();
            const myUnread = chat.unreadCounts
                ? (chat.unreadCounts[userId.toString()] ?? 0)
                : 0;
            if (myUnread > 0) unreadCounts[cid] = myUnread;

            if (chat.type === 'group') {
                groups.push({ ...chat, myUnreadCount: myUnread });
            } else {
                // individual — find the other member
                const other = chat.members.find(
                    (m) => m._id.toString() !== userId.toString()
                );
                if (other) userChatMap[other._id.toString()] = cid;
            }
        });

        res.json({
            success: true,
            users: allUsers,
            groups,
            userChatMap,
            lastMessages: lastMsgMap,
            timestamps: timestampMap,
            unreadCounts,
        });
    } catch (error) {
        console.error('Error in getInitialData:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Failed to load chat data' });
    }
};
export default {
    getUsers,
    createIndividualChat,
    getGroups,
    createGroup,
    addGroupMembers,
    getChatMessages,
    sendMessage,
    markChatRead,
    getAllUnreadCounts,
    editMessage,
    deleteMessage,
    uploadChatFile,
    getChatTimestamps,
    getUnreadTotal,
    markMessageRead,
    addReaction,
    removeReaction,
    getUserChatMap,
    getInitialData
};