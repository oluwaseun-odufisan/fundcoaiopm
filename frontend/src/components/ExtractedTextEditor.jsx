// src/components/ExtractedTextEditor.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const ExtractedTextEditor = ({ initialText, onSave, title = 'Edit Text' }) => {
  const [text, setText] = useState(initialText);
  const handleSave = () => {
    if (!text.trim()) return toast.error('Text cannot be empty.');
    onSave(text);
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Edit2 className="w-6 h-6 text-blue-600 dark:text-blue-400" /> {title}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Edit the text before proceeding.</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full h-96 bg-white dark:bg-gray-700 border border-blue-300/50 dark:border-gray-600/50 rounded-lg px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition-all duration-200 resize-none custom-scrollbar"
        placeholder="Text will appear here..."
      />
      <button
        onClick={handleSave}
        className="w-full px-4 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200"
      >
        <Save className="w-5 h-5" /> Save & Proceed
      </button>
    </motion.div>
  );
};
export default ExtractedTextEditor;