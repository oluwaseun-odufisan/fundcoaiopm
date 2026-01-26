import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import mongoose from 'mongoose';
import async from 'async'; // For retry logic

const USER_API_URL = process.env.USER_API_URL || 'http://localhost:4001';
const USER_API_TOKEN = process.env.USER_API_TOKEN;

if (!USER_API_TOKEN) {
    throw new Error('USER_API_TOKEN is not defined in environment variables');
}

// Configure multer for in-memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// Helper to make authenticated API calls to user backend with retries
const makeUserApiCall = async (method, endpoint, data = {}, headers = {}, retries = 2) => {
    try {
        console.log(`Making API call: ${method} ${USER_API_URL}/api/files${endpoint}`);
        const response = await axios({
            method,
            url: `${USER_API_URL}/api/files${endpoint}`,
            data,
            headers: {
                Authorization: `Bearer ${USER_API_TOKEN}`,
                ...headers,
            },
            timeout: 60000, // Increased timeout
        });
        return response.data;
    } catch (err) {
        console.error(`Error calling user API (${method} ${endpoint}, retries left: ${retries}):`, err.message, err.response?.data);
        if (retries > 0 && (err.response?.status === 429 || err.code === 'ECONNABORTED')) {
            const delay = 2000 * (3 - retries);
            console.log(`Retrying API call after ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return makeUserApiCall(method, endpoint, data, headers, retries - 1);
        }
        throw new Error(err.response?.data?.message || 'Failed to communicate with user backend');
    }
};

// Get all files for a specific user
export const getUserFiles = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userId } = req.params;
        const { page = 1, limit = 10, search, type, taskId, tags, trashed, folderId } = req.query;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const params = { page, limit, search, type, taskId, tags, trashed, folderId };
        const response = await makeUserApiCall('get', `/admin/user/${userId}`, null, { params });

        res.json({ success: true, files: response.files, hasMore: response.hasMore });
    } catch (err) {
        console.error('Error fetching user files:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Upload files for a specific user or multiple users
export const uploadFileForUsers = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            console.log('Access denied: Admin role is', req.admin.role);
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userIds, taskId, tags, folderId } = req.body;
        const files = req.files;

        console.log('Admin upload request received:', {
            userIdsRaw: userIds,
            files: files ? files.map(f => ({ name: f.originalname, size: f.size })) : 'No files',
            taskId,
            tags,
            folderId,
        });

        if (!userIds) {
            console.log('Validation failed: userIds is missing');
            return res.status(400).json({ success: false, message: 'userIds is required' });
        }

        let parsedUserIds;
        try {
            parsedUserIds = typeof userIds === 'string' ? JSON.parse(userIds) : userIds;
            if (!Array.isArray(parsedUserIds) || parsedUserIds.length === 0) {
                console.log('Validation failed: userIds is not a non-empty array', parsedUserIds);
                return res.status(400).json({ success: false, message: 'At least one user ID is required' });
            }
        } catch (err) {
            console.log('Validation failed: Invalid userIds format', userIds, err.message);
            return res.status(400).json({ success: false, message: 'Invalid userIds format' });
        }

        if (!files || files.length === 0) {
            console.log('Validation failed: No files uploaded');
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        // Validate user IDs
        for (const userId of parsedUserIds) {
            if (!mongoose.isValidObjectId(userId)) {
                console.log(`Validation failed: Invalid user ID: ${userId}`);
                return res.status(400).json({ success: false, message: `Invalid user ID: ${userId}` });
            }
        }

        // Process uploads with concurrency limit
        const results = await async.mapLimit(parsedUserIds, 2, async (userId) => {
            try {
                const formData = new FormData();
                files.forEach((file) => {
                    formData.append('files', file.buffer, {
                        filename: file.originalname,
                        contentType: file.mimetype,
                    });
                });
                if (taskId) formData.append('taskId', taskId);
                if (tags) {
                    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
                    formData.append('tags', JSON.stringify(parsedTags));
                }
                if (folderId) formData.append('folderId', folderId);

                console.log(`Forwarding upload to user backend for user ${userId}:`, {
                    files: files.map(f => f.originalname),
                    taskId,
                    tags,
                    folderId,
                });

                const response = await makeUserApiCall('post', `/admin/upload/${userId}`, formData, {
                    headers: formData.getHeaders(),
                });

                return { userId, files: response.files || [], errors: response.errors || [] };
            } catch (err) {
                console.error(`Upload failed for user ${userId}:`, err.message, err.stack);
                return { userId, files: [], errors: [{ error: err.message }] };
            }
        });

        console.log('Admin upload results:', results);

        const allSuccessful = results.every(r => r.files.length > 0 && r.errors.length === 0);
        if (!allSuccessful) {
            return res.status(400).json({
                success: false,
                message: 'Some or all uploads failed',
                results,
            });
        }

        res.status(201).json({ success: true, results });
    } catch (err) {
        console.error('Admin upload error:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Modify a user's file
export const modifyUserFile = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userId, fileId } = req.params;
        const { fileName, taskId, tags, folderId } = req.body;

        if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(fileId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID or file ID' });
        }

        const response = await makeUserApiCall('patch', `/admin/user/${userId}/file/${fileId}`, {
            fileName,
            taskId,
            tags,
            folderId,
        });

        res.json({ success: true, file: response.file });
    } catch (err) {
        console.error('Error modifying user file:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete a user's file
export const deleteUserFile = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userId, fileId } = req.params;
        const { permanent } = req.query;

        if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(fileId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID or file ID' });
        }

        const endpoint = permanent === 'true' ? `/admin/user/${userId}/file/${fileId}` : `/admin/user/${userId}/file/${fileId}/delete`;
        const method = permanent === 'true' ? 'delete' : 'patch';

        const response = await makeUserApiCall(method, endpoint);

        res.json({ success: true, message: response.message });
    } catch (err) {
        console.error('Error deleting user file:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get storage usage for a user
export const getUserStorageUsage = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const response = await makeUserApiCall('get', `/admin/storage/${userId}`);

        res.json({ success: true, storageUsed: response.storageUsed, totalStorage: response.totalStorage });
    } catch (err) {
        console.error('Error fetching storage usage:', err.message, err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
};