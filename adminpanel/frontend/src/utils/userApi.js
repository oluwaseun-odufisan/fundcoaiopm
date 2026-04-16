import axios from 'axios';

const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4002';
export const USER_API_BASE = import.meta.env.VITE_USER_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:4001';
export const USER_FRONTEND_BASE = import.meta.env.VITE_USER_FRONTEND_URL || import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

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

