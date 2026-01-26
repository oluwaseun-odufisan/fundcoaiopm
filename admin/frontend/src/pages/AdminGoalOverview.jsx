import React, { useState, useEffect } from 'react';
import {
    FileText,
    User,
    Tag,
    Calendar,
    Search,
    ChevronUp,
    ChevronDown,
    Edit,
    Check,
    X,
    Trash2,
    Download,
    PieChart,
    BarChart2,
    Save,
    Plus,
} from 'lucide-react';
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
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Register Chart.js components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const USER_API_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:4001';

const AdminGoalOverview = ({ onLogout }) => {
    const [goals, setGoals] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedGoals, setSelectedGoals] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [editGoal, setEditGoal] = useState(null);
    const [approveGoal, setApproveGoal] = useState(null);
    const [report, setReport] = useState(null);
    const [newSubGoal, setNewSubGoal] = useState('');
    const goalsPerPage = 5;

    // Chart data states
    const [goalStatusData, setGoalStatusData] = useState({
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [
            {
                data: [0, 0, 0],
                backgroundColor: ['#00CED1', '#FFD700', '#FF6347'],
                borderColor: '#FFFFFF',
                borderWidth: 2,
            },
        ],
    });

    const [overdueGoalsData, setOverdueGoalsData] = useState({
        labels: [],
        datasets: [
            {
                label: 'Overdue Goals',
                data: [],
                backgroundColor: '#FF6347',
            },
        ],
    });

    // Chart options
    const pieChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'right', labels: { color: '#2D3748' } },
            tooltip: { backgroundColor: '#2D3748', titleColor: '#FFFFFF', bodyColor: '#FFFFFF' },
        },
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#2D3748' } },
            tooltip: { backgroundColor: '#2D3748', titleColor: '#FFFFFF', bodyColor: '#FFFFFF' },
        },
        scales: { x: { ticks: { color: '#2D3748' } }, y: { ticks: { color: '#2D3748' } } },
    };

    // Calculate days remaining or passed
    const calculateDays = (endDate, progress) => {
        if (progress === 100 || !endDate) return { days: 'N/A', color: 'transparent' };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(endDate);
        due.setHours(0, 0, 0, 0);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            return {
                days: `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`,
                color: diffDays >= 5 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
            };
        } else if (diffDays < 0) {
            return {
                days: `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`,
                color: 'bg-red-100 text-red-700',
            };
        } else {
            return { days: 'Due today', color: 'bg-yellow-100 text-yellow-700' };
        }
    };

    // Socket.IO setup
    useEffect(() => {
        const socket = io(USER_API_URL, {
            auth: { token: localStorage.getItem('adminToken') },
            reconnectionAttempts: 3,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            toast.success('Connected to real-time updates');
        });

        socket.on('newGoal', (goal) => {
            setGoals((prev) => [goal, ...prev]);
            toast.success('New goal created!');
            updateChartData([...goals, goal]);
        });

        socket.on('goalUpdated', (updatedGoal) => {
            setGoals((prev) =>
                prev.map((goal) => (goal._id === updatedGoal._id ? updatedGoal : goal))
            );
            toast.success('Goal updated!');
            updateChartData(goals.map((goal) => (goal._id === updatedGoal._id ? updatedGoal : goal)));
        });

        socket.on('goalDeleted', (goalId) => {
            setGoals((prev) => prev.filter((goal) => goal._id !== goalId));
            toast.success('Goal deleted!');
            updateChartData(goals.filter((goal) => goal._id !== goalId));
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            toast.error('Failed to connect to real-time updates. Retrying...');
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err.message);
            toast.error('Real-time update error occurred.');
        });

        return () => {
            socket.disconnect();
            console.log('Socket disconnected');
        };
    }, [goals]);

    // Fetch goals
    const fetchGoals = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterUser) params.ownerEmail = filterUser;

            const response = await axios.get(`${API_BASE_URL}/api/admin/goals`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });
            setGoals(response.data.goals);
            updateChartData(response.data.goals);
        } catch (err) {
            console.error('Error fetching goals:', err.response?.data || err.message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                toast.error('Session expired. Please log in again.');
                onLogout();
            } else {
                toast.error(err.response?.data?.message || 'Failed to fetch goals.');
                setError(err.response?.data?.message || 'Failed to fetch goals.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch users
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

    // Fetch report
    const fetchReport = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_BASE_URL}/api/admin/goals/report`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReport(response.data.report);
        } catch (err) {
            console.error('Error fetching report:', err.response?.data || err.message);
            toast.error(err.response?.data?.message || 'Failed to fetch report.');
        }
    };

    // Update chart data
    const updateChartData = (goalList) => {
        const today = new Date();
        const statusCounts = { Approved: 0, Pending: 0, Rejected: 0 };
        const overdueByUser = {};

        goalList.forEach((goal) => {
            statusCounts[goal.status.charAt(0).toUpperCase() + goal.status.slice(1)]++;
            if (goal.progress < 100 && goal.endDate && new Date(goal.endDate) < today) {
                const email = goal.owner?.email || 'Unassigned';
                overdueByUser[email] = (overdueByUser[email] || 0) + 1;
            }
        });

        setGoalStatusData({
            labels: ['Approved', 'Pending', 'Rejected'],
            datasets: [
                {
                    data: [statusCounts.Approved, statusCounts.Pending, statusCounts.Rejected],
                    backgroundColor: ['#00CED1', '#FFD700', '#FF6347'],
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                },
            ],
        });

        setOverdueGoalsData({
            labels: Object.keys(overdueByUser),
            datasets: [
                {
                    label: 'Overdue Goals',
                    data: Object.values(overdueByUser),
                    backgroundColor: '#FF6347',
                },
            ],
        });
    };

    // Initial fetch
    useEffect(() => {
        fetchGoals();
        fetchUsers();
        fetchReport();
    }, [filterUser, filterStatus]);

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        setGoals((prev) =>
            [...prev].sort((a, b) => {
                if (key === 'progress') {
                    return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
                }
                if (key === 'daysRemaining') {
                    const aDue = a.endDate ? new Date(a.endDate) : null;
                    const bDue = b.endDate ? new Date(b.endDate) : null;
                    const today = new Date();
                    const aDiff = a.progress === 100 ? 0 : aDue ? aDue - today : Infinity;
                    const bDiff = b.progress === 100 ? 0 : bDue ? bDue - today : Infinity;
                    return direction === 'asc' ? aDiff - bDiff : bDiff - aDiff;
                }
                const aValue = key === 'owner' ? a[key]?.email.toLowerCase() : a[key]?.toLowerCase() || '';
                const bValue = key === 'owner' ? b[key]?.email.toLowerCase() : b[key]?.toLowerCase() || '';
                if (aValue < bValue) return direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return direction === 'asc' ? 1 : -1;
                return 0;
            })
        );
    };

    // Handle search and filters
    const filteredGoals = goals.filter(
        (goal) =>
            (goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                goal.owner?.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (filterUser ? goal.owner?.email === filterUser : true) &&
            (filterStatus ? goal.status === filterStatus : true)
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredGoals.length / goalsPerPage);
    const paginatedGoals = filteredGoals.slice(
        (currentPage - 1) * goalsPerPage,
        currentPage * goalsPerPage
    );

    // Handle bulk selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedGoals(paginatedGoals.map((goal) => goal._id));
        } else {
            setSelectedGoals([]);
        }
    };

    const handleSelectGoal = (id) => {
        setSelectedGoals((prev) =>
            prev.includes(id) ? prev.filter((goalId) => goalId !== id) : [...prev, id]
        );
    };

    // Handle bulk actions
    const handleBulkAction = async (action, value = null) => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            if (action === 'setStatus') {
                await Promise.all(
                    selectedGoals.map((id) =>
                        axios.put(
                            `${API_BASE_URL}/api/admin/goals/${id}/approve`,
                            { status: value, adminNotes: '' },
                            { headers: { Authorization: `Bearer ${token}` } }
                        )
                    )
                );
                toast.success(`Selected goals set to ${value} successfully!`);
                setSuccess(`Selected goals set to ${value} successfully!`);
            } else if (action === 'delete') {
                await Promise.all(
                    selectedGoals.map((id) =>
                        axios.delete(`${API_BASE_URL}/api/admin/goals/${id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        })
                    )
                );
                toast.success('Selected goals deleted successfully!');
                setSuccess('Selected goals deleted successfully!');
            }
            setSelectedGoals([]);
            fetchGoals();
        } catch (err) {
            console.error('Error performing bulk action:', err.response?.data || err.message);
            toast.error(err.response?.data?.message || 'Failed to perform bulk action.');
            setError(err.response?.data?.message || 'Failed to perform bulk action.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle individual actions
    const handleCreate = () => {
        setEditGoal({
            title: '',
            subGoals: [],
            ownerEmail: '',
            type: 'personal',
            timeframe: 'custom',
            startDate: '',
            endDate: '',
            status: 'approved',
            adminNotes: '',
        });
        setIsEditModalOpen(true);
        setError('');
        setSuccess('');
        setNewSubGoal('');
    };

    const handleEdit = (goal) => {
        setEditGoal({
            _id: goal._id,
            title: goal.title,
            subGoals: goal.subGoals.map((sg) => ({ title: sg.title, completed: sg.completed })),
            ownerEmail: goal.owner?.email || '',
            type: goal.type,
            timeframe: goal.timeframe,
            startDate: goal.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : '',
            endDate: goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
            status: goal.status,
            adminNotes: goal.adminNotes || '',
        });
        setIsEditModalOpen(true);
        setError('');
        setSuccess('');
        setNewSubGoal('');
    };

    const handleApproveReject = (goal) => {
        setApproveGoal({
            _id: goal._id,
            status: goal.status,
            adminNotes: goal.adminNotes || '',
        });
        setIsApproveModalOpen(true);
        setError('');
        setSuccess('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this goal?')) {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('adminToken');
                await axios.delete(`${API_BASE_URL}/api/admin/goals/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success('Goal deleted successfully!');
                setSuccess('Goal deleted successfully!');
                fetchGoals();
            } catch (err) {
                console.error('Error deleting goal:', err.response?.data || err.message);
                toast.error(err.response?.data?.message || 'Failed to delete goal.');
                setError(err.response?.data?.message || 'Failed to delete goal.');
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

        if (!editGoal.title || editGoal.title.length < 3) {
            setError('Goal title must be at least 3 characters long.');
            setIsLoading(false);
            return;
        }
        if (!editGoal.ownerEmail) {
            setError('Please select an assigned user.');
            setIsLoading(false);
            return;
        }
        if (!editGoal.timeframe) {
            setError('Please select a timeframe.');
            setIsLoading(false);
            return;
        }
        if (!editGoal.startDate || !editGoal.endDate) {
            setError('Please select start and end dates.');
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const payload = {
                title: editGoal.title,
                subGoals: editGoal.subGoals,
                ownerEmail: editGoal.ownerEmail,
                type: editGoal.type,
                timeframe: editGoal.timeframe,
                startDate: editGoal.startDate,
                endDate: editGoal.endDate,
                status: editGoal.status,
                adminNotes: editGoal.adminNotes,
            };

            if (editGoal._id) {
                await axios.put(
                    `${API_BASE_URL}/api/admin/goals/${editGoal._id}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Goal updated successfully!');
                setSuccess('Goal updated successfully!');
            } else {
                await axios.post(
                    `${API_BASE_URL}/api/admin/goals`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Goal created successfully!');
                setSuccess('Goal created successfully!');
            }
            setIsEditModalOpen(false);
            setEditGoal(null);
            setNewSubGoal('');
            fetchGoals();
        } catch (err) {
            console.error('Error saving goal:', err.response?.data || err.message);
            toast.error(err.response?.data?.message || 'Failed to save goal.');
            setError(err.response?.data?.message || 'Failed to save goal.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle approve/reject form submission
    const handleApproveSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!approveGoal.status) {
            setError('Please select a status.');
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(
                `${API_BASE_URL}/api/admin/goals/${approveGoal._id}/approve`,
                { status: approveGoal.status, adminNotes: approveGoal.adminNotes },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Goal ${approveGoal.status} successfully!`);
            setSuccess(`Goal ${approveGoal.status} successfully!`);
            setIsApproveModalOpen(false);
            setApproveGoal(null);
            fetchGoals();
        } catch (err) {
            console.error('Error approving/rejecting goal:', err.response?.data || err.message);
            toast.error(err.response?.data?.message || 'Failed to approve/reject goal.');
            setError(err.response?.data?.message || 'Failed to approve/reject goal.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle export
    const handleExport = async (format) => {
        if (filteredGoals.length === 0) {
            setError('No goals to export.');
            toast.error('No goals to export.');
            return;
        }
        setIsLoading(true);
        try {
            if (format === 'csv') {
                const csvHeaders = ['title', 'owner', 'status', 'timeframe', 'progress', 'startDate', 'endDate', 'daysRemaining'];
                const csvRows = filteredGoals.map((goal) =>
                    csvHeaders
                        .map((header) => {
                            let value = goal[header];
                            if (header === 'owner') value = goal.owner?.email || 'Unassigned';
                            if (header === 'startDate' || header === 'endDate') {
                                value = value ? new Date(value).toLocaleDateString() : 'N/A';
                            }
                            if (header === 'progress') value = `${value}%`;
                            if (header === 'daysRemaining') {
                                value = calculateDays(goal.endDate, goal.progress).days;
                            }
                            return `"${value}"`;
                        })
                        .join(',')
                );
                const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `goal_overview_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'pdf') {
                const doc = new jsPDF();
                doc.setFontSize(16);
                doc.text('Goal Overview Report', 14, 22);
                doc.setFontSize(10);
                doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

                const tableData = filteredGoals.map((goal) => [
                    goal.title,
                    goal.owner?.email || 'Unassigned',
                    goal.status,
                    goal.timeframe,
                    `${goal.progress}%`,
                    goal.startDate ? new Date(goal.startDate).toLocaleDateString() : 'N/A',
                    goal.endDate ? new Date(goal.endDate).toLocaleDateString() : 'N/A',
                    calculateDays(goal.endDate, goal.progress).days,
                ]);

                doc.autoTable({
                    startY: 40,
                    head: [['Title', 'Owner', 'Status', 'Timeframe', 'Progress', 'Start Date', 'End Date', 'Days Remaining']],
                    body: tableData,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [0, 206, 209] },
                });

                doc.save(`goal_overview_${Date.now()}.pdf`);
            }
            toast.success(`Goals exported as ${format.toUpperCase()} successfully!`);
            setSuccess(`Goals exported as ${format.toUpperCase()} successfully!`);
        } catch (err) {
            console.error('Error exporting goals:', err.message);
            toast.error('Failed to export goals.');
            setError('Failed to export goals.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle adding a new sub-goal
    const handleAddSubGoal = () => {
        if (!newSubGoal.trim()) {
            setError('Sub-goal title is required.');
            return;
        }
        setEditGoal((prev) => ({
            ...prev,
            subGoals: [...prev.subGoals, { title: newSubGoal.trim(), completed: false }],
        }));
        setNewSubGoal('');
    };

    // Handle removing a sub-goal
    const handleRemoveSubGoal = (index) => {
        setEditGoal((prev) => ({
            ...prev,
            subGoals: prev.subGoals.filter((_, i) => i !== index),
        }));
    };

    // Handle toggling sub-goal completion status
    const handleToggleSubGoalStatus = (index) => {
        setEditGoal((prev) => {
            const updatedSubGoals = [...prev.subGoals];
            updatedSubGoals[index].completed = !updatedSubGoals[index].completed;
            return { ...prev, subGoals: updatedSubGoals };
        });
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">Goal Overview</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300 flex items-center"
                        aria-label="Create new goal"
                    >
                        <Plus size={18} className="mr-2" />
                        Create Goal
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search goals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 w-64"
                            aria-label="Search goals"
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
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by user"
                >
                    <option value="">All Users</option>
                    {users.map((user) => (
                        <option key={user._id} value={user.email}>
                            {user.email}
                        </option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Filter by status"
                >
                    <option value="">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Report Summary */}
            {report && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 p-4 bg-teal-50 rounded-lg shadow-md"
                >
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center">
                        <BarChart2 className="mr-2" size={20} />
                        Goal Report Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-700">
                        <div>Total Goals: {report.totalGoals}</div>
                        <div>Completed: {report.completedGoals}</div>
                        <div>Pending: {report.pendingGoals}</div>
                        <div>Approved: {report.approvedGoals}</div>
                        <div>Rejected: {report.rejectedGoals}</div>
                        <div>Overdue: {report.overdueGoals}</div>
                        <div>Completion Rate: {report.completionRate}%</div>
                    </div>
                </motion.div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <PieChart className="w-5 h-5 mr-2" />
                        Goal Status Distribution
                    </h3>
                    <div className="h-64 flex justify-center">
                        <Pie data={goalStatusData} options={pieChartOptions} />
                    </div>
                </div>
                <div
                    className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in"
                    style={{ animationDelay: '0.1s' }}
                >
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <BarChart2 className="w-5 h-5 mr-2" />
                        Overdue Goals by User
                    </h3>
                    <div className="h-64">
                        <Bar data={overdueGoalsData} options={barChartOptions} />
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedGoals.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-2 mb-4"
                >
                    <select
                        onChange={(e) => handleBulkAction('setStatus', e.target.value)}
                        className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                        aria-label="Change status of selected goals"
                        disabled={isLoading}
                    >
                        <option value="">Change Status</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                        disabled={isLoading}
                        aria-label="Delete selected goals"
                    >
                        Delete
                    </button>
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

            {/* Export Options */}
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => handleExport('csv')}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center hover:bg-blue-700 transition-all duration-300"
                    disabled={isLoading}
                    aria-label="Export as CSV"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Export CSV
                </button>
                <button
                    onClick={() => handleExport('pdf')}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center hover:bg-blue-700 transition-all duration-300"
                    disabled={isLoading}
                    aria-label="Export as PDF"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Export PDF
                </button>
            </div>

            {/* Goal Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-teal-50">
                            <th className="p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedGoals.length === paginatedGoals.length && paginatedGoals.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                    aria-label="Select all goals"
                                />
                            </th>
                            {['title', 'owner', 'status', 'timeframe', 'progress', 'startDate', 'endDate', 'daysRemaining'].map((key) => (
                                <th
                                    key={key}
                                    className="p-3 text-left text-teal-700 cursor-pointer hover:text-teal-900 transition-colors"
                                    onClick={() => handleSort(key)}
                                    aria-sort={sortConfig.key === key ? sortConfig.direction : 'none'}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>
                                            {key === 'owner' ? 'User' :
                                                key === 'daysRemaining' ? 'Days Remaining' :
                                                    key.charAt(0).toUpperCase() + key.slice(1)}
                                        </span>
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
                        {isLoading && !goals.length ? (
                            <tr>
                                <td colSpan="9" className="p-3 text-center text-gray-600">
                                    <div className="flex justify-center items-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                        <span>Loading goals...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedGoals.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="p-3 text-center text-gray-600">
                                    No goals found
                                </td>
                            </tr>
                        ) : (
                            paginatedGoals.map((goal) => {
                                const { days, color } = calculateDays(goal.endDate, goal.progress);
                                return (
                                    <tr
                                        key={goal._id}
                                        className="border-b border-teal-100 hover:bg-teal-50 transition-all duration-200"
                                    >
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedGoals.includes(goal._id)}
                                                onChange={() => handleSelectGoal(goal._id)}
                                                className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                                aria-label={`Select ${goal.title}`}
                                            />
                                        </td>
                                        <td className="p-3 text-gray-600">{goal.title}</td>
                                        <td className="p-3 text-gray-700">{goal.owner?.email || 'Unassigned'}</td>
                                        <td className="p-3 text-gray-700">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs ${goal.status === 'approved'
                                                    ? 'bg-teal-100 text-teal-700'
                                                    : goal.status === 'rejected'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}
                                            >
                                                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-700">
                                            {goal.timeframe.charAt(0).toUpperCase() + goal.timeframe.slice(1)}
                                        </td>
                                        <td className="p-3 text-gray-700">
                                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${goal.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-600 ml-2">{goal.progress}%</span>
                                        </td>
                                        <td className="p-3 text-gray-700">
                                            {goal.startDate ? new Date(goal.startDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-3 text-gray-700">
                                            {goal.endDate ? new Date(goal.endDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-3 text-gray-700">
                                            <span className={`px-2 py-1 rounded-full text-xs ${color}`}>
                                                {days}
                                            </span>
                                        </td>
                                        <td className="p-3 flex space-x-2">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleEdit(goal)}
                                                className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                                title="Edit Goal"
                                                aria-label="Edit goal"
                                                disabled={isLoading}
                                            >
                                                <Edit size={16} />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleApproveReject(goal)}
                                                className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
                                                title="Approve/Reject Goal"
                                                aria-label="Approve or reject goal"
                                                disabled={isLoading}
                                            >
                                                <Check size={16} />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleDelete(goal._id)}
                                                className="p-2 rounded-full bg-blue-800 text-white hover:bg-blue-900 transition-all duration-300"
                                                title="Delete Goal"
                                                aria-label="Delete goal"
                                                disabled={isLoading}
                                            >
                                                <Trash2 size={16} />
                                            </motion.button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * goalsPerPage + 1} to{' '}
                    {Math.min(currentPage * goalsPerPage, filteredGoals.length)} of {filteredGoals.length}{' '}
                    goals
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
                            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg overflow-y-auto max-h-[80vh]"
                        >
                            <h3 className="text-xl font-bold text-teal-600 mb-4">
                                {editGoal._id ? 'Edit Goal' : 'Create Goal'}
                            </h3>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="relative">
                                    <label htmlFor="title" className="sr-only">
                                        Goal Title
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <FileText className="w-5 h-5 text-teal-600 ml-3" />
                                        <input
                                            type="text"
                                            id="title"
                                            value={editGoal.title}
                                            onChange={(e) => setEditGoal({ ...editGoal, title: e.target.value })}
                                            placeholder="Enter goal title"
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                            aria-label="Goal title"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-800">Sub-Goals</label>
                                    <div className="flex gap-3 mt-2">
                                        <input
                                            type="text"
                                            value={newSubGoal}
                                            onChange={(e) => setNewSubGoal(e.target.value)}
                                            className="flex-1 p-3 border border-teal-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 transition-all duration-300"
                                            placeholder="Enter sub-goal"
                                            maxLength={200}
                                            aria-label="Sub-goal input"
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleAddSubGoal();
                                            }}
                                            className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all shadow-md"
                                            aria-label="Add Sub-Goal"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                    <div className="mt-3 max-h-48 overflow-y-auto">
                                        {editGoal.subGoals.map((subGoal, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg mb-2"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={subGoal.completed}
                                                    onChange={() => handleToggleSubGoalStatus(index)}
                                                    className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                                    aria-label={`Toggle completion for ${subGoal.title}`}
                                                />
                                                <p className="text-sm text-gray-700 flex-1">{subGoal.title}</p>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleRemoveSubGoal(index);
                                                    }}
                                                    className="p-1 text-red-600 hover:text-red-700"
                                                    aria-label={`Remove ${subGoal.title}`}
                                                >
                                                    <X className="w-4 h-4" />
                                                </motion.button>
                                            </motion.div>
                                        ))}
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
                                            value={editGoal.ownerEmail}
                                            onChange={(e) => setEditGoal({ ...editGoal, ownerEmail: e.target.value })}
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
                                    <label htmlFor="type" className="sr-only">
                                        Goal Type
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <Tag className="w-5 h-5 text-teal-600 ml-3" />
                                        <select
                                            id="type"
                                            value={editGoal.type}
                                            onChange={(e) => setEditGoal({ ...editGoal, type: e.target.value })}
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                            aria-label="Select goal type"
                                            required
                                        >
                                            <option value="personal">Personal</option>
                                            <option value="task">Task</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="relative">
                                    <label htmlFor="timeframe" className="sr-only">
                                        Timeframe
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <Tag className="w-5 h-5 text-teal-600 ml-3" />
                                        <select
                                            id="timeframe"
                                            value={editGoal.timeframe}
                                            onChange={(e) => setEditGoal({ ...editGoal, timeframe: e.target.value })}
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                            aria-label="Select timeframe"
                                            required
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="relative">
                                    <label htmlFor="startDate" className="sr-only">
                                        Start Date
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <Calendar className="w-5 h-5 text-teal-600 ml-3" />
                                        <input
                                            type="date"
                                            id="startDate"
                                            value={editGoal.startDate}
                                            onChange={(e) => setEditGoal({ ...editGoal, startDate: e.target.value })}
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700"
                                            aria-label="Start date"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label htmlFor="endDate" className="sr-only">
                                        End Date
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <Calendar className="w-5 h-5 text-teal-600 ml-3" />
                                        <input
                                            type="date"
                                            id="endDate"
                                            value={editGoal.endDate}
                                            onChange={(e) => setEditGoal({ ...editGoal, endDate: e.target.value })}
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700"
                                            aria-label="End date"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label htmlFor="status" className="sr-only">
                                        Status
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <Tag className="w-5 h-5 text-teal-600 ml-3" />
                                        <select
                                            id="status"
                                            value={editGoal.status}
                                            onChange={(e) => setEditGoal({ ...editGoal, status: e.target.value })}
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                            aria-label="Select status"
                                            required
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="relative">
                                    <label htmlFor="adminNotes" className="sr-only">
                                        Admin Notes
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <FileText className="w-5 h-5 text-teal-600 ml-3" />
                                        <textarea
                                            id="adminNotes"
                                            value={editGoal.adminNotes}
                                            onChange={(e) => setEditGoal({ ...editGoal, adminNotes: e.target.value })}
                                            placeholder="Enter admin notes"
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                            aria-label="Admin notes"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                                {error && (
                                    <div className="text-red-500 text-sm text-center">{error}</div>
                                )}
                                <div className="flex space-x-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'}`}
                                        aria-label="Save goal"
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
                                            setEditGoal(null);
                                            setError('');
                                            setSuccess('');
                                            setNewSubGoal('');
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

            {/* Approve/Reject Modal */}
            <AnimatePresence>
                {isApproveModalOpen && (
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
                            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg"
                        >
                            <h3 className="text-xl font-bold text-teal-600 mb-4">Approve/Reject Goal</h3>
                            <form onSubmit={handleApproveSubmit} className="space-y-4">
                                <div className="relative">
                                    <label htmlFor="status" className="sr-only">
                                        Status
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <Tag className="w-5 h-5 text-teal-600 ml-3" />
                                        <select
                                            id="status"
                                            value={approveGoal.status}
                                            onChange={(e) => setApproveGoal({ ...approveGoal, status: e.target.value })}
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700 appearance-none"
                                            aria-label="Select status"
                                            required
                                        >
                                            <option value="">Select Status</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="relative">
                                    <label htmlFor="adminNotes" className="sr-only">
                                        Admin Notes
                                    </label>
                                    <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                        <FileText className="w-5 h-5 text-teal-600 ml-3" />
                                        <textarea
                                            id="adminNotes"
                                            value={approveGoal.adminNotes}
                                            onChange={(e) => setApproveGoal({ ...approveGoal, adminNotes: e.target.value })}
                                            placeholder="Enter admin notes"
                                            className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                            aria-label="Admin notes"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                                {error && (
                                    <div className="text-red-500 text-sm text-center">{error}</div>
                                )}
                                <div className="flex space-x-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'}`}
                                        aria-label="Save status"
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
                                            setIsApproveModalOpen(false);
                                            setApproveGoal(null);
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

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

export default AdminGoalOverview;