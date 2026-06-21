"use client";

import { AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, Clock3, MapPinned, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getDailyReportSnapshotAction, getDashboardDatabaseHealthAction, getProgressSlsSnapshotAction } from "@/app/actions";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { dashboardFiltersFromParams } from "@/lib/dashboard-filtering";
import { filterProgressRows, summarizeProgressRows, type DashboardProgressRow } from "@/lib/dashboard-progress";
import { numberId, pct, percentId } from "@/lib/utils";

type StoredDailyReport = {
  subSlsId: string;
  reportDate: string;
  pcl: string;
  completedToday: number;
  status: "draft" | "dikirim" | "dikembalikan" | "disetujui";
};

type DashboardHealth = Awaited<ReturnType<typeof getDashboardDatabaseHealthAction>>;

export function KabupatenImportOverview() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<DashboardProgressRow[]>([]);
  const [reports, setReports] = useState<StoredDailyReport[]>([]);
  const [health, setHealth] = useState<DashboardHealth | null>(null);

  useEffect(() => {
    let active = true;
    async function loadRows() {
      try {
        const snapshot = await getProgressSlsSnapshotAction();
        if (active) setRows(snapshot as DashboardProgressRow[]);
      } catch {
        if (active) setRows([]);
      }
    }

    loadRows();
    async function loadReports() {
      try {
        const serverReports = await getDailyReportSnapshotAction();
        if (active) {
          setReports(serverReports as StoredDailyReport[]);
        }
      } catch {
        if (active) setReports([]);
      }
    }
    async function loadHealth() {
      try {
        const snapshot = await getDashboardDatabaseHealthAction();
        if (active) setHealth(snapshot);
      } catch {
        if (active) setHealth(null);
      }
    }
    loadReports();
    loadHealth();
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => filterProgressRows(rows, dashboardFiltersFromParams(searchParams), reports), [rows, reports, searchParams]);
  const filteredSubSlsIds = useMemo(() => new Set(filteredRows.map((row) => row.idSubSls)), [filteredRows]);
  const summary = useMemo(() => summarizeProgressRows(filteredRows), [filteredRows]);
  const completed = summary.selesai;
  const remaining = summary.sisa;
  const progressValue = pct(completed, summary.target);
  const today = new Date().toISOString().slice(0, 10);
  const activeToday = new Set(reports.filter((report) => report.reportDate === today && filteredSubSlsIds.has(report.subSlsId)).map((report) => report.pcl)).size;
  const pendingReports = reports.filter((report) => report.status === "dikirim" && filteredSubSlsIds.has(report.subSlsId)).length;
  const approvedReports = reports.filter((report) => report.status === "disetujui" && filteredSubSlsIds.has(report.subSlsId));
  const approvedCompleted = approvedReports.reduce((sum, report) => sum + report.completedToday, 0);
  const stats = [
    { label: "Jumlah Kecamatan", value: numberId(summary.kecamatan), icon: MapPinned, tone: "text-blue-600" },
    { label: "Jumlah Desa", value: numberId(summary.desa), icon: MapPinned, tone: "text-emerald-600" },
    { label: "SLS/Sub-SLS", value: numberId(summary.sls), icon: ClipboardCheck, tone: "text-orange-600" },
    { label: "Jumlah PML", value: numberId(summary.pml), icon: Users, tone: "text-blue-600" },
    { label: "Jumlah PCL", value: numberId(summary.pcl), icon: Users, tone: "text-emerald-600" },
    { label: "Total Target", value: numberId(summary.target), icon: BarChart3, tone: "text-orange-600" },
    { label: "Total Selesai", value: numberId(completed), icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Total Sisa", value: numberId(remaining), icon: ClipboardCheck, tone: "text-slate-600" },
    { label: "Progres Kabupaten", value: percentId(progressValue), icon: BarChart3, tone: "text-blue-600" },
    { label: "PCL Aktif Hari Ini", value: numberId(activeToday), icon: Users, tone: "text-emerald-600" },
    { label: "PCL Belum Melapor", value: numberId(Math.max(0, summary.pcl - activeToday)), icon: AlertTriangle, tone: "text-orange-600" },
    { label: "Belum Diperiksa", value: numberId(pendingReports), icon: ClipboardCheck, tone: "text-blue-600" },
    { label: "Laporan Disetujui", value: numberId(approvedReports.length), icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Selesai Disetujui", value: numberId(approvedCompleted), icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Diperbarui", value: summary.updatedAt ? new Date(summary.updatedAt).toLocaleString("id-ID") : "Belum ada", icon: Clock3, tone: "text-blue-600" },
    { label: "Kendala Aktif", value: "0", icon: AlertTriangle, tone: "text-orange-600" },
    { label: "Kendala Kritis", value: "0", icon: AlertTriangle, tone: "text-red-600" }
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] bg-[#0b2a4a] p-5 text-white shadow-2xl shadow-blue-950/20 sm:p-7">
        <h2 className="mt-2 max-w-4xl text-3xl font-black sm:text-4xl">Monitoring SE2026 BPS Kab.Labuhanbatu Utara</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100 sm:text-base">
          {rows.length ? `${numberId(filteredRows.length)} dari ${numberId(rows.length)} alokasi aktif ditampilkan. Progres resmi menunggu laporan PCL disetujui PML.` : "Upload dan simpan alokasi Excel terlebih dahulu agar dashboard memakai data nyata."}
        </p>
        <div className="mt-6 max-w-3xl space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Progres Kabupaten</span>
            <span>{percentId(progressValue)}</span>
          </div>
          <Progress value={progressValue} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                <div>
                  <CardDescription className="text-xs">{item.label}</CardDescription>
                  <CardTitle className="mt-1 text-xl">{item.value}</CardTitle>
                </div>
                <Icon className={`h-6 w-6 ${item.tone}`} />
              </CardHeader>
            </Card>
          );
        })}
      </section>

      {!rows.length && health ? (
        <section className="rounded-3xl border border-orange-500/40 bg-orange-500/10 p-4 text-sm text-orange-950 dark:text-orange-50">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-black">Diagnostik Supabase</p>
              <p className="mt-1 text-orange-900/80 dark:text-orange-100/80">
                Aplikasi membaca database: {health.supabaseHost}. Jika count `penugasan` atau `v_progress_sls` masih 0, import Excel belum tersimpan di Supabase project ini.
              </p>
            </div>
            {health.latestImport ? (
              <div className="rounded-2xl bg-white/60 px-4 py-3 dark:bg-slate-950/40">
                <p className="text-xs font-bold uppercase text-orange-800 dark:text-orange-100">Import terakhir</p>
                <p className="mt-1 font-black">{health.latestImport.fileName}</p>
                <p className="mt-1 text-xs">Status {health.latestImport.status}, {numberId(health.latestImport.rowCount)} baris</p>
              </div>
            ) : null}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(health.counts).map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/65 p-3 dark:bg-slate-950/40">
                <p className="text-xs font-bold uppercase text-orange-800 dark:text-orange-100">{label}</p>
                <p className="mt-1 text-lg font-black">{numberId(value)}</p>
              </div>
            ))}
          </div>
          {Object.keys(health.laporanByStatus).length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(health.laporanByStatus).map(([status, item]) => (
                <span key={status} className="rounded-full bg-white/70 px-3 py-1 text-xs font-black dark:bg-slate-950/50">
                  {status}: {numberId(item.count)} laporan, selesai {numberId(item.selesai)}
                </span>
              ))}
            </div>
          ) : null}
          {health.errors.length ? <p className="mt-3 font-bold">Error: {health.errors.join(" | ")}</p> : null}
        </section>
      ) : null}
    </>
  );
}
