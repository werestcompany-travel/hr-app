import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { processApproval } from '../services/approvalService.js';

const router = Router();

// ── Approve a request (called from LINE postback via direct API, or internally) ─
router.post('/approve', requireAuth, async (req, res, next) => {
  try {
    const { stepId } = req.body;
    if (!stepId) return res.status(400).json({ error: 'stepId is required' });

    const result = await processApproval(stepId, 'approved');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── Reject a request with reason (called from LIFF RejectForm) ───────────────
router.post('/reject', requireAuth, async (req, res, next) => {
  try {
    const { stepId, reason } = req.body;

    if (!stepId) return res.status(400).json({ error: 'stepId is required' });
    if (!reason?.trim()) return res.status(400).json({ error: 'Reject reason is required' });
    if (reason.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide a more detailed reason (at least 10 characters)' });
    }

    const result = await processApproval(stepId, 'rejected', reason.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
