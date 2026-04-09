import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('adminTheme') === 'dark' } catch { return false }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('adminTheme', dark?'dark':'light') } catch {}
  }, [dark])

  const toggle = () => setDark(d => !d)
  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>
}