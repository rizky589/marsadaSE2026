"use client";

import { Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadImportedAllocations, normalizeName, resolvePclName, titleCase, type ImportedAllocationRow } from "@/lib/imported-allocations";
import { numberId } from "@/lib/utils";

const dailyReportsStorageKey = "marsada-daily-reports";

type StoredDailyReport = {
  id: string;
  reportDate: string;
  assignmentId: string;
  district: string;
  village: string;
  sls: string;
  subSlsId: string;
  target: number;
  pml: string;
  pcl: string;
  visited: number;
  completedToday: number;
  pending: number;
  startTime: string;
  endTime: string;
  note?: string;
  issue?: string;
  status: "draft" | "dikirim" | "dikembalikan" | "disetujui";
  updatedAt: string;
};

export function PmlReportQueue() {
  const [rows, setRows] = useState<ImportedAllocationRow[]>([]);
  const [reports, setReports] = useState<StoredDailyReport[]>([]);

  useEffect(() => {
    setRows(loadImportedAllocations());
    loadReports();
  }, []);

  const summary = useMemo(() => {
    const pml = new Set<string>();
    const pcl = new Set<string>();
    rows.forEach((row) => {
      pml.add(normalizeName(row.pml));
      pcl.add(`${normalizeName(row.pml)}|${resolvePclName(row.pcl, row.pml)}`);
    });
    return { pml: pml.size, pcl: pcl.size, sls: rows.length, target: rows.reduce((sum, row) => sum + row.targetAwal, 0) };
  }, [rows]);

  const sampleRows = rows.slice(0, 8);
  const queuedReports = reports.filter((report) => report.status === "dikirim");

  function loadReports() {
    const saved = window.localStorage.getItem(dailyReportsStorageKey);
    if (!saved) {
      setReports([]);
      return;
    }
    try {
      setReports(JSON.parse(saved) as StoredDailyReport[]);
    } catch {
      window.localStorage.removeItem(dailyReportsStorageKey);
      setReports([]);
    }
  }

  function updateReportStatus(reportId: string, status: "dikembalikan" | "disetujui") {
    const nextReports = reports.map((report) => report.id === reportId ? { ...report, status, updatedAt: new Date().toISOString() } : report);
    setReports(nextReports);
    window.localStorage.setItem(dailyReportsStorageKey, JSON.stringify(nextReports));
    toast.success(status === "disetujui" ? "Laporan disetujui" : "Laporan dikembalikan");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Masuk</CardTitle>
        <CardDescription>Laporan PCL berstatus dikirim akan muncul di sini untuk diperiksa PML.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="PML dari alokasi" value={numberId(summary.pml)} />
          <Metric label="PCL dari alokasi" value={numberId(summary.pcl)} />
          <Metric label="SLS/Sub-SLS" value={numberId(summary.sls)} />
          <Metric label="Target" value={numberId(summary.target)} />
        </div>

        {queuedReports.length ? (
          <div className="overflow-x-auto rounded-3xl border border-[var(--border)] bg-white/60 dark:bg-slate-950/30">
            <table className="w-full min-w-[980px] text-left text-sm text-slate-800 dark:text-slate-100">
              <thead className="bg-slate-100/90 text-xs uppercase text-slate-600 dark:bg-slate-900/80 dark:text-slate-200">
                <tr>{["Tanggal", "PCL", "Desa", "SLS/Sub-SLS", "Target", "Selesai", "Pending", "Status", "Aksi"].map((head) => <th key={head} className="px-4 py-3 font-black">{head}</th>)}</tr>
              </thead>
              <tbody>
                {queuedReports.map((report) => (
                  <tr key={report.id} className="border-t border-[var(--border)] transition hover:bg-orange-50/70 dark:hover:bg-white/5">
                    <td className="px-4 py-3">{report.reportDate}</td>
                    <td className="px-4 py-3 font-bold">{titleCase(report.pcl)}</td>
                    <td className="px-4 py-3">{titleCase(report.village)}</td>
                    <td className="px-4 py-3">{titleCase(report.sls)}<br /><span className="font-mono text-xs text-slate-500 dark:text-slate-300">{report.subSlsId}</span></td>
                    <td className="px-4 py-3">{numberId(report.target)}</td>
                    <td className="px-4 py-3 font-black">{numberId(report.completedToday)}</td>
                    <td className="px-4 py-3">{numberId(report.pending)}</td>
                    <td className="px-4 py-3"><Badge>dikirim</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => updateReportStatus(report.id, "disetujui")}>Setujui</Button>
                        <Button size="sm" variant="secondary" onClick={() => updateReportStatus(report.id, "dikembalikan")}>Kembalikan</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white/55 p-6 text-center dark:bg-white/5">
            <Inbox className="mx-auto h-10 w-10 text-[#ff7a1a]" />
            <h3 className="mt-3 font-black">Belum Ada Laporan Menunggu Pemeriksaan</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
              Setelah PCL klik Kirim ke PML di menu Progres, laporan akan muncul di antrean ini.
            </p>
          </div>
        )}

        {!queuedReports.length && sampleRows.length ? (
          <div className="overflow-x-auto rounded-3xl border border-[var(--border)]">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-100/80 text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-300">
                <tr>{["PML", "PCL", "Desa", "SLS/Sub-SLS", "Target", "Status Laporan"].map((head) => <th key={head} className="px-4 py-3 font-black">{head}</th>)}</tr>
              </thead>
              <tbody>
                {sampleRows.map((row) => (
                  <tr key={row.idSubSls} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">{titleCase(row.pml)}</td>
                    <td className="px-4 py-3 font-bold">{titleCase(resolvePclName(row.pcl, row.pml))}</td>
                    <td className="px-4 py-3">{titleCase(row.desa)}</td>
                    <td className="px-4 py-3">{titleCase(row.namaSls)} / {row.kodeSubSls}</td>
                    <td className="px-4 py-3">{numberId(row.targetAwal)}</td>
                    <td className="px-4 py-3">Belum dikirim</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
