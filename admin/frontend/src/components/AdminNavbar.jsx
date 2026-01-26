import React, { useState, useEffect } from 'react';
import { Bell, Menu, User, Settings, LogOut, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const USER_API_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:4001';

const AdminNavbar = ({ toggleSidebar, onLogout, admin }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // Handle logout
    const handleLogoutClick = () => {
        setIsProfileOpen(false);
        onLogout();
    };

    // Clear all notifications
    const handleClearNotifications = () => {
        setNotifications([]);
        toast.success('Notifications cleared.');
    };

    // Socket.IO setup for real-time notifications
    useEffect(() => {
        const socket = io(USER_API_URL, {
            auth: { token: localStorage.getItem('adminToken') },
            reconnectionAttempts: 3,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            console.log('Navbar socket connected:', socket.id);
        });

        socket.on('newTask', (task) => {
            setNotifications((prev) => [
                {
                    id: task._id,
                    user: task.owner?.name || task.owner?.email || 'Unknown',
                    action: `created Task "${task.title}"`,
                    timestamp: new Date(task.createdAt).toISOString().replace('T', ' ').slice(0, 16),
                },
                ...prev.slice(0, 19), // Limit to 20 notifications
            ]);
        });

        socket.on('updateTask', (updatedTask) => {
            setNotifications((prev) => [
                {
                    id: updatedTask._id,
                    user: updatedTask.owner?.name || updatedTask.owner?.email || 'Unknown',
                    action: `updated Task "${updatedTask.title}"`,
                    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                },
                ...prev.slice(0, 19),
            ]);
        });

        socket.on('deleteTask', (task) => {
            setNotifications((prev) => [
                {
                    id: task._id,
                    user: task.owner?.name || task.owner?.email || 'Unknown',
                    action: `deleted Task "${task.title}"`,
                    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                },
                ...prev.slice(0, 19),
            ]);
        });

        socket.on('newGoal', (goal) => {
            setNotifications((prev) => [
                {
                    id: goal._id,
                    user: goal.owner?.name || goal.owner?.email || 'Unknown',
                    action: `created Goal "${goal.title}"`,
                    timestamp: new Date(goal.createdAt).toISOString().replace('T', ' ').slice(0, 16),
                },
                ...prev.slice(0, 19),
            ]);
        });

        socket.on('goalUpdated', (updatedGoal) => {
            setNotifications((prev) => [
                {
                    id: updatedGoal._id,
                    user: updatedGoal.owner?.name || updatedGoal.owner?.email || 'Unknown',
                    action: `updated Goal "${updatedGoal.title}"`,
                    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                },
                ...prev.slice(0, 19),
            ]);
        });

        socket.on('goalDeleted', (goal) => {
            setNotifications((prev) => [
                {
                    id: goal._id,
                    user: goal.owner?.name || goal.owner?.email || 'Unknown',
                    action: `deleted Goal "${goal.title}"`,
                    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                },
                ...prev.slice(0, 19),
            ]);
        });

        socket.on('connect_error', (err) => {
            console.error('Navbar socket connection error:', err.message);
            toast.error('Failed to connect to notifications. Retrying...');
        });

        socket.on('error', (err) => {
            console.error('Navbar socket error:', err.message);
            toast.error('Notification error occurred.');
        });

        return () => {
            socket.disconnect();
            console.log('Navbar socket disconnected');
        };
    }, []);

    return (
        <nav className="bg-teal-800 text-white shadow-lg p-4 flex items-center justify-between relative z-20">
            {/* Logo/Branding */}
            <div className="flex items-center space-x-4">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="md:hidden text-teal-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-400 rounded"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <Menu size={24} />
                </motion.button>
                <Link to="/admin/dashboard" className="text-2xl font-bold text-teal-200 hover:text-white transition-colors">
                    NEGAITM Admin
                </Link>
            </div>

            {/* Navigation Links (Hidden on Mobile) */}
            <div className="hidden md:flex items-center space-x-6">
                {[
                    { to: '/admin/dashboard', label: 'Dashboard' },
                    { to: '/admin/user-list', label: 'Users' },
                    { to: '/admin/task-management', label: 'Tasks' },
                    { to: '/admin/goal-management', label: 'Goals' },
                    { to: '/admin/file-management', label: 'Files' },
                    { to: '/admin/reports', label: 'Reports' },
                ].map((link) => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className="text-teal-200 hover:text-white font-medium transition-colors duration-200 relative group"
                        aria-label={link.label}
                    >
                        {link.label}
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                    </Link>
                ))}
            </div>

            {/* Right Side: Notifications, Profile */}
            <div className="flex items-center space-x-4">
                {/* Notifications Icon and Dropdown */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className="text-teal-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-400 rounded"
                        aria-label={`Notifications (${notifications.length} unread)`}
                        aria-expanded={isNotificationsOpen}
                    >
                        <Bell size={24} />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {notifications.length}
                            </span>
                        )}
                    </motion.button>
                    <AnimatePresence>
                        {isNotificationsOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-2 w-80 bg-teal-700 rounded-lg shadow-xl py-2 z-50 max-h-96 overflow-y-auto"
                            >
                                <div className="flex items-center justify-between px-4 py-2 border-b border-teal-600">
                                    <h3 className="text-sm font-semibold text-teal-100">Notifications</h3>
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={handleClearNotifications}
                                            className="text-teal-300 hover:text-white text-xs flex items-center"
                                            aria-label="Clear all notifications"
                                        >
                                            <X size={14} className="mr-1" />
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                {notifications.length === 0 ? (
                                    <p className="px-4 py-2 text-teal-300 text-sm">No new notifications</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {notifications.map((notification) => (
                                            <li
                                                key={notification.id}
                                                className="flex items-start space-x-3 border-l-4 border-teal-600 pl-3 mx-2 py-2 hover:bg-teal-600/20 transition-colors"
                                            >
                                                <div className="flex-shrink-0 w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                                                    <User className="w-3 h-3 text-teal-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-teal-100">
                                                        <span className="font-semibold text-teal-200">{notification.user}</span>{' '}
                                                        {notification.action}
                                                    </p>
                                                    <p className="text-xs text-teal-400">{notification.timestamp}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center space-x-2 text-teal-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-400 rounded"
                        aria-label="Profile menu"
                        aria-expanded={isProfileOpen}
                    >
                        <User size={24} />
                        <span className="hidden md:inline font-medium">
                            {admin?.name || 'Admin'}
                        </span>
                    </motion.button>
                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-2 w-48 bg-teal-700 rounded-lg shadow-xl py-2 z-50"
                            >
                                <Link
                                    to="/admin/profile"
                                    className="flex items-center px-4 py-2 text-teal-100 hover:bg-teal-600 hover:text-white transition-colors"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <Settings size={18} className="mr-2" />
                                    Profile Settings
                                </Link>
                                <button
                                    className="flex items-center w-full text-left px-4 py-2 text-teal-100 hover:bg-teal-600 hover:text-white transition-colors"
                                    onClick={handleLogoutClick}
                                    aria-label="Logout"
                                >
                                    <LogOut size={18} className="mr-2" />
                                    Logout
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </nav>
    );
};

export default AdminNavbar;