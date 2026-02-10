// TaskModal.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Edit, Calendar, Flag, Save, X, FileText, PlusCircle, CheckSquare } from 'lucide-react';
import axios from 'axios';
 
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001';
 
const TaskModal = ({ isOpen, onClose, taskToEdit, onSave, onLogout }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'Low',
    dueDate: '',
    checklist: [],
    id: null,
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const today = new Date().toISOString().split('T')[0];
 
  useEffect(() => {
    if (!isOpen) return;
    if (taskToEdit) {
      setTaskData({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        priority: taskToEdit.priority || 'Low',
        dueDate: taskToEdit.dueDate?.split('T')[0] || '',
        checklist: taskToEdit.checklist || [],
        id: taskToEdit._id,
      });
    } else {
      setTaskData({
        title: '',
        description: '',
        priority: 'Low',
        dueDate: '',
        checklist: [],
        id: null,
      });
    }
    setError(null);
  }, [isOpen, taskToEdit]);
 
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({ ...prev, [name]: value }));
  }, []);
 
  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setTaskData((prev) => ({
      ...prev,
      checklist: [...prev.checklist, { item: newChecklistItem, checked: false }],
    }));
    setNewChecklistItem('');
  };
 
  const removeChecklistItem = (index) => {
    setTaskData((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index),
    }));
  };
 
  const updateChecklistItemText = (index, text) => {
    const newList = [...taskData.checklist];
    newList[index].item = text;
    setTaskData((prev) => ({ ...prev, checklist: newList }));
  };

  const toggleChecklistItem = (index) => {
    const newList = [...taskData.checklist];
    newList[index].checked = !newList[index].checked;
    setTaskData((prev) => ({ ...prev, checklist: newList }));
  };
 
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!taskData.title.trim()) {
        setError('Task title is required.');
        return;
      }
      if (taskData.dueDate && taskData.dueDate < today) {
        setError('Due date cannot be in the past.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        onSave?.({
          _id: taskData.id,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          checklist: taskData.checklist,
        });
        onClose();
      } catch (err) {
        console.error('Error saving task:', err);
        setError(err.response?.data?.message || 'Unexpected error occurred');
        if (err.response?.status === 401) onLogout?.();
      } finally {
        setLoading(false);
      }
    },
    [taskData, today, onSave, onClose, onLogout]
  );
 
  // Updated Priority Styles (Blue Theme)
  const priorityStyles = {
    Low: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    Medium: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    High: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
    Urgent: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700', // Optional
  };
 
  if (!isOpen) return null;
 
  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 dark:bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl relative p-6 sm:p-8 border border-blue-200 dark:border-blue-900/50">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            {taskData.id ? <Edit className="w-6 h-6 text-blue-700 dark:text-blue-400" /> : <PlusCircle className="w-6 h-6 text-blue-700 dark:text-blue-400" />}
            {taskData.id ? 'Edit Task' : 'Add Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors duration-300 text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
 
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
 
          {/* Task Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <Edit className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Task Name
            </label>
            <input
              type="text"
              name="title"
              required
              value={taskData.title}
              onChange={handleChange}
              className="w-full border border-blue-200 dark:border-blue-900/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500"
              placeholder="Enter task name"
            />
          </div>
 
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Details
            </label>
            <textarea
              name="description"
              rows="4"
              onChange={handleChange}
              value={taskData.description}
              className="w-full border border-blue-200 dark:border-blue-900/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500"
              placeholder="Describe your task"
            />
          </div>
 
          {/* Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                <Flag className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Priority Level
              </label>
              <select
                name="priority"
                value={taskData.priority}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-sm font-medium ${priorityStyles[taskData.priority] || priorityStyles.Low}`}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
 
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                required
                min={today}
                value={taskData.dueDate}
                onChange={handleChange}
                className="w-full border border-blue-200 dark:border-blue-900/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
 
          {/* Checklist */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-700 dark:text-blue-400" /> Checklist Items
            </label>
            <div className="space-y-2">
              {taskData.checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleChecklistItem(index)}
                    className="h-5 w-5 text-blue-700 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 border-blue-300 dark:border-blue-700 rounded transition-all duration-200"
                  />
                  <input
                    type="text"
                    value={item.item}
                    onChange={(e) => updateChecklistItemText(index, e.target.value)}
                    className="flex-1 border border-blue-200 dark:border-blue-900/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500"
                    placeholder="Item text"
                  />
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(index)}
                    className="p-2 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors duration-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  className="flex-1 border border-blue-200 dark:border-blue-900/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500"
                  placeholder="Add new item"
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="p-3 bg-blue-700 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500 transition-all duration-300 flex items-center justify-center"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
 
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 dark:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-800 dark:hover:bg-blue-500 hover:shadow-lg transition-all duration-300"
          >
            {loading ? (
              'Saving...'
            ) : taskData.id ? (
              <>
                <Save className="w-5 h-5" /> Update Task
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" /> Add Task
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
 
export default TaskModal;