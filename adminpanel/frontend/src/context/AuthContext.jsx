import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [admin,   setAdmin]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const user  = localStorage.getItem('adminUser')
    if (token && user) {
      try { setAdmin(JSON.parse(user)) } catch {}
      authService.getMe()
        .then(({ data }) => setAdmin(data.admin))
        .catch(() => { localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser'); setAdmin(null) })
        .finally(() => setLoading(false))
    } else { setLoading(false) }
  }, [])

  const login = (adminData, token) => {
    localStorage.setItem('adminToken', token)
    localStorage.setItem('adminUser', JSON.stringify(adminData))
    setAdmin(adminData)
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setAdmin(null)
  }

  const isSuperAdmin = admin?.role === 'super-admin'
  const isExecutive  = admin?.role === 'executive'  || isSuperAdmin
  const isTeamLead   = admin?.role === 'team-lead'  || isExecutive

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, isSuperAdmin, isExecutive, isTeamLead }}>
      {children}
    </AuthContext.Provider>
  )
}