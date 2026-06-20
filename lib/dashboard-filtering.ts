import { resolvePclName, titleCase, type ImportedAllocationRow } from "@/lib/imported-allocations";

export type DashboardFilterValues = {
  kecamatan?: string;
  desa?: string;
  pml?: string;
  pcl?: string;
  statusLaporan?: string;
  statusProgress?: string;
};

type DashboardReport = {
  subSlsId: string;
  completedToday: number;
  status: string;
};

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function activeFilter(value: string | null | undefined) {
  const normalized = normalize(value);
  return normalized && !normalized.startsWith("semua ") ? normalized : "";
}

export function dashboardFiltersFromParams(params: URLSearchParams): DashboardFilterValues {
  return {
    kecamatan: params.get("kecamatan") ?? undefined,
    desa: params.get("desa") ?? undefined,
    pml: params.get("pml") ?? undefined,
    pcl: params.get("pcl") ?? undefined,
    statusLaporan: params.get("status_laporan") ?? undefined,
    statusProgress: params.get("status_progress") ?? undefined
  };
}

export function filterImportedRows(rows: ImportedAllocationRow[], filters: DashboardFilterValues) {
  const kecamatan = activeFilter(filters.kecamatan);
  const desa = activeFilter(filters.desa);
  const pml = activeFilter(filters.pml);
  const pcl = activeFilter(filters.pcl);

  return rows.filter((row) => {
    const resolvedPcl = titleCase(resolvePclName(row.pcl, row.pml));
    return (
      (!kecamatan || normalize(titleCase(row.kecamatan)) === kecamatan) &&
      (!desa || normalize(titleCase(row.desa)) === desa) &&
      (!pml || normalize(titleCase(row.pml)) === pml) &&
      (!pcl || normalize(resolvedPcl) === pcl)
    );
  });
}

function progressBucket(value: number) {
  if (value >= 75) return "hijau";
  if (value >= 50) return "kuning";
  if (value >= 25) return "oranye";
  if (value > 0) return "merah";
  return "belum ada laporan";
}

export function filterImportedRowsWithReports(rows: ImportedAllocationRow[], filters: DashboardFilterValues, reports: DashboardReport[]) {
  const baseRows = filterImportedRows(rows, filters);
  const statusLaporan = activeFilter(filters.statusLaporan);
  const statusProgress = activeFilter(filters.statusProgress);
  if (!statusLaporan && !statusProgress) return baseRows;

  const reportsBySubSls = new Map<string, DashboardReport[]>();
  const approvedCompletedBySubSls = new Map<string, number>();
  reports.forEach((report) => {
    reportsBySubSls.set(report.subSlsId, [...(reportsBySubSls.get(report.subSlsId) ?? []), report]);
    if (report.status === "disetujui") {
      approvedCompletedBySubSls.set(report.subSlsId, (approvedCompletedBySubSls.get(report.subSlsId) ?? 0) + report.completedToday);
    }
  });

  return baseRows.filter((row) => {
    const rowReports = reportsBySubSls.get(row.idSubSls) ?? [];
    const statusOk =
      !statusLaporan ||
      (statusLaporan === "belum ada laporan" ? rowReports.length === 0 : rowReports.some((report) => normalize(report.status) === statusLaporan));
    const progressValue = row.targetAwal ? ((approvedCompletedBySubSls.get(row.idSubSls) ?? 0) / row.targetAwal) * 100 : 0;
    const progressOk = !statusProgress || progressBucket(progressValue) === statusProgress;
    return statusOk && progressOk;
  });
}
