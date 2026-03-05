// src/components/AIExtractionPanel.js
import React, { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const AIExtractionPanel = ({ onExtract }) => {
  const [extractionPrompt, setExtractionPrompt] = useState('Extract meaningful content from the PDF.');
  const [isExtracting, setIsExtracting] = useState(false);

  const handleClick = async () => {
    setIsExtracting(true);
    try {
      await onExtract(extractionPrompt);
    } catch {
      toast.error('Extraction failed.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2"><Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" /> AI Extraction Panel</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Customize the extraction prompt and trigger AI to process the PDF.</p>
      <input
        value={extractionPrompt}
        onChange={e => setExtractionPrompt(e.target.value)}
        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-transparent"
        placeholder="Extraction prompt..."
      />
      <button
        onClick={handleClick}
        disabled={isExtracting}
        className="w-full p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60"
      >
        {isExtracting ? <Loader2 className="animate-spin" /> : <Zap />} Extract Content
      </button>
    </motion.div>
  );
};

export default AIExtractionPanel;