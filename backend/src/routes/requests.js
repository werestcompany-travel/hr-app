import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = Router();

// ── Employee request history ─────────────────────────────────────────────────
// Returns both leave and OT requests for the current user, sorted newest first.
router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [leaveResult, otResult] = await Promise.all([
      supabase
        .from('leave_requests')
        .select('*, approval_steps(status, reject_reason, action_at, approver_id, users!approver_id(name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('ot_requests')
        .select('*, approval_steps(status, reject_reason, action_at, approver_id, users!approver_id(name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    const leave = (leaveResult.data || []).map(r => ({ ...r, request_type: 'leave' }));
    const ot    = (otResult.data || []).map(r => ({ ...r, request_type: 'ot' }));

    // Merge and sort by created_at descending
    const all = [...leave, ...ot].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.json({ requests: all });
  } catch (err) {
    next(err);
  }
});

export default router;
