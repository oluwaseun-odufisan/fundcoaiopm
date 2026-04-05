// src/pages/VideoRoom.jsx
// Full WebRTC mesh conference room — no external APIs
// Uses free STUN servers + Socket.IO signaling on your own server
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
    Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff,
    MessageSquare, Users, Settings, MoreVertical, Hand, Smile,
    Copy, Check, Maximize2, Minimize2, Pin, PinOff, Grid,
    Crown, Shield, Volume2, VolumeX, ChevronUp, ChevronDown,
    Send, X, AlertCircle, Loader2, Lock, Unlock, UserMinus,
    LayoutGrid, Columns, Maximize,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io as socketIO } from 'socket.io-client';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
const SOCKET_URL = API_BASE_URL;

// ── STUN/TURN config (free STUN servers, no external API needed) ──────────────
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.relay.metered.ca:80' },
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

// ── Video Tile ────────────────────────────────────────────────────────────────
const VideoTile = React.memo(({ stream, user, isLocal, mediaState, isPinned, onPin, isLarge, isSpeaking }) => {
    const videoRef = useRef(null);
    const [isVideoActive, setIsVideoActive] = useState(true);

    useEffect(() => {
        if (!videoRef.current || !stream) return;
        videoRef.current.srcObject = stream;
    }, [stream]);

    useEffect(() => {
        if (!stream) return;
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
            setIsVideoActive(videoTracks[0].enabled && !mediaState?.videoOff);
        }
    }, [stream, mediaState]);

    const hasVideo = stream && !mediaState?.videoOff;
    const isMuted = mediaState?.audioOff;
    const name = getFullName(user);

    return (
        <div className={`relative rounded-2xl overflow-hidden bg-gray-800 transition-all duration-300 ${isSpeaking ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900' : ''} ${isLarge ? 'h-full' : 'aspect-video'}`}>
            {/* Video element */}
            {hasVideo ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="w-full h-full object-cover"
                    style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                        {name.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}

            {/* Overlay: name + controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => onPin?.()}
                        className="p-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                        title={isPinned ? 'Unpin' : 'Pin'}
                    >
                        {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Always-visible bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white text-xs font-semibold truncate">
                        {name}{isLocal ? ' (You)' : ''}
                    </span>
                    {isSpeaking && !isMuted && (
                        <span className="flex gap-0.5 items-end h-3">
                            {[1, 2, 3].map(i => (
                                <span key={i} className="w-0.5 bg-green-400 rounded-full animate-bounce" style={{ height: `${(i * 30) + 20}%`, animationDelay: `${i * 0.1}s` }} />
                            ))}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {isMuted && (
                        <div className="p-1 bg-red-500/90 rounded-md">
                            <MicOff className="w-3 h-3 text-white" />
                        </div>
                    )}
                    {mediaState?.videoOff && (
                        <div className="p-1 bg-gray-600/90 rounded-md">
                            <VideoOff className="w-3 h-3 text-white" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

// ── Floating Reaction ─────────────────────────────────────────────────────────
const FloatingReaction = ({ emoji, userName, onDone }) => {
    useEffect(() => {
        const t = setTimeout(onDone, 3500);
        return () => clearTimeout(t);
    }, [onDone]);
    return (
        <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -120, scale: [0.5, 1.2, 1, 0.8] }}
            transition={{ duration: 3.5 }}
            className="fixed bottom-32 right-8 flex flex-col items-center gap-1 pointer-events-none z-50"
        >
            <span className="text-5xl drop-shadow-lg">{emoji}</span>
            <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">{userName}</span>
        </motion.div>
    );
};

// ── In-room Chat Panel ─────────────────────────────────────────────────────────
const ChatPanel = ({ messages, onSend, onClose, currentUser }) => {
    const [msg, setMsg] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!msg.trim()) return;
        onSend(msg.trim());
        setMsg('');
    };

    return (
        <motion.div
            initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-700 flex flex-col z-20"
        >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">Meeting Chat</h3>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
                {messages.length === 0 && (
                    <p className="text-center text-gray-500 text-xs pt-8">No messages yet. Say hello!</p>
                )}
                {messages.map((m, i) => {
                    const isSystem = m.type === 'system';
                    const isMe = m.sender === currentUser?.id || m.sender === currentUser?._id;
                    if (isSystem) {
                        return (
                            <div key={i} className="flex justify-center">
                                <span className="text-[10px] text-gray-500 bg-gray-800 px-3 py-1 rounded-full">{m.message}</span>
                            </div>
                        );
                    }
                    return (
                        <div key={i} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && <span className="text-[10px] text-gray-400 px-2">{m.senderName}</span>}
                            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-700 text-gray-100 rounded-bl-sm'}`}>
                                {m.message}
                            </div>
                            <span className="text-[10px] text-gray-600 px-2">
                                {new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <div className="px-3 py-3 border-t border-gray-700">
                <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2.5">
                    <input
                        value={msg}
                        onChange={e => setMsg(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Type a message…"
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-gray-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!msg.trim()}
                        className={`p-1.5 rounded-lg transition-colors ${msg.trim() ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600'}`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ── Participants Panel ─────────────────────────────────────────────────────────
const ParticipantsPanel = ({ peers, localUser, hostId, mySocketId, onKick, onMute, onClose }) => {
    const allPeers = [
        { socketId: 'local', user: localUser, mediaState: { audioOff: false, videoOff: false }, isLocal: true },
        ...Object.values(peers),
    ];

    return (
        <motion.div
            initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="absolute right-0 top-0 bottom-0 w-72 bg-gray-900 border-l border-gray-700 flex flex-col z-20"
        >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">Participants ({allPeers.length})</h3>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
                {allPeers.map((peer) => {
                    const isHost = peer.user?.id === hostId || peer.socketId === hostId;
                    const name = getFullName(peer.user);
                    return (
                        <div key={peer.socketId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 group transition-colors">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium text-white truncate">{name}{peer.isLocal ? ' (You)' : ''}</p>
                                    {isHost && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                                </div>
                                <p className="text-[11px] text-gray-500">
                                    {peer.mediaState?.audioOff ? '🔇 Muted' : '🎙 Speaking'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                {peer.mediaState?.audioOff && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                                {peer.mediaState?.videoOff && <VideoOff className="w-3.5 h-3.5 text-gray-500" />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export { VideoTile, FloatingReaction, ChatPanel, ParticipantsPanel };