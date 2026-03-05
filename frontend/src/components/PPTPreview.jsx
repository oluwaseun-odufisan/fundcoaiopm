// src/components/PPTPreview.jsx
import React, { useState } from 'react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';


const PPTPreview = ({ pptJson }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!pptJson || !pptJson.slides?.length) return <p className="text-center text-gray-500 dark:text-gray-400">No slides generated.</p>;

  const prevSlide = () => setCurrentSlide(prev => Math.max(0, prev - 1));
  const nextSlide = () => setCurrentSlide(prev => Math.min(pptJson.slides.length - 1, prev + 1));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2"><Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" /> PPT Preview</h2>
      <div className="relative p-6 bg-white dark:bg-gray-800 border rounded-lg shadow-inner min-h-64">
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2">{pptJson.slides[currentSlide].title}</h3>
          <p className="text-sm">{pptJson.slides[currentSlide].content}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Layout: {pptJson.slides[currentSlide].layout}</p>
        </div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4">
          <button onClick={prevSlide} disabled={currentSlide === 0} className="p-2 disabled:opacity-50">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span>{currentSlide + 1} / {pptJson.slides.length}</span>
          <button onClick={nextSlide} disabled={currentSlide === pptJson.slides.length - 1} className="p-2 disabled:opacity-50">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PPTPreview;