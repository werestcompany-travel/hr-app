import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { api } from '../api/client';

// ── Constants ──────────────────────────────────────────────────────────────────
const LEAVE_TYPE = { sick: 'ลาป่วย', vacation: 'พักร้อน', emergency: 'ลากิจ', other: 'ลาอื่นๆ' };

const STATUS_CFG = {
  pending:   { label: 'รออนุมัติ', bg: '#FFF8E1', color: '#F59E0B' },
  approved:  { label: 'อนุมัติ',   bg: '#E8F5E9', color: '#22C55E' },
  rejected:  { label: 'ปฏิเสธ',   bg: '#FEE2E2', color: '#EF4444' },
  cancelled: { label: 'ยกเลิก',   bg: '#F3F4F6', color: '#9CA3AF' },
};

const TABS = [
  { key: 'all',      label: 'ทั้งหมด'   },
  { key: 'pending',  label: 'รออนุมัติ' },
  { key: 'approved', label: 'อนุมัติ'   },
  { key: 'rejected', label: 'ปฏิเสธ'   },
  { key: 'leave',    label: 'ใบลา'      },
  { key: 'ot',       label: 'OT'        },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
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

function exportCSV(data) {
  const headers = ['ชื่อพนักงาน', 'แผนก', 'ประเภท', 'วันที่เริ่ม', 'วันที่สิ้นสุด / วันที่', 'จำนวนวัน/ชั่วโมง', 'เหตุผล', 'สถานะ', 'วันที่ส่ง'];
  const rows = data.map(r => {
    const isLeave = r.request_type === 'leave';
    return [
      r.users?.name || '',
      r.users?.department || '',
      isLeave ? (LEAVE_TYPE[r.type] || r.type) : 'OT',
      isLeave ? r.start_date : r.date,
      isLeave ? r.end_date   : r.date,
      isLeave
        ? `${Math.max(1, Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1)} วัน`
        : `${r.hours} ชั่วโมง`,
      r.reason || '',
      STATUS_CFG[r.status]?.label || r.status,
      format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`);
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const bom  = '﻿'; // UTF-8 BOM for Thai Excel
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `requests_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Expandable row ─────────────────────────────────────────────────────────────
function RequestRow({ req }) {
  const [open, setOpen] = useState(false);
  const isLeave = req.request_type === 'leave';
  const days = isLeave
    ? Math.max(1, Math.ceil((new Date(req.end_date) - new Date(req.start_date)) / 86400000) + 1)
    : null;
  const step = req.approval_steps?.[0];

  return (
    <>
      <tr
        className="border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={req.users?.name} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{req.users?.name || '—'}</p>
              {req.users?.department && (
                <p className="text-xs text-gray-400 truncate">{req.users.department}</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-gray-700">
            {isLeave ? (LEAVE_TYPE[req.type] || req.type) : 'OT'}
          </span>
          <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
            {isLeave ? 'ลา' : 'OT'}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          {isLeave
            ? req.start_date === req.end_date
              ? req.start_date
              : `${req.start_date} → ${req.end_date}`
            : req.date}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          {isLeave ? `${days} วัน` : `${req.hours} ชม.`}
        </td>
        <td className="px-4 py-3"><Badge status={req.status} /></td>
        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
          {format(new Date(req.created_at), 'dd/MM/yy')}
        </td>
        <td className="px-4 py-3 text-gray-300 text-xs">{open ? '▲' : '▼'}</td>
      </tr>

      {open && (
        <tr className="bg-blue-50/30">
          <td colSpan={7} className="px-5 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {req.reason && (
                <div className="col-span-2 md:col-span-3 bg-white rounded-xl px-4 py-3 border border-gray-100">
                  <p className="text-gray-400 font-medium mb-0.5">เหตุผล</p>
                  <p className="text-gray-700">{req.reason}</p>
                </div>
              )}
              {step?.reject_reason && (
                <div className="col-span-2 md:col-span-3 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                  <p className="text-red-400 font-medium mb-0.5">เหตุผลการปฏิเสธ</p>
                  <p className="text-red-600">{step.reject_reason}</p>
                </div>
              )}
              {step?.users?.name && (
                <div className="bg-white rounded-xl px-4 py-3 border border-gray-100">
                  <p className="text-gray-400 font-medium mb-0.5">ตรวจสอบโดย</p>
                  <p className="text-gray-700">{step.users.name}</p>
                </div>
              )}
              {step?.action_at && (
                <div className="bg-white rounded-xl px-4 py-3 border border-gray-100">
                  <p className="text-gray-400 font-medium mb-0.5">วันที่ตรวจสอบ</p>
                  <p className="text-gray-700">{format(new Date(step.action_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              )}
              <div className="bg-white rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-gray-400 font-medium mb-0.5">วันที่ส่ง</p>
                <p className="text-gray-700">{format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Requests() {
  const [all,     setAll]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('all');
  const [search,  setSearch]  = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  useEffect(() => {
    api.get('/admin/requests')
      .then(r => setAll(r.data.requests || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let data = all;
    if (tab === 'pending' || tab === 'approved' || tab === 'rejected') {
      data = data.filter(r => r.status === tab);
    } else if (tab === 'leave') {
      data = data.filter(r => r.request_type === 'leave');
    } else if (tab === 'ot') {
      data = data.filter(r => r.request_type === 'ot');
    }
    if (search) {
      data = data.filter(r => (r.users?.name || '').toLowerCase().includes(search.toLowerCase()));
    }
    if (dateFrom) data = data.filter(r => (r.start_date || r.date) >= dateFrom);
    if (dateTo)   data = data.filter(r => (r.start_date || r.date) <= dateTo);
    return data;
  }, [all, tab, search, dateFrom, dateTo]);

  const counts = useMemo(() => ({
    all:      all.length,
    pending:  all.filter(r => r.status === 'pending').length,
    approved: all.filter(r => r.status === 'approved').length,
    rejected: all.filter(r => r.status === 'rejected').length,
    leave:    all.filter(r => r.request_type === 'leave').length,
    ot:       all.filter(r => r.request_type === 'ot').length,
  }), [all]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">ประวัติคำขอ</h1>
          <p className="text-xs text-gray-400 mt-0.5">Request History</p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-colors"
          style={{ backgroundColor: '#52B788' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-gray-500 font-medium mb-1">ค้นหาพนักงาน</label>
          <input
            type="text"
            placeholder="ชื่อพนักงาน..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#52B788]"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 font-medium mb-1">วันที่เริ่ม</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#52B788]" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 font-medium mb-1">วันที่สิ้นสุด</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#52B788]" />
        </div>
        {(search || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}
            className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-gray-100">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0"
              style={{
                color: tab === t.key ? '#1B4332' : '#9CA3AF',
                borderBottom: tab === t.key ? '2px solid #52B788' : '2px solid transparent',
              }}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    backgroundColor: tab === t.key ? '#52B78820' : '#F3F4F6',
                    color: tab === t.key ? '#1B4332' : '#9CA3AF',
                  }}>
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">ไม่พบรายการ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">พนักงาน</th>
                  <th className="px-4 py-3 font-medium">ประเภท</th>
                  <th className="px-4 py-3 font-medium">วันที่</th>
                  <th className="px-4 py-3 font-medium">จำนวน</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium">ส่งเมื่อ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => <RequestRow key={req.id} req={req} />)}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-50 flex items-center justify-between">
          <span>แสดง {filtered.length} จาก {all.length} รายการ</span>
          {filtered.length > 0 && (
            <button onClick={() => exportCSV(filtered)}
              className="text-[#52B788] font-medium hover:underline">
              ดาวน์โหลด CSV
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
