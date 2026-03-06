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
      <h2 className="text-xl font-bold flex items-center gap-2"><Edit2 className="w-6 h-6 text-blue-600 dark:text-blue-400" /> {title}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Edit the text before proceeding.</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full h-96 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-transparent resize-none scrollbar-thin"
        placeholder="Text will appear here..."
      />
      <button
        onClick={handleSave}
        className="w-full p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600"
      >
        <Save className="w-5 h-5" /> Save & Proceed
      </button>
    </motion.div>
  );
};

export default ExtractedTextEditor;