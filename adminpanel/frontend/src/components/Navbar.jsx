//Navbar.jsx
import React from 'react';
import { Bell, ChevronDown, Command, Menu, Moon, Plus, Search, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

const Navbar = ({ user, onMenu, onToggleSidebar, collapsed, isDesktop }) => {
  const { theme, toggleTheme } = useTheme();
  const fullName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin User';
  const roleLabel = user?.role === 'admin' ? 'Super Admin' : user?.role === 'executive' ? 'Executive' : user?.role === 'team-lead' ? 'Team Lead' : 'Standard';

  return (
    <header className="glass fixed inset-x-0 top-0 z-50 border-b" style={{ height: 'var(--topbar-h)', borderColor: 'var(--c-border)' }}>
      <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button className="btn-ghost h-11 w-11 rounded-2xl p-0 lg:hidden" onClick={onMenu}>
            <Menu className="h-5 w-5" />
          </button>
          {isDesktop ? (
            <button className="btn-ghost hidden h-11 rounded-2xl px-3 lg:inline-flex" onClick={onToggleSidebar}>
              <Command className="h-4 w-4" />
              {collapsed ? 'Expand' : 'Collapse'}
            </button>
          ) : null}
          <div className="hidden min-w-[320px] items-center gap-3 rounded-[1.15rem] border px-4 py-3 lg:flex" style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface-strong)' }}>
            <Search className="h-4 w-4" style={{ color: 'var(--c-text-3)' }} />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Search workspaces, tasks, projects, people..." />
            <span className="badge" style={{ background: 'var(--c-surface-raised)', color: 'var(--c-text-3)' }}>⌘K</span>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <button className="btn-primary hidden h-11 rounded-2xl px-4 lg:inline-flex">
            <Plus className="h-4 w-4" />
            Quick Create
          </button>
          <button className="btn-ghost h-11 w-11 rounded-2xl p-0" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="btn-ghost relative h-11 w-11 rounded-2xl p-0">
            <Bell className="h-4 w-4" />
            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-sky-500" />
          </button>
          <button className="flex items-center gap-3 rounded-[1.15rem] border px-2 py-2" style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface-strong)' }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-white" style={{ background: 'var(--gradient-brand)' }}>
              {(user?.firstName || 'A')[0].toUpperCase()}
            </div>
            <div className="hidden text-left lg:block">
              <p className="text-sm font-bold" style={{ color: 'var(--c-text-0)' }}>{fullName}</p>
              <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>{roleLabel}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 lg:block" style={{ color: 'var(--c-text-3)' }} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;