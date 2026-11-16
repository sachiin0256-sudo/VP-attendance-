create extension if not exists pgcrypto;
create type public.app_role as enum ('admin','manager','employee');
create type public.punch_type as enum ('IN','OUT');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 employee_code text unique not null,
 full_name text not null,
 department text,
 role public.app_role not null default 'employee',
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.attendance_events (
 id uuid primary key default gen_random_uuid(),
 employee_id uuid not null constraint attendance_events_employee_id_fkey references public.profiles(id),
 event_type public.punch_type not null,
 occurred_at timestamptz not null default now(),
 method text not null check(method in ('account','supervisor')),
 created_at timestamptz not null default now()
);
create table public.audit_log (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid references auth.users(id),
 action text not null,
 target_table text not null,
 target_id text,
 reason text,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.attendance_events enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.current_app_role()
returns public.app_role language sql stable security definer
set search_path=public
as $$ select role from public.profiles where id=auth.uid() and active=true $$;

create policy "read own profile or admin"
on public.profiles for select to authenticated
using (id=auth.uid() or public.current_app_role() in ('admin','manager'));

create policy "admin manage profiles"
on public.profiles for all to authenticated
using (public.current_app_role()='admin')
with check (public.current_app_role()='admin');

create policy "read own attendance or manager"
on public.attendance_events for select to authenticated
using (employee_id=auth.uid() or public.current_app_role() in ('admin','manager'));

-- No client-side INSERT/UPDATE/DELETE policy for attendance_events.
-- Writes only happen through the authenticated Edge Function.
create policy "admin read audit log"
on public.audit_log for select to authenticated
using (public.current_app_role()='admin');

-- Provision an initial admin only after creating that user in Supabase Auth:
-- update public.profiles set role='admin' where id='<AUTH_USER_UUID>';
