create extension if not exists "pgcrypto";

create type public.app_role as enum (
  'super_admin',
  'admin_kabupaten',
  'koordinator_kecamatan',
  'pml',
  'pcl',
  'pimpinan'
);
create type public.officer_role as enum ('PML', 'PCL', 'Admin');
create type public.work_status as enum ('Aman', 'Perlu Perhatian', 'Kritis');
create type public.issue_status as enum ('Terbuka', 'Diproses', 'Selesai');
create type public.report_status as enum ('draft', 'dikirim', 'dikembalikan', 'disetujui', 'dibuka_kembali');
create type public.supervision_follow_up_status as enum ('belum ditindaklanjuti', 'diproses', 'selesai');
create type public.ticket_status as enum ('baru', 'diproses PML', 'diteruskan admin', 'selesai', 'ditutup');
create type public.ticket_urgency as enum ('rendah', 'sedang', 'tinggi', 'kritis');

create table public.activity_settings (
  id boolean primary key default true,
  name text not null default 'Sensus Ekonomi 2026',
  district_name text not null default 'Kabupaten Labuhanbatu Utara',
  start_date date not null default date '2026-05-01',
  end_date date not null default date '2026-06-30',
  target_load integer not null default 121000 check (target_load >= 0),
  green_min numeric not null default -5,
  yellow_min numeric not null default -10,
  orange_min numeric not null default -20,
  reports_locked boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint one_activity_settings check (id)
);

insert into public.activity_settings (id) values (true)
on conflict (id) do nothing;

create table public.officers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role public.officer_role not null,
  district text not null,
  village text,
  supervisor_id uuid references public.officers(id),
  target_load integer not null default 0 check (target_load >= 0),
  current_progress integer not null default 0 check (current_progress >= 0),
  status public.work_status not null default 'Aman',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'pcl',
  district text,
  officer_id uuid references public.officers(id),
  created_at timestamptz not null default now()
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  district text not null,
  village text not null,
  sls_code text not null,
  sub_sls_id text not null,
  load_target integer not null check (load_target >= 0),
  pml_id uuid not null references public.officers(id),
  pcl_id uuid not null references public.officers(id),
  created_at timestamptz not null default now(),
  unique (village, sls_code, sub_sls_id, pcl_id)
);

create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  assignment_id uuid not null references public.assignments(id),
  pcl_id uuid not null references public.officers(id),
  start_time time not null,
  end_time time not null,
  visited integer not null default 0 check (visited >= 0),
  completed_today integer not null default 0 check (completed_today >= 0),
  pending integer not null default 0 check (pending >= 0),
  revisit integer not null default 0 check (revisit >= 0),
  not_met integer not null default 0 check (not_met >= 0),
  refused integer not null default 0 check (refused >= 0),
  temporarily_closed integer not null default 0 check (temporarily_closed >= 0),
  permanently_closed integer not null default 0 check (permanently_closed >= 0),
  moved integer not null default 0 check (moved >= 0),
  not_found integer not null default 0 check (not_found >= 0),
  duplicate integer not null default 0 check (duplicate >= 0),
  new_business integer not null default 0 check (new_business >= 0),
  note text,
  issue text,
  follow_up_plan text,
  documentation_path text,
  status public.report_status not null default 'draft',
  pml_note text,
  submitted_at timestamptz,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, report_date),
  constraint daily_reports_time_order check (end_time >= start_time)
);

create table public.supervisions (
  id uuid primary key default gen_random_uuid(),
  pml_id uuid not null references public.officers(id),
  pcl_id uuid references public.officers(id),
  supervision_date date not null,
  district text not null,
  village text not null,
  sls_code text not null,
  supervision_type text not null,
  inspected_objects integer not null default 0 check (inspected_objects >= 0),
  result text not null,
  matched_count integer not null default 0 check (matched_count >= 0),
  need_fix_count integer not null default 0 check (need_fix_count >= 0),
  issue text,
  direction text,
  follow_up text,
  follow_up_status public.supervision_follow_up_status not null default 'belum ditindaklanjuti',
  documentation_path text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.issue_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_date date not null default current_date,
  created_by uuid references auth.users(id),
  pml_id uuid references public.officers(id),
  assigned_admin uuid references auth.users(id),
  district text not null,
  village text not null,
  sls_code text,
  category text not null,
  urgency public.ticket_urgency not null default 'sedang',
  description text not null,
  follow_up text,
  status public.ticket_status not null default 'baru',
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  issue_date date not null,
  location text not null,
  category text not null,
  description text not null,
  status public.issue_status not null default 'Terbuka',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null,
  file_type text not null,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  row_count integer not null default 0,
  total_target integer not null default 0,
  status text not null default 'draft',
  validation_summary jsonb not null default '{}'::jsonb,
  imported_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.import_allocation_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number integer not null,
  district text not null,
  village text not null,
  sls_name text not null,
  sub_sls_code text not null,
  sub_sls_id text not null,
  initial_target integer not null check (initial_target > 0),
  flag_pbi text,
  kk_open_pbi integer not null default 0 check (kk_open_pbi >= 0),
  pml_name text not null,
  pcl_name text not null,
  supervisor_name text,
  normalized_hash text not null,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) default auth.uid(),
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  entity text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.current_role()
returns public.app_role
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$;

