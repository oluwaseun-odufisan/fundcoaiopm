import axios from 'axios';

const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4002';

const api = axios.create({ baseURL: `${API_BASE}/api/admin` });

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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (shouldClearSession(err)) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;
export { API_BASE };
