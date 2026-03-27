// components/TaskModal.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Edit, Calendar, CheckSquare, Flag, Save, X, FileText, PlusCircle, ListChecks } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001';

const TaskModal = ({ isOpen, onClose, taskToEdit, onSave, onLogout, isReadOnly = false }) => {
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
            if (isReadOnly) return;
            if (!taskData.title.trim()) {
                setError('Task title is required.');
                return;
            }
            // Client-side creation validation only (backend enforces the rest)
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
        [taskData, checklist, onSave, onClose, onLogout, today, isReadOnly]
    );

    const priorityStyles = {
        Low: 'bg-gray-50 text-gray-700 border-gray-200',
        Medium: 'bg-amber-50 text-amber-700 border-amber-200',
        High: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 z-[1100] flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl relative p-8 border border-blue-200 max-h-[92vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 border-b pb-6">
                    <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-4">
                        {taskData.id ? <Edit className="w-8 h-8 text-blue-700" /> : <PlusCircle className="w-8 h-8 text-blue-700" />}
                        {isReadOnly ? 'Task Details' : taskData.id ? 'Edit Task' : 'Add New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-blue-50 rounded-2xl transition-colors duration-300 text-gray-600 hover:text-blue-700"
                    >
                        <X className="w-7 h-7" />
                    </button>
                </div>

                {/* Form / View */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                    {error && (
                        <div className="text-sm text-red-700 bg-red-50 p-4 rounded-2xl border border-red-200 flex items-center gap-3">
                            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Task Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Edit className="w-5 h-5 text-blue-700" /> Task Name
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={taskData.title}
                            onChange={handleChange}
                            className="w-full border border-blue-200 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 text-lg"
                            placeholder="Enter task name"
                            disabled={isApproved || isReadOnly}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-700" /> Full Description
                        </label>
                        <textarea
                            name="description"
                            rows="5"
                            onChange={handleChange}
                            value={taskData.description}
                            className="w-full border border-blue-200 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none bg-white text-gray-800 placeholder-gray-500 text-base"
                            placeholder="Describe your task in detail"
                            disabled={isApproved || isReadOnly}
                        />
                    </div>

                    {/* Priority & Due Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Flag className="w-5 h-5 text-blue-700" /> Priority Level
                            </label>
                            <select
                                name="priority"
                                value={taskData.priority}
                                onChange={handleChange}
                                className={`w-full border rounded-2xl px-6 py-5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-base font-medium ${priorityStyles[taskData.priority] || priorityStyles.Low}`}
                                disabled={isApproved || isReadOnly}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-700" /> Due Date
                            </label>
                            <input
                                type="date"
                                name="dueDate"
                                min={taskData.id || isReadOnly ? undefined : today}
                                value={taskData.dueDate}
                                onChange={handleChange}
                                className="w-full border border-blue-200 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 text-base"
                                disabled={isApproved || isReadOnly}
                            />
                            {taskData.id && !isReadOnly && (
                                <p className="text-xs text-blue-500 mt-2">You can set any date on/after creation date</p>
                            )}
                        </div>
                    </div>

                    {/* Checklist */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-blue-700" /> Checklist
                        </label>
                        <div className="bg-gray-50 border border-blue-100 rounded-3xl p-5 max-h-72 overflow-y-auto custom-scrollbar">
                            {checklist.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">No checklist items yet</p>
                            ) : (
                                <ul className="space-y-4">
                                    {checklist.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-4 bg-white rounded-2xl p-4 shadow-sm">
                                            <input
                                                type="checkbox"
                                                checked={item.completed}
                                                onChange={() => handleToggleItem(idx)}
                                                className="mt-1 h-6 w-6 text-blue-700 focus:ring-blue-500 border-blue-300 rounded-xl"
                                                disabled={isApproved || isReadOnly}
                                            />
                                            <input
                                                type="text"
                                                value={item.text}
                                                onChange={(e) => handleChecklistChange(idx, e.target.value)}
                                                className="flex-1 border-0 bg-transparent focus:ring-0 text-base text-gray-800 placeholder-gray-400"
                                                disabled={isApproved || isReadOnly}
                                            />
                                            {!isApproved && !isReadOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {!isApproved && !isReadOnly && (
                            <div className="flex gap-3 mt-6">
                                <input
                                    type="text"
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    className="flex-1 border border-blue-200 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500"
                                    placeholder="Add new checklist item..."
                                />
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="bg-blue-700 text-white font-semibold py-5 px-8 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-800 hover:shadow-lg transition-all duration-300"
                                >
                                    <PlusCircle className="w-6 h-6" /> Add
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    {!isApproved && !isReadOnly && (
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-700 text-white font-semibold py-6 px-8 rounded-3xl flex items-center justify-center gap-4 disabled:opacity-60 hover:bg-blue-800 hover:shadow-2xl transition-all duration-300 text-xl"
                        >
                            {loading ? (
                                'Saving changes...'
                            ) : taskData.id ? (
                                <>
                                    <Save className="w-7 h-7" /> Update Task
                                </>
                            ) : (
                                <>
                                    <PlusCircle className="w-7 h-7" /> Create Task
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