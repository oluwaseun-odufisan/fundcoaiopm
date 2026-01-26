import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    FileText,
    Target,
    HardDrive,
    Clock,
    BarChart2,
    TrendingUp,
    PieChart,
    ArrowRight,
    Star,
    Layers,
    CheckCircle,
    Percent,
    AlertTriangle,
    Server,
} from 'lucide-react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const USER_API_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:4001';

const AdminDashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [priorityDebug, setPriorityDebug] = useState('');
    const [dashboardData, setDashboardData] = useState({
        totalUsers: 0,
        activeTasks: { pending: 0, completed: 0 },
        goalsInProgress: [],
        storage: {
            totalUsed: '7.5 GB',
            totalQuota: '50 GB',
            perUserQuota: '10 GB',
        },
        recentActivities: [],
        overdueTasks: [],
        topPerformers: [],
        systemHealth: {
            latency: 120, // ms
            activeSessions: 45,
            uptime: 99.9, // %
        },
        taskCompletionData: {
            labels: [],
            datasets: [
                { label: 'Completed Tasks', data: [], backgroundColor: '#14B8A6' },
                { label: 'Pending Tasks', data: [], backgroundColor: '#3B82F6' },
            ],
        },
        userActivityData: {
            labels: [],
            datasets: [
                {
                    label: 'User Actions',
                    data: [],
                    borderColor: '#14B8A6',
                    backgroundColor: 'rgba(20, 184, 166, 0.2)',
                    fill: true,
                },
            ],
        },
        goalProgressData: {
            labels: [],
            datasets: [
                {
                    data: [],
                    backgroundColor: ['#14B8A6', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                },
            ],
        },
        userProductivityData: {
            labels: [],
            datasets: [
                {
                    label: 'Productivity Score',
                    data: [],
                    backgroundColor: '#F59E0B',
                },
            ],
        },
        taskPriorityData: {
            labels: ['Low', 'Medium', 'High'],
            datasets: [
                {
                    data: [0, 0, 0],
                    backgroundColor: ['#14B8A6', '#F59E0B', '#EF4444'],
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                },
            ],
        },
        goalMilestoneData: {
            labels: [],
            datasets: [
                {
                    label: 'Completed Milestones',
                    data: [],
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    fill: true,
                },
            ],
        },
        storagePerUserData: {
            labels: [],
            datasets: [
                {
                    label: 'Storage Usage (%)',
                    data: [],
                    backgroundColor: '#3B82F6',
                },
            ],
        },
        avgTaskCompletionTime: 0,
        taskCompletionRate: 0,
        goalCompletionRate: 0,
    });

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError('');
        setPriorityDebug('');
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('Authentication token missing. Please log in again.');
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - 30);

            const [usersResponse, tasksResponse, goalsResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                }),
                axios.get(`${API_BASE_URL}/api/admin/tasks`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                    params: {
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: today.toISOString().split('T')[0],
                    },
                }),
                axios.get(`${API_BASE_URL}/api/admin/goals`, {
                    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
                    params: {
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: today.toISOString().split('T')[0],
                    },
                }),
            ]);

            if (!usersResponse.data.success || !tasksResponse.data.success || !goalsResponse.data.success) {
                throw new Error('Failed to fetch dashboard data.');
            }

            const users = usersResponse.data.users;
            const tasks = tasksResponse.data.tasks.map((task) => {
                const priority = task.priority ? String(task.priority).toLowerCase() : 'medium';
                const validPriority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';
                if (!task.priority || priority !== validPriority) {
                    console.warn(`Task ${task._id}: Invalid or missing priority '${task.priority}', defaulting to 'medium'`);
                }
                return { ...task, priority: validPriority };
            });
            const goals = goalsResponse.data.goals;

            // Debug priority distribution
            const priorityCounts = {
                low: tasks.filter((task) => task.priority === 'low' && !task.completed).length,
                medium: tasks.filter((task) => task.priority === 'medium' && !task.completed).length,
                high: tasks.filter((task) => task.priority === 'high' && !task.completed).length,
            };
            console.log('Priority Counts:', priorityCounts);
            setPriorityDebug(
                `Active Tasks - Low: ${priorityCounts.low}, Medium: ${priorityCounts.medium}, High: ${priorityCounts.high}`
            );

            const totalUsers = users.length;
            const activeTasks = {
                pending: tasks.filter((task) => !task.completed).length,
                completed: tasks.filter((task) => task.completed).length,
            };

            const overdueTasks = tasks
                .filter((task) => !task.completed && task.dueDate && new Date(task.dueDate) < today)
                .map((task) => ({
                    id: task._id,
                    title: task.title,
                    dueDate: new Date(task.dueDate).toISOString().split('T')[0],
                    owner: task.owner?.name || task.owner?.email || 'Unknown',
                }))
                .slice(0, 5);

            const goalsInProgress = goals
                .filter((goal) => ['approved', 'pending'].includes(goal.status))
                .map((goal) => ({
                    id: goal._id,
                    title: goal.title,
                    completion:
                        goal.subGoals && goal.subGoals.length > 0
                            ? (goal.subGoals.filter((sg) => sg.completed).length / goal.subGoals.length) * 100
                            : 0,
                }));

            const completedTasks = tasks.filter(
                (task) => task.completed && task.createdAt && task.completedAt && !isNaN(new Date(task.createdAt)) && !isNaN(new Date(task.completedAt))
            );
            const avgTaskCompletionTime = completedTasks.length > 0
                ? completedTasks.reduce((sum, task) => {
                      const created = new Date(task.createdAt);
                      const completed = new Date(task.completedAt);
                      const diffDays = (completed - created) / (1000 * 60 * 60 * 24);
                      return sum + (isNaN(diffDays) ? 0 : diffDays);
                  }, 0) / completedTasks.length
                : 0;

            const taskCompletionRate = tasks.length > 0 ? (activeTasks.completed / tasks.length) * 100 : 0;

            const completedGoals = goals.filter(
                (goal) => goal.subGoals && goal.subGoals.length > 0 && goal.subGoals.every((sg) => sg.completed)
            ).length;
            const goalCompletionRate = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

            const topPerformers = users
                .map((user) => {
                    const userTasks = tasks.filter((task) => task.owner?._id === user._id);
                    const completedTasks = userTasks.filter((task) => task.completed).length;
                    const userGoals = goals.filter((goal) => goal.owner?._id === user._id);
                    const avgGoalCompletion = userGoals.length > 0
                        ? userGoals.reduce((sum, goal) => {
                              const completion = goal.subGoals && goal.subGoals.length > 0
                                  ? (goal.subGoals.filter((sg) => sg.completed).length / goal.subGoals.length) * 100
                                  : 0;
                              return sum + completion;
                          }, 0) / userGoals.length
                        : 0;
                    const score = (completedTasks * 10) + (avgGoalCompletion * 0.5);
                    return {
                        id: user._id,
                        name: user.name || user.email || 'Unknown',
                        score: Math.min(score, 100),
                        completedTasks,
                        avgGoalCompletion,
                    };
                })
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

            const weeks = [];
            for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 7)) {
                weeks.push(new Date(d).toISOString().split('T')[0]);
            }
            const taskCompletionData = {
                labels: weeks.map((_, i) => `Week ${i + 1}`),
                datasets: [
                    {
                        label: 'Completed Tasks',
                        data: weeks.map((week) => {
                            const weekStart = new Date(week);
                            const weekEnd = new Date(weekStart);
                            weekEnd.setDate(weekStart.getDate() + 7);
                            return tasks.filter(
                                (task) =>
                                    task.completed &&
                                    task.completedAt &&
                                    new Date(task.completedAt) >= weekStart &&
                                    new Date(task.completedAt) < weekEnd
                            ).length;
                        }),
                        backgroundColor: '#14B8A6',
                    },
                    {
                        label: 'Pending Tasks',
                        data: weeks.map((week) => {
                            const weekStart = new Date(week);
                            const weekEnd = new Date(weekStart);
                            weekEnd.setDate(weekStart.getDate() + 7);
                            return tasks.filter(
                                (task) =>
                                    !task.completed &&
                                    task.createdAt &&
                                    new Date(task.createdAt) >= weekStart &&
                                    new Date(task.createdAt) < weekEnd
                            ).length;
                        }),
                        backgroundColor: '#3B82F6',
                    },
                ],
            };

            const dates = [];
            for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 5)) {
                dates.push(new Date(d).toISOString().split('T')[0]);
            }
            const userActivityData = {
                labels: dates.map((date) => date.slice(5, 10)),
                datasets: [
                    {
                        label: 'User Actions',
                        data: dates.map((date) => {
                            const dayStart = new Date(date);
                            const dayEnd = new Date(dayStart);
                            dayEnd.setDate(dayStart.getDate() + 5);
                            return (
                                tasks.filter(
                                    (task) =>
                                        task.createdAt &&
                                        new Date(task.createdAt) >= dayStart &&
                                        new Date(task.createdAt) < dayEnd
                                ).length +
                                goals.filter(
                                    (goal) =>
                                        goal.createdAt &&
                                        new Date(goal.createdAt) >= dayStart &&
                                        new Date(goal.createdAt) < dayEnd
                                ).length
                            );
                        }),
                        borderColor: '#14B8A6',
                        backgroundColor: 'rgba(20, 184, 166, 0.2)',
                        fill: true,
                    },
                ],
            };

            const goalProgressData = {
                labels: goalsInProgress.map((goal) => goal.title),
                datasets: [
                    {
                        data: goalsInProgress.map((goal) => goal.completion),
                        backgroundColor: ['#14B8A6', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
                        borderColor: '#FFFFFF',
                        borderWidth: 2,
                    },
                ],
            };

            const userProductivityData = {
                labels: users.slice(0, 5).map((user) => user.name || user.email || 'Unknown'),
                datasets: [
                    {
                        label: 'Productivity Score',
                        data: users.slice(0, 5).map((user) => {
                            const userTasks = tasks.filter((task) => task.owner?._id === user._id);
                            const completedTasks = userTasks.filter((task) => task.completed).length;
                            const userGoals = goals.filter((goal) => goal.owner?._id === user._id);
                            const avgGoalCompletion = userGoals.length > 0
                                ? userGoals.reduce((sum, goal) => {
                                      const completion = goal.subGoals && goal.subGoals.length > 0
                                          ? (goal.subGoals.filter((sg) => sg.completed).length / goal.subGoals.length) * 100
                                          : 0;
                                      return sum + completion;
                                  }, 0) / userGoals.length
                                : 0;
                            const score = (completedTasks * 10) + (avgGoalCompletion * 0.5);
                            return Math.min(score, 100);
                        }),
                        backgroundColor: '#F59E0B',
                    },
                ],
            };

            const taskPriorityData = {
                labels: ['Low', 'Medium', 'High'],
                datasets: [
                    {
                        data: [
                            priorityCounts.low,
                            priorityCounts.medium,
                            priorityCounts.high,
                        ],
                        backgroundColor: ['#14B8A6', '#F59E0B', '#EF4444'],
                        borderColor: '#FFFFFF',
                        borderWidth: 2,
                    },
                ],
            };

            if (taskPriorityData.datasets[0].data.every((count) => count === 0)) {
                setError('No active tasks with priority data. Please assign priorities in Task Management.');
            }

            const goalMilestoneData = {
                labels: weeks.map((_, i) => `Week ${i + 1}`),
                datasets: [
                    {
                        label: 'Completed Milestones',
                        data: weeks.map((week) => {
                            const weekStart = new Date(week);
                            const weekEnd = new Date(weekStart);
                            weekEnd.setDate(weekStart.getDate() + 7);
                            return goals.reduce((sum, goal) => {
                                const completedSubGoals = goal.subGoals
                                    ? goal.subGoals.filter(
                                          (sg) =>
                                              sg.completed &&
                                              sg.completedAt &&
                                              new Date(sg.completedAt) >= weekStart &&
                                              new Date(sg.completedAt) < weekEnd
                                      ).length
                                    : 0;
                                return sum + completedSubGoals;
                            }, 0);
                        }),
                        borderColor: '#8B5CF6',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        fill: true,
                    },
                ],
            };

            const storagePerUserData = {
                labels: users.slice(0, 5).map((user) => user.name || user.email || 'Unknown'),
                datasets: [
                    {
                        label: 'Storage Usage (%)',
                        data: users.slice(0, 5).map(() => Math.random() * 100), // Placeholder: replace with real API data
                        backgroundColor: '#3B82F6',
                    },
                ],
            };

            const recentActivities = [
                ...tasks.slice(0, 10).map((task) => ({
                    id: task._id,
                    user: task.owner?.name || task.owner?.email || 'Unknown',
                    action: task.completed ? `completed Task "${task.title}"` : `created Task "${task.title}"`,
                    timestamp: new Date(task.createdAt).toISOString().replace('T', ' ').slice(0, 16),
                })),
                ...goals.slice(0, 10).map((goal) => ({
                    id: goal._id,
                    user: goal.owner?.name || goal.owner?.email || 'Unknown',
                    action: `updated Goal "${goal.title}"`,
                    timestamp: new Date(goal.createdAt).toISOString().replace('T', ' ').slice(0, 16),
                })),
            ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20);

            setDashboardData({
                totalUsers,
                activeTasks,
                goalsInProgress,
                storage: dashboardData.storage,
                recentActivities,
                overdueTasks,
                topPerformers,
                systemHealth: dashboardData.systemHealth, // Mock data
                taskCompletionData,
                userActivityData,
                goalProgressData,
                userProductivityData,
                taskPriorityData,
                goalMilestoneData,
                storagePerUserData,
                avgTaskCompletionTime,
                taskCompletionRate,
                goalCompletionRate,
            });

            toast.success('Dashboard data loaded successfully!');
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            if (err.response?.status === 403) {
                setError('Access denied: Super-admin role required.');
                toast.error('Access denied: Super-admin role required.');
            } else if (err.response?.status === 401) {
                setError('Session expired. Please log in again.');
                toast.error('Session expired. Please log in again.');
            } else if (err.response?.status === 400) {
                setError(err.response.data.message || 'Invalid request for dashboard data.');
                toast.error(err.response.data.message || 'Invalid request for dashboard data.');
            } else {
                setError(err.message || 'Failed to fetch dashboard data.');
                toast.error(err.message || 'Failed to fetch dashboard data.');
            }
        } finally {
            setIsLoading(false);
        }
    };

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
            const taskWithPriority = {
                ...task,
                priority: task.priority ? String(task.priority).toLowerCase() : 'medium',
            };
            const validPriority = ['low', 'medium', 'high'].includes(taskWithPriority.priority)
                ? taskWithPriority.priority
                : 'medium';
            if (taskWithPriority.priority !== validPriority) {
                console.warn(`New Task ${task._id}: Invalid priority '${task.priority}', defaulting to 'medium'`);
            }
            taskWithPriority.priority = validPriority;

            setDashboardData((prev) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !taskWithPriority.completed;
                const newPriorityData = {
                    ...prev.taskPriorityData,
                    datasets: [
                        {
                            ...prev.taskPriorityData.datasets[0],
                            data: prev.taskPriorityData.datasets[0].data.map((count, index) => {
                                const priority = ['low', 'medium', 'high'][index];
                                return taskWithPriority.priority === priority && !taskWithPriority.completed
                                    ? count + 1
                                    : count;
                            }),
                        },
                    ],
                };
                console.log('Updated Priority Data (newTask):', newPriorityData);

                return {
                    ...prev,
                    activeTasks: {
                        ...prev.activeTasks,
                        pending: prev.activeTasks.pending + 1,
                    },
                    recentActivities: [
                        {
                            id: taskWithPriority._id,
                            user: taskWithPriority.owner?.name || taskWithPriority.owner?.email || 'Unknown',
                            action: `created Task "${taskWithPriority.title}"`,
                            timestamp: new Date(taskWithPriority.createdAt).toISOString().replace('T', ' ').slice(0, 16),
                        },
                        ...prev.recentActivities.slice(0, 19),
                    ],
                    overdueTasks: isOverdue
                        ? [
                              {
                                  id: taskWithPriority._id,
                                  title: taskWithPriority.title,
                                  dueDate: new Date(taskWithPriority.dueDate).toISOString().split('T')[0],
                                  owner: taskWithPriority.owner?.name || taskWithPriority.owner?.email || 'Unknown',
                              },
                              ...prev.overdueTasks.slice(0, 4),
                          ]
                        : prev.overdueTasks,
                    taskPriorityData: newPriorityData,
                };
            });
            toast.success('New task created!');
        });

        socket.on('updateTask', (updatedTask) => {
            const taskWithPriority = {
                ...updatedTask,
                priority: updatedTask.priority ? String(updatedTask.priority).toLowerCase() : 'medium',
            };
            const validPriority = ['low', 'medium', 'high'].includes(taskWithPriority.priority)
                ? taskWithPriority.priority
                : 'medium';
            if (taskWithPriority.priority !== validPriority) {
                console.warn(`Updated Task ${updatedTask._id}: Invalid priority '${updatedTask.priority}', defaulting to 'medium'`);
            }
            taskWithPriority.priority = validPriority;

            setDashboardData((prev) => {
                const wasCompleted = prev.activeTasks.completed > 0 && taskWithPriority.completed;
                const isOverdue = taskWithPriority.dueDate && new Date(taskWithPriority.dueDate) < new Date() && !taskWithPriority.completed;
                const newPriorityData = {
                    ...prev.taskPriorityData,
                    datasets: [
                        {
                            ...prev.taskPriorityData.datasets[0],
                            data: prev.taskPriorityData.datasets[0].data.map((count, index) => {
                                const priority = ['low', 'medium', 'high'][index];
                                if (taskWithPriority.priority === priority && !taskWithPriority.completed) {
                                    return count + (wasCompleted ? 1 : 0);
                                } else if (taskWithPriority.priority === priority && taskWithPriority.completed) {
                                    return count - (wasCompleted ? 0 : 1);
                                }
                                return count;
                            }),
                        },
                    ],
                };
                console.log('Updated Priority Data (updateTask):', newPriorityData);

                const updatedOverdueTasks = prev.overdueTasks
                    .filter((task) => task.id !== taskWithPriority._id)
                    .slice(0, 5);
                if (isOverdue) {
                    updatedOverdueTasks.unshift({
                        id: taskWithPriority._id,
                        title: taskWithPriority.title,
                        dueDate: new Date(taskWithPriority.dueDate).toISOString().split('T')[0],
                        owner: taskWithPriority.owner?.name || taskWithPriority.owner?.email || 'Unknown',
                    });
                }

                // Recalculate top performers
                const users = prev.topPerformers.map((user) => ({
                    ...user,
                    completedTasks: user.id === taskWithPriority.owner?._id && taskWithPriority.completed
                        ? user.completedTasks + 1
                        : user.completedTasks,
                    score: user.id === taskWithPriority.owner?._id && taskWithPriority.completed
                        ? Math.min((user.completedTasks + 1) * 10 + user.avgGoalCompletion * 0.5, 100)
                        : user.score,
                })).sort((a, b) => b.score - a.score).slice(0, 3);

                return {
                    ...prev,
                    activeTasks: {
                        pending: taskWithPriority.completed
                            ? prev.activeTasks.pending - 1
                            : prev.activeTasks.pending + 1,
                        completed: taskWithPriority.completed
                            ? prev.activeTasks.completed + 1
                            : prev.activeTasks.completed - 1,
                    },
                    recentActivities: [
                        {
                            id: taskWithPriority._id,
                            user: taskWithPriority.owner?.name || taskWithPriority.owner?.email || 'Unknown',
                            action: `updated Task "${taskWithPriority.title}"`,
                            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                        },
                        ...prev.recentActivities.slice(0, 19),
                    ],
                    overdueTasks: updatedOverdueTasks.slice(0, 5),
                    topPerformers: users,
                    taskPriorityData: newPriorityData,
                };
            });
            toast.success('Task updated!');
        });

        socket.on('deleteTask', (taskId) => {
            setDashboardData((prev) => {
                const deletedTask = prev.recentActivities.find((act) => act.id === taskId);
                const assumedPriority = deletedTask ? 'medium' : 'medium';
                const newPriorityData = {
                    ...prev.taskPriorityData,
                    datasets: [
                        {
                            ...prev.taskPriorityData.datasets[0],
                            data: prev.taskPriorityData.datasets[0].data.map((count, index) => {
                                const priority = ['low', 'medium', 'high'][index];
                                return priority === assumedPriority ? Math.max(count - 1, 0) : count;
                            }),
                        },
                    ],
                };
                console.log('Updated Priority Data (deleteTask):', newPriorityData);

                return {
                    ...prev,
                    activeTasks: {
                        ...prev.activeTasks,
                        pending: prev.activeTasks.pending - 1,
                    },
                    recentActivities: prev.recentActivities.filter((act) => act.id !== taskId).slice(0, 20),
                    overdueTasks: prev.overdueTasks.filter((task) => task.id !== taskId).slice(0, 5),
                    taskPriorityData: newPriorityData,
                };
            });
            toast.success('Task deleted!');
        });

        socket.on('newGoal', (goal) => {
            setDashboardData((prev) => ({
                ...prev,
                goalsInProgress: [
                    {
                        id: goal._id,
                        title: goal.title,
                        completion:
                            goal.subGoals && goal.subGoals.length > 0
                                ? (goal.subGoals.filter((sg) => sg.completed).length / goal.subGoals.length) * 100
                                : 0,
                    },
                    ...prev.goalsInProgress,
                ],
                recentActivities: [
                    {
                        id: goal._id,
                        user: goal.owner?.name || goal.owner?.email || 'Unknown',
                        action: `created Goal "${goal.title}"`,
                        timestamp: new Date(goal.createdAt).toISOString().replace('T', ' ').slice(0, 16),
                    },
                    ...prev.recentActivities.slice(0, 19),
                ],
                topPerformers: prev.topPerformers.map((user) => ({
                    ...user,
                    avgGoalCompletion: user.id === goal.owner?._id
                        ? (user.avgGoalCompletion * prev.goalsInProgress.length + (goal.subGoals?.length > 0 ? (goal.subGoals.filter((sg) => sg.completed).length / goal.subGoals.length) * 100 : 0)) / (prev.goalsInProgress.length + 1)
                        : user.avgGoalCompletion,
                    score: user.id === goal.owner?._id
                        ? Math.min(user.completedTasks * 10 + ((user.avgGoalCompletion * prev.goalsInProgress.length + (goal.subGoals?.length > 0 ? (goal.subGoals.filter((sg) => sg.completed).length / goal.subGoals.length) * 100 : 0)) / (prev.goalsInProgress.length + 1)) * 0.5, 100)
                        : user.score,
                })).sort((a, b) => b.score - a.score).slice(0, 3),
            }));
            toast.success('New goal created!');
        });

        socket.on('goalUpdated', (updatedGoal) => {
            setDashboardData((prev) => ({
                ...prev,
                goalsInProgress: prev.goalsInProgress.map((g) =>
                    g.title === updatedGoal.title
                        ? {
                              id: updatedGoal._id,
                              title: updatedGoal.title,
                              completion:
                                  updatedGoal.subGoals && updatedGoal.subGoals.length > 0
                                      ? (updatedGoal.subGoals.filter((sg) => sg.completed).length / updatedGoal.subGoals.length) * 100
                                      : 0,
                          }
                        : g
                ),
                recentActivities: [
                    {
                        id: updatedGoal._id,
                        user: updatedGoal.owner?.name || updatedGoal.owner?.email || 'Unknown',
                        action: `updated Goal "${updatedGoal.title}"`,
                        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                    },
                    ...prev.recentActivities.slice(0, 19),
                ],
                topPerformers: prev.topPerformers.map((user) => ({
                    ...user,
                    avgGoalCompletion: user.id === updatedGoal.owner?._id
                        ? (prev.goalsInProgress.find((g) => g.title === updatedGoal.title)?.completion || 0)
                        : user.avgGoalCompletion,
                    score: user.id === updatedGoal.owner?._id
                        ? Math.min(user.completedTasks * 10 + (prev.goalsInProgress.find((g) => g.title === updatedGoal.title)?.completion || 0) * 0.5, 100)
                        : user.score,
                })).sort((a, b) => b.score - a.score).slice(0, 3),
                goalMilestoneData: {
                    ...prev.goalMilestoneData,
                    datasets: [
                        {
                            ...prev.goalMilestoneData.datasets[0],
                            data: prev.goalMilestoneData.datasets[0].data.map((count, index) => {
                                const newCompleted = updatedGoal.subGoals
                                    ? updatedGoal.subGoals.filter((sg) => sg.completed).length
                                    : 0;
                                return index === prev.goalMilestoneData.labels.length - 1
                                    ? count + newCompleted
                                    : count;
                            }),
                        },
                    ],
                },
            }));
            toast.success('Goal updated!');
        });

        socket.on('goalDeleted', (goalId) => {
            setDashboardData((prev) => ({
                ...prev,
                goalsInProgress: prev.goalsInProgress.filter((g) => g.id !== goalId),
                recentActivities: prev.recentActivities.filter((act) => act.id !== goalId).slice(0, 20),
                topPerformers: prev.topPerformers.map((user) => ({
                    ...user,
                    avgGoalCompletion: prev.goalsInProgress.length > 1
                        ? (user.avgGoalCompletion * prev.goalsInProgress.length - (prev.goalsInProgress.find((g) => g.id === goalId)?.completion || 0)) / (prev.goalsInProgress.length - 1)
                        : 0,
                    score: prev.goalsInProgress.length > 1
                        ? Math.min(user.completedTasks * 10 + ((user.avgGoalCompletion * prev.goalsInProgress.length - (prev.goalsInProgress.find((g) => g.id === goalId)?.completion || 0)) / (prev.goalsInProgress.length - 1)) * 0.5, 100)
                        : user.completedTasks * 10,
                })).sort((a, b) => b.score - a.score).slice(0, 3),
            }));
            toast.success('Goal deleted!');
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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const storageUsedPercentage =
        (parseFloat(dashboardData.storage.totalUsed) / parseFloat(dashboardData.storage.totalQuota)) * 100;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#1F2937', font: { size: 14, weight: 'bold' } },
            },
            tooltip: {
                backgroundColor: '#1F2937',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
                borderColor: '#E5E7EB',
                borderWidth: 1,
            },
            title: {
                display: true,
                font: { size: 16, weight: 'bold' },
                color: '#1F2937',
            },
        },
        scales: {
            x: {
                ticks: { color: '#1F2937', font: { size: 12 } },
                grid: { display: false },
                maxTicksLimit: 6,
            },
            y: {
                ticks: { color: '#1F2937', font: { size: 12 } },
                grid: { color: '#E5E7EB' },
                beginAtZero: true,
            },
        },
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#1F2937', font: { size: 14, weight: 'bold' } },
            },
            tooltip: {
                backgroundColor: '#1F2937',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
                borderColor: '#E5E7EB',
                depth: 1,
            },
            title: {
                display: true,
                font: { size: 16, weight: 'bold' },
                color: '#1F2937',
            },
        },
    };

    const horizontalBarChartOptions = {
        ...chartOptions,
        indexAxis: 'y',
        scales: {
            x: {
                ticks: { color: '#1F2937', font: { size: 12 } },
                grid: { color: '#E5E7EB' },
                beginAtZero: true,
                max: 100,
                title: { display: true, text: 'Usage (%)', color: '#1F2937', font: { size: 14 } },
            },
            y: {
                ticks: { color: '#1F2937', font: { size: 12 } },
                grid: { display: false },
            },
        },
    };

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl w-full min-h-screen overflow-y-auto">
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {error && (
                        <div className="text-red-500 text-sm text-center mb-4 animate-shake">
                            {error}
                        </div>
                    )}
                    {priorityDebug && (
                        <div className="text-blue-500 text-sm text-center mb-4 animate-fade-in">
                            Debug: {priorityDebug}
                        </div>
                    )}

                    <h1 className="text-3xl font-bold text-teal-700 mb-6 animate-fade-in">
                        Admin Analytics Dashboard
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                                <div className="bg-teal-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">Total Users</h3>
                                            <p className="text-3xl font-bold">{dashboardData.totalUsers}</p>
                                        </div>
                                        <Users className="w-10 h-10 opacity-80 animate-pulse-slow" />
                                    </div>
                                </div>
                                <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.1s' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">Active Tasks</h3>
                                            <p className="text-3xl font-bold">{dashboardData.activeTasks.pending}</p>
                                            <p className="text-sm opacity-80">
                                                Completed: {dashboardData.activeTasks.completed}
                                            </p>
                                        </div>
                                        <FileText className="w-10 h-10 opacity-80 animate-pulse-slow-delayed" />
                                    </div>
                                </div>
                                <div className="bg-teal-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.2s' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">Goals in Progress</h3>
                                            <p className="text-3xl font-bold">{dashboardData.goalsInProgress.length}</p>
                                        </div>
                                        <Target className="w-10 h-10 opacity-80 animate-pulse-slow" />
                                    </div>
                                </div>
                                <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.3s' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">Storage Usage</h3>
                                            <p className="text-3xl font-bold">{dashboardData.storage.totalUsed}</p>
                                            <p className="text-sm opacity-80">of {dashboardData.storage.totalQuota}</p>
                                        </div>
                                        <HardDrive className="w-10 h-10 opacity-80 animate-pulse-slow-delayed" />
                                    </div>
                                    <div className="w-full bg-white/30 rounded-full h-2.5 mt-2">
                                        <div
                                            className="bg-white h-2.5 rounded-full transition-all duration-500"
                                            style={{ width: `${storageUsedPercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="bg-teal-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.4s' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">Avg. Task Completion</h3>
                                            <p className="text-3xl font-bold">{dashboardData.avgTaskCompletionTime.toFixed(1)} days</p>
                                        </div>
                                        <Clock className="w-10 h-10 opacity-80 animate-pulse-slow" />
                                    </div>
                                </div>
                                <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.5s' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">Task Completion Rate</h3>
                                            <p className="text-3xl font-bold">{dashboardData.taskCompletionRate.toFixed(1)}%</p>
                                        </div>
                                        <CheckCircle className="w-10 h-10 opacity-80 animate-pulse-slow-delayed" />
                                    </div>
                                </div>
                                <div className="bg-teal-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '0.6s' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">Goal Completion Rate</h3>
                                            <p className="text-3xl font-bold">{dashboardData.goalCompletionRate.toFixed(1)}%</p>
                                        </div>
                                        <Percent className="w-10 h-10 opacity-80 animate-pulse-slow" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-fade-in">
                                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                        <BarChart2 className="w-5 h-5 mr-2" />
                                        Task Completion Rates
                                    </h3>
                                    <div className="h-64">
                                        <Bar
                                            data={dashboardData.taskCompletionData}
                                            options={{
                                                ...chartOptions,
                                                plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Weekly Task Completion' } },
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                        <TrendingUp className="w-5 h-5 mr-2" />
                                        User Activity Trends
                                    </h3>
                                    <div className="h-64">
                                        <Line
                                            data={dashboardData.userActivityData}
                                            options={{
                                                ...chartOptions,
                                                plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'User Actions Over Time' } },
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                        <PieChart className="w-5 h-5 mr-2" />
                                        Goal Progress
                                    </h3>
                                    <div className="h-64 flex justify-center">
                                        <Pie
                                            data={dashboardData.goalProgressData}
                                            options={{
                                                ...pieChartOptions,
                                                plugins: { ...pieChartOptions.plugins, title: { ...pieChartOptions.plugins.title, text: 'Goal Completion Distribution' } },
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                        <Star className="w-5 h-5 mr-2" />
                                        User Productivity Scores
                                    </h3>
                                    <div className="h-64">
                                        <Bar
                                            data={dashboardData.userProductivityData}
                                            options={{
                                                ...chartOptions,
                                                plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Top 5 User Productivity' } },
                                                scales: {
                                                    ...chartOptions.scales,
                                                    x: { ...chartOptions.scales.x, ticks: { ...chartOptions.scales.x.ticks, autoSkip: false, maxRotation: 45, minRotation: 45 } },
                                                    y: { ...chartOptions.scales.y, max: 100, title: { display: true, text: 'Score', color: '#1F2937', font: { size: 14 } } },
                                                },
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                        <Layers className="w-5 h-5 mr-2" />
                                        Task Priority Distribution
                                    </h3>
                                    <div className="h-64 flex justify-center">
                                        {dashboardData.taskPriorityData.datasets[0].data.every((count) => count === 0) ? (
                                            <div className="flex items-center justify-center h-full text-gray-500">
                                                No active tasks with priority data available.
                                            </div>
                                        ) : (
                                            <Pie
                                                data={dashboardData.taskPriorityData}
                                                options={{
                                                    ...pieChartOptions,
                                                    plugins: { ...pieChartOptions.plugins, title: { ...pieChartOptions.plugins.title, text: 'Active Task Priorities' } },
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                        <TrendingUp className="w-5 h-5 mr-2" />
                                        Goal Milestone Trends
                                    </h3>
                                    <div className="h-64">
                                        <Line
                                            data={dashboardData.goalMilestoneData}
                                            options={{
                                                ...chartOptions,
                                                plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Weekly Milestone Completions' } },
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                                    <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                        <HardDrive className="w-5 h-5 mr-2" />
                                        Storage Usage by User
                                    </h3>
                                    <div className="h-64">
                                        <Bar
                                            data={dashboardData.storagePerUserData}
                                            options={{
                                                ...horizontalBarChartOptions,
                                                plugins: { ...horizontalBarChartOptions.plugins, title: { ...horizontalBarChartOptions.plugins.title, text: 'Top 5 User Storage Usage' } },
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-slide-in">
                                <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                    <Clock className="w-5 h-5 mr-2" />
                                    Recent Activity
                                </h3>
                                <ul className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-600 scrollbar-track-teal-100">
                                    {dashboardData.recentActivities.map((activity) => (
                                        <li
                                            key={activity.id}
                                            className="flex items-start space-x-3 border-l-4 border-teal-600 pl-3 animate-fade-in"
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                                                <Users className="w-4 h-4 text-teal-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-semibold text-teal-600">{activity.user}</span>{' '}
                                                    {activity.action}
                                                </p>
                                                <p className="text-xs text-gray-500">{activity.timestamp}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-slide-in" style={{ animationDelay: '0.1s' }}>
                                <h3 className="text-lg font-semibold text-teal-700 mb-4">Quick Links</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { to: '/admin/user-management', label: 'Manage Users' },
                                        { to: '/admin/task-management', label: 'Manage Tasks' },
                                        { to: '/admin/goal-management', label: 'Manage Goals' },
                                        { to: '/admin/file-management', label: 'Manage Files' },
                                        { to: '/admin/reports', label: 'View Reports' },
                                        { to: '/admin/analytics', label: 'View Analytics' },
                                    ].map((link, index) => (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            className="flex items-center justify-between px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:translate-x-2"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                            aria-label={link.label}
                                        >
                                            <span>{link.label}</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-slide-in" style={{ animationDelay: '0.2s' }}>
                                <h3 className="text-lg font-semibold text-red-700 flex items-center mb-4">
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    Overdue Tasks Alert
                                </h3>
                                {dashboardData.overdueTasks.length === 0 ? (
                                    <p className="text-sm text-gray-500">No overdue tasks at the moment.</p>
                                ) : (
                                    <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-red-100">
                                        {dashboardData.overdueTasks.map((task) => (
                                            <li key={task.id} className="flex items-start space-x-3 border-l-4 border-red-600 pl-3">
                                                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-red-600" />
                                                </div>
                                                <div>
                                                    <Link
                                                        to={`/admin/task-management/${task.id}`}
                                                        className="text-sm text-red-600 hover:underline"
                                                    >
                                                        {task.title}
                                                    </Link>
                                                    <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                                                    <p className="text-xs text-gray-500">Owner: {task.owner}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-slide-in" style={{ animationDelay: '0.3s' }}>
                                <h3 className="text-lg font-semibold text-teal-700 flex items-center mb-4">
                                    <Star className="w-5 h-5 mr-2" />
                                    Top Performers
                                </h3>
                                {dashboardData.topPerformers.length === 0 ? (
                                    <p className="text-sm text-gray-500">No performance data available.</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {dashboardData.topPerformers.map((user, index) => (
                                            <li
                                                key={user.id}
                                                className="flex items-center space-x-3 group relative"
                                            >
                                                <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-teal-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-teal-600">{user.name}</p>
                                                    <p className="text-xs text-gray-500">Score: {user.score.toFixed(1)}</p>
                                                </div>
                                                <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 -top-10 left-1/2 transform -translate-x-1/2 z-10">
                                                    Tasks Completed: {user.completedTasks}<br />
                                                    Avg. Goal Completion: {user.avgGoalCompletion.toFixed(1)}%
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-slide-in" style={{ animationDelay: '0.4s' }}>
                                <h3 className="text-lg font-semibold text-blue-700 flex items-center mb-4">
                                    <Server className="w-5 h-5 mr-2" />
                                    System Health Snapshot
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Server className="w-5 h-5 text-blue-600" />
                                            <span className="text-sm text-gray-700">API Latency</span>
                                        </div>
                                        <span className="text-sm font-semibold">{dashboardData.systemHealth.latency} ms</span>
                                    </div>
                                    <div className="w-full bg-blue-100 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{ width: `${Math.min(dashboardData.systemHealth.latency / 2, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Users className="w-5 h-5 text-blue-600" />
                                            <span className="text-sm text-gray-700">Active Sessions</span>
                                        </div>
                                        <span className="text-sm font-semibold">{dashboardData.systemHealth.activeSessions}</span>
                                    </div>
                                    <div className="w-full bg-blue-100 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{ width: `${Math.min(dashboardData.systemHealth.activeSessions / 100 * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                            <span className="text-sm text-gray-700">Uptime</span>
                                        </div>
                                        <span className="text-sm font-semibold">{dashboardData.systemHealth.uptime}%</span>
                                    </div>
                                    <div className="w-full bg-blue-100 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{ width: `${dashboardData.systemHealth.uptime}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;