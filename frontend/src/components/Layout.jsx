import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [open, setOpen] = useState(true);

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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700">HR System</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
