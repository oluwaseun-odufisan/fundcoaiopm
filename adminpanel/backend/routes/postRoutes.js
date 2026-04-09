// routes/postRoutes.js
import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import { isSuperAdmin, isTeamLeadOrAbove, isExecutiveOrAbove } from '../middleware/rbac.js';
import {
    getAllPosts,
    getPostById,
    createAnnouncement,
    toggleHidePost,
    togglePinPost,
    deletePost,
    deleteComment,
    getPostStats,
} from '../controllers/postController.js';

const postRouter = express.Router();
postRouter.use(adminAuthMiddleware);

postRouter.get ('/',                            isTeamLeadOrAbove,  getAllPosts);
postRouter.get ('/stats',                       isTeamLeadOrAbove,  getPostStats);
postRouter.get ('/:id',                         isTeamLeadOrAbove,  getPostById);

// Announcements: executive and above
postRouter.post('/announcements',               isExecutiveOrAbove, createAnnouncement);

// Moderation: team-lead and above (scope enforced in handler)
postRouter.patch('/:id/hide',                   isTeamLeadOrAbove,  toggleHidePost);

// Pin: executive and above
postRouter.patch('/:id/pin',                    isExecutiveOrAbove, togglePinPost);

// Delete post: super-admin only
postRouter.delete('/:id',                       isSuperAdmin,        deletePost);

// Delete comment: team-lead and above (scope enforced in handler)
postRouter.delete('/:postId/comments/:commentId', isTeamLeadOrAbove, deleteComment);

export default postRouter;