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
export async function notifyEmployee(userId, status, rejectReason, approverId, requestId, requestType) {
  const [empResult, approverResult] = await Promise.all([
    supabase.from('users').select('line_user_id').eq('id', userId).single(),
    supabase.from('users').select('name').eq('id', approverId).single(),
  ]);

  const emp      = empResult.data;
  const approver = approverResult.data;
  if (!emp?.line_user_id) return;

  // Fetch request details
  let req = null;
  if (requestId && requestType) {
    const table = requestType === 'leave' ? 'leave_requests' : 'ot_requests';
    const { data } = await supabase.from(table).select('*').eq('id', requestId).single();
    req = data;
  }

  const now = format(new Date(), 'dd/MM/yyyy HH:mm');
  const isApproved = status === 'approved';

  const leaveTypeMap = { sick: 'ลาป่วย', vacation: 'พักร้อน', emergency: 'ลากิจ', other: 'ลาอื่นๆ' };

  // Build detail rows
  let details = [];
  if (req && requestType === 'leave') {
    details = [
      { label: 'ประเภท',    value: leaveTypeMap[req.type] || req.type },
      { label: 'วันที่เริ่ม', value: req.start_date },
      { label: 'วันที่สิ้นสุด', value: req.end_date },
      { label: 'จำนวนวัน', value: `${differenceInCalendarDays(new Date(req.end_date), new Date(req.start_date)) + 1} วัน` },
      { label: 'เหตุผล',    value: req.reason || '—' },
    ];
  } else if (req && requestType === 'ot') {
    details = [
      { label: 'วันที่',     value: req.date },
      { label: 'ชั่วโมง OT', value: `${req.hours} ชั่วโมง` },
      { label: 'เหตุผล',    value: req.reason || '—' },
    ];
  }

  const detailContents = details.map(({ label, value }) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, color: '#888888', size: 'sm', flex: 3 },
      { type: 'text', text: value, color: '#333333', size: 'sm', flex: 5, wrap: true },
    ],
  }));

  const headerColor = isApproved ? '#1B4332' : '#7F1D1D';
  const accentColor = isApproved ? '#52B788' : '#EF4444';
  const statusText  = isApproved ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว';
  const byLabel     = isApproved ? 'อนุมัติโดย' : 'ปฏิเสธโดย';

  const footerContents = [
    {
      type: 'box', layout: 'horizontal',
      contents: [
        { type: 'text', text: byLabel, color: '#888888', size: 'sm', flex: 3 },
        { type: 'text', text: approver?.name || 'ผู้จัดการ', color: '#333333', size: 'sm', flex: 5 },
      ],
    },
    {
      type: 'box', layout: 'horizontal',
      contents: [
        { type: 'text', text: 'วันที่',  color: '#888888', size: 'sm', flex: 3 },
        { type: 'text', text: now,       color: '#333333', size: 'sm', flex: 5 },
      ],
    },
  ];

  if (!isApproved && rejectReason) {
    footerContents.push({
      type: 'box', layout: 'horizontal',
      contents: [
        { type: 'text', text: 'เหตุผล', color: '#888888', size: 'sm', flex: 3 },
        { type: 'text', text: rejectReason, color: '#EF4444', size: 'sm', flex: 5, wrap: true },
      ],
    });
  }

  await lineClient.pushMessage(emp.line_user_id, {
    type: 'flex',
    altText: `คำขอของคุณ${statusText}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: headerColor,
        paddingAll: '16px',
        contents: [
          { type: 'text', text: `คำขอของคุณ "${statusText}"`, color: accentColor, weight: 'bold', size: 'lg' },
          {
            type: 'text',
            text: requestType === 'leave' ? 'ใบลาหยุดงาน' : 'คำขอ OT',
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
        contents: detailContents.length > 0 ? [
          ...detailContents,
          { type: 'separator', margin: 'md' },
          ...footerContents,
        ] : footerContents,
      },
    },
  });
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

// ── Notify team when leave is approved ───────────────────────────────────────
export async function notifyTeam(requesterId, requestId) {
  try {
    const [requesterRes, reqRes] = await Promise.all([
      supabase.from('users').select('name, manager_id, department').eq('id', requesterId).single(),
      supabase.from('leave_requests').select('type, start_date, end_date').eq('id', requestId).single(),
    ]);

    const requester = requesterRes.data;
    const req       = reqRes.data;
    if (!requester || !req) return;

    // Find teammates: same manager_id (excluding the requester themselves)
    let teamQuery = supabase
      .from('users')
      .select('line_user_id, name')
      .neq('id', requesterId)
      .not('line_user_id', 'is', null);

    if (requester.manager_id) {
      teamQuery = teamQuery.eq('manager_id', requester.manager_id);
    } else if (requester.department) {
      teamQuery = teamQuery.eq('department', requester.department);
    } else {
      return; // no way to find team
    }

    const { data: teammates } = await teamQuery;
    if (!teammates?.length) return;

    const typeMap  = { sick: 'ลาป่วย', vacation: 'พักร้อน', emergency: 'ลากิจ', other: 'ลาอื่นๆ' };
    const days     = differenceInCalendarDays(new Date(req.end_date), new Date(req.start_date)) + 1;
    const dateText = req.start_date === req.end_date
      ? req.start_date
      : `${req.start_date} — ${req.end_date}`;

    const message = {
      type: 'flex',
      altText: `${requester.name} จะ${typeMap[req.type] || req.type} ${dateText}`,
      contents: {
        type: 'bubble',
        size: 'kilo',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#2D6A4F',
          paddingAll: '14px',
          contents: [
            { type: 'text', text: '📅 แจ้งเตือนทีม', color: '#52B788', weight: 'bold', size: 'md' },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '14px',
          spacing: 'sm',
          contents: [
            { type: 'text', text: requester.name, weight: 'bold', color: '#1B4332', size: 'md' },
            {
              type: 'text',
              text: `จะ${typeMap[req.type] || req.type} (ได้รับการอนุมัติแล้ว)`,
              color: '#555555',
              size: 'sm',
              margin: 'xs',
            },
            { type: 'separator', margin: 'sm' },
            {
              type: 'box', layout: 'horizontal', margin: 'sm',
              contents: [
                { type: 'text', text: 'วันที่',   color: '#888888', size: 'sm', flex: 3 },
                { type: 'text', text: dateText,   color: '#333333', size: 'sm', flex: 5, wrap: true },
              ],
            },
            {
              type: 'box', layout: 'horizontal',
              contents: [
                { type: 'text', text: 'จำนวน',  color: '#888888', size: 'sm', flex: 3 },
                { type: 'text', text: `${days} วัน`, color: '#333333', size: 'sm', flex: 5 },
              ],
            },
          ],
        },
      },
    };

    for (const teammate of teammates) {
      if (teammate.line_user_id) {
        await lineClient.pushMessage(teammate.line_user_id, message).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[notifyTeam] Error:', err.message);
  }
}

// ── Reminder to manager ───────────────────────────────────────────────────────
export async function remindManager(managerLineUserId, requestType) {
  const typeLabel = requestType === 'leave' ? 'ใบลา' : 'OT';
  await lineClient.pushMessage(managerLineUserId, {
    type: 'text',
    text: `แจ้งเตือน: มีคำขอ${typeLabel}รออนุมัติจากคุณอยู่\n\nกรุณาตรวจสอบในข้อความ LINE ของคุณ`,
  });
}
