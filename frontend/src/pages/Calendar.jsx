// Calendar.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import TaskItem from '../components/TaskItem';
import TaskModal from '../components/TaskModal';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/tasks`;

// === Custom Calendar ===
const CustomCalendar = ({ value, onChange, tasksByDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const weeks = [];
  let currentWeek = Array(firstDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const tileContent = (day) => {
    if (!day) return null;
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = tasksByDate[dateKey] || [];
    if (!dayTasks.length) return null;

    const maxDots = 3;
    const priorityColors = {
      high: 'bg-red-500',
      medium: 'bg-amber-500',
      low: 'bg-emerald-500',
    };

    return (
      <div className="flex justify-center gap-1 mt-1">
        {dayTasks.slice(0, maxDots).map((task, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority?.toLowerCase()] || priorityColors.low}`}
          />
        ))}
        {dayTasks.length > maxDots && (
          <span className="text-xs font-medium" style={{ color: 'var(--brand-accent)' }}>
            +{dayTasks.length - maxDots}
          </span>
        )}
      </div>
    );
  };

  const tileClassName = (day) => {
    if (!day) return 'text-transparent';
    const isSelected =
      value.getFullYear() === year &&
      value.getMonth() === month &&
      value.getDate() === day;

    return `rounded-full transition-colors duration-200 text-center py-2 text-sm font-medium ${
      isSelected
        ? 'bg-[var(--brand-primary)] text-white'
        : 'hover:bg-[var(--bg-hover)]'
    }`;
  };

  return (
    <div
      className="rounded-xl p-4 border"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center font-medium py-1" style={{ color: 'var(--text-muted)' }}>
            {day}
          </div>
        ))}
        {weeks.flat().map((day, i) => (
          <div
            key={i}
            className={tileClassName(day)}
            style={{ color: 'var(--text-primary)' }}
            onClick={() => day && onChange(new Date(year, month, day))}
          >
            {day}
            {tileContent(day)}
          </div>
        ))}
      </div>
    </div>
  );
};

// === Main Calendar View ===
const CalendarView = () => {
  const { user, tasks, fetchTasks, onLogout } = useOutletContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  // Live Clock (WAT)
  useEffect(() => {
    const updateTime = () => {
      const watTime = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Africa/Lagos',
      }).format(new Date());
      setCurrentTime(watTime);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Daily Tasks
  const dailyTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getFullYear() === selectedDate.getFullYear() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getDate() === selectedDate.getDate()
      );
    });
  }, [tasks, selectedDate]);

  // Tasks by Date (for dots)
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const date = new Date(task.dueDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [tasks]);

  const handleTaskSave = async (taskData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');
      const payload = {
        title: taskData.title?.trim() || '',
        description: taskData.description || '',
        priority: taskData.priority || 'Low',
        dueDate: taskData.dueDate || selectedDate.toISOString().split('T')[0],
        completed: taskData.completed === 'Yes' || taskData.completed === true,
        userId: user?.id || null,
      };
      if (!payload.title) return;
      if (taskData._id) {
        await axios.put(`${API_BASE_URL}/${taskData._id}/gp`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE_URL}/gp`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await fetchTasks();
      setShowModal(false);
      setTaskToEdit(null);
    } catch (error) {
      console.error('Error saving task:', error.response?.data || error.message);
      if (error.response?.status === 401) onLogout?.();
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div
          className="rounded-2xl shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          {/* Header */}
          <header
            className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--brand-light)' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--brand-primary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Calendar</h1>
                <p className="text-sm" style={{ color: 'var(--brand-accent)' }}>View tasks by date</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="border rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <Clock className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
                <span>{currentTime}</span>
              </div>
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=312783&color=fff`}
                alt="Avatar"
                className="w-9 h-9 rounded-full border"
                style={{ borderColor: 'var(--border-color)' }}
              />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col lg:flex-row gap-6 p-5 sm:p-6 overflow-hidden">
            {/* Calendar */}
            <div className="lg:w-96">
              <CustomCalendar value={selectedDate} onChange={setSelectedDate} tasksByDate={tasksByDate} />
            </div>

            {/* Daily Tasks */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Tasks for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <button
                  onClick={() => {
                    setTaskToEdit({ dueDate: selectedDate.toISOString().split('T')[0] });
                    setShowModal(true);
                  }}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <Plus className="w-4 h-4" /> Add Task
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {dailyTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: 'var(--bg-subtle)' }}
                    >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--text-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No tasks for this date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {dailyTasks.map((task) => (
                      <div
                        key={task._id || task.id}
                        className="group relative rounded-xl p-4 transition-all cursor-pointer"
                        style={{ backgroundColor: 'var(--bg-subtle)' }}
                        onClick={() => {
                          setTaskToEdit(task);
                          setShowModal(true);
                        }}
                      >
                        <TaskItem
                          task={task}
                          showCompleteCheckbox
                          onRefresh={fetchTasks}
                          onLogout={onLogout}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Floating Add Button */}
          <button
            onClick={() => {
              setTaskToEdit({ dueDate: selectedDate.toISOString().split('T')[0] });
              setShowModal(true);
            }}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all z-30"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        onSave={handleTaskSave}
        onLogout={onLogout}
      />
    </div>
  );
};

export default CalendarView;