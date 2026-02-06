// src/components/Navbar.jsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronDown, Settings, LogOut, Mail, Menu, X, Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

const Navbar = ({ user = {}, onLogout }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const menuRef = useRef(null);
  const desktopMenuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [emailMenuOpen, setEmailMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        (menuRef.current && !menuRef.current.contains(event.target)) &&
        (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target))
      ) {
        setMenuOpen(false);
        setEmailMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const handleEmailMenuToggle = () => setEmailMenuOpen((prev) => !prev);
  const handleLogout = () => {
    setMenuOpen(false);
    setEmailMenuOpen(false);
    onLogout();
  };

  const emailLinks = [
    { name: 'Outlook', href: 'https://outlook.live.com', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/50', ring: 'ring-blue-200 dark:ring-blue-700' },
    { name: 'Gmail', href: 'https://mail.google.com', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/50', ring: 'ring-red-200 dark:ring-red-700' },
    { name: 'Yahoo', href: 'https://mail.yahoo.com', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/50', ring: 'ring-purple-200 dark:ring-purple-700' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-[60] bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 shadow-md font-sans">
      <div className="flex items-center justify-between px-4 md:px-6 lg:pl-4 lg:pr-8 h-16 max-w-screen-2xl mx-auto">
        {/* LOGO & TITLE */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/')}
          aria-label="Go to FundCo Dashboard"
        >
          {/* Logo Icon */}
          <div className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
            <CheckCircle className="w-7 h-7 text-white drop-shadow-sm" />
            <div className="absolute inset-0 rounded-xl ring-2 ring-blue-300 dark:ring-blue-800 ring-opacity-60 group-hover:ring-opacity-100 transition-opacity" />
          </div>
          {/* Brand Name */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-none">
              <span className="text-purple-600 dark:text-purple-400 drop-shadow-sm">Fund</span>
              <span className="text-blue-600 dark:text-blue-400 drop-shadow-sm">Co</span>
              <sup className="text-xs align-super text-gray-500 dark:text-gray-400 font-medium ml-0.5">TM</sup>
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold tracking-wide">CAPITAL MANAGERS</p>
          </div>
        </div>
        {/* HAMBURGER MENU (MOBILE) */}
        <div ref={menuRef} className="relative">
          <button
            className="md:hidden p-2.5 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/50 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 hover:scale-110 transition-all duration-200 shadow-sm"
            onClick={handleMenuToggle}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          {/* MOBILE DROPDOWN */}
          {menuOpen && (
            <div className="absolute top-14 right-4 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden md:hidden">
              <div className="py-3">
                {/* Email Services */}
                <div className="px-4 py-2.5">
                  <button
                    onClick={handleEmailMenuToggle}
                    className="flex items-center justify-between w-full text-left text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2 py-1.5 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Email Services
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform duration-200 ${emailMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {emailMenuOpen && (
                    <ul className="mt-2 space-y-1.5 pl-8">
                      {emailLinks.map((link) => (
                        <li key={link.name}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block px-3 py-1.5 text-sm font-medium rounded-md ${link.color} hover:${link.bgColor} hover:ring-2 hover:${link.ring} transition-all`}
                            onClick={() => setMenuOpen(false)}
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Profile Settings */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition rounded-lg"
                >
                  <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Profile Settings
                </button>
                {/* User Info */}
                <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="relative">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full shadow-md ring-2 ring-white dark:ring-gray-800"
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-sm shadow-md ring-2 ring-white dark:ring-gray-800">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition rounded-lg border-t border-gray-200 dark:border-gray-700"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
        {/* DESKTOP RIGHT SECTION */}
        <div ref={desktopMenuRef} className="hidden md:flex items-center gap-6">
          {/* Email Icons */}
          {emailLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 group"
              title={link.name}
            >
              <div className={`p-2.5 ${link.bgColor} ${link.color} rounded-full hover:scale-110 hover:ring-4 hover:${link.ring} transition-all duration-200 shadow-md group-hover:shadow-lg`}>
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{link.name}</span>
            </a>
          ))}
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/50 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 hover:scale-110 hover:ring-4 hover:ring-blue-200 dark:hover:ring-blue-700 transition-all duration-200 shadow-md"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          {/* Settings */}
          <button
            className="p-2.5 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/50 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 hover:scale-110 hover:ring-4 hover:ring-blue-200 dark:hover:ring-blue-700 transition-all duration-200 shadow-md"
            onClick={() => navigate('/profile')}
            aria-label="Profile Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={handleMenuToggle}
              className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 dark:from-gray-800 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-600 border border-blue-300 hover:border-blue-400 dark:border-gray-700 dark:hover:border-gray-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="User Avatar"
                    className="w-9 h-9 rounded-full shadow-sm ring-2 ring-white dark:ring-gray-800"
                  />
                ) : (
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-sm shadow-md ring-2 ring-white dark:ring-gray-800">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[140px]">{user.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[140px]">{user.email}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-blue-700 dark:text-blue-300 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {menuOpen && (
              <ul className="absolute top-16 right-0 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden mt-2">
                <li>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full px-5 py-3.5 text-left text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition flex items-center gap-3 rounded-t-2xl"
                  >
                    <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Profile Settings
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-3.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition flex items-center gap-3 rounded-b-2xl"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;