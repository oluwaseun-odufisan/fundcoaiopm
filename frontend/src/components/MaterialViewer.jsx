// frontend/src/components/MaterialViewer.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuizComponent from './QuizComponent';
import { ChevronLeft, ChevronRight, ExternalLink, BookOpen, PlayCircle, List, HelpCircle, Building } from 'lucide-react'; // Added Building for assetco

const MaterialViewer = ({ course, onCompleteModule, onBack, progress }) => {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('content');
  
  // NEW: Add guard if course or modules are invalid
  if (!course || !course.modules || course.modules.length === 0) {
    return (
      <div className="text-center py-16 text-red-600 bg-white rounded-xl shadow">
        <p className="text-lg font-medium mb-2">No modules available for this course.</p>
        <p>Please go back and select another course or contact support.</p>
        <button 
          onClick={onBack} 
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Training Center
        </button>
      </div>
    );
  }

  const module = course.modules[currentModuleIndex];
  
  // NEW: Guard if module is undefined (e.g., index out of bounds)
  if (!module) {
    return (
      <div className="text-center py-16 text-red-600 bg-white rounded-xl shadow">
        <p className="text-lg font-medium mb-2">Error: Module not found.</p>
        <p>This may be due to invalid data. Please try refreshing or contact support.</p>
        <button 
          onClick={onBack} 
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Training Center
        </button>
      </div>
    );
  }

  const getEmbedUrl = (url) => {
    let embedUrl = url;
    if (embedUrl.includes('playlist?list=')) {
      const listId = embedUrl.split('list=')[1].split('&')[0];
      embedUrl = `https://www.youtube.com/embed/videoseries?list=${listId}&rel=0&modestbranding=1&iv_load_policy=3&fs=1&autohide=1&enablejsapi=1`;
    } else if (embedUrl.includes('watch?v=')) {
      const videoId = embedUrl.split('v=')[1].split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&fs=1&autohide=1&enablejsapi=1`;
    } else {
      // For non-YouTube, return original for <a> link
      return null;
    }
    return embedUrl;
  };

  const handleComplete = () => {
    onCompleteModule(course._id, module._id);
    if (currentModuleIndex < course.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setActiveTab('content');
    }
  };

  const nextModule = () => {
    if (currentModuleIndex < course.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setActiveTab('content');
    }
  };

  const prevModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
      setActiveTab('content');
    }
  };

  const tabs = [
    { id: 'content', label: 'Content', icon: BookOpen },
    { id: 'video', label: 'Video', icon: PlayCircle, disabled: !module.videoUrl },
    { id: 'terms', label: 'Terms', icon: List, disabled: module.terms.length === 0 },
    { id: 'quiz', label: 'Assessment', icon: HelpCircle },
  ].filter(tab => !tab.disabled);

  return (
    <motion.div
      className="bg-white rounded-xl p-6 md:p-8 shadow-xl"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Training Center
        </button>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Module {currentModuleIndex + 1} / {course.modules.length}
        </div>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-blue-800 mb-3">{course.title}</h2>
      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-xl font-semibold text-gray-800">{module.title}</h3>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
          <Building className="w-4 h-4" /> {course.assetco}
        </span>
        <div className="bg-blue-50 rounded-full h-2 w-24 overflow-hidden">
          <div className="bg-blue-600 h-full" style={{ width: `${(currentModuleIndex + 1) / course.modules.length * 100}%` }}></div>
        </div>
        <p className="text-sm text-blue-600">Course Progress: {progress}%</p>
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="min-h-[400px]"
        >
          {activeTab === 'content' && (
            <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed">
              {module.content.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-4">{paragraph}</p>
              ))}
            </div>
          )}
          {activeTab === 'video' && module.videoUrl && (
            <div>
              {getEmbedUrl(module.videoUrl) ? (
                <iframe
                  width="100%"
                  height="500"
                  src={getEmbedUrl(module.videoUrl)}
                  title={module.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="rounded-lg shadow-md"
                ></iframe>
              ) : (
                <a
                  href={module.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-blue-800 font-medium">Open Learning Resource in New Tab</p>
                </a>
              )}
            </div>
          )}
          {activeTab === 'terms' && module.terms.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {module.terms.map((term, i) => (
                <motion.div
                  key={i}
                  className="p-4 bg-blue-50 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <strong className="text-blue-800 block mb-1">{term.term}</strong>
                  <p className="text-sm text-gray-700">{term.definition}</p>
                </motion.div>
              ))}
            </div>
          )}
          {activeTab === 'quiz' && (
            <QuizComponent quiz={module.quiz} onComplete={handleComplete} />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-between mt-8 pt-4 border-t border-blue-100">
        <button
          onClick={prevModule}
          disabled={currentModuleIndex === 0}
          className="flex items-center text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Previous Module
        </button>
        <button
          onClick={nextModule}
          disabled={currentModuleIndex === course.modules.length - 1}
          className="flex items-center text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
        >
          Next Module <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>
    </motion.div>
  );
};

export default MaterialViewer;