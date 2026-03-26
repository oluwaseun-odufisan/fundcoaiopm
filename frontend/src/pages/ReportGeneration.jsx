import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Zap, History, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import ReportEditor from '../components/ReportEditor';
import AIReportPanel from '../components/AIReportPanel';
import ReportHistoryList from '../components/ReportHistoryList';

const ReportGeneration = () => {
  const { user, tasks = [], fetchTasks } = useOutletContext();
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'ai' | 'history'
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
    toast.success('Reports & tasks refreshed');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FileText className="w-9 h-9 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report Generation</h1>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-2xl hover:shadow-md transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-blue-200 dark:border-gray-700 mb-8">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 md:flex-none px-8 py-4 font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'border-b-4 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            Manual Report
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 md:flex-none px-8 py-4 font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ai'
                ? 'border-b-4 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-5 h-5" />
            AI Generate
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 md:flex-none px-8 py-4 font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'border-b-4 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <History className="w-5 h-5" />
            Report History
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'manual' && <ReportEditor user={user} tasks={tasks} />}
          {activeTab === 'ai' && <AIReportPanel user={user} tasks={tasks} />}
          {activeTab === 'history' && <ReportHistoryList user={user} />}
        </div>
      </div>
    </motion.div>
  );
};

export default ReportGeneration;