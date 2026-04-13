import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

const Navbar = ({ onMenu }) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b"
      style={{ 
        height: 'var(--topbar-h)', 
        background: 'color-mix(in srgb, var(--c-bg) 92%, var(--c-surface))',
        borderColor: 'var(--c-border)'
      }}
    >
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Left: Company Name */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger */}
          <button
            onClick={onMenu}
            className="lg:hidden h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-[var(--c-surface-2)] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" style={{ color: 'var(--c-text)' }} />
          </button>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[1.5px]" style={{ color: 'var(--c-text-faint)' }}>
              FundCo Capital Managers
            </p>
            <p className="text-2xl font-black tracking-[-0.5px]" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-display)' }}>
              FundCo AI
            </p>
          </div>
        </div>

        {/* Right: Only Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="h-10 w-10 flex items-center justify-center rounded-2xl hover:bg-[var(--c-surface-2)] transition-colors"
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-5 w-5" style={{ color: 'var(--c-text)' }} />
          ) : (
            <Moon className="h-5 w-5" style={{ color: 'var(--c-text)' }} />
          )}
        </button>
      </div>
    </header>
  );
};

export default Navbar;