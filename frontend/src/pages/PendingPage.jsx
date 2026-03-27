// PendingPage.jsx
import React, { useMemo, useState, useCallback } from 'react';
import { Clock, Filter, ListChecks, Plus, CheckCircle, CheckSquare, Pen, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import TaskItem from '../components/TaskItem';
import TaskModal from '../components/TaskModal';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/tasks`;

// TaskActionModal defined first (prevents any JSX parsing issues)
const TaskActionModal = ({ isOpen, onClose, onAction, task }) => {
  if (!isOpen) return null;
  const isCompleted = task.completed === true || task.completed === 1 || (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes');
  const submissionStatus = task.submissionStatus;

  return (
    <div className="fixed inset-0 bg-gray-950/80 dark:bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-[1000] px-4 sm:px-6">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm border border-blue-200/50 dark:border-gray-700/50 shadow-xl">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 truncate">Task Actions</h3>
        <div className="space-y-2 sm:space-y-3">
          <button
            onClick={() => onAction('complete')}
            disabled={isCompleted}
            className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base transition-all duration-200 ${
              isCompleted 
                ? 'bg-green-200 text-green-700 cursor-not-allowed' 
                : 'bg-green-100/50 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200/70 dark:hover:bg-green-800/70'
            }`}
          >
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> 
            {isCompleted ? '✅ Already Completed' : 'Mark as Done'}
          </button>

          {isCompleted && submissionStatus === 'not_submitted' && (
            <button
              onClick={() => onAction('submit')}
              className="w-full flex items-center gap-2 sm:gap-3 bg-yellow-100/50 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-yellow-200/70 dark:hover:bg-yellow-800/70 transition-all duration-200 text-sm sm:text-base"
            >
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" /> Submit for Approval
            </button>
          )}
          {isCompleted && submissionStatus !== 'not_submitted' && (
            <button
              disabled
              className="w-full flex items-center gap-2 sm:gap-3 bg-gray-100 dark:bg-gray-700 text-gray-500 px-3 sm:px-4 py-2 sm:py-3 rounded-lg cursor-not-allowed text-sm sm:text-base"
            >
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" /> 
              {submissionStatus === 'submitted' ? 'Submitted (Waiting Approval)' : submissionStatus === 'approved' ? 'Approved' : 'Rejected'}
            </button>
          )}

          <button
            onClick={() => onAction('edit')}
            className="w-full flex items-center gap-2 sm:gap-3 bg-blue-100/50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-200/70 dark:hover:bg-blue-800/70 transition-all duration-200 text-sm sm:text-base"
          >
            <Pen className="w-4 h-4 sm:w-5 sm:h-5" /> Edit Task
          </button>
          <button
            onClick={() => onAction('delete')}
            className="w-full flex items-center gap-2 sm:gap-3 bg-red-100/50 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-red-200/70 dark:hover:bg-red-800/70 transition-all duration-200 text-sm sm:text-base"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> Delete Task
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-3 sm:mt-4 w-full text-gray-600 dark:text-gray-400 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const PendingPage = () => {
  const { tasks = [], fetchTasks: refreshTasks, user, onLogout } = useOutletContext();

  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  const sortedPendingTasks = useMemo(() => {
    const filtered = tasks.filter(
      (t) => !t.completed || (typeof t.completed === 'string' && t.completed.toLowerCase() === 'no')
    ).filter(task => 
      task.title.toLowerCase().includes(search.toLowerCase()) || 
      task.description?.toLowerCase().includes(search.toLowerCase())
    );
    return filtered.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      const order = { high: 3, medium: 2, low: 1 };
      return (order[b.priority?.toLowerCase()] || 0) - (order[a.priority?.toLowerCase()] || 0);
    });
  }, [tasks, sortBy, search]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token found');
    return { Authorization: `Bearer ${token}` };
  };

  const handleTaskSave = useCallback(async (taskData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const payload = {
        title: taskData.title?.trim() || "",
        description: taskData.description || "",
        priority: taskData.priority || "Low",
        dueDate: taskData.dueDate || undefined,
        checklist: taskData.checklist || [],
      };

      if (!payload.title) return;

      if (taskData._id) {
        await axios.put(`${API_BASE_URL}/${taskData._id}/gp`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE_URL}/gp`, { ...payload, userId: user?.id || null }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await refreshTasks();
      setShowModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error saving task from Pending page:", error.response?.data || error.message);
      if (error.response?.status === 401) onLogout?.();
    }
  }, [refreshTasks, user, onLogout]);

  const handleComplete = async (task) => {
    try {
      const headers = getAuthHeaders();
      let payload = { completed: 'Yes' };
      if (task.checklist && task.checklist.length > 0) {
        payload = { checklist: task.checklist.map(item => ({ ...item, completed: true })) };
      }
      await axios.put(`${API_BASE_URL}/${task._id}/gp`, payload, { headers });
      await refreshTasks();
      setShowActionModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error marking task as done:', error.response?.data || error.message);
      if (error.response?.status === 401) onLogout?.();
    }
  };

  const handleSubmit = async (task) => {
    try {
      const headers = getAuthHeaders();
      await axios.post(`${API_BASE_URL}/${task._id}/submit`, {}, { headers });
      await refreshTasks();
      setShowActionModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error submitting task:', error.response?.data || error.message);
      if (error.response?.status === 401) onLogout?.();
    }
  };

  const handleDelete = async () => {
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API_BASE_URL}/${selectedTask._id}/gp`, { headers });
      await refreshTasks();
      setShowActionModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error deleting task:', error.response?.data || error.message);
      if (error.response?.status === 401) onLogout?.();
    }
  };

  const handleAction = (action) => {
    if (action === 'complete') handleComplete(selectedTask);
    else if (action === 'submit') handleSubmit(selectedTask);
    else if (action === 'edit') {
      setShowActionModal(false);
      setShowModal(true);
    } else if (action === 'delete') handleDelete();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans">
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex flex-col">
          {/* Header */}
          <header className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <ListChecks className="w-6 h-6 sm:w-7 h-7 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Pending Tasks</h1>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {sortedPendingTasks.length} active task{sortedPendingTasks.length !== 1 && 's'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedTask(null); setShowModal(true); }}
              className="bg-blue-600 dark:bg-blue-700 text-white px-4 sm:px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4 sm:w-5 h-5" /> Add Task
            </button>
          </header>

          {/* Sort & Search */}
          <div className="px-5 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm font-medium text-blue-800 dark:text-blue-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">By Priority</option>
              </select>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pending tasks..."
                className="flex-1 border border-blue-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 text-sm"
              />
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
            {sortedPendingTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">All caught up!</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">No pending tasks.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {sortedPendingTasks.map((task) => (
                  <div
                    key={task._id || task.id}
                    className="group relative bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => { setSelectedTask(task); setShowActionModal(true); }}
                  >
                    <TaskItem
                      task={task}
                      showCompleteCheckbox
                      onRefresh={refreshTasks}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <TaskActionModal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        onAction={handleAction}
        task={selectedTask}
      />

      {/* Edit Modal - with onSave */}
      <TaskModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedTask(null); refreshTasks?.(); }}
        taskToEdit={selectedTask}
        onSave={handleTaskSave}
        onLogout={onLogout}
      />

      {/* Regular style tag (works in Vite) */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #93C5FD; border-radius: 2px; }
        `}
      </style>
    </div>
  );
};

export default PendingPage;