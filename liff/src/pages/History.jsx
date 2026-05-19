import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { initLiff, apiCall } from '../api/client';
import { useLang } from '../context/LangContext';
import LangToggle from '../components/LangToggle';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';

const LIFF_ID = import.meta.env.VITE_LIFF_ID_HISTORY;

const TYPE_COLORS = {
  sick:      { color: 'var(--green)',  bg: 'var(--green-light)' },
  vacation:  { color: '#3B7DD8',       bg: '#EBF2FF' },
  emergency: { color: 'var(--amber)',  bg: 'var(--amber-light)' },
  other:     { color: 'var(--slate)',  bg: '#F1F4F8' },
  ot:        { color: 'var(--navy)',   bg: '#EEF1F8' },
};

const STATUS_BG = {
  pending:   { bg: 'var(--amber-light)', color: 'var(--amber)' },
  approved:  { bg: 'var(--green-light)', color: 'var(--green)' },
  rejected:  { bg: 'var(--red-light)',   color: 'var(--red)' },
  cancelled: { bg: '#F1F4F8',            color: 'var(--slate)' },
};

export default function History() {
  const { t } = useLang();
  const [appState, setAppState] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [requests, setRequests] = useState([]);
  const [filter, setFilter]     = useState('all');

  useEffect(() => {
    initLiff(LIFF_ID)
      .then(() => apiCall('/requests/history'))
      .then(data => {
        setRequests(data.requests || []);
        setAppState('loaded');
      })
      .catch(err => {
        setErrorMsg(err.message);
        setAppState('error');
      });
  }, []);

  if (appState === 'loading') return <LoadingScreen />;
  if (appState === 'error')   return <ErrorScreen message={errorMsg} />;

  const FILTERS = [
    { key: 'all',      label: t.filterAll },
    { key: 'pending',  label: t.filterPending },
    { key: 'approved', label: t.filterApproved },
    { key: 'rejected', label: t.filterRejected },
  ];

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const counts = FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'all' ? requests.length : requests.filter(r => r.status === f.key).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <div className="px-5 pt-6 pb-5" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase opacity-60 text-white mb-1">
              {t.myRequests}
            </p>
            <h1 className="text-2xl font-bold text-white">{t.requestHistory}</h1>
          </div>
          <LangToggle variant="dark" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-5 pt-4 pb-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: active ? 'var(--navy)' : 'white',
                color: active ? 'white' : 'var(--slate)',
                border: active ? 'none' : '1px solid var(--border)',
              }}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                    color: active ? 'white' : 'var(--text-muted)',
                  }}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="px-5 pt-3 space-y-3 max-w-lg mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
              style={{ backgroundColor: 'var(--border)' }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>{t.noRequests}</p>
          </div>
        ) : (
          filtered.map(req => <RequestCard key={req.id} req={req} t={t} />)
        )}
      </div>
    </div>
  );
}

function RequestCard({ req, t }) {
  const [expanded, setExpanded] = useState(false);

  const isLeave = req.request_type === 'leave';
  const step    = req.approval_steps?.[0];
  const typeKey = isLeave ? req.type : 'ot';
  const typeCfg = t.types[typeKey] || t.types.other;
  const colors  = TYPE_COLORS[typeKey] || TYPE_COLORS.other;
  const stCfg   = STATUS_BG[req.status] || STATUS_BG.pending;
  const statusLabel = t[`status${req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}`] || req.status;

  const dateRange = isLeave
    ? req.end_date !== req.start_date
      ? `${req.start_date} → ${req.end_date}`
      : req.start_date
    : req.date;

  const subtitle = isLeave
    ? (() => {
        if (!req.start_date || !req.end_date) return '';
        const days = Math.max(1,
          Math.ceil((new Date(req.end_date) - new Date(req.start_date)) / 86400000) + 1
        );
        return `${days} ${days === 1 ? t.day : t.days}`;
      })()
    : `${req.hours} ${t.hrsUnit}`;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden cursor-pointer active:opacity-90"
      style={{ border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      onClick={() => setExpanded(v => !v)}
    >
      <div className="p-4 flex items-center gap-3">
        {/* Type icon */}
        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: colors.bg }}>
          <TypeIcon type={typeKey} color={colors.color} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
              {typeCfg.label}
            </p>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{typeCfg.labelTh}</span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {dateRange} · {subtitle}
          </p>
        </div>

        {/* Status badge + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: stCfg.bg, color: stCfg.color }}>
            {statusLabel}
          </span>
          <svg
            className="w-4 h-4 transition-transform duration-200"
            style={{ color: 'var(--border)', transform: expanded ? 'rotate(180deg)' : 'none' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          {req.reason && (
            <DetailRow label={t.detailReason} value={req.reason} />
          )}
          {step?.reject_reason && (
            <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--red-light)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--red)' }}>{t.detailRejectionReason}</p>
              <p className="text-xs mt-1" style={{ color: '#991B1B' }}>{step.reject_reason}</p>
            </div>
          )}
          {step?.users?.name && (
            <DetailRow label={t.detailReviewedBy} value={step.users.name} />
          )}
          {step?.action_at && (
            <DetailRow label={t.detailReviewed} value={format(new Date(step.action_at), 'dd MMM yyyy, HH:mm')} />
          )}
          <DetailRow label={t.detailSubmitted} value={format(new Date(req.created_at), 'dd MMM yyyy, HH:mm')} />
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-right font-medium" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

function TypeIcon({ type, color }) {
  const p = { className: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: color, strokeWidth: 2 };
  if (type === 'ot') return (
    <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  );
  if (type === 'vacation') return (
    <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
  );
  if (type === 'emergency') return (
    <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  );
  return (
    <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  );
}
