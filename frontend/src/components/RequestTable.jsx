import { useMemo, useState } from 'react';
import { format } from 'date-fns';

const STATUS_CFG = {
  pending:   { label: 'Pending',   bg: '#FFF8E1', color: '#F59E0B' },
  approved:  { label: 'Approved',  bg: '#E8F5E9', color: '#22C55E' },
  rejected:  { label: 'Rejected',  bg: '#FEE2E2', color: '#EF4444' },
  cancelled: { label: 'Cancelled', bg: '#F3F4F6', color: '#9CA3AF' },
};

function Avatar({ name }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ backgroundColor: '#52B788' }}
    >
      {initial}
    </div>
  );
}

export default function RequestTable({ data = [], title = 'Requests' }) {
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [expanded, setExpanded]         = useState(null);

  const filtered = useMemo(() => data.filter(r => {
    const name = r.users?.name?.toLowerCase() || '';
    return (
      (!search || name.includes(search.toLowerCase())) &&
      (statusFilter === 'all' || r.status === statusFilter) &&
      (typeFilter   === 'all' || r.request_type === typeFilter)
    );
  }), [data, search, statusFilter, typeFilter]);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <h2 className="font-semibold text-gray-800 flex-1 text-base">{title}</h2>
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-44 focus:outline-none focus:ring-1"
          style={{ '--tw-ring-color': '#52B788' }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white"
        >
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white"
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
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
              <th className="px-6 py-3 font-medium">Employee</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Date(s)</th>
              <th className="px-6 py-3 font-medium">Submitted</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
                  No requests found.
                </td>
              </tr>
            ) : (
              filtered.map(req => {
                const cfg = STATUS_CFG[req.status] || STATUS_CFG.pending;
                return (
                  <>
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50/60 cursor-pointer transition-colors"
                      onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={req.users?.name} />
                          <div>
                            <p className="font-medium text-gray-800 leading-tight">{req.users?.name || '—'}</p>
                            {req.users?.department && (
                              <p className="text-xs text-gray-400">{req.users.department}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 capitalize">
                        {req.request_type === 'leave' ? `${req.type} leave` : 'OT'}
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 text-xs">
                        {req.request_type === 'leave'
                          ? `${req.start_date}${req.end_date !== req.start_date ? ' → ' + req.end_date : ''}`
                          : `${req.date} (${req.hours}h)`}
                      </td>
                      <td className="px-6 py-3.5 text-gray-400 text-xs">
                        {format(new Date(req.created_at), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-300 text-xs">
                        {expanded === req.id ? '▲' : '▼'}
                      </td>
                    </tr>
                    {expanded === req.id && (
                      <tr key={`${req.id}-detail`} className="bg-gray-50/80">
                        <td colSpan={6} className="px-6 py-3">
                          <div className="space-y-1 text-xs text-gray-600">
                            {req.reason && <p><span className="font-medium text-gray-700">Reason:</span> {req.reason}</p>}
                            {req.approval_steps?.[0]?.reject_reason && (
                              <p className="text-red-500">
                                <span className="font-medium">Rejection reason:</span> {req.approval_steps[0].reject_reason}
                              </p>
                            )}
                            {req.approval_steps?.[0]?.users?.name && (
                              <p><span className="font-medium text-gray-700">Reviewed by:</span> {req.approval_steps[0].users.name}</p>
                            )}
                            {req.approval_steps?.[0]?.action_at && (
                              <p><span className="font-medium text-gray-700">Reviewed:</span> {format(new Date(req.approval_steps[0].action_at), 'dd/MM/yyyy HH:mm')}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 text-xs text-gray-400 border-t border-gray-50">
        {filtered.length} of {data.length} requests
      </div>
    </div>
  );
}
