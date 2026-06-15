"use client";

import { useEffect, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

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
