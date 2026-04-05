// src/pages/VideoRoom.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
    Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff,
    MessageSquare, Users, Settings, Hand, Smile, Copy, Check,
    Maximize2, Minimize2, Grid, Crown, LayoutGrid, Columns,
    Lock, Unlock, UserMinus, Send, X, Loader2, AlertCircle,
    ChevronDown, Pin, PinOff, Volume2, VolumeX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io as socketIO } from 'socket.io-client';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { VideoTile, FloatingReaction, ChatPanel, ParticipantsPanel } from './VideoRoomComponents';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
const SOCKET_URL = API_BASE_URL;

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
    ],
    iceCandidatePoolSize: 10,
};

const getFullName = (user) => {
    if (!user) return 'Guest';
    if (typeof user === 'string') return user;
    if (user.name) return user.name;
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Guest';
};

const REACTIONS = ['👍', '❤️', '😂', '🔥', '👏', '😮', '🎉', '💯'];
const LAYOUTS = ['grid', 'spotlight', 'sidebar'];

const VideoRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user, onLogout } = useOutletContext();
    const token = localStorage.getItem('token');

    // ── State ─────────────────────────────────────────────────────────────────
    const [roomInfo, setRoomInfo] = useState(null);
    const [joinState, setJoinState] = useState('loading'); // loading | preview | joining | joined | ended | error
    const [errorMsg, setErrorMsg] = useState('');

    // Media
    const [localStream, setLocalStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Peers: Map<socketId, { user, stream, mediaState, connection }>
    const [peers, setPeers] = useState({});
    const peersRef = useRef({});

    // UI
    const [layout, setLayout] = useState('grid');
    const [pinnedSocketId, setPinnedSocketId] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [unreadChat, setUnreadChat] = useState(0);
    const [reactions, setReactions] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState({});
    const [roomCopied, setRoomCopied] = useState(false);

    // Refs
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const containerRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserIntervalRef = useRef(null);

    // ── Local media ───────────────────────────────────────────────────────────
    const startLocalMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
            });
            localStreamRef.current = stream;
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            return stream;
        } catch (err) {
            // Try audio only
            try {
                const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                localStreamRef.current = audioOnly;
                setLocalStream(audioOnly);
                setVideoEnabled(false);
                return audioOnly;
            } catch {
                toast.error('Could not access camera/microphone');
                return null;
            }
        }
    }, []);

    // ── Fetch room info ───────────────────────────────────────────────────────
    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/rooms/${roomId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRoomInfo(res.data.room);
                if (res.data.room.status === 'ended') {
                    setJoinState('ended');
                } else {
                    setJoinState('preview');
                }
            } catch (err) {
                if (err.response?.status === 404) {
                    setErrorMsg('Room not found. The link may be invalid.');
                } else {
                    setErrorMsg('Failed to load room information.');
                }
                setJoinState('error');
            }
        };
        fetchRoom();
    }, [roomId, token]);

    // ── Create peer connection ────────────────────────────────────────────────
    const createPeerConnection = useCallback((targetSocketId, targetUser, isInitiator) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        // Receive remote tracks
        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            setPeers(prev => ({
                ...prev,
                [targetSocketId]: {
                    ...prev[targetSocketId],
                    stream: remoteStream,
                    user: targetUser,
                    mediaState: prev[targetSocketId]?.mediaState || { audioOff: false, videoOff: false },
                },
            }));
            peersRef.current[targetSocketId] = {
                ...peersRef.current[targetSocketId],
                stream: remoteStream,
                connection: pc,
                user: targetUser,
            };
        };

        // ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('iceCandidate', {
                    targetSocketId,
                    candidate: event.candidate,
                    roomId,
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`ICE state [${targetSocketId}]:`, pc.iceConnectionState);
            if (pc.iceConnectionState === 'failed') {
                pc.restartIce();
            }
        };

        pc.onnegotiationneeded = async () => {
            if (!isInitiator) return;
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socketRef.current?.emit('offer', { targetSocketId, offer: pc.localDescription, roomId });
            } catch (err) {
                console.error('Negotiation error:', err);
            }
        };

        peersRef.current[targetSocketId] = { connection: pc, user: targetUser };
        return pc;
    }, [roomId]);

    // ── Socket.IO + WebRTC signaling ──────────────────────────────────────────
    const joinRoom = useCallback(async () => {
        if (!token) { onLogout?.(); return; }
        setJoinState('joining');

        const stream = await startLocalMedia();

        const socket = socketIO(`${SOCKET_URL}/room`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✅ Room socket connected:', socket.id);
            socket.emit('joinRoom', {
                roomId,
                mediaState: {
                    audioOff: !audioEnabled,
                    videoOff: !videoEnabled,
                    screen: false,
                },
            });
        });

        // Room joined — create connections to all existing peers
        socket.on('roomJoined', async ({ existingPeers, room }) => {
            setJoinState('joined');
            setRoomInfo(r => ({ ...r, ...room }));

            // Load chat history
            try {
                const res = await axios.get(`${API_BASE_URL}/api/rooms/${roomId}/chat`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setChatMessages(res.data.messages || []);
            } catch {}

            // Initiate connections to all existing peers
            for (const peer of existingPeers) {
                const pc = createPeerConnection(peer.socketId, peer.user, true);
                setPeers(prev => ({
                    ...prev,
                    [peer.socketId]: {
                        user: peer.user,
                        stream: null,
                        mediaState: peer.mediaState || {},
                        connection: pc,
                    },
                }));
                // Create and send offer
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('offer', { targetSocketId: peer.socketId, offer: pc.localDescription, roomId });
                } catch (err) {
                    console.error('Offer error:', err);
                }
            }
        });

        // New peer joined — wait for them to send offer
        socket.on('peerJoined', ({ socketId, user: peerUser, mediaState }) => {
            console.log('Peer joined:', socketId, getFullName(peerUser));
            const pc = createPeerConnection(socketId, peerUser, false);
            setPeers(prev => ({
                ...prev,
                [socketId]: { user: peerUser, stream: null, mediaState: mediaState || {}, connection: pc },
            }));
            toast.custom((t) => (
                <div className="flex items-center gap-3 bg-gray-800 text-white px-4 py-3 rounded-xl text-sm shadow-xl">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getFullName(peerUser).charAt(0)}
                    </div>
                    <span><strong>{getFullName(peerUser)}</strong> joined</span>
                </div>
            ), { duration: 3000, position: 'top-center' });
        });

        // Receive offer
        socket.on('offer', async ({ offer, fromSocketId, fromUser }) => {
            let pc = peersRef.current[fromSocketId]?.connection;
            if (!pc) {
                pc = createPeerConnection(fromSocketId, fromUser, false);
                setPeers(prev => ({ ...prev, [fromSocketId]: { user: fromUser, stream: null, mediaState: {}, connection: pc } }));
            }
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { targetSocketId: fromSocketId, answer: pc.localDescription, roomId });
            } catch (err) {
                console.error('Handle offer error:', err);
            }
        });

        // Receive answer
        socket.on('answer', async ({ answer, fromSocketId }) => {
            const pc = peersRef.current[fromSocketId]?.connection;
            if (pc && pc.signalingState !== 'stable') {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (err) {
                    console.error('Handle answer error:', err);
                }
            }
        });

        // ICE candidate
        socket.on('iceCandidate', async ({ candidate, fromSocketId }) => {
            const pc = peersRef.current[fromSocketId]?.connection;
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('ICE error:', err);
                }
            }
        });

        // Peer left
        socket.on('peerLeft', ({ socketId, user: peerUser }) => {
            const pc = peersRef.current[socketId]?.connection;
            pc?.close();
            delete peersRef.current[socketId];
            setPeers(prev => {
                const next = { ...prev };
                delete next[socketId];
                return next;
            });
            if (pinnedSocketId === socketId) setPinnedSocketId(null);
            toast.custom((t) => (
                <div className="flex items-center gap-2 bg-gray-800 text-gray-300 px-4 py-2.5 rounded-xl text-sm shadow-lg">
                    <span>{getFullName(peerUser)} left the meeting</span>
                </div>
            ), { duration: 2500, position: 'top-center' });
        });

        // Peer media state change
        socket.on('peerMediaStateChange', ({ socketId, mediaState }) => {
            setPeers(prev => ({
                ...prev,
                [socketId]: { ...prev[socketId], mediaState },
            }));
            if (peersRef.current[socketId]) {
                peersRef.current[socketId].mediaState = mediaState;
            }
        });

        // Chat message
        socket.on('roomChatMessage', (msg) => {
            setChatMessages(prev => [...prev, msg]);
            if (!showChat) setUnreadChat(c => c + 1);
        });

        // Reactions
        socket.on('peerReaction', ({ user: peerUser, emoji }) => {
            const id = Date.now() + Math.random();
            setReactions(prev => [...prev, { id, emoji, userName: getFullName(peerUser) }]);
        });

        // Raise hand
        socket.on('peerHandRaise', ({ user: peerUser, raised }) => {
            toast.custom(() => (
                <div className="bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm shadow-lg flex items-center gap-2">
                    <span>✋</span>
                    <span>{getFullName(peerUser)} {raised ? 'raised their hand' : 'lowered their hand'}</span>
                </div>
            ), { duration: 3000, position: 'top-center' });
        });

        // Room ended by host
        socket.on('roomEnded', () => {
            toast.error('The host ended the meeting');
            setTimeout(() => navigate('/meeting'), 1500);
        });

        // Kicked
        socket.on('kicked', ({ message }) => {
            toast.error(message || 'You were removed from the room');
            setTimeout(() => navigate('/meeting'), 1500);
        });

        // Force mute
        socket.on('forceMute', () => {
            setAudioEnabled(false);
            if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
            }
            toast('🔇 You were muted by the host', { duration: 3000 });
        });

        // Room lock change
        socket.on('roomLockChange', ({ locked }) => {
            setRoomInfo(r => ({ ...r, isLocked: locked }));
            toast(locked ? '🔒 Room locked' : '🔓 Room unlocked', { duration: 2000 });
        });

        // Join error
        socket.on('joinError', ({ message }) => {
            setErrorMsg(message);
            setJoinState('error');
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connect error:', err.message);
        });

        return () => {
            socket.emit('leaveRoom', { roomId });
            socket.disconnect();
            Object.values(peersRef.current).forEach(p => p.connection?.close());
            peersRef.current = {};
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStream?.getTracks().forEach(t => t.stop());
        };
    }, [roomId, token, createPeerConnection, navigate, onLogout, audioEnabled, videoEnabled]);

    // ── Toggle audio ──────────────────────────────────────────────────────────
    const toggleAudio = useCallback(() => {
        const newState = !audioEnabled;
        setAudioEnabled(newState);
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = newState; });
        }
        socketRef.current?.emit('mediaStateChange', {
            roomId,
            mediaState: { audioOff: !newState, videoOff: !videoEnabled, screen: isScreenSharing },
        });
    }, [audioEnabled, videoEnabled, isScreenSharing, roomId]);

    // ── Toggle video ──────────────────────────────────────────────────────────
    const toggleVideo = useCallback(() => {
        const newState = !videoEnabled;
        setVideoEnabled(newState);
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = newState; });
        }
        socketRef.current?.emit('mediaStateChange', {
            roomId,
            mediaState: { audioOff: !audioEnabled, videoOff: !newState, screen: isScreenSharing },
        });
    }, [audioEnabled, videoEnabled, isScreenSharing, roomId]);

    // ── Screen share ──────────────────────────────────────────────────────────
    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            screenStream?.getTracks().forEach(t => t.stop());
            setScreenStream(null);
            setIsScreenSharing(false);
            // Restore camera track in all peer connections
            if (localStreamRef.current) {
                const videoTrack = localStreamRef.current.getVideoTracks()[0];
                if (videoTrack) {
                    Object.values(peersRef.current).forEach(({ connection }) => {
                        if (connection) {
                            const sender = connection.getSenders().find(s => s.track?.kind === 'video');
                            sender?.replaceTrack(videoTrack);
                        }
                    });
                }
            }
            socketRef.current?.emit('screenShareChange', { roomId, isSharing: false });
            socketRef.current?.emit('mediaStateChange', {
                roomId,
                mediaState: { audioOff: !audioEnabled, videoOff: !videoEnabled, screen: false },
            });
        } else {
            try {
                const screen = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false,
                });
                setScreenStream(screen);
                setIsScreenSharing(true);
                const screenTrack = screen.getVideoTracks()[0];
                // Replace video track in all peer connections
                Object.values(peersRef.current).forEach(({ connection }) => {
                    if (connection) {
                        const sender = connection.getSenders().find(s => s.track?.kind === 'video');
                        sender?.replaceTrack(screenTrack);
                    }
                });
                screenTrack.onended = () => toggleScreenShare();
                socketRef.current?.emit('screenShareChange', { roomId, isSharing: true });
                socketRef.current?.emit('mediaStateChange', {
                    roomId,
                    mediaState: { audioOff: !audioEnabled, videoOff: !videoEnabled, screen: true },
                });
            } catch (err) {
                if (err.name !== 'NotAllowedError') toast.error('Could not share screen');
            }
        }
    }, [isScreenSharing, screenStream, roomId, audioEnabled, videoEnabled]);

    // ── Send chat ─────────────────────────────────────────────────────────────
    const sendChat = useCallback((message) => {
        socketRef.current?.emit('roomChat', { roomId, message });
    }, [roomId]);

    // ── Send reaction ─────────────────────────────────────────────────────────
    const sendReaction = useCallback((emoji) => {
        socketRef.current?.emit('reaction', { roomId, emoji });
        const id = Date.now();
        setReactions(prev => [...prev, { id, emoji, userName: getFullName(user) }]);
        setShowReactions(false);
    }, [roomId, user]);

    // ── Raise hand ────────────────────────────────────────────────────────────
    const toggleHand = useCallback(() => {
        const raised = !handRaised;
        setHandRaised(raised);
        socketRef.current?.emit('raiseHand', { roomId, raised });
    }, [handRaised, roomId]);

    // ── Leave room ────────────────────────────────────────────────────────────
    const leaveRoom = useCallback(() => {
        socketRef.current?.emit('leaveRoom', { roomId });
        socketRef.current?.disconnect();
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        screenStream?.getTracks().forEach(t => t.stop());
        Object.values(peersRef.current).forEach(p => p.connection?.close());
        peersRef.current = {};
        navigate('/meeting');
    }, [roomId, navigate, screenStream]);

    // ── Copy room link ────────────────────────────────────────────────────────
    const copyRoomLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
        setRoomCopied(true);
        setTimeout(() => setRoomCopied(false), 2500);
        toast.success('Link copied!', { duration: 1500 });
    };

    // ── Fullscreen ────────────────────────────────────────────────────────────
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // ── Clear unread when chat opens ──────────────────────────────────────────
    useEffect(() => {
        if (showChat) setUnreadChat(0);
    }, [showChat]);

    // ── Fullscreen event ──────────────────────────────────────────────────────
    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    // ── Local video ref ───────────────────────────────────────────────────────
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // ── Layout compute ────────────────────────────────────────────────────────
    const peerList = useMemo(() => Object.entries(peers), [peers]);
    const totalTiles = peerList.length + 1; // +1 for local

    const gridCols = useMemo(() => {
        if (totalTiles === 1) return 'grid-cols-1';
        if (totalTiles === 2) return 'grid-cols-2';
        if (totalTiles <= 4) return 'grid-cols-2';
        if (totalTiles <= 6) return 'grid-cols-3';
        if (totalTiles <= 9) return 'grid-cols-3';
        return 'grid-cols-4';
    }, [totalTiles]);

    const pinnedPeer = pinnedSocketId ? peers[pinnedSocketId] : null;

    // ── PREVIEW SCREEN ────────────────────────────────────────────────────────
    if (joinState === 'loading') {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                    <p className="text-gray-400 text-sm">Loading room…</p>
                </div>
            </div>
        );
    }

    if (joinState === 'error' || joinState === 'ended') {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center"
                >
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">
                        {joinState === 'ended' ? 'Meeting Ended' : 'Cannot Join Room'}
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">
                        {joinState === 'ended' ? 'This meeting has already ended.' : errorMsg}
                    </p>
                    <button onClick={() => navigate('/meeting')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                        Back to Meetings
                    </button>
                </motion.div>
            </div>
        );
    }

    if (joinState === 'preview') {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <Toaster />
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
                >
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white mb-1">{roomInfo?.name || 'Meeting Room'}</h1>
                        <p className="text-gray-400 text-sm font-mono">{roomId}</p>
                    </div>

                    {/* Preview video */}
                    <PreviewVideo videoEnabled={videoEnabled} setVideoEnabled={setVideoEnabled} audioEnabled={audioEnabled} setAudioEnabled={setAudioEnabled} />

                    <div className="mt-6 space-y-3">
                        <p className="text-center text-gray-400 text-sm">
                            Ready to join? <strong className="text-white">{getFullName(user)}</strong>
                        </p>
                        <button
                            onClick={joinRoom}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all duration-200 text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3"
                        >
                            <Video className="w-5 h-5" />
                            Join Meeting
                        </button>
                        <button
                            onClick={() => navigate('/meeting')}
                            className="w-full py-3 border border-gray-700 text-gray-400 rounded-2xl hover:bg-gray-800 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (joinState === 'joining') {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                    <p className="text-white font-semibold">Joining meeting…</p>
                    <p className="text-gray-500 text-sm">Connecting to participants</p>
                </div>
            </div>
        );
    }

    // ── MAIN CONFERENCE ROOM ──────────────────────────────────────────────────
    const isHost = roomInfo?.hostId === user?._id || roomInfo?.hostId === user?.id ||
        roomInfo?.host?._id === user?._id || roomInfo?.host === user?._id;

    return (
        <div ref={containerRef} className="h-screen bg-gray-950 flex flex-col overflow-hidden select-none" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <Toaster position="top-center" />

            {/* Floating reactions */}
            <AnimatePresence>
                {reactions.map(r => (
                    <FloatingReaction key={r.id} emoji={r.emoji} userName={r.userName}
                        onDone={() => setReactions(prev => prev.filter(x => x.id !== r.id))} />
                ))}
            </AnimatePresence>

            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 z-10 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-white truncate">{roomInfo?.name || 'Meeting'}</h2>
                        <p className="text-[11px] text-gray-500 font-mono">{roomId}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-lg flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] text-green-400 font-semibold">{totalTiles} {totalTiles === 1 ? 'person' : 'people'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={copyRoomLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors">
                        {roomCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {roomCopied ? 'Copied!' : 'Copy link'}
                    </button>
                    {/* Layout toggle */}
                    <button onClick={() => setLayout(l => l === 'grid' ? 'spotlight' : 'grid')}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors">
                        {layout === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <Columns className="w-4 h-4" />}
                    </button>
                    <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex relative overflow-hidden">
                {/* Video grid */}
                <div className="flex-1 p-3 overflow-hidden relative">
                    {layout === 'grid' || !pinnedPeer ? (
                        // Grid layout
                        <div className={`grid ${gridCols} gap-3 h-full auto-rows-fr`}>
                            {/* Local tile */}
                            <LocalVideoTile
                                videoRef={localVideoRef}
                                user={user}
                                audioEnabled={audioEnabled}
                                videoEnabled={videoEnabled}
                                isScreenSharing={isScreenSharing}
                                screenStream={screenStream}
                                isPinned={pinnedSocketId === 'local'}
                                onPin={() => setPinnedSocketId(p => p === 'local' ? null : 'local')}
                                isLarge={totalTiles === 1}
                            />
                            {/* Remote tiles */}
                            {peerList.map(([socketId, peer]) => (
                                <VideoTile
                                    key={socketId}
                                    stream={peer.stream}
                                    user={peer.user}
                                    isLocal={false}
                                    mediaState={peer.mediaState}
                                    isPinned={pinnedSocketId === socketId}
                                    onPin={() => setPinnedSocketId(p => p === socketId ? null : socketId)}
                                    isLarge={totalTiles === 1}
                                    isSpeaking={isSpeaking[socketId]}
                                />
                            ))}
                        </div>
                    ) : (
                        // Spotlight layout: pinned large, others in strip
                        <div className="flex h-full gap-3">
                            <div className="flex-1">
                                {pinnedSocketId === 'local' ? (
                                    <LocalVideoTile videoRef={localVideoRef} user={user} audioEnabled={audioEnabled}
                                        videoEnabled={videoEnabled} isScreenSharing={isScreenSharing} screenStream={screenStream}
                                        isPinned onPin={() => setPinnedSocketId(null)} isLarge />
                                ) : (
                                    <VideoTile stream={pinnedPeer.stream} user={pinnedPeer.user} isLocal={false}
                                        mediaState={pinnedPeer.mediaState} isPinned onPin={() => setPinnedSocketId(null)} isLarge />
                                )}
                            </div>
                            <div className="w-44 flex flex-col gap-2 overflow-y-auto scrollbar-thin">
                                {pinnedSocketId !== 'local' && (
                                    <LocalVideoTile videoRef={localVideoRef} user={user} audioEnabled={audioEnabled}
                                        videoEnabled={videoEnabled} isScreenSharing={isScreenSharing} screenStream={screenStream}
                                        isPinned={false} onPin={() => setPinnedSocketId('local')} isLarge={false} />
                                )}
                                {peerList.filter(([sid]) => sid !== pinnedSocketId).map(([socketId, peer]) => (
                                    <VideoTile key={socketId} stream={peer.stream} user={peer.user} isLocal={false}
                                        mediaState={peer.mediaState} isPinned={false}
                                        onPin={() => setPinnedSocketId(socketId)} isLarge={false} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Side panels */}
                <AnimatePresence>
                    {showChat && (
                        <ChatPanel
                            messages={chatMessages}
                            onSend={sendChat}
                            onClose={() => setShowChat(false)}
                            currentUser={user}
                        />
                    )}
                    {showParticipants && !showChat && (
                        <ParticipantsPanel
                            peers={peers}
                            localUser={user}
                            hostId={roomInfo?.hostId}
                            mySocketId={socketRef.current?.id}
                            onClose={() => setShowParticipants(false)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom control bar */}
            <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-6 py-4">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    {/* Left controls */}
                    <div className="flex items-center gap-2">
                        <ControlButton
                            onClick={toggleAudio}
                            active={audioEnabled}
                            activeIcon={<Mic className="w-5 h-5" />}
                            inactiveIcon={<MicOff className="w-5 h-5" />}
                            label={audioEnabled ? 'Mute' : 'Unmute'}
                            danger={!audioEnabled}
                        />
                        <ControlButton
                            onClick={toggleVideo}
                            active={videoEnabled}
                            activeIcon={<Video className="w-5 h-5" />}
                            inactiveIcon={<VideoOff className="w-5 h-5" />}
                            label={videoEnabled ? 'Stop Video' : 'Start Video'}
                            danger={!videoEnabled}
                        />
                        <ControlButton
                            onClick={toggleScreenShare}
                            active={!isScreenSharing}
                            activeIcon={<Monitor className="w-5 h-5" />}
                            inactiveIcon={<MonitorOff className="w-5 h-5" />}
                            label={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                            accent={isScreenSharing}
                        />
                    </div>

                    {/* Center controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleHand}
                            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-200 ${handRaised ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <Hand className="w-5 h-5" />
                            <span className="text-[10px] font-medium">{handRaised ? 'Lower' : 'Raise Hand'}</span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowReactions(p => !p)}
                                className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-200"
                            >
                                <Smile className="w-5 h-5" />
                                <span className="text-[10px] font-medium">React</span>
                            </button>
                            <AnimatePresence>
                                {showReactions && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-2xl p-2 flex gap-1 shadow-xl"
                                    >
                                        {REACTIONS.map(emoji => (
                                            <button key={emoji} onClick={() => sendReaction(emoji)}
                                                className="text-2xl p-2 hover:bg-gray-700 rounded-xl transition-colors hover:scale-125 active:scale-95 transition-transform">
                                                {emoji}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setShowChat(p => !p); setShowParticipants(false); }}
                            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${showChat ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Chat</span>
                            {unreadChat > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {unreadChat > 9 ? '9+' : unreadChat}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => { setShowParticipants(p => !p); setShowChat(false); }}
                            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-200 ${showParticipants ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <Users className="w-5 h-5" />
                            <span className="text-[10px] font-medium">People</span>
                        </button>

                        {/* Leave button */}
                        <button
                            onClick={leaveRoom}
                            className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/25 ml-2"
                        >
                            <PhoneOff className="w-5 h-5" />
                            <span className="text-sm">Leave</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Control Button Helper ──────────────────────────────────────────────────────
const ControlButton = ({ onClick, active, activeIcon, inactiveIcon, label, danger, accent }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-200 ${
            danger && !active ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' :
            accent ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' :
            'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
    >
        {active ? activeIcon : inactiveIcon}
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

// ── Local Video Tile ───────────────────────────────────────────────────────────
const LocalVideoTile = ({ videoRef, user, audioEnabled, videoEnabled, isScreenSharing, screenStream, isPinned, onPin, isLarge }) => {
    const screenVideoRef = useRef(null);
    useEffect(() => {
        if (screenVideoRef.current && screenStream) screenVideoRef.current.srcObject = screenStream;
    }, [screenStream]);

    const name = getFullName(user);

    return (
        <div className={`relative rounded-2xl overflow-hidden bg-gray-800 ${isPinned ? 'ring-2 ring-blue-400' : ''} ${isLarge ? 'h-full' : 'aspect-video'}`}>
            {isScreenSharing && screenStream ? (
                <video ref={screenVideoRef} autoPlay muted playsInline className="w-full h-full object-contain bg-black" />
            ) : videoEnabled ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                        {name.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-start items-end p-3">
                <button onClick={onPin} className="p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70">
                    {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
            </div>
            {/* Bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                <span className="text-white text-xs font-semibold truncate">{name} (You)</span>
                <div className="flex items-center gap-1">
                    {!audioEnabled && <div className="p-1 bg-red-500/90 rounded-md"><MicOff className="w-3 h-3 text-white" /></div>}
                    {!videoEnabled && !isScreenSharing && <div className="p-1 bg-gray-600/90 rounded-md"><VideoOff className="w-3 h-3 text-white" /></div>}
                    {isScreenSharing && <div className="p-1 bg-green-500/90 rounded-md"><Monitor className="w-3 h-3 text-white" /></div>}
                </div>
            </div>
        </div>
    );
};

// ── Preview Video ──────────────────────────────────────────────────────────────
const PreviewVideo = ({ videoEnabled, setVideoEnabled, audioEnabled, setAudioEnabled }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch {}
        };
        start();
        return () => streamRef.current?.getTracks().forEach(t => t.stop());
    }, []);

    useEffect(() => {
        streamRef.current?.getVideoTracks().forEach(t => { t.enabled = videoEnabled; });
    }, [videoEnabled]);
    useEffect(() => {
        streamRef.current?.getAudioTracks().forEach(t => { t.enabled = audioEnabled; });
    }, [audioEnabled]);

    return (
        <div className="relative aspect-video bg-gray-800 rounded-2xl overflow-hidden">
            {videoEnabled ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <VideoOff className="w-10 h-10 text-gray-500" />
                </div>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <button onClick={() => setAudioEnabled(p => !p)}
                    className={`p-3 rounded-full transition-all ${audioEnabled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white'}`}>
                    {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button onClick={() => setVideoEnabled(p => !p)}
                    className={`p-3 rounded-full transition-all ${videoEnabled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white'}`}>
                    {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

export default VideoRoom;