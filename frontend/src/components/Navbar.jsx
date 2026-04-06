// src/components/Navbar.jsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Mail, Menu, X, Sun, Moon, ChevronDown, ExternalLink } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

const Navbar = ({ user = {}, onLogout }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const dropdownRef  = useRef(null);
  const mobileRef    = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [emailOpen,    setEmailOpen]     = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (mobileRef.current   && !mobileRef.current.contains(e.target))   setMobileOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleLogout = () => { setDropdownOpen(false); setMobileOpen(false); onLogout(); };

  const emailLinks = [
    { name: 'Outlook',    href: 'https://outlook.live.com', color: '#0078d4' },
    { name: 'Gmail',      href: 'https://mail.google.com',  color: '#ea4335' },
    { name: 'Yahoo Mail', href: 'https://mail.yahoo.com',   color: '#6001d2' },
  ];

  const fullName = user?.fullName || user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  const initial  = (user?.firstName || user?.name || 'U').charAt(0).toUpperCase();

  /* ── Shared hover handlers ─────────────────────────────────────────────── */
  const hoverIn  = (e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.10)'; };
  const hoverOut = (e) => { e.currentTarget.style.backgroundColor = 'transparent'; };
  const menuHoverIn  = (e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; };
  const menuHoverOut = (e) => { e.currentTarget.style.backgroundColor = 'transparent'; };

  /* ── Reusable dropdown shell ───────────────────────────────────────────── */
  const DropdownShell = ({ children }) => (
    <div
      className="absolute top-11 right-0 w-52 rounded-xl shadow-xl overflow-hidden z-50 border"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      {children}
    </div>
  );

  return (
    <header
      className="fixed top-0 left-0 w-full z-[60] border-b"
      style={{ backgroundColor: 'var(--navbar-bg)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 max-w-screen-2xl mx-auto">

        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-3 flex-shrink-0 group" aria-label="Dashboard">
          <img src="/Fundco.svg" alt="FundCo" className="h-8 w-auto object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity" />
          <span className="hidden sm:block text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Capital Managers
          </span>
        </button>

        {/* ── Desktop ── */}
        <div className="hidden md:flex items-center gap-1.5">

          {/* Email */}
          <div className="relative">
            <button
              onClick={() => setEmailOpen((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              onMouseEnter={hoverIn} onMouseLeave={hoverOut}
            >
              <Mail className="w-4 h-4" />
              Email
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${emailOpen ? 'rotate-180' : ''}`} />
            </button>
            {emailOpen && (
              <div className="absolute top-10 right-0 w-44 rounded-xl shadow-xl py-1.5 z-50 border"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                {emailLinks.map((l) => (
                  <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer"
                    onClick={() => setEmailOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-sm font-medium"
                    style={{ color: l.color }}
                    onMouseEnter={menuHoverIn} onMouseLeave={menuHoverOut}>
                    {l.name} <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Theme */}
          <button onClick={toggleTheme} title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            className="p-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.65)' }}
            onMouseEnter={hoverIn} onMouseLeave={hoverOut} aria-label="Toggle theme">
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button onClick={() => navigate('/profile')} className="p-2 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.65)' }}
            onMouseEnter={hoverIn} onMouseLeave={hoverOut} aria-label="Settings">
            <Settings className="w-4 h-4" />
          </button>

          {/* User */}
          <div ref={dropdownRef} className="relative ml-1">
            <button onClick={() => setDropdownOpen((p) => !p)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
              style={{ color: 'rgba(255,255,255,0.9)' }}
              onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-white/20" />
                : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white/20 flex-shrink-0"
                    style={{ backgroundColor: 'var(--brand-accent)', color: '#fff' }}>{initial}</div>
              }
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold leading-tight truncate max-w-[120px]">{fullName}</p>
                <p className="text-xs truncate max-w-[120px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{user.email}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                style={{ color: 'rgba(255,255,255,0.45)' }} />
            </button>

            {dropdownOpen && (
              <DropdownShell>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{fullName}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                </div>
                <button onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={menuHoverIn} onMouseLeave={menuHoverOut}>
                  <Settings className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  Profile Settings
                </button>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 border-t"
                  style={{ borderColor: 'var(--border-color)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.07)'}
                  onMouseLeave={menuHoverOut}>
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </DropdownShell>
            )}
          </div>
        </div>

        {/* ── Mobile ── */}
        <div ref={mobileRef} className="md:hidden relative">
          <button onClick={() => setMobileOpen((p) => !p)} className="p-2 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.8)' }}
            onMouseEnter={hoverIn} onMouseLeave={hoverOut} aria-label="Menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {mobileOpen && (
            <div className="absolute top-11 right-0 w-72 rounded-xl shadow-xl overflow-hidden z-50 border"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>

              <div className="flex items-center gap-3 px-4 py-4 border-b"
                style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  : <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: 'var(--brand-primary)' }}>{initial}</div>
                }
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{fullName}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                </div>
              </div>

              {/* Email sub-section */}
              <div className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <button onClick={() => setEmailOpen((p) => !p)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={menuHoverIn} onMouseLeave={menuHoverOut}>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <span className="font-medium">Email Services</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${emailOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--text-muted)' }} />
                </button>
                {emailOpen && (
                  <div className="px-4 pb-3 space-y-1">
                    {emailLinks.map((l) => (
                      <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                        style={{ color: l.color }}
                        onMouseEnter={menuHoverIn} onMouseLeave={menuHoverOut}>
                        {l.name} <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-sm"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={menuHoverIn} onMouseLeave={menuHoverOut}>
                {theme === 'light'
                  ? <Moon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  : <Sun  className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>

              <button onClick={() => { setMobileOpen(false); navigate('/profile'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={menuHoverIn} onMouseLeave={menuHoverOut}>
                <Settings className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span className="font-medium">Profile Settings</span>
              </button>

              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 border-t"
                style={{ borderColor: 'var(--border-color)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.07)'}
                onMouseLeave={menuHoverOut}>
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;