// frontend/src/components/AIChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Loader2, Bot, Minimize2, Maximize2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
const AIChat = ({ currentCourse, currentModule }) => {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);
  useEffect(() => {
    // Generate context-based suggestions
    if (currentModule) {
      setSuggestions([
        `Explain ${currentModule.title} in simple terms`,
        `What are key takeaways from this module?`,
        `How does this apply to my role?`,
        `Generate practice questions for ${currentModule.title}`
      ]);
    } else if (currentCourse) {
      setSuggestions([
        `Overview of ${currentCourse.title}`,
        `Why is this course important for employees?`,
        `Recommended learning path for ${currentCourse.level} level`,
        `Common challenges in this topic`
      ]);
    } else {
      setSuggestions([
        'What training should I start with?',
        'How to improve my skills in [area]?',
        'Explain a key company term',
        'Career development tips'
      ]);
    }
  }, [currentCourse, currentModule]);
  const handleSubmit = async (e, customQuestion = null) => {
    e.preventDefault();
    const q = customQuestion || question;
    if (!q.trim()) return;
    setHistory(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    setQuestion('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/learning/ai-query`, {
        question: q,
        courseId: currentCourse?._id,
        moduleId: currentModule?._id
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch (err) {
      toast.error('Failed to get response from AI Mentor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleSuggestion = (sugg) => {
    setQuestion(sugg);
    handleSubmit({ preventDefault: () => {} }, sugg);
  };
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30">
        <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <Bot className="w-6 h-6 animate-pulse" /> AI Mentor
        </h2>
        <button onClick={() => setIsMinimized(!isMinimized)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
          {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
        </button>
      </div>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/30 custom-scrollbar">
              {history.length === 0 && (
                <motion.div
                  className="text-center py-8 text-gray-500 dark:text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Bot className="w-16 h-16 mx-auto mb-4 text-blue-300 dark:text-blue-500" />
                  <p>Ask me anything about your training materials or career development!</p>
                </motion.div>
              )}
              {history.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg max-w-[85%] shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-100 dark:bg-blue-900/30 ml-auto border border-blue-200 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-700 mr-auto border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">{msg.content}</p>
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-blue-100 dark:border-blue-900/50">
              <div className="flex flex-wrap gap-2 mb-4">
                {suggestions.map((sugg, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleSuggestion(sugg)}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {sugg}
                  </motion.button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  className="flex-1 p-3 border border-blue-200 dark:border-blue-700 rounded-l-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                />
                <button type="submit" disabled={loading} className="p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-r-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default AIChat;