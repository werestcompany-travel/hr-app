import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useLangStore } from '../store/langStore';

export default function Layout() {
  const [open, setOpen] = useState(true);
  const { lang, setLang } = useLangStore();

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F0F4F8' }}>
      <Sidebar open={open} onToggle={() => setOpen(o => !o)} />
      <main
        className="flex-1 overflow-auto transition-all duration-300"
        style={{ marginLeft: 0 }}
      >
        {/* Top bar with hamburger */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur border-b border-gray-100">
          <button
            onClick={() => setOpen(o => !o)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
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
          <span className="text-sm font-semibold text-gray-700">HR System</span>
          <div className="ml-auto flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
            <button
              onClick={() => setLang('th')}
              className="px-3 py-1.5 transition-colors"
              style={lang === 'th' ? { backgroundColor: '#1B4332', color: '#fff' } : { color: '#9CA3AF' }}
            >
              TH
            </button>
            <button
              onClick={() => setLang('en')}
              className="px-3 py-1.5 transition-colors"
              style={lang === 'en' ? { backgroundColor: '#1B4332', color: '#fff' } : { color: '#9CA3AF' }}
            >
              EN
            </button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
