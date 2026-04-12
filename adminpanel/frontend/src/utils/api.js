//api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4002';

const api = axios.create({ baseURL: `${API_BASE}/api/admin` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
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