alter view if exists public.rekap_sls set (security_invoker = true);
alter view if exists public.rekap_kabupaten set (security_invoker = true);
alter view if exists public.v_progress_sls set (security_invoker = true);
alter view if exists public.v_progress_pcl set (security_invoker = true);
alter view if exists public.v_progress_pml set (security_invoker = true);
alter view if exists public.v_progress_desa set (security_invoker = true);
alter view if exists public.v_progress_kecamatan set (security_invoker = true);
alter view if exists public.v_progress_kabupaten set (security_invoker = true);

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select p from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function public.current_role()
returns public.role_pengguna
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin_kabupaten','super_admin'));
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'super_admin');
$$;

create or replace function public.is_pimpinan()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'pimpinan');
$$;

drop policy if exists "super_admin_all_profiles" on public.profiles;
drop policy if exists "profiles_self_select" on public.profiles;
drop policy if exists "wilayah_select_scoped" on public.kecamatan;
drop policy if exists "wilayah_admin_kecamatan" on public.kecamatan;
drop policy if exists "desa_select_scoped" on public.desa;
drop policy if exists "desa_admin" on public.desa;
drop policy if exists "sls_select_scoped" on public.sls;
drop policy if exists "sls_admin" on public.sls;
drop policy if exists "petugas_select_scoped" on public.petugas;
drop policy if exists "petugas_admin" on public.petugas;
drop policy if exists "hubungan_select_pml" on public.hubungan_pml_pcl;
drop policy if exists "hubungan_admin" on public.hubungan_pml_pcl;
drop policy if exists "penugasan_select_scoped" on public.penugasan;
drop policy if exists "penugasan_admin" on public.penugasan;

create policy "super_admin_all_profiles" on public.profiles
for all
using ((select public.is_super_admin()))
with check ((select public.is_super_admin()));

create policy "profiles_self_select" on public.profiles
for select
using (id = (select auth.uid()) or (select public.is_admin()) or (select public.is_pimpinan()));

create policy "wilayah_select_scoped" on public.kecamatan
for select to authenticated
using (
  (select public.is_admin())
  or (select public.is_pimpinan())
  or id in (select kecamatan_id from public.profiles where id = (select auth.uid()))
);

create policy "wilayah_admin_kecamatan" on public.kecamatan
for all
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "desa_select_scoped" on public.desa
for select to authenticated
using (
  (select public.is_admin())
  or (select public.is_pimpinan())
  or kecamatan_id in (select kecamatan_id from public.profiles where id = (select auth.uid()))
);

create policy "desa_admin" on public.desa
for all
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "sls_select_scoped" on public.sls
for select to authenticated
using (
  (select public.is_admin())
  or (select public.is_pimpinan())
  or desa_id in (
    select d.id
    from public.desa d
    join public.profiles p on p.kecamatan_id = d.kecamatan_id
    where p.id = (select auth.uid())
  )
);

create policy "sls_admin" on public.sls
for all
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "petugas_select_scoped" on public.petugas
for select to authenticated
using (
  (select public.is_admin())
  or (select public.is_pimpinan())
  or id in (select petugas_id from public.profiles where id = (select auth.uid()))
  or kecamatan_id in (select kecamatan_id from public.profiles where id = (select auth.uid()))
);

create policy "petugas_admin" on public.petugas
for all
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "hubungan_select_pml" on public.hubungan_pml_pcl
for select
using (
  (select public.is_admin())
  or (select public.is_pimpinan())
  or pml_id in (select petugas_id from public.profiles where id = (select auth.uid()))
  or pcl_id in (select petugas_id from public.profiles where id = (select auth.uid()))
);

create policy "hubungan_admin" on public.hubungan_pml_pcl
for all
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "penugasan_select_scoped" on public.penugasan
for select
using (
  (select public.is_admin())
  or (select public.is_pimpinan())
  or pcl_id in (select petugas_id from public.profiles where id = (select auth.uid()))
  or pml_id in (select petugas_id from public.profiles where id = (select auth.uid()))
);

create policy "penugasan_admin" on public.penugasan
for all
using ((select public.is_admin()))
with check ((select public.is_admin()));
