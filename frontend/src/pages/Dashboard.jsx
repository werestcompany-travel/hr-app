import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useT } from '../hooks/useT';
import { format } from 'date-fns';

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconClock = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconBolt = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ── Status badge ───────────────────────────────────────────────────────────────
function Badge({ status }) {
  const t = useT();
  const STATUS = {
    pending:   { label: t.statusPending,   bg: '#FFF8E1', color: '#F59E0B' },
    approved:  { label: t.statusApproved,  bg: '#E8F5E9', color: '#22C55E' },
    rejected:  { label: t.statusRejected,  bg: '#FEE2E2', color: '#EF4444' },
    cancelled: { label: t.statusCancelled, bg: '#F3F4F6', color: '#9CA3AF' },
  };
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function Avatar({ name }) {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ backgroundColor: '#52B788' }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent + '1A', color: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-800 leading-none">{value ?? '—'}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  );
}

// ── Request row ────────────────────────────────────────────────────────────────
function RequestRow({ req }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const isLeave = req.request_type === 'leave';
  const leaveTypeMap = {
    sick: t.leaveTypeSick,
    vacation: t.leaveTypeVacation,
    emergency: t.leaveTypeEmergency,
    other: t.leaveTypeOther,
  };

  return (
    <>
      <tr className="hover:bg-gray-50/60 cursor-pointer transition-colors border-b border-gray-50"
        onClick={() => setOpen(o => !o)}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={req.users?.name} />
            <div>
              <p className="text-sm font-medium text-gray-800 leading-tight">{req.users?.name || '—'}</p>
              {req.users?.department && <p className="text-xs text-gray-400">{req.users.department}</p>}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {isLeave ? (leaveTypeMap[req.type] || req.type) : 'OT'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {isLeave
            ? `${req.start_date}${req.end_date !== req.start_date ? ' → ' + req.end_date : ''}`
            : `${req.date} (${req.hours}h)`}
        </td>
        <td className="px-4 py-3"><Badge status={req.status} /></td>
        <td className="px-4 py-3 text-gray-300 text-xs">{open ? '▲' : '▼'}</td>
      </tr>
      {open && (
        <tr className="bg-gray-50/80">
          <td colSpan={5} className="px-4 py-3">
            <div className="text-xs text-gray-600 space-y-1">
              {req.reason && <p><span className="font-medium">{t.expandReason}:</span> {req.reason}</p>}
              {req.approval_steps?.[0]?.reject_reason && (
                <p className="text-red-500"><span className="font-medium">{t.expandRejected}:</span> {req.approval_steps[0].reject_reason}</p>
              )}
              {req.approval_steps?.[0]?.users?.name && (
                <p><span className="font-medium">{t.expandReviewedBy}:</span> {req.approval_steps[0].users.name}</p>
              )}
              <p><span className="font-medium">{t.expandSubmitDate}:</span> {format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Request table with search ──────────────────────────────────────────────────
function RequestList({ data, loading }) {
  const t = useT();
  const [search, setSearch] = useState('');

  const filtered = data.filter(r =>
    !search || (r.users?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="py-16 text-center text-gray-400 text-sm">{t.loading}</div>
  );

  return (
    <div>
      <div className="px-4 py-3 border-b border-gray-100">
        <input
          type="text"
          placeholder={t.searchName}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#52B788]"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">{t.noItems}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-2.5 font-medium">{t.colEmployee}</th>
                <th className="px-4 py-2.5 font-medium">{t.colType}</th>
                <th className="px-4 py-2.5 font-medium">{t.colDate}</th>
                <th className="px-4 py-2.5 font-medium">{t.colStatus}</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => <RequestRow key={req.id} req={req} />)}
            </tbody>
          </table>
        </div>
      )}
      <div className="px-4 py-2.5 text-xs text-gray-400 border-t border-gray-50">
        {t.itemCount(filtered.length)}
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
const TAB_KEYS = [
  { key: 'pending', color: '#F59E0B' },
  { key: 'leave',   color: '#52B788' },
  { key: 'ot',      color: '#3B82F6' },
  { key: 'all',     color: '#8B5CF6' },
];

export default function Dashboard() {
  const t = useT();
  const { user } = useAuthStore();
  const [stats,   setStats]   = useState(null);
  const [allReqs, setAllReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('pending');

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/requests'),
    ])
      .then(([s, r]) => {
        setStats(s.data);
        setAllReqs(r.data.requests || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const tabData = {
    pending: allReqs.filter(r => r.status === 'pending'),
    leave:   allReqs.filter(r => r.request_type === 'leave'),
    ot:      allReqs.filter(r => r.request_type === 'ot'),
    all:     allReqs,
  };

  const tabLabels = {
    pending: t.tabPending,
    leave: t.tabLeave,
    ot: t.tabOT,
    all: t.tabAll,
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-800">
          {t.dashboardGreeting(user?.name || 'Admin')}
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      {/* Stat cards — 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t.statPendingLeave}    value={stats?.pendingLeave}  icon={<IconClock />}  accent="#F59E0B" />
        <StatCard label={t.statPendingOT}       value={stats?.pendingOT}     icon={<IconBolt />}   accent="#3B82F6" />
        <StatCard label={t.statTotalEmployees}  value={stats?.employees}     icon={<IconUsers />}  accent="#52B788" />
        <StatCard label={t.statApprovedMonth}   value={stats?.approvedMonth} icon={<IconCheck />}  accent="#8B5CF6" />
      </div>

      {/* Tabs + table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TAB_KEYS.map(({ key, color }) => {
            const isActive = tab === key;
            const count = tabData[key]?.length;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0"
                style={{
                  color: isActive ? color : '#9CA3AF',
                  borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
                }}
              >
                {tabLabels[key]}
                {count > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: color + '1A', color }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <RequestList data={tabData[tab] || []} loading={loading} />
      </div>
    </div>
  );
}
