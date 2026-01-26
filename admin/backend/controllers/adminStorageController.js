import StorageLimit from '../models/adminStorageLimitModel.js';

// Set storage limit for a user or globally
export const setStorageLimit = async (req, res) => {
    try {
        const { userId, limitBytes } = req.body;

        if (!limitBytes || limitBytes < 0) {
            return res.status(400).json({ success: false, message: 'Invalid storage limit' });
        }

        const filter = userId ? { userId } : { userId: null };
        const update = { limitBytes, updatedAt: Date.now() };
        const options = { upsert: true, new: true };

        const storageLimit = await StorageLimit.findOneAndUpdate(filter, update, options);

        res.json({
            success: true,
            storageLimit,
            message: userId ? 'User storage limit updated' : 'Global storage limit updated',
        });
    } catch (err) {
        console.error('Error setting storage limit:', err.message);
        res.status(500).json({ success: false, message: 'Failed to set storage limit' });
    }
};

// Get storage limit for a user or globally
export const getStorageLimit = async (req, res) => {
    try {
        const { userId } = req.query;
        const filter = userId ? { userId } : { userId: null };

        const storageLimit = await StorageLimit.findOne(filter);
        if (!storageLimit) {
            return res.status(404).json({ success: false, message: 'Storage limit not found' });
        }

        res.json({ success: true, storageLimit });
    } catch (err) {
        console.error('Error fetching storage limit:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch storage limit' });
    }
};

// Update storage usage (called after file operations)
export const updateStorageUsage = async (req, res) => {
    try {
        const { userId, usedBytes } = req.body;

        if (!userId || usedBytes < 0) {
            return res.status(400).json({ success: false, message: 'Invalid input' });
        }

        const storageLimit = await StorageLimit.findOneAndUpdate(
            { userId },
            { usedBytes, updatedAt: Date.now() },
            { new: true }
        );

        if (!storageLimit) {
            return res.status(404).json({ success: false, message: 'Storage limit not found for user' });
        }

        res.json({ success: true, storageLimit });
    } catch (err) {
        console.error('Error updating storage usage:', err.message);
        res.status(500).json({ success: false, message: 'Failed to update storage usage' });
    }
};