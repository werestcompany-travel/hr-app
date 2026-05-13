import cron from 'node-cron';
import { supabase } from '../config/supabase.js';
import { lineClient } from '../config/line.js';
import { remindManager, notifyHRAdmin } from '../services/notificationService.js';

// ── Run every 30 minutes ──────────────────────────────────────────────────────
cron.schedule('*/30 * * * *', async () => {
  try {
    await sendApprovalReminders();
    await escalateOverdueRequests();
    await remindDocumentUploads();
  } catch (err) {
    console.error('[reminderJob] Error:', err.message);
  }
});

// 4-hour reminder: pending steps with no reminder sent yet
async function sendApprovalReminders() {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

  const { data: steps } = await supabase
    .from('approval_steps')
    .select('id, request_type, approver_id, users!approver_id(line_user_id)')
    .eq('status', 'pending')
    .lt('created_at', fourHoursAgo)
    .is('reminder_sent_at', null);

  for (const step of steps || []) {
    const managerLineId = step.users?.line_user_id;
    if (!managerLineId) continue;

    await remindManager(managerLineId, step.request_type);
    await supabase
      .from('approval_steps')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', step.id);
  }
}

// 24-hour escalation: pending steps not yet escalated
async function escalateOverdueRequests() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: steps } = await supabase
    .from('approval_steps')
    .select('id, request_type')
    .eq('status', 'pending')
    .lt('created_at', twentyFourHoursAgo)
    .is('escalated_at', null);

  for (const step of steps || []) {
    await notifyHRAdmin(step.id, step.request_type);
    await supabase
      .from('approval_steps')
      .update({ escalated_at: new Date().toISOString() })
      .eq('id', step.id);
  }
}

// Daily reminder to employees who haven't uploaded medical cert
async function remindDocumentUploads() {
  const today = new Date().toISOString().slice(0, 10);

  const { data: docs } = await supabase
    .from('documents')
    .select('id, request_id, leave_requests(user_id, users(line_user_id, name))')
    .eq('status', 'pending')
    .lte('due_date', today);

  for (const doc of docs || []) {
    const lineUserId = doc.leave_requests?.users?.line_user_id;
    const name = doc.leave_requests?.users?.name || 'Employee';
    if (!lineUserId) continue;

    await lineClient.pushMessage(lineUserId, {
      type: 'text',
      text: `📎 Reminder, ${name}: Your sick leave requires a medical certificate that has not been uploaded yet. Please upload it as soon as possible to avoid issues with your leave approval.`,
    });
  }
}

console.log('[reminderJob] Cron jobs started (every 30 minutes)');
