import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = Router();

// ── Employee request history ─────────────────────────────────────────────────
router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Fetch leave and OT requests (no approval_steps join — no FK exists)
    const [leaveResult, otResult] = await Promise.all([
      supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('ot_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    const leave = (leaveResult.data || []).map(r => ({ ...r, request_type: 'leave' }));
    const ot    = (otResult.data || []).map(r => ({ ...r, request_type: 'ot' }));
    const all   = [...leave, ...ot].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Fetch approval steps separately for all request IDs
    const allIds = all.map(r => r.id);
    let stepsMap = {};

    if (allIds.length > 0) {
      const { data: steps } = await supabase
        .from('approval_steps')
        .select('*, users!approver_id(name)')
        .in('request_id', allIds);

      for (const step of steps || []) {
        if (!stepsMap[step.request_id]) stepsMap[step.request_id] = [];
        stepsMap[step.request_id].push(step);
      }
    }

    // Attach approval steps to each request
    const requests = all.map(r => ({
      ...r,
      approval_steps: stepsMap[r.id] || [],
    }));

    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

export default router;
