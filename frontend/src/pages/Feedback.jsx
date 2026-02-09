// pages/Feedback.jsx
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Send, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Feedback = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !feedback.trim()) {
      return toast.error('Please complete all fields', { style: { background: '#dc2626', color: '#fff' } });
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/feedback/submit`,
        { category, feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Thank you for your feedback!', { style: { background: '#16a34a', color: '#fff' } });
      setCategory('');
      setFeedback('');
    } catch (err) {
      toast.error('Failed to submit feedback', { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white dark:bg-gray-900 flex flex-col font-sans antialiased"
    >
      <Toaster position="bottom-right" />
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Send className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">App Feedback</h1>
                <p className="text-sm text-blue-600 dark:text-blue-400">Help us improve</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2.5 px-5 py-2.5 bg-gray-50 dark:bg-gray-700 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 text-sm font-medium shadow-sm"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
                Dashboard
              </button>
            </div>
          </header>
          <main className="p-8">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-8"
            >
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Help us improve! Share your thoughts on features, usability, issues, or suggestions.
              </p>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Feedback Category */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    What is your feedback about?
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select a category</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Usability Issue">Usability Issue</option>
                    <option value="General Feedback">General Feedback</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Detailed Feedback */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your feedback
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Describe your experience, suggestions, or issues in detail..."
                    className="w-full h-40 p-4 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-y transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !category || !feedback.trim()}
                  className="w-full py-3 px-6 bg-blue-600 dark:bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
                >
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </motion.div>
          </main>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Feedback;