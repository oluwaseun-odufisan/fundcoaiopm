import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, Moon, RefreshCw, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

const toneStyles = {
  chat: { bg: 'var(--brand-secondary-soft)', color: 'var(--brand-secondary)' },
  warning: { bg: 'var(--c-warning-soft)', color: 'var(--c-warning)' },
  success: { bg: 'var(--c-success-soft)', color: 'var(--c-success)' },
  danger: { bg: 'var(--c-danger-soft)', color: 'var(--c-danger)' },
  brand: { bg: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' },
  secondary: { bg: 'var(--brand-secondary-soft)', color: 'var(--brand-secondary)' },
  info: { bg: 'var(--c-info-soft)', color: 'var(--c-info)' },
  neutral: { bg: 'var(--c-panel-subtle)', color: 'var(--c-text-soft)' },
};

const formatUpdatedAt = (value) => {
  if (!value) return 'Not refreshed yet';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not refreshed yet';
  return `Updated ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const NotificationDropdown = ({ items, total, loading, lastUpdated, onRefresh }) => (
  <div
    className="surface-panel absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[0.85rem]"
    style={{ boxShadow: 'var(--shadow-lg)' }}
  >
    <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--c-border)' }}>
      <div>
        <p className="text-sm font-black" style={{ color: 'var(--c-text)' }}>Notifications</p>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--c-text-faint)' }}>{formatUpdatedAt(lastUpdated)}</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="btn-ghost h-9 w-9 rounded-[0.7rem] p-0"
        aria-label="Refresh notifications"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>

    <div className="max-h-[24rem] overflow-y-auto py-2">
      {loading && items.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--c-text-soft)' }}>
          Loading notifications...
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>All clear</p>
          <p className="mt-1 text-xs leading-5" style={{ color: 'var(--c-text-soft)' }}>
            Chat alerts, approvals, reports, meetings, and reminders will appear here.
          </p>
        </div>
      ) : null}

      {items.map((item) => {
        const tone = toneStyles[item.tone] || toneStyles.neutral;
        return (
          <Link
            key={item.id}
            to={item.to || item.href || '#'}
            className="mx-2 flex items-start gap-3 rounded-[0.75rem] px-3 py-3 transition-colors hover:bg-[var(--c-panel-subtle)]"
          >
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.7rem] text-sm font-black"
              style={{ background: tone.bg, color: tone.color }}
            >
              {item.count > 99 ? '99+' : item.count || 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold" style={{ color: 'var(--c-text)' }}>{item.title}</span>
              {item.description ? (
                <span className="mt-0.5 block text-xs leading-5" style={{ color: 'var(--c-text-soft)' }}>{item.description}</span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </div>

    <div className="border-t px-4 py-3 text-xs" style={{ borderColor: 'var(--c-border)', color: 'var(--c-text-faint)' }}>
      {total > 0 ? `${total} items need attention` : 'No pending admin items'}
    </div>
  </div>
);

const Navbar = ({ onMenu }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { items, counts, loading, lastUpdated, refresh } = useNotifications();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!notificationRef.current?.contains(event.target)) setNotificationOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const total = counts?.total || 0;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b"
      style={{
        height: 'var(--topbar-h)',
        background: 'color-mix(in srgb, var(--c-bg) 92%, var(--c-panel))',
        borderColor: 'var(--c-border)',
      }}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="flex h-10 w-10 items-center justify-center rounded-[0.75rem] transition-colors hover:bg-[var(--c-panel-subtle)] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" style={{ color: 'var(--c-text)' }} />
          </button>

          <div>
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em]" style={{ color: 'var(--c-text-faint)' }}>
              FundCo Capital Managers
            </p>
            <p className="text-xl font-black tracking-[-0.03em]" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-display)' }}>
              FundCo AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationOpen((open) => !open)}
              className="relative flex h-10 w-10 items-center justify-center rounded-[0.75rem] transition-colors hover:bg-[var(--c-panel-subtle)]"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" style={{ color: 'var(--c-text)' }} />
              {total > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full px-1.5 text-[0.65rem] font-black text-white" style={{ height: 20, background: 'var(--c-danger)' }}>
                  {total > 99 ? '99+' : total}
                </span>
              ) : null}
            </button>

            {notificationOpen ? (
              <NotificationDropdown
                items={items}
                total={total}
                loading={loading}
                lastUpdated={lastUpdated}
                onRefresh={refresh}
              />
            ) : null}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-[0.75rem] transition-colors hover:bg-[var(--c-panel-subtle)]"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5" style={{ color: 'var(--c-text)' }} />
            ) : (
              <Moon className="h-5 w-5" style={{ color: 'var(--c-text)' }} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;




