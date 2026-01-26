import React, { useMemo, useState } from 'react';
import { CheckCircle2, Filter } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import TaskItem from '../components/TaskItem';
import TaskModal from '../components/TaskModal';

const CompletePage = () => {
  const { tasks = [], refreshTasks } = useOutletContext();
  const [sortBy, setSortBy] = useState('newest');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const sortedCompletedTasks = useMemo(() => {
    return tasks
      .filter(task =>
        task.completed === true ||
        task.completed === 1 ||
        (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')
      )
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'priority') {
          const order = { high: 3, medium: 2, low: 1 };
          return (order[b.priority?.toLowerCase()] || 0) - (order[a.priority?.toLowerCase()] || 0);
        }
        return 0;
      });
  }, [tasks, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* === Main Container === */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-sm flex flex-col">

          {/* === Header === */}
          <header className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 sm:w-7 h-7 text-green-600" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Completed Tasks</h1>
                <p className="text-sm text-green-600">
                  {sortedCompletedTasks.length} task{sortedCompletedTasks.length !== 1 && 's'} done
                </p>
              </div>
            </div>
          </header>

          {/* === Sort Controls === */}
          <div className="px-5 sm:px-6 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-blue-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm font-medium text-blue-800 bg-white border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">By Priority</option>
              </select>
            </div>
          </div>

          {/* === Task List — Hover Preview with Scroll === */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
            {sortedCompletedTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No completed tasks yet</h3>
                <p className="text-sm text-gray-600">Finish some tasks to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {sortedCompletedTasks.map((task) => (
                  <div
                    key={task._id || task.id}
                    className="group relative bg-gray-50 rounded-xl p-4 hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => { setSelectedTask(task); setShowModal(true); }}
                  >
                    {/* Task Item */}
                    <div className="pr-8">
                      <TaskItem
                        task={task}
                        showCompleteCheckbox={false}
                        onRefresh={refreshTasks}
                        onEdit={() => { setSelectedTask(task); setShowModal(true); }}
                      />
                    </div>

                    {/* === SCROLLABLE HOVER PREVIEW === */}
                    <div
                      className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none p-4 flex flex-col z-10"
                      style={{ maxHeight: '100%' }}
                    >
                      <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar">
                        <h3 className="font-semibold text-gray-900 mb-2 sticky top-0 bg-white/95 backdrop-blur-sm pb-1">
                          {task.title}
                        </h3>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap mb-2">
                          {task.description || 'No description'}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-green-600">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        <p className="text-xs text-green-600 mt-1">
                          Completed: {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* === Task Modal === */}
          <TaskModal
            isOpen={!!selectedTask || showModal}
            onClose={() => { setShowModal(false); setSelectedTask(null); refreshTasks(); }}
            taskToEdit={selectedTask}
          />
        </div>
      </div>

      {/* === Custom Scrollbar for Hover === */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #86EFAC;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #22C55E;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #86EFAC transparent;
        }
      `}</style>
    </div>
  );
};

export default CompletePage;