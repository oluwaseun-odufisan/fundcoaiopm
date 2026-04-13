import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
  UsersRound,
  Video,
} from 'lucide-react';

const navConfig = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['team-lead', 'executive', 'admin'] },
  { to: '/tasks', icon: ListTodo, label: 'Tasks', roles: ['team-lead', 'executive', 'admin'] },
  { to: '/projects', icon: FolderKanban, label: 'Projects', roles: ['team-lead', 'executive', 'admin'] },
  { to: '/goals', icon: Target, label: 'Goals', roles: ['team-lead', 'executive', 'admin'] },
  { to: '/reports', icon: FileText, label: 'Reports', roles: ['team-lead', 'executive', 'admin'] },
  { to: '/performance', icon: TrendingUp, label: 'Performance', roles: ['team-lead', 'executive', 'admin'] },
  { divider: true },
  { to: '/my-team', icon: UsersRound, label: 'My Team', roles: ['team-lead', 'executive', 'admin'] },
  { to: '/social', icon: MessageSquare, label: 'Social Feed', roles: ['team-lead', 'executive', 'admin'] },
  { to: '/training', icon: BookOpen, label: 'Training', roles: ['team-lead', 'executive', 'admin'] },
  { to: '/reminders', icon: Bell, label: 'Reminders', roles: ['team-lead', 'executive', 'admin'] },
  { to: '/meetings', icon: Video, label: 'Meetings', roles: ['team-lead', 'executive', 'admin'] },
  { divider: true },
  { to: '/users', icon: Users, label: 'Users', roles: ['admin'] },
];

const SidebarInner = ({ user, hasRole, onLogout, collapsed, onNavigate }) => {
  const items = navConfig.filter((item) => !item.roles || item.roles.some((role) => hasRole(role)));
  const showText = !collapsed;
  const fullName =
    user?.fullName ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    'Admin';
  const roleLabel =
    user?.role === 'admin'
      ? 'Super Admin'
      : user?.role === 'executive'
        ? 'Executive'
        : user?.role === 'team-lead'
          ? 'Team Lead'
          : 'Standard';

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-5" style={{ borderColor: 'var(--c-border)' }}>
        <div className={`flex items-center ${showText ? 'gap-3' : 'justify-center'}`}>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] text-white"
            style={{ background: 'var(--brand-primary)' }}
          >
            <span className="text-lg font-black">F</span>
          </div>
          {showText ? (
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: 'var(--c-text-faint)' }}>
                FundCo AI
              </p>
              <p className="truncate text-base font-black" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-display)' }}>
                Admin Workspace
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-3 pt-4">
        <div
          className={`rounded-[1.4rem] border p-3 ${showText ? '' : 'flex justify-center'}`}
          style={{ background: 'var(--c-surface-2)', borderColor: 'var(--c-border)' }}
        >
          <div className={`flex items-center ${showText ? 'gap-3' : 'justify-center'}`}>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white"
              style={{ background: 'var(--brand-secondary)' }}
            >
              {(user?.firstName || 'A')[0].toUpperCase()}
            </div>
            {showText ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-black" style={{ color: 'var(--c-text)' }}>{fullName}</p>
                <p className="truncate text-xs" style={{ color: 'var(--c-text-faint)' }}>{roleLabel}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="scrollbar-none flex-1 overflow-y-auto px-3 py-4">
        {showText ? <p className="section-title mb-3 px-3">Navigation</p> : null}
        <ul className="space-y-1">
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <li key={`divider-${index}`} className="px-2 py-2">
                  <hr className="divider" />
                </li>
              );
            }

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={`group relative flex items-center rounded-[1.1rem] px-3 py-3 text-sm font-bold transition-all ${showText ? 'gap-3' : 'justify-center'}`}
                  style={({ isActive }) =>
                    isActive
                      ? { background: 'var(--brand-primary)', color: '#ffffff', boxShadow: 'var(--shadow-sm)' }
                      : { color: 'var(--c-text-soft)' }
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="h-[18px] w-[18px] shrink-0" style={{ opacity: isActive ? 1 : 0.9 }} />
                      {showText ? <span className="truncate">{item.label}</span> : null}
                      {!showText ? (
                        <span
                          className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-full px-3 py-2 text-xs font-black opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ background: 'var(--c-surface-inverse)', color: 'var(--c-bg)' }}
                        >
                          {item.label}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-3" style={{ borderColor: 'var(--c-border)' }}>
        <button
          type="button"
          onClick={onLogout}
          className={`btn-danger w-full ${showText ? 'justify-start' : 'justify-center px-0'}`}
        >
          <LogOut className="h-4 w-4" />
          {showText ? 'Sign Out' : null}
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ user, hasRole, onLogout, collapsed, mobileOpen, onClose }) => {
  const width = collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)';

  return (
    <>
      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen border-r lg:block"
        style={{ width, background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
      >
        <SidebarInner user={user} hasRole={hasRole} onLogout={onLogout} collapsed={collapsed} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/45 lg:hidden"
              onClick={onClose}
              aria-label="Close navigation"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 top-0 z-50 h-screen border-r lg:hidden"
              style={{ width: 'var(--sidebar-w)', background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
            >
              <SidebarInner user={user} hasRole={hasRole} onLogout={onLogout} collapsed={false} onNavigate={onClose} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
