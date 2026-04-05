// socket/roomSignaling.js
// WebRTC Signaling via Socket.IO - No external APIs needed
// Uses STUN servers (free, from Google/Cloudflare) for NAT traversal
import Room from '../models/roomModel.js';
import User from '../models/userModel.js';

export const setupRoomSignaling = (io) => {
    // Namespace for room signaling
    const roomNs = io.of('/room');

    // Auth middleware for namespace
    roomNs.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
            if (!token) return next(new Error('Auth token required'));
            const jwt = await import('jsonwebtoken');
            const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            const user = await User.findById(decoded.id).select('firstName lastName fullName avatar');
            if (!user) return next(new Error('User not found'));
            socket.user = { id: decoded.id, name: user.fullName || `${user.firstName} ${user.lastName}`, avatar: user.avatar };
            next();
        } catch (err) {
            next(new Error('Authentication failed'));
        }
    });

    // Track who is in which room: Map<roomId, Map<socketId, {userId, socketId, peerId}>>
    const roomPeers = new Map();
    // Track per-user socket: Map<userId, socketId>
    const userSockets = new Map();

    roomNs.on('connection', (socket) => {
        console.log(`🎥 Room socket connected: ${socket.id} | User: ${socket.userId}`);
        userSockets.set(socket.userId, socket.id);

        // ── Join a room ───────────────────────────────────────────────────
        socket.on('joinRoom', async ({ roomId, mediaState }) => {
            try {
                const room = await Room.findOne({ roomId });
                if (!room) {
                    socket.emit('joinError', { message: 'Room not found' });
                    return;
                }
                if (room.status === 'ended') {
                    socket.emit('joinError', { message: 'This room has ended' });
                    return;
                }
                if (room.isLocked) {
                    socket.emit('joinError', { message: 'Room is locked by the host' });
                    return;
                }

                // Max participants check
                const activePeers = roomPeers.get(roomId);
                const activeCount = activePeers ? activePeers.size : 0;
                if (activeCount >= room.maxParticipants) {
                    socket.emit('joinError', { message: `Room is full (max ${room.maxParticipants} participants)` });
                    return;
                }

                socket.join(roomId);
                socket.currentRoom = roomId;

                // Initialize room peer map
                if (!roomPeers.has(roomId)) roomPeers.set(roomId, new Map());
                const peers = roomPeers.get(roomId);

                // Add this peer
                const peerInfo = {
                    userId: socket.userId,
                    socketId: socket.id,
                    user: socket.user,
                    mediaState: mediaState || { audio: true, video: true, screen: false },
                    joinedAt: Date.now(),
                };
                peers.set(socket.id, peerInfo);

                // Send the list of existing peers to the newcomer
                const existingPeers = [];
                peers.forEach((peer, sid) => {
                    if (sid !== socket.id) {
                        existingPeers.push({ socketId: sid, user: peer.user, mediaState: peer.mediaState });
                    }
                });
                socket.emit('roomJoined', {
                    roomId,
                    existingPeers,
                    room: {
                        name: room.name,
                        settings: room.settings,
                        hostId: room.host.toString(),
                    },
                });

                // Notify others that a new peer joined
                socket.to(roomId).emit('peerJoined', {
                    socketId: socket.id,
                    user: socket.user,
                    mediaState: peerInfo.mediaState,
                });

                // Update DB participant record
                const existingParticipant = room.participants.find(
                    (p) => p.userId.toString() === socket.userId && !p.isActive
                );
                if (existingParticipant) {
                    existingParticipant.isActive = true;
                    existingParticipant.socketId = socket.id;
                    existingParticipant.joinedAt = new Date();
                    existingParticipant.leftAt = undefined;
                } else {
                    const isHost = room.host.toString() === socket.userId;
                    room.participants.push({
                        userId: socket.userId,
                        socketId: socket.id,
                        isActive: true,
                        role: isHost ? 'host' : 'participant',
                    });
                }

                if (room.status === 'waiting') {
                    room.status = 'active';
                    room.startedAt = new Date();
                }
                await room.save();

                // Emit system chat message
                const joinMsg = {
                    type: 'system',
                    message: `${socket.user.name} joined the room`,
                    timestamp: new Date(),
                };
                roomNs.to(roomId).emit('roomChatMessage', joinMsg);

                console.log(`✅ ${socket.user.name} joined room ${roomId}. Peers: ${peers.size}`);
            } catch (err) {
                console.error('Join room error:', err.message);
                socket.emit('joinError', { message: 'Failed to join room' });
            }
        });

        // ── WebRTC Offer (caller → callee) ────────────────────────────────
        socket.on('offer', ({ targetSocketId, offer, roomId }) => {
            socket.to(targetSocketId).emit('offer', {
                offer,
                fromSocketId: socket.id,
                fromUser: socket.user,
                roomId,
            });
        });

        // ── WebRTC Answer (callee → caller) ──────────────────────────────
        socket.on('answer', ({ targetSocketId, answer, roomId }) => {
            socket.to(targetSocketId).emit('answer', {
                answer,
                fromSocketId: socket.id,
                roomId,
            });
        });

        // ── ICE Candidates ────────────────────────────────────────────────
        socket.on('iceCandidate', ({ targetSocketId, candidate, roomId }) => {
            socket.to(targetSocketId).emit('iceCandidate', {
                candidate,
                fromSocketId: socket.id,
                roomId,
            });
        });

        // ── Media state change (mute/unmute/camera/screen) ────────────────
        socket.on('mediaStateChange', ({ roomId, mediaState }) => {
            const peers = roomPeers.get(roomId);
            if (peers?.has(socket.id)) {
                peers.get(socket.id).mediaState = mediaState;
            }
            socket.to(roomId).emit('peerMediaStateChange', {
                socketId: socket.id,
                mediaState,
            });
        });

        // ── In-room chat ──────────────────────────────────────────────────
        socket.on('roomChat', async ({ roomId, message }) => {
            if (!message?.trim()) return;
            const chatMsg = {
                sender: socket.userId,
                senderName: socket.user.name,
                senderAvatar: socket.user.avatar,
                message: message.trim(),
                timestamp: new Date(),
                type: 'text',
            };
            roomNs.to(roomId).emit('roomChatMessage', chatMsg);

            // Persist to DB (non-blocking)
            Room.findOne({ roomId }).then((room) => {
                if (room) {
                    room.chatMessages.push(chatMsg);
                    if (room.chatMessages.length > 500) room.chatMessages = room.chatMessages.slice(-500);
                    room.save().catch(console.error);
                }
            }).catch(console.error);
        });

        // ── Raise / lower hand ────────────────────────────────────────────
        socket.on('raiseHand', ({ roomId, raised }) => {
            socket.to(roomId).emit('peerHandRaise', {
                socketId: socket.id,
                user: socket.user,
                raised,
            });
        });

        // ── Reaction ──────────────────────────────────────────────────────
        socket.on('reaction', ({ roomId, emoji }) => {
            roomNs.to(roomId).emit('peerReaction', {
                socketId: socket.id,
                user: socket.user,
                emoji,
            });
        });

        // ── Screen share started/stopped ──────────────────────────────────
        socket.on('screenShareChange', ({ roomId, isSharing }) => {
            socket.to(roomId).emit('peerScreenShare', {
                socketId: socket.id,
                user: socket.user,
                isSharing,
            });
        });

        // ── Host controls ─────────────────────────────────────────────────
        socket.on('muteParticipant', async ({ roomId, targetSocketId }) => {
            // Verify host
            const room = await Room.findOne({ roomId });
            if (!room || room.host.toString() !== socket.userId) return;
            roomNs.to(targetSocketId).emit('forceMute', { by: socket.user });
        });

        socket.on('lockRoom', async ({ roomId, locked }) => {
            const room = await Room.findOne({ roomId });
            if (!room || room.host.toString() !== socket.userId) return;
            room.isLocked = locked;
            await room.save();
            roomNs.to(roomId).emit('roomLockChange', { locked, by: socket.user });
        });

        // ── Leave room ────────────────────────────────────────────────────
        socket.on('leaveRoom', ({ roomId }) => {
            handlePeerLeave(socket, roomId, roomPeers, roomNs);
        });

        // ── Disconnect ────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            userSockets.delete(socket.userId);
            if (socket.currentRoom) {
                handlePeerLeave(socket, socket.currentRoom, roomPeers, roomNs);
            }
            console.log(`❌ Room socket disconnected: ${socket.id}`);
        });
    });

    return roomNs;
};

// ── Helper: handle peer leaving ───────────────────────────────────────────────
async function handlePeerLeave(socket, roomId, roomPeers, roomNs) {
    const peers = roomPeers.get(roomId);
    if (peers) {
        peers.delete(socket.id);
        if (peers.size === 0) roomPeers.delete(roomId);
    }

    socket.leave(roomId);

    // Notify other peers
    socket.to(roomId).emit('peerLeft', {
        socketId: socket.id,
        user: socket.user,
    });

    // System message
    roomNs.to(roomId).emit('roomChatMessage', {
        type: 'system',
        message: `${socket.user?.name || 'A participant'} left the room`,
        timestamp: new Date(),
    });

    // Update DB
    try {
        const room = await Room.findOne({ roomId });
        if (room) {
            const participant = room.participants.find(
                (p) => p.socketId === socket.id && p.isActive
            );
            if (participant) {
                participant.isActive = false;
                participant.leftAt = new Date();
            }

            // If host left and room still has peers, optionally end it
            const activePeers = roomPeers.get(roomId);
            if (!activePeers || activePeers.size === 0) {
                room.status = 'ended';
                room.endedAt = new Date();
            }

            await room.save();
        }
    } catch (err) {
        console.error('Leave room DB update error:', err.message);
    }
}