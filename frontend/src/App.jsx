// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, useNavigate, Route, Outlet, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import Signup from './components/Signup';
import './index.css';
import Dashboard from './pages/Dashboard';
import PendingPage from './pages/PendingPage';
import CompletePage from './pages/CompletePage';
import Profile from './components/Profile';
import AssignedTasks from './pages/Assigned';
import CalendarView from './pages/Calendar';
import TeamChat from './pages/TeamChat';
import UrlShortener from './pages/UrlShortener';
import FileStorage from './pages/FileStorage';
import PerformanceAnalytics from './pages/PerformanceAnalytics';
import GenerateReport from './pages/GenerateReport';
import Payment from './pages/PerformanceBoard';
import SocialFeed from './pages/SocialFeed';
import AiTools from './pages/AiTools';
import Reminders from './pages/Reminders';
import Goals from './pages/Goals';
import Appraisals from './pages/Appraisals';
import Meeting from './pages/Meeting';
import Training from './pages/Training';
import Feedback from './pages/Feedback';
import { ThemeProvider } from './context/ThemeContext';

const App = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const handleAuthSubmit = (data) => {
    const user = {
      email: data.email,
      name: data.name || 'User',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=random`,
    };
    setCurrentUser(user);
    navigate('/', { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    navigate('/login', { replace: true });
  };

  const ProtectedLayout = () => (
    <Layout user={currentUser} onLogout={handleLogout}>
      <Outlet />
    </Layout>
  );

  return (
    <ThemeProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Login onSubmit={handleAuthSubmit} onSwitchMode={() => navigate('/signup')} />
            </div>
          }
        />

        <Route
          path="/signup"
          element={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Signup onSubmit={handleAuthSubmit} onSwitchMode={() => navigate('/login')} />
            </div>
          }
        />

        <Route element={currentUser ? <ProtectedLayout /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/complete" element={<CompletePage />} />
          <Route path="/profile" element={<Profile user={currentUser} setCurrentUser={setCurrentUser} onLogout={handleLogout} />} />
          <Route path="/assigned" element={<AssignedTasks />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/team-chat" element={<TeamChat />} />
          <Route path="/url-shortener" element={<UrlShortener />} />
          <Route path="/file-storage" element={<FileStorage />} />
          <Route path="/analytics" element={<PerformanceAnalytics />} />
          <Route path="/generate-report" element={<GenerateReport />} />
          <Route path="/performance-board" element={<Payment />} />
          <Route path="/social-feed" element={<SocialFeed />} />
          <Route path="/ai-tools" element={<AiTools />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/appraisals" element={<Appraisals />} />
          <Route path="/meeting" element={<Meeting />} />
          <Route path="/training" element={<Training />} />
          <Route path="/feedback" element={<Feedback />} />
        </Route>

        <Route path="/" element={<Navigate to={currentUser ? '/' : '/login'} replace />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;