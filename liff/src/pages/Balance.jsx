import { useEffect, useState } from 'react';
import { initLiff, apiCall } from '../api/client';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';

const LIFF_ID = import.meta.env.VITE_LIFF_ID_HISTORY;

function BalanceRing({ used, total, color, label, sublabel }) {
  const remaining = Math.max(0, total - used);
  const pct = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="bg-[#2D6A4F] rounded-2xl p-5 flex flex-col items-center gap-3">
      {/* Ring */}
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={r} fill="none"
            stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white leading-none">{remaining}</span>
          <span className="text-xs text-[#B7E4C7] mt-0.5">วัน</span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-white font-semibold text-sm">{label}</p>
        <p className="text-[#B7E4C7] text-xs mt-0.5">{sublabel}</p>
      </div>

      {/* Stats row */}
      <div className="w-full grid grid-cols-3 gap-1 pt-2 border-t border-[rgba(82,183,136,0.2)]">
        <div className="text-center">
          <p className="text-white font-bold text-sm">{total}</p>
          <p className="text-[#B7E4C7] text-xs">สิทธิ์</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-sm" style={{ color }}>{used}</p>
          <p className="text-[#B7E4C7] text-xs">ใช้แล้ว</p>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-sm">{remaining}</p>
          <p className="text-[#B7E4C7] text-xs">คงเหลือ</p>
        </div>
      </div>
    </div>
  );
}

export default function Balance() {
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

  if (appState === 'loading') return <LoadingScreen message="กำลังโหลดข้อมูลการลา..." />;
  if (appState === 'error')   return <ErrorScreen message={errorMsg} />;

  // Count used days this year from approved leave
  const year = new Date().getFullYear();
  const approved = history.filter(r =>
    r.request_type === 'leave' && r.status === 'approved' &&
    new Date(r.start_date).getFullYear() === year
  );

  const usedSick = approved
    .filter(r => r.type === 'sick')
    .reduce((sum, r) => {
      const days = Math.max(1, Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1);
      return sum + days;
    }, 0);

  const usedVacation = approved
    .filter(r => r.type === 'vacation')
    .reduce((sum, r) => {
      const days = Math.max(1, Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1);
      return sum + days;
    }, 0);

  const totalSick     = (balance?.leave_balance_sick     || 0) + usedSick;
  const totalVacation = (balance?.leave_balance_vacation || 0) + usedVacation;

  // Pending requests
  const pending = history.filter(r => r.request_type === 'leave' && r.status === 'pending');

  const leaveTypeMap = { sick: 'ลาป่วย', vacation: 'พักร้อน', emergency: 'ลากิจ', other: 'ลาอื่นๆ' };

  return (
    <div className="min-h-screen px-4 py-6 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <p className="text-xs text-[#52B788] font-semibold tracking-widest uppercase">วันลาคงเหลือ</p>
        <h1 className="text-2xl font-bold text-white mt-1">Leave Balance {year}</h1>
      </div>

      {/* Balance rings */}
      <div className="grid grid-cols-2 gap-3">
        <BalanceRing
          label="ลาป่วย"
          sublabel="Sick Leave"
          used={usedSick}
          total={totalSick}
          color="#52B788"
        />
        <BalanceRing
          label="พักร้อน"
          sublabel="Vacation"
          used={usedVacation}
          total={totalVacation}
          color="#3B82F6"
        />
      </div>

      {/* Pending section */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#B7E4C7]">รออนุมัติ ({pending.length})</p>
          {pending.map(r => (
            <div key={r.id} className="bg-[#2D6A4F] rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{leaveTypeMap[r.type] || r.type}</p>
                <p className="text-[#B7E4C7] text-xs">{r.start_date} → {r.end_date}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ backgroundColor: '#FFF8E11A', color: '#F59E0B' }}>
                รออนุมัติ
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recent approved */}
      {approved.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#B7E4C7]">อนุมัติแล้วปีนี้ ({approved.length} รายการ)</p>
          {approved.slice(0, 5).map(r => (
            <div key={r.id} className="bg-[#2D6A4F] rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{leaveTypeMap[r.type] || r.type}</p>
                <p className="text-[#B7E4C7] text-xs">{r.start_date} → {r.end_date}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ backgroundColor: '#E8F5E9', color: '#22C55E' }}>
                อนุมัติ
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
