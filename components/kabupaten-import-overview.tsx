"use client";

import { AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, MapPinned, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getImportedAllocationSnapshotAction } from "@/app/actions";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { loadImportedAllocations, summarizeImportedAllocations, type ImportedAllocationRow } from "@/lib/imported-allocations";
import { numberId, pct } from "@/lib/utils";

const dailyReportsStorageKey = "marsada-daily-reports";

type StoredDailyReport = {
  subSlsId: string;
  reportDate: string;
  pcl: string;
  completedToday: number;
  status: "draft" | "dikirim" | "dikembalikan" | "disetujui";
};

export function KabupatenImportOverview() {
  const [rows, setRows] = useState<ImportedAllocationRow[]>([]);
  const [reports, setReports] = useState<StoredDailyReport[]>([]);

  useEffect(() => {
    let active = true;
    async function loadRows() {
      try {
        const snapshot = await getImportedAllocationSnapshotAction();
        if (active && snapshot.rows.length) {
          setRows(snapshot.rows);
          return;
        }
      } catch {
        // Local import preview remains available before Supabase is configured.
      }
      if (active) setRows(loadImportedAllocations());
    }

    loadRows();
    const savedReports = window.localStorage.getItem(dailyReportsStorageKey);
    if (savedReports) {
      try {
        setReports(JSON.parse(savedReports) as StoredDailyReport[]);
      } catch {
        window.localStorage.removeItem(dailyReportsStorageKey);
      }
    }
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => summarizeImportedAllocations(rows), [rows]);
  const approvedReports = useMemo(() => reports.filter((report) => report.status === "disetujui"), [reports]);
  const completed = useMemo(() => approvedReports.reduce((sum, report) => sum + report.completedToday, 0), [approvedReports]);
  const remaining = Math.max(0, summary.target - completed);
  const progressValue = pct(completed, summary.target);
  const today = new Date().toISOString().slice(0, 10);
  const activeToday = new Set(reports.filter((report) => report.reportDate === today).map((report) => report.pcl)).size;
  const pendingReports = reports.filter((report) => report.status === "dikirim").length;
  const stats = [
    { label: "Jumlah Kecamatan", value: numberId(summary.kecamatan), icon: MapPinned, tone: "text-blue-600" },
    { label: "Jumlah Desa", value: numberId(summary.desa), icon: MapPinned, tone: "text-emerald-600" },
    { label: "SLS/Sub-SLS", value: numberId(summary.sls), icon: ClipboardCheck, tone: "text-orange-600" },
    { label: "Jumlah PML", value: numberId(summary.pml), icon: Users, tone: "text-blue-600" },
    { label: "Jumlah PCL", value: numberId(summary.pcl), icon: Users, tone: "text-emerald-600" },
    { label: "Total Target", value: numberId(summary.target), icon: BarChart3, tone: "text-orange-600" },
    { label: "Total Selesai", value: numberId(completed), icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Total Sisa", value: numberId(remaining), icon: ClipboardCheck, tone: "text-slate-600" },
    { label: "Progres Kabupaten", value: `${progressValue}%`, icon: BarChart3, tone: "text-blue-600" },
    { label: "PCL Aktif Hari Ini", value: numberId(activeToday), icon: Users, tone: "text-emerald-600" },
    { label: "PCL Belum Melapor", value: numberId(Math.max(0, summary.pcl - activeToday)), icon: AlertTriangle, tone: "text-orange-600" },
    { label: "Belum Diperiksa", value: numberId(pendingReports), icon: ClipboardCheck, tone: "text-blue-600" },
    { label: "Kendala Aktif", value: "0", icon: AlertTriangle, tone: "text-orange-600" },
    { label: "Kendala Kritis", value: "0", icon: AlertTriangle, tone: "text-red-600" }
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] bg-[#0b2a4a] p-5 text-white shadow-2xl shadow-blue-950/20 sm:p-7">
        <h2 className="mt-2 max-w-4xl text-3xl font-black sm:text-4xl">Monitoring SE2026 BPS Kab.Labuhanbatu Utara</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100 sm:text-base">
          {rows.length ? `${numberId(rows.length)} alokasi aktif dari Excel tersimpan. Progres resmi menunggu laporan PCL disetujui PML.` : "Upload dan simpan alokasi Excel terlebih dahulu agar dashboard memakai data nyata."}
        </p>
        <div className="mt-6 max-w-3xl space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Progres Kabupaten</span>
            <span>{progressValue}%</span>
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
    </>
  );
}
