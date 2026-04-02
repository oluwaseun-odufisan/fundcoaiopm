// Reminders.jsx
import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
    Bell, X, Clock, Settings, CheckCircle, AlertTriangle, Calendar,
    Target, FileText, ArrowLeft, Plus, Edit, Trash,
    List, Grid, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import moment from 'moment-timezone';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
};

const Reminders = () => {
    const { user, onLogout } = useOutletContext();
    const navigate = useNavigate();

    const [reminders, setReminders] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [showPreferences, setShowPreferences] = useState(false);
    const [showCreateReminder, setShowCreateReminder] = useState(false);
    const [showReminderDetails, setShowReminderDetails] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editReminder, setEditReminder] = useState({
        type: 'custom',
        message: '',
        targetId: '',
        targetModel: '',
        deliveryChannels: { inApp: true, email: true, push: false },
        remindAt: new Date(),
        repeatInterval: '',
        emailOverride: '',
    });
    const [preferences, setPreferences] = useState({
        defaultDeliveryChannels: { inApp: true, email: true, push: false },
        defaultReminderTimes: {
            task_due: 60,
            meeting: 30,
            goal_deadline: 1440,
            appraisal_submission: 1440,
            manager_feedback: 720,
            custom: 60,
        },
    });
    const [newReminder, setNewReminder] = useState({
        type: 'custom',
        message: '',
        targetId: '',
        targetModel: '',
        deliveryChannels: { inApp: true, email: true, push: false },
        remindAt: new Date(),
        repeatInterval: '',
        emailOverride: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const modalRef = useRef(null);

    const getAuthHeaders = useCallback(() => ({
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    }), []);

    const fetchReminders = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/reminders`, {
                headers: getAuthHeaders(),
            });
            setReminders(data.reminders);
        } catch (e) {
            if (e.response?.status !== 401) toast.error(e.response?.data?.message || 'Failed to fetch reminders.');
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeaders]);

    const fetchPreferences = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/user/me`, {
                headers: getAuthHeaders(),
            });
            setPreferences(data.user.preferences?.reminders || preferences);
        } catch (e) {
            if (e.response?.status !== 401) toast.error('Failed to fetch preferences.');
        }
    }, [getAuthHeaders]);

    const fetchTasks = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/api/tasks/gp`, {
                headers: getAuthHeaders(),
            });
            setTasks(data.tasks || []);
        } catch (e) {
            if (e.response?.status !== 401) toast.error('Failed to fetch tasks.');
        }
    }, [getAuthHeaders]);

    useEffect(() => {
        if (!user || !localStorage.getItem('token')) {
            navigate('/login');
            return;
        }
        fetchReminders();
        fetchPreferences();
        fetchTasks();
    }, [user, navigate, fetchReminders, fetchPreferences, fetchTasks]);

    const handleReminderClick = useCallback((rem) => {
        setSelectedReminder(rem);
        setIsEditing(false);
        setShowReminderDetails(true);
    }, []);

    const handleEditReminder = useCallback(async () => {
        if (!editReminder.message.trim()) {
            toast.error('Reminder message is required.');
            return;
        }
        try {
            const { data } = await axios.put(
                `${API_BASE_URL}/api/reminders/${selectedReminder._id}`,
                {
                    ...editReminder,
                    targetModel: editReminder.targetId ? 'Task' : null,
                    repeatInterval: editReminder.repeatInterval ? parseInt(editReminder.repeatInterval) : null,
                    emailOverride: editReminder.emailOverride || null,
                },
                { headers: getAuthHeaders() }
            );
            setReminders((p) => p.map((r) => (r._id === selectedReminder._id ? data.reminder : r)));
            setShowReminderDetails(false);
            setIsEditing(false);
            toast.success('Reminder updated!');
        } catch (e) {
            if (e.response?.status !== 401) toast.error(e.response?.data?.message || 'Failed to update reminder.');
        }
    }, [editReminder, selectedReminder, getAuthHeaders]);

    const handleDeleteReminder = useCallback(async () => {
        try {
            await axios.delete(`${API_BASE_URL}/api/reminders/${selectedReminder._id}`, {
                headers: getAuthHeaders(),
            });
            setReminders((p) => p.filter((r) => r._id !== selectedReminder._id));
            setShowReminderDetails(false);
            toast.success('Reminder deleted!');
        } catch (e) {
            if (e.response?.status !== 401) toast.error(e.response?.data?.message || 'Failed to delete reminder.');
        }
    }, [selectedReminder, getAuthHeaders]);

    useEffect(() => {
        if (isEditing && selectedReminder) {
            setEditReminder({
                type: selectedReminder.type || 'custom',
                message: selectedReminder.message || '',
                targetId: selectedReminder.targetId || '',
                targetModel: selectedReminder.targetModel || '',
                deliveryChannels: selectedReminder.deliveryChannels || { inApp: true, email: true, push: false },
                remindAt: new Date(selectedReminder.remindAt) || new Date(),
                repeatInterval: selectedReminder.repeatInterval || '',
                emailOverride: selectedReminder.emailOverride || '',
            });
        }
    }, [isEditing, selectedReminder]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[#F3F4F6] dark:bg-gray-900 font-sans"
        >
            <Toaster position="bottom-right" />

            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-lg px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-20">
                <div className="max-w-[90rem] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reminders</h1>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreateReminder(true)}
                            className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-[#1E40AF] dark:bg-blue-700 text-white text-sm sm:text-base md:text-lg font-semibold hover:bg-[#1E40AF]/90 dark:hover:bg-blue-600 transition-all flex items-center gap-2 sm:gap-3 shadow-md"
                        >
                            <Plus className="w-4 h-4 sm:w-5 h-5" />
                            Create Reminder
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowPreferences(true)}
                            className="p-1 sm:p-2 text-[#1E40AF] dark:text-blue-400 hover:text-[#16A34A] dark:hover:text-green-400 transition-colors"
                        >
                            <Settings className="w-5 h-5 sm:w-6 h-6" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/')}
                            className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-[#1E40AF] dark:bg-blue-700 text-white text-sm sm:text-base md:text-lg font-semibold hover:bg-[#1E40AF]/90 dark:hover:bg-blue-600 transition-all flex items-center gap-2 sm:gap-3 shadow-md"
                        >
                            <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
                            Back to Dashboard
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* View mode toggle */}
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 md:px-8 mt-4 flex gap-2">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#E5E7EB] dark:bg-gray-700 text-[#1E40AF] dark:text-blue-400' : 'text-[#1E40AF] dark:text-blue-400 hover:bg-[#E5E7EB] dark:hover:bg-gray-700'}`}>
                    <Grid className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[#E5E7EB] dark:bg-gray-700 text-[#1E40AF] dark:text-blue-400' : 'text-[#1E40AF] dark:text-blue-400 hover:bg-[#E5E7EB] dark:hover:bg-gray-700'}`}>
                    <List className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg ${viewMode === 'calendar' ? 'bg-[#E5E7EB] dark:bg-gray-700 text-[#1E40AF] dark:text-blue-400' : 'text-[#1E40AF] dark:text-blue-400 hover:bg-[#E5E7EB] dark:hover:bg-gray-700'}`}>
                    <Calendar className="w-5 h-5" />
                </button>
            </div>

            {/* Main content */}
            <main className="max-w-[90rem] mx-auto w-full px-4 sm:px-6 md:px-8 py-6 sm:py-8">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar"
                >
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E40AF] dark:text-blue-400 truncate">Your Reminders</h2>

                    {isLoading ? (
                        <div className="text-center text-[#6B7280] dark:text-gray-400 text-xs sm:text-sm">Loading reminders...</div>
                    ) : reminders.length === 0 ? (
                        <div className="text-center text-[#6B7280] dark:text-gray-400 text-xs sm:text-sm">No reminders found. Create tasks or reminders to get started!</div>
                    ) : viewMode === 'calendar' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Calendar component omitted for brevity — keep your existing CustomCalendar */}
                            <div className="lg:col-span-2 overflow-y-auto custom-scrollbar max-h-[500px]">
                                {reminders.filter(r => {
                                    const d = new Date(r.remindAt);
                                    return d.getFullYear() === selectedDate.getFullYear() &&
                                           d.getMonth() === selectedDate.getMonth() &&
                                           d.getDate() === selectedDate.getDate();
                                }).map((rem) => (
                                    <motion.div
                                        key={rem._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => handleReminderClick(rem)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Bell className="w-6 h-6 text-[#1E40AF] dark:text-blue-400" />
                                            <div className="flex-1">
                                                <p className="font-medium text-[#1F2937] dark:text-gray-200 line-clamp-2">{rem.message}</p>
                                                <p className="text-sm text-[#6B7280] dark:text-gray-400">
                                                    {moment(rem.remindAt).tz('Africa/Lagos').format('h:mm A')}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                            <AnimatePresence>
                                {reminders.map((rem) => (
                                    <motion.div
                                        key={rem._id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        layout
                                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow duration-300 border border-[#F3F4F6] dark:border-gray-700 cursor-pointer"
                                        onClick={() => handleReminderClick(rem)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <Bell className="w-6 h-6 text-[#1E40AF] dark:text-blue-400" />
                                            <div className="flex gap-2">
                                                <motion.button onClick={(e) => { e.stopPropagation(); /* snooze */ }} className="p-1.5 bg-[#1E40AF] dark:bg-blue-700 text-white rounded-full">
                                                    <Clock className="w-4 h-4" />
                                                </motion.button>
                                                <motion.button onClick={(e) => { e.stopPropagation(); /* dismiss */ }} className="p-1.5 bg-red-600 dark:bg-red-700 text-white rounded-full">
                                                    <X className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-[#1F2937] dark:text-gray-200 line-clamp-2">{rem.message}</p>
                                        <p className="text-xs text-[#6B7280] dark:text-gray-400">
                                            {moment(rem.remindAt).tz('Africa/Lagos').format('MMM D, h:mm A')}
                                        </p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Reminder Details Modal (now always works) */}
            <AnimatePresence>
                {showReminderDetails && selectedReminder && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={modalVariants}
                        className="fixed inset-0 bg-white dark:bg-black bg-opacity-70 dark:bg-opacity-70 flex items-center justify-center z-50 px-4 sm:px-6"
                        role="dialog"
                        ref={modalRef}
                        tabIndex={-1}
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-xs sm:max-w-sm md:max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#1E40AF] dark:text-blue-400 truncate">
                                    {isEditing ? 'Edit Reminder' : 'Reminder Details'}
                                </h2>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setShowReminderDetails(false); setIsEditing(false); }} className="p-1 sm:p-2 text-[#1E40AF] dark:text-blue-400 hover:text-[#16A34A] dark:hover:text-green-400">
                                    <X className="w-4 h-4 sm:w-5 h-5" />
                                </motion.button>
                            </div>

                            {isEditing ? (
                                /* Edit form */
                                <div className="space-y-4 sm:space-y-6">
                                    <div>
                                        <label className="text-xs sm:text-sm font-semibold text-[#1F2937] dark:text-gray-200">Message</label>
                                        <input type="text" value={editReminder.message} onChange={(e) => setEditReminder((p) => ({ ...p, message: e.target.value }))} className="w-full p-2 sm:p-3 border border-[#6B7280]/20 dark:border-gray-600 rounded-lg text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" maxLength={200} />
                                    </div>
                                    {/* Add other edit fields as needed */}
                                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsEditing(false)} className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#F3F4F6] dark:bg-gray-700 text-[#1F2937] dark:text-gray-300 text-sm sm:text-base font-semibold hover:bg-[#E5E7EB] dark:hover:bg-gray-600 transition-all">Cancel</motion.button>
                                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleEditReminder} className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#1E40AF] dark:bg-blue-700 text-white text-sm sm:text-base font-semibold hover:bg-[#1E40AF]/90 dark:hover:bg-blue-600 transition-all">Save</motion.button>
                                    </div>
                                </div>
                            ) : (
                                /* View mode */
                                <div className="space-y-4 sm:space-y-6">
                                    <p className="text-sm font-semibold text-[#1F2937] dark:text-gray-200">Message</p>
                                    <p className="text-xs sm:text-sm text-[#6B7280] dark:text-gray-400 break-words">{selectedReminder.message}</p>
                                    <p className="text-xs sm:text-sm text-[#6B7280] dark:text-gray-400">
                                        Due: {moment(selectedReminder.remindAt).tz('Africa/Lagos').format('MMM D, YYYY, h:mm A')}
                                    </p>
                                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#1E40AF] dark:bg-blue-700 text-white text-sm sm:text-base font-semibold hover:bg-[#1E40AF]/90 dark:hover:bg-blue-600 transition-all flex items-center gap-2 sm:gap-3">
                                            <Edit className="w-4 h-4 sm:w-5 h-5" /> Edit
                                        </motion.button>
                                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDeleteReminder} className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-red-600 dark:bg-red-700 text-white text-sm sm:text-base font-semibold hover:bg-red-500 dark:hover:bg-red-600 transition-all flex items-center gap-2 sm:gap-3">
                                            <Trash className="w-4 h-4 sm:w-5 h-5" /> Delete
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Reminders;