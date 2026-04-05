// src/pages/VideoRoomComponents.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Mic, MicOff, Video, VideoOff, Pin, PinOff,
    MessageSquare, Users, Send, X, Crown,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const getFullName = (user) => {
    if (!user) return 'Guest';
    if (typeof user === 'string') return user;
    if (user.name) return user.name;
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Guest';
};

// ── Video Tile ─────────────────────────────────────────────────────────────────
// KEY FIX: video element is always in the DOM. srcObject is set imperatively
// via useEffect so stream changes are applied instantly without remounting.
// This is the correct WebRTC pattern — never conditionally render the <video> tag.
export const VideoTile = React.memo(({
    stream, user, isLocal, mediaState, isPinned, onPin, isLarge, isSpeaking
}) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (stream && video.srcObject !== stream) {
            video.srcObject = stream;
            video.play().catch(() => {});
        } else if (!stream) {
            video.srcObject = null;
        }
    }, [stream]);

    const hasVideo = !!stream && !mediaState?.videoOff;
    const isMuted = mediaState?.audioOff;
    const name = getFullName(user);

    return (
        <div className={`
            relative overflow-hidden bg-gray-800 rounded-xl
            ${isSpeaking ? 'ring-2 ring-green-400' : ''}
            ${isPinned ? 'ring-2 ring-blue-500' : ''}
            ${isLarge ? 'h-full w-full' : 'w-full aspect-video'}
        `}>
            {/* Video always mounted in DOM */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className={`w-full h-full object-cover ${hasVideo ? '' : 'hidden'}`}
                style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
            />

            {/* No-video avatar */}
            {!hasVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 gap-2">
                    <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-400 text-xs">{name}</span>
                </div>
            )}

            {/* Pin button on hover */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                <button
                    onClick={() => onPin?.()}
                    className="p-1.5 bg-black bg-opacity-60 rounded-lg text-white hover:bg-opacity-90 transition-colors"
                >
                    {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* Bottom bar — always visible */}
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-black bg-opacity-50 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white text-xs font-medium truncate">
                        {name}{isLocal ? ' (You)' : ''}
                    </span>
                    {isSpeaking && !isMuted && (
                        <span className="flex gap-0.5 items-end h-3 flex-shrink-0">
                            {[40, 70, 50].map((h, i) => (
                                <span key={i} className="w-0.5 bg-green-400 rounded-full animate-bounce"
                                    style={{ height: `${h}%`, animationDelay: `${i * 0.12}s` }} />
                            ))}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {isMuted && (
                        <div className="p-0.5 bg-red-600 rounded"><MicOff className="w-3 h-3 text-white" /></div>
                    )}
                    {mediaState?.videoOff && (
                        <div className="p-0.5 bg-gray-600 rounded"><VideoOff className="w-3 h-3 text-white" /></div>
                    )}
                </div>
            </div>
        </div>
    );
});
VideoTile.displayName = 'VideoTile';

// ── Floating Reaction ──────────────────────────────────────────────────────────
export const FloatingReaction = ({ emoji, userName, onDone }) => {
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
            <span className="text-5xl">{emoji}</span>
            <span className="text-xs text-white bg-black bg-opacity-60 px-2 py-0.5 rounded-full">{userName}</span>
        </motion.div>
    );
};

// ── Chat Panel ─────────────────────────────────────────────────────────────────
// FIX: messages state lives in parent (VideoRoom). This component is purely
// presentational — it receives messages as a prop so no stale closure issue.
// Messages update instantly because the parent's state setter is always fresh.
export const ChatPanel = ({ messages, onSend, onClose, currentUser }) => {
    const [msg, setMsg] = useState('');
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const myId = currentUser?._id || currentUser?.id;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]); // scroll when count changes

    useEffect(() => {
        // Focus input on open
        const t = setTimeout(() => inputRef.current?.focus(), 80);
        return () => clearTimeout(t);
    }, []);

    const handleSend = () => {
        const text = msg.trim();
        if (!text) return;
        onSend(text);
        setMsg('');
        inputRef.current?.focus();
    };

    return (
        <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.18 }}
            className="absolute right-0 top-0 bottom-0 w-72 sm:w-80 bg-gray-900 border-l border-gray-700 flex flex-col z-20"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-white">Meeting Chat</span>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 overscroll-contain">
                {messages.length === 0 && (
                    <p className="text-center text-gray-500 text-xs pt-8">No messages yet. Say hello!</p>
                )}
                {messages.map((m, i) => {
                    if (m.type === 'system') {
                        return (
                            <div key={i} className="flex justify-center my-2">
                                <span className="text-[10px] text-gray-500 bg-gray-800 px-3 py-1 rounded-full">{m.message}</span>
                            </div>
                        );
                    }
                    const senderId = m.sender?._id || m.sender;
                    const isMe = senderId === myId || senderId?.toString() === myId?.toString();
                    return (
                        <div key={i} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && (
                                <span className="text-[10px] text-gray-400 px-1 font-medium">{m.senderName}</span>
                            )}
                            <div className={`max-w-[85%] px-3 py-2 text-sm break-words leading-relaxed rounded-2xl ${
                                isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-700 text-gray-100 rounded-bl-sm'
                            }`}>
                                {m.message}
                            </div>
                            {m.timestamp && (
                                <span className="text-[10px] text-gray-600 px-1">
                                    {new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef} className="h-px" />
            </div>

            <div className="px-3 py-3 border-t border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2.5">
                    <input
                        ref={inputRef}
                        value={msg}
                        onChange={e => setMsg(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Type a message…"
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-gray-500"
                        maxLength={1000}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!msg.trim()}
                        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${msg.trim() ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600 cursor-not-allowed'}`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ── Participants Panel ─────────────────────────────────────────────────────────
export const ParticipantsPanel = ({ peers, localUser, localMediaState, hostId, onClose }) => {
    const allPeers = [
        { socketId: 'local', user: localUser, mediaState: localMediaState || {}, isLocal: true },
        ...Object.entries(peers).map(([sid, p]) => ({ socketId: sid, user: p.user, mediaState: p.mediaState || {}, isLocal: false })),
    ];

    return (
        <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.18 }}
            className="absolute right-0 top-0 bottom-0 w-64 sm:w-72 bg-gray-900 border-l border-gray-700 flex flex-col z-20"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-white">Participants ({allPeers.length})</span>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                {allPeers.map((peer) => {
                    const uid = peer.user?._id || peer.user?.id;
                    const isHost = uid === hostId || uid?.toString() === hostId?.toString();
                    const name = getFullName(peer.user);
                    return (
                        <div key={peer.socketId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium text-white truncate">
                                        {name}{peer.isLocal ? ' (You)' : ''}
                                    </p>
                                    {isHost && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                                </div>
                                <p className="text-[11px] text-gray-500">
                                    {peer.mediaState?.audioOff ? 'Muted' : 'Unmuted'}
                                    {peer.mediaState?.screen ? ' · Sharing' : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
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