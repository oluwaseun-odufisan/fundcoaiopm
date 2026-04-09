import mongoose from 'mongoose';
import axios from 'axios';
import Room from '../models/roomModel.js';
import User from '../models/userModel.js';

const emitEvent = async (event, data) => {
    try {
        await axios.post(`${process.env.USER_API_URL}/api/emit`, { event, data });
    } catch (_) {}
};

// ── GET ALL ROOMS ─────────────────────────────────────────────────────────────
// Executive/Super-admin: all rooms
// Team-lead: rooms where at least one participant/host is from their sector
export const getAllRooms = async (req, res) => {
    try {
        const { status, type, hostEmail, search, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (type)   query.type   = type;

        if (req.admin.role === 'team-lead') {
            if (!req.admin.managedSector) {
                return res.status(403).json({ success: false, message: 'No managed sector assigned' });
            }
            const sectorUsers = await User.find({ unitSector: req.admin.managedSector }).select('_id');
            const ids = sectorUsers.map(u => u._id);
            query.$or = [
                { host: { $in: ids } },
                { 'participants.userId': { $in: ids } },
            ];
        }

        if (hostEmail) {
            const host = await User.findOne({ email: hostEmail });
            if (!host) return res.status(404).json({ success: false, message: 'Host not found' });
            query.host = host._id;
        }

        if (search) query.name = { $regex: search, $options: 'i' };

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await Room.countDocuments(query);

        const rooms = await Room.find(query)
            .populate('host',               'firstName lastName email unitSector')
            .populate('participants.userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            rooms,
            pagination: {
                total,
                page:       parseInt(page),
                limit:      parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('Get all rooms error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET SINGLE ROOM ───────────────────────────────────────────────────────────
export const getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('host',               'firstName lastName email unitSector')
            .populate('participants.userId', 'firstName lastName email unitSector')
            .populate('invitedUsers',        'firstName lastName email');

        if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

        res.json({ success: true, room });
    } catch (err) {
        console.error('Get room by id error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── FORCE END A ROOM (super-admin only) ───────────────────────────────────────
export const forceEndRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

        if (room.status === 'ended') {
            return res.status(400).json({ success: false, message: 'Room is already ended' });
        }

        room.status  = 'ended';
        room.endedAt = new Date();
        room.participants.forEach(p => {
            if (p.isActive) { p.isActive = false; p.leftAt = new Date(); }
        });
        await room.save();

        await emitEvent('roomEnded', {
            roomId:  room.roomId,
            endedBy: `${req.admin.firstName} ${req.admin.lastName} (Admin)`,
        });

        res.json({ success: true, message: 'Room force-ended by admin' });
    } catch (err) {
        console.error('Force end room error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── DELETE ROOM RECORD (super-admin only) ─────────────────────────────────────
export const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
        res.json({ success: true, message: 'Room record deleted' });
    } catch (err) {
        console.error('Delete room error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── ROOM STATS ────────────────────────────────────────────────────────────────
export const getRoomStats = async (req, res) => {
    try {
        let scopeQuery = {};
        if (req.admin.role === 'team-lead') {
            if (!req.admin.managedSector) {
                return res.status(403).json({ success: false, message: 'No managed sector assigned' });
            }
            const sectorUsers = await User.find({ unitSector: req.admin.managedSector }).select('_id');
            const ids = sectorUsers.map(u => u._id);
            scopeQuery.$or = [{ host: { $in: ids } }, { 'participants.userId': { $in: ids } }];
        }

        const [total, active, waiting, ended, instant, scheduled] = await Promise.all([
            Room.countDocuments(scopeQuery),
            Room.countDocuments({ ...scopeQuery, status: 'active' }),
            Room.countDocuments({ ...scopeQuery, status: 'waiting' }),
            Room.countDocuments({ ...scopeQuery, status: 'ended' }),
            Room.countDocuments({ ...scopeQuery, type: 'instant' }),
            Room.countDocuments({ ...scopeQuery, type: 'scheduled' }),
        ]);

        res.json({ success: true, stats: { total, active, waiting, ended, instant, scheduled } });
    } catch (err) {
        console.error('Room stats error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};