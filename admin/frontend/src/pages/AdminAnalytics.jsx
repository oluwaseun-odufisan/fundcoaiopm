import React, { useState, useEffect } from 'react';
import {
    Clock,
    Users,
    Target,
    Search,
    BarChart2,
    TrendingUp,
    Calendar,
    Download,
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import zoomPlugin from 'chartjs-plugin-zoom';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartDataLabels,
    zoomPlugin
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const USER_API_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:4001';

const initialAnalyticsData = {
    avgTaskCompletionTime: 'N/A',
    topPerformers: [],
    goalCompletionRate: 0,
    taskCompletionOverTime: {
        labels: [],
        datasets: [
            {
                label: 'Tasks Completed',
                data: [],
                borderColor: '#00CED1',
                backgroundColor: 'rgba(0, 206, 209, 0.2)',
                fill: true,
                tension: 0.4,
            },
        ],
    },
    taskGoalActivityByUser: {
        labels: [],
        datasets: [
            {
                label: 'Tasks Completed',
                data: [],
                backgroundColor: '#00CED1',
            },
            {
                label: 'Goal Progress (%)',
                data: [],
                backgroundColor: '#1E90FF',
            },
        ],
    },
};

const AdminAnalytics = () => {
    const [analyticsData, setAnalyticsData] = useState(initialAnalyticsData);
    const [dateRange, setDateRange] = useState('Last 30 Days');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [selectedUser, setSelectedUser] = useState('All Users');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [availableUsers, setAvailableUsers] = useState(['All Users']);
    const [tasks, setTasks] = useState([]);
    const [goals, setGoals] = useState([]);

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

        socket.on('newTask', (task) => {
            setTasks((prev) => [task, ...prev]);
            toast.success('New task created!');
            fetchAnalyticsData(); // Refresh analytics
        });

        socket.on('updateTask', (updatedTask) => {
            setTasks((prev) =>
                prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
            );
            toast.success('Task updated!');
            fetchAnalyticsData();
        });

        socket.on('deleteTask', (taskId) => {
            setTasks((prev) => prev.filter((task) => task._id !== taskId));
            toast.success('Task deleted!');
            fetchAnalyticsData();
        });

        socket.on('newGoal', (goal) => {
            setGoals((prev) => [goal, ...prev]);
            toast.success('New goal created!');
            fetchAnalyticsData();
        });

        socket.on('goalUpdated', (updatedGoal) => {
            setGoals((prev) =>
                prev.map((goal) => (goal._id === updatedGoal._id ? updatedGoal : goal))
            );
            toast.success('Goal updated!');
            fetchAnalyticsData();
        });

        socket.on('goalDeleted', (goalId) => {
            setGoals((prev) => prev.filter((goal) => goal._id !== goalId));
            toast.success('Goal deleted!');
            fetchAnalyticsData();
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
    }, []);

    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#2D3748', font: { size: 12 } },
            },
            tooltip: {
                backgroundColor: '#2D3748',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
            },
            datalabels: {
                color: '#2D3748',
                font: { size: 10 },
                formatter: (value) => (value > 0 ? value : ''),
                anchor: 'end',
                align: 'top',
            },
            zoom: {
                pan: { enabled: true, mode: 'xy' },
                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
            },
        },
        scales: {
            x: { ticks: { color: '#2D3748' } },
            y: {
                ticks: { color: '#2D3748' },
                beginAtZero: true,
            },
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    const barChartOptions = {
        ...chartOptions,
        scales: {
            ...chartOptions.scales,
            y: {
                ticks: { color: '#2D3748' },
                beginAtZero: true,
                stacked: false,
            },
        },
    };

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                if (!token) {
                    setError('Authentication token missing. Please log in again.');
                    toast.error('Authentication token missing. Please log in again.');
                    return;
                }
                const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                });
                if (response.data.success) {
                    const users = response.data.users.map((user) => user.name || user.email);
                    setAvailableUsers(['All Users', ...users]);
                } else {
                    setError(response.data.message || 'Failed to fetch users.');
                    toast.error(response.data.message || 'Failed to fetch users.');
                }
            } catch (err) {
                console.error('Error fetching users:', err);
                setError('Failed to fetch users.');
                toast.error('Failed to fetch users.');
            }
        };
        fetchUsers();
    }, []);

    // Fetch analytics data
    const fetchAnalyticsData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('Authentication token missing. Please log in again.');
                toast.error('Authentication token missing. Please log in again.');
                return;
            }

            // Determine date range
            let startDate, endDate;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (dateRange === 'Last 7 Days') {
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
                endDate = today;
            } else if (dateRange === 'Last 30 Days') {
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 30);
                endDate = today;
            } else if (dateRange === 'Last 90 Days') {
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 90);
                endDate = today;
            } else if (dateRange === 'Custom' && customDateRange.start && customDateRange.end) {
                startDate = new Date(customDateRange.start);
                endDate = new Date(customDateRange.end);
                if (startDate > endDate) {
                    setError('Start date must be before end date.');
                    toast.error('Start date must be before end date.');
                    return;
                }
            } else {
                setError('Invalid date range selection.');
                toast.error('Invalid date range selection.');
                return;
            }

            // Fetch tasks and goals
            const [tasksResponse, goalsResponse, usersResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/tasks`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                    params: {
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0],
                        ownerEmail: selectedUser !== 'All Users' ? selectedUser : undefined,
                    },
                }),
                axios.get(`${API_BASE_URL}/api/admin/goals`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                    params: {
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0],
                        ownerEmail: selectedUser !== 'All Users' ? selectedUser : undefined,
                    },
                }),
                axios.get(`${API_BASE_URL}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                }),
            ]);

            if (!tasksResponse.data.success || !goalsResponse.data.success || !usersResponse.data.success) {
                throw new Error('Failed to fetch analytics data.');
            }

            const fetchedTasks = tasksResponse.data.tasks;
            const fetchedGoals = goalsResponse.data.goals;
            const users = usersResponse.data.users.filter(
                (user) => selectedUser === 'All Users' || (user.name || user.email) === selectedUser
            );

            setTasks(fetchedTasks);
            setGoals(fetchedGoals);

            // Average Task Completion Time
            const completedTasks = fetchedTasks.filter(
                (task) => task.completed && task.createdAt && task.completedAt && !isNaN(new Date(task.createdAt)) && !isNaN(new Date(task.completedAt))
            );
            const avgCompletionTime = completedTasks.length > 0
                ? completedTasks.reduce((sum, task) => {
                      const created = new Date(task.createdAt);
                      const completed = new Date(task.completedAt);
                      const diffDays = (completed - created) / (1000 * 60 * 60 * 24);
                      return sum + (isNaN(diffDays) ? 0 : diffDays);
                  }, 0) / completedTasks.length
                : 0;
            const avgTaskCompletionTime = avgCompletionTime > 0 ? `${avgCompletionTime.toFixed(1)} days` : 'N/A';

            // Goal Completion Rate
            const totalGoals = fetchedGoals.length;
            const completedGoals = fetchedGoals.filter((goal) => {
                return goal.subGoals && goal.subGoals.length > 0 && goal.subGoals.every((sg) => sg.completed);
            }).length;
            const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals * 100).toFixed(1) : 0;

            // Top Performers
            const taskCounts = {};
            fetchedTasks.forEach((task) => {
                const userEmail = task.owner?.email || 'Unassigned';
                const userName = task.owner?.name || userEmail;
                if (!taskCounts[userEmail]) {
                    taskCounts[userEmail] = { completed: 0, name: userName };
                }
                if (task.completed) taskCounts[userEmail].completed += 1;
            });
            const topPerformers = Object.entries(taskCounts)
                .map(([email, data]) => ({ user: data.name, tasksCompleted: data.completed }))
                .filter((performer) => performer.tasksCompleted > 0)
                .filter((performer) => performer.user.toLowerCase().includes(searchQuery.toLowerCase()))
                .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
                .slice(0, 3);

            // Task Completion Over Time
            const dateLabels = [];
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                dateLabels.push(d.toISOString().split('T')[0]);
            }
            const taskCompletionData = dateLabels.map((date) => {
                return fetchedTasks.filter(
                    (task) => task.completed && task.completedAt && new Date(task.completedAt).toISOString().split('T')[0] === date
                ).length;
            });

            // Task and Goal Activity by User
            const userActivity = {};
            users.forEach((user) => {
                const userEmail = user.email;
                const userName = user.name || user.email;
                userActivity[userEmail] = {
                    name: userName,
                    tasksCompleted: fetchedTasks.filter((task) => task.owner?.email === userEmail && task.completed).length,
                    goalProgress: fetchedGoals
                        .filter((goal) => goal.owner?.email === userEmail)
                        .reduce((sum, goal) => {
                            const progress = goal.subGoals && goal.subGoals.length > 0
                                ? (goal.subGoals.filter((sg) => sg.completed).length / goal.subGoals.length) * 100
                                : 0;
                            return sum + progress;
                        }, 0) / (fetchedGoals.filter((goal) => goal.owner?.email === userEmail).length || 1),
                };
            });
            const activityLabels = Object.values(userActivity).map((data) => data.name);
            const taskActivityData = Object.values(userActivity).map((data) => data.tasksCompleted);
            const goalActivityData = Object.values(userActivity).map((data) => Math.round(data.goalProgress));

            setAnalyticsData({
                avgTaskCompletionTime,
                topPerformers,
                goalCompletionRate,
                taskCompletionOverTime: {
                    labels: dateLabels,
                    datasets: [
                        {
                            label: 'Tasks Completed',
                            data: taskCompletionData,
                            borderColor: '#00CED1',
                            backgroundColor: 'rgba(0, 206, 209, 0.2)',
                            fill: true,
                            tension: 0.4,
                        },
                    ],
                },
                taskGoalActivityByUser: {
                    labels: activityLabels,
                    datasets: [
                        {
                            label: 'Tasks Completed',
                            data: taskActivityData,
                            backgroundColor: '#00CED1',
                        },
                        {
                            label: 'Goal Progress (%)',
                            data: goalActivityData,
                            backgroundColor: '#1E90FF',
                        },
                    ],
                },
            });
            setError('');
            toast.success('Analytics data loaded successfully!');
        } catch (err) {
            console.error('Error fetching analytics data:', err);
            if (err.response?.status === 403) {
                setError('Access denied: Super-admin role required.');
                toast.error('Access denied: Super-admin role required.');
            } else if (err.response?.status === 401) {
                setError('Session expired. Please log in again.');
                toast.error('Session expired. Please log in again.');
            } else if (err.response?.status === 400) {
                setError(err.response.data.message || 'Invalid request for analytics data.');
                toast.error(err.response.data.message || 'Invalid request for analytics data.');
            } else {
                setError('Failed to fetch analytics data.');
                toast.error('Failed to fetch analytics data.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, [dateRange, customDateRange, selectedUser, searchQuery]);

    // Handle export
    const handleExport = (format) => {
        setIsLoading(true);
        setTimeout(() => {
            try {
                if (format === 'csv') {
                    const exportData = [
                        ['Metric', 'Value'],
                        ['Average Task Completion Time', analyticsData.avgTaskCompletionTime],
                        ['Goal Completion Rate', `${analyticsData.goalCompletionRate}%`],
                        ['Top Performers', analyticsData.topPerformers.map((p) => `${p.user}: ${p.tasksCompleted} tasks`).join('; ')],
                        ['Task Completion Over Time', analyticsData.taskCompletionOverTime.labels.map((label, idx) => `${label}: ${analyticsData.taskCompletionOverTime.datasets[0].data[idx]}`).join('; ')],
                        ['Task and Goal Activity by User', analyticsData.taskGoalActivityByUser.labels.map((label, idx) => `${label}: Tasks=${analyticsData.taskGoalActivityByUser.datasets[0].data[idx]}, Goal Progress=${analyticsData.taskGoalActivityByUser.datasets[1].data[idx]}%`).join('; ')],
                    ];
                    const csvContent = exportData.map((row) => row.join(',')).join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `analytics_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else if (format === 'png') {
                    const canvases = document.querySelectorAll('canvas');
                    if (canvases.length > 0) {
                        const canvas = canvases[0]; // Export first chart
                        const link = document.createElement('a');
                        link.href = canvas.toDataURL('image/png');
                        link.download = `analytics_chart_${Date.now()}.png`;
                        link.click();
                    } else {
                        setError('No chart available to export as PNG.');
                        toast.error('No chart available to export as PNG.');
                    }
                }
                toast.success(`Analytics exported as ${format.toUpperCase()} successfully!`);
            } catch (err) {
                console.error('Error exporting analytics:', err);
                setError('Failed to export analytics.');
                toast.error('Failed to export analytics.');
            } finally {
                setIsLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="p-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-teal-600">Analytics Dashboard</h2>
                <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="Search top performers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 w-full"
                        aria-label="Search top performers"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <select
                    value={dateRange}
                    onChange={(e) => {
                        setDateRange(e.target.value);
                        if (e.target.value !== 'Custom') {
                            setCustomDateRange({ start: '', end: '' });
                        }
                    }}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Select date range"
                >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 90 Days">Last 90 Days</option>
                    <option value="Custom">Custom</option>
                </select>
                {dateRange === 'Custom' && (
                    <>
                        <div className="relative">
                            <input
                                type="date"
                                value={customDateRange.start}
                                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                                className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                                aria-label="Start date"
                            />
                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
                        </div>
                        <div className="relative">
                            <input
                                type="date"
                                value={customDateRange.end}
                                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                                className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                                aria-label="End date"
                            />
                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
                        </div>
                    </>
                )}
                <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                    aria-label="Select user"
                >
                    {availableUsers.map((user) => (
                        <option key={user} value={user}>
                            {user}
                        </option>
                    ))}
                </select>
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
                    onClick={() => handleExport('png')}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center hover:bg-blue-700 transition-all duration-300"
                    disabled={isLoading}
                    aria-label="Export as PNG"
                >
                    <Download className="w-5 h-5 mr-2" />
                    Export PNG
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="text-red-500 text-sm text-center mb-4 animate-shake">
                    {error}
                </div>
            )}

            {/* Analytics Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Average Task Completion Time */}
                <div
                    className={`bg-teal-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in ${
                        isLoading ? 'opacity-50' : ''
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Avg Task Completion</h3>
                            <p className="text-3xl font-bold">{analyticsData.avgTaskCompletionTime}</p>
                        </div>
                        <Clock className="w-10 h-10 opacity-80 animate-pulse-slow" />
                    </div>
                </div>
                {/* Top Performers */}
                <div
                    className={`bg-blue-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in ${
                        isLoading ? 'opacity-50' : ''
                    }`}
                    style={{ animationDelay: '0.1s' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Top Performers</h3>
                            {analyticsData.topPerformers.length > 0 ? (
                                <ul className="text-sm space-y-1">
                                    {analyticsData.topPerformers.map((performer) => (
                                        <li key={performer.user}>
                                            {performer.user}: {performer.tasksCompleted} tasks
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm">No performers found.</p>
                            )}
                        </div>
                        <Users className="w-10 h-10 opacity-80 animate-pulse-slow-delayed" />
                    </div>
                </div>
                {/* Goal Completion Rate */}
                <div
                    className={`bg-teal-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in ${
                        isLoading ? 'opacity-50' : ''
                    }`}
                    style={{ animationDelay: '0.2s' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Goal Completion Rate</h3>
                            <p className="text-3xl font-bold">{analyticsData.goalCompletionRate}%</p>
                        </div>
                        <Target className="w-10 h-10 opacity-80 animate-pulse-slow" />
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Completion Over Time */}
                <div
                    className={`bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in ${
                        isLoading ? 'opacity-50' : ''
                    }`}
                >
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Task Completion Over Time
                    </h3>
                    <div className="h-96">
                        <Line data={analyticsData.taskCompletionOverTime} options={chartOptions} />
                    </div>
                </div>
                {/* Task and Goal Activity by User */}
                <div
                    className={`bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-fade-in ${
                        isLoading ? 'opacity-50' : ''
                    }`}
                    style={{ animationDelay: '0.1s' }}
                >
                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                        <BarChart2 className="w-5 h-5 mr-2" />
                        Task and Goal Activity by User
                    </h3>
                    <div className="h-96">
                        <Bar data={analyticsData.taskGoalActivityByUser} options={barChartOptions} />
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

export default AdminAnalytics;