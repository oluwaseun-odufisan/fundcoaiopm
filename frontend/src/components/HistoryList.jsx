// src/components/HistoryList.jsx
import React from 'react';
import { HistoryIcon, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const HistoryList = ({ histories, onSelect }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2"><HistoryIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Conversion History</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">View past document conversions and PPT generations.</p>
      {histories.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No history yet.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
          {histories.map(hist => (
            <div key={hist._id} className="p-4 border rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium">{hist.originalFileId?.fileName || 'Untitled'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(hist.createdAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
              <button onClick={() => onSelect(hist)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                <Eye className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default HistoryList;