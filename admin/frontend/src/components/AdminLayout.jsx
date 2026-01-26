import React, { useState } from 'react';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children, admin, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showNotifications, setShowNotifications] = useState(true);

    // Toggle sidebar for mobile view
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Handle sidebar collapse state
    const handleSidebarCollapse = (collapsed) => {
        setIsSidebarCollapsed(collapsed);
    };

    // Toggle notifications visibility
    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    const isAuthenticated = !!admin;

    if (!isAuthenticated) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
                <p className="text-xl text-teal-700 font-semibold">Please log in to access the admin panel.</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gradient-to-br from-teal-50 to-teal-100 overflow-hidden relative">
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-96 h-96 top-0 left-0 bg-teal-200/20 rounded-full filter blur-3xl animate-pulse-slow" />
                <div className="absolute w-96 h-96 bottom-0 right-0 bg-blue-200/20 rounded-full filter blur-3xl animate-pulse-slow-delayed" />
            </div>

            {/* Main layout */}
            <div className="flex h-full">
                {/* Sidebar */}
                <div
                    className={`fixed inset-y-0 left-0 z-30 bg-white shadow-lg transform ${
                        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0 transition-transform duration-300 ease-in-out ${
                        isSidebarCollapsed ? 'w-16' : 'w-64'
                    }`}
                >
                    <AdminSidebar toggleSidebar={toggleSidebar} onCollapse={handleSidebarCollapse} />
                </div>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                        onClick={toggleSidebar}
                        aria-hidden="true"
                    ></div>
                )}

                {/* Main content area */}
                <div
                    className={`flex-1 flex flex-col transition-all duration-300 ${
                        isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
                    }`}
                >
                    {/* Navbar */}
                    <header className="bg-teal-800 shadow-md z-10">
                        <AdminNavbar toggleSidebar={toggleSidebar} admin={admin} onLogout={onLogout} />
                    </header>

                    {/* Content */}
                    <main className="flex-1 overflow-y-auto p-8 md:p-10 relative z-0">
                        {children}
                    </main>

                    {/* Footer */}
                    <footer className="bg-white text-gray-600 text-center py-3 text-sm shadow-inner">
                        NEGTM Admin © 2025 | Version 1.0.0
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;