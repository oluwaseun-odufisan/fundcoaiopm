import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, ListTodo, Target, FileText, TrendingUp, Users, UsersRound,
  FolderKanban, MessageSquare, BookOpen, Bell, Video, LogOut, ChevronLeft,
  ChevronRight, Menu, X, Shield, Crown, Briefcase, Moon, Sun,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_LABELS = { 'team-lead': 'Team Lead', executive: 'Executive', admin: 'Super Admin' };
const ROLE_COLORS = { 'team-lead': '#2563eb', executive: '#7c3aed', admin: '#dc2626' };

const Layout = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setDark(!dark);
    document.documentElement.setAttribute('data-theme', dark ? '' : 'dark');
  };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const initial = (user?.firstName || 'A').charAt(0).toUpperCase();
  const fullName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin';
  const roleBadge = ROLE_LABELS[user?.role] || 'Admin';
  const roleColor = ROLE_COLORS[user?.role] || '#2563eb';

  const menuItems = [
    { text: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['team-lead', 'executive', 'admin'] },
    { text: 'Tasks', path: '/tasks', icon: ListTodo, roles: ['team-lead', 'executive', 'admin'] },
    { text: 'Goals', path: '/goals', icon: Target, roles: ['team-lead', 'executive', 'admin'] },
    { text: 'Reports', path: '/reports', icon: FileText, roles: ['team-lead', 'executive', 'admin'] },
    { text: 'Performance', path: '/performance', icon: TrendingUp, roles: ['team-lead', 'executive', 'admin'] },
    { text: 'Projects', path: '/projects', icon: FolderKanban, roles: ['team-lead', 'executive', 'admin'] },
    { text: 'My Team', path: '/my-team', icon: UsersRound, roles: ['team-lead', 'executive', 'admin'] },
    { text: 'Social', path: '/social', icon: MessageSquare, roles: ['team-lead', 'executive', 'admin'] },
    { text: 'Training', path: '/training', icon: BookOpen, roles: ['team-lead', 'executive', 'admin'] },
    { text: 'Reminders', path: '/reminders', icon: Bell, roles: ['team-lead', 'executive', 'admin'] },
    { text: 'Meetings', path: '/meetings', icon: Video, roles: ['team-lead', 'executive', 'admin'] },
    { text: 'User Mgmt', path: '/users', icon: Users, roles: ['admin'] },
  ].filter(item => item.roles.some(r => hasRole(r)));

  const NavItem = ({ item, mobile = false }) => (
    <NavLink to={item.path} onClick={() => mobile && setMobileOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${expanded || mobile ? 'px-3' : 'px-2 justify-center'} ${isActive ? '' : 'hover:bg-[var(--bg-hover)]'}`
      }
      style={({ isActive }) => isActive
        ? { backgroundColor: 'var(--brand-accent)', color: '#fff' }
        : { color: 'var(--text-secondary)' }
      }>
      {({ isActive }) => (
        <>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={isActive ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: 'var(--brand-light)', color: 'var(--brand-accent)' }}>
            <item.icon className="w-4 h-4" />
          </span>
          {(expanded || mobile) && <span className="truncate">{item.text}</span>}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4 border-b"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <button className="lg:hidden p-2 rounded-xl" style={{ color: 'var(--text-secondary)' }} onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: roleColor }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>FundCo Admin</p>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: roleColor }}>{roleBadge}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-muted)' }}>
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2.5 pl-2 border-l" style={{ borderColor: 'var(--border-color)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: roleColor }}>
              {initial}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{fullName.split(' ')[0]}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#dc2626'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed top-14 left-0 z-40 transition-[width] duration-300 overflow-hidden"
        style={{ width: expanded ? 240 : 64, height: 'calc(100vh - 56px)', backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>
        <div className="flex-1 overflow-y-auto py-3 px-2" style={{ scrollbarWidth: 'thin' }}>
          {expanded && <p className="px-3 text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Navigation</p>}
          <ul className="space-y-0.5">
            {menuItems.map(item => <li key={item.path}><NavItem item={item} /></li>)}
          </ul>
        </div>
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center h-10 border-t" style={{ borderColor: 'var(--sidebar-border)', color: 'var(--text-muted)' }}>
          {expanded ? <><ChevronLeft className="w-4 h-4" /><span className="text-xs ml-1">Collapse</span></> : <ChevronRight className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'tween' }}
              className="fixed top-0 left-0 w-72 h-full z-50 flex flex-col lg:hidden" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
              <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--sidebar-border)', backgroundColor: roleColor }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold">{initial}</div>
                  <div><p className="text-sm font-bold text-white">{fullName.split(' ')[0]}</p><p className="text-xs text-white/60">{roleBadge}</p></div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto py-3 px-2">
                <ul className="space-y-0.5">{menuItems.map(item => <li key={item.path}><NavItem item={item} mobile /></li>)}</ul>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="pt-14 transition-[margin] duration-300" style={{ marginLeft: expanded ? 240 : 64 }}>
        <div className="p-4 sm:p-6 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
