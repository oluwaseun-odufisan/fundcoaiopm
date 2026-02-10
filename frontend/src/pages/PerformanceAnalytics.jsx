import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TrendingUp, PieChart, BarChart, LineChart, Filter, Clock, Download, Trophy, Calendar, ChevronUp } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);
const PerformanceAnalytics = () => {
    const { user, tasks } = useOutletContext();
    const [dateRange, setDateRange] = useState('30');
    const [customStartDate, setCustomStartDate] = useState(null);
    const [customEndDate, setCustomEndDate] = useState(null);
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [exporting, setExporting] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const scrollContainerRef = useRef(null);
    // Scroll handler for Back to Top
    useEffect(() => {
        const handleScroll = () => {
            if (scrollContainerRef.current) {
                setShowBackToTop(scrollContainerRef.current.scrollTop > 200);
            }
        };
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, []);
    // Stats
    const stats = useMemo(() => {
        const completedTasks = tasks.filter(
            (task) => task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')
        ).length;
        const totalCount = tasks.length;
        const pendingCount = totalCount - completedTasks;
        const completionPercentage = totalCount ? Math.round((completedTasks / totalCount) * 100) : 0;
        const highPriorityCompleted = tasks.filter(
            (task) =>
                (task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')) &&
                task.priority?.toLowerCase() === 'high'
        ).length;
        const productivityScore = Math.min(100, completionPercentage + highPriorityCompleted * 5);
        const overdueCount = tasks.filter((task) => task.dueDate && !task.completed && new Date(task.dueDate) < new Date()).length;
        return {
            totalCount,
            completedTasks,
            pendingCount,
            completionPercentage,
            productivityScore,
            overdueCount,
        };
    }, [tasks]);
    // Filtered tasks
    const filteredTasks = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        if (dateRange !== 'custom') {
            startDate.setDate(now.getDate() - parseInt(dateRange));
        } else if (customStartDate && customEndDate) {
            startDate = customStartDate;
        } else {
            startDate.setDate(now.getDate() - 30);
        }
        const endDate = customEndDate || now;
        return tasks.filter((task) => {
            const taskDate = task.createdAt ? new Date(task.createdAt) : new Date();
            const matchesDate = taskDate >= startDate && taskDate <= endDate;
            const matchesPriority = priorityFilter === 'all' || task.priority?.toLowerCase() === priorityFilter;
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'completed' &&
                    (task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes'))) ||
                (statusFilter === 'pending' &&
                    !(task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')));
            const matchesCategory = categoryFilter === 'all' || (task.category || 'Uncategorized') === categoryFilter;
            return matchesDate && matchesPriority && matchesStatus && matchesCategory;
        });
    }, [tasks, dateRange, customStartDate, customEndDate, priorityFilter, statusFilter, categoryFilter]);
    // Categories
    const categories = useMemo(() => {
        return ['all', ...new Set(tasks.map((task) => task.category || 'Uncategorized'))];
    }, [tasks]);
    // Completion trend
    const completionTrendData = useMemo(() => {
        const labels = [];
        const completedData = [];
        const pendingData = [];
        const days = dateRange === 'custom' && customStartDate && customEndDate ? Math.ceil((customEndDate - customStartDate) / (1000 * 60 * 60 * 24)) : parseInt(dateRange);
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const dateString = date.toLocaleDateString();
            labels.push(dateString);
            const tasksOnDate = filteredTasks.filter((task) => {
                const taskDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '';
                return taskDate === dateString;
            });
            const completed = tasksOnDate.filter(
                (task) => task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')
            ).length;
            completedData.push(completed);
            pendingData.push(tasksOnDate.length - completed);
        }
        return {
            labels,
            datasets: [
                { label: 'Completed', data: completedData, borderColor: '#14B8A6', backgroundColor: 'rgba(20, 184, 166, 0.2)', fill: true },
                { label: 'Pending', data: pendingData, borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true },
            ],
        };
    }, [filteredTasks, dateRange, customStartDate, customEndDate]);
    // Priority breakdown
    const priorityBreakdownData = useMemo(() => {
        const priorities = ['high', 'medium', 'low'];
        const counts = priorities.map((priority) => filteredTasks.filter((task) => task.priority?.toLowerCase() === priority).length);
        return {
            labels: ['High', 'Medium', 'Low'],
            datasets: [
                {
                    data: counts,
                    backgroundColor: ['#EF4444', '#FBBF24', '#14B8A6'],
                    borderColor: ['#DC2626', '#D97706', '#0D9488'],
                    borderWidth: 1,
                },
            ],
        };
    }, [filteredTasks]);
    // Status breakdown
    const statusBreakdownData = useMemo(() => {
        const completed = filteredTasks.filter(
            (task) => task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')
        ).length;
        const pending = filteredTasks.length - completed;
        return {
            labels: ['Completed', 'Pending'],
            datasets: [
                {
                    data: [completed, pending],
                    backgroundColor: ['#14B8A6', '#3B82F6'],
                    borderColor: ['#0D9488', '#2563EB'],
                    borderWidth: 1,
                },
            ],
        };
    }, [filteredTasks]);
    // Category breakdown
    const categoryBreakdownData = useMemo(() => {
        const counts = categories.slice(1).map((category) => filteredTasks.filter((task) => (task.category || 'Uncategorized') === category).length);
        return {
            labels: categories.slice(1),
            datasets: [
                {
                    data: counts,
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'],
                    borderColor: ['#059669', '#D97706', '#DC2626', '#2563EB', '#7C3AED'],
                    borderWidth: 1,
                },
            ],
        };
    }, [filteredTasks, categories]);
    // Activity heatmap
    const dailyActivityData = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = days.map(() => Array(24).fill(0));
        filteredTasks.forEach((task) => {
            const date = task.createdAt ? new Date(task.createdAt) : new Date();
            const day = date.getDay();
            const hour = date.getHours();
            data[day][hour]++;
        });
        return { days, hours, data };
    }, [filteredTasks]);
    // Task velocity
    const taskVelocityData = useMemo(() => {
        const labels = [];
        const createdData = [];
        const completedData = [];
        const days = dateRange === 'custom' && customStartDate && customEndDate ? Math.ceil((customEndDate - customStartDate) / (1000 * 60 * 60 * 24)) : parseInt(dateRange);
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const dateString = date.toLocaleDateString();
            labels.push(dateString);
            const tasksOnDate = filteredTasks.filter((task) => {
                const taskDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '';
                return taskDate === dateString;
            });
            const completed = tasksOnDate.filter(
                (task) => task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')
            ).length;
            createdData.push(tasksOnDate.length);
            completedData.push(completed);
        }
        return {
            labels,
            datasets: [
                { label: 'Created', data: createdData, borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true },
                { label: 'Completed', data: completedData, borderColor: '#14B8A6', backgroundColor: 'rgba(20, 184, 166, 0.2)', fill: true },
            ],
        };
    }, [filteredTasks, dateRange, customStartDate, customEndDate]);
    // Category effort
    const categoryEffortData = useMemo(() => {
        const effortMap = { high: 4, medium: 2, low: 1 };
        const counts = categories.slice(1).map((category) =>
            filteredTasks
                .filter((task) => (task.category || 'Uncategorized') === category)
                .reduce((acc, task) => acc + (effortMap[task.priority?.toLowerCase()] || 1), 0)
        );
        return {
            labels: categories.slice(1),
            datasets: [
                {
                    data: counts,
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'],
                    borderColor: ['#059669', '#D97706', '#DC2626', '#2563EB', '#7C3AED'],
                    borderWidth: 1,
                },
            ],
        };
    }, [filteredTasks, categories]);
    // Completion time by priority
    const priorityCompletionTimeData = useMemo(() => {
        const priorities = ['high', 'medium', 'low'];
        const times = priorities.map((priority) => {
            const tasksByPriority = filteredTasks.filter((task) => task.priority?.toLowerCase() === priority && task.completed && task.createdAt && task.dueDate);
            const totalTime = tasksByPriority.reduce((acc, task) => {
                const created = new Date(task.createdAt);
                const completed = new Date(task.dueDate);
                return acc + (completed - created) / (1000 * 60 * 60 * 24);
            }, 0);
            return tasksByPriority.length ? totalTime / tasksByPriority.length : 0;
        });
        return {
            labels: ['High', 'Medium', 'Low'],
            datasets: [
                {
                    data: times,
                    backgroundColor: ['#EF4444', '#FBBF24', '#14B8A6'],
                    borderColor: ['#DC2626', '#D97706', '#0D9488'],
                    borderWidth: 1,
                },
            ],
        };
    }, [filteredTasks]);
    // Weekly productivity
    const weeklyProductivityData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const counts = days.map((_, i) =>
            filteredTasks.filter(
                (task) =>
                    task.createdAt &&
                    new Date(task.createdAt).getDay() === i &&
                    (task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes'))
            ).length
        );
        return {
            labels: days,
            datasets: [
                {
                    label: 'Completed Tasks',
                    data: counts,
                    backgroundColor: '#3B82F6',
                    borderColor: '#2563EB',
                    borderWidth: 1,
                },
            ],
        };
    }, [filteredTasks]);
    // Insights and badges
    const { insights, badges } = useMemo(() => {
        const highPriorityCount = filteredTasks.filter((task) => task.priority?.toLowerCase() === 'high').length;
        const pendingCount = filteredTasks.filter(
            (task) => !(task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes'))
        ).length;
        const overdueCount = filteredTasks.filter((task) => task.dueDate && !task.completed && new Date(task.dueDate) < new Date()).length;
        const peakHours = dailyActivityData.hours.reduce(
            (acc, _, i) => {
                const total = dailyActivityData.data.reduce((sum, row) => sum + row[i], 0);
                return total > acc.count ? { hour: i, count: total } : acc;
            },
            { hour: 0, count: 0 }
        );
        const insights = [];
        const badges = [];
        if (highPriorityCount > 5) insights.push('Many high-priority tasks. Focus on these first.');
        if (pendingCount > 10) insights.push('Pending tasks piling up. Try time-blocking.');
        if (overdueCount > 3) insights.push('Overdue tasks detected. Address them soon.');
        if (stats.completionPercentage > 80) {
            insights.push('Great completion rate! Keep it up.');
            badges.push({ name: 'Productivity Pro', icon: Trophy, color: 'text-amber-500 dark:text-amber-400' });
        }
        if (stats.productivityScore > 90) badges.push({ name: 'Task Master', icon: Trophy, color: 'text-purple-500 dark:text-purple-400' });
        if (peakHours.count > 5) insights.push(`Most active at ${peakHours.hour}:00. Schedule key tasks then.`);
        if (!insights.length) insights.push('Solid progress! Stay organized.');
        return { insights, badges };
    }, [filteredTasks, stats, dailyActivityData]);
    // Reset filters
    const resetFilters = () => {
        setDateRange('30');
        setCustomStartDate(null);
        setCustomEndDate(null);
        setPriorityFilter('all');
        setStatusFilter('all');
        setCategoryFilter('all');
    };
    // Export to CSV
    const exportToCSV = async () => {
        try {
            setExporting(true);
            const headers = ['ID', 'Title', 'Priority', 'Status', 'Category', 'Created At', 'Due Date', 'Completed'];
            const rows = filteredTasks.map((task) => [
                task._id || '',
                task.title || 'Untitled',
                task.priority || 'None',
                (task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')) ? 'Completed' : 'Pending',
                task.category || 'Uncategorized',
                task.createdAt && !isNaN(new Date(task.createdAt)) ? new Date(task.createdAt).toLocaleString() : 'N/A',
                task.dueDate && !isNaN(new Date(task.dueDate)) ? new Date(task.dueDate).toLocaleString() : 'N/A',
                (task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')) ? 'Yes' : 'No',
            ]);
            const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `analytics_${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Clean up
        } catch (error) {
            console.error('Failed to export CSV:', error);
            alert('Failed to export CSV. Please try again or check the console for details.');
        } finally {
            setExporting(false);
        }
    };
    // Export to PDF
    const exportToPDF = async () => {
        try {
            setExporting(true);
            const dashboard = document.getElementById('dashboard');
            if (!dashboard) {
                throw new Error('Dashboard element not found');
            }
            const canvas = await html2canvas(dashboard, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#fff',
                scrollX: 0,
                scrollY: -window.scrollY, // Adjust for scroll position
            });
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 190;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 10;
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
            }
            pdf.save(`analytics_${new Date().toISOString()}.pdf`);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Failed to export PDF. Please try again or check the console for details.');
        } finally {
            setExporting(false);
        }
    };
    // Scroll to top
    const scrollToTop = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-100 to-blue-100 dark:from-gray-900 dark:to-blue-900 flex flex-col font-sans">
            {/* Title Section */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="sticky top-0 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-md flex items-center justify-between px-6 py-4 h-16"
            >
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 dark:bg-teal-700 text-white rounded-md hover:bg-teal-700 dark:hover:bg-teal-600 disabled:opacity-50 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400"
                        aria-label="Export to CSV"
                    >
                        <Download className="w-4 h-4" /> CSV
                    </button>
                    <button
                        onClick={exportToPDF}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        aria-label="Export to PDF"
                    >
                        <Download className="w-4 h-4" /> PDF
                    </button>
                </div>
            </motion.div>
            {/* Scrollable Content */}
            <div ref={scrollContainerRef} className="flex-1 scrollbar-thin scrollbar-teal-600 dark:scrollbar-teal-400 scrollbar-track-teal-100 dark:scrollbar-track-gray-800 scrollbar-rounded px-6 py-6" id="dashboard">
                {/* Filter Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-4 mb-6 sticky top-16 z-10 shadow-md"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 min-w-[120px] text-gray-900 dark:text-gray-100"
                            aria-label="Date range"
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                            <option value="custom">Custom</option>
                        </select>
                        <AnimatePresence>
                            {dateRange === 'custom' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="col-span-1 sm:col-span-2 flex gap-4"
                                >
                                    <DatePicker
                                        selected={customStartDate}
                                        onChange={(date) => setCustomStartDate(date)}
                                        selectsStart
                                        startDate={customStartDate}
                                        endDate={customEndDate}
                                        placeholderText="Start Date"
                                        className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 min-w-[120px] text-gray-900 dark:text-gray-100"
                                        aria-label="Start date"
                                    />
                                    <DatePicker
                                        selected={customEndDate}
                                        onChange={(date) => setCustomEndDate(date)}
                                        selectsEnd
                                        startDate={customStartDate}
                                        endDate={customEndDate}
                                        minDate={customStartDate}
                                        placeholderText="End Date"
                                        className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 min-w-[120px] text-gray-900 dark:text-gray-100"
                                        aria-label="End date"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 min-w-[120px] text-gray-900 dark:text-gray-100"
                            aria-label="Priority"
                        >
                            <option value="all">All Priorities</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 min-w-[120px] text-gray-900 dark:text-gray-100"
                            aria-label="Status"
                        >
                            <option value="all">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                        </select>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 min-w-[120px] text-gray-900 dark:text-gray-100"
                            aria-label="Category"
                        >
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 text-sm bg-amber-600 dark:bg-amber-700 text-white rounded-md hover:bg-amber-700 dark:hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                            aria-label="Reset filters"
                        >
                            Reset Filters
                        </button>
                    </div>
                </motion.div>
                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
                >
                    {[
                        { label: 'Total Tasks', value: stats.totalCount, icon: PieChart, color: 'teal-600 dark:teal-400' },
                        { label: 'Completed', value: stats.completedTasks, icon: PieChart, color: 'blue-600 dark:blue-400' },
                        { label: 'Pending', value: stats.pendingCount, icon: PieChart, color: 'amber-600 dark:amber-400' },
                        { label: 'Overdue', value: stats.overdueCount, icon: Clock, color: 'red-600 dark:red-400' },
                        { label: 'Completion', value: `${stats.completionPercentage}%`, icon: Trophy, color: 'purple-600 dark:purple-400' },
                        { label: 'Productivity', value: `${stats.productivityScore}%`, icon: TrendingUp, color: 'green-600 dark:green-400' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div
                            key={label}
                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-4 shadow-md hover:scale-105 transition-transform duration-300"
                        >
                            <div className="flex items-center gap-2">
                                <Icon className={`w-5 h-5 text-${color}`} />
                                <div>
                                    <p className={`text-sm font-semibold text-${color}`}>{value}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
                {/* Visual Insights Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mb-6"
                >
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 sticky top-16 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md py-2 z-10 mb-4">
                        <BarChart className="w-6 h-6 text-teal-600 dark:text-teal-400" /> Visual Insights
                    </h2>
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-6 shadow-md overflow-y-auto scrollbar-thin scrollbar-teal-600 dark:scrollbar-teal-400 scrollbar-track-teal-100 dark:scrollbar-track-gray-800 max-h-[70vh]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                {
                                    title: 'Completion Trend',
                                    Component: Line,
                                    data: completionTrendData,
                                    options: {
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'top', labels: { font: { size: 12 } } }, title: { display: false } },
                                        scales: { x: { ticks: { font: { size: 12 } } }, y: { beginAtZero: true, ticks: { font: { size: 12 } } } },
                                    },
                                    icon: LineChart,
                                    color: 'teal-600 dark:teal-400',
                                },
                                {
                                    title: 'Priority Breakdown',
                                    Component: Doughnut,
                                    data: priorityBreakdownData,
                                    options: {
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'right', labels: { font: { size: 12 } } }, title: { display: false } },
                                    },
                                    icon: PieChart,
                                    color: 'blue-600 dark:blue-400',
                                },
                                {
                                    title: 'Status Breakdown',
                                    Component: Bar,
                                    data: statusBreakdownData,
                                    options: {
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false }, title: { display: false } },
                                        scales: { x: { ticks: { font: { size: 12 } } }, y: { beginAtZero: true, ticks: { font: { size: 12 } } } },
                                    },
                                    icon: BarChart,
                                    color: 'amber-600 dark:amber-400',
                                },
                                {
                                    title: 'Category Breakdown',
                                    Component: Pie,
                                    data: categoryBreakdownData,
                                    options: {
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'right', labels: { font: { size: 12 } } }, title: { display: false } },
                                    },
                                    icon: PieChart,
                                    color: 'purple-600 dark:purple-400',
                                },
                                {
                                    title: 'Task Velocity',
                                    Component: Line,
                                    data: taskVelocityData,
                                    options: {
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'top', labels: { font: { size: 12 } } }, title: { display: false } },
                                        scales: { x: { ticks: { font: { size: 12 } } }, y: { beginAtZero: true, ticks: { font: { size: 12 } } } },
                                    },
                                    icon: LineChart,
                                    color: 'cyan-600 dark:cyan-400',
                                },
                                {
                                    title: 'Category Effort',
                                    Component: Pie,
                                    data: categoryEffortData,
                                    options: {
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'right', labels: { font: { size: 12 } } }, title: { display: false } },
                                    },
                                    icon: PieChart,
                                    color: 'green-600 dark:green-400',
                                },
                                {
                                    title: 'Priority Time',
                                    Component: Bar,
                                    data: priorityCompletionTimeData,
                                    options: {
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false }, title: { display: false } },
                                        scales: { x: { ticks: { font: { size: 12 } } }, y: { beginAtZero: true, ticks: { font: { size: 12 } } } },
                                    },
                                    icon: BarChart,
                                    color: 'red-600 dark:red-400',
                                },
                                {
                                    title: 'Weekly Productivity',
                                    Component: Bar,
                                    data: weeklyProductivityData,
                                    options: {
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false }, title: { display: false } },
                                        scales: { x: { ticks: { font: { size: 12 } } }, y: { beginAtZero: true, ticks: { font: { size: 12 } } } },
                                    },
                                    icon: BarChart,
                                    color: 'orange-600 dark:orange-400',
                                },
                                {
                                    title: 'Activity Heatmap',
                                    Component: () => (
                                        <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-1 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-x-auto">
                                            <div className="h-6" />
                                            {dailyActivityData.hours.map((hour) => (
                                                <div key={`hour-${hour}`} className="text-xs text-gray-600 dark:text-gray-400 text-center h-6">
                                                    {hour}
                                                </div>
                                            ))}
                                            {dailyActivityData.days.map((day, dayIdx) => (
                                                <React.Fragment key={`day-${dayIdx}`}>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400 h-6 flex items-center pl-2">{day}</div>
                                                    {dailyActivityData.data[dayIdx].map((count, hourIdx) => (
                                                        <div
                                                            key={`cell-${dayIdx}-${hourIdx}`}
                                                            className={`h-6 w-full bg-teal-50 dark:bg-teal-900/30 ${count > 0 ? `bg-opacity-${Math.min(count * 20, 100)} dark:bg-opacity-${Math.min(count * 20, 100)}` : ''} relative group`}
                                                            aria-label={`${count} tasks on ${day} at ${dailyActivityData.hours[hourIdx]}`}
                                                        >
                                                            {count > 0 && (
                                                                <div className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-200 text-xs p-1 rounded z-10 top-full left-1/2 -translate-x-1/2 mt-2">
                                                                    {count} tasks
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    ),
                                    options: {},
                                    icon: Calendar,
                                    color: 'teal-600 dark:teal-400',
                                },
                            ].map(({ title, Component, data, options, icon: Icon, color }, idx) => (
                                <div key={`chart-${idx}`} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md h-[300px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
                                        <Icon className={`w-5 h-5 text-${color}`} />
                                        {title}
                                    </h3>
                                    <div className="h-[260px]">
                                        {typeof Component === 'function' && !data ? <Component /> : <Component data={data} options={options} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
                {/* Insights & Badges Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6"
                >
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-4 shadow-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
                            <Clock className="w-6 h-6 text-teal-600 dark:text-teal-400" /> Insights
                        </h3>
                        <ul className="space-y-2">
                            {insights.map((insight, idx) => (
                                <li key={`insight-${idx}`} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="w-2 h-2 bg-teal-600 dark:bg-teal-400 rounded-full mt-2" />
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-4 shadow-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
                            <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" /> Achievements
                        </h3>
                        {badges.length ? (
                            <div className="grid grid-cols-2 gap-2">
                                {badges.map(({ name, icon: Icon, color }, idx) => (
                                    <div key={`badge-${idx}`} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-md text-sm">
                                        <Icon className={`w-5 h-5 ${color}`} />
                                        <span className="text-gray-800 dark:text-gray-200">{name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-700 dark:text-gray-300">No badges yet!</p>
                        )}
                    </div>
                </motion.div>
                {/* Timeline Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-4 shadow-md mb-6"
                >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2 sticky top-16 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md z-10">
                        <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Task History
                    </h3>
                    <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-teal-600 dark:scrollbar-teal-400 scrollbar-track-teal-100 dark:scrollbar-track-gray-800">
                        {filteredTasks.length ? (
                            <div className="relative pl-4">
                                <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
                                {filteredTasks.slice(0, 5).map((task, idx) => (
                                    <motion.div
                                        key={task._id || `task-${idx}`}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="relative mb-3"
                                    >
                                        <div className="absolute left-[-6px] top-2 w-3 h-3 bg-teal-600 dark:bg-teal-400 rounded-full border-2 border-white dark:border-gray-800" />
                                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{task.title || 'Untitled'}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'} • {task.priority || 'None'} • {task.completed ? 'Done' : 'Pending'}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-700 dark:text-gray-300 text-center">No tasks found.</p>
                        )}
                    </div>
                </motion.div>
                {/* Back to Top */}
                <AnimatePresence>
                    {showBackToTop && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            onClick={scrollToTop}
                            className="fixed bottom-6 right-6 p-3 bg-teal-600 dark:bg-teal-700 text-white rounded-full shadow-md hover:bg-teal-700 dark:hover:bg-teal-600 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400"
                            aria-label="Back to top"
                        >
                            <ChevronUp className="w-6 h-6" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
export default PerformanceAnalytics;