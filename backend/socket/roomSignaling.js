// socket/roomSignaling.js
// WebRTC Signaling via Socket.IO namespace /room
// FIX: chat now broadcasts to all including sender (roomNs.to not socket.to)
// FIX: media state stored correctly for each peer
import Room from '../models/roomModel.js';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

export const setupRoomSignaling = (io) => {
    const roomNs = io.of('/room');

    // ── Auth middleware ────────────────────────────────────────────────────────
    roomNs.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.split(' ')[1];
            if (!token) return next(new Error('Auth token required'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;

            const user = await User.findById(decoded.id).select('firstName lastName fullName avatar');
            if (!user) return next(new Error('User not found'));

            socket.user = {
                id: decoded.id,
                _id: decoded.id,
                name: user.fullName?.trim() || `${user.firstName} ${user.lastName}`.trim(),
                avatar: user.avatar || '',
            };
            next();
        } catch (err) {
            console.error('Room socket auth error:', err.message);
            next(new Error('Authentication failed'));
        }
    });

    // roomPeers: Map<roomId, Map<socketId, peerInfo>>
    const roomPeers = new Map();

    roomNs.on('connection', (socket) => {
        console.log(`🎥 Room socket connected: ${socket.id} | User: ${socket.user?.name}`);

        // ── Join room ──────────────────────────────────────────────────────
        socket.on('joinRoom', async ({ roomId, mediaState }) => {
            if (!roomId) {
                socket.emit('joinError', { message: 'Room ID is required' });
                return;
            }
            try {
                const room = await Room.findOne({ roomId });
                if (!room) {
                    socket.emit('joinError', { message: 'Room not found' });
                    return;
                }
                if (room.status === 'ended') {
                    socket.emit('joinError', { message: 'This meeting has ended' });
                    return;
                }
                if (room.isLocked) {
                    socket.emit('joinError', { message: 'This room is locked by the host' });
                    return;
                }

                // Max participants
                const roomMap = roomPeers.get(roomId);
                if (roomMap && roomMap.size >= room.maxParticipants) {
                    socket.emit('joinError', { message: `Room is full (max ${room.maxParticipants})` });
                    return;
                }

                // Join socket room
                socket.join(roomId);
                socket.currentRoom = roomId;

                // Track peer in memory
                if (!roomPeers.has(roomId)) roomPeers.set(roomId, new Map());
                const peers = roomPeers.get(roomId);

                const peerInfo = {
                    userId: socket.userId,
                    socketId: socket.id,
                    user: socket.user,
                    // Normalise to consistent shape
                    mediaState: {
                        audioOff: mediaState?.audioOff ?? false,
                        videoOff: mediaState?.videoOff ?? false,
                        screen: mediaState?.screen ?? false,
                    },
                    joinedAt: Date.now(),
                };
                peers.set(socket.id, peerInfo);

                // Build existing peers list for the newcomer
                const existingPeers = [];
                peers.forEach((peer, sid) => {
                    if (sid !== socket.id) {
                        existingPeers.push({
                            socketId: sid,
                            user: peer.user,
                            mediaState: peer.mediaState,
                        });
                    }
                });

                // Tell the new joiner who's already here
                socket.emit('roomJoined', {
                    roomId,
                    existingPeers,
                    room: {
                        name: room.name,
                        settings: room.settings,
                        hostId: room.host.toString(),
                        isLocked: room.isLocked,
                    },
                });

                // Tell everyone else a new peer arrived
                socket.to(roomId).emit('peerJoined', {
                    socketId: socket.id,
                    user: socket.user,
                    mediaState: peerInfo.mediaState,
                });

                // Update DB participant
                const existingParticipant = room.participants.find(
                    p => p.userId.toString() === socket.userId
                );
                if (existingParticipant) {
                    existingParticipant.isActive = true;
                    existingParticipant.socketId = socket.id;
                    existingParticipant.joinedAt = new Date();
                    existingParticipant.leftAt = undefined;
                } else {
                    room.participants.push({
                        userId: socket.userId,
                        socketId: socket.id,
                        isActive: true,
                        role: room.host.toString() === socket.userId ? 'host' : 'participant',
                    });
                }
                if (room.status === 'waiting') {
                    room.status = 'active';
                    room.startedAt = new Date();
                }
                await room.save();

                // Broadcast system join message to ALL in room (including new joiner)
                roomNs.to(roomId).emit('roomChatMessage', {
                    type: 'system',
                    message: `${socket.user.name} joined`,
                    timestamp: new Date().toISOString(),
                });

                console.log(`✅ ${socket.user.name} joined room ${roomId}. Peers in room: ${peers.size}`);
            } catch (err) {
                console.error('joinRoom error:', err.message);
                socket.emit('joinError', { message: 'Failed to join room. Please try again.' });
            }
        });

        // ── WebRTC: Offer ──────────────────────────────────────────────────
        // Relay offer from caller → callee
        socket.on('offer', ({ targetSocketId, offer, roomId }) => {
            if (!targetSocketId || !offer) return;
            socket.to(targetSocketId).emit('offer', {
                offer,
                fromSocketId: socket.id,
                fromUser: socket.user,
                roomId,
            });
        });

        // ── WebRTC: Answer ─────────────────────────────────────────────────
        // Relay answer from callee → caller
        socket.on('answer', ({ targetSocketId, answer, roomId }) => {
            if (!targetSocketId || !answer) return;
            socket.to(targetSocketId).emit('answer', {
                answer,
                fromSocketId: socket.id,
                roomId,
            });
        });

        // ── WebRTC: ICE Candidates ─────────────────────────────────────────
        socket.on('iceCandidate', ({ targetSocketId, candidate, roomId }) => {
            if (!targetSocketId || !candidate) return;
            socket.to(targetSocketId).emit('iceCandidate', {
                candidate,
                fromSocketId: socket.id,
                roomId,
            });
        });

        // ── Media state change ─────────────────────────────────────────────
        socket.on('mediaStateChange', ({ roomId, mediaState }) => {
            // Update in-memory peer info
            const peers = roomPeers.get(roomId);
            if (peers?.has(socket.id)) {
                peers.get(socket.id).mediaState = {
                    audioOff: mediaState?.audioOff ?? false,
                    videoOff: mediaState?.videoOff ?? false,
                    screen: mediaState?.screen ?? false,
                };
            }
            // Broadcast change to everyone else in the room
            socket.to(roomId).emit('peerMediaStateChange', {
                socketId: socket.id,
                mediaState,
            });
        });

        // ── In-room chat ───────────────────────────────────────────────────
        // CRITICAL FIX: use roomNs.to(roomId) not socket.to(roomId)
        // socket.to() excludes the sender — roomNs.to() sends to everyone including sender.
        // This ensures the sender's chat panel also receives the message instantly.
        socket.on('roomChat', async ({ roomId, message }) => {
            if (!message?.trim() || !roomId) return;

            const chatMsg = {
                sender: socket.userId,
                senderName: socket.user.name,
                message: message.trim(),
                timestamp: new Date().toISOString(),
                type: 'text',
            };

            // Broadcast to ALL participants including sender — instant delivery
            roomNs.to(roomId).emit('roomChatMessage', chatMsg);

            // Persist to DB in background (non-blocking)
            Room.findOne({ roomId })
                .then(room => {
                    if (room) {
                        room.chatMessages.push({ ...chatMsg, timestamp: new Date() });
                        if (room.chatMessages.length > 500) room.chatMessages = room.chatMessages.slice(-500);
                        return room.save();
                    }
                })
                .catch(err => console.error('Chat persist error:', err.message));
        });

        // ── Raise / lower hand ─────────────────────────────────────────────
        socket.on('raiseHand', ({ roomId, raised }) => {
            // Notify all OTHER participants
            socket.to(roomId).emit('peerHandRaise', {
                socketId: socket.id,
                user: socket.user,
                raised: !!raised,
            });
        });

        // ── Emoji reaction ─────────────────────────────────────────────────
        // Broadcast to ALL in room (including sender) so everyone sees it
        socket.on('reaction', ({ roomId, emoji }) => {
            roomNs.to(roomId).emit('peerReaction', {
                socketId: socket.id,
                user: socket.user,
                emoji,
            });
        });

        // ── Screen share notification ──────────────────────────────────────
        socket.on('screenShareChange', ({ roomId, isSharing }) => {
            socket.to(roomId).emit('peerScreenShare', {
                socketId: socket.id,
                user: socket.user,
                isSharing: !!isSharing,
            });
        });

        // ── Host: mute a participant ───────────────────────────────────────
        socket.on('muteParticipant', async ({ roomId, targetSocketId }) => {
            try {
                const room = await Room.findOne({ roomId });
                if (!room || room.host.toString() !== socket.userId) return;
                roomNs.to(targetSocketId).emit('forceMute', { by: socket.user });
            } catch (err) {
                console.error('muteParticipant error:', err.message);
            }
        });

        // ── Host: lock / unlock room ───────────────────────────────────────
        socket.on('lockRoom', async ({ roomId, locked }) => {
            try {
                const room = await Room.findOne({ roomId });
                if (!room || room.host.toString() !== socket.userId) return;
                room.isLocked = !!locked;
                await room.save();
                roomNs.to(roomId).emit('roomLockChange', { locked: room.isLocked, by: socket.user });
            } catch (err) {
                console.error('lockRoom error:', err.message);
            }
        });

        // ── Leave room ─────────────────────────────────────────────────────
        socket.on('leaveRoom', ({ roomId }) => {
            handleLeave(socket, roomId, roomPeers, roomNs);
        });

        // ── Disconnect ─────────────────────────────────────────────────────
        socket.on('disconnect', (reason) => {
            console.log(`❌ Room socket disconnected: ${socket.id} (${reason})`);
            if (socket.currentRoom) {
                handleLeave(socket, socket.currentRoom, roomPeers, roomNs);
            }
        });
    });

    return roomNs;
};

