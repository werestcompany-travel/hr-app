import { lineClient } from '../config/line.js';
import { supabase } from '../config/supabase.js';
import { format, differenceInCalendarDays } from 'date-fns';

// ── Notify manager of a new request ─────────────────────────────────────────
export async function notifyManager(managerId, requestId, requestType) {
  const { data: mgr } = await supabase
    .from('users')
    .select('line_user_id, name')
    .eq('id', managerId)
    .single();

  const table = requestType === 'leave' ? 'leave_requests' : 'ot_requests';
  const { data: req } = await supabase
    .from(table)
    .select('*, users!user_id(id, name, department)')
    .eq('id', requestId)
    .single();

  // Fetch year-to-date leave stats for leave requests
  let leaveStats = null;
  if (requestType === 'leave' && req?.users?.id) {
    leaveStats = await fetchLeaveStats(req.users.id);
  }

  // Fetch the approval step ID (needed for approve/reject postback actions)
  const { data: step } = await supabase
    .from('approval_steps')
    .select('id')
    .eq('request_id', requestId)
    .eq('status', 'pending')
    .maybeSingle();

  const flex = buildApprovalFlex(req, requestType, leaveStats, step?.id);

  if (mgr?.line_user_id) {
    await lineClient.pushMessage(mgr.line_user_id, flex);
    return;
  }

  // Manager has no LINE account — fall back to notifying all HR admins
  console.warn(`[notify] Manager ${managerId} has no LINE account. Falling back to HR admin.`);
  const { data: admins } = await supabase
    .from('users')
    .select('line_user_id')
    .eq('role', 'hr_admin');

  for (const admin of admins || []) {
    if (admin.line_user_id) {
      await lineClient.pushMessage(admin.line_user_id, flex).catch(() => {});
    }
  }
}

async function fetchLeaveStats(userId) {
  const year = new Date().getFullYear();
  const { data: rows } = await supabase
    .from('leave_requests')
    .select('type, start_date, end_date')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .gte('start_date', `${year}-01-01`)
    .lte('start_date', `${year}-12-31`);

  const stats = { sick: { count: 0, days: 0 }, vacation: { count: 0, days: 0 }, emergency: { count: 0, days: 0 } };
  for (const r of rows || []) {
    const key = r.type === 'vacation' ? 'vacation' : r.type === 'emergency' ? 'emergency' : 'sick';
    const days = differenceInCalendarDays(new Date(r.end_date), new Date(r.start_date)) + 1;
    stats[key].count += 1;
    stats[key].days += days;
  }
  return stats;
}

