// src/components/EditablePPTPreview.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Save, ChevronLeft, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EditablePPTPreview = ({ pptJson, setPptJson, templateStyles }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editingSlide, setEditingSlide] = useState(null);
  const [tempTitle, setTempTitle] = useState('');
  const [tempContent, setTempContent] = useState('');
  // Simulate applying template styles (e.g., color, font)
  const slideStyle = {
    backgroundColor: templateStyles?.colors?.background || 'white',
    color: templateStyles?.colors?.text || 'black',
    fontFamily: templateStyles?.fonts?.body || 'Arial',
  };
  const startEdit = (index) => {
    setEditingSlide(index);
    setTempTitle(pptJson.slides[index].title);
    setTempContent(pptJson.slides[index].content);
    setCurrentSlide(index);
  };
  const saveEdit = () => {
    const newSlides = [...pptJson.slides];
    newSlides[editingSlide].title = tempTitle;
    newSlides[editingSlide].content = tempContent;
    setPptJson({ ...pptJson, slides: newSlides });
    setEditingSlide(null);
    toast.success('Slide updated successfully!');
  };
  const cancelEdit = () => {
    setEditingSlide(null);
  };
  const prevSlide = () => setCurrentSlide(prev => Math.max(0, prev - 1));
  const nextSlide = () => setCurrentSlide(prev => Math.min(pptJson.slides.length - 1, prev + 1));
  if (!pptJson || !pptJson.slides || pptJson.slides.length === 0) {
    return (
      <p className="text-center text-gray-600 dark:text-gray-400">No slides available. Please extract or generate first.</p>
    );
  }
  return (
    <motion.div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Editable Slides Preview (Template Applied)</h3>
      <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-blue-200/50 dark:border-gray-700/50 rounded-xl p-6 min-h-[400px] shadow-sm" style={slideStyle}>
        <motion.div key={currentSlide} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input
              value={editingSlide === currentSlide ? tempTitle : pptJson.slides[currentSlide].title}
              onChange={e => editingSlide === currentSlide ? setTempTitle(e.target.value) : null}
              disabled={editingSlide !== currentSlide}
              className="w-full bg-white dark:bg-gray-700 border border-blue-300/50 dark:border-gray-600/50 rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ fontFamily: templateStyles?.fonts?.title || 'Arial', color: templateStyles?.colors?.title || 'black' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
            <textarea
              value={editingSlide === currentSlide ? tempContent : pptJson.slides[currentSlide].content}
              onChange={e => editingSlide === currentSlide ? setTempContent(e.target.value) : null}
              disabled={editingSlide !== currentSlide}
              className="w-full h-48 bg-white dark:bg-gray-700 border border-blue-300/50 dark:border-gray-600/50 rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed resize-none"
              style={{ fontFamily: templateStyles?.fonts?.body || 'Arial', color: templateStyles?.colors?.text || 'black' }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Layout: {pptJson.slides[currentSlide].layout}</p>
          {editingSlide === currentSlide ? (
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex-1 px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg flex items-center justify-center gap-1 hover:bg-green-600 dark:hover:bg-green-500 transition-all duration-200">
                <Save className="w-4 h-4" /> Save
              </button>
              <button onClick={cancelEdit} className="flex-1 px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg flex items-center justify-center gap-1 hover:bg-red-600 dark:hover:bg-red-500 transition-all duration-200">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => startEdit(currentSlide)} className="w-full px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-1 hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200">
              <Edit2 className="w-4 h-4" /> Edit This Slide
            </button>
          )}
        </motion.div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-8">
          <button onClick={prevSlide} disabled={currentSlide === 0 || editingSlide !== null} className="p-2 rounded-full hover:bg-blue-100/50 dark:hover:bg-blue-900/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronLeft className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </button>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Slide {currentSlide + 1} / {pptJson.slides.length}</span>
          <button onClick={nextSlide} disabled={currentSlide === pptJson.slides.length - 1 || editingSlide !== null} className="p-2 rounded-full hover:bg-blue-100/50 dark:hover:bg-blue-900/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
export default EditablePPTPreview;