-- ============================================================
-- HR System — Supabase Schema
-- Run this entire file in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- USERS
-- Stores both LINE employees and HR admin accounts.
-- line_user_id is null for HR admins (they log in with email/password).
-- password_hash is only used for HR admin accounts.
create table users (
  id               uuid primary key default gen_random_uuid(),
  line_user_id     text unique,
  name             text not null,
  email            text,
  password_hash    text,
  role             text not null default 'employee'
                     check (role in ('employee', 'manager', 'hr_admin')),
  department       text,
  manager_id       uuid references users(id),
  leave_balance_sick      int not null default 30,
  leave_balance_vacation  int not null default 10,
  created_at       timestamptz not null default now()
);

-- LEAVE REQUESTS
create table leave_requests (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references users(id),
  type                  text not null check (type in ('sick', 'vacation', 'emergency', 'other')),
  start_date            date not null,
  end_date              date not null,
  reason                text,
  status                text not null default 'pending'
                          check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  medical_cert_url      text,
  medical_cert_received boolean not null default false,
  created_at            timestamptz not null default now()
);

-- OT REQUESTS
create table ot_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id),
  date       date not null,
  hours      numeric(4, 2) not null,
  reason     text,
  status     text not null default 'pending'
               check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz not null default now()
);

-- APPROVAL STEPS
-- request_id intentionally has no FK constraint because it references
-- either leave_requests or ot_requests depending on request_type.
create table approval_steps (
  id               uuid primary key default gen_random_uuid(),
  request_id       uuid not null,
  request_type     text not null check (request_type in ('leave', 'ot')),
  approver_id      uuid not null references users(id),
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'rejected')),
  reject_reason    text,
  action_at        timestamptz,
  reminder_sent_at timestamptz,
  escalated_at     timestamptz,
  created_at       timestamptz not null default now()
);

-- DOCUMENTS
-- Tracks medical certificates and other required docs for leave requests.
create table documents (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references leave_requests(id),
  type       text not null,
  status     text not null default 'pending' check (status in ('pending', 'received')),
  due_date   date,
  file_url   text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on leave_requests(user_id);
create index on leave_requests(status);
create index on ot_requests(user_id);
create index on ot_requests(status);
create index on approval_steps(request_id, request_type);
create index on approval_steps(approver_id, status);
create index on approval_steps(status, created_at);
create index on documents(request_id);
create index on documents(status, due_date);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Atomically decrements a leave balance column by `amount`.
-- Called by the backend after a leave request is approved.
-- field_name must be either 'leave_balance_sick' or 'leave_balance_vacation'.
create or replace function decrement_leave(
  p_user_id   uuid,
  field_name  text,
  amount      int
)
returns void
language plpgsql
security definer
as $$
begin
  if field_name not in ('leave_balance_sick', 'leave_balance_vacation') then
    raise exception 'Invalid field_name: %', field_name;
  end if;
  execute format(
    'update users set %I = greatest(0, %I - $1) where id = $2',
    field_name, field_name
  ) using amount, p_user_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- Enable RLS on all tables.
-- The backend uses SUPABASE_SERVICE_KEY which bypasses RLS,
-- so these policies exist as a safety net only.
-- ============================================================
alter table users           enable row level security;
alter table leave_requests  enable row level security;
alter table ot_requests     enable row level security;
alter table approval_steps  enable row level security;
alter table documents       enable row level security;

-- Service role (backend) can do everything
create policy "Service role full access on users"
  on users for all using (true);
create policy "Service role full access on leave_requests"
  on leave_requests for all using (true);
create policy "Service role full access on ot_requests"
  on ot_requests for all using (true);
create policy "Service role full access on approval_steps"
  on approval_steps for all using (true);
create policy "Service role full access on documents"
  on documents for all using (true);

-- ============================================================
-- STORAGE
-- After running this SQL, go to Storage → New Bucket:
--   Name: documents
--   Public: OFF
-- Uploads are handled server-side with the service role key.
-- Admins retrieve files via signed URLs (1-hour expiry).
-- ============================================================
