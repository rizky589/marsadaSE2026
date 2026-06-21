with report_totals as (
  select
    penugasan_id,
    coalesce(sum(jumlah_selesai_hari_ini) filter (where status = 'disetujui'), 0)::integer as selesai_disetujui,
    count(*)::integer as jumlah_laporan,
    max(updated_at) as laporan_updated_at
  from public.laporan_harian
  group by penugasan_id
),
ranked_assignments as (
  select
    p.id,
    row_number() over (
      partition by p.kegiatan_id, p.sls_id
      order by
        case when coalesce(rt.selesai_disetujui, 0) > 0 then 0 else 1 end,
        case when coalesce(rt.jumlah_laporan, 0) > 0 then 0 else 1 end,
        case when p.aktif then 0 else 1 end,
        p.updated_at desc nulls last,
        p.created_at desc nulls last,
        p.id
    ) as rn
  from public.penugasan p
  left join report_totals rt on rt.penugasan_id = p.id
)
update public.penugasan p
set aktif = false,
    updated_at = now()
from ranked_assignments r
where p.id = r.id
  and r.rn > 1
  and p.aktif is distinct from false;

with report_totals as (
  select
    penugasan_id,
    coalesce(sum(jumlah_selesai_hari_ini) filter (where status = 'disetujui'), 0)::integer as selesai_disetujui,
    count(*)::integer as jumlah_laporan,
    max(updated_at) as laporan_updated_at
  from public.laporan_harian
  group by penugasan_id
),
ranked_assignments as (
  select
    p.id,
    row_number() over (
      partition by p.kegiatan_id, p.sls_id
      order by
        case when coalesce(rt.selesai_disetujui, 0) > 0 then 0 else 1 end,
        case when coalesce(rt.jumlah_laporan, 0) > 0 then 0 else 1 end,
        case when p.aktif then 0 else 1 end,
        p.updated_at desc nulls last,
        p.created_at desc nulls last,
        p.id
    ) as rn
  from public.penugasan p
  left join report_totals rt on rt.penugasan_id = p.id
)
update public.penugasan p
set aktif = true,
    updated_at = now()
from ranked_assignments r
where p.id = r.id
  and r.rn = 1
  and p.aktif is distinct from true;

create or replace view public.v_progress_sls as
with approved_reports as (
  select
    penugasan_id,
    coalesce(sum(jumlah_selesai_hari_ini), 0)::integer as selesai,
    max(updated_at) as laporan_updated_at
  from public.laporan_harian
  where status = 'disetujui'
  group by penugasan_id
),
ranked_assignments as (
  select
    p.id as penugasan_id,
    p.kegiatan_id,
    coalesce(k.nama, '-') as kecamatan,
    coalesce(d.nama, '-') as desa,
    coalesce(s.nama_sls, '-') as nama_sls,
    coalesce(s.kode_sub_sls, '') as kode_sub_sls,
    coalesce(s.id_sub_sls, p.id::text) as id_sub_sls,
    coalesce(pml.nama, '-') as pml,
    coalesce(pcl.nama, '-') as pcl,
    coalesce(p.target_aktual, s.target_aktual, s.target_awal, 0)::integer as target,
    coalesce(ar.selesai, 0)::integer as selesai,
    ar.laporan_updated_at,
    row_number() over (
      partition by p.kegiatan_id, p.sls_id
      order by
        case when coalesce(ar.selesai, 0) > 0 then 0 else 1 end,
        p.updated_at desc nulls last,
        p.created_at desc nulls last,
        p.id
    ) as rn
  from public.penugasan p
  left join public.sls s on s.id = p.sls_id
  left join public.desa d on d.id = s.desa_id
  left join public.kecamatan k on k.id = d.kecamatan_id
  left join public.petugas pml on pml.id = p.pml_id
  left join public.petugas pcl on pcl.id = p.pcl_id
  left join approved_reports ar on ar.penugasan_id = p.id
  where p.aktif = true
)
select
  penugasan_id,
  kegiatan_id,
  kecamatan,
  desa,
  nama_sls,
  kode_sub_sls,
  id_sub_sls,
  pml,
  pcl,
  target,
  selesai,
  greatest(target - selesai, 0)::integer as sisa,
  case when target > 0 then round(selesai::numeric / target * 100, 3) else 0 end as progres,
  laporan_updated_at
from ranked_assignments
where rn = 1;

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
