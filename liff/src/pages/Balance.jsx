import { useEffect, useState } from 'react';
import { initLiff, apiCall } from '../api/client';
import { useLang } from '../context/LangContext';
import LangToggle from '../components/LangToggle';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';

const LIFF_ID = import.meta.env.VITE_LIFF_ID_HISTORY;

function BalanceCard({ label, labelTh, used, total, color }) {
  const { t } = useLang();
  const remaining = Math.max(0, total - used);
  const pct = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;

  const r = 40;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;

  return (
    <div className="bg-white rounded-2xl p-5 space-y-4"
      style={{ border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0 w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="48" cy="48" r={r} fill="none"
              stroke={color} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circ}`}
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none" style={{ color: 'var(--text)' }}>
              {remaining}
            </span>
            <span className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {t.daysUnit}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{label}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{labelTh}</p>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <Stat label={t.entitlement} value={total} color="var(--text)" />
            <Stat label={t.used} value={used} color={color} />
            <Stat label={t.daysRemaining} value={remaining} color="var(--text)" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{t.usedOf(used)}</span>
          <span>{t.remainingOf(remaining)}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="font-bold text-sm" style={{ color }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

export default function Balance() {
  const { t } = useLang();
  const [appState, setAppState] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [balance,  setBalance]  = useState(null);
  const [history,  setHistory]  = useState([]);

  useEffect(() => {
    initLiff(LIFF_ID)
      .then(() => Promise.all([
        apiCall('/leave/balance'),
        apiCall('/requests/history'),
      ]))
      .then(([bal, hist]) => {
        setBalance(bal);
        setHistory(hist.requests || []);
        setAppState('loaded');
      })
      .catch(err => {
        setErrorMsg(err.message);
        setAppState('error');
      });
  }, []);

  if (appState === 'loading') return <LoadingScreen />;
  if (appState === 'error')   return <ErrorScreen message={errorMsg} />;

  const year = new Date().getFullYear();
  const approved = history.filter(r =>
    r.request_type === 'leave' && r.status === 'approved' &&
    new Date(r.start_date).getFullYear() === year
  );

  const calcDays = (records) =>
    records.reduce((sum, r) => {
      const d = Math.max(1, Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1);
      return sum + d;
    }, 0);

  const usedSick     = calcDays(approved.filter(r => r.type === 'sick'));
  const usedVacation = calcDays(approved.filter(r => r.type === 'vacation'));
  const totalSick     = (balance?.leave_balance_sick     || 0) + usedSick;
  const totalVacation = (balance?.leave_balance_vacation || 0) + usedVacation;

  const pending = history.filter(r => r.request_type === 'leave' && r.status === 'pending');

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <div className="px-5 pt-6 pb-5" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase opacity-60 text-white mb-1">
              {t.balanceSectionLabel}
            </p>
            <h1 className="text-2xl font-bold text-white">{t.leaveBalance(year)}</h1>
          </div>
          <LangToggle variant="dark" />
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4 max-w-lg mx-auto">

        <BalanceCard
          label={t.types.sick.label}
          labelTh={t.types.sick.labelTh}
          used={usedSick}
          total={totalSick}
          color="var(--green)"
        />
        <BalanceCard
          label={t.types.vacation.label}
          labelTh={t.types.vacation.labelTh}
          used={usedVacation}
          total={totalVacation}
          color="#3B7DD8"
        />

        {/* Pending */}
        {pending.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-bold px-1" style={{ color: 'var(--text)' }}>
              {t.pendingSection}
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--amber-light)', color: 'var(--amber)' }}>
                {pending.length}
              </span>
            </p>
            {pending.map(r => {
              const typeCfg = t.types[r.type] || t.types.other;
              const days = Math.max(1, Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1);
              return (
                <LeaveRow
                  key={r.id}
                  typeCfg={typeCfg}
                  startDate={r.start_date}
                  endDate={r.end_date}
                  days={days}
                  badgeLabel={t.pendingBadge}
                  badgeBg="var(--amber-light)"
                  badgeColor="var(--amber)"
                  t={t}
                />
              );
            })}
          </div>
        )}

        {/* Recent approved */}
        {approved.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-bold px-1" style={{ color: 'var(--text)' }}>
              {t.approvedSection(approved.length)}
            </p>
            {approved.slice(0, 5).map(r => {
              const typeCfg = t.types[r.type] || t.types.other;
              const days = Math.max(1, Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1);
              return (
                <LeaveRow
                  key={r.id}
                  typeCfg={typeCfg}
                  startDate={r.start_date}
                  endDate={r.end_date}
                  days={days}
                  badgeLabel={t.approvedBadge}
                  badgeBg="var(--green-light)"
                  badgeColor="var(--green)"
                  t={t}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LeaveRow({ typeCfg, startDate, endDate, days, badgeLabel, badgeBg, badgeColor, t }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center justify-between"
      style={{ border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
          {typeCfg.label}
          <span className="ml-1 font-normal text-xs" style={{ color: 'var(--text-muted)' }}>
            {typeCfg.labelTh}
          </span>
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {startDate === endDate ? startDate : `${startDate} → ${endDate}`}
          {' · '}{days} {days === 1 ? t.day : t.days}
        </p>
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
        style={{ backgroundColor: badgeBg, color: badgeColor }}>
        {badgeLabel}
      </span>
    </div>
  );
}
