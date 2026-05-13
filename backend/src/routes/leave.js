import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import { createApprovalStep } from '../services/approvalService.js';
import { upload, uploadDocument } from '../services/storageService.js';
import { differenceInCalendarDays, addDays, isBefore, startOfDay } from 'date-fns';

const router = Router();

// ── Submit leave request ─────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { type, start_date, end_date, reason } = req.body;
    const userId = req.user.userId;

    if (!type || !start_date || !end_date) {
      return res.status(400).json({ error: 'type, start_date and end_date are required' });
    }

    const today = startOfDay(new Date());
    const start = new Date(start_date);
    const end   = new Date(end_date);

    if (end < start) {
      return res.status(400).json({ error: 'end_date must be on or after start_date' });
    }

    // Type-specific validation
    if (type === 'vacation') {
      const threeAhead = addDays(today, 3);
      if (isBefore(start, threeAhead)) {
        return res.status(400).json({
          error: 'Vacation leave must be requested at least 3 days in advance',
        });
      }
    }

    if (type === 'other' && !reason?.trim()) {
      return res.status(400).json({ error: 'Reason is required for Other leave type' });
    }

    // Emergency leave: auto-approve, no approval step needed
    if (type === 'emergency') {
      const { data: request, error } = await supabase
        .from('leave_requests')
        .insert({ user_id: userId, type, start_date, end_date, reason, status: 'approved' })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ request, message: 'Emergency leave auto-approved' });
    }

    // Insert leave request as pending
    const { data: request, error } = await supabase
      .from('leave_requests')
      .insert({ user_id: userId, type, start_date, end_date, reason, status: 'pending' })
      .select()
      .single();
    if (error) throw error;

    // Sick leave ≥2 days → create a pending document record
    const days = differenceInCalendarDays(end, start) + 1;
    if (type === 'sick' && days >= 2) {
      const dueDate = addDays(start, 7).toISOString().slice(0, 10);
      await supabase.from('documents').insert({
        request_id: request.id,
        type: 'medical_certificate',
        status: 'pending',
        due_date: dueDate,
      });
    }

    await createApprovalStep(request.id, 'leave', userId);

    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
});

// ── Get leave balance ────────────────────────────────────────────────────────
router.get('/balance', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('leave_balance_sick, leave_balance_vacation')
      .eq('id', req.user.userId)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Upload medical certificate ────────────────────────────────────────────────
router.post('/:id/upload', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify this leave request belongs to the current user
    const { data: lr, error: lrErr } = await supabase
      .from('leave_requests')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (lrErr || !lr) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (lr.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const storagePath = await uploadDocument(req.file, id, 'medical_cert');

    await Promise.all([
      supabase.from('leave_requests').update({ medical_cert_url: storagePath }).eq('id', id),
      supabase
        .from('documents')
        .update({ file_url: storagePath, status: 'received' })
        .eq('request_id', id),
    ]);

    res.json({ storagePath, message: 'Medical certificate uploaded successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
