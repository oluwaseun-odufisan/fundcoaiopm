import axios from 'axios';
import mongoose from 'mongoose';

const USER_API_URL = process.env.USER_API_URL || 'http://localhost:4001';
const USER_API_TOKEN = process.env.USER_API_TOKEN;

// Helper to make authenticated API calls to user backend
const makeUserApiCall = async (method, endpoint, data = {}, headers = {}) => {
    try {
        const response = await axios({
            method,
            url: `${USER_API_URL}/api/files${endpoint}`,
            data,
            headers: {
                Authorization: `Bearer ${USER_API_TOKEN}`,
                ...headers,
            },
        });
        return response.data;
    } catch (err) {
        console.error(`Error calling user API (${method} ${endpoint}):`, err.message);
        throw new Error(err.response?.data?.message || 'Failed to communicate with user backend');
    }
};

// Get folders for a specific user
export const getUserFolders = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userId } = req.params;
        const { parentId } = req.query;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const response = await makeUserApiCall('get', `/admin/user/${userId}/folders`, null, { params: { parentId } });

        res.json({ success: true, folders: response.folders });
    } catch (err) {
        console.error('Error fetching user folders:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Create a folder for a user
export const createUserFolder = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userId } = req.params;
        const { name, parentId } = req.body;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const response = await makeUserApiCall('post', `/admin/user/${userId}/folders`, { name, parentId });

        res.status(201).json({ success: true, folder: response.folder });
    } catch (err) {
        console.error('Error creating user folder:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete a user's folder
export const deleteUserFolder = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { userId, folderId } = req.params;

        if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(folderId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID or folder ID' });
        }

        const response = await makeUserApiCall('delete', `/admin/user/${userId}/folders/${folderId}`);

        res.json({ success: true, message: response.message });
    } catch (err) {
        console.error('Error deleting user folder:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};