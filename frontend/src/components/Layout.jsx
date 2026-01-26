import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Clock, TrendingUp, Circle, Zap, Sparkles, Activity, MessageCircle, ChevronDown, X, Trash2, StickyNote, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;

const Layout = ({ onLogout, user }) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    return localStorage.getItem('sidebarExpanded') === 'true';
  });
  const [isMetricsVisible, setIsMetricsVisible] = useState(() => {
    return localStorage.getItem('metricsVisible') !== 'false';
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLogExpanded, setIsLogExpanded] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const chatContainerRef = useRef(null);
  const chatInputRef = useRef(null);
  const noteModalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', isSidebarExpanded);
  }, [isSidebarExpanded]);

  useEffect(() => {
    localStorage.setItem('metricsVisible', isMetricsVisible);
  }, [isMetricsVisible]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token found');
      const { data } = await axios.get(`${API_URL}/api/tasks/gp`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.tasks)
          ? data?.tasks
          : Array.isArray(data?.data)
            ? data?.data
            : [];
      setTasks(arr);
      return true;
    } catch (err) {
      console.error('Task fetch error:', err);
      setError(err.message || 'Could not load tasks.');
      if (err.response?.status === 401) {
        onLogout();
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  const fetchChatHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token found');
      const { data } = await axios.get(`${API_URL}/api/bot/chat/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Chat history fetch error:', err.message);
    }
  }, []);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const userMessage = { text: chatInput, sender: 'user', timestamp: new Date().toISOString() };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token found');
      const { data } = await axios.post(
        `${API_URL}/api/bot/chat`,
        { message: chatInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setChatMessages((prev) => [...prev, ...data.messages.filter((msg) => msg.sender === 'bot')]);
        if (data.messages.some((msg) => msg.text.includes('created') || msg.text.includes('updated') || msg.text.includes('deleted'))) {
          await fetchTasks();
        }
      } else {
        throw new Error(data.message || 'Chat request failed');
      }
    } catch (err) {
      console.error('Chat submit error:', err.message);
      const errorMessage = {
        text: err.message.includes('401')
          ? 'Authentication failed. Please log in again.'
          : 'Sorry, I couldn’t respond. Please try again.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
      if (chatInputRef.current) chatInputRef.current.focus();
    }
  };

  const clearChatInput = () => {
    setChatInput('');
    if (chatInputRef.current) chatInputRef.current.focus();
  };

  const clearChatMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token found');
      await axios.delete(`${API_URL}/api/bot/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatMessages([]);
    } catch (err) {
      console.error('Clear chat error:', err.message);
    }
  }, []);

  const toggleChat = () => {
    setIsChatOpen((prev) => {
      if (!prev) {
        fetchChatHistory();
        setTimeout(() => {
          if (chatInputRef.current) chatInputRef.current.focus();
        }, 100);
      }
      return !prev;
    });
  };

  const toggleLog = () => setIsLogExpanded((prev) => !prev);
  const toggleNote = () => setIsNoteOpen((prev) => !prev);
  const clearNote = () => setNoteContent('');
  const handleBackdropClick = (e) => {
    if (noteModalRef.current && !noteModalRef.current.contains(e.target)) {
      setIsNoteOpen(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isNoteOpen) setIsNoteOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isNoteOpen]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (isChatOpen && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isChatOpen]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('sidebarExpanded', isSidebarExpanded);
      localStorage.setItem('metricsVisible', isMetricsVisible);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSidebarExpanded, isMetricsVisible]);

  const stats = useMemo(() => {
    const completedTasks = tasks.filter((task) =>
      task.completed === true ||
      task.completed === 1 ||
      (typeof task.completed === 'string' && task.completed.toLowerCase() === 'true')
    ).length;
    const totalCount = tasks.length;
    const pendingCount = totalCount - completedTasks;
    const completionPercentage = totalCount ? Math.round((completedTasks / totalCount) * 100) : 0;
    return { totalCount, completedTasks, pendingCount, completionPercentage };
  }, [tasks]);

  const aiSuggestions = useMemo(() => {
    const suggestions = [];
    const now = new Date();
    const overdueTasks = tasks.filter((task) => task.dueDate && !task.completed && new Date(task.dueDate) < now);
    if (overdueTasks.length > 0) {
      suggestions.push(`Address ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}, e.g., "${overdueTasks[0]?.title || 'task'}".`);
    }
    const highPriorityTasks = tasks.filter((task) => !task.completed && task.priority?.toLowerCase() === 'high');
    if (highPriorityTasks.length > 0) {
      suggestions.push(`Prioritize ${highPriorityTasks.length} high-priority task${highPriorityTasks.length > 1 ? 's' : ''}, starting with "${highPriorityTasks[0]?.title || 'task'}".`);
    }
    if (stats.completionPercentage < 50 && stats.pendingCount > 0) {
      suggestions.push(`Boost your ${stats.completionPercentage}% completion rate by tackling ${stats.pendingCount} pending task${stats.pendingCount > 1 ? 's' : ''}.`);
    }
    if (tasks.length === 0) {
      suggestions.push('Add new tasks to stay productive!');
    }
    return suggestions.slice(0, 3);
  }, [tasks, stats]);

  const StatCard = ({ title, value, icon, bgColor, textColor }) => (
    <div className="p-3 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-full ${bgColor}`}>
          {React.cloneElement(icon, { className: `w-4 h-4 ${textColor}` })}
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-600 font-medium">{title}</p>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="minth-screen bg-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">Loading FundCo TM...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="minth-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white text-red-600 p-6 rounded-xl border border-red-200 max-w-md shadow-lg text-center">
        <p className="text-lg font-semibold mb-2">Error</p>
        <p className="text-sm text-gray-700">{error}</p>
        <button
          onClick={fetchTasks}
          className="mt-4 px-6 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="minth-screen bg-blue-50 flex relative">
      {/* Background Accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-64 h-64 top-0 left-0 bg-blue-100 rounded-full opacity-20"></div>
        <div className="absolute w-64 h-64 bottom-0 right-0 bg-green-100 rounded-full opacity-20"></div>
      </div>

      <Sidebar
        user={user}
        isExpanded={isSidebarExpanded}
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      <div className="flex-1 flex flex-col relative z-10">
        <Navbar user={user} onLogout={onLogout} />

        <main className={`flex-1 pt-16 px-4 md:px-6 lg:px-8 pb-24 transition-all duration-300 ${isSidebarExpanded ? 'lg:pl-72' : 'lg:pl-20'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1800px] mx-auto">
            <div className={`space-y-6 ${isMetricsVisible ? 'lg:col-span-2' : 'md:col-span-2 lg:col-span-3'}`}>
              <Outlet context={{ user, tasks, fetchTasks }} />
            </div>

            {/* === METRICS PANEL === */}
            {isMetricsVisible && (
              <div className="space-y-5">
                {/* Metrics Content */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-5">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard title="Total Tasks" value={stats.totalCount} icon={<Circle />} bgColor="bg-blue-100" textColor="text-blue-700" />
                    <StatCard title="Completed" value={stats.completedTasks} icon={<Circle />} bgColor="bg-green-100" textColor="text-green-700" />
                    <StatCard title="Pending" value={stats.pendingCount} icon={<Circle />} bgColor="bg-gray-100" textColor="text-gray-700" />
                    <StatCard title="Completion Rate" value={`${stats.completionPercentage}%`} icon={<Zap />} bgColor="bg-blue-100" textColor="text-blue-700" />
                  </div>
                  <hr className="my-5 border-gray-200" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-700">
                      <span className="font-medium flex items-center gap-2">
                        <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                        Progress
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {stats.completedTasks}/{stats.totalCount}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 transition-all duration-500"
                        style={{ width: `${stats.completionPercentage}%` }}
                      />
                    </div>
                    <button
                      onClick={() => navigate('/analytics')}
                      className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
                    >
                      View Analytics Dashboard
                    </button>
                  </div>
                </div>

                {/* Activity Log */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <button
                    onClick={toggleLog}
                    className="w-full text-left text-lg font-bold text-blue-900 flex items-center justify-between gap-2 mb-5 hover:text-blue-700 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Activity Log
                    </div>
                    <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${isLogExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`space-y-2 transition-all duration-300 ${isLogExpanded ? 'max-h-96' : 'max-h-48'} overflow-y-auto`}>
                    {(isLogExpanded ? tasks : tasks.slice(0, 3)).map((task) => (
                      <div key={task._id || task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-medium text-gray-800">{task.title}</p>
                          <p className="text-xs text-gray-500">
                            {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'No date'}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${task.completed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {task.completed ? 'Done' : 'Pending'}
                        </span>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <p className="text-center text-sm text-gray-500 py-4">No tasks yet.</p>
                    )}
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-5">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    AI Suggestions
                  </h3>
                  <div className="space-y-2">
                    {aiSuggestions.length > 0 ? aiSuggestions.map((s, i) => (
                      <div key={i} className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-800">{s}</p>
                      </div>
                    )) : (
                      <p className="text-center text-sm text-gray-500 py-4">No suggestions yet.</p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/ai-tools')}
                    className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-700 transition"
                  >
                    Use AI Tools
                  </button>
                </div>

                {/* Sticky Notes */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-5">
                    <StickyNote className="w-5 h-5 text-yellow-600" />
                    Sticky Notes
                  </h3>
                  <button
                    onClick={toggleNote}
                    className="w-full p-3 bg-yellow-50 text-gray-700 rounded-md border border-yellow-200 hover:bg-yellow-100 transition text-left"
                  >
                    <p className="text-sm">{noteContent || 'Click to add temporary notes...'}</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* === FIXED TOGGLE BUTTON (Always on screen) === */}
        <button
          onClick={() => setIsMetricsVisible(!isMetricsVisible)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-blue-600 text-white p-2 rounded-l-full shadow-lg hover:bg-blue-700 transition-all duration-300 hidden lg:flex items-center justify-center w-10 h-16"
          aria-label={isMetricsVisible ? "Hide metrics" : "Show metrics"}
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform duration-300 ${isMetricsVisible ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Sticky Note Modal */}
        <AnimatePresence>
          {isNoteOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1001] p-4"
              onClick={handleBackdropClick}
            >
              <motion.div
                ref={noteModalRef}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 w-full max-w-md shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <StickyNote className="w-5 h-5 text-yellow-600" />
                  Temporary Note
                </h4>
                <p className="text-xs text-gray-600 mb-4">Write temporary notes here (not saved).</p>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write temporary notes here..."
                  className="w-full h-48 bg-transparent text-gray-800 placeholder-gray-500 text-sm focus:outline-none resize-none"
                  autoFocus
                />
                <div className="flex justify-between mt-4">
                  <button onClick={clearNote} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition">
                    <Trash2 className="w-4 h-4" /> Clear
                  </button>
                  <button onClick={toggleNote} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition">
                    <Minus className="w-4 h-4" /> Minimize
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TaskBot Chat */}
        <div className={`fixed bottom-0 right-0 w-full md:w-96 h-[80vh] md:h-[600px] bg-white shadow-xl border border-gray-200 z-[1000] transition-all duration-300 ${isChatOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:opacity-0 md:pointer-events-none'}`}>
          <div className="flex flex-col h-full">
            <div className="p-5 bg-blue-600 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                FundCo TM Bot
              </h3>
              <div className="flex gap-2">
                {chatMessages.length > 0 && (
                  <button onClick={clearChatMessages} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button onClick={toggleChat} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
              {chatMessages.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                  <p className="font-semibold">Welcome to FundCo TM Bot!</p>
                  <p className="text-sm mt-2">Try: "Add task", "List tasks", "Mark done"</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-3 p-3 rounded-lg max-w-[80%] ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
                      {msg.sender === 'user' ? 'U' : <MessageCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                  <span className="text-sm">Processing...</span>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-200 bg-white">
              <div className="relative">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSubmit(e)}
                  placeholder="Ask FundCo TM Bot..."
                  className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                  disabled={isChatLoading}
                />
                {chatInput && (
                  <button onClick={clearChatInput} className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button onClick={handleChatSubmit} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {!isChatOpen && (
          <button
            onClick={toggleChat}
            className="fixed bottom-8 right-8 p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition z-[1001]"
            aria-label="Open FundCo TM Bot"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Layout;