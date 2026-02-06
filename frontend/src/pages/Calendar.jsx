import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import TaskItem from '../components/TaskItem';
import TaskModal from '../components/TaskModal';
import axios from 'axios';
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/tasks`;
// === Custom Calendar (Simplified) ===
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
      high: 'bg-red-500 dark:bg-red-400',
      medium: 'bg-yellow-600 dark:bg-yellow-400',
      low: 'bg-green-500 dark:bg-green-400',
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
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">+{dayTasks.length - maxDots}</span>
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
    return `rounded-full transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/50 text-center py-2 text-sm font-medium ${
      isSelected ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'text-gray-800 dark:text-gray-200'
    }`;
  };
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ChevronLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </button>
        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center font-medium text-gray-600 dark:text-gray-400 py-1">
            {day}
          </div>
        ))}
        {weeks.flat().map((day, i) => (
          <div
            key={i}
            className={tileClassName(day)}
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
  // Save Task
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans">
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex flex-col">
          {/* === Header === */}
          <header className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
                <p className="text-sm text-blue-600 dark:text-blue-400">View tasks by date</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{currentTime}</span>
              </div>
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=1E40AF&color=fff`}
                alt="Avatar"
                className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700"
              />
            </div>
          </header>
          {/* === Main Content === */}
          <main className="flex-1 flex flex-col lg:flex-row gap-6 p-5 sm:p-6 overflow-hidden">
            {/* Calendar */}
            <div className="lg:w-96">
              <CustomCalendar value={selectedDate} onChange={setSelectedDate} tasksByDate={tasksByDate} />
            </div>
            {/* Daily Tasks */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Tasks for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <button
                  onClick={() => {
                    setTaskToEdit({ dueDate: selectedDate.toISOString().split('T')[0] });
                    setShowModal(true);
                  }}
                  className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Add Task
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {dailyTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">No tasks for this date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {dailyTasks.map((task) => (
                      <div
                        key={task._id || task.id}
                        className="group relative bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          setTaskToEdit(task);
                          setShowModal(true);
                        }}
                      >
                        <div className="pr-8">
                          <TaskItem
                            task={task}
                            showCompleteCheckbox
                            onRefresh={fetchTasks}
                            onEdit={() => {
                              setTaskToEdit(task);
                              setShowModal(true);
                            }}
                            onLogout={onLogout}
                          />
                        </div>
                        {/* Hover Preview — Scrollable */}
                        <div
                          className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none p-4 flex flex-col z-10"
                          style={{ maxHeight: '100%' }}
                        >
                          <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm pb-1">
                              {task.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap mb-2">
                              {task.description || 'No description'}
                            </p>
                            {task.dueDate && (
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
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
            className="fixed bottom-5 right-5 bg-blue-600 dark:bg-blue-700 text-white p-3.5 rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all z-30"
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
      {/* Custom Scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #93C5FD;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #60A5FA;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #93C5FD transparent;
        }
      `}</style>
    </div>
  );
};
// Simple Calendar Icon
const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
export default CalendarView;