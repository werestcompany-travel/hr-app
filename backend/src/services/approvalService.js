import { supabase } from '../config/supabase.js';
import { notifyManager, notifyEmployee } from './notificationService.js';
import { differenceInCalendarDays } from 'date-fns';

// ── Create approval step and notify manager ───────────────────────────────────
export async function createApprovalStep(requestId, requestType, userId) {
  // Route to manager role first, then fall back to hr_admin
  const { data: approver } = await supabase
    .from('users')
    .select('id')
    .in('role', ['manager', 'hr_admin'])
    .limit(1)
    .single();

  let approverId = approver?.id;

  if (!approverId) {
    throw Object.assign(new Error('No manager or HR admin found to route this request'), { status: 500 });
  }

  const { data: step, error } = await supabase
    .from('approval_steps')
    .insert({
      request_id: requestId,
      request_type: requestType,
      approver_id: approverId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  await notifyManager(approverId, requestId, requestType);

  return step;
}

// ── Process approve or reject ─────────────────────────────────────────────────
export async function processApproval(stepId, decision, rejectReason = null) {
  if (decision === 'rejected' && !rejectReason?.trim()) {
    throw Object.assign(new Error('Reject reason is required'), { status: 400, expose: true });
  }

  // Fetch the approval step
  const { data: step, error: stepErr } = await supabase
    .from('approval_steps')
    .select('*')
    .eq('id', stepId)
    .single();

  if (stepErr || !step) {
    throw Object.assign(new Error('Approval step not found'), { status: 404, expose: true });
  }

  if (step.status !== 'pending') {
    throw Object.assign(
      new Error(`This request has already been ${step.status}`),
      { status: 400, expose: true }
    );
  }

  // Update approval step
  await supabase
    .from('approval_steps')
    .update({
      status: decision,
      reject_reason: rejectReason,
      action_at: new Date().toISOString(),
    })
    .eq('id', stepId);

  // Update the parent request
  const table = step.request_type === 'leave' ? 'leave_requests' : 'ot_requests';
  await supabase
    .from(table)
    .update({ status: decision })
    .eq('id', step.request_id);

  // Fetch submitter's userId
  const { data: req } = await supabase
    .from(table)
    .select('user_id')
    .eq('id', step.request_id)
    .single();

  // Notify employee
  await notifyEmployee(req.user_id, decision, rejectReason, step.approver_id);

  // Deduct leave balance on approval
  if (decision === 'approved' && step.request_type === 'leave') {
    await deductLeaveBalance(step.request_id, req.user_id);
  }

  return { ok: true };
}

async function deductLeaveBalance(requestId, userId) {
  const { data: req } = await supabase
    .from('leave_requests')
    .select('type, start_date, end_date')
    .eq('id', requestId)
    .single();

  if (!req) return;

  // Emergency leave is auto-approved with no balance deduction
  if (req.type === 'emergency') return;

  const days = differenceInCalendarDays(new Date(req.end_date), new Date(req.start_date)) + 1;
  const field = req.type === 'vacation' ? 'leave_balance_vacation' : 'leave_balance_sick';

  await supabase.rpc('decrement_leave', {
    user_id: userId,
    field_name: field,
    amount: days,
  });
}
