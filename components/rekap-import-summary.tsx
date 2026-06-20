"use client";

import { useEffect, useMemo, useState } from "react";
import { getImportedAllocationSnapshotAction } from "@/app/actions";
import { EvaluationExport } from "@/components/evaluation-export";
import { loadImportedAllocations, summarizeImportedAllocations, type ImportedAllocationRow } from "@/lib/imported-allocations";
import { numberId } from "@/lib/utils";

export function RekapImportSummary() {
  const [rows, setRows] = useState<ImportedAllocationRow[]>([]);

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
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => summarizeImportedAllocations(rows), [rows]);

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
        <Metric label="Selesai" value="0" />
        <Metric label="Sisa" value={numberId(summary.target)} />
        <Metric label="Progres" value="0%" />
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
