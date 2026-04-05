// src/pages/VideoRoom.jsx
// WebRTC mesh conference room — fixed version
// Fixes: peer video/audio, real-time chat, mobile screen share, no gradients
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
    Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff,
    MessageSquare, Users, Hand, Smile, Copy, Check,
    Maximize2, Minimize2, LayoutGrid, Columns,
    Send, X, Loader2, AlertCircle, Pin, PinOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io as socketIO } from 'socket.io-client';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { VideoTile, FloatingReaction, ChatPanel, ParticipantsPanel, getFullName } from './VideoRoomComponents';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

// Free STUN servers — no API key, no cost
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
    ],
    iceCandidatePoolSize: 10,
};

const REACTIONS = ['👍', '❤️', '😂', '🔥', '👏', '😮', '🎉', '💯'];

// ── Local video tile with screen share support ────────────────────────────────
const LocalVideoTile = React.memo(({
    localStream, screenStream, isScreenSharing, audioEnabled, videoEnabled,
    user, isPinned, onPin, isLarge
}) => {
    const cameraRef = useRef(null);
    const screenRef = useRef(null);
    const name = getFullName(user);

    useEffect(() => {
        if (cameraRef.current && localStream && cameraRef.current.srcObject !== localStream) {
            cameraRef.current.srcObject = localStream;
            cameraRef.current.play().catch(() => {});
        }
    }, [localStream]);

    useEffect(() => {
        if (screenRef.current && screenStream && screenRef.current.srcObject !== screenStream) {
            screenRef.current.srcObject = screenStream;
            screenRef.current.play().catch(() => {});
        }
    }, [screenStream]);

    const showCamera = videoEnabled && !isScreenSharing && !!localStream;
    const showScreen = isScreenSharing && !!screenStream;
    const showAvatar = !showCamera && !showScreen;

    return (
        <div className={`
            relative overflow-hidden bg-gray-800 rounded-xl
            ${isPinned ? 'ring-2 ring-blue-500' : ''}
            ${isLarge ? 'h-full w-full' : 'w-full aspect-video'}
        `}>
            {/* Camera video */}
            <video ref={cameraRef} autoPlay muted playsInline
                className={`w-full h-full object-cover ${showCamera ? '' : 'hidden'}`}
                style={{ transform: 'scaleX(-1)' }}
            />
            {/* Screen share video */}
            <video ref={screenRef} autoPlay muted playsInline
                className={`w-full h-full object-contain bg-black ${showScreen ? '' : 'hidden'}`}
            />
            {/* Avatar fallback */}
            {showAvatar && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 gap-2">
                    <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-400 text-xs">{name}</span>
                </div>
            )}

            {/* Pin on hover */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                <button onClick={onPin} className="p-1.5 bg-black bg-opacity-60 rounded-lg text-white hover:bg-opacity-90">
                    {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* Bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-black bg-opacity-50 flex items-center justify-between">
                <span className="text-white text-xs font-medium truncate">{name} (You)</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {!audioEnabled && <div className="p-0.5 bg-red-600 rounded"><MicOff className="w-3 h-3 text-white" /></div>}
                    {!videoEnabled && !isScreenSharing && <div className="p-0.5 bg-gray-600 rounded"><VideoOff className="w-3 h-3 text-white" /></div>}
                    {isScreenSharing && <div className="p-0.5 bg-green-600 rounded"><Monitor className="w-3 h-3 text-white" /></div>}
                </div>
            </div>
        </div>
    );
});
LocalVideoTile.displayName = 'LocalVideoTile';

// ── Preview screen before joining ─────────────────────────────────────────────
const PreviewScreen = ({ roomInfo, roomId, user, onJoin, onCancel }) => {
    const [audioOn, setAudioOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => {});
                }
            } catch {
                setVideoOn(false);
            }
        };
        start();
        return () => streamRef.current?.getTracks().forEach(t => t.stop());
    }, []);

    useEffect(() => {
        streamRef.current?.getVideoTracks().forEach(t => { t.enabled = videoOn; });
    }, [videoOn]);

    useEffect(() => {
        streamRef.current?.getAudioTracks().forEach(t => { t.enabled = audioOn; });
    }, [audioOn]);

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <Toaster />
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl"
            >
                <div className="text-center mb-5">
                    <h1 className="text-xl font-bold text-white">{roomInfo?.name || 'Meeting Room'}</h1>
                    <p className="text-gray-400 text-sm font-mono mt-1">{roomId}</p>
                </div>

                {/* Camera preview */}
                <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-5">
                    <video
                        ref={videoRef}
                        autoPlay muted playsInline
                        className={`w-full h-full object-cover ${videoOn ? '' : 'hidden'}`}
                        style={{ transform: 'scaleX(-1)' }}
                    />
                    {!videoOn && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <VideoOff className="w-10 h-10 text-gray-500" />
                        </div>
                    )}
                    {/* Controls */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
                        <button
                            onClick={() => setAudioOn(p => !p)}
                            className={`p-3 rounded-full transition-colors ${audioOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-600 text-white hover:bg-red-700'}`}
                        >
                            {audioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => setVideoOn(p => !p)}
                            className={`p-3 rounded-full transition-colors ${videoOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-600 text-white hover:bg-red-700'}`}
                        >
                            {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <p className="text-center text-gray-400 text-sm mb-5">
                    Joining as <span className="text-white font-semibold">{getFullName(user)}</span>
                </p>

                <button
                    onClick={() => onJoin({ audioOn, videoOn })}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <Video className="w-5 h-5" />
                    Join Meeting
                </button>
                <button
                    onClick={onCancel}
                    className="w-full py-3 mt-2 border border-gray-700 text-gray-400 rounded-xl hover:bg-gray-800 transition-colors text-sm"
                >
                    Cancel
                </button>
            </motion.div>
        </div>
    );
};

