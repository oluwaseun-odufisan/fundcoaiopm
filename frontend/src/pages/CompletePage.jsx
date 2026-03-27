// CompletePage.jsx
import React, { useMemo, useState } from 'react';
import { CheckCircle2, Filter } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import TaskItem from '../components/TaskItem';
import TaskModal from '../components/TaskModal';

const CompletePage = () => {
  const { tasks = [], refreshTasks } = useOutletContext();
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const sortedCompletedTasks = useMemo(() => {
    return tasks
      .filter(task =>
        task.completed === true ||
        task.completed === 1 ||
        (typeof task.completed === 'string' && task.completed.toLowerCase() === 'yes')
      )
      .filter(task => task.title.toLowerCase().includes(search.toLowerCase()) || task.description?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        const order = { high: 3, medium: 2, low: 1 };
        return (order[b.priority?.toLowerCase()] || 0) - (order[a.priority?.toLowerCase()] || 0);
      });
  }, [tasks, sortBy, search]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans">
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex flex-col">
          <header className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 sm:w-7 h-7 text-green-600 dark:text-green-400" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Completed Tasks</h1>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {sortedCompletedTasks.length} task{sortedCompletedTasks.length !== 1 && 's'} done
                </p>
              </div>
            </div>
          </header>

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
                placeholder="Search completed tasks..."
                className="flex-1 border border-blue-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
            {sortedCompletedTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No completed tasks yet</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Finish some tasks to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {sortedCompletedTasks.map((task) => (
                  <div
                    key={task._id || task.id}
                    className="group relative bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200 cursor-default" // NO actions on complete page
                  >
                    <TaskItem
                      task={task}
                      showCompleteCheckbox={false}
                      onRefresh={refreshTasks}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Only view modal - no action modal */}
      <TaskModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedTask(null); refreshTasks?.(); }}
        taskToEdit={selectedTask}
      />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #86EFAC; border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default CompletePage;