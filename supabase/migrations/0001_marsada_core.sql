create extension if not exists "pgcrypto";

create type public.role_pengguna as enum ('super_admin','admin_kabupaten','koordinator_kecamatan','pml','pcl','pimpinan');
create type public.status_laporan as enum ('draft','dikirim','dikembalikan','disetujui','dibuka_kembali');
create type public.status_pemeriksaan as enum ('menunggu','disetujui','dikembalikan');
create type public.status_tindak_lanjut as enum ('belum ditindaklanjuti','diproses','selesai');
create type public.status_kendala as enum ('baru','diproses PML','diteruskan admin','selesai','ditutup');
create type public.urgensi_kendala as enum ('rendah','sedang','tinggi','kritis');
create type public.status_import as enum ('draft','valid','gagal','tersimpan');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama_lengkap text not null,
  role public.role_pengguna not null default 'pcl',
  kecamatan_id uuid,
  petugas_id uuid,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.kegiatan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  target_kabupaten integer not null default 0 check (target_kabupaten >= 0),
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nama)
);

create table public.kecamatan (
  id uuid primary key default gen_random_uuid(),
  kode text,
  nama text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nama)
);

create table public.desa (
  id uuid primary key default gen_random_uuid(),
  kecamatan_id uuid not null references public.kecamatan(id) on delete restrict,
  kode text,
  nama text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kecamatan_id, nama)
);

create table public.sls (
  id uuid primary key default gen_random_uuid(),
  desa_id uuid not null references public.desa(id) on delete restrict,
  nama_sls text not null,
  kode_sub_sls text not null,
  id_sub_sls text not null,
  target_awal integer not null check (target_awal > 0),
  target_aktual integer not null check (target_aktual > 0),
  flag_pbi text,
  kk_open_pbi integer not null default 0 check (kk_open_pbi >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id_sub_sls)
);

create table public.petugas (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jenis text not null check (jenis in ('PML','PCL','Admin')),
  kecamatan_id uuid references public.kecamatan(id),
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add constraint profiles_petugas_fk foreign key (petugas_id) references public.petugas(id);
alter table public.profiles add constraint profiles_kecamatan_fk foreign key (kecamatan_id) references public.kecamatan(id);

create table public.hubungan_pml_pcl (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid not null references public.kegiatan(id) on delete cascade,
  pml_id uuid not null references public.petugas(id) on delete restrict,
  pcl_id uuid not null references public.petugas(id) on delete restrict,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kegiatan_id, pcl_id, aktif)
);

create table public.penugasan (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid not null references public.kegiatan(id) on delete cascade,
  sls_id uuid not null references public.sls(id) on delete restrict,
  pml_id uuid not null references public.petugas(id) on delete restrict,
  pcl_id uuid not null references public.petugas(id) on delete restrict,
  target_aktual integer not null check (target_aktual > 0),
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kegiatan_id, sls_id, pcl_id)
);

create table public.laporan_harian (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid not null references public.kegiatan(id) on delete cascade,
  penugasan_id uuid not null references public.penugasan(id) on delete restrict,
  pcl_id uuid not null references public.petugas(id) on delete restrict,
  tanggal date not null,
  jam_mulai time not null,
  jam_selesai time not null,
  jumlah_dikunjungi integer not null default 0 check (jumlah_dikunjungi >= 0),
  jumlah_selesai_hari_ini integer not null default 0 check (jumlah_selesai_hari_ini >= 0),
  pending integer not null default 0 check (pending >= 0),
  kunjungan_ulang integer not null default 0 check (kunjungan_ulang >= 0),
  belum_bertemu integer not null default 0 check (belum_bertemu >= 0),
  menolak integer not null default 0 check (menolak >= 0),
  tutup_sementara integer not null default 0 check (tutup_sementara >= 0),
  tutup_permanen integer not null default 0 check (tutup_permanen >= 0),
  pindah integer not null default 0 check (pindah >= 0),
  tidak_ditemukan integer not null default 0 check (tidak_ditemukan >= 0),
  duplikat integer not null default 0 check (duplikat >= 0),
  usaha_baru integer not null default 0 check (usaha_baru >= 0),
  catatan text,
  kendala text,
  rencana_tindak_lanjut text,
  dokumentasi_path text,
  status public.status_laporan not null default 'draft',
  dibuat_oleh uuid references auth.users(id),
  dikirim_pada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (penugasan_id, tanggal),
  check (jam_selesai >= jam_mulai)
);

