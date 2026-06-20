"use client";

import { useEffect, useState } from "react";
import { getDailyReportSnapshotAction, getMyPclAssignmentsAction, saveImportedDailyReportAction } from "@/app/actions";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { numberId } from "@/lib/utils";

type StoredDailyReport = {
  id: string;
  reportDate: string;
  assignmentId: string;
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

const editReportStorageKey = "marsada-edit-report";

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ReportHistoryPanel() {
  const [hasImportAssignments, setHasImportAssignments] = useState(false);
  const [reports, setReports] = useState<StoredDailyReport[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const assignments = await getMyPclAssignmentsAction();
        setHasImportAssignments(assignments.length > 0);
        const serverReports = await getDailyReportSnapshotAction();
        const assignmentIds = new Set(assignments.map((assignment) => assignment.subSlsId));
        setReports((serverReports as StoredDailyReport[]).filter((report) => assignmentIds.has(report.subSlsId)));
      } catch {
        setHasImportAssignments(false);
        setReports([]);
      }
    }
    load();
  }, []);

  async function updateReportStatus(reportId: string, status: "dikirim") {
    const report = reports.find((item) => item.id === reportId);
    if (!report) return;
    try {
      await saveImportedDailyReportAction({
        report_date: report.reportDate,
        assignment_id: report.assignmentId,
        start_time: report.startTime,
        end_time: report.endTime,
        visited: report.visited,
        completed_today: report.completedToday,
        pending: report.pending,
        revisit: 0,
        not_met: 0,
        refused: 0,
        temporarily_closed: 0,
        permanently_closed: 0,
        moved: 0,
        not_found: 0,
        duplicate: 0,
        new_business: 0,
        status
      });
      setReports((current) => current.map((item) => item.id === reportId ? { ...item, status, updatedAt: new Date().toISOString() } : item));
    } catch {
      // The form will surface detailed save errors when the report is edited.
    }
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
