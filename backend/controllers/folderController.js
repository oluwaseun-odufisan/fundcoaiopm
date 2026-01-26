import Folder from '../models/folderModel.js';
import File from '../models/fileModel.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your_jwt_secret_here';

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Admin token missing' });
    }

    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, ADMIN_JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid admin token' });
    }
};

// Create a new folder
export const createFolder = async (req, res) => {
    try {
        const { name, parentId } = req.body;

        if (!name || name.length > 100 || !/^[a-zA-Z0-9._\-\s]+$/.test(name)) {
            return res.status(400).json({ success: false, message: 'Invalid folder name' });
        }

        if (parentId) {
            const parentFolder = await Folder.findOne({ _id: parentId, owner: req.user._id });
            if (!parentFolder) {
                return res.status(404).json({ success: false, message: 'Parent folder not found or not yours' });
            }
        }

        const folder = new Folder({
            name,
            parentId: parentId || null,
            owner: req.user._id,
        });

        const savedFolder = await folder.save();
        res.status(201).json({ success: true, folder: savedFolder });
    } catch (err) {
        console.error('Create folder error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: Create a folder for a user
export const adminCreateFolder = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, parentId } = req.body;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        if (!name || name.length > 100 || !/^[a-zA-Z0-9._\-\s]+$/.test(name)) {
            return res.status(400).json({ success: false, message: 'Invalid folder name' });
        }

        if (parentId) {
            const parentFolder = await Folder.findOne({ _id: parentId, owner: userId });
            if (!parentFolder) {
                return res.status(404).json({ success: false, message: 'Parent folder not found or not owned by user' });
            }
        }

        const folder = new Folder({
            name,
            parentId: parentId || null,
            owner: userId,
        });

        const savedFolder = await folder.save();
        res.status(201).json({ success: true, folder: savedFolder });
    } catch (err) {
        console.error('Admin create folder error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get folders
export const getFolders = async (req, res) => {
    try {
        const { parentId } = req.query;
        const query = { owner: req.user._id };

        if (parentId) {
            query.parentId = parentId;
        } else {
            query.parentId = null;
        }

        const folders = await Folder.find(query).sort({ createdAt: -1 }).lean();
        res.json({ success: true, folders });
    } catch (err) {
        console.error('Fetch folders error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: Get folders for a specific user
export const adminGetFolders = async (req, res) => {
    try {
        const { userId } = req.params;
        const { parentId } = req.query;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const query = { owner: userId };

        if (parentId) {
            query.parentId = parentId;
        } else {
            query.parentId = null;
        }

        const folders = await Folder.find(query).sort({ createdAt: -1 }).lean();
        res.json({ success: true, folders });
    } catch (err) {
        console.error('Admin fetch folders error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete folder
export const deleteFolder = async (req, res) => {
    try {
        const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
        if (!folder) {
            return res.status(404).json({ success: false, message: 'Folder not found or not yours' });
        }

        // Delete folder and all subfolders/files
        const deleteFolderAndContents = async (folderId) => {
            const subFolders = await Folder.find({ parentId: folderId });
            await Promise.all(subFolders.map((subFolder) => deleteFolderAndContents(subFolder._id)));

            await File.deleteMany({ folderId, owner: req.user._id });
            await Folder.deleteOne({ _id: folderId, owner: req.user._id });
        };

        await deleteFolderAndContents(folder._id);
        res.json({ success: true, message: 'Folder and contents deleted' });
    } catch (err) {
        console.error('Delete folder error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: Delete folder for a user
export const adminDeleteFolder = async (req, res) => {
    try {
        const { userId, folderId } = req.params;

        if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(folderId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID or folder ID' });
        }

        const folder = await Folder.findOne({ _id: folderId, owner: userId });
        if (!folder) {
            return res.status(404).json({ success: false, message: 'Folder not found or not owned by user' });
        }

        const deleteFolderAndContents = async (folderId) => {
            const subFolders = await Folder.find({ parentId: folderId });
            await Promise.all(subFolders.map((subFolder) => deleteFolderAndContents(subFolder._id)));

            await File.deleteMany({ folderId, owner: userId });
            await Folder.deleteOne({ _id: folderId, owner: userId });
        };

        await deleteFolderAndContents(folder._id);
        res.json({ success: true, message: 'Folder and contents deleted' });
    } catch (err) {
        console.error('Admin delete folder error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};