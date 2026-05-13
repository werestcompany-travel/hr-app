import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../api/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function LeaveReport() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({
    from:       format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to:         format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    status:     '',
    department: '',
  });

  const fetchReport = () => {
    setLoading(true);
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    );
    api.get(`/admin/reports/leave?${params}`)
      .then(r => setRequests(r.data.requests || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReport(); }, []);

  // Chart data: group by leave type
  const chartData = useMemo(() => {
    const counts = {};
    requests.forEach(r => {
      const key = r.type;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [requests]);

  const departments = [...new Set(requests.map(r => r.users?.department).filter(Boolean))];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Leave Report</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="block text-xs text-gray-500 font-medium">From</label>
          <input type="date" value={filters.from}
            onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-gray-500 font-medium">To</label>
          <input type="date" value={filters.to}
            onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-gray-500 font-medium">Status</label>
          <select value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-gray-500 font-medium">Department</label>
          <select value={filters.department}
            onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none">
            <option value="">All</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <button
          onClick={fetchReport}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: '#52B788' }}>
          Apply
        </button>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Requests by Leave Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#52B788" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Leave Requests ({requests.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Start</th>
                <th className="px-5 py-3">End</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Rejection Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">No requests found.</td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {req.users?.name || '—'}
                      {req.users?.department && (
                        <span className="block text-xs text-gray-400">{req.users.department}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 capitalize text-gray-600">{req.type}</td>
                    <td className="px-5 py-3 text-gray-600">{req.start_date}</td>
                    <td className="px-5 py-3 text-gray-600">{req.end_date}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${STATUS_STYLES[req.status] || 'bg-gray-100 text-gray-600'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-red-500 text-xs max-w-xs">
                      {req.approval_steps?.[0]?.reject_reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
