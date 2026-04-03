// src/pages/TeamChat.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
    Send, Smile, Paperclip, Users, Plus, X, Search, Edit2, Trash2,
    ArrowLeft, ArrowDown, Mic, Check, CheckCheck, Reply, CornerUpLeft,
    Phone, Video as VideoIcon, MoreVertical, ImageIcon, FileText as FileIcon,
    Music, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import toast, { Toaster } from 'react-hot-toast';
import moment from 'moment-timezone';
import { debounce } from 'lodash';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
const SOCKET_URL = API_BASE_URL;
const TZ = 'Africa/Lagos';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getFullName = (user) => {
    if (!user) return 'Unknown';
    if (user.fullName) return user.fullName.trim();
    if (user.firstName || user.lastName)
        return `${user.firstName || ''} ${user.lastName || ''} ${user.otherName || ''}`.trim();
    return user.name?.trim() || 'Unknown';
};

const getInitials = (user) => {
    if (!user) return '?';
    const name = user.firstName || user.name || '?';
    const words = name.trim().split(' ');
    return words.length === 1
        ? words[0].slice(0, 2).toUpperCase()
        : (words[0][0] + (words[1]?.[0] || '')).toUpperCase();
};

const formatChatTime = (ts) => {
    if (!ts) return '';
    const m = moment(ts).tz(TZ);
    if (!m.isValid()) return '';
    const now = moment().tz(TZ);
    const diffDays = now.clone().startOf('day').diff(m.clone().startOf('day'), 'days');
    if (diffDays === 0) return m.format('h:mm A');
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return m.format('ddd');
    return m.format('DD/MM/YY');
};

const formatMsgTime = (ts) => {
    if (!ts) return '';
    const m = moment(ts).tz(TZ);
    return m.isValid() ? m.format('h:mm A') : '';
};

const formatDateSep = (ts) => {
    if (!ts) return '';
    const m = moment(ts).tz(TZ);
    if (!m.isValid()) return '';
    const diffDays = moment().tz(TZ).startOf('day').diff(m.clone().startOf('day'), 'days');
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return m.format('dddd');
    return m.format('MMMM D, YYYY');
};

const formatLastSeen = (ts) => {
    if (!ts) return 'last seen a long time ago';
    const m = moment(ts).tz(TZ);
    if (!m.isValid()) return 'last seen a long time ago';
    const diffMins = moment().diff(m, 'minutes');
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `last seen ${diffMins}m ago`;
    const diffHours = moment().diff(m, 'hours');
    if (diffHours < 24) return `last seen today at ${m.format('h:mm A')}`;
    if (diffHours < 48) return `last seen yesterday at ${m.format('h:mm A')}`;
    return `last seen ${m.format('DD/MM/YY')}`;
};

// ─── Avatar component ─────────────────────────────────────────────────────────
const Avatar = ({ user, size = 10, showOnline = false }) => {
    const sz = `w-${size} h-${size}`;
    return (
        <div className={`relative flex-shrink-0 ${sz} rounded-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-900 flex items-center justify-center text-white font-semibold shadow-sm`}
            style={{ fontSize: size <= 8 ? '0.7rem' : '0.85rem' }}>
            {user?.avatar
                ? <img src={user.avatar} alt="" className={`${sz} rounded-full object-cover`} />
                : getInitials(user)
            }
            {showOnline && user?.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
            )}
        </div>
    );
};

// ─── Date separator ───────────────────────────────────────────────────────────
const DateSeparator = ({ date }) => (
    <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-[#F8F9FA] dark:bg-gray-900 px-2 flex-shrink-0">
            {formatDateSep(date)}
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
);

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingBubble = ({ name }) => (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="flex items-end gap-2 my-1">
        <div className="px-4 py-2.5 bg-white dark:bg-gray-700 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
                <motion.span key={i} className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-400 rounded-full block"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
            ))}
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">{name}</span>
    </motion.div>
);

