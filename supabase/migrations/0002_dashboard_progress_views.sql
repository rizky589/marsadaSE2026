create or replace view public.v_progress_sls as
select
  p.id as penugasan_id,
  p.kegiatan_id,
  k.nama as kecamatan,
  d.nama as desa,
  s.nama_sls,
  s.kode_sub_sls,
  s.id_sub_sls,
  pml.nama as pml,
  pcl.nama as pcl,
  p.target_aktual as target,
  coalesce(sum(l.jumlah_selesai_hari_ini) filter (where l.status = 'disetujui'), 0)::integer as selesai,
  greatest(p.target_aktual - coalesce(sum(l.jumlah_selesai_hari_ini) filter (where l.status = 'disetujui'), 0), 0)::integer as sisa,
  case
    when p.target_aktual > 0 then round(coalesce(sum(l.jumlah_selesai_hari_ini) filter (where l.status = 'disetujui'), 0)::numeric / p.target_aktual * 100, 3)
    else 0
  end as progres,
  max(l.updated_at) as laporan_updated_at
from public.penugasan p
join public.sls s on s.id = p.sls_id
join public.desa d on d.id = s.desa_id
join public.kecamatan k on k.id = d.kecamatan_id
join public.petugas pml on pml.id = p.pml_id
join public.petugas pcl on pcl.id = p.pcl_id
left join public.laporan_harian l on l.penugasan_id = p.id
where p.aktif = true
group by p.id, p.kegiatan_id, k.nama, d.nama, s.nama_sls, s.kode_sub_sls, s.id_sub_sls, pml.nama, pcl.nama, p.target_aktual;

create or replace view public.v_progress_pcl as
select
  kegiatan_id,
  pml,
  pcl,
  count(*)::integer as jumlah_sls,
  count(distinct desa)::integer as jumlah_desa,
  sum(target)::integer as target,
  sum(selesai)::integer as selesai,
  greatest(sum(target) - sum(selesai), 0)::integer as sisa,
  case when sum(target) > 0 then round(sum(selesai)::numeric / sum(target) * 100, 3) else 0 end as progres,
  max(laporan_updated_at) as laporan_updated_at
from public.v_progress_sls
group by kegiatan_id, pml, pcl;

create or replace view public.v_progress_pml as
select
  kegiatan_id,
  pml,
  count(distinct pcl)::integer as jumlah_pcl,
  count(*)::integer as jumlah_sls,
  count(distinct desa)::integer as jumlah_desa,
  sum(target)::integer as target,
  sum(selesai)::integer as selesai,
  greatest(sum(target) - sum(selesai), 0)::integer as sisa,
  case when sum(target) > 0 then round(sum(selesai)::numeric / sum(target) * 100, 3) else 0 end as progres,
  max(laporan_updated_at) as laporan_updated_at
from public.v_progress_sls
group by kegiatan_id, pml;

create or replace view public.v_progress_desa as
select
  kegiatan_id,
  kecamatan,
  desa,
  count(*)::integer as jumlah_sls,
  sum(target)::integer as target,
  sum(selesai)::integer as selesai,
  greatest(sum(target) - sum(selesai), 0)::integer as sisa,
  case when sum(target) > 0 then round(sum(selesai)::numeric / sum(target) * 100, 3) else 0 end as progres,
  max(laporan_updated_at) as laporan_updated_at
from public.v_progress_sls
group by kegiatan_id, kecamatan, desa;

create or replace view public.v_progress_kecamatan as
select
  kegiatan_id,
  kecamatan,
  count(distinct desa)::integer as jumlah_desa,
  count(*)::integer as jumlah_sls,
  sum(target)::integer as target,
  sum(selesai)::integer as selesai,
  greatest(sum(target) - sum(selesai), 0)::integer as sisa,
  case when sum(target) > 0 then round(sum(selesai)::numeric / sum(target) * 100, 3) else 0 end as progres,
  max(laporan_updated_at) as laporan_updated_at
from public.v_progress_sls
group by kegiatan_id, kecamatan;

create or replace view public.v_progress_kabupaten as
select
  kegiatan_id,
  count(distinct kecamatan)::integer as jumlah_kecamatan,
  count(distinct desa)::integer as jumlah_desa,
  count(distinct pml)::integer as jumlah_pml,
  count(distinct pcl)::integer as jumlah_pcl,
  count(*)::integer as jumlah_sls,
  sum(target)::integer as target,
  sum(selesai)::integer as selesai,
  greatest(sum(target) - sum(selesai), 0)::integer as sisa,
  case when sum(target) > 0 then round(sum(selesai)::numeric / sum(target) * 100, 3) else 0 end as progres,
  max(laporan_updated_at) as laporan_updated_at
from public.v_progress_sls
group by kegiatan_id;
