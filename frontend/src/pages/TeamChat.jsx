import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Send, Smile, Paperclip, Users, Plus, X, Search, ChevronDown, Edit2, Trash2, ArrowLeft, ArrowDown, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import toast, { Toaster } from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';
import moment from 'moment-timezone';
import { debounce } from 'lodash';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = API_BASE_URL;

const TeamChat = () => {
  const { user, onLogout } = useOutletContext();
  const navigate = useNavigate();
  const [chatMode, setChatMode] = useState(localStorage.getItem('chatMode') || 'individual');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [chatTimestamps, setChatTimestamps] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [mediaViewer, setMediaViewer] = useState({ isOpen: false, fileUrl: '', contentType: '', fileName: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userChatMap, setUserChatMap] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const modalRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    console.log('TeamChat mounted with user:', user?._id);
  }, [user]);

  useEffect(() => {
    localStorage.setItem('chatMode', chatMode);
  }, [chatMode]);

  useEffect(() => {
    if (selectedChat && window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [selectedChat]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setShowScrollButton(false);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      setShowScrollButton(!isAtBottom);
    }
  }, []);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Please log in again.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      onLogout?.();
      navigate('/login');
      throw new Error('No auth token');
    }
    return { Authorization: `Bearer ${token}` };
  }, [onLogout, navigate]);

  const getInitials = useCallback((name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    return words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : (words[0][0] + (words[1]?.[0] || '')).toUpperCase();
  }, []);

  const fetchInitialChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersResponse, groupsResponse, timestampsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/chats/users`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/chats/groups`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/chats/timestamps`, { headers: getAuthHeaders() }),
      ]);

      const validUsers = usersResponse.data.users.filter((u) => {
        if (!u._id || typeof u._id !== 'string' || !u.name || !u.email) {
          console.warn('Invalid user detected:', u);
          return false;
        }
        return u._id !== user?._id;
      });
      setUsers(validUsers);

      const validGroups = (groupsResponse.data.groups || []).filter((g) => g._id && g.members?.length > 0);
      setGroups(validGroups);

      setChatTimestamps(timestampsResponse.data.timestamps || {});

      const chats = await Promise.all(
        validUsers.map(async (u) => {
          const chatResponse = await axios.post(
            `${API_BASE_URL}/api/chats/individual`,
            { recipientId: u._id },
            { headers: getAuthHeaders() }
          );
          return { userId: u._id, chatId: chatResponse.data.chat._id };
        })
      );
      const map = chats.reduce((acc, { userId, chatId }) => {
        acc[userId] = chatId;
        return acc;
      }, {});
      setUserChatMap(map);

      // Fetch last messages
      const allChatIds = [...Object.values(map), ...validGroups.map(g => g._id)];
      const lastMessagesResponses = await Promise.all(
        allChatIds.map(async (chatId) => {
          try {
            const res = await axios.get(`${API_BASE_URL}/api/chats/${chatId}/messages?limit=1&page=1`, { headers: getAuthHeaders() });
            return { chatId, lastMessage: res.data.messages[0] || null };
          } catch (err) {
            console.error(`Failed to fetch last message for chat ${chatId}:`, err);
            return { chatId, lastMessage: null };
          }
        })
      );
      const lastMessagesMap = lastMessagesResponses.reduce((acc, { chatId, lastMessage }) => {
        acc[chatId] = lastMessage;
        return acc;
      }, {});
      setLastMessages(lastMessagesMap);
    } catch (error) {
      console.error('Fetch initial chats error:', error.message);
      toast.error('Failed to load chats.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  }, [user, getAuthHeaders, onLogout]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    socket.current = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.current.on('connect', () => {
      console.log('Socket connected:', socket.current.id);
      reconnectAttempts.current = 0;
      socket.current.emit('joinChat', `user:${user._id}`);
      if (selectedChat?._id) socket.current.emit('joinChat', selectedChat._id);
    });

    socket.current.on('message', (message) => {
      if (!message?._id || !message?.chatId) {
        console.warn('Invalid message received:', message);
        return;
      }

      setMessages((prev) => {
        if (prev.some((msg) => msg._id === message._id)) return prev;
        if (message.chatId === selectedChat?._id) {
          setTimeout(scrollToBottom, 0);
          return [...prev, message];
        }
        return prev;
      });

      setLastMessages((prev) => ({ ...prev, [message.chatId]: message }));

      setChatTimestamps((prev) => ({
        ...prev,
        [message.chatId]: message.createdAt || new Date().toISOString(),
      }));

      if (message.sender?._id !== user?._id && message.chatId !== selectedChat?._id) {
        toast.success('New message received!', { style: { background: '#16A34A', color: '#FFFFFF' } });
        setUnreadCounts((prev) => ({
          ...prev,
          [message.chatId]: (prev[message.chatId] || 0) + 1,
        }));
      }
    });

    socket.current.on('messageUpdated', (message) => {
      if (message.chatId === selectedChat?._id) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === message._id ? message : msg))
        );
      }
      if (lastMessages[message.chatId]?._id === message._id) {
        setLastMessages((prev) => ({ ...prev, [message.chatId]: message }));
      }
    });

    socket.current.on('messageDeleted', (message) => {
      if (message.chatId === selectedChat?._id) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === message._id ? message : msg))
        );
      }
      if (lastMessages[message.chatId]?._id === message._id) {
        setLastMessages((prev) => ({ ...prev, [message.chatId]: { ...prev[message.chatId], isDeleted: true } }));
      }
    });

    socket.current.on('typing', ({ chatId, userId, isTyping }) => {
      if (chatId && userId && userId !== user?._id) {
        setTypingUsers((prev) => ({
          ...prev,
          [chatId]: { id: userId, isTyping },
        }));
      }
    });

    socket.current.on('groupCreated', (response) => {
      if (response.success && response.group?._id) {
        setGroups((prev) => {
          if (prev.some((g) => g._id === response.group._id)) return prev;
          return [...prev, response.group];
        });
        toast.success('Group created!', { style: { background: '#16A34A', color: '#FFFFFF' } });
        setSelectedChat({ ...response.group, type: 'group' });
        setChatMode('group');
        socket.current.emit('joinChat', response.group._id);
      } else {
        toast.error('Failed to process group creation.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      }
    });

    socket.current.on('groupUpdated', (response) => {
      if (response.success && response.group?._id) {
        setGroups((prev) =>
          prev.map((g) => (g._id === response.group._id ? response.group : g))
        );
        if (selectedChat?._id === response.group._id) {
          setSelectedChat({ ...response.group, type: 'group' });
        }
        toast.success('Group updated!', { style: { background: '#16A34A', color: '#FFFFFF' } });
      } else {
        toast.error('Failed to process group update.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      }
    });

    socket.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        toast.error(`Connection lost. Reconnecting (${reconnectAttempts.current}/${maxReconnectAttempts})...`, { style: { background: '#16A34A', color: '#FFFFFF' } });
      } else {
        toast.error('Failed to reconnect to chat server. Please refresh the page.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      }
    });

    socket.current.on('error', (error) => {
      console.error('Socket error:', error.message);
      toast.error('Chat error: ' + error.message, { style: { background: '#16A34A', color: '#FFFFFF' } });
    });

    return () => {
      socket.current?.emit('leaveChat', selectedChat?._id);
      socket.current?.emit('leaveChat', `user:${user._id}`);
      socket.current?.disconnect();
    };
  }, [user, selectedChat, scrollToBottom, navigate, lastMessages]);

  useEffect(() => {
    if (!user) return;
    fetchInitialChats();
  }, [user, fetchInitialChats]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
        setShowGroupModal(false);
        setShowMembersModal(false);
        setMediaViewer({ isOpen: false, fileUrl: '', contentType: '', fileName: '' });
      }
    };
    if (showEmojiPicker || showGroupModal || showMembersModal || mediaViewer.isOpen) {
      modalRef.current?.focus();
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEmojiPicker, showGroupModal, showMembersModal, mediaViewer.isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showEmojiPicker &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target) &&
        !e.target.closest('.emoji-picker-react')
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const selectIndividualChat = useCallback(async (recipient) => {
    if (!recipient?._id || typeof recipient._id !== 'string') {
      toast.error('Invalid user selected.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/chats/individual`,
        { recipientId: recipient._id },
        { headers: getAuthHeaders() }
      );
      const chat = response.data.chat;
      if (!chat?._id) throw new Error('Invalid chat data received');
      setSelectedChat({ ...chat, type: 'individual', recipient });
      setUnreadCounts((prev) => ({ ...prev, [chat._id]: 0 }));
      socket.current?.emit('joinChat', chat._id);
      setCurrentPage(1);
      setSidebarCollapsed(window.innerWidth < 1024);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start chat.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, onLogout]);

  const selectGroupChat = useCallback((group) => {
    if (!group?._id) {
      toast.error('Invalid group selected.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      return;
    }
    setSelectedChat({ ...group, type: 'group' });
    setUnreadCounts((prev) => ({ ...prev, [group._id]: 0 }));
    socket.current?.emit('joinChat', group._id);
    setCurrentPage(1);
    setSidebarCollapsed(window.innerWidth < 1024);
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!selectedChat?._id) return;

    try {
      setIsLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/chats/${selectedChat._id}/messages?limit=50&page=${currentPage}`,
        { headers: getAuthHeaders() }
      );
      const { messages: newMessages, pagination } = response.data;
      if (!Array.isArray(newMessages)) {
        console.warn('Invalid messages data:', newMessages);
        throw new Error('Invalid messages data');
      }
      setMessages((prev) => {
        const existingIds = new Set(prev.map((msg) => msg._id));
        const filteredMessages = newMessages.filter((msg) => !existingIds.has(msg._id));
        return currentPage === 1 ? filteredMessages : [...filteredMessages, ...prev];
      });
      setTotalPages(pagination.totalPages);
      setTimeout(scrollToBottom, 10);
      setUnreadCounts((prev) => ({ ...prev, [selectedChat._id]: 0 }));
      if (newMessages.length > 0) {
        setChatTimestamps((prev) => ({
          ...prev,
          [selectedChat._id]: newMessages[newMessages.length - 1].createdAt,
        }));
        setLastMessages((prev) => ({
          ...prev,
          [selectedChat._id]: newMessages[newMessages.length - 1],
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch messages.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  }, [selectedChat, currentPage, getAuthHeaders, scrollToBottom, onLogout]);

  useEffect(() => {
    fetchMessages();
    return () => {
      socket.current?.emit('leaveChat', selectedChat?._id);
    };
  }, [fetchMessages, selectedChat]);

  const loadMoreMessages = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const debouncedHandleTyping = debounce(() => {
    if (selectedChat?._id) {
      socket.current?.emit('typing', {
        chatId: selectedChat._id,
        userId: user?._id,
        isTyping: true,
      });
    }
  }, 500);

  const handleTyping = () => {
    debouncedHandleTyping();
  };

  useEffect(() => {
    if (!selectedChat) {
      setTypingUsers({});
      return;
    }

    const typingTimeout = setTimeout(() => {
      socket.current?.emit('typing', {
        chatId: selectedChat._id,
        userId: user?._id,
        isTyping: false,
      });
    }, 2000);

    return () => clearTimeout(typingTimeout);
  }, [newMessage, selectedChat, user]);

  const uploadFile = async (file) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API_BASE_URL}/api/chats/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() && !file && !editingMessageId) return;

    let fileUrl = '';
    let contentType = '';
    let fileName = '';

    if (file) {
      try {
        const { fileUrl: uploadedUrl, contentType: fileContentType, fileName: uploadedFileName } = await uploadFile(file);
        fileUrl = uploadedUrl;
        contentType = fileContentType;
        fileName = uploadedFileName;
      } catch (error) {
        toast.error(error.message, { style: { background: '#16A34A', color: '#FFFFFF' } });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    try {
      setIsLoading(true);
      if (editingMessageId) {
        const response = await axios.put(
          `${API_BASE_URL}/api/chats/messages/${editingMessageId}`,
          { content: newMessage.trim() },
          { headers: getAuthHeaders() }
        );
        socket.current?.emit('messageUpdated', {
          chatId: selectedChat._id,
          message: response.data.message,
        });
        toast.success('Message updated.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      } else {
        const message = {
          chatId: selectedChat._id,
          content: newMessage.trim(),
          fileUrl,
          contentType,
          fileName,
        };
        const response = await axios.post(
          `${API_BASE_URL}/api/chats/${selectedChat._id}/messages`,
          message,
          { headers: getAuthHeaders() }
        );
        socket.current?.emit('message', response.data.message);
      }
      setNewMessage('');
      setFile(null);
      setEditingMessageId(null);
      setSelectionMode(null);
      setSelectedMessages([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(scrollToBottom, 1);
      setChatTimestamps((prev) => ({
        ...prev,
        [selectedChat._id]: new Date().toISOString(),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send or update message.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  }, [selectedChat, newMessage, file, editingMessageId, getAuthHeaders, scrollToBottom, onLogout]);

  const handleDeleteMessages = async () => {
    if (selectedMessages.length === 0) {
      toast.error('Please select at least one message to delete.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      return;
    }

    try {
      setIsLoading(true);
      await Promise.all(
        selectedMessages.map(async (messageId) => {
          await axios.delete(`${API_BASE_URL}/api/chats/messages/${messageId}`, {
            headers: getAuthHeaders(),
          });
          socket.current?.emit('messageDeleted', { chatId: selectedChat._id, messageId });
        })
      );
      setSelectionMode(null);
      setSelectedMessages([]);
      toast.success(`Deleted ${selectedMessages.length} message(s).`, { style: { background: '#16A34A', color: '#FFFFFF' } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete messages.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length < 1) {
      toast.error('At least one member required.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      return;
    }

    try {
      setIsLoading(true);
      const validSelectedUsers = selectedUsers.filter((id) => users.some((u) => u._id === id));
      if (validSelectedUsers.length === 0) {
        toast.error('No valid members selected.', { style: { background: '#16A34A', color: '#FFFFFF' } });
        return;
      }

      const payload = {
        name: groupName || 'Unnamed Group',
        members: [...new Set([...validSelectedUsers, user._id])],
      };

      await axios.post(`${API_BASE_URL}/api/chats/groups`, payload, {
        headers: getAuthHeaders(),
      });

      setShowGroupModal(false);
      setGroupName('');
      setSelectedUsers([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMembers = async (groupId, newMembers) => {
    try {
      setIsLoading(true);
      const validNewMembers = newMembers.filter((id) => users.some((u) => u._id === id));
      if (validNewMembers.length === 0) {
        toast.error('No valid members selected.', { style: { background: '#16A34A', color: '#FFFFFF' } });
        return;
      }

      const payload = { members: validNewMembers };
      await axios.put(`${API_BASE_URL}/api/chats/groups/${groupId}/members`, payload, {
        headers: getAuthHeaders(),
      });

      setShowGroupModal(false);
      setSelectedUsers([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add members.', { style: { background: '#16A34A', color: '#FFFFFF' } });
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds 50MB.', { style: { background: '#16A34A', color: '#FFFFFF' } });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleCloseChat = () => {
    socket.current?.emit('leaveChat', selectedChat?._id);
    setSelectedChat(null);
    setMessages([]);
    setCurrentPage(1);
    setSelectionMode(null);
    setSelectedMessages([]);
    setEditingMessageId(null);
    setNewMessage('');
    setSidebarCollapsed(false);
  };

  const handleChatModeChange = (mode) => {
    if (mode === chatMode) return;
    setChatMode(mode);
    socket.current?.emit('leaveChat', selectedChat?._id);
    setSelectedChat(null);
    setMessages([]);
    setSearchQuery('');
    setCurrentPage(1);
    setSelectionMode(null);
    setSelectedMessages([]);
    setEditingMessageId(null);
    setNewMessage('');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const openMediaViewer = (fileUrl, contentType, fileName) => {
    setMediaViewer({ isOpen: true, fileUrl, contentType, fileName });
  };

  const closeMediaViewer = () => {
    setMediaViewer({ isOpen: false, fileUrl: '', contentType: '', fileName: '' });
  };

  const toggleMessageSelection = (messageId) => {
    const message = messages.find((msg) => msg._id === messageId);
    if (!message || message.isDeleted) return;

    if (selectionMode === 'edit') {
      if (message.sender?._id !== user?._id) {
        toast.error('You can only edit your own messages.', { style: { background: '#16A34A', color: '#FFFFFF' } });
        return;
      }
      setSelectedMessages([messageId]);
      setEditingMessageId(messageId);
      setNewMessage(message.content || '');
    } else if (selectionMode === 'delete') {
      setSelectedMessages((prev) =>
        prev.includes(messageId)
          ? prev.filter((id) => id !== messageId)
          : [...prev, messageId]
      );
    }
  };

  const isSenderMessage = (message) => {
    return message.sender?._id === user?._id && !message.isDeleted;
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const chatIdA = userChatMap[a._id];
    const chatIdB = userChatMap[b._id];
    const timeA = chatTimestamps[chatIdA] || '1970-01-01T00:00:00Z';
    const timeB = chatTimestamps[chatIdB] || '1970-01-01T00:00:00Z';
    return new Date(timeB) - new Date(timeA);
  });

  const sortedGroups = [...groups].sort((a, b) => {
    const timeA = chatTimestamps[a._id] || a.updatedAt || '1970-01-01T00:00:00Z';
    const timeB = chatTimestamps[b._id] || b.updatedAt || '1970-01-01T00:00:00Z';
    return new Date(timeB) - new Date(timeA);
  });

  const filteredMessages = messages.filter((msg) => msg.content?.toLowerCase().includes(messageSearch.toLowerCase()));

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F3F4F6]">
        <p className="text-base text-[#6B7280]">Please log in to access the chat.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F3F4F6] flex font-sans overflow-hidden">
      <Toaster position="bottom-right" toastOptions={{ className: 'text-base max-w-md' } } />
      <aside className={`w-full lg:w-80 bg-[#F3F4F6] border-r border-[#6B7280]/20 p-4 flex flex-col ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1E40AF]" />
            <h1 className="text-xl font-bold text-[#1F2937]">TeamChat</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="p-2 text-[#1E40AF] hover:bg-[#F3F4F6] rounded transition-all duration-200"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </header>
        <div className="flex mb-4">
          <button
            onClick={() => handleChatModeChange('individual')}
            className={`flex-1 py-2 text-sm font-medium rounded-l-lg transition-all duration-200 ${chatMode === 'individual' ? 'bg-[#1E40AF] text-white' : 'bg-white text-[#1F2937] hover:bg-[#F3F4F6]'}`}
          >
            Individual
          </button>
          <button
            onClick={() => handleChatModeChange('group')}
            className={`flex-1 py-2 text-sm font-medium rounded-r-lg transition-all duration-200 ${chatMode === 'group' ? 'bg-[#1E40AF] text-white' : 'bg-white text-[#1F2937] hover:bg-[#F3F4F6]'}`}
          >
            Groups
          </button>
        </div>
        {chatMode === 'group' && (
          <button
            onClick={() => {
              setShowGroupModal(true);
              setSelectedUsers([]);
            }}
            className="mb-4 flex items-center gap-2 py-2 px-4 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D] transition-all duration-200 text-sm"
            aria-label="Create Group"
          >
            <Plus className="w-4 h-4" /> Create Group
          </button>
        )}
        <div className="mb-4 flex items-center gap-2 bg-white border border-[#6B7280]/20 rounded-lg px-3 py-2">
          <Search className="w-5 h-5 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-sm text-[#1F2937] focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {isLoading && <p className="text-center text-sm text-[#6B7280] py-4">Loading chats...</p>}
          {chatMode === 'individual' && sortedUsers.length === 0 && !isLoading && (
            <p className="text-center text-sm text-[#6B7280] py-4">No users found</p>
          )}
          {chatMode === 'group' && sortedGroups.length === 0 && !isLoading && (
            <p className="text-center text-sm text-[#6B7280] py-4">No groups found</p>
          )}
          {chatMode === 'individual'
            ? sortedUsers.map((u) => {
                const chatId = userChatMap[u._id];
                const lastMsg = lastMessages[chatId];
                const snippet = lastMsg ? (lastMsg.content ? lastMsg.content.slice(0, 50) + (lastMsg.content.length > 50 ? '...' : '') : 'Attachment') : 'No messages yet';
                const time = chatTimestamps[chatId] ? moment(chatTimestamps[chatId]).fromNow() : '';
                return (
                  <div
                    key={u._id}
                    onClick={() => selectIndividualChat(u)}
                    className={`py-3 px-4 cursor-pointer hover:bg-[#E5E7EB] transition-all duration-200 rounded-lg ${
                      selectedChat?.recipient?._id === u._id ? 'bg-blue-50' : ''
                    } border-b border-[#F3F4F6]/50 last:border-0`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#1E40AF] flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {getInitials(u.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1F2937] truncate">{u.name}</p>
                          <p className="text-xs text-[#6B7280] truncate">{snippet}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-[#6B7280]">{time}</p>
                        {unreadCounts[chatId] > 0 && (
                          <span className="bg-[#16A34A] text-white text-xs font-medium rounded-full px-2 py-0.5 mt-1 inline-block">
                            {unreadCounts[chatId]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            : sortedGroups.map((g) => {
                const lastMsg = lastMessages[g._id];
                const snippet = lastMsg ? (lastMsg.content ? `${lastMsg.sender.name}: ${lastMsg.content.slice(0, 50) + (lastMsg.content.length > 50 ? '...' : '')}` : 'Attachment') : 'No messages yet';
                const time = chatTimestamps[g._id] ? moment(chatTimestamps[g._id]).fromNow() : '';
                return (
                  <div
                    key={g._id}
                    onClick={() => selectGroupChat(g)}
                    className={`py-3 px-4 cursor-pointer hover:bg-[#E5E7EB] transition-all duration-200 rounded-lg ${
                      selectedChat?._id === g._id ? 'bg-blue-50' : ''
                    } border-b border-[#F3F4F6]/50 last:border-0`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#1E40AF] flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {getInitials(g.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1F2937] truncate">{g.name}</p>
                          <p className="text-xs text-[#6B7280] truncate">{snippet}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-[#6B7280]">{time}</p>
                        {unreadCounts[g._id] > 0 && (
                          <span className="bg-[#16A34A] text-white text-xs font-medium rounded-full px-2 py-0.5 mt-1 inline-block">
                            {unreadCounts[g._id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </aside>
      <section className={`flex-1 bg-white flex flex-col ${selectedChat ? 'flex' : 'hidden lg:flex'}`}>
        {selectedChat ? (
          <>
            <header className="bg-[#F3F4F6] border-b border-[#6B7280]/20 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={handleCloseChat}
                  className="p-1 text-[#16A34A] hover:bg-[#16A34A]/10 rounded-full lg:hidden"
                  aria-label="Back to Chat List"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#1E40AF] flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {getInitials(
                    chatMode === 'individual'
                      ? selectedChat.recipient?.name || 'Anonymous'
                      : selectedChat.name || 'Unnamed Group'
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-medium text-[#1F2937] truncate">
                    {chatMode === 'individual' ? selectedChat.recipient?.name || 'Anonymous' : selectedChat.name || 'Unnamed Group'}
                  </h2>
                  {chatMode === 'group' ? (
                    <p className="text-xs text-[#6B7280]">{selectedChat.members?.length || 0} members</p>
                  ) : (
                    <p className="text-xs text-[#6B7280]">Online</p> // Fake online status
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-[#6B7280]/20 rounded-full px-3 py-1">
                  <Search className="w-4 h-4 text-[#6B7280]" />
                  <input
                    type="text"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    placeholder="Search messages..."
                    className="w-32 bg-transparent text-sm text-[#1F2937] focus:outline-none"
                  />
                </div>
                {selectionMode ? (
                  <>
                    <p className="text-sm font-medium text-[#1F2937]">
                      {selectedMessages.length} selected
                    </p>
                    {selectionMode === 'delete' && (
                      <button
                        onClick={handleDeleteMessages}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectionMode(null);
                        setSelectedMessages([]);
                        setEditingMessageId(null);
                        setNewMessage('');
                      }}
                      className="p-2 text-[#6B7280] hover:bg-[#F3F4F6] rounded-full transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectionMode('edit')}
                      className="p-2 text-[#1E40AF] hover:bg-[#1E40AF]/10 rounded-full transition-all duration-200"
                      data-tooltip-id="edit-messages"
                      data-tooltip-content="Select to Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                      <Tooltip id="edit-messages" className="bg-[#1E40AF] text-white" />
                    </button>
                    <button
                      onClick={() => setSelectionMode('delete')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                      data-tooltip-id="delete-messages"
                      data-tooltip-content="Select to Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                      <Tooltip id="delete-messages" className="bg-[#1E40AF] text-white" />
                    </button>
                    {chatMode === 'group' && (
                      <button
                        onClick={() => {
                          setShowGroupModal(true);
                          setSelectedUsers([]);
                        }}
                        className="p-2 text-[#16A34A] hover:bg-[#16A34A]/10 rounded-full transition-all duration-200"
                        data-tooltip-id="add-members"
                        data-tooltip-content="Add Members"
                      >
                        <Users className="w-5 h-5" />
                        <Tooltip id="add-members" className="bg-[#1E40AF] text-white" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowMembersModal(true)}
                      className="p-2 text-[#16A34A] hover:bg-[#16A34A]/10 rounded-full transition-all duration-200"
                      data-tooltip-id="view-members"
                      data-tooltip-content="View Members"
                    >
                      <Users className="w-5 h-5" />
                      <Tooltip id="view-members" className="bg-[#1E40AF] text-white" />
                    </button>
                    <button
                      onClick={handleCloseChat}
                      className="p-2 text-[#6B7280] hover:bg-[#F3F4F6] rounded-full transition-all duration-200 lg:flex"
                      data-tooltip-id="close-chat"
                      data-tooltip-content="Close Chat"
                    >
                      <X className="w-5 h-5" />
                      <Tooltip id="close-chat" className="bg-[#1E40AF] text-white" />
                    </button>
                  </>
                )}
              </div>
            </header>
            <div
              className="flex-1 overflow-y-auto scrollbar-thin px-4 py-2 bg-[#F3F4F6] max-h-[65vh] lg:max-h-[75vh]"
              ref={messagesContainerRef}
              onScroll={handleScroll}
            >
              {isLoading && <p className="text-center text-sm text-[#6B7280] py-4">Loading messages...</p>}
              {currentPage < totalPages && (
                <button
                  onClick={loadMoreMessages}
                  className="mx-auto mb-4 px-4 py-2 bg-white text-[#1F2937] text-sm rounded-full hover:bg-[#E5E7EB] transition-all duration-200 shadow-sm"
                >
                  Load More
                </button>
              )}
              {!isLoading && filteredMessages.length === 0 && (
                <p className="text-center text-sm text-[#6B7280] py-4">No messages match your search</p>
              )}
              <AnimatePresence>
                {filteredMessages.map((msg, index) => (
                  <motion.div
                    key={msg._id || `msg-${index}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className={`my-3 flex ${isSenderMessage(msg) ? 'justify-end' : 'justify-start'} ${selectionMode ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (selectionMode) {
                        toggleMessageSelection(msg._id);
                      }
                    }}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl relative shadow-sm ${
                        isSenderMessage(msg) ? 'bg-[#1E40AF] text-white rounded-br-none sender-bubble' : 'bg-white text-[#1F2937] rounded-bl-none receiver-bubble'
                      } ${selectedMessages.includes(msg._id) ? 'ring-2 ring-[#1E40AF]' : ''}`}
                    >
                      {selectionMode && !msg.isDeleted && (
                        <input
                          type="checkbox"
                          checked={selectedMessages.includes(msg._id)}
                          className={`absolute top-2 ${isSenderMessage(msg) ? 'right-2' : 'left-2'} h-4 w-4 text-[#1E40AF]`}
                          readOnly
                        />
                      )}
                      <p className="text-xs font-medium mb-1">
                        {msg.sender?._id === user?._id ? 'You' : msg.sender?.name || 'Anonymous'}
                      </p>
                      {msg.isDeleted ? (
                        <p className="text-xs italic text-[#6B7280]">This message was deleted</p>
                      ) : (
                        <>
                          {msg.content && <p className="text-sm break-words">{msg.content}</p>}
                          {msg.isEdited && (
                            <p className={`text-xs italic mt-1 ${isSenderMessage(msg) ? 'text-white/70' : 'text-[#6B7280]'}`}>
                              Edited
                            </p>
                          )}
                          {msg.fileUrl && (
                            <div className="mt-2">
                              {msg.contentType === 'image' && (
                                <img
                                  src={msg.fileUrl}
                                  alt={msg.fileName || 'Image'}
                                  className="max-w-full rounded-lg cursor-pointer"
                                  onClick={() => openMediaViewer(msg.fileUrl, 'image', msg.fileName || 'Image')}
                                />
                              )}
                              {msg.contentType === 'video' && (
                                <video
                                  src={msg.fileUrl}
                                  controls
                                  className="max-w-full rounded-lg"
                                />
                              )}
                              {msg.contentType === 'audio' && (
                                <audio src={msg.fileUrl} controls className="w-full" />
                              )}
                              {msg.contentType === 'application' && (
                                <div className="flex flex-col gap-1 text-sm">
                                  <button
                                    onClick={() => openMediaViewer(msg.fileUrl, msg.fileUrl.includes('.pdf') ? 'pdf' : 'application', msg.fileName || 'Document')}
                                    className={`${isSenderMessage(msg) ? 'text-white/80 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                                  >
                                    View {msg.fileName || 'Document'}
                                  </button>
                                  <a
                                    href={msg.fileUrl}
                                    download={msg.fileName || 'Document'}
                                    className={`${isSenderMessage(msg) ? 'text-white/80 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                                  >
                                    Download {msg.fileName || 'Document'}
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      <p className={`text-xs mt-1 text-right ${isSenderMessage(msg) ? 'text-white/60' : 'text-[#6B7280]'}`}>
                        {msg.createdAt ? moment.utc(msg.createdAt).tz('Africa/Lagos').format('h:mm A') : 'Unknown'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} className="pb-4" />
              {typingUsers[selectedChat._id]?.isTyping && typingUsers[selectedChat._id]?.id !== user?._id && (
                <p className="text-sm text-[#6B7280] italic py-2">
                  {users.find((u) => u._id === typingUsers[selectedChat._id]?.id)?.name || 'Someone'} is typing...
                </p>
              )}
            </div>
            <div className="bg-[#F3F4F6] px-4 py-3 flex items-center gap-3 border-t border-[#6B7280]/20 sticky bottom-0 z-10">
              {editingMessageId && (
                <div className="absolute -top-10 left-4 bg-white p-2 rounded shadow flex items-center gap-2 text-sm text-[#6B7280]">
                  Editing message...
                  <button
                    onClick={() => {
                      setEditingMessageId(null);
                      setNewMessage('');
                      setSelectionMode(null);
                      setSelectedMessages([]);
                    }}
                    className="p-1 hover:bg-[#F3F4F6] rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="relative flex-1">
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 z-20 mb-1 shadow-lg">
                    <EmojiPicker
                      onEmojiClick={(emoji) => setNewMessage((prev) => prev + emoji.emoji)}
                      theme="light"
                      emojiStyle="native"
                      skinTonesDisabled
                      height={320}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white border border-[#6B7280]/20 rounded-full p-2">
                  <button
                    ref={emojiButtonRef}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1 text-[#16A34A] hover:bg-[#F3F4F6] rounded transition-all duration-200"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 text-[#16A34A] hover:bg-[#F3F4F6] rounded transition-all duration-200"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={handleFileChange} />
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={editingMessageId ? 'Edit message...' : 'Message'}
                    className="flex-1 bg-transparent text-sm text-[#1F2937] focus:outline-none min-w-0"
                    disabled={selectionMode && !editingMessageId}
                  />
                  {file && (
                    <div className="flex items-center gap-1 text-sm text-[#6B7280] truncate max-w-[100px]">
                      {file.name}
                      <button onClick={() => setFile(null)} className="text-red-600 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {isUploading && <p className="text-sm text-[#6B7280]">Uploading...</p>}
                  <button
                    className="p-1 text-[#16A34A] hover:bg-[#F3F4F6] rounded transition-all duration-200"
                    title="Voice note"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && !file) || isUploading || (selectionMode && !editingMessageId)}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      (newMessage.trim() || file) && !isUploading && (!selectionMode || editingMessageId)
                        ? 'bg-[#1E40AF] text-white hover:bg-[#1E3A8A]'
                        : 'text-[#6B7280]'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            {showScrollButton && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-20 right-4 p-2 bg-[#1E40AF] text-white rounded-full shadow-lg hover:bg-[#1E3A8A] transition-all duration-200"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#6B7280] text-lg">
            Select a chat to begin
          </div>
        )}
      </section>
      {showGroupModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-sm mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[#1F2937]">
                {selectedChat?.type === 'group' ? 'Add Members' : 'New Group'}
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-[#6B7280] hover:text-[#1F2937]">
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedChat?.type !== 'group' && (
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name (optional)"
                className="w-full p-2 border border-[#6B7280]/20 rounded mb-4 text-sm"
              />
            )}
            <p className="text-sm font-medium mb-2">Select members</p>
            <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
              {users
                .filter((u) => !selectedChat?.members?.some((m) => m._id === u._id))
                .map((u) => (
                  <label key={u._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u._id)}
                      onChange={() => setSelectedUsers((prev) => prev.includes(u._id) ? prev.filter(id => id !== u._id) : [...prev, u._id])}
                      className="w-4 h-4 text-[#1E40AF] rounded"
                    />
                    {u.name}
                  </label>
                ))}
            </div>
            <button
              onClick={() => selectedChat?.type === 'group' ? handleAddMembers(selectedChat._id, selectedUsers) : handleCreateGroup()}
              className="w-full py-2 bg-[#1E40AF] text-white rounded hover:bg-[#1E3A8A] transition-all duration-200 text-sm"
            >
              {selectedChat?.type === 'group' ? 'Add' : 'Create'}
            </button>
          </motion.div>
        </motion.div>
      )}
      {showMembersModal && selectedChat?.type === 'group' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-sm mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[#1F2937]">{selectedChat.name} Members</h3>
              <button onClick={() => setShowMembersModal(false)} className="text-[#6B7280] hover:text-[#1F2937]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {(selectedChat.members || []).map((member) => (
                <div key={member._id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F3F4F6] text-[#1E40AF] flex items-center justify-center text-xs font-medium">
                    {getInitials(member.name)}
                  </div>
                  <p className="text-sm text-[#1F2937]">{member.name}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowMembersModal(false)}
              className="w-full mt-4 py-2 bg-[#F3F4F6] text-[#1F2937] rounded hover:bg-[#E5E7EB] transition-all duration-200 text-sm"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
      {mediaViewer.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[#1F2937] truncate">{mediaViewer.fileName}</h3>
              <div className="flex gap-2">
                <a href={mediaViewer.fileUrl} download className="py-2 px-4 bg-[#1E40AF] text-white text-sm rounded hover:bg-[#1E3A8A] transition-all duration-200">
                  Download
                </a>
                <button onClick={closeMediaViewer} className="p-2 text-[#6B7280] hover:bg-[#F3F4F6] rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {mediaViewer.contentType === 'image' && <img src={mediaViewer.fileUrl} alt="" className="max-w-full max-h-[70vh] mx-auto" />}
            {mediaViewer.contentType === 'video' && <video src={mediaViewer.fileUrl} controls className="max-w-full max-h-[70vh] mx-auto" />}
            {mediaViewer.contentType === 'audio' && <audio src={mediaViewer.fileUrl} controls className="w-full" />}
            {mediaViewer.contentType === 'pdf' && <iframe src={mediaViewer.fileUrl} className="w-full h-96" />}
            {mediaViewer.contentType === 'application' && <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(mediaViewer.fileUrl)}&embedded=true`} className="w-full h-96" />}
          </motion.div>
        </motion.div>
      )}
      <style jsx>{`
        .sender-bubble {
          position: relative;
        }
        .sender-bubble::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: -8px;
          width: 0;
          height: 0;
          border: 8px solid transparent;
          border-left-color: #1E40AF;
          border-bottom-color: #1E40AF;
          transform: rotate(45deg);
        }
        .receiver-bubble {
          position: relative;
        }
        .receiver-bubble::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: -8px;
          width: 0;
          height: 0;
          border: 8px solid transparent;
          border-right-color: #F3F4F6;
          border-bottom-color: #F3F4F6;
          transform: rotate(-45deg);
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #6B7280;
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #1E40AF;
        }
      `}</style>
    </div>
  );
};

export default TeamChat;