import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../utils/api.js';
import userApi from '../utils/userApi.js';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);

const toCount = (value) => Math.max(0, Number(value) || 0);

const makeItem = ({ id, type, title, description, count = 1, to, tone = 'neutral', priority = 0 }) => ({
  id,
  type,
  title,
  description,
  count: toCount(count),
  to,
  tone,
  priority,
  createdAt: new Date().toISOString(),
});

export const NotificationProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    if (!user || authLoading) {
      setItems([]);
      return [];
    }

    setLoading(true);
    try {
      const [chatRes, taskRes, reportRes, meetingRes, reminderRes] = await Promise.all([
        userApi.get('/api/chats/unread-total').catch(() => ({ data: {} })),
        api.get('/tasks/stats').catch(() => ({ data: {} })),
        api.get('/reports/stats').catch(() => ({ data: {} })),
        api.get('/meetings', { params: { status: 'active' } }).catch(() => ({ data: {} })),
        api.get('/reminders', { params: { status: 'pending' } }).catch(() => ({ data: {} })),
      ]);

      const chatUnread = toCount(chatRes.data.unreadTotal ?? chatRes.data.totalUnread ?? chatRes.data.total ?? chatRes.data.count);
      const taskStats = taskRes.data.stats || {};
      const reportStats = reportRes.data.stats || {};
      const activeRooms = meetingRes.data.rooms || [];
      const reminders = reminderRes.data.reminders || [];

      const next = [];
      if (chatUnread) {
        next.push(makeItem({
          id: 'chat-unread',
          type: 'chat',
          title: `${chatUnread} unread chat${chatUnread === 1 ? '' : 's'}`,
          description: 'New direct or group messages need attention.',
          count: chatUnread,
          to: '/team-chat',
          tone: 'chat',
          priority: 5,
        }));
      }
      if (toCount(taskStats.submitted)) {
        next.push(makeItem({
          id: 'task-approvals',
          type: 'task',
          title: `${taskStats.submitted} task${taskStats.submitted === 1 ? '' : 's'} awaiting review`,
          description: 'Submitted work is ready for admin approval.',
          count: taskStats.submitted,
          to: '/tasks',
          tone: 'warning',
          priority: 4,
        }));
      }
      if (toCount(reportStats.pendingReview || reportStats.submitted)) {
        const count = toCount(reportStats.pendingReview || reportStats.submitted);
        next.push(makeItem({
          id: 'report-review',
          type: 'report',
          title: `${count} report${count === 1 ? '' : 's'} pending review`,
          description: 'Submitted reports are waiting for approval or feedback.',
          count,
          to: '/reports',
          tone: 'brand',
          priority: 3,
        }));
      }
      if (activeRooms.length) {
        next.push(makeItem({
          id: 'live-meetings',
          type: 'meeting',
          title: `${activeRooms.length} live meeting${activeRooms.length === 1 ? '' : 's'}`,
          description: 'Active rooms are currently available to join or moderate.',
          count: activeRooms.length,
          to: '/meetings',
          tone: 'secondary',
          priority: 2,
        }));
      }
      if (reminders.length) {
        next.push(makeItem({
          id: 'pending-reminders',
          type: 'reminder',
          title: `${reminders.length} pending reminder${reminders.length === 1 ? '' : 's'}`,
          description: reminders[0]?.message || 'Upcoming reminders are scheduled.',
          count: reminders.length,
          to: '/reminders',
          tone: 'info',
          priority: 1,
        }));
      }

      next.sort((a, b) => b.priority - a.priority);
      setItems(next);
      setLastUpdated(new Date());
      return next;
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    refresh();
    if (!user || authLoading) return undefined;
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [authLoading, refresh, user]);

  const counts = useMemo(() => {
    const byType = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + item.count;
      return acc;
    }, {});
    return {
      total: items.reduce((sum, item) => sum + item.count, 0),
      chat: byType.chat || 0,
      tasks: byType.task || 0,
      reports: byType.report || 0,
      meetings: byType.meeting || 0,
      reminders: byType.reminder || 0,
    };
  }, [items]);

  const value = useMemo(
    () => ({ items, counts, loading, lastUpdated, refresh }),
    [counts, items, lastUpdated, loading, refresh],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const value = useContext(NotificationContext);
  if (!value) {
    return { items: [], counts: { total: 0, chat: 0, tasks: 0, reports: 0, meetings: 0, reminders: 0 }, loading: false, refresh: async () => [] };
  }
  return value;
};