create or replace function public.is_admin_scope()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'admin_kabupaten')
  );
$$;

create or replace function public.can_read_district(district_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (
        p.role in ('super_admin', 'admin_kabupaten', 'pimpinan')
        or (p.role = 'koordinator_kecamatan' and p.district = district_name)
      )
  );
$$;

create or replace function public.validate_daily_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  settings record;
  target integer;
  approved_total integer;
begin
  select * into settings from public.activity_settings where id = true;
  if new.report_date < settings.start_date or new.report_date > settings.end_date then
    raise exception 'Tanggal harus dalam periode kegiatan';
  end if;

  select load_target into target from public.assignments where id = new.assignment_id;
  select coalesce(sum(completed_today), 0)::integer into approved_total
  from public.daily_reports
  where assignment_id = new.assignment_id
    and status = 'disetujui'
    and id <> coalesce(new.id, gen_random_uuid());

  if approved_total + new.completed_today > target and public.current_role() not in ('super_admin', 'admin_kabupaten') then
    raise exception 'Kumulatif selesai melebihi target aktual dan perlu persetujuan admin';
  end if;

  if TG_OP = 'UPDATE' and old.status = 'disetujui' and new.status <> 'dibuka_kembali' and public.current_role() not in ('super_admin', 'admin_kabupaten') then
    raise exception 'Laporan yang disetujui tidak dapat diedit';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_validate_daily_report
before insert or update on public.daily_reports
for each row execute function public.validate_daily_report();

create or replace view public.v_official_assignment_progress as
select
  a.id as assignment_id,
  a.district,
  a.village,
  a.sls_code,
  a.sub_sls_id,
  a.load_target,
  a.pml_id,
  a.pcl_id,
  coalesce(sum(dr.completed_today) filter (where dr.status = 'disetujui'), 0)::integer as official_completed,
  greatest(a.load_target - coalesce(sum(dr.completed_today) filter (where dr.status = 'disetujui'), 0), 0)::integer as remaining_target,
  case when a.load_target > 0
    then round((coalesce(sum(dr.completed_today) filter (where dr.status = 'disetujui'), 0)::numeric / a.load_target) * 100, 2)
    else 0
  end as progress_percent
from public.assignments a
left join public.daily_reports dr on dr.assignment_id = a.id
group by a.id, a.district, a.village, a.sls_code, a.sub_sls_id, a.load_target, a.pml_id, a.pcl_id;

