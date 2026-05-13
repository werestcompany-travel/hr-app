import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import { createApprovalStep } from '../services/approvalService.js';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const router = Router();

// ── Submit OT request ────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { date, hours, reason } = req.body;
    const userId = req.user.userId;

    if (!date || !hours) {
      return res.status(400).json({ error: 'date and hours are required' });
    }

    const numHours = parseFloat(hours);
    if (isNaN(numHours) || numHours <= 0) {
      return res.status(400).json({ error: 'hours must be a positive number' });
    }

    if (!reason?.trim()) {
      return res.status(400).json({ error: 'reason is required for OT requests' });
    }

    // Check monthly OT limit (pending + approved)
    const otDate = new Date(date);
    const monthStart = format(startOfMonth(otDate), 'yyyy-MM-dd');
    const monthEnd   = format(endOfMonth(otDate), 'yyyy-MM-dd');

    const { data: existing } = await supabase
      .from('ot_requests')
      .select('hours')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .in('status', ['pending', 'approved']);

    const usedHours = (existing || []).reduce((sum, r) => sum + parseFloat(r.hours), 0);

    if (usedHours + numHours > 36) {
      return res.status(400).json({
        error: `OT limit exceeded. You have ${(36 - usedHours).toFixed(1)} hours remaining this month.`,
        used: usedHours,
        limit: 36,
      });
    }

    const { data: request, error } = await supabase
      .from('ot_requests')
      .insert({ user_id: userId, date, hours: numHours, reason, status: 'pending' })
      .select()
      .single();

    if (error) throw error;

    await createApprovalStep(request.id, 'ot', userId);

    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
});

// ── Monthly OT usage ─────────────────────────────────────────────────────────
router.get('/monthly-usage', requireAuth, async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('ot_requests')
      .select('hours')
      .eq('user_id', req.user.userId)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .in('status', ['pending', 'approved']);

    const used = (data || []).reduce((sum, r) => sum + parseFloat(r.hours), 0);

    res.json({ used, limit: 36, remaining: Math.max(0, 36 - used) });
  } catch (err) {
    next(err);
  }
});

export default router;
