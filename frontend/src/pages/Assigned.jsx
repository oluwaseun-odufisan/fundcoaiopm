import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';

const AssignedTasks = ({ tasks }) => {
    const assignedTasks = tasks?.filter((task) => task.assignedBy) || [];

    return (
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-md border border-teal-100/50">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <AlertCircle className="w-6 h-6 text-teal-500" />
                Assigned Tasks
            </h2>
            {assignedTasks.length === 0 ? (
                <div className="text-center py-6">
                    <Clock className="w-10 h-10 mx-auto text-teal-500 animate-pulse" />
                    <p className="text-sm text-gray-600 mt-2">No assigned tasks yet.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {assignedTasks.map((task) => (
                        <li
                            key={task._id || task.id}
                            className="flex items-center justify-between p-3 bg-teal-50/50 rounded-lg hover:bg-teal-100/50 transition-all duration-200"
                        >
                            <div className="flex-1 min-w-0 pr-2">
                                <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Assigned by: {task.assignedBy || 'Unknown'}
                                </p>
                                {task.dueDate && (
                                    <p className="text-xs text-teal-600">
                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    task.completed ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'
                                }`}
                            >
                                {task.completed ? 'Done' : 'Pending'}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AssignedTasks;