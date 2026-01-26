import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
    pinFileToIPFS,
    getFiles,
    deleteFile,
    permanentDeleteFile,
    restoreFile,
    clearTrash,
    shareFile,
    associateTask,
    updateTags,
    moveFiles,
    adminUploadFile,
    getUserFiles,
    adminDeleteFile,
    adminPermanentDeleteFile,
    adminModifyFile,
    getUserStorageUsage,
} from '../controllers/fileController.js';
import {
    createFolder,
    getFolders,
    deleteFolder,
    adminCreateFolder,
    adminGetFolders,
    adminDeleteFolder,
} from '../controllers/folderController.js';
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

const fileRouter = express.Router();

// User routes
fileRouter.get('/', authMiddleware, getFiles);
fileRouter.post('/pinFileToIPFS', authMiddleware, upload.array('files'), pinFileToIPFS);
fileRouter.patch('/:id/delete', authMiddleware, deleteFile);
fileRouter.delete('/:id', authMiddleware, permanentDeleteFile);
fileRouter.patch('/:id/restore', authMiddleware, restoreFile);
fileRouter.delete('/trash/clear', authMiddleware, clearTrash);
fileRouter.post('/:id/share', authMiddleware, shareFile);
fileRouter.patch('/:id/task', authMiddleware, associateTask);
fileRouter.patch('/:id/tags', authMiddleware, updateTags);
fileRouter.patch('/move', authMiddleware, moveFiles);

fileRouter.get('/folders', authMiddleware, getFolders);
fileRouter.post('/folders', authMiddleware, createFolder);
fileRouter.delete('/folders/:id', authMiddleware, deleteFolder);

// Admin routes
fileRouter.post('/admin/upload/:userId', upload.array('files'), adminUploadFile);
fileRouter.get('/admin/user/:userId', getUserFiles);
fileRouter.patch('/admin/user/:userId/file/:fileId/delete', adminDeleteFile);
fileRouter.delete('/admin/user/:userId/file/:fileId', adminPermanentDeleteFile);
fileRouter.patch('/admin/user/:userId/file/:fileId', adminModifyFile);
fileRouter.get('/admin/storage/:userId', getUserStorageUsage);

fileRouter.post('/admin/user/:userId/folders', adminCreateFolder);
fileRouter.get('/admin/user/:userId/folders', adminGetFolders);
fileRouter.delete('/admin/user/:userId/folders/:folderId', adminDeleteFolder);

export default fileRouter;