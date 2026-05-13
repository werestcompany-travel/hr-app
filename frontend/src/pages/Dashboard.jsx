import { useEffect, useState } from 'react';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import RequestTable from '../components/RequestTable';

export default function Dashboard() {
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Pending Leave"       value={stats?.pendingLeave}  color="yellow" icon="⏳" />
        <StatCard label="Pending OT"          value={stats?.pendingOT}     color="blue"   icon="⏰" />
        <StatCard label="Total Employees"     value={stats?.employees}     color="green"  icon="👥" />
        <StatCard label="Approved This Month" value={stats?.approvedMonth} color="teal"   icon="✅" />
      </div>

      {/* Pending requests table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <RequestTable data={pending} title="Pending Approvals" />
      )}
    </div>
  );
}
