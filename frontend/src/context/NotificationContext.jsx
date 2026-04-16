import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const NotificationContext = createContext(null);
const USER_API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001';
const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4002';
const EMPTY_COUNTS = { total: 0, chat: 0, social: 0, tasks: 0, reminders: 0, meetings: 0, reports: 0, goals: 0, files: 0, system: 0 };

const getToken = () => localStorage.getItem('token');
const getHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const toCount = (value) => Math.max(0, Number(value) || 0);

const routeFor = (notification) => {
  const data = notification?.data || {};
  switch (notification?.type) {
    case 'chat': return '/team-chat';
    case 'social': return '/social-feed';
    case 'task': return '/assigned';
    case 'reminder': return '/reminders';
    case 'meeting': return data.roomId ? `/room/${data.roomId}` : '/meeting';
    case 'report': return '/reports';
    case 'goal': return '/goals';
    case 'file': return '/file-storage';
    default: return '/';
  }
};

const toneFor = (type) => {
  switch (type) {
    case 'chat': return 'chat';
    case 'social': return 'secondary';
    case 'task': return 'warning';
    case 'reminder': return 'info';
    case 'meeting': return 'brand';
    case 'report': return 'brand';
    case 'goal': return 'success';
    case 'file': return 'secondary';
    default: return 'neutral';
  }
};

const normalizeNotification = (notification) => ({
  ...notification,
  id: notification?._id || notification?.id,
  to: routeFor(notification),
  tone: toneFor(notification?.type),
  description: notification?.body || '',
});

export const NotificationProvider = ({ children, currentUser }) => {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token || !currentUser) {
      setItems([]);
      setCounts(EMPTY_COUNTS);
      return [];
    }

    setLoading(true);
    try {
      const [notificationRes, chatRes] = await Promise.all([
        axios.get(`${USER_API_BASE}/api/notifications`, { headers: getHeaders() }),
        axios.get(`${USER_API_BASE}/api/chats/unread-total`, { headers: getHeaders() }).catch(() => ({ data: {} })),
      ]);

      const notifications = (notificationRes.data.notifications || []).map(normalizeNotification);
      const unreadByType = notificationRes.data.unreadByType || {};
      const unreadChat = toCount(chatRes.data.unreadTotal ?? chatRes.data.totalUnread ?? chatRes.data.total ?? chatRes.data.count);

      const nextCounts = {
        chat: Math.max(toCount(unreadByType.chat), unreadChat),
        social: toCount(unreadByType.social),
        tasks: toCount(unreadByType.task),
        reminders: toCount(unreadByType.reminder),
        meetings: toCount(unreadByType.meeting),
        reports: toCount(unreadByType.report),
        goals: toCount(unreadByType.goal),
        files: toCount(unreadByType.file),
        system: toCount(unreadByType.system),
      };
      nextCounts.total = Object.values(nextCounts).reduce((sum, value) => sum + value, 0);

      setItems(notifications);
      setCounts(nextCounts);
      setLastUpdated(new Date());
      return notifications;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const token = getToken();
    if (!token || !currentUser) {
      setItems([]);
      setCounts(EMPTY_COUNTS);
      return undefined;
    }

    refresh();

    const userSocket = io(USER_API_BASE, { auth: { token }, transports: ['websocket', 'polling'] });
    const adminSocket = io(ADMIN_API_BASE, { auth: { token }, transports: ['websocket', 'polling'] });
    const handleIncoming = () => refresh();

    userSocket.on('notification:new', handleIncoming);
    adminSocket.on('notification:new', handleIncoming);

    const timer = setInterval(refresh, 30000);
    return () => {
      clearInterval(timer);
      userSocket.off('notification:new', handleIncoming);
      adminSocket.off('notification:new', handleIncoming);
      userSocket.disconnect();
      adminSocket.disconnect();
    };
  }, [currentUser, refresh]);

  const markRead = useCallback(async (notificationId) => {
    if (!notificationId) return;
    try {
      await axios.patch(`${USER_API_BASE}/api/notifications/${notificationId}/read`, {}, { headers: getHeaders() });
      await refresh();
    } catch {}
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    try {
      await axios.patch(`${USER_API_BASE}/api/notifications/read-all`, {}, { headers: getHeaders() });
      await refresh();
    } catch {}
  }, [refresh]);

  const markTypeRead = useCallback(async (type) => {
    if (!type) return;
    try {
      await axios.patch(`${USER_API_BASE}/api/notifications/context-read`, { type }, { headers: getHeaders() });
      await refresh();
    } catch {}
  }, [refresh]);

  const value = useMemo(
    () => ({ items, counts, loading, lastUpdated, refresh, markRead, markAllRead, markTypeRead }),
    [counts, items, lastUpdated, loading, markAllRead, markRead, markTypeRead, refresh],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const value = useContext(NotificationContext);
  if (!value) {
    return { items: [], counts: EMPTY_COUNTS, loading: false, lastUpdated: null, refresh: async () => [], markRead: async () => {}, markAllRead: async () => {}, markTypeRead: async () => {} };
  }
  return value;
};