create or replace view public.v_progress_status as
with settings as (
  select
    start_date,
    end_date,
    green_min,
    yellow_min,
    orange_min,
    greatest((current_date - start_date + 1), 0)::numeric as active_days,
    greatest((end_date - start_date + 1), 0)::numeric as total_days,
    greatest((end_date - current_date), 0)::numeric as remaining_days
  from public.activity_settings where id = true
),
scope_rows as (
  select 'sls'::text as scope_type, assignment_id::text as scope_id, district, village, sls_code, load_target as target, official_completed as completed from public.v_official_assignment_progress
  union all
  select 'desa', district || '/' || village, district, village, null, sum(load_target)::integer, sum(official_completed)::integer from public.v_official_assignment_progress group by district, village
  union all
  select 'kecamatan', district, district, null, null, sum(load_target)::integer, sum(official_completed)::integer from public.v_official_assignment_progress group by district
  union all
  select 'kabupaten', 'Labuhanbatu Utara', null, null, null, sum(load_target)::integer, sum(official_completed)::integer from public.v_official_assignment_progress
)
select
  s.scope_type,
  s.scope_id,
  s.district,
  s.village,
  s.sls_code,
  s.target,
  s.completed,
  greatest(s.target - s.completed, 0)::integer as remaining_target,
  case when s.target > 0 then round((s.completed::numeric / s.target) * 100, 2) else 0 end as progress_realisasi,
  case when st.total_days > 0 then round((st.active_days / st.total_days) * 100, 2) else 0 end as progress_waktu,
  case when st.active_days > 0 then round(s.completed::numeric / st.active_days, 2) else 0 end as rata_rata_harian,
  case when st.remaining_days > 0 then round(greatest(s.target - s.completed, 0)::numeric / st.remaining_days, 2) else 0 end as kebutuhan_harian,
  case
    when s.completed = 0 then 'abu-abu'
    when ((case when s.target > 0 then (s.completed::numeric / s.target) * 100 else 0 end) - (case when st.total_days > 0 then (st.active_days / st.total_days) * 100 else 0 end)) >= st.green_min then 'hijau'
    when ((case when s.target > 0 then (s.completed::numeric / s.target) * 100 else 0 end) - (case when st.total_days > 0 then (st.active_days / st.total_days) * 100 else 0 end)) >= st.yellow_min then 'kuning'
    when ((case when s.target > 0 then (s.completed::numeric / s.target) * 100 else 0 end) - (case when st.total_days > 0 then (st.active_days / st.total_days) * 100 else 0 end)) >= st.orange_min then 'oranye'
    else 'merah'
  end as status_otomatis
from scope_rows s
cross join settings st;

create or replace view public.v_pcl_rekap as
select
  o.id,
  o.name,
  o.district,
  o.village,
  coalesce(sum(v.load_target), 0)::integer as target_load,
  coalesce(sum(v.official_completed), 0)::integer as official_completed
from public.officers o
left join public.v_official_assignment_progress v on v.pcl_id = o.id
where o.role = 'PCL'
group by o.id, o.name, o.district, o.village;

create or replace view public.v_pml_rekap as
select
  o.id,
  o.name,
  o.district,
  coalesce(sum(v.load_target), 0)::integer as target_load,
  coalesce(sum(v.official_completed), 0)::integer as official_completed,
  case when coalesce(sum(v.load_target), 0) > 0
    then round((coalesce(sum(v.official_completed), 0)::numeric / coalesce(sum(v.load_target), 0)) * 100, 2)
    else 0
  end as progress_pml
from public.officers o
left join public.v_official_assignment_progress v on v.pml_id = o.id
where o.role = 'PML'
group by o.id, o.name, o.district;

create or replace view public.v_district_rekap as
select
  district,
  sum(target_load)::integer as target_load,
  sum(official_completed)::integer as official_completed
from public.v_pcl_rekap
group by district;

alter table public.activity_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.officers enable row level security;
alter table public.assignments enable row level security;
alter table public.daily_reports enable row level security;
alter table public.supervisions enable row level security;
alter table public.issues enable row level security;
alter table public.issue_tickets enable row level security;
alter table public.uploads enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_allocation_rows enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

create policy "settings_read_authenticated" on public.activity_settings for select to authenticated using (true);
create policy "settings_manage_admin" on public.activity_settings for all to authenticated using (public.is_admin_scope()) with check (public.is_admin_scope());

create policy "profiles_select_scoped" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin_scope() or public.is_super_admin());
create policy "profiles_update_own_or_admin" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin_scope()) with check (id = auth.uid() or public.is_admin_scope());

create policy "officers_read_scoped" on public.officers for select to authenticated using (public.can_read_district(district) or id in (select officer_id from public.profiles where id = auth.uid()) or supervisor_id in (select officer_id from public.profiles where id = auth.uid()));
create policy "officers_manage_admin" on public.officers for all to authenticated using (public.is_admin_scope()) with check (public.is_admin_scope());

create policy "assignments_read_scoped" on public.assignments for select to authenticated using (
  public.can_read_district(district)
  or pcl_id in (select officer_id from public.profiles where id = auth.uid())
  or pml_id in (select officer_id from public.profiles where id = auth.uid())
);
create policy "assignments_manage_admin" on public.assignments for all to authenticated using (public.is_admin_scope()) with check (public.is_admin_scope());

