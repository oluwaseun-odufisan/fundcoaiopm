import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import AppLayout       from './components/layout/AppLayout'
import LoginPage       from './pages/LoginPage'
import DashboardPage   from './pages/DashboardPage'
import TasksPage       from './pages/TasksPage'
import GoalsPage       from './pages/GoalsPage'
import ReportsPage     from './pages/ReportsPage'
import PerformancePage from './pages/PerformancePage'
import UsersPage       from './pages/UsersPage'
import LearningPage    from './pages/LearningPage'
import PostsPage       from './pages/PostsPage'
import RemindersPage   from './pages/RemindersPage'
import RoomsPage       from './pages/RoomsPage'
import AdminsPage      from './pages/AdminsPage'
import SettingsPage    from './pages/SettingsPage'
import ProjectsPage    from './pages/ProjectsPage'
import MyTeamPage      from './pages/MyTeamPage'
import { Spinner }     from './components/common'

function Guard({ children, roles }) {
  const { admin, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-app)' }}>
      <Spinner size={28}/>
    </div>
  )
  if (!admin) return <Navigate to="/login" replace/>
  if (roles && !roles.includes(admin.role)) return <Navigate to="/" replace/>
  return children
}

function AppRoutes() {
  const { admin } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={admin?<Navigate to="/" replace/>:<LoginPage/>}/>
      <Route element={<Guard><AppLayout/></Guard>}>
        <Route index              element={<DashboardPage/>}/>
        <Route path="tasks"       element={<TasksPage/>}/>
        <Route path="goals"       element={<GoalsPage/>}/>
        <Route path="reports"     element={<ReportsPage/>}/>
        <Route path="performance" element={<PerformancePage/>}/>
        <Route path="projects"    element={<ProjectsPage/>}/>
        <Route path="my-team"     element={<MyTeamPage/>}/>
        <Route path="users"       element={<UsersPage/>}/>
        <Route path="learning"    element={<LearningPage/>}/>
        <Route path="posts"       element={<PostsPage/>}/>
        <Route path="reminders"   element={<RemindersPage/>}/>
        <Route path="rooms"       element={<RoomsPage/>}/>
        <Route path="admins"      element={<Guard roles={['super-admin']}><AdminsPage/></Guard>}/>
        <Route path="settings"    element={<SettingsPage/>}/>
      </Route>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes/>
          <Toaster position="top-right" toastOptions={{
            duration:3500,
            style:{
              background:'var(--bg-surface)', color:'var(--text-primary)',
              border:'1px solid var(--border)', borderRadius:'var(--radius-md)',
              fontSize:'13px', fontFamily:'inherit', boxShadow:'var(--shadow)',
            },
            success:{ iconTheme:{ primary:'var(--success)', secondary:'#fff' } },
            error:  { iconTheme:{ primary:'var(--danger)',  secondary:'#fff' } },
          }}/>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}