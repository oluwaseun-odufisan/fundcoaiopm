import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import {
    getUserFiles,
    uploadFileForUsers,
    modifyUserFile,
    deleteUserFile,
    getUserStorageUsage,
} from '../controllers/adminFileController.js';
import {
    getUserFolders,
    createUserFolder,
    deleteUserFolder,
} from '../controllers/adminFolderController.js';
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

const fileRouter = express.Router();

// File routes
fileRouter.get('/users/:userId/files', adminAuthMiddleware, getUserFiles);
fileRouter.post('/users/upload', adminAuthMiddleware, upload.array('files'), uploadFileForUsers);
fileRouter.patch('/users/:userId/files/:fileId', adminAuthMiddleware, modifyUserFile);
fileRouter.patch('/users/:userId/files/:fileId/delete', adminAuthMiddleware, deleteUserFile);
fileRouter.delete('/users/:userId/files/:fileId', adminAuthMiddleware, deleteUserFile);
fileRouter.get('/users/:userId/storage', adminAuthMiddleware, getUserStorageUsage);

// Folder routes
fileRouter.get('/users/:userId/folders', adminAuthMiddleware, getUserFolders);
fileRouter.post('/users/:userId/folders', adminAuthMiddleware, createUserFolder);
fileRouter.delete('/users/:userId/folders/:folderId', adminAuthMiddleware, deleteUserFolder);

export default fileRouter;