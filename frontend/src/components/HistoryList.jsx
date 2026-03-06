// src/components/HistoryList.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';

const HistoryList = ({ histories, onSelect }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2"><HistoryIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Full Conversion History</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">View and select past conversions.</p>
      {histories.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No history yet.</p>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
          {histories.map(hist => (
            <motion.div
              key={hist._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 border rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onSelect(hist)}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium">{hist.originalFileId?.fileName || 'Untitled'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(hist.createdAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
              <Eye className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default HistoryList;