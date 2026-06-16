"use client";

import { useEffect, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { numberId } from "@/lib/utils";

type ImportedRow = { pcl: string; idSubSls: string; targetAwal: number };
type StoredDailyReport = {
  id: string;
  reportDate: string;
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
  status: "draft" | "dikirim" | "dikembalikan" | "disetujui";
  updatedAt: string;
};

const importedAllocationsStorageKey = "marsada-imported-allocations";
const dailyReportsStorageKey = "marsada-daily-reports";
const editReportStorageKey = "marsada-edit-report";

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function nameFromEmail(email: string) {
  return normalize(email.split("@")[0].replace(/[._-]+/g, " "));
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ReportHistoryPanel() {
  const [hasImportAssignments, setHasImportAssignments] = useState(false);
  const [reports, setReports] = useState<StoredDailyReport[]>([]);
  const [pclName, setPclName] = useState("");

  useEffect(() => {
    async function load() {
      let pclName = "";
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user?.email) pclName = nameFromEmail(data.user.email);
      } catch {
        pclName = "";
      }
      const saved = window.localStorage.getItem(importedAllocationsStorageKey);
      if (!saved || !pclName) return;
      setPclName(pclName);
      const parsed = JSON.parse(saved) as { rows?: ImportedRow[] };
      setHasImportAssignments(Boolean((parsed.rows ?? []).some((row) => row.idSubSls && row.targetAwal > 0 && normalize(row.pcl) === pclName)));

      const savedReports = window.localStorage.getItem(dailyReportsStorageKey);
      if (savedReports) {
        const parsedReports = JSON.parse(savedReports) as StoredDailyReport[];
        setReports(parsedReports.filter((report) => normalize(report.pcl) === pclName));
      }
    }
    load();
  }, []);

  function updateReportStatus(reportId: string, status: "dikirim") {
    const savedReports = window.localStorage.getItem(dailyReportsStorageKey);
    const allReports = savedReports ? JSON.parse(savedReports) as StoredDailyReport[] : [];
    const nextReports = allReports.map((report) => report.id === reportId ? { ...report, status, updatedAt: new Date().toISOString() } : report);
    window.localStorage.setItem(dailyReportsStorageKey, JSON.stringify(nextReports));
    setReports(nextReports.filter((report) => normalize(report.pcl) === pclName));
  }

  function editReport(report: StoredDailyReport) {
    window.localStorage.setItem(editReportStorageKey, JSON.stringify(report));
    window.location.reload();
  }

  if (reports.length) {
    return (
      <CardContent>
        <div className="space-y-3">
          {reports.map((report) => (
            <article key={report.id} className="rounded-3xl border border-[var(--border)] bg-white/65 p-4 text-slate-900 dark:bg-slate-900/60 dark:text-slate-50">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-300">{report.reportDate} - {titleCase(report.village)}</p>
                  <h3 className="mt-1 font-black">{titleCase(report.sls)}</h3>
                  <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-300">{report.subSlsId}</p>
                </div>
                <Badge>{report.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Metric label="Target" value={numberId(report.target)} />
                <Metric label="Dikunjungi" value={numberId(report.visited)} />
                <Metric label="Selesai" value={numberId(report.completedToday)} />
                <Metric label="Pending" value={numberId(report.pending)} />
                <Metric label="Mulai" value={report.startTime} />
                <Metric label="Selesai Jam" value={report.endTime} />
              </div>
              {report.status === "draft" || report.status === "dikembalikan" ? (
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={() => editReport(report)}>Edit</Button>
                  <Button size="sm" onClick={() => updateReportStatus(report.id, "dikirim")}>Kirim ke PML</Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <div className="rounded-3xl border border-blue-200 bg-blue-50/80 p-4 text-sm font-bold text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
        {hasImportAssignments
          ? "Belum ada laporan tersimpan untuk akun PCL ini. Setelah PCL mengirim laporan dan PML memeriksa, riwayat akan tampil di sini."
          : "Belum ada penugasan import yang cocok dengan akun ini, sehingga riwayat laporan belum tersedia."}
      </div>
    </CardContent>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
