import { lineClient } from '../config/line.js';
import { supabase } from '../config/supabase.js';
import { processApproval } from './approvalService.js';

// ── Main event dispatcher ─────────────────────────────────────────────────────
export async function handleEvent(event) {
  try {
    if (event.type === 'follow')  return await handleFollow(event);
    if (event.type === 'unfollow') return; // no action needed
    if (event.type === 'message' && event.message?.type === 'text')
      return await handleTextMessage(event);
    if (event.type === 'postback')
      return await handlePostback(event);
  } catch (err) {
    console.error('[lineService] Error handling event:', err.message);
  }
}

// ── Follow: auto-register user ────────────────────────────────────────────────
async function handleFollow(event) {
  const lineUserId = event.source.userId;

  let profile;
  try {
    profile = await lineClient.getProfile(lineUserId);
  } catch {
    profile = { displayName: 'New User' };
  }

  await supabase
    .from('users')
    .upsert(
      { line_user_id: lineUserId, name: profile.displayName },
      { onConflict: 'line_user_id', ignoreDuplicates: false }
    );

  await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: `Welcome, ${profile.displayName}!\n\nYou are now connected to the HR System. Use the menu at the bottom to:\n- Submit leave requests\n- Submit OT requests\n- Check your leave balance\n- View request history`,
  });
}

// ── Text message: keyword routing ─────────────────────────────────────────────
async function handleTextMessage(event) {
  const text = event.message.text.toLowerCase().trim();

  if (text === 'balance' || text === 'leave balance') {
    return await sendLeaveBalance(event);
  }

  if (text === 'contact hr') {
    return await sendContactHR(event);
  }

  await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: 'Please use the menu at the bottom to submit requests or check your balance.',
  });
}

async function sendLeaveBalance(event) {
  const lineUserId = event.source.userId;

  const { data: user } = await supabase
    .from('users')
    .select('name, leave_balance_sick, leave_balance_vacation')
    .eq('line_user_id', lineUserId)
    .single();

  if (!user) {
    return lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ไม่พบข้อมูลผู้ใช้ กรุณาติดต่อ HR',
    });
  }

  const sick     = user.leave_balance_sick     ?? 0;
  const vacation = user.leave_balance_vacation ?? 0;

  const liffId = process.env.LIFF_ID_HISTORY;

  await lineClient.replyMessage(event.replyToken, {
    type: 'flex',
    altText: `วันลาคงเหลือ — ${user.name}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1B4332',
        paddingAll: '16px',
        contents: [
          { type: 'text', text: 'วันลาคงเหลือ', color: '#52B788', weight: 'bold', size: 'lg' },
          { type: 'text', text: user.name, color: '#B7E4C7', size: 'sm', margin: 'sm' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          balanceRow('ลาป่วย (Sick Leave)',    sick,     '#52B788'),
          balanceRow('พักร้อน (Vacation)',     vacation, '#3B82F6'),
        ],
      },
      footer: liffId ? {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        contents: [{
          type: 'button',
          style: 'primary',
          color: '#1B4332',
          height: 'sm',
          action: {
            type: 'uri',
            label: 'ดูรายละเอียด',
            uri: `https://liff.line.me/${liffId}`,
          },
        }],
      } : undefined,
    },
  });
}

function balanceRow(label, days, color) {
  return {
    type: 'box',
    layout: 'horizontal',
    backgroundColor: color + '1A',
    cornerRadius: '12px',
    paddingAll: '12px',
    contents: [
      { type: 'text', text: label, color: '#333333', size: 'sm', flex: 5, wrap: true },
      {
        type: 'box',
        layout: 'vertical',
        flex: 2,
        alignItems: 'flex-end',
        contents: [
          { type: 'text', text: String(days), color, size: 'xxl', weight: 'bold', align: 'end' },
          { type: 'text', text: 'วันคงเหลือ', color: '#888888', size: 'xxs', align: 'end' },
        ],
      },
    ],
  };
}

// ── Postback: approve / reject buttons ────────────────────────────────────────
async function handlePostback(event) {
  const params = new URLSearchParams(event.postback.data);
  const action = params.get('action');
  const stepId = params.get('stepId');
  const requestType = params.get('type');

  if (!stepId) return;

  if (action === 'approve') {
    try {
      // Fetch step before processing so we can build summary
      const { data: step } = await supabase
        .from('approval_steps')
        .select('request_id, request_type')
        .eq('id', stepId)
        .single();

      await processApproval(stepId, 'approved');

      // Fetch request details for summary
      let summary = '';
      if (step) {
        const table = step.request_type === 'leave' ? 'leave_requests' : 'ot_requests';
        const { data: req } = await supabase
          .from(table)
          .select('*, users!user_id(name)')
          .eq('id', step.request_id)
          .single();

        if (req) {
          if (step.request_type === 'leave') {
            const leaveTypeMap = { sick: 'ลาป่วย', vacation: 'พักร้อน', emergency: 'ลากิจ', other: 'ลาอื่นๆ' };
            summary = `\n\nสรุปรายการที่อนุมัติ\nพนักงาน: ${req.users?.name}\nประเภท: ${leaveTypeMap[req.type] || req.type}\nวันที่: ${req.start_date} → ${req.end_date}\nเหตุผล: ${req.reason || '—'}`;
          } else {
            summary = `\n\nสรุปรายการที่อนุมัติ\nพนักงาน: ${req.users?.name}\nวันที่: ${req.date}\nชั่วโมง OT: ${req.hours} ชั่วโมง\nเหตุผล: ${req.reason || '—'}`;
          }
        }
      }

      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `อนุมัติแล้ว พนักงานได้รับการแจ้งเตือนแล้ว${summary}`,
      });
    } catch (err) {
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `Error: ${err.message}`,
      });
    }
    return;
  }

  if (action === 'reject') {
    await initiateReject(event, stepId, requestType);
    return;
  }

  if (action === 'balance') {
    await sendLeaveBalance(event);
    return;
  }
}

// ── Contact HR ────────────────────────────────────────────────────────────────
async function sendContactHR(event) {
  const { data: hrAdmins } = await supabase
    .from('users')
    .select('name, email')
    .eq('role', 'hr_admin');

  const contacts = hrAdmins?.length
    ? hrAdmins.map(h => `${h.name}${h.email ? ' — ' + h.email : ''}`).join('\n')
    : 'Please contact your HR department directly.';

  await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: `HR Contact Information\n\n${contacts}\n\nFor urgent matters, please reach out directly.`,
  });
}

// ── Reject: send LIFF link for manager to fill reason ─────────────────────────
async function initiateReject(event, stepId, requestType) {
  const liffId = process.env.LIFF_ID_REJECT;
  const rejectUrl = `https://liff.line.me/${liffId}?stepId=${stepId}`;

  await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: `To reject this request, please provide a reason here:\n${rejectUrl}\n\n(The employee will see your reason.)`,
  });
}