create policy "daily_reports_read_scoped" on public.daily_reports for select to authenticated using (
  public.is_admin_scope()
  or pcl_id in (select officer_id from public.profiles where id = auth.uid())
  or exists (
    select 1 from public.assignments a
    join public.profiles p on p.id = auth.uid()
    where a.id = daily_reports.assignment_id
      and (a.pml_id = p.officer_id or (p.role = 'koordinator_kecamatan' and p.district = a.district) or p.role = 'pimpinan')
  )
);
create policy "daily_reports_insert_pcl" on public.daily_reports for insert to authenticated with check (
  public.is_admin_scope()
  or pcl_id in (select officer_id from public.profiles where id = auth.uid() and role = 'pcl')
);
create policy "daily_reports_update_workflow" on public.daily_reports for update to authenticated using (
  public.is_admin_scope()
  or pcl_id in (select officer_id from public.profiles where id = auth.uid() and role = 'pcl')
  or exists (
    select 1 from public.assignments a
    join public.profiles p on p.id = auth.uid()
    where a.id = daily_reports.assignment_id and a.pml_id = p.officer_id and p.role = 'pml'
  )
) with check (true);

create policy "supervisions_read_scoped" on public.supervisions for select to authenticated using (public.is_admin_scope() or pml_id in (select officer_id from public.profiles where id = auth.uid()) or pcl_id in (select officer_id from public.profiles where id = auth.uid()));
create policy "supervisions_manage_pml" on public.supervisions for all to authenticated using (public.is_admin_scope() or pml_id in (select officer_id from public.profiles where id = auth.uid() and role = 'pml')) with check (public.is_admin_scope() or pml_id in (select officer_id from public.profiles where id = auth.uid() and role = 'pml'));

create policy "issues_read_authenticated" on public.issues for select to authenticated using (true);
create policy "issues_manage_non_readonly" on public.issues for all to authenticated using (public.current_role() <> 'pimpinan') with check (public.current_role() <> 'pimpinan');

create policy "issue_tickets_read_scoped" on public.issue_tickets for select to authenticated using (
  public.is_admin_scope()
  or created_by = auth.uid()
  or pml_id in (select officer_id from public.profiles where id = auth.uid())
  or assigned_admin = auth.uid()
);
create policy "issue_tickets_insert_pcl" on public.issue_tickets for insert to authenticated with check (public.current_role() in ('pcl', 'pml', 'admin_kabupaten', 'super_admin'));
create policy "issue_tickets_update_workflow" on public.issue_tickets for update to authenticated using (public.current_role() in ('pml', 'admin_kabupaten', 'super_admin')) with check (public.current_role() in ('pml', 'admin_kabupaten', 'super_admin'));

create policy "uploads_read_authenticated" on public.uploads for select to authenticated using (true);
create policy "uploads_manage_admin_or_owner" on public.uploads for all to authenticated using (uploaded_by = auth.uid() or public.is_admin_scope()) with check (uploaded_by = auth.uid() or public.is_admin_scope());

create policy "import_batches_admin" on public.import_batches for all to authenticated using (public.is_admin_scope()) with check (public.is_admin_scope());
create policy "import_rows_admin" on public.import_allocation_rows for all to authenticated using (public.is_admin_scope()) with check (public.is_admin_scope());

create policy "audit_logs_read_admin" on public.audit_logs for select to authenticated using (public.is_admin_scope() or public.is_super_admin());
create policy "audit_logs_insert_authenticated" on public.audit_logs for insert to authenticated with check (actor_id = auth.uid() or public.is_admin_scope());

create policy "notifications_read_own" on public.notifications for select to authenticated using (user_id = auth.uid() or public.is_admin_scope());
create policy "notifications_update_own" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_insert_workflow" on public.notifications for insert to authenticated with check (public.current_role() in ('super_admin', 'admin_kabupaten', 'pml'));

insert into storage.buckets (id, name, public)
values ('marsada-private', 'marsada-private', false)
on conflict (id) do nothing;

create policy "private_docs_select_owner_or_admin" on storage.objects for select to authenticated using (
  bucket_id = 'marsada-private'
  and (owner = auth.uid() or public.is_admin_scope())
);
create policy "private_docs_insert_authenticated" on storage.objects for insert to authenticated with check (
  bucket_id = 'marsada-private'
  and owner = auth.uid()
);
