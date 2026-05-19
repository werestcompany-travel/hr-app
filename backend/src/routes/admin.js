import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import { getSignedUrl } from '../services/storageService.js';
import { startOfMonth, endOfMonth, format, differenceInCalendarDays } from 'date-fns';

const router = Router();
const adminOnly = [requireAuth, requireRole('hr_admin')];

// ── Employees ────────────────────────────────────────────────────────────────
router.get('/employees', ...adminOnly, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, department, manager_id, line_user_id, leave_balance_sick, leave_balance_vacation, monthly_salary, created_at, users!manager_id(name)')
      .order('name');
    if (error) throw error;

    // Compute used leave this year for each employee
    const year = new Date().getFullYear();
    const { data: usedLeave } = await supabase
      .from('leave_requests')
      .select('user_id, type, start_date, end_date')
      .eq('status', 'approved')
      .gte('start_date', `${year}-01-01`)
      .lte('start_date', `${year}-12-31`);

    const usageMap = {};
    for (const r of usedLeave || []) {
      if (!usageMap[r.user_id]) usageMap[r.user_id] = { sick: 0, vacation: 0 };
      const days = differenceInCalendarDays(new Date(r.end_date), new Date(r.start_date)) + 1;
      if (r.type === 'vacation') usageMap[r.user_id].vacation += days;
      else if (r.type === 'sick')    usageMap[r.user_id].sick    += days;
    }

    const employees = (data || []).map(e => {
      const salary = parseFloat(e.monthly_salary) || 0;
      return {
        ...e,
        used_sick:     usageMap[e.id]?.sick     || 0,
        used_vacation: usageMap[e.id]?.vacation || 0,
        daily_rate:  salary > 0 ? parseFloat((salary / 26).toFixed(2))   : null,
        hourly_rate: salary > 0 ? parseFloat((salary / 26 / 8).toFixed(2)) : null,
      };
    });

    res.json({ employees });
  } catch (err) {
    next(err);
  }
});

router.post('/employees', ...adminOnly, async (req, res, next) => {
  try {
    const { name, email, role, department, manager_id, password, leave_balance_sick, leave_balance_vacation, monthly_salary, line_user_id } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'name and role are required' });
    }

    const insertData = { name, email, role, department, manager_id: manager_id || null };

    if (leave_balance_sick !== undefined)     insertData.leave_balance_sick     = leave_balance_sick;
    if (leave_balance_vacation !== undefined) insertData.leave_balance_vacation = leave_balance_vacation;
    if (monthly_salary !== undefined)         insertData.monthly_salary         = monthly_salary;
    if (line_user_id)                         insertData.line_user_id           = line_user_id;

    // Hash password for HR admin accounts
    if (role === 'hr_admin') {
      if (!password) return res.status(400).json({ error: 'password required for hr_admin' });
      insertData.password_hash = await bcrypt.hash(password, 12);
    }

    const { data, error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    const { password_hash, ...safeData } = data;
    res.status(201).json({ employee: safeData });
  } catch (err) {
    next(err);
  }
});

router.put('/employees/:id', ...adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, manager_id, password, leave_balance_sick, leave_balance_vacation, monthly_salary, line_user_id } = req.body;

    const updates = {};
    if (name !== undefined)                   updates.name = name;
    if (email !== undefined)                  updates.email = email;
    if (role !== undefined)                   updates.role = role;
    if (department !== undefined)             updates.department = department;
    if (manager_id !== undefined)             updates.manager_id = manager_id || null;
    if (leave_balance_sick !== undefined)     updates.leave_balance_sick = leave_balance_sick;
    if (leave_balance_vacation !== undefined) updates.leave_balance_vacation = leave_balance_vacation;
    if (monthly_salary !== undefined)         updates.monthly_salary = monthly_salary;
    if (line_user_id !== undefined)           updates.line_user_id = line_user_id || null;

    if (password) {
      updates.password_hash = await bcrypt.hash(password, 12);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const { password_hash, ...safeData } = data;
    res.json({ employee: safeData });
  } catch (err) {
    next(err);
  }
});

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get('/stats', ...adminOnly, async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd');

    const [empCount, pendingLeave, pendingOT, approvedThisMonth] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).neq('role', 'hr_admin'),
      supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('ot_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd),
    ]);

    res.json({
      employees:      empCount.count || 0,
      pendingLeave:   pendingLeave.count || 0,
      pendingOT:      pendingOT.count || 0,
      approvedMonth:  approvedThisMonth.count || 0,
    });
  } catch (err) {
    next(err);
  }
});

// ── All requests (with optional status filter) ───────────────────────────────
router.get('/requests', ...adminOnly, async (req, res, next) => {
  try {
    const { status, type } = req.query;

    let leaveQuery = supabase
      .from('leave_requests')
      .select('*, users!user_id(name, department)')
      .order('created_at', { ascending: false });

    let otQuery = supabase
      .from('ot_requests')
      .select('*, users!user_id(name, department)')
      .order('created_at', { ascending: false });

    if (status) {
      leaveQuery = leaveQuery.eq('status', status);
      otQuery    = otQuery.eq('status', status);
    }

    const results = [];
    if (!type || type === 'leave') {
      const { data } = await leaveQuery;
      results.push(...(data || []).map(r => ({ ...r, request_type: 'leave' })));
    }
    if (!type || type === 'ot') {
      const { data } = await otQuery;
      results.push(...(data || []).map(r => ({ ...r, request_type: 'ot' })));
    }

    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Fetch approval steps separately (no FK on request_id)
    const allIds = results.map(r => r.id);
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

    const requests = results.map(r => ({ ...r, approval_steps: stepsMap[r.id] || [] }));
    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

// ── Leave report ─────────────────────────────────────────────────────────────
router.get('/reports/leave', ...adminOnly, async (req, res, next) => {
  try {
    const { from, to, department, status } = req.query;

    let query = supabase
      .from('leave_requests')
      .select('*, users!user_id(name, department)')
      .order('created_at', { ascending: false });

    if (from) query = query.gte('start_date', from);
    if (to)   query = query.lte('end_date', to);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    // Filter by department client-side (Supabase doesn't support join-column filtering easily)
    const filtered = department
      ? (data || []).filter(r => r.users?.department === department)
      : (data || []);

    res.json({ requests: filtered });
  } catch (err) {
    next(err);
  }
});

// ── Mark document as received ────────────────────────────────────────────────
router.put('/documents/:id/received', ...adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('documents')
      .update({ status: 'received' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Also update the parent leave_request flag
    await supabase
      .from('leave_requests')
      .update({ medical_cert_received: true })
      .eq('id', data.request_id);

    res.json({ document: data });
  } catch (err) {
    next(err);
  }
});

// ── Get signed URL for a document ────────────────────────────────────────────
router.get('/documents/:id/url', ...adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: doc, error } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', id)
      .single();

    if (error || !doc?.file_url) {
      return res.status(404).json({ error: 'Document not found or not uploaded yet' });
    }

    const url = await getSignedUrl(doc.file_url);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

export default router;
