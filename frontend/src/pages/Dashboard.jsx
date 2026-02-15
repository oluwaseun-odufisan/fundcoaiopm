import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Star, Flag, CircleDot, Clock, Filter, Plus, Rocket, Search, ArrowUpDown, PieChart, CircleCheck, Layers, CheckCircle, Pen, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import TaskItem from '../components/TaskItem';
import axios from 'axios';
import TaskModal from '../components/TaskModal';
import io from 'socket.io-client';
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/tasks`;
const USER_API_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:4001';
const TaskActionModal = ({ isOpen, onClose, onAction }) => {
    if (!isOpen) return null;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-950/80 dark:bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-[1000] px-4 sm:px-6"
            onClick={onClose}
            role="dialog"
            aria-label="Task Actions Modal"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md border border-blue-200/50 dark:border-gray-700/50 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 truncate">Task Actions</h3>
                <div className="space-y-2 sm:space-y-3">
                    <button
                        onClick={() => onAction('complete')}
                        className="w-full flex items-center gap-2 sm:gap-3 bg-green-100/50 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-green-200/70 dark:hover:bg-green-800/70 transition-all duration-200 text-sm sm:text-base"
                    >
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Mark as Done
                    </button>
                    <button
                        onClick={() => onAction('edit')}
                        className="w-full flex items-center gap-2 sm:gap-3 bg-blue-100/50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-200/70 dark:hover:bg-blue-800/70 transition-all duration-200 text-sm sm:text-base"
                    >
                        <Pen className="w-4 h-4 sm:w-5 sm:h-5" /> Edit Task
                    </button>
                    <button
                        onClick={() => onAction('delete')}
                        className="w-full flex items-center gap-2 sm:gap-3 bg-red-100/50 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-red-200/70 dark:hover:bg-red-800/70 transition-all duration-200 text-sm sm:text-base"
                    >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> Delete Task
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="mt-3 sm:mt-4 w-full text-gray-600 dark:text-gray-400 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                    Cancel
                </button>
            </motion.div>
        </motion.div>
    );
};
const DeleteConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-950/80 dark:bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-[1000] px-4 sm:px-6"
            onClick={onCancel}
            role="dialog"
            aria-label="Delete Confirmation Modal"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 truncate">Delete Task?</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 line-clamp-3">Are you sure you want to delete this task? This action cannot be undone.</p>
                <div className="flex gap-2 sm:gap-3">
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-500 dark:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 dark:hover:bg-red-500 transition-all duration-200 text-xs sm:text-sm"
                    >
                        Yes
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-xs sm:text-sm"
                    >
                        No
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
const Dashboard = () => {
    const { user, tasks, fetchTasks: refreshTasks, onLogout } = useOutletContext();
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('dueDate');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [localTasks, setLocalTasks] = useState(tasks);
    // Socket.IO setup
    useEffect(() => {
        const socket = io(USER_API_URL, {
            auth: { token: localStorage.getItem('token') },
        });
        socket.on('connect', () => console.log('User socket connected:', socket.id));
        socket.on('newTask', (task) => {
            if (task.owner?._id === user?.id) {
                setLocalTasks((prev) => [...prev, task]);
            }
        });
        socket.on('updateTask', (updatedTask) => {
            if (updatedTask.owner?._id === user?.id) {
                setLocalTasks((prev) =>
                    prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
                );
            } else {
                setLocalTasks((prev) => prev.filter((task) => task._id !== updatedTask._id));
            }
        });
        socket.on('deleteTask', (taskId) => {
            setLocalTasks((prev) => prev.filter((task) => task._id !== taskId));
        });
        socket.on('connect_error', (err) => {
            console.error('User socket connection error:', err.message);
        });
        return () => {
            socket.disconnect();
            console.log('User socket disconnected');
        };
    }, [user?.id]);
    // Sync local tasks with context tasks
    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);
    // Live Clock for WAT (UTC+1)
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    // Stats
    const stats = useMemo(() => {
        const now = new Date();
        return {
            total: localTasks.length,
            completed: localTasks.filter(t => t.completed === true || t.completed === 1 || (typeof t.completed === 'string' && t.completed.toLowerCase() === 'yes')).length,
            undone: localTasks.filter(t => t.completed === false || t.completed === 0 || (typeof t.completed === 'string' && t.completed.toLowerCase() === 'no')).length,
            highPriority: localTasks.filter(t => t.priority?.toLowerCase() === 'high').length,
            mediumPriority: localTasks.filter(t => t.priority?.toLowerCase() === 'medium').length,
            lowPriority: localTasks.filter(t => t.priority?.toLowerCase() === 'low').length,
            overdue: localTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && !(t.completed === true || t.completed === 1 || (typeof t.completed === 'string' && t.completed.toLowerCase() === 'yes'))).length,
        };
    }, [localTasks]);
    // Filtered and Sorted Tasks
    const filteredTasks = useMemo(() => {
        let filtered = localTasks.filter(task => {
            if (!task || !task.title) return false;
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            const nextMonth = new Date(today);
            nextMonth.setMonth(today.getMonth() + 1);
            const searchLower = search.toLowerCase();
            const matchesSearch = task.title.toLowerCase().includes(searchLower) || (task.description || '').toLowerCase().includes(searchLower);
            switch (filter) {
                case 'today':
                    return dueDate && dueDate.toDateString() === today.toDateString() && matchesSearch;
                case 'week':
                    return dueDate && dueDate >= today && dueDate <= nextWeek && matchesSearch;
                case 'month':
                    return dueDate && dueDate >= today && dueDate <= nextMonth && matchesSearch;
                case 'high':
                case 'medium':
                case 'low':
                    return task.priority?.toLowerCase() === filter && matchesSearch;
                case 'done':
                    return (task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')) && matchesSearch;
                case 'undone':
                    return (task.completed === false || task.completed === 0 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'no')) && matchesSearch;
                case 'overdue':
                    return dueDate && dueDate < today && !(task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')) && matchesSearch;
                default:
                    return matchesSearch;
            }
        });
        return filtered.sort((a, b) => {
            if (sort === 'dueDate') {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                return dateA - dateB;
            } else if (sort === 'priority') {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return (priorityOrder[b.priority?.toLowerCase()] || 0) - (priorityOrder[a.priority?.toLowerCase()] || 0);
            } else if (sort === 'title') {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });
    }, [localTasks, filter, search, sort]);
    // API Helpers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token found');
        return { Authorization: `Bearer ${token}` };
    };
    // Handle Task Completion
    const handleComplete = async (task) => {
        try {
            const headers = getAuthHeaders();
            await axios.put(`${API_BASE_URL}/${task._id}/gp`, { completed: 'Yes' }, { headers });
            await refreshTasks();
            setShowActionModal(false);
            setSelectedTask(null);
        } catch (error) {
            console.error('Error marking task as done:', error.response?.data || error.message);
            if (error.response?.status === 401) onLogout?.();
        }
    };
    // Handle Task Deletion
    const handleDelete = async () => {
        try {
            const headers = getAuthHeaders();
            await axios.delete(`${API_BASE_URL}/${selectedTask._id}/gp`, { headers });
            await refreshTasks();
            setShowDeleteConfirm(false);
            setShowActionModal(false);
            setSelectedTask(null);
        } catch (error) {
            console.error('Error deleting task:', error.response?.data || error.message);
            if (error.response?.status === 401) onLogout?.();
        }
    };
    // Handle Task Save (Modal)
    const handleTaskSave = useCallback(
        async (taskData) => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("No authentication token found");
                const payload = {
                    title: taskData.title?.trim() || "",
                    description: taskData.description || "",
                    priority: taskData.priority || "Low",
                    dueDate: taskData.dueDate || undefined,
                    completed: taskData.completed === "Yes" || taskData.completed === true,
                };
                if (!payload.title) {
                    console.error("Task title is required");
                    return;
                }
                if (taskData._id) {
                    await axios.put(`${API_BASE_URL}/${taskData._id}/gp`, payload, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                } else {
                    await axios.post(
                        `${API_BASE_URL}/gp`,
                        { ...payload, userId: user?.id || null },
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                }
                await refreshTasks();
                setShowModal(false);
                setSelectedTask(null);
            } catch (error) {
                console.error("Error saving task:", error.response?.data || error.message);
                if (error.response?.status === 401) onLogout?.();
            }
        },
        [refreshTasks, user, onLogout]
    );
    // Handle Task Action Selection
    const handleAction = (action) => {
        if (action === 'complete') {
            handleComplete(selectedTask);
        } else if (action === 'edit') {
            setShowActionModal(false);
            setShowModal(true);
        } else if (action === 'delete') {
            setShowDeleteConfirm(true);
        }
    };
    const FILTER_LABELS = {
        all: 'All',
        today: 'Today',
        week: 'Week',
        month: 'Month',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        done: 'Done',
        undone: 'Undone',
        overdue: 'Overdue',
    };
    const FILTER_OPTIONS = ['all', 'today', 'week', 'month', 'high', 'medium', 'low', 'done', 'undone', 'overdue'];
    const SORT_OPTIONS = [
        { value: 'dueDate', label: 'Due Date', icon: Clock },
        { value: 'priority', label: 'Priority', icon: Flag },
        { value: 'title', label: 'Title', icon: CircleDot },
    ];
    const STATS = [
        { key: 'total', label: 'Total', icon: Rocket, color: 'bg-blue-500/15 dark:bg-blue-900/15 text-blue-600 dark:text-blue-400', valueKey: 'total', textColor: 'text-blue-700 dark:text-blue-300', tooltip: 'Total number of tasks you have' },
        { key: 'completed', label: 'Done', icon: CircleCheck, color: 'bg-green-500/15 dark:bg-green-900/15 text-green-600 dark:text-green-400', valueKey: 'completed', textColor: 'text-green-700 dark:text-green-300', tooltip: 'Number of completed tasks' },
        { key: 'undone', label: 'Undone', icon: Layers, color: 'bg-amber-500/15 dark:bg-amber-900/15 text-amber-600 dark:text-amber-400', valueKey: 'undone', textColor: 'text-amber-700 dark:text-amber-300', tooltip: 'Number of pending tasks' },
        { key: 'highPriority', label: 'High', icon: Flag, color: 'bg-indigo-500/15 dark:bg-indigo-900/15 text-indigo-600 dark:text-indigo-400', valueKey: 'highPriority', textColor: 'text-indigo-700 dark:text-indigo-300', tooltip: 'Number of high priority tasks' },
        { key: 'mediumPriority', label: 'Medium', icon: Flag, color: 'bg-amber-500/15 dark:bg-amber-900/15 text-amber-600 dark:text-amber-400', valueKey: 'mediumPriority', textColor: 'text-amber-700 dark:text-amber-300', tooltip: 'Number of medium priority tasks' },
        { key: 'lowPriority', label: 'Low', icon: Flag, color: 'bg-gray-500/15 dark:bg-gray-700/15 text-gray-600 dark:text-gray-400', valueKey: 'lowPriority', textColor: 'text-gray-700 dark:text-gray-300', tooltip: 'Number of low priority tasks' },
        { key: 'overdue', label: 'Overdue', icon: Clock, color: 'bg-red-500/15 dark:bg-red-900/15 text-red-600 dark:text-red-400', valueKey: 'overdue', textColor: 'text-red-700 dark:text-red-300', tooltip: 'Number of overdue tasks' },
    ];
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col font-sans"
        >
            <div className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-12">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-blue-100/50 dark:border-gray-700/50 rounded-3xl shadow-lg flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <header className="bg-blue-50/50 dark:bg-blue-900/30 border-b border-blue-200/50 dark:border-gray-700/50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-sm">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Star className="w-6 h-6 sm:w-7 h-7 md:w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin-slow flex-shrink-0" />
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-indigo-900 dark:text-indigo-100 tracking-tight truncate">Task Board</h1>
                                <p className="text-xs sm:text-sm lg:text-base text-blue-600 dark:text-blue-400 tracking-tight line-clamp-1">Your Productivity Hub</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                            <button
                                onClick={() => { setSelectedTask(null); setShowModal(true); }}
                                className="sm:hidden bg-white/95 dark:bg-gray-800/95 text-blue-700 dark:text-blue-300 border border-blue-300/50 dark:border-gray-700/50 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Task
                            </button>
                            <button
                                onClick={() => { setSelectedTask(null); setShowModal(true); }}
                                className="hidden sm:flex bg-white/95 dark:bg-gray-800/95 text-blue-700 dark:text-blue-300 border border-blue-300/50 dark:border-gray-700/50 rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4 sm:w-5 h-5" /> Add Task
                            </button>
                            <div className="bg-white/95 dark:bg-gray-800/95 border border-blue-300/50 dark:border-gray-700/50 rounded-lg px-3 sm:px-4 py-2 text-gray-800 dark:text-gray-200 text-xs sm:text-sm lg:text-base font-medium flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                <Clock className="w-4 h-4 sm:w-5 h-5 lg:w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse flex-shrink-0" />
                                <span className="truncate">{currentTime.toLocaleTimeString('en-US', { hour12: true, timeZone: 'Africa/Lagos' })}</span>
                            </div>
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`}
                                alt="User Avatar"
                                className="w-8 h-8 sm:w-9 h-9 md:w-10 h-10 lg:w-12 h-12 rounded-full border-2 border-blue-400/50 dark:border-blue-800/50 hover:shadow-sm transition-all duration-200 flex-shrink-0"
                            />
                        </div>
                    </header>
                    <main className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
                            {/* Stats Section */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 max-w-[1400px] mx-auto">
                                {STATS.map(({ key, label, icon: Icon, color, valueKey, textColor, tooltip }, index) => (
                                    <motion.div
                                        key={key}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * (index + 1) }}
                                        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-blue-200/50 dark:border-gray-700/50 rounded-xl p-2 sm:p-3 md:p-4 lg:p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-w-0"
                                        title={tooltip}
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3 md:gap-3 lg:gap-3">
                                            {key === 'completed' ? (
                                                <div className="relative w-8 h-8 sm:w-10 h-10 md:w-12 h-12 lg:w-12 h-12 flex-shrink-0">
                                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                                        <path
                                                            d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                                                            fill="none"
                                                            stroke="#DBEAFE dark:#1f2937"
                                                            strokeWidth="4"
                                                        />
                                                        <path
                                                            d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                                                            fill="none"
                                                            stroke="#10B981 dark:#059669"
                                                            strokeWidth="4"
                                                            strokeDasharray={`${(stats.completed / stats.total) * 100 || 0}, 100`}
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    <PieChart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 h-5 md:w-6 h-6 lg:w-6 h-6 text-green-600 dark:text-green-400" />
                                                </div>
                                            ) : (
                                                <div className={`p-1 sm:p-2 md:p-3 lg:p-3 rounded-lg ${color} flex-shrink-0`}>
                                                    <Icon className="w-4 h-4 sm:w-5 h-5 md:w-6 h-6 lg:w-6 h-6" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className={`text-base sm:text-lg md:text-xl lg:text-xl font-bold ${textColor} truncate`}>{stats[valueKey]}</p>
                                                <p className="text-xs sm:text-sm md:text-sm lg:text-sm text-gray-600 dark:text-gray-400 tracking-tight truncate">{label}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            {/* Search and Sort */}
                            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-blue-200/50 dark:border-gray-700/50 rounded-xl p-3 sm:p-4 md:p-5 shadow-sm">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 w-full">
                                        <Search className="w-5 h-5 sm:w-6 h-6 md:w-7 h-7 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search tasks..."
                                            className="bg-white dark:bg-gray-700 border border-blue-300/50 dark:border-gray-600/50 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 w-full transition-all duration-300"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                        <ArrowUpDown className="w-5 h-5 sm:w-6 h-6 md:w-7 h-7 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                        <select
                                            value={sort}
                                            onChange={(e) => setSort(e.target.value)}
                                            className="bg-white dark:bg-gray-700 border border-blue-300/50 dark:border-gray-600/50 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-blue-800 dark:text-blue-200 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition-all duration-300 w-full sm:w-40 md:w-48"
                                        >
                                            {SORT_OPTIONS.map(({ value, label }) => (
                                                <option key={value} value={value} className="text-blue-800 dark:text-blue-200">
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            {/* Filters */}
                            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-blue-200/50 dark:border-gray-700/50 rounded-xl p-3 sm:p-4 md:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Filter className="w-5 h-5 sm:w-6 h-6 md:w-7 h-7 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <span className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight truncate">{FILTER_LABELS[filter]}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        className="lg:hidden bg-white dark:bg-gray-700 border border-blue-300/50 dark:border-gray-600/50 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-blue-800 dark:text-blue-200 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition-all duration-300 w-full"
                                    >
                                        {FILTER_OPTIONS.map(opt => (
                                            <option key={opt} value={opt} className="text-blue-800 dark:text-blue-200">
                                                {FILTER_LABELS[opt]}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="hidden lg:flex flex-wrap gap-1 sm:gap-2 bg-blue-100/50 dark:bg-blue-900/30 p-1 sm:p-2 rounded-lg">
                                        {FILTER_OPTIONS.map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setFilter(opt)}
                                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 hover:scale-105 truncate ${filter === opt
                                                    ? 'bg-blue-500 dark:bg-blue-600 text-white dark:text-gray-100 shadow-md'
                                                    : 'text-blue-700 dark:text-blue-300 hover:bg-blue-200/50 dark:hover:bg-blue-800/50'
                                                }`}
                                                title={FILTER_LABELS[opt]}
                                            >
                                                {FILTER_LABELS[opt]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Task List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-blue-200/50 dark:border-gray-700/50 rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm">
                                    <div className="overflow-y-auto pr-2 sm:pr-3 custom-scrollbar">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            {filteredTasks.length === 0 ? (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="col-span-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-blue-200/50 dark:border-gray-700/50 rounded-2xl p-6 sm:p-8 md:p-10 text-center shadow-md"
                                                >
                                                    <div className="w-16 h-16 sm:w-20 h-20 md:w-24 h-24 bg-blue-100/50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                                        <Layers className="w-8 h-8 sm:w-10 h-10 md:w-12 h-12 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 tracking-tight truncate">No Tasks Found</h3>
                                                    <p className="text-sm sm:text-base md:text-lg text-blue-600 dark:text-blue-400 mb-6 sm:mb-8 leading-relaxed line-clamp-2">
                                                        {filter === 'all' && !search ? 'Start your productivity journey with a new task!' : 'No tasks match your current filters.'}
                                                    </p>
                                                    <button
                                                        onClick={() => { setSelectedTask(null); setShowModal(true); }}
                                                        className="bg-blue-500 dark:bg-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg flex items-center gap-2 sm:gap-3 mx-auto hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg text-sm sm:text-base"
                                                    >
                                                        <Plus className="w-5 h-5 sm:w-6 h-6" /> Create New Task
                                                    </button>
                                                </motion.div>
                                            ) : (
                                                filteredTasks.map((task, index) => (
                                                    <motion.div
                                                        key={task._id || task.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={`relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                                                            task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')
                                                                ? 'border-green-300/50 dark:border-green-700/50'
                                                                : 'border-red-300/50 dark:border-red-700/50'
                                                        } ${
                                                            task.priority?.toLowerCase() === 'high' ? 'border-indigo-600/50 dark:border-indigo-700/50' :
                                                            task.priority?.toLowerCase() === 'medium' ? 'border-amber-300/50 dark:border-amber-700/50' :
                                                            task.priority?.toLowerCase() === 'low' ? 'border-gray-300/50 dark:border-gray-700/50' : 'border-blue-200/50 dark:border-blue-700/50'
                                                        }`}
                                                        onClick={() => { setSelectedTask(task); setShowActionModal(true); }}
                                                    >
                                                        <div className="p-4 sm:p-5 md:p-6">
                                                            <TaskItem
                                                                task={task}
                                                                onRefresh={refreshTasks}
                                                                showCompleteCheckbox
                                                                onAction={() => { setSelectedTask(task); setShowActionModal(true); }}
                                                                onLogout={onLogout}
                                                            />
                                                        </div>
                                                        <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-900/10 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 z-10 overflow-hidden">
                                                            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-4 sm:p-6 rounded-lg shadow-lg max-w-[90%] max-h-[90%] overflow-y-auto text-gray-900 dark:text-gray-100">
                                                                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 truncate">{task.title}</h3>
                                                                <p className="text-xs sm:text-sm md:text-base whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                    {/* Floating Add Button */}
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setSelectedTask(null); setShowModal(true); }}
                        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-blue-500 dark:bg-blue-600 text-white p-3 sm:p-4 md:p-5 rounded-full shadow-md hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-300 z-30"
                        title="Add New Task"
                    >
                        <Plus className="w-5 h-5 sm:w-6 h-6 md:w-7 h-7" />
                    </motion.button>
                </motion.div>
                {/* Modals */}
                <TaskModal
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); setSelectedTask(null); }}
                    taskToEdit={selectedTask}
                    onSave={handleTaskSave}
                    onLogout={onLogout}
                />
                <TaskActionModal
                    isOpen={showActionModal}
                    onClose={() => { setShowActionModal(false); setSelectedTask(null); }}
                    onAction={handleAction}
                />
                <DeleteConfirmationModal
                    isOpen={showDeleteConfirm}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                    height: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(59, 130, 246, 0.1) dark:rgba(59, 130, 246, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #3B82F6 dark:#3B82F6;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #2563EB dark:#2563EB;
                }
                .animate-pulse-slow {
                    animation: pulse 3s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </motion.div>
    );
};
export default Dashboard;