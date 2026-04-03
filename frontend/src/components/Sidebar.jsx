// src/components/Sidebar.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  List,
  CheckCircle,
  Menu,
  Info,
  X,
  LayoutDashboard,
  Clock,
  Calendar,
  MessageSquare,
  Link,
  File,
  FileText,
  CreditCard,
  Sparkles,
  AlertCircle,
  Bell,
  Target,
  Award,
  Video,
  BookOpen,
  Instagram,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

const UNREAD_POSTS_KEY = 'socialFeedUnreadCount';

const Sidebar = ({ user, isExpanded, onToggle }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatUnreadTotal, setChatUnreadTotal] = useState(0);
  // Load social feed unread count from localStorage so it persists across refreshes
  const [socialUnreadTotal, setSocialUnreadTotal] = useState(() => {
    const stored = localStorage.getItem(UNREAD_POSTS_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });

  const fullName = user?.fullName || user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  const initial = (user?.firstName || user?.name || 'U').charAt(0).toUpperCase();

  // ── Fetch total unread count from DB on mount and whenever the window regains focus ──
  const fetchUnreadTotal = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) return;
      const response = await axios.get(`${API_BASE_URL}/api/chats/unread-counts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        const counts = response.data.counts || {};
        const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
        setChatUnreadTotal(total);
      }
    } catch (error) {
      // Silently fail — sidebar badge is non-critical
      console.error('Sidebar: failed to fetch unread counts', error.message);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadTotal();
  }, [fetchUnreadTotal]);

  // Re-fetch when the user returns to the tab (e.g. after opening chats in another tab)
  useEffect(() => {
    const handleFocus = () => fetchUnreadTotal();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchUnreadTotal]);

  // Listen for a custom event that TeamChat fires when counts change,
  // so the sidebar badge stays in sync within the same tab session
  useEffect(() => {
    const handleUnreadChange = (e) => {
      setChatUnreadTotal(e.detail?.total ?? 0);
    };
    window.addEventListener('chatUnreadUpdate', handleUnreadChange);
    return () => window.removeEventListener('chatUnreadUpdate', handleUnreadChange);
  }, []);

  // Keep social feed badge in sync with localStorage changes from SocialFeed page
  useEffect(() => {
    const handleSocialUnreadChange = (e) => {
      setSocialUnreadTotal(e.detail?.total ?? 0);
    };
    window.addEventListener('socialFeedUnreadUpdate', handleSocialUnreadChange);
    // Also re-read from localStorage on window focus (handles cross-tab scenarios)
    const handleFocusSocial = () => {
      const stored = localStorage.getItem(UNREAD_POSTS_KEY);
      setSocialUnreadTotal(stored ? parseInt(stored, 10) : 0);
    };
    window.addEventListener('focus', handleFocusSocial);
    return () => {
      window.removeEventListener('socialFeedUnreadUpdate', handleSocialUnreadChange);
      window.removeEventListener('focus', handleFocusSocial);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileOpen]);

  const menuItems = [
    { text: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { text: 'Pending Tasks', path: '/pending', icon: <List className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { text: 'Completed', path: '/complete', icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" /> },
    { text: 'Newly Assigned', path: '/assigned', icon: <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { text: 'Calendar View', path: '/calendar', icon: <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { text: 'Team Chat', path: '/team-chat', icon: <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />, badge: chatUnreadTotal },
    { text: 'Social Feeds', path: '/social-feed', icon: <Instagram className="w-5 h-5 text-blue-600 dark:text-blue-400" />, badge: socialUnreadTotal },
    { text: 'File Storage', path: '/file-storage', icon: <File className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { text: 'Reports', path: '/reports', icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { text: 'AI Tools', path: '/ai-tools', icon: <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" /> },
    { text: 'Deck Prep', path: '/document-converter', icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { text: 'Reminders', path: '/reminders', icon: <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { text: 'Goals', path: '/goals', icon: <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { text: 'Performance', path: '/performance', icon: <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { text: 'Meeting', path: '/meeting', icon: <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { text: 'Training', path: '/training', icon: <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { text: 'Feedback', path: '/feedback', icon: <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
  ];

  const renderMenuItems = (isMobile = false) => (
    <ul className="space-y-1">
      {menuItems.map(({ text, path, icon, badge }) => (
        <li key={text}>
          <NavLink
            to={path}
            title={text}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors duration-200',
                isExpanded || isMobile ? 'px-4' : 'px-2 justify-center',
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold shadow-sm'
                  : '',
              ].join(' ')
            }
            onClick={() => setMobileOpen(false)}
          >
            {/* Icon wrapper — use relative so the collapsed badge can be positioned */}
            <span className="relative flex-shrink-0 p-1.5 bg-blue-50 dark:bg-blue-900/50 rounded-md">
              {icon}
              {/* Collapsed sidebar: small dot badge on the icon */}
              {!isExpanded && !isMobile && badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-green-500 dark:bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>

            {/* Label + badge (expanded or mobile) */}
            {(isExpanded || isMobile) && (
              <>
                <span className="flex-1 truncate text-sm font-medium">{text}</span>
                {badge > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-green-500 dark:bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`
          hidden lg:block fixed top-16 ${isExpanded ? 'w-64' : 'w-16'}
          h-[calc(120vh-4rem)] bg-white dark:bg-gray-900
          border-r border-t border-gray-200 dark:border-gray-700
          flex flex-col transition-all duration-300 z-40
        `}
      >
        <div className="flex-1 overflow-hidden">
          <div
            className={`
              h-[calc(120vh-8rem)] overflow-y-auto
              px-4 pt-4 space-y-6
              ${isExpanded ? '' : 'px-2'}
              ${!isExpanded ? 'scrollbar-hide' : 'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500'}
            `}
            style={{
              msOverflowStyle: !isExpanded ? 'none' : 'auto',
              scrollbarWidth: !isExpanded ? 'none' : 'thin',
            }}
          >
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar { display: none; }
              .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* User Profile */}
            <div className={`flex ${isExpanded ? 'items-center gap-4' : 'justify-center'} mb-4`}>
              {isExpanded ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                    {initial}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[180px]">Hi, {fullName}</h2>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Stay Productive!
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {initial}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              {isExpanded && (
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <List className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Navigation
                </h3>
              )}
              {renderMenuItems()}
            </div>

            {/* Quick Tip */}
            {isExpanded && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/50">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Quick Tip</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tackle high-priority tasks first to stay ahead.</p>
                    <a
                      href="https://fundco.ng"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition"
                    >
                      Learn More
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`
          fixed top-1/2 -translate-y-1/2 z-50
          bg-blue-600 dark:bg-blue-700 text-white p-2 rounded-r-full shadow-lg
          hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300
          hidden lg:flex items-center justify-center
          w-10 h-16
          ${isExpanded ? 'left-64' : 'left-16'}
        `}
        style={{ left: isExpanded ? '16rem' : '4rem' }}
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Mobile Menu Button */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-5 left-4 z-[60] p-3 bg-white dark:bg-gray-900 rounded-full shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          {/* Mobile hamburger dot when there are unread messages */}
          {chatUnreadTotal > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          )}
        </button>
      )}

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
        <div
          className={`fixed top-0 left-0 w-72 h-full bg-white dark:bg-gray-900 p-5 transition-transform duration-300 transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-300">Menu</h2>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              {initial}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[180px]">Hi, {fullName}</h2>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> Stay Productive!
              </p>
            </div>
          </div>

          <div className="h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div className="space-y-6 pb-32">
              {renderMenuItems(true)}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/50">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Quick Tip</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tackle high-priority tasks first to stay ahead.</p>
                    <a
                      href="https://fundco.ng"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition"
                    >
                      Learn More
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;