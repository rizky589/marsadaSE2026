"use client";

import { CheckCircle2, Eye, History, RotateCcw, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { assignments, dailyReports } from "@/lib/mock-data";
import type { DailyReport } from "@/lib/types";
import {
  assignmentProgress,
  cumulativeBefore,
  dailyNeed,
  productivity,
  progressCategory,
  progressCategoryLabel
} from "@/lib/progress-calculations";
import { formatDate, numberId, pct } from "@/lib/utils";

export function PmlReportQueue() {
  const [selected, setSelected] = useState<DailyReport | null>(dailyReports.find((report) => report.status === "dikirim") ?? null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const queue = dailyReports.filter((report) => report.status === "dikirim" || report.status === "dikembalikan");

  function getNote(id: string) {
    return notes[id] ?? queue.find((report) => report.id === id)?.pmlNote ?? "";
  }

  function setNote(id: string, value: string) {
    setNotes((current) => ({ ...current, [id]: value }));
  }

  function approve(report: DailyReport) {
    toast.success(`Laporan ${report.pclName} disetujui`, {
      description: "Laporan dikunci, progres resmi diperbarui, PCL menerima notifikasi, dan dashboard semua tingkatan diperbarui."
    });
  }

  function returnReport(report: DailyReport) {
    if (!getNote(report.id).trim()) {
      toast.error("Catatan wajib diisi saat mengembalikan laporan");
      return;
    }
    toast.warning(`Laporan ${report.pclName} dikembalikan`, {
      description: "PCL menerima notifikasi dan laporan dapat diperbaiki."
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
      <div className="space-y-4">
        {queue.map((report) => {
          const before = cumulativeBefore(report, dailyReports);
          const after = before + report.completedToday;
          const remaining = Math.max(0, report.target - after);
          const assignment = assignments.find((item) => item.id === report.assignmentId);
          const official = assignment ? assignmentProgress(assignment, dailyReports) : null;
          const category = progressCategory(official?.percent ?? 0, Boolean(official?.completed));

          return (
            <article key={report.id} className="glass cursor-pointer rounded-3xl p-4 transition-all hover:-translate-y-0.5 hover:border-[#ff7a1a]/50">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ff7a1a]">{formatDate(report.reportDate)}</p>
                  <h3 className="mt-1 text-lg font-black">{report.pclName}</h3>
                  <p className="text-sm text-slate-500">{report.village} / SLS {report.sls}</p>
                </div>
                <Badge>{report.status}</Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Target SLS" value={numberId(report.target)} />
                <Metric label="Hasil hari ini" value={numberId(report.completedToday)} />
                <Metric label="Kumulatif sebelumnya" value={numberId(before)} />
                <Metric label="Kumulatif setelah laporan" value={numberId(after)} />
                <Metric label="Sisa target" value={numberId(remaining)} />
                <Metric label="Rata-rata harian" value={numberId(Math.round(productivity(after)))} />
                <Metric label="Kebutuhan per hari" value={numberId(Math.ceil(dailyNeed(remaining)))} />
                <Metric label="Status otomatis" value={progressCategoryLabel(category)} />
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Progres SLS setelah laporan</span>
                  <span>{pct(after, report.target)}%</span>
                </div>
                <Progress value={pct(after, report.target)} />
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-white/5">
                <p className="font-bold">Kendala</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{report.issue || "Tidak ada kendala dilaporkan."}</p>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <Button variant="secondary" onClick={() => setSelected(report)}>
                  <Eye className="h-4 w-4" /> Buka Detail
                </Button>
                <Button variant="secondary" onClick={() => returnReport(report)}>
                  <RotateCcw className="h-4 w-4" /> Kembalikan
                </Button>
                <Button onClick={() => approve(report)}>
                  <CheckCircle2 className="h-4 w-4" /> Setujui
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        {selected ? <ReportDetail report={selected} note={getNote(selected.id)} setNote={(value) => setNote(selected.id, value)} onApprove={() => approve(selected)} onReturn={() => returnReport(selected)} /> : null}
      </aside>
    </div>
  );
}

function ReportDetail({ report, note, setNote, onApprove, onReturn }: { report: DailyReport; note: string; setNote: (value: string) => void; onApprove: () => void; onReturn: () => void }) {
  const history = useMemo(
    () => dailyReports.filter((item) => item.assignmentId === report.assignmentId && item.id !== report.id).sort((a, b) => a.reportDate.localeCompare(b.reportDate)),
    [report]
  );
  const approvedBefore = cumulativeBefore(report, dailyReports);
  const after = approvedBefore + report.completedToday;

  return (
    <section className="glass rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Detail Laporan</h2>
          <p className="text-sm text-slate-500">{report.pclName} - {formatDate(report.reportDate)}</p>
        </div>
        <Badge>{report.status}</Badge>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <Metric label="Desa" value={report.village} />
        <Metric label="SLS/Sub-SLS" value={`${report.sls} / ${report.subSlsId}`} />
        <Metric label="Target aktual" value={numberId(report.target)} />
        <Metric label="Kumulatif setelah" value={numberId(after)} />
        <Metric label="Jam mulai" value={report.startTime} />
        <Metric label="Jam selesai" value={report.endTime} />
        <Metric label="Dikunjungi" value={numberId(report.visited)} />
        <Metric label="Selesai hari ini" value={numberId(report.completedToday)} />
        <Metric label="Pending" value={numberId(report.pending)} />
        <Metric label="Kunjungan ulang" value={numberId(report.revisit)} />
        <Metric label="Belum bertemu" value={numberId(report.notMet)} />
        <Metric label="Menolak" value={numberId(report.refused)} />
      </div>

      <div className="mt-4 space-y-3 rounded-3xl border border-[var(--border)] bg-white/55 p-4 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[#ff7a1a]" />
          <h3 className="font-black">Target dan Histori SLS</h3>
        </div>
        {history.length ? (
          history.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-white/5">
              <div>
                <p className="font-bold">{formatDate(item.reportDate)}</p>
                <p className="text-slate-500">{item.completedToday} selesai - {item.status}</p>
              </div>
              <Badge>{item.status}</Badge>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Belum ada laporan sebelumnya untuk SLS ini.</p>
        )}
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-bold">Catatan PML</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="min-h-28 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-orange-200 dark:bg-white/10"
          placeholder="Wajib diisi jika laporan dikembalikan"
        />
      </label>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" onClick={onReturn}>
          <RotateCcw className="h-4 w-4" /> Kembalikan
        </Button>
        <Button onClick={onApprove}>
          <Send className="h-4 w-4" /> Setujui
        </Button>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/70 p-3 dark:bg-white/5">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words font-black">{value}</p>
    </div>
  );
}
