//Layout.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, ListTodo, Target, FileText, TrendingUp, Users, UsersRound,
  FolderKanban, MessageSquare, BookOpen, Bell, Video, LogOut, ChevronsLeft,
  ChevronsRight, Menu, X, Moon, Sun, Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_BADGE = { 'team-lead': { label: 'Team Lead', bg: '#dbeafe', color: '#1e40af' }, executive: { label: 'Executive', bg: '#ede9fe', color: '#5b21b6' }, admin: { label: 'Super Admin', bg: '#fef2f2', color: '#991b1b' } };

const Layout = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  const toggleTheme = () => { setDark(!dark); document.documentElement.setAttribute('data-theme', dark ? '' : 'dark'); };
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const initial = (user?.firstName || 'A')[0].toUpperCase();
  const fullName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin';
  const rb = ROLE_BADGE[user?.role] || ROLE_BADGE.admin;

  const nav = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['team-lead', 'executive', 'admin'] },
    { to: '/tasks', icon: ListTodo, label: 'Tasks', roles: ['team-lead', 'executive', 'admin'] },
    { to: '/projects', icon: FolderKanban, label: 'Projects', roles: ['team-lead', 'executive', 'admin'] },
    { to: '/goals', icon: Target, label: 'Goals', roles: ['team-lead', 'executive', 'admin'] },
    { to: '/reports', icon: FileText, label: 'Reports', roles: ['team-lead', 'executive', 'admin'] },
    { to: '/performance', icon: TrendingUp, label: 'Performance', roles: ['team-lead', 'executive', 'admin'] },
    { type: 'divider' },
    { to: '/my-team', icon: UsersRound, label: 'My Team', roles: ['team-lead', 'executive', 'admin'] },
    { to: '/social', icon: MessageSquare, label: 'Social', roles: ['team-lead', 'executive', 'admin'] },
    { to: '/training', icon: BookOpen, label: 'Training', roles: ['team-lead', 'executive', 'admin'] },
    { to: '/reminders', icon: Bell, label: 'Reminders', roles: ['team-lead', 'executive', 'admin'] },
    { to: '/meetings', icon: Video, label: 'Meetings', roles: ['team-lead', 'executive', 'admin'] },
    { type: 'divider' },
    { to: '/users', icon: Users, label: 'User Management', roles: ['admin'] },
  ].filter(item => !item.roles || item.roles.some(r => hasRole(r)));

  const SideContent = ({ isMobile = false }) => {
    const show = !collapsed || isMobile;
    return (
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-14 flex-shrink-0 border-b" style={{ borderColor: 'var(--c-border-subtle)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{ background: 'var(--c-accent)' }}>F</div>
          {show && <span className="font-bold text-[15px] tracking-tight" style={{ color: 'var(--c-text-0)' }}>FundCo</span>}
        </div>

        {/* User card */}
        <div className={`${show ? 'px-4' : 'px-2'} py-4 flex-shrink-0`}>
          <div className={`flex ${show ? 'items-center gap-3 p-3' : 'justify-center p-2'} rounded-xl`} style={{ background: 'var(--c-surface-raised)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ background: rb.color }}>{initial}</div>
            {show && (
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--c-text-0)' }}>{fullName.split(' ')[0]}</p>
                <span className="badge" style={{ background: rb.bg, color: rb.color, fontSize: 10 }}>{rb.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3" style={{ scrollbarWidth: 'none' }}>
          {show && <p className="section-title px-2 mb-2">Workspace</p>}
          <ul className="space-y-0.5">
            {nav.map((item, i) => {
              if (item.type === 'divider') return <li key={`d-${i}`} className="my-3"><hr className="divider" /></li>;
              return (
                <li key={item.to}>
                  <NavLink to={item.to} onClick={() => isMobile && setMobileOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 ${show ? 'px-3' : 'justify-center px-2'} py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${isActive ? '' : ''}`}
                    style={({ isActive }) => isActive
                      ? { background: 'var(--c-accent)', color: 'white' }
                      : { color: 'var(--c-text-2)' }
                    }
                    onMouseEnter={e => { if (!e.currentTarget.style.background?.includes('var(--c-accent)')) e.currentTarget.style.background = 'var(--c-surface-raised)'; }}
                    onMouseLeave={e => { if (!e.currentTarget.style.background?.includes('var(--c-accent)')) e.currentTarget.style.background = 'transparent'; }}>
                    {({ isActive }) => (
                      <>
                        <item.icon className="w-[18px] h-[18px] flex-shrink-0" style={{ opacity: isActive ? 1 : 0.7 }} />
                        {show && <span className="truncate">{item.label}</span>}
                        {!show && (
                          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-md text-xs font-semibold text-white whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'var(--c-ink)' }}>{item.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: 'var(--c-border-subtle)' }}>
          <button onClick={handleLogout}
            className={`flex items-center gap-3 w-full ${show ? 'px-3' : 'justify-center px-2'} py-2 rounded-lg text-[13px] font-medium transition-colors`}
            style={{ color: 'var(--c-text-2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-danger-bg)'; e.currentTarget.style.color = 'var(--c-danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-2)'; }}>
            <LogOut className="w-[18px] h-[18px]" />
            {show && <span>Sign out</span>}
          </button>
        </div>
      </div>
    );
  };

  const sideW = collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)';

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Topbar ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:px-6"
        style={{ height: 'var(--topbar-h)', background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-3">
          <button className="lg:hidden btn-ghost p-2" onClick={() => setMobileOpen(true)}><Menu className="w-5 h-5" /></button>
          <button className="hidden lg:flex btn-ghost p-2" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="btn-ghost p-2">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Desktop Sidebar ────────────────────── */}
      <aside className="hidden lg:block fixed top-0 left-0 z-40 transition-[width] duration-200 overflow-hidden"
        style={{ width: sideW, height: '100vh', background: 'var(--c-surface)', borderRight: '1px solid var(--c-border)' }}>
        <SideContent />
      </aside>

      {/* ── Mobile Drawer ──────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'tween', duration: 0.2 }}
              className="fixed top-0 left-0 w-[280px] h-full z-50 lg:hidden"
              style={{ background: 'var(--c-surface)' }}>
              <SideContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Content ────────────────────────────── */}
      <main className="main-content transition-[margin] duration-200"
        style={{ marginLeft: sideW, paddingTop: 'var(--topbar-h)' }}>
        <div className="p-5 lg:p-8 max-w-[1360px]">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
