"use client";

import { useEffect, useState } from "react";
import { getProgressSlsSnapshotAction } from "@/app/actions";
import { EvaluationExport } from "@/components/evaluation-export";
import type { DashboardProgressRow } from "@/lib/dashboard-progress";

export function EvaluationExportPanel() {
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

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-orange-200 bg-orange-50/80 p-4 text-sm font-bold text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-100">
        Belum ada alokasi tersimpan. Upload dan simpan Excel terlebih dahulu sebelum mengunduh bahan evaluasi.
      </div>
    );
  }

  return <EvaluationExport rows={rows} />;
}
