"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { dailyReports } from "@/lib/mock-data";
import { formatDate, numberId, pct } from "@/lib/utils";

type ImportedRow = { pcl: string; idSubSls: string; targetAwal: number };

const importedAllocationsStorageKey = "marsada-imported-allocations";

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function nameFromEmail(email: string) {
  return normalize(email.split("@")[0].replace(/[._-]+/g, " "));
}

export function ReportHistoryPanel() {
  const [hasImportAssignments, setHasImportAssignments] = useState(false);

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
      const parsed = JSON.parse(saved) as { rows?: ImportedRow[] };
      setHasImportAssignments(Boolean((parsed.rows ?? []).some((row) => row.idSubSls && row.targetAwal > 0 && normalize(row.pcl) === pclName)));
    }
    load();
  }, []);

  if (hasImportAssignments) {
    return (
      <CardContent>
        <div className="rounded-3xl border border-blue-200 bg-blue-50/80 p-4 text-sm font-bold text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
          Belum ada laporan tersimpan untuk akun PCL ini. Setelah PCL mengirim laporan dan PML memeriksa, riwayat akan tampil di sini.
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="space-y-3">
      {dailyReports.map((item) => (
        <div key={item.id} className="rounded-3xl border border-[var(--border)] bg-white/55 p-4 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-black">{item.pclName}</p>
              <p className="text-sm text-slate-500">
                {formatDate(item.reportDate)} - {item.village} / SLS {item.sls}
              </p>
            </div>
            <Badge>{item.status}</Badge>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>{numberId(item.completedToday)} selesai hari ini</span>
              <span>{pct(item.completedToday, item.target)}% target SLS</span>
            </div>
            <Progress value={pct(item.completedToday, item.target)} />
          </div>

          <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            <span>Dikunjungi: <strong>{numberId(item.visited)}</strong></span>
            <span>Pending: <strong>{numberId(item.pending)}</strong></span>
            <span>Mulai: <strong>{item.startTime}</strong></span>
            <span>Selesai: <strong>{item.endTime}</strong></span>
          </div>

          {item.pmlNote ? <p className="mt-3 rounded-2xl bg-orange-50 p-3 text-sm text-orange-800 dark:bg-orange-500/10 dark:text-orange-200">Catatan PML: {item.pmlNote}</p> : null}
          {item.status === "disetujui" ? <p className="mt-3 text-xs font-bold uppercase text-emerald-600">Masuk progres resmi</p> : null}
        </div>
      ))}
    </CardContent>
  );
}