// ── Control Button ─────────────────────────────────────────────────────────────
const CtrlBtn = ({ onClick, active, offIcon, onIcon, label, redWhenOff = false, greenWhenOn = false, badge }) => (
    <button
        onClick={onClick}
        className={`relative flex flex-col items-center gap-1 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-colors ${
            !active && redWhenOff
                ? 'bg-red-700 bg-opacity-30 text-red-400 hover:bg-opacity-50'
                : active && greenWhenOn
                ? 'bg-green-700 bg-opacity-30 text-green-400 hover:bg-opacity-50'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
        {active ? onIcon : offIcon}
        <span className="text-[10px] font-medium hidden sm:block">{label}</span>
        {badge != null && badge > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
            </span>
        )}
    </button>
);

// ── Main VideoRoom ─────────────────────────────────────────────────────────────
const VideoRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user, onLogout } = useOutletContext();
    const token = localStorage.getItem('token');

    // ─── State ────────────────────────────────────────────────────────────────
    const [phase, setPhase] = useState('loading'); // loading | preview | joining | room | ended | error
    const [errorMsg, setErrorMsg] = useState('');
    const [roomInfo, setRoomInfo] = useState(null);

    // Local media
    const [localStream, setLocalStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenShareSupported, setScreenShareSupported] = useState(false);

    // Peers — keyed by socketId
    // { [socketId]: { user, stream, mediaState, connection } }
    const [peers, setPeers] = useState({});

    // UI
    const [layout, setLayout] = useState('grid');
    const [pinnedId, setPinnedId] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [unreadChat, setUnreadChat] = useState(0);
    const [reactions, setReactions] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState({});
    const [linkCopied, setLinkCopied] = useState(false);

    // ─── Refs (stable across renders) ────────────────────────────────────────
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);   // always mirrors localStream
    const peersRef = useRef({});           // always mirrors peers
    const containerRef = useRef(null);

    // ICE candidate queue per peer — buffer candidates before remote desc is set
    const iceCandidateQueue = useRef({});  // { [socketId]: RTCIceCandidate[] }

    // Keep refs in sync with state
    useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
    useEffect(() => { peersRef.current = peers; }, [peers]);

    // ─── Check screen share support (browser + platform) ─────────────────────
    useEffect(() => {
        // getDisplayMedia is available on desktop browsers.
        // On mobile browsers it's not supported — we show a disabled button.
        const supported = !!(navigator.mediaDevices?.getDisplayMedia);
        setScreenShareSupported(supported);
    }, []);

    // ─── Load room info ───────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/rooms/${roomId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRoomInfo(res.data.room);
                setPhase(res.data.room.status === 'ended' ? 'ended' : 'preview');
            } catch (err) {
                setErrorMsg(err.response?.status === 404 ? 'Room not found.' : 'Failed to load room.');
                setPhase('error');
            }
        };
        load();
    }, [roomId, token]);

    // ─── Create a peer connection ─────────────────────────────────────────────
    // CRITICAL: This function is NOT a useCallback that captures localStream.
    // It reads localStreamRef.current at call time, so it always gets the live stream.
    const createPeerConnection = useCallback((targetSocketId, targetUser) => {
        // Close any existing connection for this peer
        peersRef.current[targetSocketId]?.connection?.close();

        const pc = new RTCPeerConnection(ICE_SERVERS);

        // ── Add our local tracks so the remote can receive our audio/video ──
        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });
        }

        // ── Receive remote tracks ──────────────────────────────────────────
        pc.ontrack = (event) => {
            // event.streams[0] is the remote MediaStream
            // We set it on state which triggers VideoTile's useEffect to attach srcObject
            const remoteStream = event.streams[0];
            if (!remoteStream) return;

            setPeers(prev => ({
                ...prev,
                [targetSocketId]: {
                    ...prev[targetSocketId],
                    stream: remoteStream,
                    user: targetUser || prev[targetSocketId]?.user,
                    mediaState: prev[targetSocketId]?.mediaState || {},
                },
            }));
            // Sync ref too
            peersRef.current[targetSocketId] = {
                ...peersRef.current[targetSocketId],
                stream: remoteStream,
                connection: pc,
                user: targetUser || peersRef.current[targetSocketId]?.user,
            };
        };

        // ── ICE candidates ─────────────────────────────────────────────────
        pc.onicecandidate = ({ candidate }) => {
            if (candidate && socketRef.current?.connected) {
                socketRef.current.emit('iceCandidate', { targetSocketId, candidate, roomId });
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'failed') {
                console.warn(`ICE failed for ${targetSocketId}, restarting`);
                pc.restartIce();
            }
            if (['closed', 'disconnected'].includes(pc.iceConnectionState)) {
                console.log(`Peer ${targetSocketId} disconnected`);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`Peer ${targetSocketId} connection:`, pc.connectionState);
        };

        // Store in ref immediately
        peersRef.current[targetSocketId] = {
            ...peersRef.current[targetSocketId],
            connection: pc,
            user: targetUser,
        };

        return pc;
    }, [roomId]); // roomId is stable

    // ─── Drain queued ICE candidates after remote description set ─────────────
    const drainIceQueue = useCallback(async (targetSocketId, pc) => {
        const queue = iceCandidateQueue.current[targetSocketId] || [];
        for (const candidate of queue) {
            try { await pc.addIceCandidate(candidate); } catch (e) { console.warn('ICE add error:', e); }
        }
        iceCandidateQueue.current[targetSocketId] = [];
    }, []);

    // ─── Join room (connect socket + WebRTC) ──────────────────────────────────
    const joinRoom = useCallback(async ({ audioOn, videoOn }) => {
        setPhase('joining');
        setAudioEnabled(audioOn);
        setVideoEnabled(videoOn);

        // 1. Acquire media first so tracks are ready before peer connections form
        let stream = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: videoOn ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
        } catch {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                setVideoEnabled(false);
            } catch {
                toast.error('Could not access microphone. Check browser permissions.');
                setPhase('preview');
                return;
            }
        }

        // Apply initial enabled states to tracks
        stream.getVideoTracks().forEach(t => { t.enabled = videoOn; });
        stream.getAudioTracks().forEach(t => { t.enabled = audioOn; });

        localStreamRef.current = stream;
        setLocalStream(stream);

        // 2. Connect to signaling socket
        const socket = socketIO(`${API_BASE_URL}/room`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✅ Signaling socket connected:', socket.id);
            socket.emit('joinRoom', {
                roomId,
                mediaState: { audioOff: !audioOn, videoOff: !videoOn, screen: false },
            });
        });

        // ── Room joined: initiate connections to all present peers ─────────
        socket.on('roomJoined', async ({ existingPeers, room }) => {
            setRoomInfo(r => ({ ...r, ...room }));
            setPhase('room');

            // Load chat history from HTTP (once)
            try {
                const res = await axios.get(`${API_BASE_URL}/api/rooms/${roomId}/chat`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setChatMessages(res.data.messages || []);
            } catch {}

            // For each existing peer: we are the CALLER — create offer
            for (const peer of existingPeers) {
                const pc = createPeerConnection(peer.socketId, peer.user);
                setPeers(prev => ({
                    ...prev,
                    [peer.socketId]: {
                        user: peer.user,
                        stream: null,
                        mediaState: peer.mediaState || {},
                        connection: pc,
                    },
                }));

                try {
                    const offer = await pc.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true,
                    });
                    await pc.setLocalDescription(offer);
                    socket.emit('offer', { targetSocketId: peer.socketId, offer: pc.localDescription, roomId });
                } catch (err) {
                    console.error('Offer error:', err);
                }
            }
        });

        // ── New peer joined: they will send us an offer (we are CALLEE) ────
        socket.on('peerJoined', ({ socketId, user: peerUser, mediaState }) => {
            // Pre-create connection so we're ready when their offer arrives
            const pc = createPeerConnection(socketId, peerUser);
            setPeers(prev => ({
                ...prev,
                [socketId]: { user: peerUser, stream: null, mediaState: mediaState || {}, connection: pc },
            }));
            toast.custom(() => (
                <div className="flex items-center gap-3 bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm shadow-lg">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getFullName(peerUser).charAt(0)}
                    </div>
                    <span><strong>{getFullName(peerUser)}</strong> joined</span>
                </div>
            ), { duration: 3000, position: 'top-center' });
        });

        // ── Receive offer (we answer) ──────────────────────────────────────
        socket.on('offer', async ({ offer, fromSocketId, fromUser }) => {
            let pc = peersRef.current[fromSocketId]?.connection;
            if (!pc || pc.signalingState === 'closed') {
                pc = createPeerConnection(fromSocketId, fromUser);
                setPeers(prev => ({
                    ...prev,
                    [fromSocketId]: {
                        ...(prev[fromSocketId] || {}),
                        user: fromUser,
                        stream: null,
                        mediaState: prev[fromSocketId]?.mediaState || {},
                        connection: pc,
                    },
                }));
            }
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                await drainIceQueue(fromSocketId, pc);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { targetSocketId: fromSocketId, answer: pc.localDescription, roomId });
            } catch (err) {
                console.error('Handle offer error:', err);
            }
        });

        // ── Receive answer ─────────────────────────────────────────────────
        socket.on('answer', async ({ answer, fromSocketId }) => {
            const pc = peersRef.current[fromSocketId]?.connection;
            if (!pc) return;
            if (pc.signalingState === 'have-local-offer') {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    await drainIceQueue(fromSocketId, pc);
                } catch (err) {
                    console.error('Handle answer error:', err);
                }
            }
        });

        // ── Receive ICE candidate ──────────────────────────────────────────
        socket.on('iceCandidate', async ({ candidate, fromSocketId }) => {
            const pc = peersRef.current[fromSocketId]?.connection;
            const iceCandidate = new RTCIceCandidate(candidate);
            if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                // Remote description already set — add immediately
                try { await pc.addIceCandidate(iceCandidate); } catch (e) { console.warn('ICE add:', e); }
            } else {
                // Queue until remote description is set
                if (!iceCandidateQueue.current[fromSocketId]) iceCandidateQueue.current[fromSocketId] = [];
                iceCandidateQueue.current[fromSocketId].push(iceCandidate);
            }
        });

        // ── Peer left ──────────────────────────────────────────────────────
        socket.on('peerLeft', ({ socketId, user: peerUser }) => {
            peersRef.current[socketId]?.connection?.close();
            delete peersRef.current[socketId];
            delete iceCandidateQueue.current[socketId];
            setPeers(prev => {
                const n = { ...prev };
                delete n[socketId];
                return n;
            });
            setPinnedId(p => p === socketId ? null : p);
            toast.custom(() => (
                <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-xl text-sm shadow-lg">
                    {getFullName(peerUser)} left
                </div>
            ), { duration: 2000, position: 'top-center' });
        });

        // ── Peer media state change ────────────────────────────────────────
        socket.on('peerMediaStateChange', ({ socketId, mediaState }) => {
            setPeers(prev => ({
                ...prev,
                [socketId]: { ...(prev[socketId] || {}), mediaState },
            }));
            if (peersRef.current[socketId]) peersRef.current[socketId].mediaState = mediaState;
        });

        // ── Chat: real-time messages ───────────────────────────────────────
        // FIX: Use functional updater — no stale closure on showChat
        socket.on('roomChatMessage', (msg) => {
            setChatMessages(prev => [...prev, msg]);
            // Use ref to check showChat without capturing stale state
            setUnreadChat(prev => {
                // We'll check showChat via a ref below
                return prev;
            });
            setShowChat(currentlyShowing => {
                if (!currentlyShowing) {
                    setUnreadChat(c => c + 1);
                }
                return currentlyShowing; // don't change showChat state
            });
        });

        // ── Reactions ─────────────────────────────────────────────────────
        socket.on('peerReaction', ({ user: peerUser, emoji }) => {
            const id = Date.now() + Math.random();
            setReactions(prev => [...prev, { id, emoji, userName: getFullName(peerUser) }]);
        });

        // ── Hand raise ────────────────────────────────────────────────────
        socket.on('peerHandRaise', ({ user: peerUser, raised }) => {
            toast(
                `✋ ${getFullName(peerUser)} ${raised ? 'raised their hand' : 'lowered their hand'}`,
                { duration: 3000, position: 'top-center' }
            );
        });

        // ── Host events ────────────────────────────────────────────────────
        socket.on('roomEnded', () => {
            toast.error('The host ended this meeting');
            setTimeout(() => navigate('/meetroom'), 1500);
        });
        socket.on('kicked', ({ message }) => {
            toast.error(message || 'You were removed from the room');
            setTimeout(() => navigate('/meetroom'), 1500);
        });
        socket.on('forceMute', () => {
            setAudioEnabled(false);
            localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = false; });
            toast('🔇 You were muted by the host', { duration: 3000 });
        });
        socket.on('roomLockChange', ({ locked }) => {
            setRoomInfo(r => r ? { ...r, isLocked: locked } : r);
            toast(locked ? '🔒 Room locked' : '🔓 Room unlocked', { duration: 2000 });
        });
        socket.on('joinError', ({ message }) => {
            setErrorMsg(message);
            setPhase('error');
        });
        socket.on('connect_error', err => {
            console.error('Socket error:', err.message);
        });
        socket.on('disconnect', reason => {
            console.log('Socket disconnected:', reason);
        });

    }, [roomId, token, createPeerConnection, drainIceQueue, navigate]);

    // ─── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            socketRef.current?.emit('leaveRoom', { roomId });
            socketRef.current?.disconnect();
            Object.values(peersRef.current).forEach(p => p.connection?.close());
            peersRef.current = {};
            localStreamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [roomId]);

    // ─── Toggle audio ─────────────────────────────────────────────────────────
    const toggleAudio = useCallback(() => {
        setAudioEnabled(prev => {
            const next = !prev;
            localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = next; });
            socketRef.current?.emit('mediaStateChange', {
                roomId,
                mediaState: { audioOff: !next, videoOff: !videoEnabled, screen: isScreenSharing },
            });
            return next;
        });
    }, [roomId, videoEnabled, isScreenSharing]);

    // ─── Toggle video ─────────────────────────────────────────────────────────
    const toggleVideo = useCallback(() => {
        setVideoEnabled(prev => {
            const next = !prev;
            localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = next; });
            socketRef.current?.emit('mediaStateChange', {
                roomId,
                mediaState: { audioOff: !audioEnabled, videoOff: !next, screen: isScreenSharing },
            });
            return next;
        });
    }, [roomId, audioEnabled, isScreenSharing]);

    // ─── Screen share ─────────────────────────────────────────────────────────
    const screenStreamRef = useRef(null);

    const stopScreenShare = useCallback(() => {
        const ss = screenStreamRef.current;
        ss?.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
        setScreenStream(null);
        setIsScreenSharing(false);

        // Restore camera track in all peer connections
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        if (cameraTrack) {
            Object.values(peersRef.current).forEach(({ connection }) => {
                const sender = connection?.getSenders().find(s => s.track?.kind === 'video');
                sender?.replaceTrack(cameraTrack);
            });
        }
        socketRef.current?.emit('screenShareChange', { roomId, isSharing: false });
        socketRef.current?.emit('mediaStateChange', {
            roomId,
            mediaState: { audioOff: !audioEnabled, videoOff: !videoEnabled, screen: false },
        });
    }, [roomId, audioEnabled, videoEnabled]);

    const startScreenShare = useCallback(async () => {
        if (!screenShareSupported) {
            toast.error('Screen sharing is not supported on this device/browser');
            return;
        }
        try {
            const screen = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 15, cursor: 'always' },
                audio: false,
            });
            screenStreamRef.current = screen;
            setScreenStream(screen);
            setIsScreenSharing(true);

            const screenTrack = screen.getVideoTracks()[0];
            // Replace video sender in all peer connections
            Object.values(peersRef.current).forEach(({ connection }) => {
                const sender = connection?.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack).catch(console.warn);
            });

            // Auto-stop when browser's "Stop sharing" button is clicked
            screenTrack.onended = stopScreenShare;

            socketRef.current?.emit('screenShareChange', { roomId, isSharing: true });
            socketRef.current?.emit('mediaStateChange', {
                roomId,
                mediaState: { audioOff: !audioEnabled, videoOff: !videoEnabled, screen: true },
            });
        } catch (err) {
            if (err.name !== 'NotAllowedError') {
                toast.error('Could not start screen sharing. Try on a desktop browser.');
            }
        }
    }, [roomId, audioEnabled, videoEnabled, screenShareSupported, stopScreenShare]);

    const toggleScreenShare = useCallback(() => {
        if (isScreenSharing) stopScreenShare();
        else startScreenShare();
    }, [isScreenSharing, startScreenShare, stopScreenShare]);

    // ─── Chat ─────────────────────────────────────────────────────────────────
    const sendChat = useCallback((message) => {
        if (!message.trim() || !socketRef.current) return;
        socketRef.current.emit('roomChat', { roomId, message: message.trim() });
    }, [roomId]);

    // ─── Reactions ────────────────────────────────────────────────────────────
    const sendReaction = useCallback((emoji) => {
        socketRef.current?.emit('reaction', { roomId, emoji });
        const id = Date.now();
        setReactions(prev => [...prev, { id, emoji, userName: getFullName(user) }]);
        setShowReactions(false);
    }, [roomId, user]);

    // ─── Raise hand ───────────────────────────────────────────────────────────
    const toggleHand = useCallback(() => {
        setHandRaised(p => {
            const raised = !p;
            socketRef.current?.emit('raiseHand', { roomId, raised });
            return raised;
        });
    }, [roomId]);

    // ─── Leave ────────────────────────────────────────────────────────────────
    const leaveRoom = useCallback(() => {
        socketRef.current?.emit('leaveRoom', { roomId });
        socketRef.current?.disconnect();
        Object.values(peersRef.current).forEach(p => p.connection?.close());
        peersRef.current = {};
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        navigate('/meetroom');
    }, [roomId, navigate]);

    // ─── Copy link ────────────────────────────────────────────────────────────
    const copyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
        setLinkCopied(true);
        toast.success('Link copied!', { duration: 1500 });
        setTimeout(() => setLinkCopied(false), 2500);
    };

    // ─── Fullscreen ───────────────────────────────────────────────────────────
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen?.();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setIsFullscreen(false);
        }
    };
    useEffect(() => {
        const h = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', h);
        return () => document.removeEventListener('fullscreenchange', h);
    }, []);

    // ─── Clear unread when chat opens ─────────────────────────────────────────
    useEffect(() => {
        if (showChat) setUnreadChat(0);
    }, [showChat]);

    // ─── Computed ─────────────────────────────────────────────────────────────
    const peerList = useMemo(() => Object.entries(peers), [peers]);
    const totalTiles = peerList.length + 1;

    const gridCols = useMemo(() => {
        if (totalTiles === 1) return 'grid-cols-1';
        if (totalTiles === 2) return 'grid-cols-1 sm:grid-cols-2';
        if (totalTiles <= 4) return 'grid-cols-2';
        if (totalTiles <= 6) return 'grid-cols-2 sm:grid-cols-3';
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
    }, [totalTiles]);

    const pinnedPeer = pinnedId && pinnedId !== 'local' ? peers[pinnedId] : null;
    const isHost = roomInfo?.hostId === (user?._id || user?.id) ||
        roomInfo?.host?._id === (user?._id || user?.id);

    // ─── Loading / error / ended screens ─────────────────────────────────────
    if (phase === 'loading') {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                    <p className="text-gray-400 text-sm">Loading room…</p>
                </div>
            </div>
        );
    }
    if (phase === 'error' || phase === 'ended') {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full text-center"
                >
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-white mb-2">
                        {phase === 'ended' ? 'Meeting Ended' : 'Cannot Join'}
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">{phase === 'ended' ? 'This meeting has ended.' : errorMsg}</p>
                    <button onClick={() => navigate('/meetroom')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors w-full">
                        Back to Meetings
                    </button>
                </motion.div>
            </div>
        );
    }
    if (phase === 'preview') {
        return (
            <PreviewScreen
                roomInfo={roomInfo}
                roomId={roomId}
                user={user}
                onJoin={joinRoom}
                onCancel={() => navigate('/meetroom')}
            />
        );
    }
    if (phase === 'joining') {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                    <p className="text-white font-semibold">Joining meeting…</p>
                    <p className="text-gray-500 text-sm">Connecting peers</p>
                </div>
            </div>
        );
    }

    // ─── Main conference room ─────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            className="h-screen bg-gray-950 flex flex-col overflow-hidden"
            style={{ fontFamily: 'system-ui, sans-serif' }}
        >
            <Toaster position="top-center" />

            {/* Floating reactions */}
            <AnimatePresence>
                {reactions.map(r => (
                    <FloatingReaction key={r.id} emoji={r.emoji} userName={r.userName}
                        onDone={() => setReactions(p => p.filter(x => x.id !== r.id))} />
                ))}
            </AnimatePresence>

            {/* ── Top bar ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 hidden sm:block">
                        <h2 className="text-sm font-bold text-white truncate">{roomInfo?.name || 'Meeting'}</h2>
                        <p className="text-[11px] text-gray-500 font-mono">{roomId}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-900 rounded-lg flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[11px] text-green-400 font-semibold">{totalTiles}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={copyLink}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors">
                        {linkCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:block">{linkCopied ? 'Copied!' : 'Copy link'}</span>
                    </button>
                    <button onClick={() => setLayout(l => l === 'grid' ? 'spotlight' : 'grid')}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors">
                        {layout === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <Columns className="w-4 h-4" />}
                    </button>
                    <button onClick={toggleFullscreen}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* ── Main area ──────────────────────────────────────────────── */}
            <div className="flex-1 flex relative overflow-hidden">
                {/* Video area */}
                <div className="flex-1 p-2 sm:p-3 overflow-hidden">
                    {layout === 'grid' || !pinnedPeer ? (
                        // Grid
                        <div className={`grid ${gridCols} gap-2 sm:gap-3 h-full auto-rows-fr`}>
                            <LocalVideoTile
                                localStream={localStream}
                                screenStream={screenStream}
                                isScreenSharing={isScreenSharing}
                                audioEnabled={audioEnabled}
                                videoEnabled={videoEnabled}
                                user={user}
                                isPinned={pinnedId === 'local'}
                                onPin={() => setPinnedId(p => p === 'local' ? null : 'local')}
                                isLarge={totalTiles === 1}
                            />
                            {peerList.map(([socketId, peer]) => (
                                <VideoTile
                                    key={socketId}
                                    stream={peer.stream}
                                    user={peer.user}
                                    isLocal={false}
                                    mediaState={peer.mediaState}
                                    isPinned={pinnedId === socketId}
                                    onPin={() => setPinnedId(p => p === socketId ? null : socketId)}
                                    isLarge={totalTiles === 1}
                                    isSpeaking={isSpeaking[socketId]}
                                />
                            ))}
                        </div>
                    ) : (
                        // Spotlight: pinned large + sidebar strip
                        <div className="flex h-full gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                                {pinnedId === 'local' ? (
                                    <LocalVideoTile localStream={localStream} screenStream={screenStream}
                                        isScreenSharing={isScreenSharing} audioEnabled={audioEnabled}
                                        videoEnabled={videoEnabled} user={user} isPinned
                                        onPin={() => setPinnedId(null)} isLarge />
                                ) : (
                                    <VideoTile stream={pinnedPeer.stream} user={pinnedPeer.user}
                                        isLocal={false} mediaState={pinnedPeer.mediaState}
                                        isPinned onPin={() => setPinnedId(null)} isLarge />
                                )}
                            </div>
                            <div className="w-36 sm:w-44 flex flex-col gap-2 overflow-y-auto">
                                {pinnedId !== 'local' && (
                                    <LocalVideoTile localStream={localStream} screenStream={screenStream}
                                        isScreenSharing={isScreenSharing} audioEnabled={audioEnabled}
                                        videoEnabled={videoEnabled} user={user} isPinned={false}
                                        onPin={() => setPinnedId('local')} isLarge={false} />
                                )}
                                {peerList.filter(([sid]) => sid !== pinnedId).map(([sid, peer]) => (
                                    <VideoTile key={sid} stream={peer.stream} user={peer.user}
                                        isLocal={false} mediaState={peer.mediaState} isPinned={false}
                                        onPin={() => setPinnedId(sid)} isLarge={false} />
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
                            localMediaState={{ audioOff: !audioEnabled, videoOff: !videoEnabled, screen: isScreenSharing }}
                            hostId={roomInfo?.hostId}
                            onClose={() => setShowParticipants(false)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* ── Bottom controls ────────────────────────────────────────── */}
            <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-3 sm:px-6 py-3">
                <div className="flex items-center justify-between max-w-3xl mx-auto gap-1 sm:gap-2">
                    {/* Left: media controls */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <CtrlBtn
                            onClick={toggleAudio}
                            active={audioEnabled}
                            onIcon={<Mic className="w-5 h-5" />}
                            offIcon={<MicOff className="w-5 h-5" />}
                            label={audioEnabled ? 'Mute' : 'Unmute'}
                            redWhenOff
                        />
                        <CtrlBtn
                            onClick={toggleVideo}
                            active={videoEnabled}
                            onIcon={<Video className="w-5 h-5" />}
                            offIcon={<VideoOff className="w-5 h-5" />}
                            label={videoEnabled ? 'Stop video' : 'Start video'}
                            redWhenOff
                        />
                        <button
                            onClick={toggleScreenShare}
                            disabled={!screenShareSupported}
                            title={!screenShareSupported ? 'Screen sharing requires a desktop browser' : isScreenSharing ? 'Stop sharing' : 'Share screen'}
                            className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-colors ${
                                !screenShareSupported
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : isScreenSharing
                                    ? 'bg-green-900 bg-opacity-50 text-green-400 hover:bg-opacity-70'
                                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                            <span className="text-[10px] font-medium hidden sm:block">{isScreenSharing ? 'Stop share' : 'Share'}</span>
                        </button>
                    </div>

                    {/* Center: extras */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={toggleHand}
                            className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-colors ${
                                handRaised ? 'bg-yellow-900 bg-opacity-50 text-yellow-400' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            <Hand className="w-5 h-5" />
                            <span className="text-[10px] font-medium hidden sm:block">{handRaised ? 'Lower' : 'Hand'}</span>
                        </button>

                        {/* Reactions */}
                        <div className="relative">
                            <button
                                onClick={() => setShowReactions(p => !p)}
                                className="flex flex-col items-center gap-1 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                            >
                                <Smile className="w-5 h-5" />
                                <span className="text-[10px] font-medium hidden sm:block">React</span>
                            </button>
                            <AnimatePresence>
                                {showReactions && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.92 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.92 }}
                                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-2xl p-2 flex gap-1 shadow-2xl z-30"
                                    >
                                        {REACTIONS.map(emoji => (
                                            <button key={emoji} onClick={() => sendReaction(emoji)}
                                                className="text-xl sm:text-2xl p-1.5 sm:p-2 hover:bg-gray-700 rounded-xl transition-colors">
                                                {emoji}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right: panels + leave */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <CtrlBtn
                            onClick={() => { setShowChat(p => !p); setShowParticipants(false); }}
                            active={showChat}
                            onIcon={<MessageSquare className="w-5 h-5" />}
                            offIcon={<MessageSquare className="w-5 h-5" />}
                            label="Chat"
                            badge={showChat ? 0 : unreadChat}
                        />
                        <CtrlBtn
                            onClick={() => { setShowParticipants(p => !p); setShowChat(false); }}
                            active={showParticipants}
                            onIcon={<Users className="w-5 h-5" />}
                            offIcon={<Users className="w-5 h-5" />}
                            label="People"
                        />
                        <button
                            onClick={leaveRoom}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors ml-1"
                        >
                            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm">Leave</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoRoom;