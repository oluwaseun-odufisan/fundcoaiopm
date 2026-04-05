// src/pages/MeetingLobby.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
    Video, VideoOff, Mic, MicOff, Plus, Link2, Users, Clock,
    Calendar, ChevronRight, Copy, Check, ArrowLeft, Search,
    Sparkles, Globe, Lock, Settings2, Bell, X, Hash
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

// ── Camera Preview ────────────────────────────────────────────────────────────
const CameraPreview = ({ videoEnabled, audioEnabled, onToggleVideo, onToggleAudio }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const startPreview = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                console.warn('Camera preview unavailable:', err.message);
            }
        };
        startPreview();
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []);

    useEffect(() => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(t => { t.enabled = videoEnabled; });
        }
    }, [videoEnabled]);

    useEffect(() => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(t => { t.enabled = audioEnabled; });
        }
    }, [audioEnabled]);

    return (
        <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden">
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-300 ${videoEnabled ? 'opacity-100' : 'opacity-0'}`}
            />
            {!videoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                        <VideoOff className="w-8 h-8 text-gray-400" />
                    </div>
                </div>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                    onClick={onToggleAudio}
                    className={`p-3 rounded-full transition-all duration-200 shadow-lg ${audioEnabled ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30' : 'bg-red-500 text-white hover:bg-red-600'}`}
                >
                    {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                    onClick={onToggleVideo}
                    className={`p-3 rounded-full transition-all duration-200 shadow-lg ${videoEnabled ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30' : 'bg-red-500 text-white hover:bg-red-600'}`}
                >
                    {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
            </div>
            <div className="absolute top-3 right-3">
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-sm text-white text-xs rounded-full">
                    <span className={`w-1.5 h-1.5 rounded-full ${audioEnabled ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    Preview
                </span>
            </div>
        </div>
    );
};

// ── Create Room Modal ─────────────────────────────────────────────────────────
const CreateRoomModal = ({ onClose, onCreated, users, token }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [invitedUsers, setInvitedUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [muteOnEntry, setMuteOnEntry] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const filteredUsers = users.filter(u =>
        getFullName(u).toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const toggleUser = (id) => setInvitedUsers(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

    const handleCreate = async () => {
        if (!name.trim()) { toast.error('Please enter a meeting name'); return; }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Meeting</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Start an instant video conference</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Meeting Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Weekly Standup"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            maxLength={100}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="What's this meeting about?"
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                            Invite Teammates ({invitedUsers.length} selected)
                        </label>
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search teammates…"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                        </div>
                        <div className="max-h-44 overflow-y-auto space-y-1 scrollbar-thin">
                            {filteredUsers.map(u => {
                                const sel = invitedUsers.includes(u._id);
                                return (
                                    <div key={u._id} onClick={() => toggleUser(u._id)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${sel ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            {getFullName(u).charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{getFullName(u)}</p>
                                            <p className="text-xs text-gray-400 truncate">{u.position || u.email}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${sel ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {sel && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 cursor-pointer">
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Mute participants on entry</p>
                            <p className="text-xs text-gray-400">Everyone joins muted</p>
                        </div>
                        <div
                            onClick={() => setMuteOnEntry(p => !p)}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${muteOnEntry ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${muteOnEntry ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </label>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isLoading || !name.trim()}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all ${name.trim() && !isLoading ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'}`}
                    >
                        <Video className="w-4 h-4" />
                        {isLoading ? 'Creating…' : 'Start Meeting'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ── Room Card ─────────────────────────────────────────────────────────────────
const RoomCard = ({ room, onJoin, currentUserId }) => {
    const [copied, setCopied] = useState(false);
    const activeCount = room.participants?.filter(p => p.isActive).length || 0;
    const isHost = room.host?._id === currentUserId || room.host === currentUserId;

    const copyLink = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`${window.location.origin}/room/${room.roomId}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            whileHover={{ y: -2 }}
            onClick={() => onJoin(room.roomId)}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 cursor-pointer hover:shadow-lg transition-all duration-200 group"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${room.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{room.name}</h3>
                        {isHost && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">Host</span>}
                    </div>
                    {room.description && <p className="text-xs text-gray-400 truncate">{room.description}</p>}
                </div>
                <button
                    onClick={copyLink}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-2"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>{activeCount} {activeCount === 1 ? 'person' : 'people'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Hash className="w-3.5 h-3.5" />
                        <span className="font-mono">{room.roomId}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    Join <ChevronRight className="w-3 h-3" />
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <div className="flex -space-x-1">
                    {room.host && (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[8px] font-bold border border-white dark:border-gray-800">
                            {getFullName(room.host).charAt(0)}
                        </div>
                    )}
                </div>
                <span>Hosted by {getFullName(room.host)}</span>
                <span>·</span>
                <span>{moment(room.createdAt).fromNow()}</span>
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
    const [tab, setTab] = useState('lobby'); // lobby | recent

    const fetchRooms = useCallback(async () => {
        try {
            const [activeRes, myRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/rooms/active`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/api/rooms`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            // Merge unique rooms
            const activeRooms = activeRes.data.rooms || [];
            const myRooms = myRes.data.rooms || [];
            const allRooms = [...activeRooms];
            myRooms.forEach(r => { if (!allRooms.find(ar => ar.roomId === r.roomId)) allRooms.push(r); });
            setRooms(allRooms);
        } catch (err) {
            console.error('Fetch rooms error:', err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const fetchUsers = useCallback(async () => {
        try {
            // We need the chats/init or a dedicated users endpoint
            const res = await axios.get(`${API_BASE_URL}/api/chats/init`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.users) setAllUsers(res.data.users.filter(u => u._id !== user?._id));
        } catch {}
    }, [token, user]);

    useEffect(() => {
        fetchRooms();
        fetchUsers();
        const interval = setInterval(fetchRooms, 15000);
        return () => clearInterval(interval);
    }, [fetchRooms, fetchUsers]);

    // Socket: listen for room invitations
    useEffect(() => {
        const handleInvite = (e) => {
            const { room, from } = e.detail;
            toast.custom((t) => (
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl p-4 max-w-sm"
                >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">📹 Meeting Invite</p>
                    <p className="text-xs text-gray-500 mb-3">{from?.name} invited you to <strong>{room.name}</strong></p>
                    <div className="flex gap-2">
                        <button onClick={() => { navigate(`/room/${room.roomId}`); toast.dismiss(t.id); }}
                            className="flex-1 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700">
                            Join Now
                        </button>
                        <button onClick={() => toast.dismiss(t.id)}
                            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-xl">
                            Decline
                        </button>
                    </div>
                </motion.div>
            ), { duration: 15000, position: 'top-right' });
        };
        window.addEventListener('roomInvitation', handleInvite);
        return () => window.removeEventListener('roomInvitation', handleInvite);
    }, [navigate]);

    const handleJoinByCode = () => {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans">
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
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <Video className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-gray-900 dark:text-white">MeetRoom</h1>
                            <p className="text-[11px] text-gray-400">Video Conferencing</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchRooms} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                            <Settings2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                                {getFullName(user).charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">{user?.firstName}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: camera preview + quick actions */}
                    <div className="lg:col-span-1 space-y-5">
                        <CameraPreview
                            videoEnabled={videoEnabled}
                            audioEnabled={audioEnabled}
                            onToggleVideo={() => setVideoEnabled(p => !p)}
                            onToggleAudio={() => setAudioEnabled(p => !p)}
                        />

                        {/* Quick actions */}
                        <div className="grid grid-cols-1 gap-3">
                            <motion.button
                                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                onClick={() => setShowCreate(true)}
                                className="flex items-center gap-4 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-200"
                            >
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold">New Meeting</p>
                                    <p className="text-xs text-blue-200">Start an instant room</p>
                                </div>
                                <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                            </motion.button>

                            <div className="flex gap-2">
                                <input
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
                                    placeholder="Enter code (abc-defg-hij)"
                                    className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-gray-400 font-mono"
                                />
                                <button
                                    onClick={handleJoinByCode}
                                    className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors font-semibold text-sm flex-shrink-0"
                                >
                                    Join
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Overview</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeRooms.length}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Active Rooms</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {activeRooms.reduce((sum, r) => sum + (r.participants?.filter(p => p.isActive).length || 0), 0)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">In Meetings</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: room list */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                            {[
                                { key: 'lobby', label: 'Active Rooms', count: activeRooms.length },
                                { key: 'recent', label: 'Recent', count: recentRooms.length },
                            ].map(({ key, label, count }) => (
                                <button
                                    key={key}
                                    onClick={() => setTab(key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${tab === key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                >
                                    {label}
                                    {count > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === key ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : tab === 'lobby' ? (
                            activeRooms.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                                        <Video className="w-7 h-7 text-blue-400" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-2">No active meetings</h3>
                                    <p className="text-sm text-gray-400 mb-6">Start a new meeting or wait for an invite</p>
                                    <button
                                        onClick={() => setShowCreate(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md"
                                    >
                                        <Plus className="w-4 h-4" /> Start Meeting
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <AnimatePresence>
                                        {activeRooms.map((room, i) => (
                                            <motion.div
                                                key={room.roomId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <RoomCard room={room} onJoin={(id) => navigate(`/room/${id}`)} currentUserId={user?._id || user?.id} />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )
                        ) : (
                            recentRooms.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-sm text-gray-400">No recent meetings</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {recentRooms.map((room, i) => (
                                        <motion.div key={room.roomId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                            <RoomCard room={room} onJoin={(id) => navigate(`/room/${id}`)} currentUserId={user?._id || user?.id} />
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