// ─── Group Modal ──────────────────────────────────────────────────────────────
const GroupModal = ({ isAddMode, selectedChat, users, onClose, onCreateGroup, onAddMembers }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [modalSearch, setModalSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const searchRef = useRef(null);
    useEffect(() => { setTimeout(() => searchRef.current?.focus(), 80); }, []);
    const existingMemberIds = useMemo(() => {
        if (isAddMode && selectedChat?.members) return new Set(selectedChat.members.map((m) => m._id));
        return new Set();
    }, [isAddMode, selectedChat]);
    const filteredUsers = useMemo(() => {
        const q = modalSearch.trim().toLowerCase();
        return users
            .filter((u) => !existingMemberIds.has(u._id))
            .filter((u) => !q || getFullName(u).toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
            .sort((a, b) => getFullName(a).localeCompare(getFullName(b)));
    }, [users, existingMemberIds, modalSearch]);
    const toggleUser = (id) =>
        setSelectedUsers((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    const handleSubmit = async () => {
        if (!selectedUsers.length) { toast.error('Select at least one member.'); return; }
        setIsSubmitting(true);
        try {
            if (isAddMode) await onAddMembers(selectedChat._id, selectedUsers);
            else await onCreateGroup(groupName, selectedUsers);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Operation failed.');
        } finally { setIsSubmitting(false); }
    };
    const selectedNames = useMemo(() => users.filter((u) => selectedUsers.includes(u._id)), [users, selectedUsers]);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}>
            <motion.div initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {isAddMode ? 'Add Members' : 'Create New Group'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {!isAddMode && (
                        <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Group name (e.g. Project Alpha)" maxLength={50}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    )}
                    {selectedNames.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {selectedNames.map((u) => (
                                <span key={u._id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                    {getFullName(u)}
                                    <button onClick={() => toggleUser(u._id)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input ref={searchRef} type="text" value={modalSearch} onChange={(e) => setModalSearch(e.target.value)}
                            placeholder="Search members…" className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-200 focus:outline-none" />
                        {modalSearch && <button onClick={() => setModalSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">{filteredUsers.length} available</p>
                        {filteredUsers.length === 0
                            ? <p className="text-sm text-center text-gray-400 py-6">{modalSearch ? 'No matches' : 'No users available'}</p>
                            : (
                                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                                    {filteredUsers.map((u) => {
                                        const sel = selectedUsers.includes(u._id);
                                        return (
                                            <div key={u._id} onClick={() => toggleUser(u._id)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${sel ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/60'}`}>
                                                <Avatar user={u} size={9} showOnline />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{getFullName(u)}</p>
                                                    {u.online && <p className="text-xs text-green-500">Online</p>}
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${sel ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-500'}`}>
                                                    {sel && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                    </div>
                </div>
                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-xs text-gray-400">{selectedUsers.length} selected</p>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                        <button onClick={handleSubmit} disabled={!selectedUsers.length || isSubmitting}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all ${selectedUsers.length && !isSubmitting ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'}`}>
                            {isSubmitting ? 'Please wait…' : isAddMode ? 'Add Members' : 'Create Group'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const TeamChat = () => {
    const { user, onLogout } = useOutletContext();
    const navigate = useNavigate();
    const [chatMode, setChatMode] = useState(localStorage.getItem('chatMode') || 'individual');
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [groupModalMode, setGroupModalMode] = useState(null);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [file, setFile] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [chatTimestamps, setChatTimestamps] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [messageSearch, setMessageSearch] = useState('');
    const [mediaViewer, setMediaViewer] = useState(null);
    const [isInitLoading, setIsInitLoading] = useState(true);
    const [isMsgLoading, setIsMsgLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [userChatMap, setUserChatMap] = useState({});
    const [lastMessages, setLastMessages] = useState({});
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [selectionMode, setSelectionMode] = useState(null);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [now, setNow] = useState(Date.now());
    const socket = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const inputRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const selectedChatRef = useRef(null);
    const savedScrollRef = useRef(null);

    // ─── CORE FIX: Live scroll position ref (updated on every scroll) ─────────────────────
    const isAtBottomRef = useRef(true);

    useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);
    useEffect(() => { localStorage.setItem('chatMode', chatMode); }, [chatMode]);

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (users.length) {
            setOnlineUsers(new Set(users.filter((u) => u.online).map((u) => u._id)));
        }
    }, [users]);

    // ─── scrollToBottom – now uses direct DOM scroll for maximum reliability ─────────────
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        const container = messagesContainerRef.current;
        if (!container) return;
        if (behavior === 'instant') {
            container.scrollTop = container.scrollHeight;
        } else {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
        setShowScrollButton(false);
        isAtBottomRef.current = true;
    }, []);

    // ─── handleScroll – keeps ref perfectly in sync with user intent ─────────────────────
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        isAtBottomRef.current = distanceFromBottom < 100; // tight threshold
        setShowScrollButton(distanceFromBottom > 200);
    }, []);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) { onLogout?.(); navigate('/login'); throw new Error('No auth token'); }
        return { Authorization: `Bearer ${token}` };
    }, [onLogout, navigate]);

    const fetchUnreadCounts = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/chats/unread-counts`, { headers: getAuthHeaders() });
            if (res.data.success) setUnreadCounts(res.data.counts || {});
        } catch { }
    }, [getAuthHeaders]);

    const markChatAsRead = useCallback(async (chatId) => {
        if (!chatId) return;
        setUnreadCounts((prev) => { const n = { ...prev }; delete n[chatId]; return n; });
        try {
            await axios.post(`${API_BASE_URL}/api/chats/${chatId}/read`, {}, { headers: getAuthHeaders() });
        } catch { fetchUnreadCounts(); }
    }, [getAuthHeaders, fetchUnreadCounts]);

    const fetchInitialChats = useCallback(async () => {
        try {
            setIsInitLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/chats/init`, { headers: getAuthHeaders() });
            const {
                users: rawUsers = [], groups: rawGroups = [], userChatMap: map = {},
                lastMessages: lastMsgs = {}, timestamps = {}, unreadCounts: serverUnread = {},
            } = res.data;
            setUsers(rawUsers.filter((u) => u._id && u.firstName && u._id !== user?._id));
            setGroups(rawGroups.filter((g) => g._id && g.members?.length > 0));
            setUserChatMap(map);
            const normTs = {};
            Object.entries(timestamps).forEach(([k, v]) => {
                normTs[k] = v instanceof Date ? v.toISOString() : String(v);
            });
            setChatTimestamps(normTs);
            const normMsgs = {};
            Object.entries(lastMsgs).forEach(([k, v]) => {
                normMsgs[k] = v ? { ...v, createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt) } : null;
            });
            setLastMessages(normMsgs);
            setUnreadCounts((prev) => ({ ...serverUnread, ...prev }));
        } catch (error) {
            console.error('fetchInitialChats error:', error.message);
            toast.error('Failed to load chats.');
            if (error.response?.status === 401) onLogout?.();
        } finally { setIsInitLoading(false); }
    }, [user, getAuthHeaders, onLogout]);

    // ─── Socket with ROBUST auto-scroll fix ─────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        socket.current = io(SOCKET_URL, {
            auth: { token: localStorage.getItem('token') },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socket.current.on('connect', () => {
            reconnectAttempts.current = 0;
            socket.current.emit('joinChat', `user:${user._id}`);
            if (selectedChatRef.current?._id) socket.current.emit('joinChat', selectedChatRef.current._id);
        });

        socket.current.on('message', (message) => {
            if (!message?._id || !message?.chatId) return;

            const msg = { ...message, createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt };
            const ts = msg.createdAt || new Date().toISOString();

            setLastMessages((prev) => ({ ...prev, [msg.chatId]: msg }));
            setChatTimestamps((prev) => ({ ...prev, [msg.chatId]: ts }));

            if (msg.chatId === selectedChatRef.current?._id) {
                // ── CRITICAL: Check LIVE scroll position SYNCHRONOUSLY before React re-renders ──
                const container = messagesContainerRef.current;
                let wasAtBottom = true;
                if (container) {
                    const { scrollTop, scrollHeight, clientHeight } = container;
                    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
                    wasAtBottom = distanceFromBottom < 100; // very tight threshold
                }

                // Update messages
                setMessages((prev) => {
                    if (prev.some((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });

                // Only auto-scroll if user was already near the bottom
                if (wasAtBottom) {
                    // Give React one tick to render the new message, then scroll
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            scrollToBottom('smooth');
                        }, 8);
                    });
                } else {
                    setShowScrollButton(true);
                }

                markChatAsRead(msg.chatId);
            }
        });

        socket.current.on('unreadUpdate', ({ chatId, count, message }) => {
            if (selectedChatRef.current?._id === chatId) return;
            setUnreadCounts((prev) => ({ ...prev, [chatId]: count }));
            if (message?.sender?._id !== user?._id) {
                toast.custom((t) => (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                        className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl rounded-2xl px-4 py-3 max-w-xs cursor-pointer"
                        onClick={() => toast.dismiss(t.id)}>
                        <Avatar user={message.sender} size={9} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{getFullName(message.sender)}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                {message.content || (message.fileUrl ? '📎 Attachment' : 'New message')}
                            </p>
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{formatMsgTime(message.createdAt)}</span>
                    </motion.div>
                ), { duration: 4500, position: 'top-right' });
            }
        });

        socket.current.on('messageUpdated', (message) => {
            const msg = { ...message, createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt };
            if (msg.chatId === selectedChatRef.current?._id) {
                setMessages((prev) => prev
                    .filter((m) => m.chatId === msg.chatId)
                    .map((m) => m._id === msg._id ? msg : m)
                );
            }
            setLastMessages((prev) => prev[msg.chatId]?._id === msg._id ? { ...prev, [msg.chatId]: msg } : prev);
        });

        socket.current.on('messageDeleted', (message) => {
            if (message.chatId === selectedChatRef.current?._id)
                setMessages((prev) => prev.map((m) => m._id === message._id ? { ...m, isDeleted: true, content: 'This message was deleted' } : m));
        });

        socket.current.on('typing', ({ chatId, userId, isTyping }) => {
            if (chatId && userId && userId !== user?._id)
                setTypingUsers((prev) => ({ ...prev, [chatId]: isTyping ? { id: userId, isTyping: true } : null }));
        });

        socket.current.on('userOnline', ({ userId }) => {
            setOnlineUsers((prev) => new Set([...prev, userId]));
        });
        socket.current.on('userOffline', ({ userId, lastActive }) => {
            setOnlineUsers((prev) => { const s = new Set(prev); s.delete(userId); return s; });
            if (lastActive && selectedChatRef.current?.recipient?._id === userId) {
                setSelectedChat((prev) => prev ? { ...prev, recipient: { ...prev.recipient, lastActive, online: false } } : prev);
            }
        });

        socket.current.on('groupCreated', ({ success, group }) => {
            if (success && group?._id) {
                setGroups((prev) => prev.some((g) => g._id === group._id) ? prev : [...prev, group]);
                socket.current.emit('joinChat', group._id);
            }
        });
        socket.current.on('groupUpdated', ({ success, group }) => {
            if (success && group?._id) {
                setGroups((prev) => prev.map((g) => g._id === group._id ? group : g));
                if (selectedChatRef.current?._id === group._id)
                    setSelectedChat((prev) => ({ ...prev, ...group, type: 'group' }));
            }
        });

        socket.current.on('connect_error', () => {
            reconnectAttempts.current = Math.min(reconnectAttempts.current + 1, maxReconnectAttempts);
        });

        return () => {
            socket.current?.emit('leaveChat', selectedChatRef.current?._id);
            socket.current?.emit('leaveChat', `user:${user._id}`);
            socket.current?.disconnect();
        };
    }, [user, scrollToBottom, markChatAsRead]);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchInitialChats();
    }, [user, fetchInitialChats]);

    useEffect(() => {
        const h = (e) => {
            if (showEmojiPicker && emojiButtonRef.current && !emojiButtonRef.current.contains(e.target) && !e.target.closest('.EmojiPickerReact'))
                setShowEmojiPicker(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [showEmojiPicker]);

    const selectIndividualChat = useCallback(async (recipient) => {
        if (!recipient?._id) return;
        if (selectedChatRef.current?.recipient?._id === recipient._id) return;

        setMessages([]);
        setCurrentPage(1);
        isAtBottomRef.current = true;

        const knownChatId = userChatMap[recipient._id];
        if (knownChatId) {
            setSelectedChat({
                _id: knownChatId,
                type: 'individual',
                recipient: { ...recipient, online: onlineUsers.has(recipient._id) },
                members: [],
                _pending: true,
            });
        }
        try {
            setIsMsgLoading(true);
            const res = await axios.post(`${API_BASE_URL}/api/chats/individual`, { recipientId: recipient._id }, { headers: getAuthHeaders() });
            const chat = res.data.chat;
            if (!chat?._id) throw new Error('Invalid chat');
            const recipientMember = chat.members.find((m) => m._id !== user._id);
            const enrichedRecipient = { ...recipientMember, online: onlineUsers.has(recipientMember?._id) };
            setSelectedChat({ ...chat, type: 'individual', recipient: enrichedRecipient });
            setUserChatMap((prev) => ({ ...prev, [recipient._id]: chat._id }));
            await markChatAsRead(chat._id);
            socket.current?.emit('joinChat', chat._id);
            if (window.innerWidth < 1024) window.scrollTo(0, 0);
        } catch (error) {
            setSelectedChat(null);
            toast.error(error.response?.data?.message || 'Failed to open chat.');
            if (error.response?.status === 401) onLogout?.();
        } finally { setIsMsgLoading(false); }
    }, [getAuthHeaders, onLogout, user, markChatAsRead, onlineUsers, userChatMap]);

    const selectGroupChat = useCallback((group) => {
        if (!group?._id || selectedChatRef.current?._id === group._id) return;
        setMessages([]);
        setCurrentPage(1);
        isAtBottomRef.current = true;
        setSelectedChat({ ...group, type: 'group' });
        markChatAsRead(group._id);
        socket.current?.emit('joinChat', group._id);
        if (window.innerWidth < 1024) window.scrollTo(0, 0);
    }, [markChatAsRead]);

    const fetchMessages = useCallback(async () => {
        if (!selectedChat?._id) return;
        const fetchingChatId = selectedChat._id;
        const fetchingPage = currentPage;
        try {
            setIsMsgLoading(true);
            const res = await axios.get(
                `${API_BASE_URL}/api/chats/${fetchingChatId}/messages?limit=50&page=${fetchingPage}`,
                { headers: getAuthHeaders() }
            );
            const { messages: newMsgs, pagination } = res.data;
            if (!Array.isArray(newMsgs)) return;
            if (selectedChatRef.current?._id !== fetchingChatId) return;

            const normed = newMsgs.map((m) => ({
                ...m,
                createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
            }));

            setMessages((prev) => {
                if (fetchingPage === 1) {
                    return normed;
                }
                const el = messagesContainerRef.current;
                if (el) savedScrollRef.current = { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop };
                const existingIds = new Set(prev.map((m) => m._id));
                return [
                    ...normed.filter((m) => !existingIds.has(m._id) && m.chatId === fetchingChatId),
                    ...prev.filter((m) => m.chatId === fetchingChatId),
                ];
            });

            setTotalPages(pagination.totalPages);

            if (currentPage === 1) {
                setTimeout(() => scrollToBottom('instant'), 30);
            } else if (savedScrollRef.current) {
                requestAnimationFrame(() => {
                    const el = messagesContainerRef.current;
                    if (el && savedScrollRef.current) {
                        el.scrollTop = el.scrollHeight - savedScrollRef.current.scrollHeight + savedScrollRef.current.scrollTop;
                        savedScrollRef.current = null;
                    }
                });
            }

            if (normed.length > 0) {
                const newest = normed[normed.length - 1];
                setChatTimestamps((prev) => ({ ...prev, [selectedChat._id]: newest.createdAt }));
                setLastMessages((prev) => ({ ...prev, [selectedChat._id]: newest }));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load messages.');
            if (error.response?.status === 401) onLogout?.();
        } finally { setIsMsgLoading(false); }
    }, [selectedChat, currentPage, getAuthHeaders, scrollToBottom, onLogout]);

    useEffect(() => { if (selectedChat?._id) fetchMessages(); }, [fetchMessages]);

    const debouncedTyping = useMemo(() => debounce((chatId, userId) => {
        socket.current?.emit('typing', { chatId, userId, isTyping: true });
    }, 400), []);

    useEffect(() => {
        if (!selectedChat || !newMessage) return;
        const t = setTimeout(() => {
            socket.current?.emit('typing', { chatId: selectedChat._id, userId: user?._id, isTyping: false });
        }, 3000);
        return () => clearTimeout(t);
    }, [newMessage, selectedChat, user]);

    useEffect(() => {
        if (!newMessage && selectedChat) {
            socket.current?.emit('typing', { chatId: selectedChat._id, userId: user?._id, isTyping: false });
        }
    }, [newMessage, selectedChat, user]);

    const uploadFile = async (f) => {
        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', f);
            const res = await axios.post(`${API_BASE_URL}/api/chats/upload`, fd, {
                headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        } finally { setIsUploading(false); }
    };

    const handleSendMessage = useCallback(async () => {
        const text = newMessage.trim();
        if (!text && !file && !editingMessage) return;
        let fileUrl = '', contentType = '', fileName = '';
        if (file) {
            try { ({ fileUrl, contentType, fileName } = await uploadFile(file)); }
            catch (err) { toast.error('Upload failed.'); setFile(null); return; }
        }
        try {
            if (editingMessage) {
                if (!text) return;
                await axios.put(`${API_BASE_URL}/api/chats/messages/${editingMessage.id}`, { content: text }, { headers: getAuthHeaders() });
            } else {
                await axios.post(`${API_BASE_URL}/api/chats/${selectedChat._id}/messages`, {
                    content: text, fileUrl, contentType, fileName,
                    replyTo: replyTo?._id || null,
                }, { headers: getAuthHeaders() });
            }
            setNewMessage('');
            setFile(null);
            setEditingMessage(null);
            setReplyTo(null);
            setSelectionMode(null);
            setSelectedMessages([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setChatTimestamps((prev) => ({ ...prev, [selectedChat._id]: new Date().toISOString() }));
            isAtBottomRef.current = true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send.');
            if (error.response?.status === 401) onLogout?.();
        }
    }, [selectedChat, newMessage, file, editingMessage, replyTo, getAuthHeaders, onLogout]);

    const handleDeleteMessages = async () => {
        if (!selectedMessages.length) return;
        try {
            await Promise.all(selectedMessages.map((id) =>
                axios.delete(`${API_BASE_URL}/api/chats/messages/${id}`, { headers: getAuthHeaders() })
            ));
            setSelectionMode(null);
            setSelectedMessages([]);
            toast.success(`Deleted ${selectedMessages.length} message(s).`);
        } catch (error) {
            toast.error('Delete failed.');
            if (error.response?.status === 401) onLogout?.();
        }
    };

    const handleCreateGroup = useCallback(async (name, memberIds) => {
        const validIds = memberIds.filter((id) => users.some((u) => u._id === id));
        if (!validIds.length) throw new Error('No valid members');
        const res = await axios.post(`${API_BASE_URL}/api/chats/groups`,
            { name: name.trim() || 'Unnamed Group', members: validIds },
            { headers: getAuthHeaders() }
        );
        if (res.data.success && res.data.group) {
            setGroups((prev) => prev.some((g) => g._id === res.data.group._id) ? prev : [...prev, res.data.group]);
            socket.current?.emit('joinChat', res.data.group._id);
            toast.success('Group created!');
        }
    }, [users, getAuthHeaders]);

    const handleAddMembers = useCallback(async (groupId, memberIds) => {
        const validIds = memberIds.filter((id) => users.some((u) => u._id === id));
        if (!validIds.length) throw new Error('No valid members');
        await axios.put(`${API_BASE_URL}/api/chats/groups/${groupId}/members`,
            { members: validIds }, { headers: getAuthHeaders() }
        );
        toast.success('Members added!');
    }, [users, getAuthHeaders]);

    const handleCloseChat = () => {
        socket.current?.emit('leaveChat', selectedChat?._id);
        if (selectedChat) socket.current?.emit('typing', { chatId: selectedChat._id, userId: user?._id, isTyping: false });
        setSelectedChat(null); setMessages([]); setCurrentPage(1);
        setSelectionMode(null); setSelectedMessages([]);
        setEditingMessage(null); setNewMessage(''); setReplyTo(null);
        isAtBottomRef.current = true;
    };

    const handleChatModeChange = (mode) => {
        if (mode === chatMode) return;
        setChatMode(mode);
        handleCloseChat();
        setSearchQuery('');
    };

    const startEdit = (msg) => {
        setEditingMessage({ id: msg._id, originalContent: msg.content });
        setNewMessage(msg.content || '');
        setSelectionMode(null);
        setSelectedMessages([]);
        inputRef.current?.focus();
    };

    const startReply = (msg) => {
        setReplyTo(msg);
        setEditingMessage(null);
        inputRef.current?.focus();
    };

    const cancelEdit = () => { setEditingMessage(null); setNewMessage(''); };
    const cancelReply = () => setReplyTo(null);

    const toggleMessageSelection = (id) => {
        const msg = messages.find((m) => m._id === id);
        if (!msg || msg.isDeleted) return;
        if (selectionMode === 'edit') {
            if (msg.sender?._id !== user?._id) { toast.error('You can only edit your own messages.'); return; }
            startEdit(msg);
        } else if (selectionMode === 'delete') {
            setSelectedMessages((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
        }
    };

    const isSender = (msg) => msg.sender?._id === user?._id;

    const MessageStatus = ({ msg }) => {
        if (!isSender(msg) || msg.isDeleted) return null;
        return (
            <span className="inline-flex ml-1 opacity-70">
                <CheckCheck className="w-3 h-3 text-blue-200" />
            </span>
        );
    };

    const sortedUsers = useMemo(() => {
        void now;
        const q = searchQuery.trim().toLowerCase();
        return [...users]
            .filter((u) => !q || getFullName(u).toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
            .sort((a, b) => {
                const chatIdA = userChatMap[a._id];
                const chatIdB = userChatMap[b._id];
                const hasA = chatIdA && lastMessages[chatIdA];
                const hasB = chatIdB && lastMessages[chatIdB];
                const tA = hasA ? chatTimestamps[chatIdA] : null;
                const tB = hasB ? chatTimestamps[chatIdB] : null;
                if (tA && tB) return new Date(tB) - new Date(tA);
                if (tA) return -1;
                if (tB) return 1;
                return getFullName(a).localeCompare(getFullName(b));
            });
    }, [users, searchQuery, userChatMap, chatTimestamps, lastMessages, now]);

    const sortedGroups = useMemo(() => {
        void now;
        const q = searchQuery.trim().toLowerCase();
        return [...groups]
            .filter((g) => !q || (g.name || '').toLowerCase().includes(q))
            .sort((a, b) => {
                const hasA = lastMessages[a._id];
                const hasB = lastMessages[b._id];
                const tA = hasA ? (chatTimestamps[a._id] || null) : null;
                const tB = hasB ? (chatTimestamps[b._id] || null) : null;
                if (tA && tB) return new Date(tB) - new Date(tA);
                if (tA) return -1;
                if (tB) return 1;
                return (a.name || '').localeCompare(b.name || '');
            });
    }, [groups, searchQuery, chatTimestamps, lastMessages, now]);

    const filteredMessages = useMemo(() => {
        const chatId = selectedChat?._id;
        return messages
            .filter((m) => !chatId || !m.chatId || m.chatId === chatId)
            .filter((m) => !messageSearch || m.content?.toLowerCase().includes(messageSearch.toLowerCase()));
    }, [messages, messageSearch, selectedChat]);

    const messagesWithSeparators = useMemo(() => {
        const items = [];
        let lastDateKey = null;
        filteredMessages.forEach((msg) => {
            const dateKey = msg.createdAt ? moment(msg.createdAt).tz(TZ).format('YYYY-MM-DD') : null;
            if (dateKey && dateKey !== lastDateKey) {
                items.push({ type: 'separator', date: msg.createdAt, key: `sep-${dateKey}` });
                lastDateKey = dateKey;
            }
            items.push({ type: 'message', msg, key: msg._id });
        });
        return items;
    }, [filteredMessages]);

    const lastSeenText = useMemo(() => {
        void now;
        if (!selectedChat || selectedChat.type !== 'individual') return '';
        const r = selectedChat.recipient;
        if (!r) return '';
        const isOnline = onlineUsers.has(r._id) || r.online;
        if (isOnline) return 'Online';
        const ts = r._computedLastSeen || r.lastActive;
        return formatLastSeen(ts);
    }, [selectedChat, onlineUsers, now]);

    const totalUnread = useMemo(() => Object.values(unreadCounts).reduce((s, n) => s + n, 0), [unreadCounts]);

    useEffect(() => { document.title = totalUnread > 0 ? `(${totalUnread}) TeamChat` : 'TeamChat'; return () => { document.title = 'TeamChat'; }; }, [totalUnread]);
    useEffect(() => { window.dispatchEvent(new CustomEvent('chatUnreadUpdate', { detail: { total: totalUnread } })); }, [totalUnread]);

    if (!user) return <div className="h-screen flex items-center justify-center"><p className="text-gray-400">Please log in.</p></div>;

    return (
        <div className="h-screen bg-gray-100 dark:bg-gray-900 flex font-sans overflow-hidden">
            <Toaster toastOptions={{ className: 'text-sm' }} />

            {/* SIDEBAR */}
            <aside className={`w-full lg:w-[340px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
                <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-2">
                                TeamChat
                                {totalUnread > 0 && (
                                    <span className="bg-green-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{totalUnread}</span>
                                )}
                            </h1>
                        </div>
                    </div>
                    <button onClick={() => navigate('/')} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Dashboard">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex px-4 pt-3 pb-2 gap-1">
                    {['individual', 'group'].map((mode) => (
                        <button key={mode} onClick={() => handleChatModeChange(mode)}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${chatMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                            {mode === 'individual' ? 'Chats' : 'Groups'}
                        </button>
                    ))}
                </div>

                {chatMode === 'group' && (
                    <div className="px-4 pb-2">
                        <button onClick={() => setGroupModalMode('create')}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium shadow-sm transition-all">
                            <Plus className="w-4 h-4" /> New Group
                        </button>
                    </div>
                )}

                <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={chatMode === 'individual' ? 'Search chats…' : 'Search groups…'}
                            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-200 focus:outline-none placeholder-gray-400" />
                        {searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isInitLoading ? (
                        <div className="flex flex-col gap-2 px-4 pt-2">
                            {[1,2,3,4].map((i) => (
                                <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (chatMode === 'individual' ? sortedUsers : sortedGroups).length === 0 ? (
                        <div className="flex flex-col items-center justify-center pt-16 px-8 text-center">
                            <Users className="w-12 h-12 text-gray-200 dark:text-gray-600 mb-3" />
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                {searchQuery ? 'No results found' : chatMode === 'group' ? 'No groups yet — create one!' : 'No chats yet'}
                            </p>
                        </div>
                    ) : (chatMode === 'individual' ? sortedUsers : sortedGroups).map((item) => {
                        const isGroup = chatMode === 'group';
                        const chatId = isGroup ? item._id : userChatMap[item._id];
                        const lastMsg = lastMessages[chatId];
                        const ts = chatTimestamps[chatId];
                        const unread = unreadCounts[chatId] || 0;
                        const isActive = isGroup ? selectedChat?._id === item._id : selectedChat?.recipient?._id === item._id;
                        const isItemOnline = !isGroup && (onlineUsers.has(item._id) || item.online);
                        let snippet = 'No messages yet';
                        if (lastMsg) {
                            if (lastMsg.isDeleted) snippet = '🚫 This message was deleted';
                            else if (lastMsg.content) {
                                const isMyMsg = lastMsg.sender?._id === user?._id;
                                const prefix = isGroup ? `${isMyMsg ? 'You' : (lastMsg.sender?.firstName || 'Someone')}: ` : (isMyMsg ? 'You: ' : '');
                                snippet = prefix + lastMsg.content.slice(0, 38) + (lastMsg.content.length > 38 ? '…' : '');
                            } else if (lastMsg.fileUrl) {
                                const icons = { image: '📷 Photo', video: '🎥 Video', audio: '🎵 Audio', application: '📄 Document' };
                                snippet = icons[lastMsg.contentType] || '📎 Attachment';
                            }
                        }
                        return (
                            <div key={item._id} onClick={() => isGroup ? selectGroupChat(item) : selectIndividualChat(item)}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                <div className="relative flex-shrink-0">
                                    <Avatar user={item} size={12} />
                                    {isItemOnline && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                                        <p className={`text-[0.9rem] truncate ${unread > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-800 dark:text-gray-200'}`}>
                                            {isGroup ? item.name : getFullName(item)}
                                        </p>
                                        <span className={`text-[11px] flex-shrink-0 ${unread > 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {lastMsg && ts ? formatChatTime(ts) : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-1">
                                        <p className={`text-xs truncate ${unread > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {snippet}
                                        </p>
                                        {unread > 0 && (
                                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                className="flex-shrink-0 bg-green-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                                                {unread > 99 ? '99+' : unread}
                                            </motion.span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* CHAT AREA */}
            <section className={`flex-1 flex flex-col min-w-0 bg-[#EFEAE4] dark:bg-gray-900 relative ${selectedChat ? 'flex' : 'hidden lg:flex'}`}>
                {selectedChat ? (
                    <>
                        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
                            <button onClick={handleCloseChat} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full lg:hidden flex-shrink-0">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="relative flex-shrink-0">
                                <Avatar user={selectedChat.type === 'individual' ? selectedChat.recipient : selectedChat} size={10} />
                                {selectedChat.type === 'individual' && (onlineUsers.has(selectedChat.recipient?._id) || selectedChat.recipient?.online) && (
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowMembersModal(true)}>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {selectedChat.type === 'individual' ? getFullName(selectedChat.recipient) : selectedChat.name || 'Unnamed Group'}
                                </h2>
                                <p className={`text-xs truncate ${lastSeenText === 'Online' ? 'text-green-500 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {selectedChat.type === 'group'
                                        ? `${selectedChat.members?.length || 0} members`
                                        : lastSeenText}
                                </p>
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                                <div className="hidden sm:flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1 mr-1">
                                    <Search className="w-3.5 h-3.5 text-gray-400" />
                                    <input type="text" value={messageSearch} onChange={(e) => setMessageSearch(e.target.value)}
                                        placeholder="Search…" className="w-20 md:w-24 bg-transparent text-xs text-gray-700 dark:text-gray-300 focus:outline-none" />
                                    {messageSearch && <button onClick={() => setMessageSearch('')}><X className="w-3 h-3 text-gray-400" /></button>}
                                </div>
                                {selectionMode ? (
                                    <>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 px-2">{selectedMessages.length} sel.</span>
                                        {selectionMode === 'delete' && selectedMessages.length > 0 && (
                                            <button onClick={handleDeleteMessages} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"><Trash2 className="w-4 h-4" /></button>
                                        )}
                                        <button onClick={() => { setSelectionMode(null); setSelectedMessages([]); setEditingMessage(null); setNewMessage(''); }} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setSelectionMode('edit')} title="Edit a message" className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => setSelectionMode('delete')} title="Delete messages" className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"><Trash2 className="w-4 h-4" /></button>
                                        {selectedChat.type === 'group' && (
                                            <button onClick={() => setGroupModalMode('add')} title="Add members" className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-full"><Plus className="w-4 h-4" /></button>
                                        )}
                                        <button onClick={() => setShowMembersModal(true)} title="View info" className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><Users className="w-4 h-4" /></button>
                                        <button onClick={handleCloseChat} title="Close" className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full hidden lg:flex"><X className="w-4 h-4" /></button>
                                    </>
                                )}
                            </div>
                        </header>

                        {/* Messages container */}
                        <div ref={messagesContainerRef} onScroll={handleScroll}
                            className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d0c9c0\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>

                            {currentPage < totalPages && (
                                <div className="flex justify-center my-3">
                                    <button onClick={() => setCurrentPage((p) => p + 1)}
                                        className="px-4 py-1.5 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-xs rounded-full shadow-sm hover:bg-gray-50 border border-gray-200 dark:border-gray-600">
                                        Load older messages
                                    </button>
                                </div>
                            )}

                            {isMsgLoading && messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-gray-400">Loading messages…</p>
                                </div>
                            )}

                            {!isMsgLoading && messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
                                    <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-700 shadow-md flex items-center justify-center">
                                        <Send className="w-7 h-7 text-blue-400" />
                                    </div>
                                    <p className="text-base font-medium text-gray-500 dark:text-gray-400">No messages yet</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">Be the first to say hello! 👋</p>
                                </div>
                            )}

                            {!isMsgLoading && filteredMessages.length === 0 && messageSearch && (
                                <p className="text-center text-sm text-gray-400 py-8">No messages match "{messageSearch}"</p>
                            )}

                            {messagesWithSeparators.map((item) => {
                                if (item.type === 'separator') return <DateSeparator key={item.key} date={item.date} />;
                                const msg = item.msg;
                                const sender = isSender(msg);
                                const isSelected = selectedMessages.includes(msg._id);
                                return (
                                    <motion.div key={item.key}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.1 }}
                                        className={`flex mb-1 ${sender ? 'justify-end' : 'justify-start'} ${selectionMode ? 'cursor-pointer' : 'group'}`}
                                        onClick={() => selectionMode && toggleMessageSelection(msg._id)}>
                                        {!sender && selectedChat.type === 'group' && (
                                            <div className="self-end mb-1 mr-1.5 flex-shrink-0">
                                                <Avatar user={msg.sender} size={6} />
                                            </div>
                                        )}
                                        <div className={`max-w-[72%] relative ${isSelected ? 'opacity-80' : ''}`}>
                                            {msg.replyTo && (
                                                <div className={`px-3 py-2 rounded-t-2xl text-xs border-l-4 border-blue-400 ${sender ? 'bg-blue-600/80 text-blue-100' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'} mb-0.5`}>
                                                    <p className="font-semibold truncate">{getFullName(msg.replyTo?.sender)}</p>
                                                    <p className="truncate opacity-80">{msg.replyTo?.content || '📎 Attachment'}</p>
                                                </div>
                                            )}
                                            <div className={`px-3 pt-1.5 pb-2 shadow-sm relative ${
                                                sender
                                                    ? 'bg-[#D9FDD3] dark:bg-[#005C4B] text-gray-900 dark:text-gray-100 rounded-2xl rounded-tr-sm'
                                                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm'
                                            } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                                                {selectionMode && !msg.isDeleted && (
                                                    <div className={`absolute top-2 ${sender ? 'right-2' : 'left-2'}`}>
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700'}`}>
                                                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                                        </div>
                                                    </div>
                                                )}
                                                {!sender && selectedChat.type === 'group' && (
                                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5 truncate">
                                                        {getFullName(msg.sender)}
                                                    </p>
                                                )}
                                                {msg.isDeleted ? (
                                                    <p className="text-xs italic text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                        <span>🚫</span> This message was deleted
                                                    </p>
                                                ) : (
                                                    <>
                                                        {msg.content && (
                                                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                                                        )}
                                                        {msg.isEdited && (
                                                            <span className="text-[10px] opacity-50 ml-1 italic">edited</span>
                                                        )}
                                                        {msg.fileUrl && (
                                                            <div className="mt-1.5">
                                                                {msg.contentType === 'image' && (
                                                                    <img src={msg.fileUrl} alt={msg.fileName || 'img'}
                                                                        className="max-w-full rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                                                                        onClick={(e) => { e.stopPropagation(); setMediaViewer({ fileUrl: msg.fileUrl, contentType: 'image', fileName: msg.fileName || 'Image' }); }} />
                                                                )}
                                                                {msg.contentType === 'video' && (
                                                                    <video src={msg.fileUrl} controls className="max-w-full rounded-xl" />
                                                                )}
                                                                {msg.contentType === 'audio' && (
                                                                    <audio src={msg.fileUrl} controls className="w-full mt-1" />
                                                                )}
                                                                {msg.contentType === 'application' && (
                                                                    <div className="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/5 rounded-xl mt-1 cursor-pointer"
                                                                        onClick={(e) => { e.stopPropagation(); setMediaViewer({ fileUrl: msg.fileUrl, contentType: 'pdf', fileName: msg.fileName || 'Document' }); }}>
                                                                        <FileIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                                        <p className="text-xs font-medium truncate">{msg.fileName || 'Document'}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <div className={`flex items-center justify-end gap-1 mt-0.5 ${msg.content ? '-mb-0.5' : ''}`}>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatMsgTime(msg.createdAt)}</span>
                                                    <MessageStatus msg={msg} />
                                                </div>
                                            </div>
                                            {!selectionMode && !msg.isDeleted && (
                                                <button
                                                    className={`absolute top-1/2 -translate-y-1/2 ${sender ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-sm`}
                                                    onClick={(e) => { e.stopPropagation(); startReply(msg); }}
                                                    title="Reply">
                                                    <CornerUpLeft className="w-3.5 h-3.5 text-gray-500" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}

                            <AnimatePresence>
                                {typingUsers[selectedChat._id]?.isTyping && (
                                    <TypingBubble name={getFullName(users.find((u) => u._id === typingUsers[selectedChat._id]?.id)) || 'Someone'} />
                                )}
                            </AnimatePresence>
                            <div ref={messagesEndRef} className="h-2" />
                        </div>

                        {/* Scroll button */}
                        <AnimatePresence>
                            {showScrollButton && (
                                <div className="absolute bottom-[4.5rem] left-0 right-0 flex justify-center pointer-events-none z-20">
                                    <motion.button
                                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.9 }}
                                        transition={{ duration: 0.15 }}
                                        onClick={() => scrollToBottom('smooth')}
                                        className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-xs font-medium">
                                        <ArrowDown className="w-3.5 h-3.5" />
                                        {unreadCounts[selectedChat._id] > 0
                                            ? `${unreadCounts[selectedChat._id]} new message${unreadCounts[selectedChat._id] > 1 ? 's' : ''}`
                                            : 'Jump to latest'}
                                    </motion.button>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Input area */}
                        <div className="bg-white dark:bg-gray-800 px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                            <AnimatePresence>
                                {replyTo && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 mb-2 border-l-4 border-blue-500 overflow-hidden">
                                        <CornerUpLeft className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">{getFullName(replyTo.sender)}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{replyTo.content || '📎 Attachment'}</p>
                                        </div>
                                        <button onClick={cancelReply} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex-shrink-0"><X className="w-3.5 h-3.5 text-gray-400" /></button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {editingMessage && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2 mb-2 border-l-4 border-blue-500 overflow-hidden">
                                        <Edit2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-blue-600">Editing message</p>
                                            <p className="text-xs text-gray-500 truncate">{editingMessage.originalContent}</p>
                                        </div>
                                        <button onClick={cancelEdit} className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded flex-shrink-0"><X className="w-3.5 h-3.5 text-gray-400" /></button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-end gap-2">
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <div className="relative">
                                        <button ref={emojiButtonRef} onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                            <Smile className="w-5 h-5" />
                                        </button>
                                        <AnimatePresence>
                                            {showEmojiPicker && (
                                                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                    className="absolute bottom-full left-0 z-30 mb-2 shadow-2xl rounded-2xl overflow-hidden">
                                                    <EmojiPicker onEmojiClick={(e) => { setNewMessage((p) => p + e.emoji); inputRef.current?.focus(); }}
                                                        theme="auto" emojiStyle="native" skinTonesDisabled height={340} width={320} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <button onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                                        onChange={(e) => {
                                            const f = e.target.files[0];
                                            if (f && f.size > 50 * 1024 * 1024) { toast.error('File exceeds 50MB'); return; }
                                            if (f) setFile(f);
                                        }} />
                                </div>

                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2.5 flex items-center gap-2 min-h-[44px]">
                                    <input ref={inputRef}
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => { setNewMessage(e.target.value); if (selectedChat?._id) debouncedTyping(selectedChat._id, user?._id); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                        placeholder={editingMessage ? 'Edit your message…' : replyTo ? 'Reply…' : 'Type a message'}
                                        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-200 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 min-w-0"
                                        disabled={selectionMode && !editingMessage} />
                                    {file && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500 truncate max-w-[80px] flex-shrink-0">
                                            <span className="truncate">{file.name}</span>
                                            <button onClick={() => setFile(null)}><X className="w-3 h-3 text-red-400" /></button>
                                        </div>
                                    )}
                                    {isUploading && <Clock className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />}
                                </div>

                                <motion.button
                                    onClick={handleSendMessage}
                                    disabled={(!newMessage.trim() && !file) || (selectionMode && !editingMessage)}
                                    whileTap={{ scale: 0.92 }}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-sm ${
                                        (newMessage.trim() || file) && (!selectionMode || editingMessage)
                                            ? 'bg-green-500 hover:bg-green-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                    }`}>
                                    <Send className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8 select-none">
                        <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center">
                            <Users className="w-9 h-9 text-gray-300 dark:text-gray-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">TeamChat</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                                Select a conversation from the list to start chatting with your team.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            <AnimatePresence>
                {groupModalMode && (
                    <GroupModal isAddMode={groupModalMode === 'add'} selectedChat={selectedChat}
                        users={users} onClose={() => setGroupModalMode(null)}
                        onCreateGroup={handleCreateGroup} onAddMembers={handleAddMembers} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showMembersModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowMembersModal(false)}>
                        <motion.div initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                    {selectedChat?.type === 'group' ? `${selectedChat.name}` : `${getFullName(selectedChat?.recipient)}`}
                                </h3>
                                <button onClick={() => setShowMembersModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X className="w-4 h-4 text-gray-400" /></button>
                            </div>
                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                {(selectedChat?.members || (selectedChat?.recipient ? [selectedChat.recipient] : [])).map((m) => {
                                    const isOnline = onlineUsers.has(m._id) || m.online;
                                    return (
                                        <div key={m._id} className="flex items-center gap-3 py-1.5">
                                            <div className="relative flex-shrink-0">
                                                <Avatar user={m} size={8} />
                                                {isOnline && <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-800" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{getFullName(m)}</p>
                                                <p className={`text-xs ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                                                    {isOnline ? 'Online' : formatLastSeen(m.lastActive)}
                                                </p>
                                            </div>
                                            {selectedChat?.adminId === m._id && (
                                                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">Admin</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <button onClick={() => setShowMembersModal(false)}
                                className="w-full mt-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {mediaViewer && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                        onClick={() => setMediaViewer(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                            className="relative w-full max-w-3xl max-h-[92vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-3 flex-shrink-0">
                                <p className="text-sm font-medium text-white truncate">{mediaViewer.fileName}</p>
                                <div className="flex gap-2">
                                    <a href={mediaViewer.fileUrl} download className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg">Download</a>
                                    <button onClick={() => setMediaViewer(null)} className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto flex items-center justify-center rounded-xl bg-black/50">
                                {mediaViewer.contentType === 'image' && <img src={mediaViewer.fileUrl} alt="" className="max-w-full max-h-[80vh] rounded-xl object-contain" />}
                                {mediaViewer.contentType === 'video' && <video src={mediaViewer.fileUrl} controls autoPlay className="max-w-full max-h-[80vh] rounded-xl" />}
                                {mediaViewer.contentType === 'audio' && <audio src={mediaViewer.fileUrl} controls autoPlay className="w-full" />}
                                {(mediaViewer.contentType === 'pdf' || mediaViewer.contentType === 'application') && (
                                    <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(mediaViewer.fileUrl)}&embedded=true`} className="w-full h-[75vh] rounded-xl" title="Document" />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
                * { scrollbar-width: thin; scrollbar-color: #D1D5DB transparent; }
            `}</style>
        </div>
    );
};

export default TeamChat;