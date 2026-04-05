// src/pages/MeetingLobby.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
    Video, VideoOff, Mic, MicOff, Plus, Users, Clock,
    ChevronRight, Copy, Check, ArrowLeft, Search,
    X, Hash, Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import moment from 'moment-timezone';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

const getFullName = (user) => {
    if (!user) return 'Unknown';
    if (user.fullName) return user.fullName.trim();
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
};

// ── Small camera preview ───────────────────────────────────────────────────────
const CameraPreview = ({ videoEnabled, audioEnabled, onToggleVideo, onToggleAudio }) => {
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
                // Camera unavailable — that's fine
            }
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
        <div className="relative w-full aspect-video bg-gray-800 rounded-xl overflow-hidden">
            <video
                ref={videoRef}
                autoPlay muted playsInline
                className={`w-full h-full object-cover ${videoEnabled ? '' : 'hidden'}`}
                style={{ transform: 'scaleX(-1)' }}
            />
            {!videoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <VideoOff className="w-8 h-8 text-gray-500" />
                </div>
            )}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                    onClick={onToggleAudio}
                    className={`p-2.5 rounded-full transition-colors ${audioEnabled ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-600 text-white hover:bg-red-700'}`}
                >
                    {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                    onClick={onToggleVideo}
                    className={`p-2.5 rounded-full transition-colors ${videoEnabled ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-600 text-white hover:bg-red-700'}`}
                >
                    {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
            </div>
            <div className="absolute top-2 right-2">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-black bg-opacity-60 text-white text-[10px] rounded-full">
                    <span className={`w-1.5 h-1.5 rounded-full ${audioEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
                    Preview
                </span>
            </div>
        </div>
    );
};

// ── Create Room Modal ──────────────────────────────────────────────────────────
const CreateRoomModal = ({ onClose, onCreated, users, token }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [invitedUsers, setInvitedUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [muteOnEntry, setMuteOnEntry] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const nameRef = useRef(null);

    useEffect(() => { nameRef.current?.focus(); }, []);

    const filtered = users.filter(u =>
        getFullName(u).toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const toggleUser = (id) =>
        setInvitedUsers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

    const handleCreate = async () => {
        if (!name.trim()) { toast.error('Enter a meeting name'); return; }
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/rooms`, {
                name: name.trim(),
                description: description.trim(),
                type: 'instant',
                invitedUsers,
                settings: { muteOnEntry },
            }, { headers: { Authorization: `Bearer ${token}` } });
            onCreated(res.data.room);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create room');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">New Meeting</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Start an instant video room</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                            Meeting Name *
                        </label>
                        <input
                            ref={nameRef}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            placeholder="e.g. Weekly Standup"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="What's this meeting about?"
                            rows={2}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            maxLength={300}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                            Invite Teammates ({invitedUsers.length} selected)
                        </label>
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search teammates…"
                                className="w-full pl-8 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                            {filtered.length === 0 && (
                                <p className="text-center text-gray-400 text-xs py-4">No teammates found</p>
                            )}
                            {filtered.map(u => {
                                const sel = invitedUsers.includes(u._id);
                                return (
                                    <div key={u._id} onClick={() => toggleUser(u._id)}
                                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${sel ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            {getFullName(u).charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{getFullName(u)}</p>
                                            <p className="text-xs text-gray-400 truncate">{u.position || u.email}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${sel ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {sel && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 cursor-pointer"
                        onClick={() => setMuteOnEntry(p => !p)}
                    >
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Mute on entry</p>
                            <p className="text-xs text-gray-400">Everyone joins muted</p>
                        </div>
                        <div className={`relative w-10 h-5.5 rounded-full transition-colors ${muteOnEntry ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                            style={{ height: '22px', width: '40px' }}>
                            <div className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${muteOnEntry ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isLoading || !name.trim()}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors ${
                            name.trim() && !isLoading
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                        }`}
                    >
                        <Video className="w-4 h-4" />
                        {isLoading ? 'Creating…' : 'Start Meeting'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ── Room Card ──────────────────────────────────────────────────────────────────
const RoomCard = ({ room, onJoin, currentUserId }) => {
    const [copied, setCopied] = useState(false);
    const activePeers = room.participants?.filter(p => p.isActive).length || 0;
    const isHost = room.host?._id === currentUserId || room.host === currentUserId ||
        room.host?._id?.toString() === currentUserId?.toString();
    const isActive = room.status === 'active' || room.status === 'waiting';

    const copyLink = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`${window.location.origin}/room/${room.roomId}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            whileHover={{ y: -1 }}
            onClick={() => onJoin(room.roomId)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-all duration-150 group"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{room.name}</h3>
                        {isHost && (
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                                Host
                            </span>
                        )}
                        {room.isLocked && <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                    </div>
                    {room.description && (
                        <p className="text-xs text-gray-400 truncate ml-4">{room.description}</p>
                    )}
                </div>
                <button
                    onClick={copyLink}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Users className="w-3.5 h-3.5" />
                        {activePeers} {activePeers === 1 ? 'person' : 'people'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 font-mono">
                        <Hash className="w-3 h-3" />
                        {room.roomId}
                    </span>
                </div>
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                        ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}>
                    {isActive ? 'Join' : 'Ended'} <ChevronRight className="w-3 h-3" />
                </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">
                    {getFullName(room.host).charAt(0)}
                </div>
                <span className="truncate">
                    {getFullName(room.host)} · {moment(room.createdAt).fromNow()}
                </span>
            </div>
        </motion.div>
    );
};

// ── Main Lobby ─────────────────────────────────────────────────────────────────
const MeetingLobby = () => {
    const { user, onLogout } = useOutletContext();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [showCreate, setShowCreate] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [rooms, setRooms] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [tab, setTab] = useState('active');

    const fetchRooms = useCallback(async () => {
        try {
            const [activeRes, myRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/rooms/active`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/api/rooms`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const active = activeRes.data.rooms || [];
            const mine = myRes.data.rooms || [];
            // Deduplicate
            const seen = new Set(active.map(r => r.roomId));
            mine.forEach(r => { if (!seen.has(r.roomId)) active.push(r); });
            setRooms(active);
        } catch {}
        finally { setIsLoading(false); }
    }, [token]);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/chats/init`, { headers: { Authorization: `Bearer ${token}` } });
            const uid = user?._id || user?.id;
            setAllUsers((res.data.users || []).filter(u => u._id !== uid));
        } catch {}
    }, [token, user]);

    useEffect(() => {
        fetchRooms();
        fetchUsers();
        const interval = setInterval(fetchRooms, 15000);
        return () => clearInterval(interval);
    }, [fetchRooms, fetchUsers]);

    const handleJoin = () => {
        const code = joinCode.trim().toLowerCase();
        if (!code) { toast.error('Enter a meeting code'); return; }
        navigate(`/room/${code}`);
    };

    const handleRoomCreated = (room) => {
        setShowCreate(false);
        navigate(`/room/${room.roomId}`);
    };

    const activeRooms = rooms.filter(r => r.status === 'active' || r.status === 'waiting');
    const recentRooms = rooms.filter(r => r.status === 'ended').slice(0, 10);
    const uid = user?._id || user?.id;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
            <Toaster position="top-right" />
            <AnimatePresence>
                {showCreate && (
                    <CreateRoomModal
                        onClose={() => setShowCreate(false)}
                        onCreated={handleRoomCreated}
                        users={allUsers}
                        token={token}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3.5">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/')}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Video className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white">MeetRoom</h1>
                            <p className="text-[11px] text-gray-400">Video conferencing</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {getFullName(user).charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">{user?.firstName}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left panel */}
                    <div className="space-y-4">
                        <CameraPreview
                            videoEnabled={videoEnabled}
                            audioEnabled={audioEnabled}
                            onToggleVideo={() => setVideoEnabled(p => !p)}
                            onToggleAudio={() => setAudioEnabled(p => !p)}
                        />

                        {/* Start meeting button */}
                        <button
                            onClick={() => setShowCreate(true)}
                            className="w-full flex items-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                        >
                            <div className="w-9 h-9 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Plus className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold">New Meeting</p>
                                <p className="text-xs text-blue-200">Start an instant room</p>
                            </div>
                            <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                        </button>

                        {/* Join by code */}
                        <div className="flex gap-2">
                            <input
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                                placeholder="Meeting code"
                                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 font-mono"
                            />
                            <button
                                onClick={handleJoin}
                                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold text-sm flex-shrink-0"
                            >
                                Join
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Overview</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeRooms.length}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Active</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {activeRooms.reduce((s, r) => s + (r.participants?.filter(p => p.isActive).length || 0), 0)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">In meetings</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right panel — room list */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                            {[
                                { key: 'active', label: 'Active Rooms', count: activeRooms.length },
                                { key: 'recent', label: 'Recent', count: recentRooms.length },
                            ].map(({ key, label, count }) => (
                                <button key={key} onClick={() => setTab(key)}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                                        tab === key
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                                >
                                    {label}
                                    {count > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                            tab === key ? 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 text-blue-600 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : tab === 'active' ? (
                            activeRooms.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                                        <Video className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">No active meetings</h3>
                                    <p className="text-xs text-gray-400 mb-5">Start a new one or wait for an invite</p>
                                    <button onClick={() => setShowCreate(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                                        <Plus className="w-4 h-4" /> New Meeting
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <AnimatePresence>
                                        {activeRooms.map((room, i) => (
                                            <motion.div key={room.roomId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                                <RoomCard room={room} onJoin={id => navigate(`/room/${id}`)} currentUserId={uid} />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )
                        ) : (
                            recentRooms.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                                    <p className="text-sm text-gray-400">No recent meetings</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {recentRooms.map((room, i) => (
                                        <motion.div key={room.roomId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                            <RoomCard room={room} onJoin={id => navigate(`/room/${id}`)} currentUserId={uid} />
                                        </motion.div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MeetingLobby;