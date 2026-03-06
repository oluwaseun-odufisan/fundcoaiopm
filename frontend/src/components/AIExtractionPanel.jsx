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
      <h2 className="text-xl font-bold flex items-center gap-2"><Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Meaningful Extraction Prompt</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Customize the prompt for Grok AI to extract meaningful information from the full text.</p>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-transparent resize-none"
        placeholder="e.g., Extract key points, summaries, tables, and insights..."
      />
      <button
        onClick={handleExtract}
        disabled={isExtracting}
        className="w-full p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60"
      >
        {isExtracting ? <Loader2 className="animate-spin" /> : <Zap />} Perform Meaningful Extraction
      </button>
    </motion.div>
  );
};

export default AIExtractionPanel;