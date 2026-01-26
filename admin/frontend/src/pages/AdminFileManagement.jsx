import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import {
    Upload, Trash2, FileText, Image, Video, Download, List, Grid,
    Search, Tag, Folder, ChevronRight, Plus, Info, Link2, FolderPlus,
    Users, HardDrive, ChevronDown, ChevronUp, X, Edit2, Eye,
    BarChart2, PieChart, File,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FilePreviewModal = ({ isOpen, onClose, file }) => {
    if (!isOpen || !file) return null;

    const url = `https://gateway.pinata.cloud/ipfs/${file.cid}`;
    const type = file.type?.toLowerCase();
    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

    const renderPreview = () => {
        if (['jpg', 'jpeg', 'png'].includes(type)) {
            return <img src={url} alt={file.fileName} className="w-full h-auto rounded-lg max-h-[70vh] object-contain" />;
        }
        if (['mp4', 'webm'].includes(type)) {
            return <video controls autoPlay muted className="w-full max-h-[70vh] rounded-lg"><source src={url} type={`video/${type}`} /></video>;
        }
        if (['pdf', 'docx', 'doc'].includes(type)) {
            return (
                <iframe
                    src={type === 'pdf' ? url : googleDocsUrl}
                    className="w-full h-[70vh] rounded-lg"
                    title={`${file.fileName} Preview`}
                    frameBorder="0"
                    allowFullScreen
                />
            );
        }
        return <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center"><p className="text-gray-500">No preview available</p></div>;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-teal-700 truncate">{file.fileName}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-teal-600" /></button>
                </div>
                {renderPreview()}
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Size:</span> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p><span className="font-medium">Type:</span> {file.type}</p>
                    <p><span className="font-medium">Uploaded:</span> {new Date(file.uploadedAt).toLocaleString()}</p>
                    <p><span className="font-medium">Owner:</span> {file.ownerName}</p>
                </div>
            </motion.div>
        </motion.div>
    );
};

const UploadModal = ({ isOpen, onClose, users, onUpload, tasks, currentFolderId }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [taskId, setTaskId] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState(null);
    const [userSearchQuery, setUserSearchQuery] = useState('');

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) {
            setError('Please select at least one file');
        } else if (files.some(file => file.size > 25 * 1024 * 1024)) {
            setError('One or more files exceed the 25MB limit');
        } else {
            setSelectedFiles(files);
            setError(null);
        }
    };

    const handleUserChange = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
        if (selectedUserIds.length === 0 && !selectedUserIds.includes(userId)) {
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFiles.length) {
            setError('Please select at least one file');
            return;
        }
        if (!selectedUserIds.length) {
            setError('Please select at least one user');
            return;
        }

        try {
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });
            formData.append('userIds', JSON.stringify(selectedUserIds));
            if (taskId) formData.append('taskId', taskId);
            if (tags) formData.append('tags', tags);
            if (currentFolderId) formData.append('folderId', currentFolderId);

            await onUpload(formData);
            setSelectedFiles([]);
            setSelectedUserIds([]);
            setTaskId('');
            setTags('');
            setUserSearchQuery('');
            setError(null);
            toast.success('Files uploaded successfully');
            onClose();
        } catch (err) {
            console.error('Upload error:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Upload failed');
            toast.error(err.response?.data?.message || 'Upload failed');
        }
    };

    const filteredUsers = users
        .filter(user =>
            user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const aMatch = a.name.toLowerCase().startsWith(userSearchQuery.toLowerCase());
            const bMatch = b.name.toLowerCase().startsWith(userSearchQuery.toLowerCase());
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return a.name.localeCompare(b.name);
        });

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-teal-700 mb-4">Upload Files</h3>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-600">Select Users</label>
                        <div className="relative mb-2">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
                        </div>
                        <div className="max-h-40 overflow-y-auto border border-teal-200 rounded-lg p-2 bg-white">
                            {filteredUsers.length === 0 ? (
                                <p className="text-sm text-gray-500">No users found</p>
                            ) : (
                                filteredUsers.map(user => (
                                    <label key={user._id} className="flex items-center gap-2 p-2 hover:bg-teal-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedUserIds.includes(user._id)}
                                            onChange={() => handleUserChange(user._id)}
                                            className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-400"
                                        />
                                        <span className="text-sm text-gray-700">{user.name} ({user.email})</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Files</label>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                            required
                            accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.mp4,.webm,.xls,.xlsx"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Task</label>
                        <select
                            value={taskId}
                            onChange={(e) => setTaskId(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                        >
                            <option value="">No Task</option>
                            {tasks.map(task => (
                                <option key={task._id} value={task._id}>{task.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Tags</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g., report, urgent"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!selectedFiles.length || !selectedUserIds.length}
                        className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition-all duration-300"
                    >
                        Upload
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const AdminFileManager = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewModal, setPreviewModal] = useState(false);
    const [uploadModal, setUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [userStats, setUserStats] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'fileName', direction: 'asc' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filesLoaded, setFilesLoaded] = useState(false);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: usersData } = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
            });
            setUsers(usersData.users);

            const stats = await Promise.all(
                usersData.users.map(async (user) => {
                    try {
                        const storageRes = await axios.get(`${API_BASE_URL}/api/admin/users/${user._id}/storage`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
                        });
                        return {
                            userId: user._id,
                            name: user.name,
                            email: user.email,
                            storageUsed: storageRes.data.storageUsed || 0,
                            totalStorage: storageRes.data.totalStorage || 2 * 1024 * 1024 * 1024,
                            fileCount: storageRes.data.fileCount || 0,
                        };
                    } catch (err) {
                        console.error(`Error fetching stats for user ${user._id}:`, err);
                        return null;
                    }
                })
            );
            setUserStats(stats.filter(stat => stat !== null));

            const allFolders = await Promise.all(
                usersData.users.map(async (user) => {
                    try {
                        const foldersRes = await axios.get(`${API_BASE_URL}/api/admin/users/${user._id}/folders`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
                        });
                        return (foldersRes.data.folders || []).map(folder => ({
                            ...folder,
                            userId: user._id,
                        }));
                    } catch (err) {
                        console.error(`Error fetching folders for user ${user._id}:`, err);
                        return [];
                    }
                })
            );
            setFolders(allFolders.flat());

            setSuccess('Initial data loaded successfully');
        } catch (err) {
            console.error('Fetch initial data error:', err);
            toast.error('Failed to fetch initial data');
            setError('Failed to fetch initial data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchFiles = useCallback(async (userId = '') => {
        setIsLoading(true);
        try {
            if (userId) {
                const filesRes = await axios.get(`${API_BASE_URL}/api/admin/users/${userId}/files`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
                });
                const userFiles = (filesRes.data.files || []).map(file => ({
                    ...file,
                    ownerId: userId,
                    ownerName: users.find(u => u._id === userId)?.name || 'Unknown',
                }));
                setFiles(userFiles);
                setFilesLoaded(true);
                setSuccess(`Files loaded for ${users.find(u => u._id === userId)?.name || 'user'}`);
            } else {
                const allFiles = await Promise.all(
                    users.map(async (user) => {
                        try {
                            const filesRes = await axios.get(`${API_BASE_URL}/api/admin/users/${user._id}/files`, {
                                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
                            });
                            return (filesRes.data.files || []).map(file => ({
                                ...file,
                                ownerId: user._id,
                                ownerName: user.name || 'Unknown',
                            }));
                        } catch (err) {
                            console.error(`Error fetching files for user ${user._id}:`, err);
                            return [];
                        }
                    })
                );
                setFiles(allFiles.flat());
                setFilesLoaded(true);
                setSuccess('All files loaded successfully');
            }
        } catch (err) {
            console.error('Fetch files error:', err);
            toast.error('Failed to fetch files');
            setError('Failed to fetch files');
        } finally {
            setIsLoading(false);
        }
    }, [users]);

    const fetchUserData = useCallback(async (userId) => {
        if (!userId) {
            fetchInitialData();
            setFiles([]);
            setFilesLoaded(false);
            return;
        }
        setIsLoading(true);
        try {
            const [filesRes, foldersRes, storageRes, tasksRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/users/${userId}/files`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
                }),
                axios.get(`${API_BASE_URL}/api/admin/users/${userId}/folders`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
                }),
                axios.get(`${API_BASE_URL}/api/admin/users/${userId}/storage`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
                }),
                axios.get(`${API_BASE_URL}/api/admin/tasks?ownerId=${userId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
                }),
            ]);

            const userFiles = (filesRes.data.files || []).map(file => ({
                ...file,
                ownerId: userId,
                ownerName: users.find(u => u._id === userId)?.name || 'Unknown',
            }));
            setFiles(userFiles);
            setFolders(foldersRes.data.folders || []);
            setUserStats([{
                userId,
                name: users.find(u => u._id === userId)?.name || 'Unknown',
                email: users.find(u => u._id === userId)?.email || 'Unknown',
                storageUsed: storageRes.data.storageUsed || 0,
                totalStorage: storageRes.data.totalStorage || 2 * 1024 * 1024 * 1024,
                fileCount: userFiles.length,
            }]);
            setTasks(tasksRes.data.tasks || []);
            setFilesLoaded(true);
            setSuccess(`Data loaded successfully for ${users.find(u => u._id === userId)?.name || 'user'}`);
        } catch (err) {
            console.error('Fetch user data error:', err);
            toast.error('Failed to fetch user data');
            setError('Failed to fetch user data');
        } finally {
            setIsLoading(false);
        }
    }, [users, fetchInitialData]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleUpload = async (formData) => {
        try {
            const { data } = await axios.post(`${API_BASE_URL}/api/admin/users/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Upload response:', data);
            toast.success('Files uploaded successfully');
            fetchUserData(selectedUserId);
        } catch (err) {
            console.error('Upload request error:', err.response?.data || err.message);
            throw err;
        }
    };

    const handleDelete = async (fileId, permanent = false) => {
        if (!window.confirm(permanent ? 'Permanently delete this file?' : 'Move to trash?')) return;
        setIsLoading(true);
        try {
            const file = files.find(f => f._id === fileId);
            if (!file || !file.ownerId) throw new Error('File or owner not found');
            await axios[permanent ? 'delete' : 'patch'](
                `${API_BASE_URL}/api/admin/users/${file.ownerId}/files/${fileId}${permanent ? '' : '/delete'}`,
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
            );
            toast.success(permanent ? 'File permanently deleted' : 'File moved to trash');
            setSuccess(permanent ? 'File permanently deleted!' : 'File moved to trash!');
            selectedUserId ? fetchUserData(selectedUserId) : fetchFiles();
        } catch (err) {
            console.error('Delete error:', err);
            toast.error(err.response?.data?.message || 'Delete failed');
            setError(err.response?.data?.message || 'Delete failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreview = (file) => {
        setSelectedFile(file);
        setPreviewModal(true);
        setSuccess(`Previewing ${file.fileName}`);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedFiles = [...files].sort((a, b) => {
            if (key === 'size') {
                return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
            }
            return direction === 'asc'
                ? a[key].localeCompare(b[key])
                : b[key].localeCompare(a[key]);
        });
        setFiles(sortedFiles);
    };

    const handleUserSelect = (userId) => {
        setSelectedUserId(userId);
        setCurrentFolder(null);
        setSearchQuery('');
        setSuccess(userId ? `Viewing files for ${users.find(u => u._id === userId)?.name || 'user'}` : 'Viewing all users');
        fetchUserData(userId);
    };

    const handleViewAllFiles = () => {
        fetchFiles();
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    const getFileIcon = (type) => {
        type = type?.toLowerCase();
        if (['jpg', 'jpeg', 'png'].includes(type)) return <Image className="w-6 h-6 text-teal-600" />;
        if (['mp4', 'webm'].includes(type)) return <Video className="w-6 h-6 text-blue-600" />;
        if (type === 'pdf') return <FileText className="w-6 h-6 text-red-600" />;
        if (['docx', 'doc'].includes(type)) return <FileText className="w-6 h-6 text-blue-500" />;
        return <FileText className="w-6 h-6 text-gray-600" />;
    };

    const filteredFiles = files
        .filter(file =>
            (file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (file.tags && file.tags.toLowerCase().includes(searchQuery.toLowerCase())) ||
                file.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (currentFolder ? file.folderId === currentFolder : true)
        )
        .sort((a, b) => {
            const aMatch = a.fileName.toLowerCase().startsWith(searchQuery.toLowerCase());
            const bMatch = b.fileName.toLowerCase().startsWith(searchQuery.toLowerCase());
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });

    const selectedUserStats = userStats.find(stat => stat.userId === selectedUserId);

    const storageUsageData = selectedUserId && selectedUserStats ? {
        labels: [selectedUserStats.name],
        datasets: [
            {
                label: 'Storage Used (MB)',
                data: [(selectedUserStats.storageUsed || 0) / 1024 / 1024],
                backgroundColor: '#00CED1',
            },
        ],
    } : {
        labels: userStats.map(stat => stat.name),
        datasets: [
            {
                label: 'Storage Used (MB)',
                data: userStats.map(stat => (stat.storageUsed || 0) / 1024 / 1024),
                backgroundColor: '#00CED1',
            },
        ],
    };

    const fileTypeData = {
        labels: ['PDF', 'Image', 'Video', 'DOCX', 'Other'],
        datasets: [
            {
                data: [
                    filteredFiles.filter(f => f.type?.toLowerCase() === 'pdf').length,
                    filteredFiles.filter(f => ['jpg', 'jpeg', 'png'].includes(f.type?.toLowerCase())).length,
                    filteredFiles.filter(f => ['mp4', 'webm'].includes(f.type?.toLowerCase())).length,
                    filteredFiles.filter(f => ['docx', 'doc'].includes(f.type?.toLowerCase())).length,
                    filteredFiles.filter(f => !['pdf', 'jpg', 'jpeg', 'png', 'mp4', 'webm', 'docx', 'doc'].includes(f.type?.toLowerCase())).length,
                ],
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6A4C93', '#FF9F1C'],
                borderColor: '#FFFFFF',
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#2D3748' },
            },
            tooltip: {
                backgroundColor: '#2D3748',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
            },
        },
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#2D3748' },
            },
            tooltip: {
                backgroundColor: '#2D3748',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
            },
        },
        scales: {
            x: { ticks: { color: '#2D3748' } },
            y: {
                ticks: { color: '#2D3748' },
                title: {
                    display: true,
                    text: 'Storage (MB)',
                    color: '#2D3748',
                },
            },
        },
    };

    return (
        <div className="p-8 bg-gradient-to-b from-teal-50 to-white min-h-screen">
            <Toaster position="top-right" />
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-teal-700 flex items-center">
                        <HardDrive className="w-8 h-8 mr-3 text-teal-600" />
                        File Management Dashboard
                    </h1>
                    <div className="flex items-center gap-3">
                        {selectedUserId && (
                            <button
                                onClick={() => handleUserSelect('')}
                                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-all duration-300 shadow-md flex items-center"
                                aria-label="Back to all users"
                            >
                                <ChevronRight className="w-5 h-5 mr-2 transform rotate-180" />
                                All Users
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="px-5 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-300 shadow-md flex items-center"
                            aria-label="Back to dashboard"
                        >
                            <ChevronRight className="w-5 h-5 mr-2 transform rotate-180" />
                            Dashboard
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-8 items-center">
                    <div className="relative flex-1 min-w-[250px]">
                        <input
                            type="text"
                            placeholder="Search files, tags, or owners..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 shadow-sm"
                            aria-label="Search files"
                        />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-600" size={20} />
                    </div>
                    <select
                        value={selectedUserId}
                        onChange={(e) => handleUserSelect(e.target.value)}
                        className="p-3 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 shadow-sm min-w-[200px]"
                        aria-label="Filter by user"
                    >
                        <option value="">All Users</option>
                        {users.map(user => (
                            <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-3 rounded-full ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'bg-white text-teal-600'} hover:bg-teal-500 hover:text-white transition-all duration-300 shadow-sm`}
                            aria-label="Grid view"
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-3 rounded-full ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'bg-white text-teal-600'} hover:bg-teal-500 hover:text-white transition-all duration-300 shadow-sm`}
                            aria-label="List view"
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-xl"
                >
                    <h3 className="text-xl font-semibold text-teal-700 flex items-center mb-4">
                        <Users className="w-6 h-6 mr-2" />
                        {selectedUserId ? `${userStats.find(stat => stat.userId === selectedUserId)?.name} Statistics` : 'All Users Statistics'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(selectedUserId ? userStats.filter(stat => stat.userId === selectedUserId) : userStats).map(stat => (
                            <motion.div
                                key={stat.userId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="p-4 bg-teal-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                                onClick={() => handleUserSelect(stat.userId)}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5 text-teal-600" />
                                    <h4 className="text-lg font-medium text-teal-700 truncate">{stat.name}</h4>
                                </div>
                                <p className="text-sm text-gray-600 truncate">Email: {stat.email}</p>
                                <p className="text-sm text-gray-600">Files: {stat.fileCount}</p>
                                <p className="text-sm text-gray-600">Storage Used: {formatFileSize(stat.storageUsed)} of {formatFileSize(stat.totalStorage)}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${((stat.storageUsed / stat.totalStorage) * 100) > 80 ? 'bg-red-600' : 'bg-teal-600'}`}
                                        style={{ width: `${(stat.storageUsed / stat.totalStorage) * 100}%` }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {!selectedUserId && !filesLoaded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8 flex justify-center"
                    >
                        <button
                            onClick={handleViewAllFiles}
                            className="px-6 py-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 flex items-center transition-all duration-300 shadow-md"
                            aria-label="View all files"
                        >
                            <File className="w-5 h-5 mr-2" />
                            View All Files
                        </button>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-xl">
                        <h3 className="text-xl font-semibold text-teal-700 flex items-center mb-4">
                            <PieChart className="w-6 h-6 mr-2" />
                            File Type Distribution
                        </h3>
                        <div className="h-64 flex justify-center">
                            <Pie data={fileTypeData} options={chartOptions} />
                        </div>
                    </div>
                    <div className="bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-xl">
                        <h3 className="text-xl font-semibold text-teal-700 flex items-center mb-4">
                            <BarChart2 className="w-6 h-6 mr-2" />
                            Storage Usage
                        </h3>
                        <div className="h-64">
                            <Bar data={storageUsageData} options={barChartOptions} />
                        </div>
                    </div>
                </div>

                <div className="mb-8 bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-xl">
                    <h3 className="text-xl font-semibold text-teal-700 flex items-center mb-4">
                        <Folder className="w-6 h-6 mr-2" />
                        Folders
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {folders
                            .filter(folder => selectedUserId ? folder.userId === selectedUserId : true)
                            .map(folder => (
                                <motion.div
                                    key={folder._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-teal-50 hover:bg-teal-100 cursor-pointer transition-all duration-300"
                                    onClick={() => setCurrentFolder(folder._id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Folder className="w-5 h-5 text-teal-600" />
                                        <span className="text-gray-700 truncate">{folder.name}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-teal-600" />
                                </motion.div>
                            ))}
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => setUploadModal(true)}
                        className="px-5 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 flex items-center transition-all duration-300 shadow-md"
                        aria-label="Upload files"
                    >
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Files
                    </button>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-500 text-sm text-center mb-6"
                    >
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-teal-600 text-sm text-center mb-6"
                    >
                        {success}
                    </motion.div>
                )}

                {filesLoaded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}
                    >
                        <AnimatePresence>
                            {filteredFiles.map(file => (
                                <motion.div
                                    key={file._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => handlePreview(file)}>
                                        {getFileIcon(file.type)}
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-medium text-gray-800 truncate">{file.fileName}</p>
                                            <p className="text-xs text-gray-500 truncate">Owner: {file.ownerName}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1">
                                        <p>Size: {formatFileSize(file.size)}</p>
                                        <p>Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            onClick={() => handlePreview(file)}
                                            className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                            aria-label={`Preview ${file.fileName}`}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file._id, false)}
                                            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                                            aria-label={`Move ${file.fileName} to trash`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file._id, true)}
                                            className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-300"
                                            aria-label={`Permanently delete ${file.fileName}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                <FilePreviewModal
                    isOpen={previewModal}
                    onClose={() => setPreviewModal(false)}
                    file={selectedFile}
                />
                <UploadModal
                    isOpen={uploadModal}
                    onClose={() => setUploadModal(false)}
                    users={users}
                    onUpload={handleUpload}
                    tasks={tasks}
                    currentFolderId={currentFolder}
                />

                {isLoading && (
                    <div className="fixed inset-0 bg-teal-50 bg-opacity-80 flex items-center justify-center z-50">
                        <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default AdminFileManager;