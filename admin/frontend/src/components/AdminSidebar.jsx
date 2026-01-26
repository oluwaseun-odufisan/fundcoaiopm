import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    Target,
    Folder,
    BarChart2,
    FileText,
    PieChart,
    User,
    List,
} from 'lucide-react';

const AdminSidebar = ({ toggleSidebar, onCollapse }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    // Navigation links with icons and routes from App.jsx
    const navLinks = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'User Management', path: '/admin/user-management', icon: Users },
        { name: 'User List', path: '/admin/user-list', icon: List },
        { name: 'Task Management', path: '/admin/task-management', icon: CheckSquare },
        { name: 'Goal Management', path: '/admin/goal-management', icon: Target },
        { name: 'File Management', path: '/admin/file-management', icon: Folder },
        { name: 'Task Overview', path: '/admin/task-overview', icon: CheckSquare },
        { name: 'Goal Overview', path: '/admin/goal-overview', icon: Target },
        { name: 'Reports', path: '/admin/reports', icon: BarChart2 },
        { name: 'Analytics', path: '/admin/analytics', icon: PieChart },
    ];

    // Toggle collapse state and notify parent
    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        if (onCollapse) {
            onCollapse(newState);
        }
    };

    return (
        <div
            className={`h-full bg-gradient-to-b from-teal-700 to-teal-900 text-white flex flex-col transition-all duration-300 ${
                isCollapsed ? 'w-16' : 'w-64'
            } shadow-xl z-30 relative overflow-hidden`}
            role="navigation"
            aria-label="Admin Sidebar"
        >
            {/* Branding/Logo */}
            <div
                className={`p-4 flex items-center justify-between border-b border-teal-500/30 ${
                    isCollapsed ? 'justify-center' : ''
                }`}
            >
                {!isCollapsed && (
                    <Link to="/admin/dashboard" className="text-2xl font-extrabold tracking-tight">
                        NEGAITM
                    </Link>
                )}
                <button
                    onClick={toggleCollapse}
                    className="p-2 rounded-full hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-300"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <List size={20} /> : <List size={20} className="rotate-180" />}
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto">
                <ul className="p-2 space-y-1">
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <li key={link.path} className="relative group">
                                <Link
                                    to={link.path}
                                    onClick={toggleSidebar}
                                    className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                                        isActive
                                            ? 'bg-teal-500 text-white'
                                            : 'text-teal-100 hover:bg-teal-600 hover:text-white'
                                    } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                                    aria-label={link.name}
                                >
                                    <link.icon
                                        size={22}
                                        className={isActive ? 'text-white' : 'text-teal-200 group-hover:text-white'}
                                    />
                                    {!isCollapsed && <span className="text-sm font-medium">{link.name}</span>}
                                </Link>
                                {isCollapsed && (
                                    <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-teal-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                                        {link.name}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Decorative Element */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-teal-800/50 to-transparent" />
            </div>
        </div>
    );
};

export default AdminSidebar;