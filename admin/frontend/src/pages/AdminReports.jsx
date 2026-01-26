import React, { useState, useEffect } from 'react';
import {
    BarChart2,
    PieChart,
    LineChart,
    Gauge,
    Search,
    ChevronUp,
    ChevronDown,
    Download,
    Filter,
    Calendar,
} from 'lucide-react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import zoomPlugin from 'chartjs-plugin-zoom';
import axios from 'axios';
import toast from 'react-hot-toast';

ChartJS.register(
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartDataLabels,
    zoomPlugin
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const initialSystemUsageData = {
    chartData: {
        labels: [],
        datasets: [
            {
                data: [],
                backgroundColor: ['#00CED1', '#1E90FF', '#FFD700', '#FF6347'],
                borderColor: '#FFFFFF',
                borderWidth: 1,
            },
        ],
    },
    tableColumns: ['user', 'storageUsed', 'percentQuota', 'fileCount'],
    tableData: [],
};

const initialTaskCompletionData = {
    chartData: {
        labels: [],
        datasets: [
            {
                label: 'Completed',
                data: [],
                backgroundColor: '#00CED1',
            },
            {
                label: 'In Progress',
                data: [],
                backgroundColor: '#1E90FF',
            },
        ],
    },
    tableColumns: ['user', 'completed', 'inProgress', 'email'],
    tableData: [],
};

const AdminReports = () => {
    const [selectedReport, setSelectedReport] = useState('User Activity');
    const [customReportOpen, setCustomReportOpen] = useState(false);
    const [customMetrics, setCustomMetrics] = useState([]);
    const [customUsers, setCustomUsers] = useState(['All Users']);
    const [customDateRange, setCustomDateRange] = useState({ start: '2025-06-01', end: '2025-06-25' });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userActivityData, setUserActivityData] = useState({
        chartData: {
            labels: [],
            datasets: [
                {
                    label: 'Active Sessions',
                    data: [],
                    borderColor: '#00CED1',
                    backgroundColor: 'rgba(0, 206, 209, 0.2)',
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
        tableColumns: ['user', 'sessions', 'lastActive'],
        tableData: [],
    });
    const [taskCompletionData, setTaskCompletionData] = useState(initialTaskCompletionData);
    const [goalProgressData, setGoalProgressData] = useState({
        chartData: {
            labels: ['0-25%', '26-50%', '51-75%', '76-100%'],
            datasets: [
                {
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#FF6347', '#FFD700', '#00CED1', '#1E90FF'],
                    borderColor: '#FFFFFF',
                    borderWidth: 1,
                },
            ],
        },
        tableColumns: ['goal', 'users', 'progress', 'deadline'],
        tableData: [],
    });
    const [systemUsageData, setSystemUsageData] = useState(initialSystemUsageData);
    const [availableUsers, setAvailableUsers] = useState(['All Users']);
    const rowsPerPage = 5;

    const lineChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#2D3748' } },
            tooltip: { backgroundColor: '#2D3748', titleColor: '#FFFFFF', bodyColor: '#FFFFFF' },
            zoom: {
                pan: { enabled: true, mode: 'xy' },
                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
            },
        },
        scales: {
            x: { ticks: { color: '#2D3748' } },
            y: { ticks: { color: '#2D3748' } },
        },
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#2D3748' } },
            tooltip: { backgroundColor: '#2D3748', titleColor: '#FFFFFF', bodyColor: '#FFFFFF' },
        },
        scales: {
            x: { ticks: { color: '#2D3748' }, stacked: true },
            y: { ticks: { color: '#2D3748' }, stacked: true },
        },
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#2D3748',
                    font: { size: 12 },
                    padding: 10,
                },
                maxWidth: 150,
            },
            tooltip: {
                backgroundColor: '#2D3748',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
                callbacks: {
                    label: (context) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    },
                },
            },
            datalabels: {
                color: '#FFFFFF',
                font: { size: 10 },
                formatter: (value, ctx) => {
                    const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '';
                },
                anchor: 'center',
                align: 'center',
            },
        },
    };

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
                    const users = response.data.users.map((user) => user.name);
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

    const handleReportSelect = async (report) => {
        setSelectedReport(report);
        setSearchQuery('');
        setSortConfig({ key: '', direction: '' });
        setCurrentPage(1);
        setSelectedRows([]);
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('Authentication token missing. Please log in again.');
                toast.error('Authentication token missing. Please log in again.');
                setIsLoading(false);
                return;
            }

            if (report === 'User Activity') {
                const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                });
                if (response.data.success) {
                    const users = response.data.users;
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(endDate.getDate() - 4);
                    const dateLabels = [];
                    const sessionData = [];
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        dateLabels.push(dateStr);
                        const sessions = users.reduce((count, user) => {
                            const loginLogs = user.activityLogs?.filter(
                                (log) =>
                                    log.action === 'login' &&
                                    new Date(log.timestamp).toISOString().split('T')[0] === dateStr
                            ) || [];
                            return count + loginLogs.length;
                        }, 0);
                        sessionData.push(sessions);
                    }
                    const tableData = users.map((user, idx) => ({
                        id: user._id,
                        user: user.name,
                        sessions: user.activityLogs?.filter((log) => log.action === 'login').length || 0,
                        lastActive: user.lastLogin ? new Date(user.lastLogin).toISOString().split('T')[0] : 'Never',
                    }));
                    setUserActivityData({
                        chartData: {
                            labels: dateLabels,
                            datasets: [
                                {
                                    label: 'Active Sessions',
                                    data: sessionData,
                                    borderColor: '#00CED1',
                                    backgroundColor: 'rgba(0, 206, 209, 0.2)',
                                    fill: true,
                                    tension: 0.4,
                                },
                            ],
                        },
                        tableColumns: ['user', 'sessions', 'lastActive'],
                        tableData,
                    });
                    setSuccess(`Loaded ${report} report successfully!`);
                    toast.success(`Loaded ${report} report successfully!`);
                } else {
                    setError(response.data.message || 'Failed to fetch user activity data.');
                    toast.error(response.data.message || 'Failed to fetch user activity data.');
                }
            } else if (report === 'Task Completion') {
                const [reportResponse, tasksResponse] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/admin/tasks/report`, {
                        headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                    }),
                    axios.get(`${API_BASE_URL}/api/admin/tasks`, {
                        headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                    }),
                ]);

                if (reportResponse.data.success && tasksResponse.data.success) {
                    const tasks = tasksResponse.data.tasks;
                    const userTaskStats = {};
                    tasks.forEach((task) => {
                        const userEmail = task.owner?.email || 'Unassigned';
                        if (!userTaskStats[userEmail]) {
                            userTaskStats[userEmail] = { completed: 0, inProgress: 0, overdue: 0 };
                        }
                        if (task.completed) {
                            userTaskStats[userEmail].completed += 1;
                        } else {
                            userTaskStats[userEmail].inProgress += 1;
                            if (task.dueDate && new Date(task.dueDate) < new Date() && !task.completed) {
                                userTaskStats[userEmail].overdue += 1;
                            }
                        }
                    });

                    const labels = Object.keys(userTaskStats);
                    const completedData = labels.map((user) => userTaskStats[user].completed);
                    const inProgressData = labels.map((user) => userTaskStats[user].inProgress);

                    const tableData = labels.map((user, idx) => ({
                        id: `task-${idx}`,
                        user,
                        completed: userTaskStats[user].completed,
                        inProgress: userTaskStats[user].inProgress,
                        email: userTaskStats[user].overdue,
                    }));

                    setTaskCompletionData({
                        chartData: {
                            labels,
                            datasets: [
                                {
                                    label: 'Completed',
                                    data: completedData,
                                    backgroundColor: '#00CED1',
                                },
                                {
                                    label: 'In Progress',
                                    data: inProgressData,
                                    backgroundColor: '#1E90FF',
                                },
                            ],
                        },
                        tableColumns: ['user', 'completed', 'inProgress', 'email'],
                        tableData,
                    });
                    setSuccess(`Loaded ${report} report successfully!`);
                    toast.success(`Loaded ${report} report successfully!`);
                } else {
                    setError('Failed to fetch task completion data.');
                    toast.error('Failed to fetch task completion data.');
                }
            } else if (report === 'Goal Progress') {
                const response = await axios.get(`${API_BASE_URL}/api/admin/goals`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                });
                if (response.data.success) {
                    const goals = response.data.goals;
                    const progressRanges = {
                        '0-25%': 0,
                        '26-50%': 0,
                        '51-75%': 0,
                        '76-100%': 0,
                    };
                    const tableData = goals.map((goal, idx) => {
                        const progress = goal.progress || 0;
                        if (progress <= 25) progressRanges['0-25%'] += 1;
                        else if (progress <= 50) progressRanges['26-50%'] += 1;
                        else if (progress <= 75) progressRanges['51-75%'] += 1;
                        else progressRanges['76-100%'] += 1;

                        return {
                            id: goal._id,
                            goal: goal.title,
                            users: goal.owner?.email || 'Unassigned',
                            progress,
                            deadline: goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : 'N/A',
                        };
                    });

                    setGoalProgressData({
                        chartData: {
                            labels: ['0-25%', '26-50%', '51-75%', '76-100%'],
                            datasets: [
                                {
                                    data: [
                                        progressRanges['0-25%'],
                                        progressRanges['26-50%'],
                                        progressRanges['51-75%'],
                                        progressRanges['76-100%'],
                                    ],
                                    backgroundColor: ['#FF6347', '#FFD700', '#00CED1', '#1E90FF'],
                                    borderColor: '#FFFFFF',
                                    borderWidth: 1,
                                },
                            ],
                        },
                        tableColumns: ['goal', 'users', 'progress', 'deadline'],
                        tableData,
                    });
                    setSuccess(`Loaded ${report} report successfully!`);
                    toast.success(`Loaded ${report} report successfully!`);
                } else {
                    setError(response.data.message || 'Failed to fetch goal progress data.');
                    toast.error(response.data.message || 'Failed to fetch goal progress data.');
                }
            } else if (report === 'System Usage') {
                // Fetch users
                const usersResponse = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                });
                if (!usersResponse.data.success) {
                    throw new Error('Failed to fetch users.');
                }
                const users = usersResponse.data.users;

                // Fetch storage usage and files for all users
                const storagePromises = users.map(user =>
                    axios.get(`${API_BASE_URL}/api/admin/users/${user._id}/storage`, {
                        headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                    })
                );
                const filesPromises = users.map(user =>
                    axios.get(`${API_BASE_URL}/api/admin/users/${user._id}/files`, {
                        headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                        params: { limit: 1000 }, // Ensure all files are fetched
                    })
                );

                const [storageResponses, filesResponses] = await Promise.all([
                    Promise.all(storagePromises),
                    Promise.all(filesPromises),
                ]);

                // Process file types for pie chart
                const fileTypeCounts = {};
                let totalFiles = 0;
                const userFileData = users.map((user, idx) => {
                    const files = filesResponses[idx].data.success ? filesResponses[idx].data.files : [];
                    files.forEach(file => {
                        const extension = file.fileName.split('.').pop().toUpperCase();
                        fileTypeCounts[extension] = (fileTypeCounts[extension] || 0) + 1;
                        totalFiles += 1;
                    });
                    return { userId: user._id, name: user.name, files };
                });

                const fileTypeLabels = Object.keys(fileTypeCounts);
                const fileTypeData = Object.values(fileTypeCounts);

                // Process table data
                const tableData = users.map((user, idx) => {
                    const storage = storageResponses[idx].data.success ? storageResponses[idx].data : { storageUsed: 0, totalStorage: 2097152 }; // Default to 2GB
                    const files = userFileData.find(u => u.userId === user._id)?.files || [];
                    const storageUsedMB = (storage.storageUsed / 1024).toFixed(2); // Convert KB to MB
                    const percentQuota = ((storage.storageUsed / storage.totalStorage) * 100).toFixed(2);
                    return {
                        id: user._id,
                        user: user.name,
                        storageUsed: storageUsedMB,
                        percentQuota,
                        fileCount: files.length,
                    };
                });

                setSystemUsageData({
                    chartData: {
                        labels: fileTypeLabels.length > 0 ? fileTypeLabels : ['No Files'],
                        datasets: [
                            {
                                data: fileTypeLabels.length > 0 ? fileTypeData : [1],
                                backgroundColor: ['#00CED1', '#1E90FF', '#FFD700', '#FF6347'],
                                borderColor: '#FFFFFF',
                                borderWidth: 1,
                            },
                        ],
                    },
                    tableColumns: ['user', 'storageUsed', 'percentQuota', 'fileCount'],
                    tableData,
                });
                setSuccess(`Loaded ${report} report successfully!`);
                toast.success(`Loaded ${report} report successfully!`);
            }
        } catch (err) {
            console.error('Error fetching report data:', err);
            setError('Failed to fetch report data.');
            toast.error('Failed to fetch report data.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomReport = async (e) => {
        e.preventDefault();
        if (customMetrics.length === 0 || customUsers.length === 0) {
            setError('Please select at least one metric and one user.');
            toast.error('Please select at least one metric and one user.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('Authentication token missing. Please log in again.');
                toast.error('Authentication token missing. Please log in again.');
                setIsLoading(false);
                return;
            }
            const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
            });
            const tasksResponse = await axios.get(`${API_BASE_URL}/api/admin/tasks`, {
                headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
            });
            const goalsResponse = await axios.get(`${API_BASE_URL}/api/admin/goals`, {
                headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
            });

            if (response.data.success && tasksResponse.data.success && goalsResponse.data.success) {
                const users = response.data.users.filter((user) =>
                    customUsers.includes('All Users') || customUsers.includes(user.name)
                );
                const tasks = tasksResponse.data.tasks.filter((task) => {
                    const taskDate = task.createdAt ? new Date(task.createdAt) : null;
                    return (
                        taskDate &&
                        taskDate >= new Date(customDateRange.start) &&
                        taskDate <= new Date(customDateRange.end)
                    );
                });
                const goals = goalsResponse.data.goals.filter((goal) => {
                    const goalDate = goal.createdAt ? new Date(goal.createdAt) : null;
                    return (
                        goalDate &&
                        goalDate >= new Date(customDateRange.start) &&
                        goalDate <= new Date(customDateRange.end)
                    );
                });

                const filteredUsers = users.filter((user) =>
                    tasks.some((task) => task.owner && task.owner._id.toString() === user._id.toString()) ||
                    goals.some((goal) => goal.owner && goal.owner._id.toString() === user._id.toString())
                );
                const chartLabels = filteredUsers.map((user) => user.name);
                const chartDatasets = customMetrics.map((metric, idx) => {
                    const data = filteredUsers.map((user) => {
                        if (metric === 'Active Sessions') {
                            return (
                                user.activityLogs?.filter(
                                    (log) =>
                                        log.action === 'login' &&
                                        new Date(log.timestamp) >= new Date(customDateRange.start) &&
                                        new Date(log.timestamp) <= new Date(customDateRange.end)
                                ).length || 0
                            );
                        } else if (metric === 'Tasks Completed') {
                            return tasks.filter(
                                (task) =>
                                    task.owner &&
                                    task.owner._id.toString() === user._id.toString() &&
                                    task.completed
                            ).length;
                        } else if (metric === 'Goal Progress') {
                            const userGoals = goals.filter(
                                (goal) =>
                                    goal.owner &&
                                    goal.owner._id.toString() === user._id.toString()
                            );
                            return userGoals.length > 0
                                ? userGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / userGoals.length
                                : 0;
                        }
                        return Math.floor(Math.random() * 100);
                    });
                    return {
                        label: metric,
                        data,
                        backgroundColor: idx % 2 === 0 ? '#00CED1' : '#1E90FF',
                    };
                });
                const tableData = filteredUsers.map((user, idx) => {
                    const row = { id: user._id, user: user.name };
                    customMetrics.forEach((metric) => {
                        const key = metric.toLowerCase().replace(' ', '');
                        if (metric === 'Active Sessions') {
                            row[key] =
                                user.activityLogs?.filter(
                                    (log) =>
                                        log.action === 'login' &&
                                        new Date(log.timestamp) >= new Date(customDateRange.start) &&
                                        new Date(log.timestamp) <= new Date(customDateRange.end)
                                ).length || 0;
                        } else if (metric === 'Tasks Completed') {
                            row[key] = tasks.filter(
                                (task) =>
                                    task.owner &&
                                    task.owner._id.toString() === user._id.toString() &&
                                    task.completed
                            ).length;
                        } else if (metric === 'Goal Progress') {
                            const userGoals = goals.filter(
                                (goal) =>
                                    goal.owner &&
                                    goal.owner._id.toString() === user._id.toString()
                            );
                            row[key] = userGoals.length > 0
                                ? (userGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / userGoals.length).toFixed(1)
                                : '0';
                        } else {
                            row[key] = Math.floor(Math.random() * 100);
                        }
                    });
                    return row;
                });
                setUserActivityData({
                    chartData: {
                        labels: chartLabels,
                        datasets: chartDatasets,
                    },
                    tableColumns: ['user', ...customMetrics.map((m) => m.toLowerCase().replace(' ', ''))],
                    tableData,
                });
                setSelectedReport('Custom Report');
                setSuccess('Custom report generated successfully!');
                toast.success('Custom report generated successfully!');
                setCustomReportOpen(false);
            } else {
                setError(response.data.message || 'Failed to generate custom report.');
                toast.error(response.data.message || 'Failed to generate custom report.');
            }
        } catch (err) {
            console.error('Error generating custom report:', err);
            setError('Failed to generate custom report.');
            toast.error('Failed to generate custom report.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        let sortedData;
        if (selectedReport === 'User Activity') {
            sortedData = [...userActivityData.tableData];
        } else if (selectedReport === 'Task Completion') {
            sortedData = [...taskCompletionData.tableData];
        } else if (selectedReport === 'Goal Progress') {
            sortedData = [...goalProgressData.tableData];
        } else if (selectedReport === 'System Usage') {
            sortedData = [...systemUsageData.tableData];
        } else {
            sortedData = [...userActivityData.tableData];
        }
        sortedData.sort((a, b) => {
            if (key === 'progress' || key === 'completed' || key === 'inProgress' || key === 'email' || key === 'sessions' || key === 'storageUsed' || key === 'percentQuota' || key === 'fileCount') {
                return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
            }
            return direction === 'asc'
                ? String(a[key]).localeCompare(String(a[key]))
                : String(b[key]).localeCompare(String(a[key]));
        });
        if (selectedReport === 'User Activity') {
            setUserActivityData({ ...userActivityData, tableData: sortedData });
        } else if (selectedReport === 'Task Completion') {
            setTaskCompletionData({ ...taskCompletionData, tableData: sortedData });
        } else if (selectedReport === 'Goal Progress') {
            setGoalProgressData({ ...goalProgressData, tableData: sortedData });
        } else if (selectedReport === 'System Usage') {
            setSystemUsageData({ ...systemUsageData, tableData: sortedData });
        } else {
            setUserActivityData({ ...userActivityData, tableData: sortedData });
        }
    };

    const handleExport = (format) => {
        const reportData =
            selectedReport === 'User Activity'
                ? userActivityData
                : selectedReport === 'Task Completion'
                ? taskCompletionData
                : selectedReport === 'Goal Progress'
                ? goalProgressData
                : selectedReport === 'System Usage'
                ? systemUsageData
                : userActivityData;
        if (reportData.tableData.length === 0) {
            setError('No data to export.');
            toast.error('No data to export.');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            if (format === 'csv') {
                const csvHeaders = reportData.tableColumns;
                const exportData = selectedRows.length > 0
                    ? reportData.tableData.filter((row) => selectedRows.includes(row.id))
                    : reportData.tableData;
                const csvRows = exportData.map((row) =>
                    csvHeaders.map((header) => `"${row[header] || ''}"`).join(',')
                );
                const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${selectedReport.toLowerCase().replace(' ', '_')}_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'pdf') {
                console.log('PDF export initiated');
                setSuccess('PDF export initiated! (Placeholder)');
                toast.success('PDF export initiated!');
            } else if (format === 'png') {
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');
                    link.download = `${selectedReport.toLowerCase().replace(' ', '_')}_${Date.now()}.png`;
                    link.click();
                } else {
                    setError('No chart available to export as PNG.');
                    toast.error('No chart available to export as PNG.');
                }
            }
            setSuccess(`Report exported as ${format.toUpperCase()} successfully!`);
            toast.success(`Report exported as ${format.toUpperCase()} successfully!`);
            setIsLoading(false);
        }, 1000);
    };

    const reportData =
        selectedReport === 'User Activity'
            ? userActivityData
            : selectedReport === 'Task Completion'
            ? taskCompletionData
            : selectedReport === 'Goal Progress'
            ? goalProgressData
            : selectedReport === 'System Usage'
            ? systemUsageData
            : userActivityData;
    const filteredData = reportData.tableData.filter((row) =>
        Object.values(row).some((value) =>
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(paginatedData.map((row) => row.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-600">Reports & Analytics</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search report data..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 w-64"
                        aria-label="Search report data"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600" size={18} />
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {['User Activity', 'Task Completion', 'Goal Progress', 'System Usage'].map((report) => (
                    <button
                        key={report}
                        onClick={() => handleReportSelect(report)}
                        className={`px-4 py-2 rounded-lg text-white transition-all duration-300 transform hover:scale-105 ${selectedReport === report ? 'bg-teal-600' : 'bg-teal-400 hover:bg-teal-500'}`}
                        aria-label={`Select ${report} report`}
                    >
                        {report}
                    </button>
                ))}
                <button
                    onClick={() => setCustomReportOpen(!customReportOpen)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                    aria-label="Toggle custom report builder"
                >
                    <Filter className="inline-block w-5 h-5 mr-2" />
                    Custom Report
                </button>
            </div>

            {customReportOpen && (
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-6 animate-slide-in">
                    <h3 className="text-lg font-semibold text-teal-700 mb-4">Custom Report Builder</h3>
                    <form onSubmit={handleCustomReport} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 mb-2">Select Metrics</label>
                            <select
                                multiple
                                value={customMetrics}
                                onChange={(e) => setCustomMetrics(Array.from(e.target.selectedOptions, (option) => option.value))}
                                className="w-full p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                                aria-label="Select metrics"
                            >
                                {['Active Sessions', 'Tasks Completed', 'Goal Progress', 'Attachments'].map((metric) => (
                                    <option key={metric} value={metric}>{metric}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Select Users</label>
                            <select
                                multiple
                                value={customUsers}
                                onChange={(e) => setCustomUsers(Array.from(e.target.selectedOptions, (option) => option.value))}
                                className="w-full p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                                aria-label="Select users"
                            >
                                {availableUsers.map((user) => (
                                    <option key={user} value={user}>{user}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={customDateRange.start}
                                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                                className="w-full p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                                aria-label="Start date"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">End Date</label>
                            <input
                                type="date"
                                value={customDateRange.end}
                                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                                className="w-full p-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
                                aria-label="End date"
                            />
                        </div>
                        <div className="col-span-2">
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300"
                                disabled={isLoading}
                                aria-label="Generate custom report"
                            >
                                Generate Report
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg mb-8 animate-fade-in">
                <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                    {selectedReport === 'User Activity' && <LineChart className="w-5 h-5 mr-2" />}
                    {selectedReport === 'Task Completion' && <BarChart2 className="w-5 h-5 mr-2" />}
                    {selectedReport === 'Goal Progress' && <PieChart className="w-5 h-5 mr-2" />}
                    {selectedReport === 'System Usage' && <PieChart className="w-5 h-5 mr-2" />}
                    {selectedReport} Report
                </h3>
                {selectedReport === 'Goal Progress' || selectedReport === 'System Usage' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="relative flex justify-center items-center h-64">
                            <div className="w-56 h-56">
                                {selectedReport === 'Goal Progress' ? (
                                    <Pie data={goalProgressData.chartData} options={pieChartOptions} />
                                ) : (
                                    <Pie data={systemUsageData.chartData} options={pieChartOptions} />
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                            <h4 className="text-md font-medium text-gray-700 mb-4">
                                {selectedReport === 'Goal Progress' ? 'Goal Progress Summary' : 'File Type Distribution'}
                            </h4>
                            <ul className="space-y-2">
                                {(selectedReport === 'Goal Progress' ? goalProgressData : systemUsageData).chartData.labels.map((label, idx) => (
                                    <li key={label} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center">
                                            <span
                                                className="w-3 h-3 rounded-full mr-2"
                                                style={{ backgroundColor: (selectedReport === 'Goal Progress' ? goalProgressData : systemUsageData).chartData.datasets[0].backgroundColor[idx] }}
                                            ></span>
                                            <span className="text-gray-600">{label}</span>
                                        </div>
                                        <span className="text-gray-800 font-medium">
                                            {(selectedReport === 'Goal Progress' ? goalProgressData : systemUsageData).chartData.datasets[0].data[idx]}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="h-64">
                        {selectedReport === 'User Activity' && (
                            <Line data={userActivityData.chartData} options={lineChartOptions} />
                        )}
                        {selectedReport === 'Task Completion' && (
                            <Bar data={taskCompletionData.chartData} options={barChartOptions} />
                        )}
                        {selectedReport === 'Custom Report' && (
                            <Bar data={userActivityData.chartData} options={barChartOptions} />
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="text-red-500 text-sm text-center animate-shake mb-4">
                    {error}
                </div>
            )}
            {success && (
                <div className="text-teal-600 text-sm text-center animate-fade-in mb-4">
                    {success}
                </div>
            )}

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

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-teal-50">
                            <th className="p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                    aria-label="Select all rows"
                                />
                            </th>
                            {reportData.tableColumns.map((col) => (
                                <th
                                    key={col}
                                    className="p-3 text-left text-teal-700 cursor-pointer hover:text-teal-900 transition-colors"
                                    onClick={() => handleSort(col)}
                                    aria-sort={sortConfig.key === col ? sortConfig.direction : 'none'}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                                        {sortConfig.key === col &&
                                            (sortConfig.direction === 'asc' ? (
                                                <ChevronUp size={16} />
                                            ) : (
                                                <ChevronDown size={16} />
                                            ))}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-teal-100 hover:bg-teal-50 transition-all duration-200"
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.includes(row.id)}
                                        onChange={() => handleSelectRow(row.id)}
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-400"
                                        aria-label={`Select row for ${row.id}`}
                                    />
                                </td>
                                {reportData.tableColumns.map((col) => (
                                    <td key={`${col}-${row.id}`} className="p-3">
                                        {col === 'progress' ? (
                                            <div className="flex items-center">
                                                <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                                    <div
                                                        className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                                                        style={{ width: `${row.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600">{row.progress}%</span>
                                            </div>
                                        ) : col === 'email' ? (
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs ${row.email === 0 ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'}`}
                                            >
                                                {row.email}
                                            </span>
                                        ) : col === 'percentQuota' ? (
                                            <span className="text-sm text-gray-600">{row.percentQuota}%</span>
                                        ) : col === 'storageUsed' ? (
                                            <span className="text-sm text-gray-600">{row.storageUsed} MB</span>
                                        ) : (
                                            row[col]
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
                    {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}{' '}
                    rows
                </p>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white font-bold disabled:bg-gray-300 hover:bg-teal-700 transition-all duration-300"
                        aria-label="Previous page"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white font-bold disabled:bg-gray-300 hover:bg-teal-700 transition-all duration-300"
                        aria-label="Next page"
                    >
                        Next
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                    <div className="w-12 h-12 border-4 border-teal-400 border-t-teal-600 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

export default AdminReports;