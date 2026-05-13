import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const links = [
  {
    to: '/', label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/employees', label: 'Employees',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/reports/leave', label: 'Leave Report',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: '/announcements', label: 'Announcements',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
];

export default function Sidebar({ open, onToggle }) {
  const { user, logout } = useAuthStore();

  return (
    <>
      {/* Overlay for mobile when open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className="flex-shrink-0 flex flex-col shadow-lg transition-all duration-300 overflow-hidden z-30"
        style={{
          backgroundColor: '#1B4332',
          minHeight: '100vh',
          width: open ? '240px' : '0px',
          position: window.innerWidth < 768 ? 'fixed' : 'relative',
        }}
      >
        <div className="w-60 flex flex-col h-full min-h-screen">
          {/* Logo + close */}
          <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#52B788' }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-white font-bold text-sm leading-none whitespace-nowrap">HR System</p>
                <p className="text-white/50 text-xs mt-0.5 whitespace-nowrap">Admin Dashboard</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {links.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap
                   ${isActive
                     ? 'text-white shadow-sm'
                     : 'text-white/60 hover:text-white hover:bg-white/10'
                   }`
                }
                style={({ isActive }) => isActive ? { backgroundColor: '#52B788' } : {}}
              >
                {icon}
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: '#52B788' }}>
                {(user?.name || 'H').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.name || 'HR Admin'}</p>
                <button onClick={logout} className="text-white/40 text-xs hover:text-white/70 transition-colors">
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
