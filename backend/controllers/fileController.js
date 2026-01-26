import File from '../models/fileModel.js';
import Folder from '../models/folderModel.js';
import Task from '../models/taskModel.js';
import { uploadFileToIPFS } from '../pinning/pinata.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import async from 'async'; // For concurrency control

const ALLOWED_TYPES = ['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png', 'mp4', 'webm', 'xls', 'xlsx'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const TOTAL_STORAGE = 2 * 1024 * 1024 * 1024; // 2GB
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your_jwt_secret_here';

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Admin token missing in request');
        return res.status(401).json({ success: false, message: 'Admin token missing' });
    }

    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, ADMIN_JWT_SECRET);
        console.log('Admin token verified successfully');
        next();
    } catch (err) {
        console.error('Invalid admin token:', err.message);
        return res.status(401).json({ success: false, message: 'Invalid admin token' });
    }
};

// Check storage usage before upload
const checkStorageUsage = async (userId, newFileSize) => {
    const files = await File.find({ owner: userId, deleted: false });
    const storageUsed = files.reduce((sum, file) => sum + (file.size || 0), 0);
    if (storageUsed + newFileSize > TOTAL_STORAGE) {
        throw new Error('Storage limit of 2GB exceeded');
    }
    return storageUsed;
};

// Upload files to IPFS and save metadata (for users)
export const pinFileToIPFS = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            console.log('Validation failed: No files uploaded');
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const { taskId, tags, folderId } = req.body;
        let taskTitle = null;

        // Validate taskId if provided
        if (taskId) {
            const task = await Task.findOne({ _id: taskId, owner: req.user._id });
            if (!task) {
                console.log('Validation failed: Task not found or not owned by user:', taskId);
                return res.status(404).json({ success: false, message: 'Task not found or not yours' });
            }
            taskTitle = task.title;
        }

        // Validate folderId if provided
        if (folderId) {
            const folder = await Folder.findOne({ _id: folderId, owner: req.user._id });
            if (!folder) {
                console.log('Validation failed: Folder not found or not owned by user:', folderId);
                return res.status(404).json({ success: false, message: 'Folder not found or not yours' });
            }
        }

        // Validate tags
        let tagArray = [];
        if (tags) {
            try {
                tagArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
                tagArray = tagArray.filter(tag => tag && tag.length <= 50 && /^[a-zA-Z0-9\-_]+$/.test(tag));
            } catch (err) {
                console.log('Validation failed: Invalid tags format:', tags);
                return res.status(400).json({ success: false, message: 'Invalid tags format' });
            }
        }

        console.log('Processing user upload:', {
            userId: req.user._id.toString(),
            files: req.files.map(f => ({ name: f.originalname, size: f.size })),
            taskId,
            tags,
            folderId,
        });

        // Check total storage
        const totalNewSize = req.files.reduce((sum, file) => sum + file.size, 0);
        await checkStorageUsage(req.user._id, totalNewSize);

        // Process files with concurrency limit
        const results = await async.mapLimit(req.files, 2, async (file) => {
            try {
                const fileType = file.originalname.split('.').pop().toLowerCase();
                if (!ALLOWED_TYPES.includes(fileType)) {
                    throw new Error(`Unsupported file type: ${file.originalname}`);
                }
                if (file.size > MAX_FILE_SIZE) {
                    throw new Error(`File ${file.originalname} exceeds 25MB limit`);
                }

                console.log(`Uploading file to Pinata: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);

                // Upload to Pinata
                const cid = await uploadFileToIPFS(file.buffer, file.originalname, file.mimetype);
                console.log(`Pinata upload successful for ${file.originalname}, CID: ${cid}`);

                // Check for existing file with same CID
                let existingFile = await File.findOne({ cid, owner: req.user._id, deleted: false });
                if (existingFile) {
                    console.log(`Duplicate CID found for ${file.originalname}, reusing existing file: ${existingFile._id}`);
                    const timestamp = Date.now();
                    const nameParts = file.originalname.split('.');
                    const extension = nameParts.pop();
                    const baseName = nameParts.join('.');
                    const newFileName = `${baseName}_${timestamp}.${extension}`;

                    const updatedFile = await File.findByIdAndUpdate(
                        existingFile._id,
                        {
                            fileName: newFileName,
                            taskId: taskId || existingFile.taskId,
                            taskTitle: taskTitle || existingFile.taskTitle,
                            folderId: folderId || existingFile.folderId,
                            tags: tagArray.length ? tagArray : existingFile.tags,
                            uploadedAt: new Date(),
                        },
                        { new: true }
                    );

                    // Update task with file reference
                    if (taskId && taskId !== existingFile.taskId) {
                        if (existingFile.taskId) {
                            await Task.findByIdAndUpdate(existingFile.taskId, { $pull: { files: existingFile._id } });
                        }
                        await Task.findByIdAndUpdate(taskId, { $addToSet: { files: updatedFile._id } });
                    }

                    return { success: true, file: updatedFile };
                }

                const newFile = new File({
                    fileName: file.originalname,
                    cid,
                    size: file.size,
                    type: fileType,
                    owner: req.user._id,
                    taskId: taskId || null,
                    taskTitle,
                    folderId: folderId || null,
                    tags: tagArray,
                });

                const savedFile = await newFile.save();

                // Update task with file reference
                if (taskId) {
                    await Task.findByIdAndUpdate(taskId, { $addToSet: { files: savedFile._id } });
                }

                return { success: true, file: savedFile };
            } catch (err) {
                console.error(`Error processing file ${file.originalname}:`, err.message, err.stack);
                return { success: false, fileName: file.originalname, error: err.message };
            }
        });

        // Separate successful and failed uploads
        const successfulFiles = results.filter(r => r.success).map(r => r.file);
        const failedFiles = results.filter(r => !r.success).map(r => ({ fileName: r.fileName, error: r.error }));

        console.log('User upload results:', {
            successful: successfulFiles.length,
            failed: failedFiles.length,
        });

        if (successfulFiles.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded successfully', errors: failedFiles });
        }

        res.status(201).json({
            success: true,
            files: successfulFiles,
            errors: failedFiles.length > 0 ? failedFiles : undefined,
        });
    } catch (err) {
        console.error('User upload error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: Upload files for a specific user
export const adminUploadFile = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            console.log('Validation failed: No files uploaded for admin upload');
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const { userId } = req.params;
        const { taskId, tags, folderId } = req.body;
        let taskTitle = null;

        console.log('Processing admin upload:', {
            userId,
            files: req.files.map(f => ({ name: f.originalname, size: f.size })),
            taskId,
            tags,
            folderId,
        });

        if (!mongoose.isValidObjectId(userId)) {
            console.log('Validation failed: Invalid user ID:', userId);
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        // Validate taskId if provided
        if (taskId) {
            const task = await Task.findOne({ _id: taskId, owner: userId });
            if (!task) {
                console.log('Validation failed: Task not found or not owned by user:', taskId);
                return res.status(404).json({ success: false, message: 'Task not found or not owned by user' });
            }
            taskTitle = task.title;
        }

        // Validate folderId if provided
        if (folderId) {
            const folder = await Folder.findOne({ _id: folderId, owner: userId });
            if (!folder) {
                console.log('Validation failed: Folder not found or not owned by user:', folderId);
                return res.status(404).json({ success: false, message: 'Folder not found or not owned by user' });
            }
        }

        // Validate tags
        let tagArray = [];
        if (tags) {
            try {
                tagArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
                tagArray = tagArray.filter(tag => tag && tag.length <= 50 && /^[a-zA-Z0-9\-_]+$/.test(tag));
            } catch (err) {
                console.log('Validation failed: Invalid tags format:', tags);
                return res.status(400).json({ success: false, message: 'Invalid tags format' });
            }
        }

        // Check total storage
        const totalNewSize = req.files.reduce((sum, file) => sum + file.size, 0);
        await checkStorageUsage(userId, totalNewSize);

        // Process files with concurrency limit
        const results = await async.mapLimit(req.files, 2, async (file) => {
            try {
                const fileType = file.originalname.split('.').pop().toLowerCase();
                if (!ALLOWED_TYPES.includes(fileType)) {
                    throw new Error(`Unsupported file type: ${file.originalname}`);
                }
                if (file.size > MAX_FILE_SIZE) {
                    throw new Error(`File ${file.originalname} exceeds 25MB limit`);
                }

                console.log(`Uploading file to Pinata: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);

                // Upload to Pinata
                const cid = await uploadFileToIPFS(file.buffer, file.originalname, file.mimetype);
                console.log(`Pinata upload successful for ${file.originalname}, CID: ${cid}`);

                // Check for existing file with same CID
                let existingFile = await File.findOne({ cid, owner: userId, deleted: false });
                if (existingFile) {
                    console.log(`Duplicate CID found for ${file.originalname}, reusing existing file: ${existingFile._id}`);
                    const timestamp = Date.now();
                    const nameParts = file.originalname.split('.');
                    const extension = nameParts.pop();
                    const baseName = nameParts.join('.');
                    const newFileName = `${baseName}_${timestamp}.${extension}`;

                    const updatedFile = await File.findByIdAndUpdate(
                        existingFile._id,
                        {
                            fileName: newFileName,
                            taskId: taskId || existingFile.taskId,
                            taskTitle: taskTitle || existingFile.taskTitle,
                            folderId: folderId || existingFile.folderId,
                            tags: tagArray.length ? tagArray : existingFile.tags,
                            uploadedAt: new Date(),
                        },
                        { new: true }
                    );

                    // Update task with file reference
                    if (taskId && taskId !== existingFile.taskId) {
                        if (existingFile.taskId) {
                            await Task.findByIdAndUpdate(existingFile.taskId, { $pull: { files: existingFile._id } });
                        }
                        await Task.findByIdAndUpdate(taskId, { $addToSet: { files: updatedFile._id } });
                    }

                    return { success: true, file: updatedFile };
                }

                const newFile = new File({
                    fileName: file.originalname,
                    cid,
                    size: file.size,
                    type: fileType,
                    owner: userId,
                    taskId: taskId || null,
                    taskTitle,
                    folderId: folderId || null,
                    tags: tagArray,
                });

                const savedFile = await newFile.save();

                // Update task with file reference
                if (taskId) {
                    await Task.findByIdAndUpdate(taskId, { $addToSet: { files: savedFile._id } });
                }

                return { success: true, file: savedFile };
            } catch (err) {
                console.error(`Error processing file ${file.originalname}:`, err.message, err.stack);
                return { success: false, fileName: file.originalname, error: err.message };
            }
        });

        const successfulFiles = results.filter(r => r.success).map(r => r.file);
        const failedFiles = results.filter(r => !r.success).map(r => ({ fileName: r.fileName, error: r.error }));

        console.log('Admin upload results:', {
            successful: successfulFiles.length,
            failed: failedFiles.length,
        });

        if (successfulFiles.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded successfully', errors: failedFiles });
        }

        res.status(201).json({
            success: true,
            files: successfulFiles,
            errors: failedFiles.length > 0 ? failedFiles : undefined,
        });
    } catch (err) {
        console.error('Admin upload error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get files with pagination and filtering
export const getFiles = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, type, taskId, tags, trashed, folderId } = req.query;
        const query = { owner: req.user._id };

        if (trashed === 'true') {
            query.deleted = true;
        } else {
            query.deleted = false;
        }

        if (search) {
            query.$or = [
                { fileName: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        if (type && type !== 'all') {
            query.type = type;
        }

        if (taskId && taskId !== 'all') {
            query.taskId = taskId;
        }

        if (tags) {
            const tagArray = JSON.parse(tags);
            query.tags = { $all: tagArray };
        }

        if (folderId) {
            query.folderId = folderId;
        } else {
            query.folderId = null;
        }

        const files = await File.find(query)
            .sort({ uploadedAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();

        const total = await File.countDocuments(query);
        const hasMore = total > page * limit;

        res.json({ success: true, files, hasMore });
    } catch (err) {
        console.error('Fetch files error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: Get files for a specific user
export const getUserFiles = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10, search, type, taskId, tags, trashed, folderId } = req.query;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const query = { owner: userId };

        if (trashed === 'true') {
            query.deleted = true;
        } else {
            query.deleted = false;
        }

        if (search) {
            query.$or = [
                { fileName: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        if (type && type !== 'all') {
            query.type = type;
        }

        if (taskId && taskId !== 'all') {
            query.taskId = taskId;
        }

        if (tags) {
            const tagArray = JSON.parse(tags);
            query.tags = { $all: tagArray };
        }

        if (folderId) {
            query.folderId = folderId;
        } else {
            query.folderId = null;
        }

        const files = await File.find(query)
            .sort({ uploadedAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();

        const total = await File.countDocuments(query);
        const hasMore = total > page * limit;

        res.json({ success: true, files, hasMore });
    } catch (err) {
        console.error('Fetch user files error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Soft delete file
export const deleteFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        if (!mongoose.isValidObjectId(fileId)) {
            console.log('Validation failed: Invalid file ID:', fileId);
            return res.status(400).json({ success: false, message: 'Invalid file ID' });
        }

        const file = await File.findOneAndUpdate(
            { _id: fileId, owner: req.user._id, deleted: false },
            { deleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!file) {
            console.log('Delete failed: File not found or not owned by user:', fileId);
            return res.status(404).json({ success: false, message: 'File not found or not yours' });
        }

        console.log(`File soft deleted: ${fileId} for user ${req.user._id}`);
        res.json({ success: true, message: 'File moved to trash' });
    } catch (err) {
        console.error('Delete file error:', err.message, err.stack);
        res.status(500).json({ success: false, message: 'Failed to delete file' });
    }
};

// Admin: Soft delete file for a user
export const adminDeleteFile = async (req, res) => {
    try {
        const { userId, fileId } = req.params;

        if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(fileId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID or file ID' });
        }

        const file = await File.findOneAndUpdate(
            { _id: fileId, owner: userId, deleted: false },
            { deleted: true, deletedAt: new Date() },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not owned by user' });
        }

        res.json({ success: true, message: 'File moved to trash' });
    } catch (err) {
        console.error('Admin delete file error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Permanently delete file
export const permanentDeleteFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        if (!mongoose.isValidObjectId(fileId)) {
            return res.status(400).json({ success: false, message: 'Invalid file ID' });
        }

        const file = await File.findOneAndDelete({ _id: fileId, owner: req.user._id });

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not yours' });
        }

        // Remove file reference from task
        if (file.taskId) {
            await Task.findByIdAndUpdate(file.taskId, { $pull: { files: file._id } });
        }

        res.json({ success: true, message: 'File permanently deleted' });
    } catch (err) {
        console.error('Permanent delete file error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: Permanently delete file for a user
export const adminPermanentDeleteFile = async (req, res) => {
    try {
        const { userId, fileId } = req.params;

        if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(fileId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID or file ID' });
        }

        const file = await File.findOneAndDelete({ _id: fileId, owner: userId });

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not owned by user' });
        }

        if (file.taskId) {
            await Task.findByIdAndUpdate(file.taskId, { $pull: { files: file._id } });
        }

        res.json({ success: true, message: 'File permanently deleted' });
    } catch (err) {
        console.error('Admin permanent delete file error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Restore file from trash
export const restoreFile = async (req, res) => {
    try {
        const file = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id, deleted: true },
            { deleted: false, deletedAt: null },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not yours' });
        }

        res.json({ success: true, message: 'File restored' });
    } catch (err) {
        console.error('Restore file error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Clear all trashed files
export const clearTrash = async (req, res) => {
    try {
        const files = await File.find({ owner: req.user._id, deleted: true });

        await Promise.all(
            files.map(async (file) => {
                if (file.taskId) {
                    await Task.findByIdAndUpdate(file.taskId, { $pull: { files: file._id } });
                }
                await File.deleteOne({ _id: file._id });
            })
        );

        res.json({ success: true, message: 'Trash cleared' });
    } catch (err) {
        console.error('Clear trash error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Share file with expiration
export const shareFile = async (req, res) => {
    try {
        const { expiresInDays = 7 } = req.body;
        const file = await File.findOne({ _id: req.params.id, owner: req.user._id });

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not yours' });
        }

        const shareLink = `https://gateway.pinata.cloud/ipfs/${file.cid}`;
        const shareExpires = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

        const updatedFile = await File.findByIdAndUpdate(
            req.params.id,
            { shareLink, shareExpires },
            { new: true }
        );

        res.json({ success: true, shareLink, shareExpires });
    } catch (err) {
        console.error('Share file error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Associate file with task
export const associateTask = async (req, res) => {
    try {
        const { taskId } = req.body;
        let taskTitle = null;

        if (taskId) {
            const task = await Task.findOne({ _id: taskId, owner: req.user._id });
            if (!task) {
                return res.status(404).json({ success: false, message: 'Task not found or not yours' });
            }
            taskTitle = task.title;
        }

        const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not yours' });
        }

        // Remove file from previous task
        if (file.taskId) {
            await Task.findByIdAndUpdate(file.taskId, { $pull: { files: file._id } });
        }

        // Update file with new task
        const updatedFile = await File.findByIdAndUpdate(
            req.params.id,
            { taskId: taskId || null, taskTitle },
            { new: true }
        );

        // Add file to new task
        if (taskId) {
            await Task.findByIdAndUpdate(taskId, { $addToSet: { files: file._id } });
        }

        res.json({ success: true, taskId: updatedFile.taskId, taskTitle: updatedFile.taskTitle });
    } catch (err) {
        console.error('Associate task error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Add or update tags
export const updateTags = async (req, res) => {
    try {
        const { tag } = req.body;
        if (!tag || !/^[a-zA-Z0-9\-_]+$/.test(tag) || tag.length > 50) {
            return res.status(400).json({ success: false, message: 'Invalid tag' });
        }

        const file = await File.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            { $addToSet: { tags: tag } },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not yours' });
        }

        res.json({ success: true, tags: file.tags });
    } catch (err) {
        console.error('Update tags error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Move files to a folder
export const moveFiles = async (req, res) => {
    try {
        const { fileIds, folderId } = req.body;

        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No files selected to move' });
        }

        // Validate folderId if provided
        if (folderId) {
            const folder = await Folder.findOne({ _id: folderId, owner: req.user._id });
            if (!folder) {
                return res.status(404).json({ success: false, message: 'Folder not found or not yours' });
            }
        }

        // Validate files
        const files = await File.find({
            _id: { $in: fileIds },
            owner: req.user._id,
            deleted: false,
        });

        if (files.length !== fileIds.length) {
            return res.status(404).json({ success: false, message: 'Some files not found or not yours' });
        }

        // Update folderId for all files
        await File.updateMany(
            { _id: { $in: fileIds }, owner: req.user._id },
            { folderId: folderId || null }
        );

        res.json({ success: true, message: 'Files moved successfully' });
    } catch (err) {
        console.error('Move files error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: Modify a user's file
export const adminModifyFile = async (req, res) => {
    try {
        const { userId, fileId } = req.params;
        const { fileName, taskId, tags, folderId } = req.body;

        if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(fileId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID or file ID' });
        }

        const file = await File.findOne({ _id: fileId, owner: userId });
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found or not owned by user' });
        }

        let taskTitle = null;
        if (taskId) {
            const task = await Task.findOne({ _id: taskId, owner: userId });
            if (!task) {
                return res.status(404).json({ success: false, message: 'Task not found or not owned by user' });
            }
            taskTitle = task.title;
        }

        if (folderId) {
            const folder = await Folder.findOne({ _id: folderId, owner: userId });
            if (!folder) {
                return res.status(404).json({ success: false, message: 'Folder not found or not owned by user' });
            }
        }

        const tagArray = tags ? tags.filter(tag => tag && tag.length <= 50 && /^[a-zA-Z0-9\-_]+$/.test(tag)) : file.tags;

        const updatedFile = await File.findByIdAndUpdate(
            fileId,
            {
                fileName: fileName || file.fileName,
                taskId: taskId || file.taskId,
                taskTitle,
                folderId: folderId || file.folderId,
                tags: tagArray,
            },
            { new: true }
        );

        if (taskId && taskId !== file.taskId) {
            if (file.taskId) {
                await Task.findByIdAndUpdate(file.taskId, { $pull: { files: fileId } });
            }
            await Task.findByIdAndUpdate(taskId, { $addToSet: { files: fileId } });
        }

        res.json({ success: true, file: updatedFile });
    } catch (err) {
        console.error('Admin modify file error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: Get storage usage for a user
export const getUserStorageUsage = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const files = await File.find({ owner: userId, deleted: false });
        const storageUsed = files.reduce((sum, file) => sum + (file.size || 0), 0);

        res.json({ success: true, storageUsed, totalStorage: TOTAL_STORAGE });
    } catch (err) {
        console.error('Get storage usage error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};