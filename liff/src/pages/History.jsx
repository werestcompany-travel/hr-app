import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { initLiff, apiCall } from '../api/client';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';

const LIFF_ID = import.meta.env.VITE_LIFF_ID_HISTORY;

const STATUS_STYLES = {
  pending:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  cancelled:'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const TYPE_ICONS = {
  sick: '🤒', vacation: '🌴', emergency: '🚨', other: '📝', ot: '⏰',
};

export default function History() {
  const [appState, setAppState]   = useState('loading');
  const [errorMsg, setErrorMsg]   = useState('');
  const [requests, setRequests]   = useState([]);
  const [filter, setFilter]       = useState('all');

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

  if (appState === 'loading') return <LoadingScreen message="Loading your history..." />;
  if (appState === 'error')   return <ErrorScreen message={errorMsg} />;

  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  return (
    <div className="min-h-screen px-4 py-6 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[#52B788]">Request History</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize
              ${filter === f
                ? 'bg-[#52B788] text-white'
                : 'bg-[#2D6A4F] text-[#B7E4C7] hover:bg-[#3a7a5f]'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Request list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#B7E4C7] opacity-60">No requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <RequestCard key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({ req }) {
  const [expanded, setExpanded] = useState(false);
  const isLeave = req.request_type === 'leave';
  const step = req.approval_steps?.[0];

  const title = isLeave
    ? `${TYPE_ICONS[req.type] || '📋'} ${capitalise(req.type)} Leave`
    : `⏰ OT Request`;

  const dateRange = isLeave
    ? `${req.start_date}${req.end_date !== req.start_date ? ' → ' + req.end_date : ''}`
    : req.date;

  return (
    <div
      className="bg-[#2D6A4F] rounded-xl p-4 space-y-2 border border-[rgba(82,183,136,0.2)] cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-semibold text-white text-sm">{title}</p>
          <p className="text-xs text-[#B7E4C7]">{dateRange}</p>
          {isLeave && req.hours && (
            <p className="text-xs text-[#B7E4C7]">{req.hours} hrs</p>
          )}
          {!isLeave && (
            <p className="text-xs text-[#B7E4C7]">{req.hours} hrs</p>
          )}
        </div>
        <span className={`px-2 py-1 rounded-lg text-xs font-medium border capitalize flex-shrink-0 ${STATUS_STYLES[req.status] || ''}`}>
          {req.status}
        </span>
      </div>

      {expanded && (
        <div className="pt-2 border-t border-[rgba(82,183,136,0.2)] space-y-1.5 text-xs text-[#B7E4C7]">
          {req.reason && <p>Reason: {req.reason}</p>}
          {step?.reject_reason && (
            <div className="bg-red-900/30 rounded-lg p-2">
              <p className="text-red-300 font-medium">Rejection reason:</p>
              <p className="text-red-300/80 mt-0.5">{step.reject_reason}</p>
            </div>
          )}
          {step?.users?.name && <p>Reviewed by: {step.users.name}</p>}
          {step?.action_at && (
            <p>Reviewed: {format(new Date(step.action_at), 'dd/MM/yyyy HH:mm')}</p>
          )}
          <p>Submitted: {format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}</p>
        </div>
      )}
    </div>
  );
}

function capitalise(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
