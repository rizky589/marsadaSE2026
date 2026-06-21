"use client";

import { useEffect, useMemo, useState } from "react";
import { getProgressSlsSnapshotAction } from "@/app/actions";
import { EvaluationExport } from "@/components/evaluation-export";
import { summarizeProgressRows, type DashboardProgressRow } from "@/lib/dashboard-progress";
import { numberId, pct, percentId } from "@/lib/utils";

export function RekapImportSummary() {
  const [rows, setRows] = useState<DashboardProgressRow[]>([]);

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
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => summarizeProgressRows(rows), [rows]);

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-orange-200 bg-orange-50/80 p-4 text-sm font-bold text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-100">
        Belum ada alokasi tersimpan. Upload dan simpan Excel terlebih dahulu agar rekap memakai data nyata.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EvaluationExport rows={rows} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Target Kabupaten" value={numberId(summary.target)} />
        <Metric label="Selesai" value={numberId(summary.selesai)} />
        <Metric label="Sisa" value={numberId(summary.sisa)} />
        <Metric label="Progres" value={percentId(pct(summary.selesai, summary.target))} />
        <Metric label="Kecamatan" value={numberId(summary.kecamatan)} />
        <Metric label="Desa" value={numberId(summary.desa)} />
        <Metric label="PML" value={numberId(summary.pml)} />
        <Metric label="PCL" value={numberId(summary.pcl)} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl border border-[var(--border)] bg-white/55 p-4 dark:bg-white/5"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
}
