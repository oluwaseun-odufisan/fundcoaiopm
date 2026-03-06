// src/components/HistoryList.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';

const HistoryList = ({ histories, onSelect }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><HistoryIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Full Conversion History</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">View and select past conversions.</p>
      {histories.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">No history yet.</p>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
          {histories.map(hist => (
            <motion.div
              key={hist._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/95 dark:bg-gray-800/95 border border-blue-200/50 dark:border-gray-700/50 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:shadow-md transition-all duration-200"
              onClick={() => onSelect(hist)}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">{hist.originalFileId?.fileName || 'Untitled'}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{format(new Date(hist.createdAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
              <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
export default HistoryList;