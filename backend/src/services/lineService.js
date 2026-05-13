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
    text: `👋 Welcome, ${profile.displayName}!\n\nYou are now connected to the HR System. Use the menu at the bottom to:\n• Submit leave requests\n• Submit OT requests\n• Check your leave balance\n• View request history`,
  });
}

// ── Text message: keyword routing ─────────────────────────────────────────────
async function handleTextMessage(event) {
  const text = event.message.text.toLowerCase().trim();

  if (text === 'balance' || text === 'leave balance') {
    return await sendLeaveBalance(event);
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
      text: 'User not found. Please contact HR.',
    });
  }

  await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: `📊 Leave Balance for ${user.name}\n\n🤒 Sick Leave: ${user.leave_balance_sick} days\n🌴 Vacation Leave: ${user.leave_balance_vacation} days`,
  });
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
      await processApproval(stepId, 'approved');
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: '✅ Request approved. The employee has been notified.',
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

// ── Reject: send LIFF link for manager to fill reason ─────────────────────────
async function initiateReject(event, stepId, requestType) {
  const liffId = process.env.LIFF_ID_REJECT;
  const rejectUrl = `https://liff.line.me/${liffId}?stepId=${stepId}`;

  await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: `To reject this request, please provide a reason here:\n${rejectUrl}\n\n(The employee will see your reason.)`,
  });
}
