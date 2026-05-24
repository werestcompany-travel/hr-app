-- ─── Audit Log table ──────────────────────────────────────────────────────────
-- Run this once in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid        REFERENCES users(id) ON DELETE SET NULL,
  actor_name  text,                              -- denormalised for easy display
  action      text        NOT NULL,              -- e.g. 'employee.updated', 'leave.approved'
  entity_type text        NOT NULL,              -- 'employee' | 'leave' | 'ot' | 'announcement'
  entity_id   text,                              -- UUID of the affected row (stored as text to be flexible)
  details     jsonb,                             -- arbitrary extra context
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx  ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx    ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx      ON audit_logs(action);
