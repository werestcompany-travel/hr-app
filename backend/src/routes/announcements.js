import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import { broadcastAnnouncement } from '../services/notificationService.js';
import { logAction } from '../services/auditService.js';

const router = Router();

// Public to any authenticated user (employees read announcements)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, content, pinned, created_at, users!created_by(name)')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json({ announcements: data });
  } catch (err) {
    next(err);
  }
});

// Admin only: create announcement
router.post('/', requireAuth, requireRole('hr_admin'), async (req, res, next) => {
  try {
    const { title, content, pinned } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }
    const { data, error } = await supabase
      .from('announcements')
      .insert({ title, content, pinned: !!pinned, created_by: req.user.userId })
      .select('*, users!created_by(name)')
      .single();
    if (error) throw error;

    // Broadcast to all employees on LINE (fire-and-forget — don't block the response)
    const authorName = data.users?.name || 'HR Admin';
    broadcastAnnouncement(title, content, authorName, !!pinned).catch(() => {});

    logAction({
      actorId: req.user.userId,
      actorName: req.user.name || 'HR Admin',
      action: 'announcement.created',
      entityType: 'announcement',
      entityId: data.id,
      details: { title, pinned: !!pinned },
    });

    res.status(201).json({ announcement: data });
  } catch (err) {
    next(err);
  }
});

// Admin only: delete announcement
router.delete('/:id', requireAuth, requireRole('hr_admin'), async (req, res, next) => {
  try {
    // Fetch title before deletion for the audit log
    const { data: existing } = await supabase
      .from('announcements')
      .select('title')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;

    logAction({
      actorId: req.user.userId,
      actorName: req.user.name || 'HR Admin',
      action: 'announcement.deleted',
      entityType: 'announcement',
      entityId: req.params.id,
      details: { title: existing?.title },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
