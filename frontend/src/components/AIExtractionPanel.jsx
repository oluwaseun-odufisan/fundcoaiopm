// src/components/AIExtractionPanel.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AIExtractionPanel = ({ onExtract, prompt, setPrompt }) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const handleExtract = async () => {
    if (!prompt.trim()) return toast.error('Prompt cannot be empty.');
    setIsExtracting(true);
    try {
      await onExtract();
    } catch {
      toast.error('Extraction failed.');
    } finally {
      setIsExtracting(false);
    }
  };
  return (
    <motion.div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Meaningful Extraction Prompt</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Customize the prompt for Grok AI to extract meaningful information from the full text.</p>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        className="w-full h-32 bg-white dark:bg-gray-700 border border-blue-300/50 dark:border-gray-600/50 rounded-lg px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition-all duration-200 resize-none"
        placeholder="e.g., Extract key points, summaries, tables, and insights..."
      />
      <button
        onClick={handleExtract}
        disabled={isExtracting}
        className="w-full px-4 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200 disabled:opacity-60"
      >
        {isExtracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />} Perform Meaningful Extraction
      </button>
    </motion.div>
  );
};
export default AIExtractionPanel;