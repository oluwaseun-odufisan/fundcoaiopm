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
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/* --------------------------------------------------------------- */
/* Firebase config (push notifications)                           */
/* --------------------------------------------------------------- */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/* --------------------------------------------------------------- */
/* Custom Calendar (same as the second snippet)                  */
/* --------------------------------------------------------------- */
const CustomCalendar = ({ reminders, selectedDate, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);

  const weeks = [];
  let week = Array.from({ length: firstDay }, () => null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const remindersByDate = {};
  reminders.forEach((r) => {
    const d = new Date(r.remindAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    if (!remindersByDate[key]) remindersByDate[key] = [];
    remindersByDate[key].push(r);
  });

  const tileContent = (day) => {
    if (!day) return null;
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
      2,
      '0'
    )}`;
    const list = remindersByDate[key] || [];
    if (!list.length) return null;
    const max = 3;
    return (
      <div className="flex justify-center gap-1 mt-1">
        {list.slice(0, max).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#1E40AF]" />
        ))}
        {list.length > max && (
          <span className="text-xs text-[#1E40AF] font-medium">
            +{list.length - max}
          </span>
        )}
      </div>
    );
  };

  const tileClass = (day) => {
    if (!day) return 'text-transparent';
    const isToday =
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day;
    return `rounded-full transition-colors hover:bg-blue-50 text-center py-2 text-sm font-medium cursor-pointer ${
      isToday ? 'bg-[#1E40AF] text-white' : 'text-gray-800'
    }`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#1E40AF]" />
        </button>
        <span className="text-base font-semibold text-gray-900">
          {currentMonth.toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          })}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#1E40AF]" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {daysOfWeek.map((d) => (
          <div key={d} className="text-center font-medium text-gray-600 py-1">
            {d}
          </div>
        ))}
        {weeks.flat().map((day, i) => (
          <div
            key={i}
            className={tileClass(day)}
            onClick={() => day && onDateChange(new Date(year, month, day))}
          >
            {day}
            {tileContent(day)}
          </div>
        ))}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- */
/* Main Reminders component                                        */
/* --------------------------------------------------------------- */
const Reminders = () => {
  const { user, onLogout } = useOutletContext();
  const navigate = useNavigate();

  /* -------------------------- State -------------------------- */
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
  const [viewMode, setViewMode] = useState('grid'); // grid | list | calendar
  const [selectedDate, setSelectedDate] = useState(new Date());
  const modalRef = useRef(null);

  /* ---------------------- Helper: filtered reminders for calendar ---------------------- */
  const filteredReminders = viewMode === 'calendar'
    ? reminders.filter((r) => {
        const d = new Date(r.remindAt);
        return (
          d.getFullYear() === selectedDate.getFullYear() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getDate() === selectedDate.getDate()
        );
      })
    : reminders;

  /* -------------------------- Firebase push token -------------------------- */
  useEffect(() => {
    const registerPushToken = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_VAPID_KEY,
          });
          await axios.put(
            `${API_BASE_URL}/api/user/push-token`,
            { pushToken: token },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          );
        }
      } catch (e) {
        console.error('Push token error:', e);
      }
    };
    registerPushToken();
  }, []);

  /* -------------------------- Socket.IO -------------------------- */
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      auth: { token: localStorage.getItem('token') },
    });
    socket.on('newReminder', (rem) => {
      setReminders((p) => [rem, ...p]);
      toast.custom((t) => (
        <ReminderToast
          reminder={rem}
          onSnooze={() => handleSnooze(rem._id, 15)}
          onDismiss={() => handleDismiss(rem._id)}
        />
      ));
    });
    socket.on('reminderUpdated', (rem) =>
      setReminders((p) => p.map((r) => (r._id === rem._id ? rem : r)))
    );
    socket.on('reminderDeleted', (id) => {
      setReminders((p) => p.filter((r) => r._id !== id));
      toast.success('Reminder deleted in real-time!');
    });
    socket.on('reminderTriggered', (rem) => {
      toast.custom((t) => (
        <ReminderToast
          reminder={rem}
          onSnooze={() => handleSnooze(rem._id, 15)}
          onDismiss={() => handleDismiss(rem._id)}
        />
      ));
    });
    return () => socket.disconnect();
  }, []);

  /* -------------------------- Axios 401 interceptor -------------------------- */
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          toast.error('Session expired. Please log in.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          onLogout?.();
          navigate('/login');
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [onLogout, navigate]);

  /* -------------------------- Modal focus trap -------------------------- */
  useEffect(() => {
    const esc = (e) => {
      if (e.key === 'Escape') {
        setShowPreferences(false);
        setShowCreateReminder(false);
        setShowReminderDetails(false);
        setIsEditing(false);
      }
    };
    if (showPreferences || showCreateReminder || showReminderDetails) {
      modalRef.current?.focus();
      window.addEventListener('keydown', esc);
    }
    return () => window.removeEventListener('keydown', esc);
  }, [showPreferences, showCreateReminder, showReminderDetails]);

  const getAuthHeaders = useCallback(
    () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }),
    []
  );

  /* -------------------------- Data fetching -------------------------- */
  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/reminders`, {
        headers: getAuthHeaders(),
      });
      setReminders(data.reminders);
    } catch (e) {
      if (e.response?.status !== 401)
        toast.error(e.response?.data?.message || 'Failed to fetch reminders.');
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
      setTasks(data.tasks);
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

  /* -------------------------- Handlers -------------------------- */
  const handleSnooze = useCallback(
    async (id, minutes) => {
      try {
        await axios.put(
          `${API_BASE_URL}/api/reminders/${id}/snooze`,
          { snoozeMinutes: minutes },
          { headers: getAuthHeaders() }
        );
        toast.success('Reminder snoozed!');
      } catch (e) {
        if (e.response?.status !== 401)
          toast.error(e.response?.data?.message || 'Failed to snooze reminder.');
      }
    },
    [getAuthHeaders]
  );

  const handleDismiss = useCallback(
    async (id) => {
      try {
        await axios.put(
          `${API_BASE_URL}/api/reminders/${id}/dismiss`,
          {},
          { headers: getAuthHeaders() }
        );
        toast.success('Reminder dismissed!');
      } catch (e) {
        if (e.response?.status !== 401)
          toast.error(e.response?.data?.message || 'Failed to dismiss reminder.');
      }
    },
    [getAuthHeaders]
  );

  const handleUpdatePreferences = useCallback(async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/reminders/preferences`,
        preferences,
        { headers: getAuthHeaders() }
      );
      setShowPreferences(false);
      toast.success('Preferences updated!', {
        style: { background: '#16A34A', color: '#FFFFFF' },
      });
    } catch (e) {
      if (e.response?.status !== 401)
        toast.error(e.response?.data?.message || 'Failed to update preferences.');
    }
  }, [preferences, getAuthHeaders]);

  const handleCreateReminder = useCallback(async () => {
    if (!newReminder.message.trim()) {
      toast.error('Reminder message is required.');
      return;
    }
    if (
      newReminder.repeatInterval &&
      (newReminder.repeatInterval < 5 || newReminder.repeatInterval > 1440)
    ) {
      toast.error('Repeat interval must be between 5 and 1440 minutes.');
      return;
    }
    if (
      newReminder.emailOverride &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newReminder.emailOverride)
    ) {
      toast.error('Invalid email address.');
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/api/reminders`,
        {
          ...newReminder,
          targetModel: newReminder.targetId ? 'Task' : null,
          repeatInterval: newReminder.repeatInterval
            ? parseInt(newReminder.repeatInterval)
            : null,
          emailOverride: newReminder.emailOverride || null,
        },
        { headers: getAuthHeaders() }
      );
      setShowCreateReminder(false);
      setNewReminder({
        type: 'custom',
        message: '',
        targetId: '',
        targetModel: '',
        deliveryChannels: { inApp: true, email: true, push: false },
        remindAt: new Date(),
        repeatInterval: '',
        emailOverride: '',
      });
      toast.success('Reminder created!');
    } catch (e) {
      if (e.response?.status !== 401)
        toast.error(e.response?.data?.message || 'Failed to create reminder.');
    }
  }, [newReminder, getAuthHeaders]);

  const handleReminderClick = useCallback((rem) => {
    setSelectedReminder(rem);
    setShowReminderDetails(true);
  }, []);

  const handleEditReminder = useCallback(async () => {
    if (!editReminder.message.trim()) {
      toast.error('Reminder message is required.');
      return;
    }
    if (
      editReminder.repeatInterval &&
      (editReminder.repeatInterval < 5 || editReminder.repeatInterval > 1440)
    ) {
      toast.error('Repeat interval must be between 5 and 1440 minutes.');
      return;
    }
    if (
      editReminder.emailOverride &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editReminder.emailOverride)
    ) {
      toast.error('Invalid email address.');
      return;
    }
    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/api/reminders/${selectedReminder._id}`,
        {
          ...editReminder,
          targetModel: editReminder.targetId ? 'Task' : null,
          repeatInterval: editReminder.repeatInterval
            ? parseInt(editReminder.repeatInterval)
            : null,
          emailOverride: editReminder.emailOverride || null,
        },
        { headers: getAuthHeaders() }
      );
      setReminders((p) =>
        p.map((r) => (r._id === selectedReminder._id ? data.reminder : r))
      );
      setShowReminderDetails(false);
      setIsEditing(false);
      toast.success('Reminder updated!');
    } catch (e) {
      if (e.response?.status !== 401)
        toast.error(e.response?.data?.message || 'Failed to update reminder.');
    }
  }, [editReminder, selectedReminder, getAuthHeaders]);

  const handleDeleteReminder = useCallback(async () => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/reminders/${selectedReminder._id}`,
        { headers: getAuthHeaders() }
      );
      setReminders((p) => p.filter((r) => r._id !== selectedReminder._id));
      setShowReminderDetails(false);
      toast.success('Reminder deleted!');
    } catch (e) {
      if (e.response?.status !== 401)
        toast.error(e.response?.data?.message || 'Failed to delete reminder.');
    }
  }, [selectedReminder, getAuthHeaders]);

  useEffect(() => {
    if (isEditing && selectedReminder) {
      setEditReminder({
        type: selectedReminder.type || 'custom',
        message: selectedReminder.message || '',
        targetId: selectedReminder.targetId || '',
        targetModel: selectedReminder.targetModel || '',
        deliveryChannels:
          selectedReminder.deliveryChannels || {
            inApp: true,
            email: true,
            push: false,
          },
        remindAt: new Date(selectedReminder.remindAt) || new Date(),
        repeatInterval: selectedReminder.repeatInterval || '',
        emailOverride: selectedReminder.emailOverride || '',
      });
    }
  }, [isEditing, selectedReminder]);

  /* -------------------------- Toast component -------------------------- */
  const ReminderToast = ({ reminder, onSnooze, onDismiss }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="bg-[#1E40AF] text-white p-4 rounded-xl shadow-2xl max-w-sm flex items-center gap-4"
    >
      <Bell className="w-6 h-6 text-[#F3F4F6]" />
      <div className="flex-1">
        <p className="text-sm font-semibold">{reminder.message}</p>
        <p className="text-xs opacity-75">
          {moment(reminder.remindAt).tz('Africa/Lagos').format('MMM D, h:mm A')}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSnooze}
          className="p-2 bg-[#1E40AF]/90 rounded-full hover:bg-[#1E40AF]/80 transition-all"
          aria-label="Snooze"
        >
          <Clock className="w-4 h-4" />
        </button>
        <button
          onClick={onDismiss}
          className="p-2 bg-red-600 rounded-full hover:bg-red-500 transition-all"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  /* -------------------------- Render -------------------------- */
  if (!user || !localStorage.getItem('token')) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F3F4F6] font-sans"
    >
      <Toaster
        position="bottom-right"
        toastOptions={{ className: 'text-xs sm:text-sm max-w-xs sm:max-w-sm' }}
      />

      {/* Header */}
      <header className="bg-white shadow-lg px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-20">
        <div className="max-w-[90rem] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Reminders
          </h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateReminder(true)}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-[#1E40AF] text-white text-sm sm:text-base md:text-lg font-semibold hover:bg-[#1E40AF]/90 transition-all flex items-center gap-2 sm:gap-3 shadow-md"
              aria-label="Create Reminder"
            >
              <Plus className="w-4 h-4 sm:w-5 h-5" />
              Create Reminder
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPreferences(true)}
              className="p-1 sm:p-2 text-[#1E40AF] hover:text-[#16A34A] transition-colors"
              aria-label="Preferences"
            >
              <Settings className="w-5 h-5 sm:w-6 h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-3 rounded-full bg-[#1E40AF] text-white text-sm sm:text-base md:text-lg font-semibold hover:bg-[#1E40AF]/90 transition-all flex items-center gap-2 sm:gap-3 shadow-md"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
              Back to Dashboard
            </motion.button>
          </div>
        </div>
      </header>

      {/* View mode toggle */}
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 md:px-8 mt-4 flex gap-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded-lg ${
            viewMode === 'grid' ? 'bg-[#E5E7EB] text-[#1E40AF]' : 'text-[#1E40AF] hover:bg-[#E5E7EB]'
          }`}
        >
          <Grid className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-lg ${
            viewMode === 'list' ? 'bg-[#E5E7EB] text-[#1E40AF]' : 'text-[#1E40AF] hover:bg-[#E5E7EB]'
          }`}
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`p-2 rounded-lg ${
            viewMode === 'calendar'
              ? 'bg-[#E5E7EB] text-[#1E40AF]'
              : 'text-[#1E40AF] hover:bg-[#E5E7EB]'
          }`}
        >
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
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E40AF] truncate">
            Your Reminders
          </h2>

          {isLoading ? (
            <div className="text-center text-[#6B7280] text-xs sm:text-sm">
              Loading reminders...
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center text-[#6B7280] text-xs sm:text-sm">
              No reminders found. Create tasks or reminders to get started!
            </div>
          ) : viewMode === 'calendar' ? (
            /* ---------- Calendar view ---------- */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <CustomCalendar
                  reminders={reminders}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                />
              </div>
              <div className="lg:col-span-2 overflow-y-auto custom-scrollbar max-h-[500px]">
                {filteredReminders.length === 0 ? (
                  <p className="text-center text-[#6B7280] py-8">
                    No reminders for this date
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredReminders.map((rem) => (
                      <motion.div
                        key={rem._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleReminderClick(rem)}
                      >
                        <div className="flex items-start gap-3">
                          <Bell className="w-6 h-6 text-[#1E40AF]" />
                          <div className="flex-1">
                            <p className="font-medium text-[#1F2937] line-clamp-2">
                              {rem.message}
                            </p>
                            <p className="text-sm text-[#6B7280]">
                              {moment(rem.remindAt)
                                .tz('Africa/Lagos')
                                .format('h:mm A')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ---------- Grid / List view ---------- */
            <div
              className={`grid gap-4 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
              }`}
            >
              <AnimatePresence>
                {reminders.map((rem) => (
                  <motion.div
                    key={rem._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow duration-300 border border-[#F3F4F6] cursor-pointer"
                    onClick={() => handleReminderClick(rem)}
                  >
                    <div className="flex justify-between items-start">
                      <ReminderIcon type={rem.type} />
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSnooze(rem._id, 15);
                          }}
                          className="p-1.5 bg-[#1E40AF] text-white rounded-full hover:bg-[#1E40AF]/90 transition-all"
                          aria-label="Snooze"
                          disabled={rem.status === 'dismissed'}
                        >
                          <Clock className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(rem._id);
                          }}
                          className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-500 transition-all"
                          aria-label="Dismiss"
                          disabled={rem.status === 'dismissed'}
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[#1F2937] line-clamp-2">
                      {rem.message}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {moment(rem.remindAt)
                        .tz('Africa/Lagos')
                        .format('MMM D, h:mm A')}
                    </p>
                    <p className="text-xs text-[#6B7280] capitalize">
                      Status: {rem.status}
                    </p>
                    {rem.repeatInterval && (
                      <p className="text-xs text-[#6B7280]">
                        Repeats every {rem.repeatInterval} min
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Scrollbar style */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
            height: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(30, 64, 175, 0.1);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #1e40af;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #1e3a8a;
          }
        `}</style>
      </main>

      {/* ---------- Modals (Preferences, Create, Details) ---------- */}
      <AnimatePresence>
        {/* Preferences */}
        {showPreferences && (
          <PreferencesModal
            preferences={preferences}
            setPreferences={setPreferences}
            onSave={handleUpdatePreferences}
            onClose={() => setShowPreferences(false)}
            modalRef={modalRef}
          />
        )}

        {/* Create */}
        {showCreateReminder && (
          <CreateReminderModal
            newReminder={newReminder}
            setNewReminder={setNewReminder}
            tasks={tasks}
            user={user}
            onCreate={handleCreateReminder}
            onClose={() => setShowCreateReminder(false)}
            modalRef={modalRef}
          />
        )}

        {/* Details / Edit */}
        {showReminderDetails && selectedReminder && (
          <ReminderDetailsModal
            reminder={selectedReminder}
            tasks={tasks}
            user={user}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editReminder={editReminder}
            setEditReminder={setEditReminder}
            onSave={handleEditReminder}
            onDelete={handleDeleteReminder}
            onClose={() => {
              setShowReminderDetails(false);
              setIsEditing(false);
            }}
            modalRef={modalRef}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* --------------------------------------------------------------- */
/* Icon helper (same as first file)                               */
/* --------------------------------------------------------------- */
const ReminderIcon = ({ type }) => {
  const icons = {
    task_due: <CheckCircle className="w-6 h-6 text-[#F3F4F6]" />,
    meeting: <Calendar className="w-6 h-6 text-[#F3F4F6]" />,
    goal_deadline: <Target className="w-6 h-6 text-[#F3F4F6]" />,
    appraisal_submission: <FileText className="w-6 h-6 text-[#F3F4F6]" />,
    manager_feedback: <AlertTriangle className="w-6 h-6 text-[#F3F4F6]" />,
    custom: <Bell className="w-6 h-6 text-[#F3F4F6]" />,
  };
  return icons[type] || <Bell className="w-6 h-6 text-[#F3F4F6]" />;
};

/* --------------------------------------------------------------- */
/* Modal components (exactly the same styling as the first file)   */
/* --------------------------------------------------------------- */
const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

const PreferencesModal = ({
  preferences,
  setPreferences,
  onSave,
  onClose,
  modalRef,
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={modalVariants}
    className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50 px-4 sm:px-6"
    role="dialog"
    ref={modalRef}
    tabIndex={-1}
  >
    <div
      className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-xs sm:max-w-sm md:max-w-lg w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#1E40AF] truncate">
          Reminder Preferences
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="p-1 sm:p-2 text-[#1E40AF] hover:text-[#16A34A]"
        >
          <X className="w-4 h-4 sm:w-5 h-5" />
        </motion.button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h3 className="text-sm sm:text-base font-semibold text-[#1F2937]">
          Delivery Channels
        </h3>
        {Object.keys(preferences.defaultDeliveryChannels).map((c) => (
          <label key={c} className="flex items-center gap-2 sm:gap-3">
            <input
              type="checkbox"
              checked={preferences.defaultDeliveryChannels[c]}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  defaultDeliveryChannels: {
                    ...p.defaultDeliveryChannels,
                    [c]: e.target.checked,
                  },
                }))
              }
              className="h-4 w-4 sm:h-5 sm:w-5 text-[#1E40AF]"
            />
            <span className="text-xs sm:text-sm text-[#1F2937] capitalize">
              {c}
            </span>
          </label>
        ))}

        <h3 className="text-sm sm:text-base font-semibold text-[#1F2937] mt-4 sm:mt-6">
          Reminder Times (minutes before)
        </h3>
        {Object.keys(preferences.defaultReminderTimes).map((t) => (
          <div key={t} className="flex items-center gap-2 sm:gap-3">
            <label className="text-xs sm:text-sm text-[#1F2937] capitalize flex-1 truncate">
              {t.replace('_', ' ')}
            </label>
            <input
              type="number"
              value={preferences.defaultReminderTimes[t]}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  defaultReminderTimes: {
                    ...p.defaultReminderTimes,
                    [t]: parseInt(e.target.value) || 0,
                  },
                }))
              }
              className="w-20 sm:w-24 p-1 sm:p-2 border border-[#6B7280]/20 rounded-lg text-xs sm:text-sm"
              min="0"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#F3F4F6] text-[#1F2937] text-sm sm:text-base font-semibold hover:bg-[#E5E7EB] transition-all"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSave}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#1E40AF] text-white text-sm sm:text-base font-semibold hover:bg-[#1E40AF]/90 transition-all"
        >
          Save
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const CreateReminderModal = ({
  newReminder,
  setNewReminder,
  tasks,
  user,
  onCreate,
  onClose,
  modalRef,
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={modalVariants}
    className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50 px-4 sm:px-6"
    role="dialog"
    ref={modalRef}
    tabIndex={-1}
  >
    <div
      className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-xs sm:max-w-sm md:max-w-lg w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#1E40AF] truncate">
          Create New Reminder
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="p-1 sm:p-2 text-[#1E40AF] hover:text-[#16A34A]"
        >
          <X className="w-4 h-4 sm:w-5 h-5" />
        </motion.button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Message */}
        <div>
          <label className="text-xs sm:text-sm font-semibold text-[#1F2937]">
            Message
          </label>
          <input
            type="text"
            value={newReminder.message}
            onChange={(e) =>
              setNewReminder((p) => ({ ...p, message: e.target.value }))
            }
            className="w-full p-2 sm:p-3 border border-[#6B7280]/20 rounded-lg text-xs sm:text-sm"
            placeholder="Enter reminder message"
            maxLength={200}
          />
        </div>

        {/* Attach Task */}
        <div>
          <label className="text-xs sm:text-sm font-semibold text-[#1F2937]">
            Attach Task (Optional)
          </label>
          <select
            value={newReminder.targetId}
            onChange={(e) =>
              setNewReminder((p) => ({
                ...p,
                targetId: e.target.value,
                targetModel: e.target.value ? 'Task' : '',
              }))
            }
            className="w-full p-2 sm:p-3 border border-[#6B7280]/20 rounded-lg text-xs sm:text-sm"
          >
            <option value="">No Task</option>
            {tasks.map((t) => (
              <option key={t._id} value={t._id} className="truncate">
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div>
          <label className="text-xs sm:text-sm font-semibold text-[#1F2937]">
            Reminder Date & Time
          </label>
          <DatePicker
            selected={newReminder.remindAt}
            onChange={(d) =>
              setNewReminder((p) => ({ ...p, remindAt: d }))
            }
            showTimeSelect
            timeIntervals={15}
            dateFormat="MMMM d, yyyy h:mm aa"
            className="w-full p-2 sm:p-3 border border-[#6B7280]/20 rounded-lg text-xs sm:text-sm"
            minDate={new Date()}
            popperClassName="z-[60]"
          />
        </div>

        {/* Repeat */}
        <div>
          <label className="text-xs sm:text-sm font-semibold text-[#1F2937]">
            Repeat Interval (minutes, optional)
          </label>
          <input
            type="number"
            value={newReminder.repeatInterval}
            onChange={(e) =>
              setNewReminder((p) => ({
                ...p,
                repeatInterval: e.target.value,
              }))
            }
            className="w-full p-2 sm:p-3 border border-[#6B7280]/20 rounded-lg text-xs sm:text-sm"
            placeholder="e.g., 20"
            min="5"
            max="1440"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs sm:text-sm font-semibold text-[#1F2937]">
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={newReminder.emailOverride}
            onChange={(e) =>
              setNewReminder((p) => ({
                ...p,
                emailOverride: e.target.value,
              }))
            }
            className="w-full p-2 sm:p-3 border border-[#6B7280]/20 rounded-lg text-xs sm:text-sm"
            placeholder={`Default: ${user.email}`}
          />
        </div>

        {/* Channels */}
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-[#1F2937]">
            Delivery Channels
          </h3>
          {Object.keys(newReminder.deliveryChannels).map((c) => (
            <label key={c} className="flex items-center gap-2 sm:gap-3">
              <input
                type="checkbox"
                checked={newReminder.deliveryChannels[c]}
                onChange={(e) =>
                  setNewReminder((p) => ({
                    ...p,
                    deliveryChannels: {
                      ...p.deliveryChannels,
                      [c]: e.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 sm:h-5 sm:w-5 text-[#1E40AF]"
              />
              <span className="text-xs sm:text-sm text-[#1F2937] capitalize">
                {c}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#F3F4F6] text-[#1F2937] text-sm sm:text-base font-semibold hover:bg-[#E5E7EB] transition-all"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreate}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#1E40AF] text-white text-sm sm:text-base font-semibold hover:bg-[#1E40AF]/90 transition-all"
        >
          Create
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const ReminderDetailsModal = ({
  reminder,
  tasks,
  user,
  isEditing,
  setIsEditing,
  editReminder,
  setEditReminder,
  onSave,
  onDelete,
  onClose,
  modalRef,
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={modalVariants}
    className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50 px-4 sm:px-6"
    role="dialog"
    ref={modalRef}
    tabIndex={-1}
  >
    <div
      className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-xs sm:max-w-sm md:max-w-lg w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#1E40AF] truncate">
          {isEditing ? 'Edit Reminder' : 'Reminder Details'}
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="p-1 sm:p-2 text-[#1E40AF] hover:text-[#16A34A]"
        >
          <X className="w-4 h-4 sm:w-5 h-5" />
        </motion.button>
      </div>

      {isEditing ? (
        /* ---------- Edit form (same fields as create) ---------- */
        <div className="space-y-4 sm:space-y-6">
          {/* Message */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-[#1F2937]">
              Message
            </label>
            <input
              type="text"
              value={editReminder.message}
              onChange={(e) =>
                setEditReminder((p) => ({ ...p, message: e.target.value }))
              }
              className="w-full p-2 sm:p-3 border border-[#6B7280]/20 rounded-lg text-xs sm:text-sm"
              maxLength={200}
            />
          </div>

          {/* Attach Task */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-[#1F2937]">
              Attach Task (Optional)
            </label>
            <select
              value={editReminder.targetId}
              onChange={(e) =>
                setEditReminder((p) => ({
                  ...p,
                  targetId: e.target.value,
                  targetModel: e.target.value ? 'Task' : '',
                }))
              }
              className="w-full p-2 sm:p-3 border border-[#6B7280]/20 rounded-lg text-xs sm:text-sm"
            >
              <option value="">No Task</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id} className="truncate">
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-[#1F2937]">
              Reminder Date & Time
            </label>
            <DatePicker
              selected={editReminder.remindAt}
              onChange={(d) =>
                setEditReminder((p) => ({ ...p, remindAt: d }))
              }
              showTimeSelect
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full p-2 sm:p-3 border border-[#6B7280]/20 rounded-lg text-xs sm:text-sm"
              minDate={new Date()}
              popperClassName="z-[60]"
            />
          </div>

          {/* Repeat */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-[#1F2937]">
              Repeat Interval (minutes, optional)
            </label>
            <input
              type="number"
              value={editReminder.repeatInterval}
              onChange={(e) =>
                setEditReminder((p) => ({
                  ...p,
                  repeatInterval: e.target.value,
                }))
              }
              className="w-full p-2 sm:p-3 border border-[#6B7280]/20 rounded-lg text-xs sm:text-sm"
              min="5"
              max="1440"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-[#1F2937]">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={editReminder.emailOverride}
              onChange={(e) =>
                setEditReminder((p) => ({
                  ...p,
                  emailOverride: e.target.value,
                }))
              }
              className="w-full p-2 sm:p-3 border border-[#6B7280]/20 rounded-lg text-xs sm:text-sm"
              placeholder={`Default: ${user.email}`}
            />
          </div>

          {/* Channels */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-[#1F2937]">
              Delivery Channels
            </h3>
            {Object.keys(editReminder.deliveryChannels).map((c) => (
              <label key={c} className="flex items-center gap-2 sm:gap-3">
                <input
                  type="checkbox"
                  checked={editReminder.deliveryChannels[c]}
                  onChange={(e) =>
                    setEditReminder((p) => ({
                      ...p,
                      deliveryChannels: {
                        ...p.deliveryChannels,
                        [c]: e.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 sm:h-5 sm:w-5 text-[#1E40AF]"
                />
                <span className="text-xs sm:text-sm text-[#1F2937] capitalize">
                  {c}
                </span>
              </label>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(false)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#F3F4F6] text-[#1F2937] text-sm sm:text-base font-semibold hover:bg-[#E5E7EB] transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSave}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#1E40AF] text-white text-sm sm:text-base font-semibold hover:bg-[#1E40AF]/90 transition-all"
            >
              Save
            </motion.button>
          </div>
        </div>
      ) : (
        /* ---------- Details view ---------- */
        <div className="space-y-4 sm:space-y-6">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#1F2937]">
              Message
            </p>
            <p className="text-xs sm:text-sm text-[#6B7280] break-words">
              {reminder.message}
            </p>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#1F2937]">
              Type
            </p>
            <p className="text-xs sm:text-sm text-[#6B7280] capitalize">
              {reminder.type.replace('_', ' ')}
            </p>
          </div>

          {reminder.targetId && (
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#1F2937]">
                Attached Task
              </p>
              <p className="text-xs sm:text-sm text-[#6B7280] truncate">
                {tasks.find((t) => t._id === reminder.targetId)?.title ||
                  'Task not found'}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#1F2937]">
              Reminder Time
            </p>
            <p className="text-xs sm:text-sm text-[#6B7280] line-clamp-1">
              {moment(reminder.remindAt)
                .tz('Africa/Lagos')
                .format('MMM D, YYYY, h:mm A')}
            </p>
          </div>

          {reminder.repeatInterval && (
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#1F2937]">
                Repeat Interval
              </p>
              <p className="text-xs sm:text-sm text-[#6B7280]">
                {reminder.repeatInterval} minutes
              </p>
            </div>
          )}

          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#1F2937]">
              Email
            </p>
            <p className="text-xs sm:text-sm text-[#6B7280] truncate">
              {reminder.emailOverride || user.email}
            </p>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#1F2937]">
              Delivery Channels
            </p>
            <p className="text-xs sm:text-sm text-[#6B7280] truncate">
              {Object.keys(reminder.deliveryChannels)
                .filter((k) => reminder.deliveryChannels[k])
                .join(', ')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-[#1E40AF] text-white text-sm sm:text-base font-semibold hover:bg-[#1E40AF]/90 transition-all flex items-center gap-2 sm:gap-3"
            >
              <Edit className="w-4 h-4 sm:w-5 h-5" />
              Edit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDelete}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-red-600 text-white text-sm sm:text-base font-semibold hover:bg-red-500 transition-all flex items-center gap-2 sm:gap-3"
            >
              <Trash className="w-4 h-4 sm:w-5 h-5" />
              Delete
            </motion.button>
          </div>
        </div>
      )}
    </div>
  </motion.div>
);

export default Reminders;