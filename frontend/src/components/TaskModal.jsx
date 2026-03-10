// TaskModal.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Edit, Calendar, CheckSquare, Flag, Save, X, FileText, PlusCircle } from 'lucide-react';
import axios from 'axios';
 
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001';
 
const TaskModal = ({ isOpen, onClose, taskToEdit, onSave, onLogout }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'Low',
    dueDate: '',
    id: null,
  });
  const [checklist, setChecklist] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const isApproved = taskToEdit?.submissionStatus === 'approved';
 
  useEffect(() => {
    if (!isOpen) return;
    if (taskToEdit) {
      setTaskData({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        priority: taskToEdit.priority || 'Low',
        dueDate: taskToEdit.dueDate?.split('T')[0] || '',
        id: taskToEdit._id,
      });
      setChecklist(taskToEdit.checklist?.map(item => ({ ...item })) || []);
    } else {
      setTaskData({
        title: '',
        description: '',
        priority: 'Low',
        dueDate: '',
        id: null,
      });
      setChecklist([]);
    }
    setError(null);
  }, [isOpen, taskToEdit]);
 
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({ ...prev, [name]: value }));
  }, []);
 
  const handleAddItem = () => {
    if (newItem.trim()) {
      setChecklist([...checklist, { text: newItem.trim(), completed: false }]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (idx) => {
    setChecklist(checklist.filter((_, i) => i !== idx));
  };

  const handleToggleItem = (idx) => {
    const newList = [...checklist];
    newList[idx].completed = !newList[idx].completed;
    setChecklist(newList);
  };

  const handleChecklistChange = (idx, value) => {
    const newList = [...checklist];
    newList[idx].text = value;
    setChecklist(newList);
  };
 
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!taskData.title.trim()) {
        setError('Task title is required.');
        return;
      }
      if (taskData.dueDate && taskData.dueDate < today && !taskData.id) {
        setError('Due date cannot be in the past for new tasks.');
        return;
      }
      const validChecklist = checklist.filter(item => item.text.trim() !== '');
      setLoading(true);
      setError(null);
      try {
        onSave?.({
          _id: taskData.id,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          checklist: validChecklist,
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
    [taskData, checklist, onSave, onClose, onLogout, today]
  );
 
  // Updated Priority Styles (Blue Theme)
  const priorityStyles = {
    Low: 'bg-gray-50 text-gray-700 border-gray-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    High: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Urgent: 'bg-blue-50 text-blue-700 border-blue-200', // Optional
  };
 
  if (!isOpen) return null;
 
  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative p-6 sm:p-8 border border-blue-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            {taskData.id ? <Edit className="w-6 h-6 text-blue-700" /> : <PlusCircle className="w-6 h-6 text-blue-700" />}
            {taskData.id ? 'Edit Task' : 'Add Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-50 rounded-full transition-colors duration-300 text-gray-600 hover:text-blue-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
 
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
 
          {/* Task Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Edit className="w-4 h-4 text-blue-700" /> Task Name
            </label>
            <input
              type="text"
              name="title"
              required
              value={taskData.title}
              onChange={handleChange}
              className="w-full border border-blue-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500"
              placeholder="Enter task name"
              disabled={isApproved}
            />
          </div>
 
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" /> Details
            </label>
            <textarea
              name="description"
              rows="4"
              onChange={handleChange}
              value={taskData.description}
              className="w-full border border-blue-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none bg-white text-gray-800 placeholder-gray-500"
              placeholder="Describe your task"
              disabled={isApproved}
            />
          </div>
 
          {/* Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Flag className="w-4 h-4 text-blue-700" /> Priority Level
              </label>
              <select
                name="priority"
                value={taskData.priority}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-sm font-medium ${priorityStyles[taskData.priority] || priorityStyles.Low}`}
                disabled={isApproved}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
 
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-700" /> Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                min={taskData.id ? undefined : today}
                value={taskData.dueDate}
                onChange={handleChange}
                className="w-full border border-blue-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800"
                disabled={isApproved}
              />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-700" /> Checklist
            </label>
            <ul className="space-y-2 mb-4">
              {checklist.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleItem(idx)}
                    className="h-5 w-5 text-blue-700 focus:ring-blue-500 border-blue-300 rounded transition-all duration-200"
                    disabled={isApproved}
                  />
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleChecklistChange(idx, e.target.value)}
                    className="flex-1 border border-blue-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500"
                    disabled={isApproved}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-red-600 hover:text-red-800 text-sm"
                    disabled={isApproved}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {!isApproved && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    className="flex-1 border border-blue-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500"
                    placeholder="New checklist item"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-800 hover:shadow-lg transition-all duration-300"
                  >
                    Add
                  </button>
                </div>
            )}
          </div>
 
          {/* Submit Button */}
          {!isApproved && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-800 hover:shadow-lg transition-all duration-300"
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
          )}
        </form>
      </div>
    </div>
  );
};
 
export default TaskModal;