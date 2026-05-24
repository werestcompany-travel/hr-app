import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useLangStore } from '../store/langStore';
import { useThemeStore } from '../store/themeStore';

export default function Layout() {
  const [open, setOpen]     = useState(true);
  const { lang, setLang }   = useLangStore();
  const { dark, toggleDark } = useThemeStore();

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--page-bg)' }}>
      <Sidebar open={open} onToggle={() => setOpen(o => !o)} />
      <main className="flex-1 overflow-auto transition-all duration-300">
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 backdrop-blur border-b"
          style={{
            backgroundColor: 'var(--topbar-bg)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Toggle sidebar"
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>

          <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>HR System</span>

          <div className="ml-auto flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl transition-colors"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              {dark ? (
                /* Sun icon */
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                /* Moon icon */
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>

            {/* Language switcher */}
            <div
              className="flex items-center rounded-lg overflow-hidden text-xs font-semibold"
              style={{ border: '1px solid var(--border)' }}
            >
              <button
                onClick={() => setLang('th')}
                className="px-3 py-1.5 transition-colors"
                style={lang === 'th'
                  ? { backgroundColor: '#1B4332', color: '#fff' }
                  : { color: 'var(--text-4)', backgroundColor: 'transparent' }}
              >
                TH
              </button>
              <button
                onClick={() => setLang('en')}
                className="px-3 py-1.5 transition-colors"
                style={lang === 'en'
                  ? { backgroundColor: '#1B4332', color: '#fff' }
                  : { color: 'var(--text-4)', backgroundColor: 'transparent' }}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