create table public.pemeriksaan_laporan (
  id uuid primary key default gen_random_uuid(),
  laporan_harian_id uuid not null references public.laporan_harian(id) on delete cascade,
  pml_id uuid not null references public.petugas(id) on delete restrict,
  status public.status_pemeriksaan not null,
  catatan text,
  diperiksa_oleh uuid references auth.users(id),
  diperiksa_pada timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'dikembalikan' or length(coalesce(catatan,'')) > 0)
);

create table public.pengawasan (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid not null references public.kegiatan(id) on delete cascade,
  tanggal date not null,
  pml_id uuid not null references public.petugas(id) on delete restrict,
  pcl_id uuid not null references public.petugas(id) on delete restrict,
  kecamatan_id uuid not null references public.kecamatan(id) on delete restrict,
  desa_id uuid not null references public.desa(id) on delete restrict,
  sls_id uuid not null references public.sls(id) on delete restrict,
  jenis_pengawasan text not null,
  jumlah_objek_diperiksa integer not null default 0 check (jumlah_objek_diperiksa >= 0),
  hasil_pemeriksaan text not null,
  jumlah_sesuai integer not null default 0 check (jumlah_sesuai >= 0),
  jumlah_perlu_perbaikan integer not null default 0 check (jumlah_perlu_perbaikan >= 0),
  kendala text,
  arahan text,
  tindak_lanjut text,
  status_tindak_lanjut public.status_tindak_lanjut not null default 'belum ditindaklanjuti',
  foto_path text,
  dibuat_oleh uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.kendala (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid references public.kegiatan(id) on delete cascade,
  dibuat_oleh uuid references auth.users(id),
  pcl_id uuid references public.petugas(id),
  pml_id uuid references public.petugas(id),
  penanggung_jawab uuid references auth.users(id),
  kecamatan_id uuid references public.kecamatan(id),
  desa_id uuid references public.desa(id),
  sls_id uuid references public.sls(id),
  kategori text not null,
  urgensi public.urgensi_kendala not null default 'sedang',
  uraian text not null,
  tindak_lanjut text,
  status public.status_kendala not null default 'baru',
  ditutup_pada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifikasi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  judul text not null,
  isi text not null,
  entity text,
  entity_id uuid,
  dibaca_pada timestamptz,
  created_at timestamptz not null default now()
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid references public.kegiatan(id),
  nama_file text not null,
  jumlah_baris integer not null default 0 check (jumlah_baris >= 0),
  total_target integer not null default 0 check (total_target >= 0),
  status public.status_import not null default 'draft',
  ringkasan_validasi jsonb not null default '{}'::jsonb,
  dibuat_oleh uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_errors (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  nomor_baris integer,
  kode_error text not null,
  pesan text not null,
  data_baris jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  aksi text not null,
  tabel text not null,
  record_id uuid,
  sebelum jsonb,
  sesudah jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.pengaturan_aplikasi (
  id boolean primary key default true,
  green_min numeric not null default -5,
  yellow_min numeric not null default -10,
  orange_min numeric not null default -20,
  max_upload_mb integer not null default 5 check (max_upload_mb > 0),
  private_bucket text not null default 'marsada-private',
  updated_at timestamptz not null default now(),
  constraint pengaturan_singleton check (id)
);

insert into public.pengaturan_aplikasi (id) values (true) on conflict (id) do nothing;

do $$
declare t text;
begin
  foreach t in array array['profiles','kegiatan','kecamatan','desa','sls','petugas','hubungan_pml_pcl','penugasan','laporan_harian','pemeriksaan_laporan','pengawasan','kendala','import_batches','pengaturan_aplikasi']
  loop
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

create index idx_profiles_role on public.profiles(role);
create index idx_penugasan_pcl on public.penugasan(pcl_id);
create index idx_penugasan_pml on public.penugasan(pml_id);
create index idx_laporan_status on public.laporan_harian(status);
create index idx_laporan_pcl_tanggal on public.laporan_harian(pcl_id, tanggal);
create index idx_pengawasan_pml on public.pengawasan(pml_id, tanggal);
create index idx_kendala_status_urgensi on public.kendala(status, urgensi);
create index idx_notifikasi_user on public.notifikasi(user_id, dibaca_pada);

create or replace function public.current_profile()
returns public.profiles language sql security definer set search_path = public as $$
  select p from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.current_role()
returns public.role_pengguna language sql security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin_kabupaten','super_admin'));
$$;

create or replace function public.is_super_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$;

create or replace function public.is_pimpinan()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'pimpinan');
$$;

create or replace view public.rekap_sls as
select
  s.id as sls_id,
  s.id_sub_sls,
  s.nama_sls,
  d.nama as desa,
  k.nama as kecamatan,
  s.target_aktual,
  coalesce(sum(l.jumlah_selesai_hari_ini) filter (where l.status = 'disetujui'),0)::integer as selesai,
  greatest(s.target_aktual - coalesce(sum(l.jumlah_selesai_hari_ini) filter (where l.status = 'disetujui'),0),0)::integer as sisa,
  case when s.target_aktual > 0 then round(coalesce(sum(l.jumlah_selesai_hari_ini) filter (where l.status = 'disetujui'),0)::numeric / s.target_aktual * 100, 2) else 0 end as progres
from public.sls s
join public.desa d on d.id = s.desa_id
join public.kecamatan k on k.id = d.kecamatan_id
left join public.penugasan p on p.sls_id = s.id
left join public.laporan_harian l on l.penugasan_id = p.id
group by s.id, d.nama, k.nama;

create or replace view public.rekap_kabupaten as
select
  count(distinct kecamatan) as jumlah_kecamatan,
  count(distinct desa) as jumlah_desa,
  count(*) as jumlah_sls,
  sum(target_aktual)::integer as target,
  sum(selesai)::integer as selesai,
  sum(sisa)::integer as sisa,
  case when sum(target_aktual) > 0 then round(sum(selesai)::numeric / sum(target_aktual) * 100, 2) else 0 end as progres
from public.rekap_sls;

alter table public.profiles enable row level security;
alter table public.kegiatan enable row level security;
alter table public.kecamatan enable row level security;
alter table public.desa enable row level security;
alter table public.sls enable row level security;
alter table public.petugas enable row level security;
alter table public.hubungan_pml_pcl enable row level security;
alter table public.penugasan enable row level security;
alter table public.laporan_harian enable row level security;
alter table public.pemeriksaan_laporan enable row level security;
alter table public.pengawasan enable row level security;
alter table public.kendala enable row level security;
alter table public.notifikasi enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_errors enable row level security;
alter table public.audit_logs enable row level security;
alter table public.pengaturan_aplikasi enable row level security;

create policy "super_admin_all_profiles" on public.profiles for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "profiles_self_select" on public.profiles for select using (id = auth.uid() or public.is_admin() or public.is_pimpinan());

create policy "admin_all_kegiatan" on public.kegiatan for all using (public.is_admin()) with check (public.is_admin());
create policy "read_kegiatan_authenticated" on public.kegiatan for select to authenticated using (true);

create policy "wilayah_select_scoped" on public.kecamatan for select to authenticated using (public.is_admin() or public.is_pimpinan() or id in (select kecamatan_id from public.profiles where id = auth.uid()));
create policy "wilayah_admin_kecamatan" on public.kecamatan for all using (public.is_admin()) with check (public.is_admin());
create policy "desa_select_scoped" on public.desa for select to authenticated using (public.is_admin() or public.is_pimpinan() or kecamatan_id in (select kecamatan_id from public.profiles where id = auth.uid()));
create policy "desa_admin" on public.desa for all using (public.is_admin()) with check (public.is_admin());
create policy "sls_select_scoped" on public.sls for select to authenticated using (public.is_admin() or public.is_pimpinan() or desa_id in (select d.id from public.desa d join public.profiles p on p.kecamatan_id = d.kecamatan_id where p.id = auth.uid()));
create policy "sls_admin" on public.sls for all using (public.is_admin()) with check (public.is_admin());

create policy "petugas_select_scoped" on public.petugas for select to authenticated using (public.is_admin() or public.is_pimpinan() or id in (select petugas_id from public.profiles where id = auth.uid()) or kecamatan_id in (select kecamatan_id from public.profiles where id = auth.uid()));
create policy "petugas_admin" on public.petugas for all using (public.is_admin()) with check (public.is_admin());

create policy "hubungan_select_pml" on public.hubungan_pml_pcl for select using (public.is_admin() or public.is_pimpinan() or pml_id in (select petugas_id from public.profiles where id = auth.uid()) or pcl_id in (select petugas_id from public.profiles where id = auth.uid()));
create policy "hubungan_admin" on public.hubungan_pml_pcl for all using (public.is_admin()) with check (public.is_admin());

create policy "penugasan_select_scoped" on public.penugasan for select using (public.is_admin() or public.is_pimpinan() or pcl_id in (select petugas_id from public.profiles where id = auth.uid()) or pml_id in (select petugas_id from public.profiles where id = auth.uid()));
create policy "penugasan_admin" on public.penugasan for all using (public.is_admin()) with check (public.is_admin());

create policy "laporan_select_scoped" on public.laporan_harian for select using (public.is_admin() or public.is_pimpinan() or pcl_id in (select petugas_id from public.profiles where id = auth.uid()) or exists (select 1 from public.penugasan p join public.profiles pr on pr.petugas_id = p.pml_id where p.id = laporan_harian.penugasan_id and pr.id = auth.uid()));
create policy "laporan_insert_pcl" on public.laporan_harian for insert with check (pcl_id in (select petugas_id from public.profiles where id = auth.uid() and role = 'pcl'));
create policy "laporan_update_pcl_draft_returned" on public.laporan_harian for update using (pcl_id in (select petugas_id from public.profiles where id = auth.uid()) and status in ('draft','dikembalikan')) with check (status in ('draft','dikirim'));

create policy "pemeriksaan_select_scoped" on public.pemeriksaan_laporan for select using (public.is_admin() or public.is_pimpinan() or pml_id in (select petugas_id from public.profiles where id = auth.uid()));
create policy "pemeriksaan_pml" on public.pemeriksaan_laporan for insert with check (public.is_admin() or pml_id in (select petugas_id from public.profiles where id = auth.uid() and role = 'pml'));

create policy "pengawasan_select_scoped" on public.pengawasan for select using (public.is_admin() or public.is_pimpinan() or pml_id in (select petugas_id from public.profiles where id = auth.uid()) or pcl_id in (select petugas_id from public.profiles where id = auth.uid()));
create policy "pengawasan_pml_insert" on public.pengawasan for insert with check (public.is_admin() or pml_id in (select petugas_id from public.profiles where id = auth.uid() and role = 'pml'));

create policy "kendala_select_scoped" on public.kendala for select using (public.is_admin() or public.is_pimpinan() or dibuat_oleh = auth.uid() or pcl_id in (select petugas_id from public.profiles where id = auth.uid()) or pml_id in (select petugas_id from public.profiles where id = auth.uid()));
create policy "kendala_insert_non_pimpinan" on public.kendala for insert with check (public.current_role() <> 'pimpinan');
create policy "kendala_update_pml_admin" on public.kendala for update using (public.is_admin() or pml_id in (select petugas_id from public.profiles where id = auth.uid() and role = 'pml')) with check (true);

create policy "notifikasi_own" on public.notifikasi for select using (user_id = auth.uid() or public.is_admin());
create policy "notifikasi_insert_server_roles" on public.notifikasi for insert with check (public.current_role() in ('super_admin','admin_kabupaten','pml'));

create policy "import_admin" on public.import_batches for all using (public.is_admin()) with check (public.is_admin());
create policy "import_errors_admin" on public.import_errors for all using (public.is_admin()) with check (public.is_admin());
create policy "audit_admin_read" on public.audit_logs for select using (public.is_admin() or public.is_super_admin());
create policy "audit_insert_authenticated" on public.audit_logs for insert with check (actor_id = auth.uid() or public.is_admin());
create policy "pengaturan_admin" on public.pengaturan_aplikasi for all using (public.is_admin()) with check (public.is_admin());
create policy "pengaturan_read" on public.pengaturan_aplikasi for select to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('marsada-private', 'marsada-private', false)
on conflict (id) do nothing;

create policy "marsada_private_storage_select" on storage.objects for select to authenticated using (bucket_id = 'marsada-private' and (owner = auth.uid() or public.is_admin()));
create policy "marsada_private_storage_insert" on storage.objects for insert to authenticated with check (bucket_id = 'marsada-private' and owner = auth.uid());
