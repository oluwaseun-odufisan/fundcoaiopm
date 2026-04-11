//App.jsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Tasks = lazy(() => import('./pages/Tasks.jsx'));
const Goals = lazy(() => import('./pages/Goals.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const Performance = lazy(() => import('./pages/Performance.jsx'));
const Users = lazy(() => import('./pages/Users.jsx'));
const MyTeam = lazy(() => import('./pages/MyTeam.jsx'));
const Projects = lazy(() => import('./pages/Projects.jsx'));
const Social = lazy(() => import('./pages/Social.jsx'));
const Training = lazy(() => import('./pages/Training.jsx'));
const Reminders = lazy(() => import('./pages/Reminders.jsx'));
const Meetings = lazy(() => import('./pages/Meetings.jsx'));

const Loader = () => (
  <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 120px)' }}>
    <div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin"
      style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} />
  </div>
);

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout><Outlet /></Layout>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  return (
    <>
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 500,
          borderRadius: 10,
          padding: '10px 16px',
          boxShadow: 'var(--shadow-md)',
        },
      }} />
      <Routes>
        <Route path="/login" element={user && !loading ? <Navigate to="/" replace /> : <Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Suspense fallback={<Loader />}><Dashboard /></Suspense>} />
          <Route path="/tasks" element={<Suspense fallback={<Loader />}><Tasks /></Suspense>} />
          <Route path="/goals" element={<Suspense fallback={<Loader />}><Goals /></Suspense>} />
          <Route path="/reports" element={<Suspense fallback={<Loader />}><Reports /></Suspense>} />
          <Route path="/performance" element={<Suspense fallback={<Loader />}><Performance /></Suspense>} />
          <Route path="/users" element={<Suspense fallback={<Loader />}><Users /></Suspense>} />
          <Route path="/my-team" element={<Suspense fallback={<Loader />}><MyTeam /></Suspense>} />
          <Route path="/projects" element={<Suspense fallback={<Loader />}><Projects /></Suspense>} />
          <Route path="/social" element={<Suspense fallback={<Loader />}><Social /></Suspense>} />
          <Route path="/training" element={<Suspense fallback={<Loader />}><Training /></Suspense>} />
          <Route path="/reminders" element={<Suspense fallback={<Loader />}><Reminders /></Suspense>} />
          <Route path="/meetings" element={<Suspense fallback={<Loader />}><Meetings /></Suspense>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => <AuthProvider><AppRoutes /></AuthProvider>;
export default App;