// ── Helper: handle peer leaving ───────────────────────────────────────────────
async function handleLeave(socket, roomId, roomPeers, roomNs) {
    // Remove from in-memory map
    const peers = roomPeers.get(roomId);
    if (peers) {
        peers.delete(socket.id);
        if (peers.size === 0) roomPeers.delete(roomId);
    }

    socket.leave(roomId);

    // Notify remaining peers
    socket.to(roomId).emit('peerLeft', {
        socketId: socket.id,
        user: socket.user,
    });

    // Broadcast system message to remaining peers
    socket.to(roomId).emit('roomChatMessage', {
        type: 'system',
        message: `${socket.user?.name || 'A participant'} left`,
        timestamp: new Date().toISOString(),
    });

    // Update DB
    try {
        const room = await Room.findOne({ roomId });
        if (!room) return;

        const participant = room.participants.find(p => p.socketId === socket.id && p.isActive);
        if (participant) {
            participant.isActive = false;
            participant.leftAt = new Date();
        }

        // End room if everyone left
        const remaining = roomPeers.get(roomId);
        if (!remaining || remaining.size === 0) {
            room.status = 'ended';
            room.endedAt = new Date();
        }

        await room.save();
    } catch (err) {
        console.error('handleLeave DB error:', err.message);
    }
}