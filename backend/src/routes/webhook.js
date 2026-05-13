import { Router } from 'express';
import { lineMiddleware } from '../config/line.js';
import { handleEvent } from '../services/lineService.js';

const router = Router();

// POST /webhook/line
// express.raw() is applied to this path in index.js so the LINE SDK
// can verify the X-Line-Signature header before we parse the body.
router.post('/line', lineMiddleware, async (req, res) => {
  const events = req.body?.events || [];
  await Promise.all(events.map(handleEvent));
  res.sendStatus(200);
});

export default router;
