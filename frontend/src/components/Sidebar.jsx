import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const links = [
  { to: '/',                label: 'Dashboard',      icon: '▣' },
  { to: '/employees',       label: 'Employees',      icon: '◉' },
  { to: '/reports/leave',   label: 'Leave Report',   icon: '▤' },
  { to: '/announcements',   label: 'Announcements',  icon: '▦' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col"
      style={{ backgroundColor: '#1B4332', minHeight: '100vh' }}>

      {/* Logo */}
      <div className="px-6 py-5 border-b border-[rgba(82,183,136,0.2)]">
        <h1 className="text-white font-bold text-lg leading-tight">HR System</h1>
        <p className="text-[#B7E4C7] text-xs mt-0.5">Admin Dashboard</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
               ${isActive
                 ? 'bg-[#52B788] text-white'
                 : 'text-[#B7E4C7] hover:bg-[#2D6A4F] hover:text-white'
               }`
            }
          >
            <span className="text-lg">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-[rgba(82,183,136,0.2)]">
        <p className="text-[#B7E4C7] text-xs truncate">{user?.name || 'HR Admin'}</p>
        <button
          onClick={logout}
          className="mt-2 text-xs text-[#B7E4C7] hover:text-white underline"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
