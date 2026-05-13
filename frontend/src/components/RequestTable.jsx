import { useMemo, useState } from 'react';
import { format } from 'date-fns';

const STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled:'bg-gray-100 text-gray-600',
};

export default function RequestTable({ data = [], title = 'Requests' }) {
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    return data.filter(r => {
      const name = r.users?.name?.toLowerCase() || '';
      const matchSearch = !search || name.includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchType   = typeFilter === 'all' || r.request_type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [data, search, statusFilter, typeFilter]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <h2 className="font-semibold text-gray-800 flex-1">{title}</h2>
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-44 focus:outline-none focus:border-[#52B788]"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
        >
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
        >
          <option value="all">All types</option>
          <option value="leave">Leave</option>
          <option value="ot">OT</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="px-5 py-3">Employee</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Date(s)</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  No requests found.
                </td>
              </tr>
            ) : (
              filtered.map(req => (
                <>
                  <tr
                    key={req.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                  >
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {req.users?.name || '—'}
                      {req.users?.department && (
                        <span className="block text-xs text-gray-400">{req.users.department}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 capitalize text-gray-600">
                      {req.request_type === 'leave' ? `${req.type} leave` : 'OT'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {req.request_type === 'leave'
                        ? `${req.start_date}${req.end_date !== req.start_date ? ' → ' + req.end_date : ''}`
                        : `${req.date} (${req.hours}h)`}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${STATUS_STYLES[req.status] || ''}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {format(new Date(req.created_at), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-5 py-3 text-gray-300 text-xs">
                      {expanded === req.id ? '▲' : '▼'}
                    </td>
                  </tr>
                  {expanded === req.id && (
                    <tr key={`${req.id}-detail`} className="bg-gray-50">
                      <td colSpan={6} className="px-5 py-3">
                        <div className="space-y-1 text-xs text-gray-600">
                          {req.reason && <p><strong>Reason:</strong> {req.reason}</p>}
                          {req.approval_steps?.[0]?.reject_reason && (
                            <p className="text-red-600">
                              <strong>Rejection reason:</strong> {req.approval_steps[0].reject_reason}
                            </p>
                          )}
                          {req.approval_steps?.[0]?.users?.name && (
                            <p><strong>Reviewed by:</strong> {req.approval_steps[0].users.name}</p>
                          )}
                          {req.approval_steps?.[0]?.action_at && (
                            <p><strong>Reviewed:</strong> {format(new Date(req.approval_steps[0].action_at), 'dd/MM/yyyy HH:mm')}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 text-xs text-gray-400 border-t border-gray-50">
        Showing {filtered.length} of {data.length} requests
      </div>
    </div>
  );
}
