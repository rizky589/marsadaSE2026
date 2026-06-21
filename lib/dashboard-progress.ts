import { resolvePclName, titleCase } from "@/lib/imported-allocations";
import type { DashboardFilterValues } from "@/lib/dashboard-filtering";

export type DashboardProgressRow = {
  penugasanId: string;
  kegiatanId: string;
  kecamatan: string;
  desa: string;
  namaSls: string;
  kodeSubSls: string;
  idSubSls: string;
  pml: string;
  pcl: string;
  target: number;
  selesai: number;
  sisa: number;
  progres: number;
  laporanUpdatedAt: string | null;
};

type DashboardReport = {
  subSlsId: string;
  status: string;
};

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function activeFilter(value: string | null | undefined) {
  const normalized = normalize(value);
  return normalized && !normalized.startsWith("semua ") ? normalized : "";
}

function progressBucket(value: number) {
  if (value >= 75) return "hijau";
  if (value >= 50) return "kuning";
  if (value >= 25) return "oranye";
  if (value > 0) return "merah";
  return "belum ada laporan";
}

export function filterProgressRows(rows: DashboardProgressRow[], filters: DashboardFilterValues, reports: DashboardReport[]) {
  const kecamatan = activeFilter(filters.kecamatan);
  const desa = activeFilter(filters.desa);
  const pml = activeFilter(filters.pml);
  const pcl = activeFilter(filters.pcl);
  const statusLaporan = activeFilter(filters.statusLaporan);
  const statusProgress = activeFilter(filters.statusProgress);

  const reportsBySubSls = new Map<string, DashboardReport[]>();
  reports.forEach((report) => {
    reportsBySubSls.set(report.subSlsId, [...(reportsBySubSls.get(report.subSlsId) ?? []), report]);
  });

  return rows.filter((row) => {
    const resolvedPcl = titleCase(resolvePclName(row.pcl, row.pml));
    const rowReports = reportsBySubSls.get(row.idSubSls) ?? [];
    const statusOk =
      !statusLaporan ||
      (statusLaporan === "belum ada laporan" ? rowReports.length === 0 : rowReports.some((report) => normalize(report.status) === statusLaporan));
    const progressOk = !statusProgress || progressBucket(row.progres) === statusProgress;

    return (
      (!kecamatan || normalize(titleCase(row.kecamatan)) === kecamatan) &&
      (!desa || normalize(titleCase(row.desa)) === desa) &&
      (!pml || normalize(titleCase(row.pml)) === pml) &&
      (!pcl || normalize(resolvedPcl) === pcl) &&
      statusOk &&
      progressOk
    );
  });
}

export function summarizeProgressRows(rows: DashboardProgressRow[]) {
  const kecamatan = new Set<string>();
  const desa = new Set<string>();
  const sls = new Set<string>();
  const pml = new Set<string>();
  const pcl = new Set<string>();

  rows.forEach((row) => {
    kecamatan.add(normalize(row.kecamatan));
    desa.add(`${normalize(row.kecamatan)}|${normalize(row.desa)}`);
    sls.add(row.idSubSls);
    pml.add(normalize(row.pml));
    pcl.add(`${normalize(row.pml)}|${resolvePclName(row.pcl, row.pml)}`);
  });

  return {
    kecamatan: kecamatan.size,
    desa: desa.size,
    sls: sls.size,
    pml: pml.size,
    pcl: pcl.size,
    target: rows.reduce((sum, row) => sum + row.target, 0),
    selesai: rows.reduce((sum, row) => sum + row.selesai, 0),
    sisa: rows.reduce((sum, row) => sum + row.sisa, 0),
    updatedAt: rows.map((row) => row.laporanUpdatedAt).filter(Boolean).sort().at(-1) ?? null
  };
}
