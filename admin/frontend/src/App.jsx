import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Components
import AdminLayout from './components/AdminLayout.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import AdminSignup from './components/AdminSignup.jsx';
import AdminProfile from './components/AdminProfile.jsx';

// Pages
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUserManagement from './pages/AdminUserManagement.jsx';
import AdminTaskManagement from './pages/AdminTaskManagement.jsx';
import AdminGoalManagement from './pages/AdminGoalManagement.jsx';
import AdminFileManagement from './pages/AdminFileManagement.jsx';
import AdminUserList from './pages/AdminUserList.jsx';
import AdminTaskOverview from './pages/AdminTaskOverview.jsx';
import AdminGoalOverview from './pages/AdminGoalOverview.jsx';
import AdminFileStorage from './pages/AdminFileStorage.jsx';
import AdminReports from './pages/AdminReports.jsx';
import AdminAnalytics from './pages/AdminAnalytics.jsx';

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || 'http://localhost:4000';

const App = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenChecked, setIsTokenChecked] = useState(false);

  // Check for existing token on mount
  const fetchAdmin = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    console.log('Checking token in localStorage:', token ? 'Token found' : 'No token found');
    if (!token) {
      console.debug('No admin token found in localStorage');
      setIsLoading(false);
      setIsTokenChecked(true);
      return;
    }

    if (typeof token !== 'string' || token.split('.').length !== 3) {
      console.warn('Invalid token format:', token);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      toast.error('Invalid session detected. Please log in.');
      setIsLoading(false);
      setIsTokenChecked(true);
      navigate('/admin/login', { replace: true });
      return;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(`${API_BASE_URL}/api/admin/me`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      console.log('Fetch admin response:', response.data);
      if (response.data.success) {
        setAdmin(response.data.admin);
        localStorage.setItem('admin', JSON.stringify(response.data.admin));
      } else {
        console.warn('Fetch admin failed:', response.data.message);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        delete axios.defaults.headers.common['Authorization'];
        toast.error('Session invalid. Please log in.');
        navigate('/admin/login', { replace: true });
      }
    } catch (err) {
      console.error('Error fetching admin:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      toast.error(err.response?.data?.message || 'Failed to validate session.');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      delete axios.defaults.headers.common['Authorization'];
      navigate('/admin/login', { replace: true });
    } finally {
      setIsLoading(false);
      setIsTokenChecked(true);
    }
  }, [navigate]);

  useEffect(() => {
    if (!isTokenChecked) {
      console.log('Running initial token check');
      fetchAdmin();
    }
  }, [fetchAdmin, isTokenChecked]);

  const handleAuthSubmit = (data) => {
    console.log('handleAuthSubmit called with:', data);
    if (!data.token || typeof data.token !== 'string' || data.token.split('.').length !== 3) {
      console.error('Invalid token received:', data.token);
      toast.error('Invalid token received. Please try again.');
      return;
    }
    if (!data.admin?.role) {
      console.error('Admin data missing role:', data.admin);
      toast.error('Invalid admin data received.');
      return;
    }
    try {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('admin', JSON.stringify(data.admin));
      const savedToken = localStorage.getItem('adminToken');
      console.log('Token saved to localStorage:', savedToken);
      if (savedToken !== data.token) {
        console.error('Token mismatch after save:', { saved: savedToken, expected: data.token });
        toast.error('Failed to save session. Please try again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        return;
      }
      setAdmin(data.admin);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setIsTokenChecked(false); // Trigger re-validation
      toast.success('Logged in successfully!');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Error saving to localStorage:', err);
      toast.error('Failed to save session. Please try again.');
    }
  };

  const handleLogout = () => {
    console.log('Logging out admin');
    setAdmin(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully.');
    navigate('/admin/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 text-xl font-semibold"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  const ProtectedLayout = () => (
    <AdminLayout admin={admin} onLogout={handleLogout}>
      <Outlet />
    </AdminLayout>
  );

  const SuperAdminRoute = () => {
    console.log('SuperAdminRoute check - admin:', admin);
    if (!admin || admin.role !== 'super-admin') {
      toast.error('Access denied: Super-admin role required.');
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Outlet />;
  };

  return (
    <Routes>
      <Route
        path="/admin/login"
        element={admin ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin onSubmit={handleAuthSubmit} />}
      />
      <Route
        path="/admin/signup"
        element={admin ? <Navigate to="/admin/dashboard" replace /> : <AdminSignup onSubmit={handleAuthSubmit} />}
      />
      <Route element={admin ? <ProtectedLayout /> : <Navigate to="/admin/login" replace />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route element={<SuperAdminRoute />}>
          <Route path="/admin/user-management" element={<AdminUserManagement onLogout={handleLogout} />} />
          <Route path="/admin/user-list" element={<AdminUserList />} />
        </Route>
        <Route path="/admin/task-management" element={<AdminTaskManagement />} />
        <Route path="/admin/goal-management" element={<AdminGoalManagement />} />
        <Route path="/admin/file-management" element={<AdminFileManagement />} />
        <Route path="/admin/task-overview" element={<AdminTaskOverview />} />
        <Route path="/admin/goal-overview" element={<AdminGoalOverview />} />
        <Route path="/admin/file-storage" element={<AdminFileStorage />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/profile" element={<AdminProfile admin={admin} setAdmin={setAdmin} onLogout={handleLogout} />} />
      </Route>
      <Route path="/" element={<Navigate to={admin ? '/admin/dashboard' : '/admin/login'} replace />} />
      <Route path="*" element={<Navigate to={admin ? '/admin/dashboard' : '/admin/login'} replace />} />
    </Routes>
  );
};

export default App;