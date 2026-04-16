import axios from 'axios';

const normalizeBase = (value, fallback) => {
  const raw = String(value || fallback || '').trim().replace(/\/+$/, '');
  try {
    const url = new URL(raw);
    if (url.hostname === 'localhost') {
      url.hostname = '127.0.0.1';
    }
    return url.toString().replace(/\/+$/, '');
  } catch {
    return raw;
  }
};

const ADMIN_API_BASE = normalizeBase(import.meta.env.VITE_ADMIN_API_URL, 'http://127.0.0.1:4002');
export const USER_API_BASE = normalizeBase(import.meta.env.VITE_USER_API_URL, 'http://127.0.0.1:4001');
export const USER_FRONTEND_BASE = normalizeBase(import.meta.env.VITE_USER_FRONTEND_URL, 'http://127.0.0.1:5173');

const userApi = axios.create({ baseURL: `${ADMIN_API_BASE}/api/admin/shared` });

const shouldClearSession = (error) => {
  if (error.response?.status !== 401) return false;
  const message = String(error.response?.data?.message || '').toLowerCase();
  return [
    'token expired',
    'invalid token',
    'token invalid or expired',
    'token missing',
    'auth required',
    'authentication required',
    'account is deactivated',
    'user not found',
    'not authorized',
  ].some((part) => message.includes(part));
};

userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (shouldClearSession(error)) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default userApi;
