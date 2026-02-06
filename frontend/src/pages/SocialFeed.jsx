import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Send, Paperclip, Image, Video, FileText, ArrowLeft, Smile, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import moment from 'moment-timezone';
import { Tooltip } from 'react-tooltip';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
const API_BASE_URL = import.meta.env.VITE_API_URL;
const SocialFeed = () => {
    const { user, onLogout } = useOutletContext();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [postIds, setPostIds] = useState(new Set());
    const [newPost, setNewPost] = useState('');
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const fileInputRef = useRef(null);
    const observer = useRef();
    const modalRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const feedRef = useRef(null);
    const fetchedPages = useRef(new Set());
    const fetchTimeout = useRef(null);
    // Debug user context
    useEffect(() => {
        console.log('User from context:', user);
        if (!user?._id) {
            console.warn('User ID is missing or undefined');
        }
    }, [user]);
    // Socket.IO for real-time posts
    useEffect(() => {
        const socket = io(API_BASE_URL, {
            auth: { token: localStorage.getItem('token') },
        });
        socket.on('newPost', (post) => {
            console.log('Received new post:', post);
            setPosts((prev) => {
                if (postIds.has(post._id)) return prev;
                setPostIds((prevIds) => new Set([...prevIds, post._id]));
                return [post, ...prev];
            });
        });
        socket.on('postUpdated', (updatedPost) => {
            console.log('Received updated post:', updatedPost);
            setPosts((prev) =>
                prev.map((post) =>
                    post._id === updatedPost._id ? updatedPost : post
                )
            );
        });
        socket.on('postDeleted', (postId) => {
            console.log('Received deleted post ID:', postId);
            setPosts((prev) => prev.filter((post) => post._id !== postId));
            setPostIds((prevIds) => {
                const newIds = new Set(prevIds);
                newIds.delete(postId);
                return newIds;
            });
        });
        socket.on('connect_error', (error) => {
            console.error('Socket connect error:', error.message);
            toast.error('Real-time updates unavailable.', { style: { background: '#dc2626', color: '#fff' } });
        });
        return () => {
            socket.off('newPost');
            socket.off('postUpdated');
            socket.off('postDeleted');
            socket.disconnect();
        };
    }, [postIds]);
    // Axios interceptor for 401 handling
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    toast.error('Session expired. Please log in.', { style: { background: '#dc2626', color: '#fff' } });
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    onLogout?.();
                    navigate('/login');
                }
                return Promise.reject(error);
            }
        );
        return () => axios.interceptors.response.eject(interceptor);
    }, [onLogout, navigate]);
    // Modal focus trap and escape key handling
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedImage(null);
                setSelectedDoc(null);
                setShowEmojiPicker(false);
                setEditingPost(null);
                setShowDeleteConfirm(null);
            }
        };
        if (selectedImage || selectedDoc || showEmojiPicker || editingPost || showDeleteConfirm) {
            modalRef.current?.focus();
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage, selectedDoc, showEmojiPicker, editingPost, showDeleteConfirm]);
    // Close emoji picker, edit modal, or delete confirm when clicking outside
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
            if (
                editingPost &&
                modalRef.current &&
                !modalRef.current.contains(e.target)
            ) {
                setEditingPost(null);
                setEditContent('');
            }
            if (
                showDeleteConfirm &&
                modalRef.current &&
                !modalRef.current.contains(e.target)
            ) {
                setShowDeleteConfirm(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker, editingPost, showDeleteConfirm]);
    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Session expired. Please log in.', { style: { background: '#dc2626', color: '#fff' } });
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            onLogout?.();
            navigate('/login');
            throw new Error('No auth token');
        }
        return { Authorization: `Bearer ${token}` };
    }, [onLogout, navigate]);
    const fetchPosts = useCallback(
        async (pageNum) => {
            if (isLoading || !hasMore || fetchedPages.current.has(pageNum)) return;
            setIsLoading(true);
            fetchedPages.current.add(pageNum);
            console.log(`Fetching posts for page ${pageNum}`);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/posts?page=${pageNum}&limit=10`, {
                    headers: getAuthHeaders(),
                });
                const newPosts = response.data.posts;
                console.log('Fetched posts:', newPosts);
                setPosts((prev) => {
                    const newUniquePosts = newPosts.filter((post) => !postIds.has(post._id));
                    if (!newUniquePosts.length) return prev;
                    setPostIds((prevIds) => new Set([...prevIds, ...newUniquePosts.map((post) => post._id)]));
                    return [...prev, ...newUniquePosts];
                });
                setHasMore(newPosts.length === 10);
            } catch (error) {
                console.error('Fetch posts error:', error.response?.data || error.message);
                fetchedPages.current.delete(pageNum);
                if (error.response?.status !== 401) {
                    toast.error(error.response?.data?.message || 'Failed to fetch posts.', { style: { background: '#dc2626', color: '#fff' } });
                }
            } finally {
                setIsLoading(false);
            }
        },
        [getAuthHeaders, isLoading, hasMore, postIds]
    );
    useEffect(() => {
        if (!user || !localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        fetchPosts(page);
    }, [user, page, fetchPosts, navigate]);
    const lastPostElementRef = useCallback(
        (node) => {
            if (isLoading || !hasMore) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore && !fetchTimeout.current) {
                        fetchTimeout.current = setTimeout(() => {
                            console.log('Observer triggered, incrementing page');
                            setPage((prev) => prev + 1);
                            fetchTimeout.current = null;
                        }, 500);
                    }
                },
                { threshold: 0.1 }
            );
            if (node) observer.current.observe(node);
        },
        [isLoading, hasMore]
    );
    const handleFileChange = useCallback((e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 50 * 1024 * 1024) {
                toast.error('File size exceeds 50MB.', { style: { background: '#dc2626', color: '#fff' } });
                return;
            }
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
                setFilePreview(URL.createObjectURL(selectedFile));
            } else {
                setFilePreview(null);
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);
    const uploadFile = useCallback(
        async (file) => {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const response = await axios.post(`${API_BASE_URL}/api/posts/upload`, formData, {
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'multipart/form-data',
                    },
                });
                return response.data;
            } catch (error) {
                console.error('File upload error:', error.response?.data || error.message);
                throw new Error(error.response?.data?.message || 'Failed to upload file.');
            }
        },
        [getAuthHeaders]
    );
    const handleEmojiClick = useCallback((emojiObject) => {
        setNewPost((prev) => prev + emojiObject.emoji);
        if (editingPost) {
            setEditContent((prev) => prev + emojiObject.emoji);
        }
    }, [editingPost]);
    const handleCreatePost = useCallback(async () => {
        if (!newPost.trim() && !file) {
            toast.error('Post content or file required.', { style: { background: '#dc2626', color: '#fff' } });
            return;
        }
        setIsPosting(true);
        let fileUrl = '';
        let contentType = '';
        if (file) {
            try {
                const { fileUrl: uploadedUrl, contentType: fileContentType } = await uploadFile(file);
                fileUrl = uploadedUrl;
                contentType = fileContentType;
            } catch (error) {
                toast.error(error.message, { style: { background: '#dc2626', color: '#fff' } });
                setIsPosting(false);
                return;
            }
        }
        try {
            await axios.post(
                `${API_BASE_URL}/api/posts`,
                { content: newPost.trim(), fileUrl, contentType },
                { headers: getAuthHeaders() }
            );
            setNewPost('');
            setFile(null);
            setFilePreview(null);
            setShowEmojiPicker(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            toast.success('Post created!', { style: { background: '#16a34a', color: '#fff' } });
            feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Create post error:', error.response?.data || error.message);
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to create post.', { style: { background: '#dc2626', color: '#fff' } });
            }
        } finally {
            setIsPosting(false);
        }
    }, [newPost, file, getAuthHeaders]);
    const handleEditPost = useCallback(async (postId) => {
        if (!editContent.trim() && !file) {
            toast.error('Post content or file required.', { style: { background: '#dc2626', color: '#fff' } });
            return;
        }
        setIsPosting(true);
        let fileUrl = '';
        let contentType = '';
        if (file) {
            try {
                const { fileUrl: uploadedUrl, contentType: fileContentType } = await uploadFile(file);
                fileUrl = uploadedUrl;
                contentType = fileContentType;
            } catch (error) {
                toast.error(error.message, { style: { background: '#dc2626', color: '#fff' } });
                setIsPosting(false);
                return;
            }
        }
        try {
            const response = await axios.put(
                `${API_BASE_URL}/api/posts/${postId}`,
                { content: editContent.trim(), fileUrl, contentType },
                { headers: getAuthHeaders() }
            );
            const updatedPost = response.data.post;
            setPosts((prev) => {
                const otherPosts = prev.filter((post) => post._id !== postId);
                return [updatedPost, ...otherPosts];
            });
            setEditingPost(null);
            setEditContent('');
            setFile(null);
            setFilePreview(null);
            toast.success('Post updated!', { style: { background: '#16a34a', color: '#fff' } });
            feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Edit post error:', error.response?.data || error.message);
            if (error.response?.status === 403) {
                toast.error('You are not authorized to edit this post.', { style: { background: '#dc2626', color: '#fff' } });
            } else if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to update post.', { style: { background: '#dc2626', color: '#fff' } });
            }
        } finally {
            setIsPosting(false);
        }
    }, [editContent, file, getAuthHeaders]);
    const handleDeletePost = useCallback(async (postId) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/posts/${postId}`, {
                headers: getAuthHeaders(),
            });
            toast.success('Post deleted!', { style: { background: '#16a34a', color: '#fff' } });
        } catch (error) {
            console.error('Delete post error:', error.response?.data || error.message);
            if (error.response?.status === 403) {
                toast.error('You are not authorized to delete this post.', { style: { background: '#dc2626', color: '#fff' } });
            } else if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Failed to delete post.', { style: { background: '#dc2626', color: '#fff' } });
            }
        }
    }, [getAuthHeaders]);
    const handleConfirmDelete = useCallback((postId) => {
        setShowDeleteConfirm(postId);
    }, []);
    const handleCancelDelete = useCallback(() => {
        setShowDeleteConfirm(null);
    }, []);
    const handleConfirmDeleteAction = useCallback(async () => {
        if (showDeleteConfirm) {
            await handleDeletePost(showDeleteConfirm);
            setShowDeleteConfirm(null);
        }
    }, [showDeleteConfirm, handleDeletePost]);
    const startEditing = (post) => {
        setEditingPost(post._id);
        setEditContent(post.content || '');
        setFile(null);
        setFilePreview(null);
    };
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
    };
    if (!user || !localStorage.getItem('token')) {
        return null;
    }
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-white dark:bg-gray-900 flex flex-col font-sans antialiased"
        >
            <Toaster position="bottom-right" />
            <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                    <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Send className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Social Connect</h1>
                                <p className="text-sm text-blue-600 dark:text-blue-400">Share your updates</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center gap-2.5 px-5 py-2.5 bg-gray-50 dark:bg-gray-700 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 text-sm font-medium shadow-sm"
                                aria-label="Back to Dashboard"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Dashboard
                            </button>
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=1e40af&color=fff&bold=true`}
                                alt="User Avatar"
                                className="w-11 h-11 rounded-full border-2 border-blue-100 dark:border-blue-900 shadow-sm"
                            />
                        </div>
                    </header>
                    <main className="p-8">
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 mb-8 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 rounded-full bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center text-base font-bold flex-shrink-0 shadow-sm">
                                    {user.name
                                        .trim()
                                        .split(' ')
                                        .map((word) => word[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        value={newPost}
                                        onChange={(e) => setNewPost(e.target.value)}
                                        placeholder="What’s on your mind?"
                                        className="w-full p-3 text-base text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                                        rows="3"
                                        maxLength={1000}
                                        aria-label="New post content"
                                    />
                                    {file && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3 mt-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600"
                                        >
                                            {filePreview && file.type.startsWith('image/') && (
                                                <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                                            )}
                                            {filePreview && file.type.startsWith('video/') && (
                                                <video src={filePreview} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                                            )}
                                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">{file.name}</span>
                                            <button
                                                onClick={() => {
                                                    setFile(null);
                                                    setFilePreview(null);
                                                }}
                                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
                                                aria-label="Remove file"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </motion.div>
                                    )}
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex gap-2">
                                            <button
                                                ref={emojiButtonRef}
                                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                                                className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-xl transition-colors duration-200"
                                                data-tooltip-id="add-emoji"
                                                data-tooltip-content="Add Emoji"
                                                aria-label="Add Emoji"
                                            >
                                                <Smile className="w-5 h-5" />
                                                <Tooltip id="add-emoji" className="bg-blue-600 dark:bg-blue-700 text-white text-xs" />
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-xl transition-colors duration-200"
                                                data-tooltip-id="attach-image"
                                                data-tooltip-content="Image"
                                                aria-label="Attach Image"
                                            >
                                                <Image className="w-5 h-5" />
                                                <Tooltip id="attach-image" className="bg-blue-600 dark:bg-blue-700 text-white text-xs" />
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-xl transition-colors duration-200"
                                                data-tooltip-id="attach-video"
                                                data-tooltip-content="Video"
                                                aria-label="Attach Video"
                                            >
                                                <Video className="w-5 h-5" />
                                                <Tooltip id="attach-video" className="bg-blue-600 dark:bg-blue-700 text-white text-xs" />
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-xl transition-colors duration-200"
                                                data-tooltip-id="attach-doc"
                                                data-tooltip-content="Document"
                                                aria-label="Attach Document"
                                            >
                                                <FileText className="w-5 h-5" />
                                                <Tooltip id="attach-doc" className="bg-blue-600 dark:bg-blue-700 text-white text-xs" />
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <button
                                            onClick={handleCreatePost}
                                            disabled={(!newPost.trim() && !file) || isPosting}
                                            className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 text-sm shadow-sm ${
                                                newPost.trim() || file
                                                    ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-md'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                            } ${isPosting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            data-tooltip-id="post"
                                            data-tooltip-content="Post"
                                            aria-label="Share Post"
                                        >
                                            <Send className="w-5 h-5" />
                                            {isPosting ? 'Posting...' : 'Post'}
                                            <Tooltip id="post" className="bg-blue-600 dark:bg-blue-700 text-white text-xs" />
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {showEmojiPicker && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute left-0 top-full mt-2 z-30"
                                            >
                                                <EmojiPicker
                                                    onEmojiClick={handleEmojiClick}
                                                    theme="light"
                                                    emojiStyle="native"
                                                    skinTonesDisabled
                                                    className="shadow-xl rounded-xl border border-gray-200 dark:border-gray-700"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                        <div
                            className="space-y-6 overflow-y-auto pb-8 scroll-smooth"
                            role="region"
                            aria-label="Social Feed"
                            ref={feedRef}
                        >
                            <AnimatePresence>
                                {posts.map((post, index) => (
                                    <motion.div
                                        key={post._id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.25, delay: index * 0.03 }}
                                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300"
                                        ref={index === posts.length - 1 ? lastPostElementRef : null}
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-11 h-11 rounded-full bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center text-base font-bold flex-shrink-0 shadow-sm">
                                                {post.user.name
                                                    .trim()
                                                    .split(' ')
                                                    .map((word) => word[0])
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{post.user.name}</p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                                    {moment(post.createdAt).tz('Africa/Lagos').format('MMM D, YYYY [at] h:mm A')}
                                                </p>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => startEditing(post)}
                                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-xl transition-colors duration-200"
                                                    data-tooltip-id={`edit-post-${post._id}`}
                                                    data-tooltip-content="Edit"
                                                    aria-label="Edit Post"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                    <Tooltip id={`edit-post-${post._id}`} className="bg-blue-600 dark:bg-blue-700 text-white text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleConfirmDelete(post._id)}
                                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-xl transition-colors duration-200"
                                                    data-tooltip-id={`delete-post-${post._id}`}
                                                    data-tooltip-content="Delete"
                                                    aria-label="Delete Post"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                    <Tooltip id={`delete-post-${post._id}`} className="bg-blue-600 dark:bg-blue-700 text-white text-xs" />
                                                </button>
                                            </div>
                                        </div>
                                        {post.content && (
                                            <p className="text-base text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">{post.content}</p>
                                        )}
                                        {post.fileUrl && (
                                            <div className="mt-4 rounded-xl overflow-hidden shadow-sm">
                                                {post.contentType === 'image' && (
                                                    <img
                                                        src={post.fileUrl}
                                                        alt="Post media"
                                                        className="w-full h-auto rounded-xl cursor-pointer hover:opacity-95 transition-opacity duration-200"
                                                        loading="lazy"
                                                        onClick={() => setSelectedImage(post.fileUrl)}
                                                    />
                                                )}
                                                {post.contentType === 'video' && (
                                                    <video
                                                        src={post.fileUrl}
                                                        controls
                                                        className="w-full h-auto rounded-xl"
                                                        loading="lazy"
                                                    />
                                                )}
                                                {post.contentType === 'application' && (
                                                    <button
                                                        onClick={() => setSelectedDoc(post.fileUrl)}
                                                        className="w-full px-5 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 text-sm font-medium shadow-sm"
                                                        aria-label="View Document"
                                                    >
                                                        <FileText className="w-5 h-5 inline mr-2" /> View Document
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {isLoading && (
                                <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                                    Loading more posts...
                                </div>
                            )}
                            {!hasMore && posts.length > 0 && (
                                <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">No more posts</div>
                            )}
                        </div>
                    </main>
                </motion.div>
                {/* Image Modal */}
                <AnimatePresence>
                    {selectedImage && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={modalVariants}
                            className="fixed inset-0 bg-black/80 dark:bg-black/90 flex items-center justify-center z-50 p-6"
                            onClick={() => setSelectedImage(null)}
                            role="dialog"
                            aria-label="Image Preview"
                            ref={modalRef}
                            tabIndex={-1}
                        >
                            <div
                                className="relative max-w-5xl w-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={selectedImage}
                                    alt="Full preview"
                                    className="w-full h-auto rounded-2xl shadow-2xl"
                                />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-4 right-4 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg"
                                    aria-label="Close"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Document Modal */}
                <AnimatePresence>
                    {selectedDoc && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={modalVariants}
                            className="fixed inset-0 bg-black/80 dark:bg-black/90 flex items-center justify-center z-50 p-6"
                            onClick={() => setSelectedDoc(null)}
                            role="dialog"
                            aria-label="Document Preview"
                            ref={modalRef}
                            tabIndex={-1}
                        >
                            <div
                                className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <iframe
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedDoc)}&embedded=true`}
                                    className="w-full h-full border-0"
                                    title="Document Preview"
                                />
                                <button
                                    onClick={() => setSelectedDoc(null)}
                                    className="absolute top-4 right-4 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg"
                                    aria-label="Close"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={modalVariants}
                            className="fixed inset-0 bg-black/80 dark:bg-black/90 flex items-center justify-center z-50 p-6"
                            role="dialog"
                            aria-label="Delete Confirmation"
                            ref={modalRef}
                            tabIndex={-1}
                        >
                            <div
                                className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Delete Post?</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">This action cannot be undone.</p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={handleCancelDelete}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmDeleteAction}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-xl hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Edit Post Modal */}
                <AnimatePresence>
                    {editingPost && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={modalVariants}
                            className="fixed inset-0 bg-black/80 dark:bg-black/90 flex items-center justify-center z-50 p-6"
                            role="dialog"
                            aria-label="Edit Post"
                            ref={modalRef}
                            tabIndex={-1}
                        >
                            <div
                                className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Post</h2>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    placeholder="Update your post..."
                                    className="w-full p-3 text-base text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none transition-all duration-200"
                                    rows="4"
                                    maxLength={1000}
                                    aria-label="Edit post content"
                                />
                                {file && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                                    >
                                        {filePreview && file.type.startsWith('image/') && (
                                            <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                                        )}
                                        {filePreview && file.type.startsWith('video/') && (
                                            <video src={filePreview} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                                        )}
                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">{file.name}</span>
                                        <button
                                            onClick={() => {
                                                setFile(null);
                                                setFilePreview(null);
                                            }}
                                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
                                            aria-label="Remove file"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                )}
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-xl transition-colors duration-200"
                                            data-tooltip-id="attach-file-edit"
                                            data-tooltip-content="Attach"
                                            aria-label="Attach File"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                            <Tooltip id="attach-file-edit" className="bg-blue-600 dark:bg-blue-700 text-white text-xs" />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                                            onChange={handleFileChange}
                                        />
                                        <button
                                            ref={emojiButtonRef}
                                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                                            className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-xl transition-colors duration-200"
                                            data-tooltip-id="add-emoji-edit"
                                            data-tooltip-content="Emoji"
                                            aria-label="Add Emoji"
                                        >
                                            <Smile className="w-5 h-5" />
                                            <Tooltip id="add-emoji-edit" className="bg-blue-600 dark:bg-blue-700 text-white text-xs" />
                                        </button>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setEditingPost(null);
                                                setEditContent('');
                                                setFile(null);
                                                setFilePreview(null);
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleEditPost(editingPost)}
                                            disabled={(!editContent.trim() && !file) || isPosting}
                                            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                                                editContent.trim() || file
                                                    ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                            } ${isPosting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            {isPosting ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {showEmojiPicker && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute left-0 top-full mt-2 z-30"
                                        >
                                            <EmojiPicker
                                                onEmojiClick={handleEmojiClick}
                                                theme="light"
                                                emojiStyle="native"
                                                skinTonesDisabled
                                                className="shadow-xl rounded-xl border border-gray-200 dark:border-gray-700"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <button
                                    onClick={() => {
                                        setEditingPost(null);
                                        setEditContent('');
                                        setFile(null);
                                        setFilePreview(null);
                                    }}
                                    className="absolute top-4 right-4 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <style jsx>{`
                .scrollbar-thin {
                    scrollbar-width: thin;
                }
                .scrollbar-thin::-webkit-scrollbar {
                    width: 5px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #93c5fd;
                    border-radius: 10px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #60a5fa;
                }
            `}</style>
        </motion.div>
    );
};
export default SocialFeed;