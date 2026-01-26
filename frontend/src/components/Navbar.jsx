import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronDown, Settings, LogOut, Mail, Menu, X } from 'lucide-react';

const Navbar = ({ user = {}, onLogout }) => {
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [emailMenuOpen, setEmailMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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
    { name: 'Outlook', href: 'https://outlook.live.com', color: 'text-blue-600', bgColor: 'bg-blue-50', ring: 'ring-blue-200' },
    { name: 'Gmail', href: 'https://mail.google.com', color: 'text-red-600', bgColor: 'bg-red-50', ring: 'ring-red-200' },
    { name: 'Yahoo', href: 'https://mail.yahoo.com', color: 'text-purple-600', bgColor: 'bg-purple-50', ring: 'ring-purple-200' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-[60] bg-white border-b border-gray-300 shadow-md font-sans">
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
            <div className="absolute inset-0 rounded-xl ring-2 ring-blue-300 ring-opacity-60 group-hover:ring-opacity-100 transition-opacity" />
          </div>

          {/* Brand Name */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-none">
              <span className="text-purple-600 drop-shadow-sm">Fund</span>
              <span className="text-blue-600 drop-shadow-sm">Co</span>
              <sup className="text-xs align-super text-gray-500 font-medium ml-0.5">TM</sup>
            </h1>
            <p className="text-xs text-gray-600 font-semibold tracking-wide">CAPITAL MANAGERS</p>
          </div>
        </div>

        {/* HAMBURGER MENU (MOBILE) */}
        <div ref={menuRef} className="relative">
          <button
            className="md:hidden p-2.5 text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 hover:scale-110 transition-all duration-200 shadow-sm"
            onClick={handleMenuToggle}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* MOBILE DROPDOWN */}
          {menuOpen && (
            <div className="absolute top-14 right-4 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden md:hidden">
              <div className="py-3">
                {/* Email Services */}
                <div className="px-4 py-2.5">
                  <button
                    onClick={handleEmailMenuToggle}
                    className="flex items-center justify-between w-full text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-5 h-5 text-blue-600" />
                      Email Services
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${emailMenuOpen ? 'rotate-180' : ''}`}
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
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 transition rounded-lg"
                >
                  <Settings className="w-5 h-5 text-blue-600" />
                  Profile Settings
                </button>

                {/* User Info */}
                <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="relative">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full shadow-md ring-2 ring-white"
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-sm shadow-md ring-2 ring-white">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-white shadow-sm" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition rounded-lg border-t border-gray-200"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DESKTOP RIGHT SECTION */}
        <div className="hidden md:flex items-center gap-6">
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
              <span className="text-xs font-semibold text-gray-700">{link.name}</span>
            </a>
          ))}

          {/* Settings */}
          <button
            className="p-2.5 text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 hover:scale-110 hover:ring-4 hover:ring-blue-200 transition-all duration-200 shadow-md"
            onClick={() => navigate('/profile')}
            aria-label="Profile Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={handleMenuToggle}
              className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-300 hover:border-blue-400 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="User Avatar"
                    className="w-9 h-9 rounded-full shadow-sm ring-2 ring-white"
                  />
                ) : (
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-sm shadow-md ring-2 ring-white">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-white shadow-sm" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">{user.name}</p>
                <p className="text-xs text-gray-600 truncate max-w-[140px]">{user.email}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-blue-700 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {menuOpen && (
              <ul className="absolute top-16 right-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden mt-2">
                <li>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full px-5 py-3.5 text-left text-sm font-medium text-gray-800 hover:bg-blue-50 transition flex items-center gap-3 rounded-t-2xl"
                  >
                    <Settings className="w-5 h-5 text-blue-600" />
                    Profile Settings
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-3.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition flex items-center gap-3 rounded-b-2xl"
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