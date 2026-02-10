// TaskItem.jsx
import React, { useEffect, useState } from 'react';
import { CalendarHeart, CheckCircle2, Clock, MoreVertical } from 'lucide-react';
import axios from 'axios';
import { format, isToday } from 'date-fns';
import TaskModal from './TaskModal';
 
const API_BASE = 'http://localhost:4000/api/tasks';
 
const TaskItem = ({ task, onRefresh, showCompleteCheckbox = true, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isCompleted, setIsCompleted] = useState(
    [true, 1, 'yes'].includes(
      typeof task.completed === 'string' ? task.completed.toLowerCase() : task.completed
    )
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
 
  useEffect(() => {
    setIsCompleted(
      [true, 1, 'yes'].includes(
        typeof task.completed === 'string' ? task.completed.toLowerCase() : task.completed
      )
    );
  }, [task.completed]);
 
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("No auth token found");
    return { Authorization: `Bearer ${token}` };
  };
 
  // Updated Priority Colors (Blue/Green Theme)
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'border-blue-700 dark:border-blue-400';
      case 'high': return 'border-indigo-600 dark:border-indigo-400';
      case 'medium': return 'border-amber-600 dark:border-amber-400';
      case 'low': return 'border-gray-500 dark:border-gray-400';
      default: return 'border-gray-500 dark:border-gray-400';
    }
  };
 
  const getPriorityBadgeColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
      case 'high': return 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300';
      case 'medium': return 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300';
      case 'low': return 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300';
    }
  };
 
  const borderColor = isCompleted ? "border-green-700 dark:border-green-400" : getPriorityColor(task.priority);
 
  const handleComplete = async () => {
    const newStatus = isCompleted ? 'No' : 'Yes';
    try {
      await axios.put(`${API_BASE}/${task._id}/gp`, { completed: newStatus }, { headers: getAuthHeaders() });
      setIsCompleted(!isCompleted);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) onLogout?.();
    }
  };
 
  const handleAction = (action) => {
    setShowMenu(false);
    if (action === 'edit') setShowEditModal(true);
    if (action === 'delete') handleDelete();
  };
 
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/${task._id}/gp`, { headers: getAuthHeaders() });
      onRefresh?.();
    } catch (err) {
      if (err.response?.status === 401) onLogout?.();
    }
  };
 
  const handleSave = async (updateTask) => {
    try {
      const payload = (({ title, description, priority, dueDate, checklist }) => (
        { title, description, priority, dueDate, checklist }
      ))(updateTask);
      await axios.put(`${API_BASE}/${task._id}/gp`, payload, { headers: getAuthHeaders() });
      setShowEditModal(false);
      onRefresh?.();
    } catch (err) {
      if (err.response?.status === 401) onLogout?.();
    }
  };
 
  const progress = task.checklist.length ? (task.checklist.filter(st => st.checked).length / task.checklist.length) * 100 : 0;
 
  const MENU_OPTIONS = [
    { action: 'edit', label: 'Edit Task', icon: <CalendarHeart className='w-4 h-4 text-gray-600 dark:text-gray-400' /> },
    { action: 'delete', label: 'Delete Task', icon: <Clock className='w-4 h-4 text-red-600 dark:text-red-400' /> },
  ];
 
  return (
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 flex justify-between gap-2 sm:gap-4 shadow-md border-l-4 ${borderColor} transition-all duration-200`}>
        <div className='flex gap-2 sm:gap-3 flex-1 min-w-0'>
          {showCompleteCheckbox && (
            <button
              onClick={handleComplete}
              className={`flex-shrink-0 p-1 ${isCompleted ? 'text-green-700 dark:text-green-400' : 'text-gray-300 dark:text-gray-600'} hover:text-green-700 dark:hover:text-green-300 transition-colors duration-200`}
            >
              <CheckCircle2
                size={18}
                className={`w-5 h-5 sm:w-6 sm:h-6 ${isCompleted ? 'fill-green-700 dark:fill-green-400' : ''}`}
              />
            </button>
          )}
          <div className='flex-1 min-w-0'>
            <div className='flex items-baseline gap-2 mb-1 flex-wrap'>
              <h3 className={`text-sm sm:text-base font-medium truncate ${isCompleted ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                {task.title}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
            {task.description && (
              <p className='text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate'>{task.description}</p>
            )}
            {task.checklist && task.checklist.length > 0 && (
              <div className="mt-2">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 dark:bg-green-400 h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {Math.round(progress)}% complete ({task.checklist.filter(i => i.checked).length}/{task.checklist.length})
                </p>
              </div>
            )}
          </div>
        </div>
 
        <div className='flex items-center gap-2 sm:gap-3'>
          {/* Dropdown Menu */}
          <div className='relative'>
            <button
              data-testid="dropdown-button"
              onClick={() => setShowMenu(!showMenu)}
              className='p-1 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full transition-colors duration-200'
            >
              <MoreVertical className='w-4 h-4 sm:w-5 h-5' />
            </button>
            {showMenu && (
              <div
                data-testid="dropdown-menu"
                className='absolute top-8 right-0 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-blue-200 dark:border-blue-900/50 z-50 overflow-hidden'
              >
                {MENU_OPTIONS.map(opt => (
                  <button
                    key={opt.action}
                    data-testid={`${opt.action}-button`}
                    onClick={() => handleAction(opt.action)}
                    className='w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-blue-50 dark:hover:bg-blue-900/50 flex items-center gap-2 transition-colors duration-200 text-gray-800 dark:text-gray-200'
                  >
                    {opt.icon}{opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
 
          {/* Due Date & Created At */}
          <div>
            <div className={`flex items-center gap-1 text-xs sm:text-sm ${task.dueDate && isToday(new Date(task.dueDate)) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
              <CalendarHeart className='w-3.5 h-3.5' />
              {task.dueDate
                ? (isToday(new Date(task.dueDate)) ? 'Today' : format(new Date(task.dueDate), 'MMM dd'))
                : '-'}
            </div>
            <div className='flex items-center gap-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1'>
              <Clock className='w-3 h-3 sm:w-3.5 sm:h-3.5' />
              {task.createdAt
                ? `Created ${format(new Date(task.createdAt), 'MMM dd')}`
                : 'No date'}
            </div>
          </div>
        </div>
      </div>
 
      {/* Edit Modal */}
      <TaskModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        taskToEdit={task}
        onSave={handleSave}
      />
    </>
  );
};
 
export default TaskItem;