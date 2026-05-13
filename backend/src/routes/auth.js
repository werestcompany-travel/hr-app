import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';

const router = Router();

// ── LINE LIFF Login ──────────────────────────────────────────────────────────
// LIFF calls liff.getIDToken() and POSTs it here.
// We verify the ID token with LINE's verify endpoint, then issue our own JWT.
router.post('/line', async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'accessToken is required' });
    }

    // Verify LINE ID token
    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id_token: accessToken,
        client_id: process.env.LINE_LOGIN_CHANNEL_ID || process.env.LINE_CHANNEL_ID,
      }),
    });

    if (!verifyRes.ok) {
      return res.status(401).json({ error: 'Invalid LINE token' });
    }

    const lineProfile = await verifyRes.json();
    const lineUserId = lineProfile.sub;
    const name = lineProfile.name || 'Unknown';

    // Upsert user — creates row on first login, ignores on repeat
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        { line_user_id: lineUserId, name },
        { onConflict: 'line_user_id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) throw error;

    const token = jwt.sign(
      { userId: user.id, role: user.role, lineUserId: user.line_user_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// ── HR Admin Email/Password Login ────────────────────────────────────────────
router.post('/admin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'hr_admin')
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash || '');
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Don't return password hash to client
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

export default router;
