import { useEffect, useState, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { api } from '../api/client';
import { useT } from '../hooks/useT';

// ── Action badge colours ──────────────────────────────────────────────────────
const ACTION_STYLE = {
  'employee.created':     { bg: '#DBEAFE', text: '#1D4ED8', dot: '#3B82F6' },
  'employee.updated':     { bg: '#EDE9FE', text: '#6D28D9', dot: '#8B5CF6' },
  'leave.approved':       { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  'leave.rejected':       { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  'ot.approved':          { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  'ot.rejected':          { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  'announcement.created': { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  'announcement.deleted': { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  'admin.login':          { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
};

const DEFAULT_STYLE = { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' };

// ── Entity type filter tabs ───────────────────────────────────────────────────
const FILTERS = [
  { key: '',             labelKey: 'auditFilterAll' },
  { key: 'employee',    labelKey: 'auditFilterEmployee' },
  { key: 'leave',       labelKey: 'auditFilterLeave' },
  { key: 'ot',          labelKey: 'auditFilterOT' },
  { key: 'announcement',labelKey: 'auditFilterAnnouncement' },
  { key: 'session',     labelKey: 'auditFilterSession' },
];

function ActionBadge({ action, t }) {
  const style = ACTION_STYLE[action] || DEFAULT_STYLE;
  const label = t[action] || action;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: style.dot }} />
      {label}
    </span>
  );
}

function DetailsChip({ details }) {
  if (!details) return <span className="text-xs" style={{ color: 'var(--text-4)' }}>—</span>;

  const entries = Object.entries(details).filter(([, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return <span className="text-xs" style={{ color: 'var(--text-4)' }}>—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
          style={{ backgroundColor: 'var(--badge-neutral-bg)', color: 'var(--text-3)' }}
        >
          <span style={{ color: 'var(--text-4)' }}>{k}:</span>
          <span style={{ color: 'var(--text-2)' }}>{String(v)}</span>
        </span>
      ))}
    </div>
  );
}

export default function AuditLog() {
  const t = useT();
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 200 });
    if (entityFilter) params.set('entity_type', entityFilter);

    api.get(`/admin/audit-logs?${params}`)
      .then(r => setLogs(r.data.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
            {t.auditLogTitle}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {t.auditLogTitle} — last 200 entries
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
      >
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setEntityFilter(f.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
            style={
              entityFilter === f.key
                ? { backgroundColor: '#1B4332', color: '#fff' }
                : { color: 'var(--text-3)', backgroundColor: 'transparent' }
            }
          >
            {t[f.labelKey]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--card-bg)',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {loading ? (
          <div className="px-5 py-16 text-center text-sm" style={{ color: 'var(--text-4)' }}>
            {t.loading}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm" style={{ color: 'var(--text-4)' }}>
            {t.noAuditLogs}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-xs uppercase tracking-wider"
                  style={{
                    color: 'var(--text-4)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <th className="px-5 py-3">{t.auditColTime}</th>
                  <th className="px-5 py-3">{t.auditColActor}</th>
                  <th className="px-5 py-3">{t.auditColAction}</th>
                  <th className="px-5 py-3">{t.auditColEntity}</th>
                  <th className="px-5 py-3">{t.auditColDetails}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id}
                    className="transition-colors"
                    style={{
                      borderBottom: i < logs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Time */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                        {format(new Date(log.created_at), 'dd MMM yyyy')}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-4)' }}>
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                        {' · '}
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </p>
                    </td>

                    {/* Actor */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: '#52B788' }}
                        >
                          {(log.actor_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text-2)' }}>
                          {log.actor_name || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3">
                      <ActionBadge action={log.action} t={t} />
                    </td>

                    {/* Entity type + ID */}
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium capitalize" style={{ color: 'var(--text-2)' }}>
                        {log.entity_type}
                      </p>
                      {log.entity_id && (
                        <p className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>
                          {log.entity_id.split('-')[0]}…
                        </p>
                      )}
                    </td>

                    {/* Details */}
                    <td className="px-5 py-3">
                      <DetailsChip details={log.details} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && logs.length > 0 && (
          <div
            className="px-5 py-3 text-xs"
            style={{
              color: 'var(--text-4)',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {logs.length} entries
          </div>
        )}
      </div>
    </div>
  );
}
