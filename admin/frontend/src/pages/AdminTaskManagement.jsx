import React, { useState, useEffect } from 'react';
import {
    FileText,
    User,
    CheckCircle,
    Star,
    Calendar,
    Percent,
    Edit,
    Users,
    Trash2,
    Search,
    ChevronUp,
    ChevronDown,
    Save,
    X,
    BarChart2,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const USER_API_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:4001';

const AdminTaskManagement = ({ onLogout }) => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterDueDate, setFilterDueDate] = useState('');
    const [filterOwnerEmail, setFilterOwnerEmail] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState(null);
    const tasksPerPage = 10;

    // Socket.IO setup
    useEffect(() => {
        const socket = io(USER_API_URL, {
            auth: { token: localStorage.getItem('adminToken') },
        });

        socket.on('connect', () => console.log('Socket connected:', socket.id));
        socket.on('newTask', (task) => {
            setTasks((prev) => [task, ...prev]);
            toast.success('New task created!');
        });
        socket.on('updateTask', (updatedTask) => {
            setTasks((prev) =>
                prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
            );
            toast.success('Task updated!');
        });
        socket.on('deleteTask', (taskId) => {
            setTasks((prev) => prev.filter((task) => task._id !== taskId));
            toast.success('Task deleted!');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            toast.error('Failed to connect to real-time updates.');
        });

        return () => {
            socket.disconnect();
            console.log('Socket disconnected');
        };
    }, []);

    // Fetch tasks
    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterPriority) params.priority = filterPriority;
            if (filterDueDate) params.dueDate = filterDueDate;
            if (filterOwnerEmail) params.ownerEmail = filterOwnerEmail;

            const response = await axios.get(`${API_BASE_URL}/api/admin/tasks`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });
            setTasks(response.data.tasks);
        } catch (err) {
            console.error('Error fetching tasks:', err.response?.data || err.message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                toast.error('Session expired. Please log in again.');
                onLogout();
            } else {
                toast.error(err.response?.data?.message || 'Failed to fetch tasks.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch users for reassignment
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data.users);
        } catch (err) {
            console.error('Error fetching users:', err.response?.data || err.message);
            toast.error(err.response?.data?.message || 'Failed to fetch users.');
        }
    };

    // Fetch task report
    const fetchReport = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_BASE_URL}/api/admin/tasks/report`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReport(response.data.report);
        } catch (err) {
            console.error('Error fetching report:', err.response?.data || err.message);
            toast.error(err.response?.data?.message || 'Failed to fetch report.');
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchTasks();
        fetchUsers();
        fetchReport();
    }, [filterStatus, filterPriority, filterDueDate, filterOwnerEmail]);

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        setTasks((prev) =>
            [...prev].sort((a, b) => {
                if (key === 'progress' || key === 'completed') {
                    return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
                }
                const aValue = key === 'owner' ? a[key].email.toLowerCase() : a[key]?.toLowerCase() || '';
                const bValue = key === 'owner' ? b[key].email.toLowerCase() : b[key]?.toLowerCase() || '';
                if (aValue < bValue) return direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return direction === 'asc' ? 1 : -1;
                return 0;
            })
        );
    };

    // Handle search and filters
    const filteredTasks = tasks.filter((task) =>
        (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.owner?.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    const paginatedTasks = filteredTasks.slice(
        (currentPage - 1) * tasksPerPage,
        currentPage * tasksPerPage
    );

    // Handle bulk selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedTasks(paginatedTasks.map((task) => task._id));
        } else {
            setSelectedTasks([]);
        }
    };

    const handleSelectTask = (id) => {
        setSelectedTasks((prev) =>
            prev.includes(id) ? prev.filter((taskId) => taskId !== id) : [...prev, id]
        );
    };

    // Handle bulk actions
    const handleBulkAction = async (action, value = null) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            if (action === 'setStatus') {
                await Promise.all(
                    selectedTasks.map((id) =>
                        axios.put(
                            `${API_BASE_URL}/api/admin/tasks/${id}`,
                            { completed: value === 'Completed' },
                            { headers: { Authorization: `Bearer ${token}` } }
                        )
                    )
                );
                toast.success(`Selected tasks set to ${value} successfully!`);
            } else if (action === 'reassign') {
                await Promise.all(
                    selectedTasks.map((id) =>
                        axios.put(
                            `${API_BASE_URL}/api/admin/tasks/${id}/reassign`,
                            { ownerEmail: value },
                            { headers: { Authorization: `Bearer ${token}` } }
                        )
                    )
                );
                toast.success(`Selected tasks reassigned to ${value} successfully!`);
            } else if (action === 'delete') {
                await Promise.all(
                    selectedTasks.map((id) =>
                        axios.delete(`${API_BASE_URL}/api/admin/tasks/${id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        })
                    )
                );
                toast.success('Selected tasks deleted successfully!');
            }
            setSelectedTasks([]);
            fetchTasks();
        } catch (err) {
            console.error('Error performing bulk action:', err.response?.data || err.message);
            toast.error(err.response?.data?.message || 'Failed to perform bulk action.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle individual actions
    const handleEdit = (task) => {
        setEditTask({
            _id: task._id,
            title: task.title,
            description: task.description || '',
            ownerEmail: task.owner?.email || '',
            completed: task.completed ? 'Completed' : 'Pending',
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        });
        setIsEditModalOpen(true);
        setError('');
        setSuccess('');
    };

    const handleReassign = async (id, ownerEmail) => {
        if (!ownerEmail) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(
                `${API_BASE_URL}/api/admin/tasks/${id}/reassign`,
                { ownerEmail },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Task reassigned to ${ownerEmail} successfully!`);
            fetchTasks();
        } catch (err) {
            console.error('Error reassigning task:', err.response?.data || err.message);
            toast.error(err.response?.data?.message || 'Failed to reassign task.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('adminToken');
                await axios.delete(`${API_BASE_URL}/api/admin/tasks/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success('Task deleted successfully!');
                fetchTasks();
            } catch (err) {
                console.error('Error deleting task:', err.response?.data || err.message);
                toast.error(err.response?.data?.message || 'Failed to delete task.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Handle create/edit form submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Validation
        if (!editTask.title || editTask.title.length < 3) {
            setError('Task title must be at least 3 characters long.');
            setIsLoading(false);
            return;
        }
        if (!editTask.ownerEmail) {
            setError('Please select an assigned user.');
            setIsLoading(false);
            return;
        }
        if (!editTask.completed) {
            setError('Please select a status.');
            setIsLoading(false);
            return;
        }
        if (!editTask.priority) {
            setError('Please select a priority.');
            setIsLoading(false);
            return;
        }
        if (!editTask.dueDate) {
            setError('Please select a due date.');
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            if (editTask._id) {
                // Update existing task
                await axios.put(
                    `${API_BASE_URL}/api/admin/tasks/${editTask._id}`,
                    {
                        title: editTask.title,
                        description: editTask.description,
                        ownerEmail: editTask.ownerEmail,
                        completed: editTask.completed === 'Completed',
                        priority: editTask.priority,
                        dueDate: editTask.dueDate,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Task updated successfully!');
            } else {
                // Create new task
                await axios.post(
                    `${API_BASE_URL}/api/admin/tasks`,
                    {
                        title: editTask.title,
                        description: editTask.description,
                        ownerEmail: editTask.ownerEmail,
                        completed: editTask.completed === 'Completed',
                        priority: editTask.priority,
                        dueDate: editTask.dueDate,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Task created successfully!');
            }
            setIsEditModalOpen(false);
            setEditTask(null);
            fetchTasks();
        } catch (err) {
            console.error('Error saving task:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to save task.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto relative animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">Task Management</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={() => {
                            setEditTask({
                                title: '',
                                description: '',
                                ownerEmail: '',
                                completed: 'Pending',
                                priority: 'Low',
                                dueDate: '',
                            });
                            setIsEditModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                    >
                        Create Task
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 w-64"
                            aria-label="Search tasks"
                        />
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600"
                            size={18}
                        />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by status"
                >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                </select>
                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by priority"
                >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>
                <input
                    type="date"
                    value={filterDueDate}
                    onChange={(e) => setFilterDueDate(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by due date"
                />
                <select
                    value={filterOwnerEmail}
                    onChange={(e) => setFilterOwnerEmail(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by owner"
                >
                    <option value="">All Users</option>
                    {users.map((user) => (
                        <option key={user._id} value={user.email}>
                            {user.email}
                        </option>
                    ))}
                </select>
            </div>

            {/* Task Report */}
            {report && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 p-4 bg-teal-50 rounded-lg shadow-md"
                >
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center">
                        <BarChart2 className="mr-2" size={20} />
                        Task Report
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-700">
                        <div>Total Tasks: {report.totalTasks}</div>
                        <div>Completed: {report.completedTasks}</div>
                        <div>Incomplete: {report.incompleteTasks}</div>
                        <div>Overdue: {report.overdueTasks}</div>
                        <div>Completion Rate: {report.completionRate}%</div>
                    </div>
                </motion.div>
            )}

            {/* Success/Error Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 text-sm text-center mb-4"
                    >
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-teal-600 text-sm text-center mb-4"
                    >
                        {success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Actions */}
            {selectedTasks.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-2 mb-4"
                >
                    <button
                        onClick={() => handleBulkAction('setStatus', 'Completed')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Mark Completed
                    </button>
                    <button
                        onClick={() => handleBulkAction('setStatus', 'Pending')}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Mark Pending
                    </button>
                    <select
                        onChange={(e) => handleBulkAction('reassign', e.target.value)}
                        className="p-2 rounded-lg border border-teal-200 bg-white text-gray-700"
                        aria-label="Reassign selected tasks"
                        disabled={isLoading}
                    >
                        <option value="">Reassign To...</option>
                        {users.map((user) => (
                            <option key={user._id} value={user.email}>
                                {user.email}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                        disabled={isLoading}
                    >
                        Delete
                    </button>
                </motion.div>
            )}

            {/* Task Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-teal-50">
                            <th className="p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedTasks.length === paginatedTasks.length && paginatedTasks.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                    aria-label="Select all tasks"
                                />
                            </th>
                            {['title', 'owner', 'completed', 'priority', 'dueDate'].map((key) => (
                                <th
                                    key={key}
                                    className="p-3 text-left text-teal-700 cursor-pointer hover:text-teal-900 transition-colors"
                                    onClick={() => handleSort(key)}
                                    aria-sort={sortConfig.key === key ? sortConfig.direction : 'none'}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{key === 'owner' ? 'Assigned User' : key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                        {sortConfig.key === key &&
                                            (sortConfig.direction === 'asc' ? (
                                                <ChevronUp size={16} />
                                            ) : (
                                                <ChevronDown size={16} />
                                            ))}
                                    </div>
                                </th>
                            ))}
                            <th className="p-3 text-left text-teal-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="p-3 text-center text-gray-600">
                                    <div className="flex justify-center items-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                        <span>Loading tasks...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedTasks.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-3 text-center text-gray-600">
                                    No tasks found.
                                </td>
                            </tr>
                        ) : (
                            paginatedTasks.map((task) => (
                                <tr
                                    key={task._id}
                                    className="border-b border-teal-100 hover:bg-teal-50 transition-all duration-200"
                                >
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedTasks.includes(task._id)}
                                            onChange={() => handleSelectTask(task._id)}
                                            className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                            aria-label={`Select ${task.title}`}
                                        />
                                    </td>
                                    <td className="p-3 text-gray-700">{task.title}</td>
                                    <td className="p-3 text-gray-700">{task.owner?.email || 'Unassigned'}</td>
                                    <td className="p-3 text-gray-700">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs ${
                                                task.completed
                                                    ? 'bg-teal-100 text-teal-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}
                                        >
                                            {task.completed ? 'Completed' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-700">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs ${
                                                task.priority === 'High'
                                                    ? 'bg-red-100 text-red-700'
                                                    : task.priority === 'Medium'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-green-100 text-green-700'
                                            }`}
                                        >
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-700">
                                        {task.dueDate
                                            ? new Date(task.dueDate).toLocaleDateString()
                                            : 'No due date'}
                                    </td>
                                    <td className="p-3 flex space-x-2">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleEdit(task)}
                                            className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                            aria-label={`Edit ${task.title}`}
                                            disabled={isLoading}
                                        >
                                            <Edit size={16} />
                                        </motion.button>
                                        <select
                                            onChange={(e) => handleReassign(task._id, e.target.value)}
                                            className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 text-xs text-center"
                                            aria-label={`Reassign ${task.title}`}
                                            disabled={isLoading}
                                        >
                                            <option value="">Reassign</option>
                                            {users.map((user) => (
                                                <option key={user._id} value={user.email}>
                                                    {user.email}
                                                </option>
                                            ))}
                                        </select>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDelete(task._id)}
                                            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                                            aria-label={`Delete ${task.title}`}
                                            disabled={isLoading}
                                        >
                                            <Trash2 size={16} />
                                        </motion.button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * tasksPerPage + 1} to{' '}
                    {Math.min(currentPage * tasksPerPage, filteredTasks.length)} of {filteredTasks.length}{' '}
                    tasks
                </p>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || isLoading}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white disabled:opacity-50 hover:bg-teal-700 transition-all duration-300"
                        aria-label="Previous page"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || isLoading}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white disabled:opacity-50 hover:bg-teal-700 transition-all duration-300"
                        aria-label="Next page"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Edit/Create Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 50 }}
                            className="bg-white/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md"
                        >
                            <h3 className="text-xl font-bold text-teal-600 mb-4">
                                {editTask._id ? 'Edit Task' : 'Create Task'}
                            </h3>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="relative">
                                    <label htmlFor="title" className="sr-only">
                                        Task Title
                                    </label>
                                    <div className="flex items-center border border-teal-500 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <FileText className="w-5 h-5 text-teal-600 ml-3" />
                                        <input
                                            type="text"
                                            id="title"
                                            value={editTask.title}
                                            onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                                            placeholder="Enter task title"
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                            aria-label="Task title"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label htmlFor="description" className="sr-only">
                                        Description
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <FileText className="w-5 h-5 text-teal-600 ml-3" />
                                        <textarea
                                            id="description"
                                            value={editTask.description}
                                            onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                                            placeholder="Enter task description"
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                            aria-label="Task description"
                                            rows="4"
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label htmlFor="ownerEmail" className="sr-only">
                                        Assigned User
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <User className="w-5 h-5 text-teal-600 ml-3" />
                                        <select
                                            id="ownerEmail"
                                            value={editTask.ownerEmail}
                                            onChange={(e) => setEditTask({ ...editTask, ownerEmail: e.target.value })}
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                            aria-label="Select assigned user"
                                            required
                                        >
                                            <option value="">Select User</option>
                                            {users.map((user) => (
                                                <option key={user._id} value={user.email}>
                                                    {user.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="relative">
                                    <label htmlFor="completed" className="sr-only">
                                        Status
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <CheckCircle className="w-5 h-5 text-teal-600 ml-3" />
                                        <select
                                            id="completed"
                                            value={editTask.completed}
                                            onChange={(e) => setEditTask({ ...editTask, completed: e.target.value })}
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                            aria-label="Select status"
                                            required
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="relative">
                                    <label htmlFor="priority" className="sr-only">
                                        Priority
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <Star className="w-5 h-5 text-teal-600 ml-3" />
                                        <select
                                            id="priority"
                                            value={editTask.priority}
                                            onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                            aria-label="Select priority"
                                            required
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="relative">
                                    <label htmlFor="dueDate" className="sr-only">
                                        Due Date
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <Calendar className="w-5 h-5 text-teal-600 ml-3" />
                                        <input
                                            type="date"
                                            id="dueDate"
                                            value={editTask.dueDate}
                                            onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700"
                                            aria-label="Due date"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${
                                            isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'
                                        }`}
                                        aria-label="Save task"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                                <span>Saving...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5 mr-2" />
                                                Save
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditModalOpen(false);
                                            setEditTask(null);
                                            setError('');
                                            setSuccess('');
                                        }}
                                        className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
                                        aria-label="Cancel"
                                    >
                                        <X className="w-5 h-5 mr-2 inline" />
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminTaskManagement;