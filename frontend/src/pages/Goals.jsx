import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Target, X, Plus, Edit, Trash, CheckCircle, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import moment from 'moment-timezone';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// 60-30-10 Palette (No Gradients)
const COLORS = {
  primary: '#1E40AF',    // Blue - 60%
  secondary: '#16A34A',  // Green - 30%
  danger: '#DC2626',     // Red
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    500: '#6B7280',
    700: '#374151',
    900: '#111827',
    border: '#E5E7EB'
  }
};
const Goals = () => {
  const { user, onLogout } = useOutletContext();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showGoalDetails, setShowGoalDetails] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [filterBy, setFilterBy] = useState('all'); // all, completed, active, personal, task
  const [newGoal, setNewGoal] = useState({
    title: '',
    subGoals: [],
    type: 'personal',
    timeframe: 'daily',
    startDate: new Date(),
    endDate: new Date(),
  });
  const [editGoal, setEditGoal] = useState(null);
  const [newSubGoal, setNewSubGoal] = useState('');
  const modalRef = useRef(null);
  // Socket.IO for real-time updates
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
    });
    socket.on('newGoal', (goal) => {
      if (!goal?._id) return;
      setGoals((prev) => {
        if (prev.some((g) => g._id === goal._id)) return prev;
        return [goal, ...prev];
      });
      toast.success('Goal created in real-time!', { style: { background: COLORS.secondary, color: '#FFFFFF' } });
    });
    socket.on('goalUpdated', (goal) => {
      if (!goal?._id) return;
      setGoals((prev) => prev.map((g) => (g._id === goal._id ? goal : g)));
      toast.success('Goal updated in real-time!', { style: { background: COLORS.secondary, color: '#FFFFFF' } });
    });
    socket.on('goalDeleted', (goalId) => {
      if (!goalId) return;
      setGoals((prev) => prev.filter((g) => g._id !== goalId));
      toast.success('Goal deleted in real-time!', { style: { background: COLORS.secondary, color: '#FFFFFF' } });
    });
    socket.on('connect_error', (error) => {
      console.error('Socket connect error:', error.message);
      toast.error('Real-time updates unavailable.', { style: { background: COLORS.danger, color: '#FFFFFF' } });
    });
    return () => {
      socket.off('newGoal');
      socket.off('goalUpdated');
      socket.off('goalDeleted');
      socket.disconnect();
    };
  }, []);
  // Axios interceptor for 401 handling
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in.', { style: { background: COLORS.danger, color: '#FFFFFF' } });
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
  // Modal focus trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && (showCreateGoal || showGoalDetails || showDeleteConfirm)) {
        setShowCreateGoal(false);
        setShowGoalDetails(false);
        setIsEditing(false);
        setShowDeleteConfirm(false);
      }
    };
    if (showCreateGoal || showGoalDetails || showDeleteConfirm) {
      modalRef.current?.focus();
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateGoal, showGoalDetails, showDeleteConfirm]);
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token');
    return { Authorization: `Bearer ${token}` };
  }, []);
  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/goals`, { headers: getAuthHeaders() });
      if (!Array.isArray(response.data.goals)) throw new Error('Invalid goals data');
      setGoals(response.data.goals);
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to fetch goals.', {
          style: { background: COLORS.danger, color: '#FFFFFF' },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);
  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tasks/gp`, { headers: getAuthHeaders() });
      if (!Array.isArray(response.data.tasks)) throw new Error('Invalid tasks data');
      setTasks(response.data.tasks);
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to fetch tasks.', {
          style: { background: COLORS.danger, color: '#FFFFFF' },
        });
      }
    }
  }, [getAuthHeaders]);
  useEffect(() => {
    if (!user || !localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    fetchGoals();
    fetchTasks();
  }, [user, navigate, fetchGoals, fetchTasks]);
  const handleCreateGoal = useCallback(async () => {
    if (!newGoal.title.trim()) {
      toast.error('Goal title is required.', { style: { background: COLORS.danger, color: '#FFFFFF' } });
      return;
    }
    if (newGoal.subGoals.length === 0) {
      toast.error('At least one sub-goal is required.', { style: { background: COLORS.danger, color: '#FFFFFF' } });
      return;
    }
    if (newGoal.startDate >= newGoal.endDate) {
      toast.error('End date must be after start date.', { style: { background: COLORS.danger, color: '#FFFFFF' } });
      return;
    }
    try {
      setIsLoading(true);
      await axios.post(`${API_BASE_URL}/api/goals`, newGoal, { headers: getAuthHeaders() });
      setShowCreateGoal(false);
      setNewGoal({
        title: '',
        subGoals: [],
        type: 'personal',
        timeframe: 'daily',
        startDate: new Date(),
        endDate: new Date(),
      });
      setNewSubGoal('');
      toast.success('Goal created!', { style: { background: COLORS.secondary, color: '#FFFFFF' } });
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to create goal.', {
          style: { background: COLORS.danger, color: '#FFFFFF' },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [newGoal, getAuthHeaders]);
  const handleUpdateGoal = useCallback(async () => {
    if (!editGoal.title.trim()) {
      toast.error('Goal title is required.', { style: { background: COLORS.danger, color: '#FFFFFF' } });
      return;
    }
    if (editGoal.subGoals.length === 0) {
      toast.error('At least one sub-goal is required.', { style: { background: COLORS.danger, color: '#FFFFFF' } });
      return;
    }
    if (editGoal.startDate >= editGoal.endDate) {
      toast.error('End date must be after start date.', { style: { background: COLORS.danger, color: '#FFFFFF' } });
      return;
    }
    try {
      setIsLoading(true);
      await axios.put(`${API_BASE_URL}/api/goals/${selectedGoal._id}`, editGoal, { headers: getAuthHeaders() });
      setShowGoalDetails(false);
      setIsEditing(false);
      toast.success('Goal updated!', { style: { background: COLORS.secondary, color: '#FFFFFF' } });
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to update goal.', {
          style: { background: COLORS.danger, color: '#FFFFFF' },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [editGoal, selectedGoal, getAuthHeaders]);
  const handleDeleteGoal = useCallback(async () => {
    setShowDeleteConfirm(false);
    try {
      setIsLoading(true);
      await axios.delete(`${API_BASE_URL}/api/goals/${selectedGoal._id}`, { headers: getAuthHeaders() });
      setShowGoalDetails(false);
      toast.success('Goal deleted!', { style: { background: COLORS.secondary, color: '#FFFFFF' } });
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to delete goal.', {
          style: { background: COLORS.danger, color: '#FFFFFF' },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedGoal, getAuthHeaders]);
  const handleGoalClick = useCallback((goal) => {
    if (!goal?._id) return;
    setSelectedGoal(goal);
    setEditGoal({ ...goal, startDate: new Date(goal.startDate), endDate: new Date(goal.endDate) });
    setShowGoalDetails(true);
  }, []);
  const handleAddSubGoal = () => {
    if (!newSubGoal.trim()) {
      toast.error('Sub-goal title is required.', { style: { background: COLORS.danger, color: '#FFFFFF' } });
      return;
    }
    setNewGoal((prev) => ({
      ...prev,
      subGoals: [...prev.subGoals, { title: newSubGoal, completed: false, taskId: null }],
    }));
    setNewSubGoal('');
  };
  const handleUpdateSubGoalStatus = async (subGoalIndex, completed) => {
    const updatedSubGoals = [...editGoal.subGoals];
    updatedSubGoals[subGoalIndex].completed = completed;
    setEditGoal((prev) => ({ ...prev, subGoals: updatedSubGoals }));
  };
  const calculateProgress = (subGoals) => {
    if (!subGoals || subGoals.length === 0) return 0;
    const completed = subGoals.filter((sg) => sg.completed).length;
    return Math.round((completed / subGoals.length) * 100);
  };
  const setDefaultDates = (timeframe) => {
    const startDate = new Date();
    let endDate = new Date();
    switch (timeframe) {
      case 'daily':
        endDate.setDate(startDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(startDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(startDate.getMonth() + 3);
        break;
      default:
        endDate.setDate(startDate.getDate() + 1);
        break;
    }
    setNewGoal((prev) => ({ ...prev, startDate, endDate }));
  };
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 100);
  }, []);
  // Filter & Sort
  const filteredGoals = goals
    .filter((goal) => {
      const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase());
      const progress = calculateProgress(goal.subGoals);
      if (filterBy === 'all') return matchesSearch;
      if (filterBy === 'completed') return matchesSearch && progress === 100;
      if (filterBy === 'active') return matchesSearch && progress < 100;
      if (filterBy === 'personal') return matchesSearch && goal.type === 'personal';
      if (filterBy === 'task') return matchesSearch && goal.type === 'task';
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'completion-asc') {
        return calculateProgress(a.subGoals) - calculateProgress(b.subGoals);
      } else if (sortBy === 'completion-desc') {
        return calculateProgress(b.subGoals) - calculateProgress(a.subGoals);
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  // Stats
  const stats = {
    total: goals.length,
    completed: goals.filter(g => calculateProgress(g.subGoals) === 100).length,
    avgProgress: Math.round(goals.reduce((sum, g) => sum + calculateProgress(g.subGoals), 0) / (goals.length || 1)),
    active: goals.filter(g => calculateProgress(g.subGoals) < 100).length,
  };
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };
  if (!user || !localStorage.getItem('token')) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"
      >
        <p className="text-base text-gray-600 dark:text-gray-400">Please log in to access your goals.</p>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans"
    >
      <Toaster position="bottom-right" toastOptions={{ className: 'text-base max-w-md' }} />
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-8 py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8"
        >
          <header className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 -mx-6 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">Your Goals</h1>
                <p className="text-base text-blue-600 dark:text-blue-400 truncate">Track & Achieve</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-all duration-300 text-base"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
              Dashboard
            </motion.button>
          </header>
          {/* Interactive Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Goals', value: stats.total, filter: 'all', color: 'gray' },
              { label: 'Completed', value: stats.completed, filter: 'completed', color: 'green' },
              { label: 'Avg Progress', value: `${stats.avgProgress}%`, filter: null, color: 'blue' },
              { label: 'Active', value: stats.active, filter: 'active', color: 'amber' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => stat.filter && setFilterBy(stat.filter === filterBy ? 'all' : stat.filter)}
                className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                  ${filterBy === stat.filter ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-lg scale-105' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'}
                `}
              >
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color === 'green' ? 'text-green-600 dark:text-green-400' : stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {stat.value}
                </p>
                {stat.filter && (
                  <motion.div
                    className="mt-2 flex items-center justify-end"
                    initial={false}
                    animate={{ opacity: filterBy === stat.filter ? 1 : 0 }}
                  >
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
          <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowCreateGoal(true);
                setDefaultDates('daily');
              }}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 flex items-center gap-3 text-base"
              aria-label="Create Goal"
            >
              <Plus className="w-6 h-6" />
              New Goal
            </motion.button>
            <div className="flex-1 flex items-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 w-full sm:w-auto relative">
              <Search className="w-6 h-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search goals..."
                className="w-full bg-transparent text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-0 transition-all duration-300"
              />
              {isSearching && (
                <motion.div
                  className="absolute right-3 w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 w-full sm:w-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="date">Recent First</option>
              <option value="completion-asc">Progress: Low to High</option>
              <option value="completion-desc">Progress: High to Low</option>
            </select>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">All Goals</h2>
            {isLoading || isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredGoals.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-base">No goals found. Create your first goal!</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredGoals.map((goal, index) => (
                  <motion.div
                    key={goal._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-700 rounded-2xl shadow-sm p-6 flex items-center gap-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/50 transition-all duration-300 cursor-pointer"
                    onClick={() => handleGoalClick(goal)}
                  >
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {calculateProgress(goal.subGoals)}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{goal.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {moment(goal.startDate).tz('Africa/Lagos').format('MMM D')} - {moment(goal.endDate).tz('Africa/Lagos').format('MMM D, YYYY')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{goal.type}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                        <motion.div
                          className="bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800 h-2.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${calculateProgress(goal.subGoals)}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-right">{calculateProgress(goal.subGoals)}%</p>
                      {calculateProgress(goal.subGoals) === 100 && (
                        <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-1 text-right">Done!</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
      {/* Create Goal Modal */}
      <AnimatePresence>
        {showCreateGoal && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            role="dialog"
            aria-label="Create Goal"
            ref={modalRef}
            tabIndex={-1}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 truncate">Create New Goal</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateGoal(false)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full transition-all duration-300"
                  aria-label="Close Create Goal"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-base font-semibold text-gray-900 dark:text-gray-100">Goal Title</label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter goal title"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-base font-semibold text-gray-900 dark:text-gray-100">Sub-Goals</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newSubGoal}
                      onChange={(e) => setNewSubGoal(e.target.value)}
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Enter sub-goal"
                      maxLength={200}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddSubGoal}
                      className="p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-md"
                      aria-label="Add Sub-Goal"
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {newGoal.subGoals.map((subGoal, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg"
                      >
                        <p className="text-base text-gray-900 dark:text-gray-100 flex-1 truncate">{subGoal.title}</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            setNewGoal((prev) => ({
                              ...prev,
                              subGoals: prev.subGoals.filter((_, i) => i !== index),
                            }))
                          }
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full transition-all duration-300"
                          aria-label="Remove Sub-Goal"
                        >
                          <X className="w-5 h-5" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-base font-semibold text-gray-900 dark:text-gray-100">Goal Type</label>
                  <select
                    value={newGoal.type}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="personal">Personal</option>
                    <option value="task">Task</option>
                  </select>
                </div>
                {newGoal.type === 'task' && (
                  <div>
                    <label className="text-base font-semibold text-gray-900 dark:text-gray-100">Attach Task to Sub-Goals</label>
                    {newGoal.subGoals.map((subGoal, index) => (
                      <div key={index} className="flex items-center gap-3 mb-3">
                        <p className="text-base text-gray-900 dark:text-gray-100 flex-1 truncate">{subGoal.title}</p>
                        <select
                          value={subGoal.taskId || ''}
                          onChange={(e) => {
                            const updatedSubGoals = [...newGoal.subGoals];
                            updatedSubGoals[index].taskId = e.target.value || null;
                            setNewGoal((prev) => ({ ...prev, subGoals: updatedSubGoals }));
                          }}
                          className="w-full sm:w-1/2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">No Task</option>
                          {tasks.map((task) => (
                            <option key={task._id} value={task._id}>
                              {task.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <label className="text-base font-semibold text-gray-900 dark:text-gray-100">Timeframe</label>
                  <select
                    value={newGoal.timeframe}
                    onChange={(e) => {
                      setNewGoal((prev) => ({ ...prev, timeframe: e.target.value }));
                      setDefaultDates(e.target.value);
                    }}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-base font-semibold text-gray-900 dark:text-gray-100">Start Date</label>
                  <DatePicker
                    selected={newGoal.startDate}
                    onChange={(date) => setNewGoal((prev) => ({ ...prev, startDate: date }))}
                    dateFormat="MMM d, yyyy"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    wrapperClassName="w-full"
                    minDate={new Date()}
                  />
                </div>
                <div>
                  <label className="text-base font-semibold text-gray-900 dark:text-gray-100">End Date</label>
                  <DatePicker
                    selected={newGoal.endDate}
                    onChange={(date) => setNewGoal((prev) => ({ ...prev, endDate: date }))}
                    dateFormat="MMM d, yyyy"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    wrapperClassName="w-full"
                    minDate={newGoal.startDate}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateGoal(false)}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-base font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                  aria-label="Cancel"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateGoal}
                  className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg text-base font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-md"
                  aria-label="Create Goal"
                >
                  Create Goal
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Goal Details Modal */}
      <AnimatePresence>
        {showGoalDetails && selectedGoal && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            role="dialog"
            aria-label="Goal Details"
            ref={modalRef}
            tabIndex={-1}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {isEditing ? 'Edit Goal' : 'Goal Details'}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowGoalDetails(false);
                    setIsEditing(false);
                  }}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full transition-all duration-300"
                  aria-label="Close Goal Details"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
              <div className="space-y-6 flex-1 overflow-y-auto">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-base font-semibold text-gray-900 dark:text-gray-100">Goal Title</label>
                      <input
                        type="text"
                        value={editGoal.title}
                        onChange={(e) => setEditGoal((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Enter goal title"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="text-base font-semibold text-gray-900 dark:text-gray-100">Sub-Goals</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newSubGoal}
                          onChange={(e) => setNewSubGoal(e.target.value)}
                          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="Enter sub-goal"
                          maxLength={200}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (!newSubGoal.trim()) {
                              toast.error('Sub-goal title is required.', { style: { background: COLORS.danger, color: '#FFFFFF' } });
                              return;
                            }
                            setEditGoal((prev) => ({
                              ...prev,
                              subGoals: [...prev.subGoals, { title: newSubGoal, completed: false, taskId: null }],
                            }));
                            setNewSubGoal('');
                          }}
                          className="p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-md"
                          aria-label="Add Sub-Goal"
                        >
                          <Plus className="w-5 h-5" />
                        </motion.button>
                      </div>
                      <div className="mt-3 space-y-2">
                        {editGoal.subGoals.map((subGoal, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg"
                          >
                            <p className="text-base text-gray-900 dark:text-gray-100 flex-1 truncate">{subGoal.title}</p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                setEditGoal((prev) => ({
                                  ...prev,
                                  subGoals: prev.subGoals.filter((_, i) => i !== index),
                                }))
                              }
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full transition-all duration-300"
                              aria-label="Remove Sub-Goal"
                            >
                              <X className="w-5 h-5" />
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-base font-semibold text-gray-900 dark:text-gray-100">Goal Type</label>
                      <select
                        value={editGoal.type}
                        onChange={(e) => setEditGoal((prev) => ({ ...prev, type: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="personal">Personal</option>
                        <option value="task">Task</option>
                      </select>
                    </div>
                    {editGoal.type === 'task' && (
                      <div>
                        <label className="text-base font-semibold text-gray-900 dark:text-gray-100">Attach Task to Sub-Goals</label>
                        {editGoal.subGoals.map((subGoal, index) => (
                          <div key={index} className="flex items-center gap-3 mb-3">
                            <p className="text-base text-gray-900 dark:text-gray-100 flex-1 truncate">{subGoal.title}</p>
                            <select
                              value={subGoal.taskId || ''}
                              onChange={(e) => {
                                const updatedSubGoals = [...editGoal.subGoals];
                                updatedSubGoals[index].taskId = e.target.value || null;
                                setEditGoal((prev) => ({ ...prev, subGoals: updatedSubGoals }));
                              }}
                              className="w-full sm:w-1/2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="">No Task</option>
                              {tasks.map((task) => (
                                <option key={task._id} value={task._id}>
                                  {task.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <label className="text-base font-semibold text-gray-900 dark:text-gray-100">Timeframe</label>
                      <select
                        value={editGoal.timeframe}
                        onChange={(e) => setEditGoal((prev) => ({ ...prev, timeframe: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-base font-semibold text-gray-900 dark:text-gray-100">Start Date</label>
                      <DatePicker
                        selected={editGoal.startDate}
                        onChange={(date) => setEditGoal((prev) => ({ ...prev, startDate: date }))}
                        dateFormat="MMM d, yyyy"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        wrapperClassName="w-full"
                        minDate={new Date()}
                      />
                    </div>
                    <div>
                      <label className="text-base font-semibold text-gray-900 dark:text-gray-100">End Date</label>
                      <DatePicker
                        selected={editGoal.endDate}
                        onChange={(date) => setEditGoal((prev) => ({ ...prev, endDate: date }))}
                        dateFormat="MMM d, yyyy"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        wrapperClassName="w-full"
                        minDate={editGoal.startDate}
                      />
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-base font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                        aria-label="Cancel"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUpdateGoal}
                        className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg text-base font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-md"
                        aria-label="Save Goal"
                      >
                        Save Goal
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Goal Title</p>
                      <p className="text-lg text-gray-900 dark:text-gray-100 truncate">{selectedGoal.title}</p>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Sub-Goals</p>
                      <div className="space-y-2">
                        {selectedGoal.subGoals.map((subGoal, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                            <input
                              type="checkbox"
                              checked={subGoal.completed}
                              onChange={(e) => handleUpdateSubGoalStatus(index, e.target.checked)}
                              className="h-5 w-5 text-blue-600 dark:text-blue-400 focus:ring-blue-400 dark:focus:ring-blue-500 flex-shrink-0"
                            />
                            <p className="text-base text-gray-900 dark:text-gray-100 flex-1 truncate">
                              {subGoal.title}
                              {subGoal.taskId && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {' '}
                                  (Task: {tasks.find((t) => t._id === subGoal.taskId)?.title || 'Not found'})
                                </span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Progress</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <motion.div
                          className="bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800 h-3 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${calculateProgress(selectedGoal.subGoals)}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-base text-gray-600 dark:text-gray-400 mt-2">{calculateProgress(selectedGoal.subGoals)}%</p>
                      {calculateProgress(selectedGoal.subGoals) === 100 && (
                        <p className="text-base text-green-600 dark:text-green-400 font-semibold mt-2 line-clamp-1">Goal Completed!</p>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Type</p>
                      <p className="text-base text-gray-600 dark:text-gray-400 capitalize line-clamp-1">{selectedGoal.type}</p>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Timeframe</p>
                      <p className="text-base text-gray-600 dark:text-gray-400 capitalize line-clamp-1">{selectedGoal.timeframe}</p>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Duration</p>
                      <p className="text-base text-gray-600 dark:text-gray-400 line-clamp-1">
                        {moment(selectedGoal.startDate).tz('Africa/Lagos').format('MMM D, YYYY')} -{' '}
                        {moment(selectedGoal.endDate).tz('Africa/Lagos').format('MMM D, YYYY')}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-4 mt-6">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg text-base font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 flex items-center gap-2 shadow-md"
                        aria-label="Edit Goal"
                      >
                        <Edit className="w-5 h-5" />
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUpdateGoal}
                        className="px-4 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg text-base font-semibold hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-300 flex items-center gap-2 shadow-md"
                        aria-label="Update Progress"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Update
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg text-base font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-300 flex items-center gap-2 shadow-md"
                        aria-label="Delete Goal"
                      >
                        <Trash className="w-5 h-5" />
                        Delete
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
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
            className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            role="dialog"
            aria-label="Delete Confirmation"
            ref={modalRef}
            tabIndex={-1}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Confirm Deletion</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full transition-all duration-300"
                  aria-label="Close Confirmation"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
              <p className="text-base text-gray-800 dark:text-gray-200 mb-6">Are you sure you want to delete this goal? This action cannot be undone.</p>
              <div className="flex justify-end gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-base font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                  aria-label="Cancel Deletion"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteGoal}
                  className="px-6 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg text-base font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-300 shadow-md"
                  aria-label="Confirm Deletion"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .react-datepicker__input-container input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #E5E7EB;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        .react-datepicker__input-container input:focus {
          outline: none;
          border-color: #1E40AF;
          box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.2);
        }
        .react-datepicker {
          border: 1px solid #E5E7EB;
          border-radius: 0.75rem;
          background: white;
        }
        .react-datepicker__header {
          background: #1E40AF;
          color: white;
          border-bottom: none;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background: #1E40AF;
          color: white;
        }
        .react-datepicker__day:hover {
          background: rgba(30, 64, 175, 0.1);
        }
        @media (max-width: 639px) {
          .max-w-md {
            max-width: 90%;
          }
        }
      `}</style>
    </motion.div>
  );
};
export default Goals;