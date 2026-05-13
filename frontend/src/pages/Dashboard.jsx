import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import StatCard from '../components/StatCard';
import RequestTable from '../components/RequestTable';
import { format } from 'date-fns';

const PendingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const OTIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const EmployeeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ApprovedIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats,   setStats]   = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/requests?status=pending'),
    ])
      .then(([s, r]) => {
        setStats(s.data);
        setPending(r.data.requests || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = format(new Date(), 'EEEE, d MMMM yyyy');

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{today}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Pending Leave"
          value={stats?.pendingLeave ?? '—'}
          icon={<PendingIcon />}
          accent="#F59E0B"
        />
        <StatCard
          label="Pending OT"
          value={stats?.pendingOT ?? '—'}
          icon={<OTIcon />}
          accent="#3B82F6"
        />
        <StatCard
          label="Total Employees"
          value={stats?.employees ?? '—'}
          icon={<EmployeeIcon />}
          accent="#52B788"
        />
        <StatCard
          label="Approved This Month"
          value={stats?.approvedMonth ?? '—'}
          icon={<ApprovedIcon />}
          accent="#8B5CF6"
        />
      </div>

      {/* Pending requests */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400 text-sm">
          Loading...
        </div>
      ) : (
        <RequestTable data={pending} title="Pending Approvals" />
      )}
    </div>
  );
}
