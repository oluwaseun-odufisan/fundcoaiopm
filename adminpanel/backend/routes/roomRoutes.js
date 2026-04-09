import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import { isSuperAdmin, isTeamLeadOrAbove } from '../middleware/rbac.js';
import {
    getAllRooms,
    getRoomById,
    forceEndRoom,
    deleteRoom,
    getRoomStats,
} from '../controllers/roomController.js';

const roomRouter = express.Router();
roomRouter.use(adminAuthMiddleware);

roomRouter.get ('/',          isTeamLeadOrAbove, getAllRooms);
roomRouter.get ('/stats',     isTeamLeadOrAbove, getRoomStats);
roomRouter.get ('/:id',       isTeamLeadOrAbove, getRoomById);
roomRouter.patch('/:id/end',  isSuperAdmin,       forceEndRoom);
roomRouter.delete('/:id',     isSuperAdmin,       deleteRoom);

export default roomRouter;