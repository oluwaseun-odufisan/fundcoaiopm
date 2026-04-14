import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';

const Layout = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sideWidth = useMemo(() => 
    collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)', 
    [collapsed]
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen">
      <Navbar
        user={user}
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed((prev) => !prev)}
        onMobileMenu={() => setMobileOpen(true)}
      />

      <Sidebar
        user={user}
        hasRole={hasRole}
        onLogout={handleLogout}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main
        className="main-content transition-[margin] duration-200"
        style={{ 
          marginLeft: sideWidth, 
          paddingTop: 'var(--topbar-h)' 
        }}
      >
        <div className="mx-auto max-w-[1640px] p-4 lg:p-6 xl:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;