function buildApprovalFlex(req, requestType, leaveStats, stepId) {
  const employee = req.users;
  const isLeave = requestType === 'leave';

  // ── Detail rows ────────────────────────────────────────────────────────────
  const detailRows = isLeave
    ? [
        { label: 'ประเภท', value: leaveTypeLabel(req.type) },
        { label: 'วันที่เริ่ม', value: req.start_date },
        { label: 'วันที่สิ้นสุด', value: req.end_date === req.start_date ? '(วันเดียว)' : req.end_date },
        { label: 'จำนวนวัน', value: `${differenceInCalendarDays(new Date(req.end_date), new Date(req.start_date)) + 1} วัน` },
        { label: 'เหตุผล', value: req.reason || '—' },
      ]
    : [
        { label: 'วันที่', value: req.date },
        { label: 'ชั่วโมง OT', value: `${req.hours} ชั่วโมง` },
        { label: 'เหตุผล', value: req.reason || '—' },
      ];

  const detailContents = detailRows.map(({ label, value }) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, color: '#888888', size: 'sm', flex: 3 },
      { type: 'text', text: value, color: '#333333', size: 'sm', flex: 5, wrap: true },
    ],
  }));

  // ── Leave stats section (leave requests only) ──────────────────────────────
  const statsSection = isLeave && leaveStats ? [
    { type: 'separator', margin: 'md' },
    {
      type: 'text',
      text: `สถิติลาปีนี้ (${new Date().getFullYear()})`,
      weight: 'bold',
      size: 'sm',
      color: '#1B4332',
      margin: 'md',
    },
    {
      type: 'box',
      layout: 'vertical',
      margin: 'sm',
      spacing: 'xs',
      contents: [
        statRow('ลาป่วย', leaveStats.sick),
        statRow('ลากิจ', leaveStats.emergency),
        statRow('พักร้อน', leaveStats.vacation),
      ],
    },
  ] : [];

  const titleText = isLeave ? 'ใบลาใหม่รออนุมัติ' : 'คำขอ OT ใหม่รออนุมัติ';
  const actionId = stepId || req.id;

  return {
    type: 'flex',
    altText: `${titleText} — ${employee.name}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1B4332',
        paddingAll: '16px',
        contents: [
          { type: 'text', text: titleText, color: '#52B788', weight: 'bold', size: 'lg' },
          {
            type: 'text',
            text: `${employee.name}${employee.department ? ' · ' + employee.department : ''}`,
            color: '#B7E4C7',
            size: 'sm',
            margin: 'sm',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        contents: [
          ...detailContents,
          ...statsSection,
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '12px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            contents: [
              {
                type: 'button',
                style: 'primary',
                color: '#1B4332',
                height: 'sm',
                action: {
                  type: 'postback',
                  label: 'อนุมัติ',
                  data: `action=approve&stepId=${actionId}&type=${requestType}`,
                  displayText: 'อนุมัติ',
                },
              },
              {
                type: 'button',
                style: 'secondary',
                height: 'sm',
                action: {
                  type: 'postback',
                  label: 'ปฏิเสธ',
                  data: `action=reject&stepId=${actionId}&type=${requestType}`,
                  displayText: 'ปฏิเสธ',
                },
              },
            ],
          },
        ],
      },
    },
  };
}

function statRow(label, stat) {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, color: '#666666', size: 'xs', flex: 3 },
      {
        type: 'text',
        text: `${stat.count} ครั้ง / ${stat.days} วัน`,
        color: '#333333',
        size: 'xs',
        flex: 5,
      },
    ],
  };
}

function leaveTypeLabel(type) {
  const map = { sick: 'ลาป่วย', vacation: 'พักร้อน', emergency: 'ลากิจ', other: 'ลาอื่นๆ' };
  return map[type] || type;
}

// ── Notify employee of approval decision ─────────────────────────────────────
export async function notifyEmployee(userId, status, rejectReason, approverId) {
  const [empResult, approverResult] = await Promise.all([
    supabase.from('users').select('line_user_id').eq('id', userId).single(),
    supabase.from('users').select('name').eq('id', approverId).single(),
  ]);

  const emp = empResult.data;
  const approver = approverResult.data;

  if (!emp?.line_user_id) return;

  const now = format(new Date(), 'dd/MM/yyyy HH:mm');

  let text;
  if (status === 'approved') {
    text = `คำขอของคุณได้รับการ "อนุมัติ" แล้ว\n\nอนุมัติโดย: ${approver?.name || 'ผู้จัดการ'}\nวันที่: ${now}`;
  } else {
    text = `คำขอของคุณถูก "ปฏิเสธ"\n\nปฏิเสธโดย: ${approver?.name || 'ผู้จัดการ'}\nวันที่: ${now}\nเหตุผล: ${rejectReason || '—'}`;
  }

  await lineClient.pushMessage(emp.line_user_id, { type: 'text', text });
}

// ── Notify HR Admin of escalation ────────────────────────────────────────────
export async function notifyHRAdmin(stepId, requestType) {
  const { data: hr } = await supabase
    .from('users')
    .select('line_user_id')
    .eq('role', 'hr_admin')
    .limit(1)
    .single();

  if (!hr?.line_user_id) return;

  const typeLabel = requestType === 'leave' ? 'ใบลา' : 'OT';
  await lineClient.pushMessage(hr.line_user_id, {
    type: 'text',
    text: `แจ้งเตือน: คำขอ${typeLabel} (ID: ${stepId}) ยังไม่ได้รับการตอบสนองจากผู้จัดการเกิน 24 ชั่วโมง\n\nกรุณาตรวจสอบผ่าน Admin Dashboard`,
  });
}

// ── Reminder to manager ───────────────────────────────────────────────────────
export async function remindManager(managerLineUserId, requestType) {
  const typeLabel = requestType === 'leave' ? 'ใบลา' : 'OT';
  await lineClient.pushMessage(managerLineUserId, {
    type: 'text',
    text: `แจ้งเตือน: มีคำขอ${typeLabel}รออนุมัติจากคุณอยู่\n\nกรุณาตรวจสอบในข้อความ LINE ของคุณ`,
  });
}
