// components/TaskItem.jsx
import React, { useEffect, useState } from 'react';
import { CalendarHeart, X, CheckCircle2, Clock, MoreVertical, CheckSquare, Check } from 'lucide-react';
import axios from 'axios';
import { format, isToday } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/tasks` 
  : 'http://localhost:4000/api/tasks';

const TaskItem = ({ task, onRefresh, showCompleteCheckbox = true, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isCompleted, setIsCompleted] = useState(
    [true, 1, 'yes'].includes(
      typeof task.completed === 'string' ? task.completed.toLowerCase() : task.completed
    )
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  // Hover popup state
  const [showHoverPopup, setShowHoverPopup] = useState(false);

  const progress = task.checklist?.length
    ? (task.checklist.filter(st => st.completed).length / task.checklist.length) * 100
    : isCompleted ? 100 : 0;

  const label = task.submissionStatus === 'submitted' ? 'Submitted' : task.submissionStatus === 'approved' ? 'Approved' : task.submissionStatus === 'rejected' ? 'Rejected' : '';
  const labelColor = task.submissionStatus === 'approved' ? 'bg-green-100 text-green-700' : task.submissionStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
  const appealLabel = task.appealStatus === 'rejected' ? 'Rejected' : task.appealStatus === 'accepted' ? 'Accepted' : '';
  const appealColor = task.appealStatus === 'accepted' ? 'bg-green-100 text-green-700' : task.appealStatus === 'rejected' ? 'bg-red-100 text-red-700' : '';

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
      case 'urgent': return 'bg-blue-100/50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
      case 'high': return 'bg-indigo-100/50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300';
      case 'medium': return 'bg-amber-100/50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300';
      case 'low': return 'bg-gray-100/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300';
    }
  };

  const borderColor = isCompleted ? "border-green-700 dark:border-green-400" : getPriorityColor(task.priority);

  const handleComplete = async () => {
    const newCompleted = !isCompleted;
    try {
      const payload = newCompleted
        ? (task.checklist?.length > 0 ? { checklist: task.checklist.map(item => ({ ...item, completed: true })) } : { completed: 'Yes' })
        : (task.checklist?.length > 0 ? { checklist: task.checklist.map(item => ({ ...item, completed: false })) } : { completed: 'No' });
      await axios.put(`${API_BASE}/${task._id}/gp`, payload, { headers: getAuthHeaders() });
      setIsCompleted(newCompleted);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) onLogout?.();
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      await axios.post(`${API_BASE}/${task._id}/submit`, {}, { headers: getAuthHeaders() });
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
    if (action === 'checklist') setShowChecklistModal(true);
    if (action === 'submit') handleSubmitForApproval();
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

  const MENU_OPTIONS = [
    { action: 'edit', label: 'Edit Task', icon: <CalendarHeart className='w-4 h-4 text-gray-600 dark:text-gray-400' /> },
    { action: 'checklist', label: 'Update Checklist', icon: <CheckSquare className='w-4 h-4 text-blue-600 dark:text-blue-400' /> },
    ...(isCompleted && task.submissionStatus === 'not_submitted' ? [{ action: 'submit', label: 'Submit for Approval', icon: <Check className='w-4 h-4 text-green-600 dark:text-green-400' /> }] : []),
    { action: 'delete', label: 'Delete Task', icon: <Clock className='w-4 h-4 text-red-600 dark:text-red-400' /> },
  ];

  return (
    <>
      {/* Main Task Card - now relative for overlay positioning */}
      <div 
        className={`bg-white/95 dark:bg-gray-800/95 rounded-3xl p-5 flex justify-between gap-4 shadow-lg border-l-4 ${borderColor} transition-all duration-300 hover:shadow-2xl relative`}
        onMouseEnter={() => setShowHoverPopup(true)}
        onMouseLeave={() => setShowHoverPopup(false)}
      >
        <div className='flex gap-4 flex-1 min-w-0'>
          {showCompleteCheckbox && (
            <button
              onClick={handleComplete}
              className={`flex-shrink-0 p-2 ${isCompleted ? 'text-green-700 dark:text-green-300' : 'text-gray-300 dark:text-gray-600'} hover:text-green-700 dark:hover:text-green-300 transition-colors duration-200`}
            >
              <CheckCircle2
                size={26}
                className={`w-7 h-7 sm:w-8 sm:h-8 ${isCompleted ? 'fill-green-700 dark:fill-green-300' : ''}`}
              />
            </button>
          )}
          <div className='flex-1 min-w-0'>
            <div className='flex items-baseline gap-3 mb-3 flex-wrap'>
              <h3 className={`text-base font-semibold truncate ${isCompleted ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                {task.title}
              </h3>
              <span className={`px-4 py-1 rounded-3xl text-sm font-medium ${getPriorityBadgeColor(task.priority)}`}>
                {task.priority}
              </span>
              {label && <span className={`px-4 py-1 rounded-3xl text-sm font-medium ${labelColor}`}>{label}</span>}
              {appealLabel && <span className={`px-4 py-1 rounded-3xl text-sm font-medium ${appealColor}`}>{appealLabel}</span>}
            </div>
            {task.description && (
              <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-2'>{task.description}</p>
            )}
            <div className="mt-4 bg-gray-100 dark:bg-gray-700 rounded-3xl h-3">
              <div className="bg-blue-600 dark:bg-blue-400 h-3 rounded-3xl" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{Math.round(progress)}% complete</span>
          </div>
        </div>

        <div className='flex flex-col items-end justify-between'>
          <div className='relative'>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className='p-3 text-gray-500 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-2xl transition-all duration-200'
            >
              <MoreVertical className='w-5 h-5' />
            </button>
            {showMenu && (
              <div className='absolute top-12 right-0 w-52 bg-white/95 dark:bg-gray-800/95 rounded-3xl shadow-2xl border border-blue-100 dark:border-gray-700 z-50 py-2'>
                {MENU_OPTIONS.map(opt => (
                  <button
                    key={opt.action}
                    onClick={() => handleAction(opt.action)}
                    className='w-full px-6 py-4 text-left text-base hover:bg-blue-50 dark:hover:bg-blue-900/50 flex items-center gap-3 transition-all duration-200 text-gray-900 dark:text-gray-100'
                  >
                    {opt.icon}{opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className='text-right'>
            <div className={`flex items-center gap-2 text-sm ${task.dueDate && isToday(new Date(task.dueDate)) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
              <CalendarHeart className='w-4 h-4' />
              {task.dueDate ? (isToday(new Date(task.dueDate)) ? 'Today' : format(new Date(task.dueDate), 'MMM dd')) : '-'}
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2'>
              <Clock className='w-4 h-4' />
              {task.createdAt ? `Created ${format(new Date(task.createdAt), 'MMM dd')}` : 'No date'}
            </div>
          </div>
        </div>

                {/* ==================== HOVER POPUP - EXACTLY ON THE TASK ==================== */}
        {showHoverPopup && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto custom-scrollbar flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-semibold text-xl text-gray-900 dark:text-gray-100 truncate pr-4">{task.title}</h4>
              <span className={`px-4 py-1 text-sm font-medium rounded-3xl ${getPriorityBadgeColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            {/* Full Description */}
            <div className="flex-1 mb-6 overflow-y-auto">
              <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {task.description || 'No description provided.'}
              </p>
            </div>

            {/* Checklist */}
            {task.checklist && task.checklist.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest font-medium text-gray-500 dark:text-gray-400">
                  <CheckSquare className="w-4 h-4" />
                  Checklist
                </div>
                <ul className="space-y-3">
                  {task.checklist.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 mt-px flex-shrink-0 ${item.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`} />
                      <span className={`text-base ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer dates */}
            <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <div>Created • {task.createdAt ? format(new Date(task.createdAt), 'MMM dd, yyyy') : '—'}</div>
              <div>Due • {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No due date'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Existing Modals */}
      {showEditModal && (
        <TaskModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          taskToEdit={task}
          onSave={handleSave}
          onLogout={onLogout}
        />
      )}
      {showChecklistModal && (
        <ChecklistModal
          isOpen={showChecklistModal}
          onClose={() => setShowChecklistModal(false)}
          task={task}
        />
      )}
    </>
  );
};

export default TaskItem;