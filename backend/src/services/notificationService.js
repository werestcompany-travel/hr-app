import { lineClient } from '../config/line.js';
import { supabase } from '../config/supabase.js';
import { format } from 'date-fns';
import { th } from 'date-fns/locale/th';

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
    .select('*, users!user_id(name, department)')
    .eq('id', requestId)
    .single();

  if (mgr?.line_user_id) {
    await lineClient.pushMessage(mgr.line_user_id, buildApprovalFlex(req, requestType));
    return;
  }

  // Manager has no LINE account — fall back to notifying all HR admins
  console.warn(`[notify] Manager ${managerId} has no LINE account. Falling back to HR admin.`);
  const { data: admins } = await supabase
    .from('users')
    .select('line_user_id')
    .eq('role', 'hr_admin');

  const flex = buildApprovalFlex(req, requestType);
  for (const admin of admins || []) {
    if (admin.line_user_id) {
      await lineClient.pushMessage(admin.line_user_id, flex).catch(() => {});
    }
  }
}

function buildApprovalFlex(req, requestType) {
  const employee = req.users;
  const isLeave = requestType === 'leave';

  const details = isLeave
    ? [
        { label: 'Type',       value: capitalise(req.type) },
        { label: 'From',       value: req.start_date },
        { label: 'To',         value: req.end_date },
        { label: 'Reason',     value: req.reason || '—' },
      ]
    : [
        { label: 'Date',       value: req.date },
        { label: 'Hours',      value: String(req.hours) },
        { label: 'Reason',     value: req.reason || '—' },
      ];

  return {
    type: 'flex',
    altText: `New ${requestType} request from ${employee.name}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1B4332',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: `${requestType.toUpperCase()} REQUEST`,
            color: '#52B788',
            weight: 'bold',
            size: 'xl',
          },
          {
            type: 'text',
            text: `From: ${employee.name}${employee.department ? ' · ' + employee.department : ''}`,
            color: '#B7E4C7',
            size: 'sm',
            margin: 'sm',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '16px',
        contents: details.map(({ label, value }) => ({
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: label, color: '#888888', size: 'sm', flex: 2 },
            { type: 'text', text: value, color: '#333333', size: 'sm', flex: 4, wrap: true },
          ],
        })),
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#52B788',
            height: 'sm',
            action: {
              type: 'postback',
              label: '✓ Approve',
              data: `action=approve&stepId=${req.id}&type=${requestType}`,
            },
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'postback',
              label: '✗ Reject',
              data: `action=reject&stepId=${req.id}&type=${requestType}`,
            },
          },
        ],
      },
    },
  };
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
    text = `✅ Your request has been APPROVED\n\nApproved by: ${approver?.name || 'Manager'}\nDate: ${now}`;
  } else {
    text = `❌ Your request has been REJECTED\n\nRejected by: ${approver?.name || 'Manager'}\nDate: ${now}\nReason: ${rejectReason || '—'}`;
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

  await lineClient.pushMessage(hr.line_user_id, {
    type: 'text',
    text: `⚠️ Escalation Alert\n\nA ${requestType} request (ID: ${stepId}) has been pending for over 24 hours without manager response.\n\nPlease review via the admin dashboard.`,
  });
}

// ── Reminder to manager ───────────────────────────────────────────────────────
export async function remindManager(managerLineUserId, requestType) {
  await lineClient.pushMessage(managerLineUserId, {
    type: 'text',
    text: `⏰ Reminder: You have a pending ${requestType} request awaiting your approval.\n\nPlease review it in your LINE messages.`,
  });
}

function capitalise(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
