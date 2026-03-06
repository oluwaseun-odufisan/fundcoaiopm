// src/components/EditablePPTPreview.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Save, ChevronLeft, ChevronRight } from 'lucide-react';

const EditablePPTPreview = ({ pptJson, setPptJson }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editingSlide, setEditingSlide] = useState(null);
  const [tempTitle, setTempTitle] = useState('');
  const [tempContent, setTempContent] = useState('');

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
    toast.success('Slide updated!');
  };

  const cancelEdit = () => setEditingSlide(null);

  const prevSlide = () => setCurrentSlide(prev => Math.max(0, prev - 1));
  const nextSlide = () => setCurrentSlide(prev => Math.min(pptJson.slides.length - 1, prev + 1));

  return (
    <motion.div className="space-y-4">
      <h3 className="text-lg font-semibold">Editable Slides</h3>
      <div className="relative bg-white dark:bg-gray-800 border rounded-lg p-6 min-h-[400px]">
        <motion.div key={currentSlide} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              value={editingSlide === currentSlide ? tempTitle : pptJson.slides[currentSlide].title}
              onChange={e => editingSlide === currentSlide ? setTempTitle(e.target.value) : null}
              disabled={editingSlide !== currentSlide}
              className="w-full p-2 border rounded bg-transparent disabled:opacity-70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Content</label>
            <textarea
              value={editingSlide === currentSlide ? tempContent : pptJson.slides[currentSlide].content}
              onChange={e => editingSlide === currentSlide ? setTempContent(e.target.value) : null}
              disabled={editingSlide !== currentSlide}
              className="w-full h-48 p-2 border rounded bg-transparent disabled:opacity-70 resize-none"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Layout: {pptJson.slides[currentSlide].layout}</p>
          {editingSlide === currentSlide ? (
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex-1 p-2 bg-green-600 text-white rounded flex items-center justify-center gap-1">
                <Save className="w-4 h-4" /> Save
              </button>
              <button onClick={cancelEdit} className="flex-1 p-2 bg-gray-600 text-white rounded flex items-center justify-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => startEdit(currentSlide)} className="w-full p-2 bg-blue-600 text-white rounded flex items-center justify-center gap-1">
              <Edit2 className="w-4 h-4" /> Edit Slide
            </button>
          )}
        </motion.div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-8">
          <button onClick={prevSlide} disabled={currentSlide === 0 || editingSlide !== null} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-sm font-medium">Slide {currentSlide + 1} / {pptJson.slides.length}</span>
          <button onClick={nextSlide} disabled={currentSlide === pptJson.slides.length - 1 || editingSlide !== null} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default EditablePPTPreview;