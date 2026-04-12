//Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BookOpen,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MessageSquare,
  Sparkles,
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
  { to: '/social', icon: MessageSquare, label: 'Social', roles: ['team-lead', 'executive', 'admin'] },
  { to: '/training', icon: BookOpen, label: 'Training', roles: ['team-lead', 'executive', 'admin'] },
  { to: '/reminders', icon: Bell, label: 'Reminders', roles: ['team-lead', 'executive', 'admin'] },
  { to: '/meetings', icon: Video, label: 'Meetings', roles: ['team-lead', 'executive', 'admin'] },
  { divider: true },
  { to: '/users', icon: Users, label: 'Users', roles: ['admin'] },
];

const SidebarInner = ({ user, hasRole, onLogout, collapsed, onNavigate }) => {
  const items = navConfig.filter((item) => !item.roles || item.roles.some((role) => hasRole(role)));
  const showCopy = !collapsed;
  const fullName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin';

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-4" style={{ borderColor: 'var(--c-border-subtle)' }}>
        <div className={`flex items-center ${showCopy ? 'gap-3' : 'justify-center'}`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: 'var(--gradient-brand)' }}>
            <Sparkles className="h-5 w-5" />
          </div>
          {showCopy ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--c-text-3)' }}>Nexus</p>
              <p className="text-lg font-black tracking-tight" style={{ color: 'var(--c-text-0)', fontFamily: 'var(--font-display)' }}>Admin OS</p>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`mx-3 mt-4 rounded-[1.5rem] border p-3 ${showCopy ? '' : 'px-2'}`}
        style={{
          borderColor: 'var(--c-border)',
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--c-accent) 13%, transparent), color-mix(in srgb, var(--c-accent-2) 8%, transparent))',
        }}
      >
        <div className={`flex items-center ${showCopy ? 'gap-3' : 'justify-center'}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: 'var(--gradient-brand)' }}>
            {(user?.firstName || 'A')[0].toUpperCase()}
          </div>
          {showCopy ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold" style={{ color: 'var(--c-text-0)' }}>{fullName}</p>
              <p className="truncate text-xs" style={{ color: 'var(--c-text-3)' }}>{user?.email || 'admin@company.com'}</p>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="scrollbar-none flex-1 overflow-y-auto px-3 py-5">
        {showCopy ? <p className="section-title mb-3 px-3">Workspace</p> : null}
        <ul className="space-y-1.5">
          {items.map((item, index) => {
            if (item.divider) return <li key={`divider-${index}`} className="my-3 px-2"><hr className="divider" /></li>;

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={`group relative flex items-center rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${showCopy ? 'gap-3' : 'justify-center'}`}
                  style={({ isActive }) =>
                    isActive
                      ? { background: 'var(--gradient-brand)', color: 'white', boxShadow: '0 12px 28px rgba(107, 70, 193, 0.18)' }
                      : { color: 'var(--c-text-2)' }
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="h-[18px] w-[18px] shrink-0" style={{ opacity: isActive ? 1 : 0.85 }} />
                      {showCopy ? <span className="truncate">{item.label}</span> : null}
                      {!showCopy ? (
                        <span
                          className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ background: 'var(--c-ink)', color: 'var(--c-surface-strong)' }}
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

      <div className="border-t p-3" style={{ borderColor: 'var(--c-border-subtle)' }}>
        <button onClick={onLogout} className={`btn-ghost w-full rounded-2xl ${showCopy ? 'justify-start px-3' : 'justify-center px-0'}`} style={{ color: 'var(--c-danger)' }}>
          <LogOut className="h-4 w-4" />
          {showCopy ? 'Sign Out' : null}
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ user, hasRole, onLogout, collapsed, mobileOpen, onClose }) => {
  const width = collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)';

  return (
    <>
      <aside className="glass fixed left-0 top-0 z-40 hidden h-screen border-r transition-[width] duration-200 lg:block" style={{ width, borderColor: 'var(--c-border)' }}>
        <SidebarInner user={user} hasRole={hasRole} onLogout={onLogout} collapsed={collapsed} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/55 lg:hidden" onClick={onClose} />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.2 }}
              className="glass fixed left-0 top-0 z-50 h-screen w-[18rem] border-r lg:hidden"
              style={{ borderColor: 'var(--c-border)' }}
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