"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyPclAssignmentsAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { numberId, pct } from "@/lib/utils";

type ImportedRow = {
  kecamatan: string;
  desa: string;
  namaSls: string;
  kodeSubSls: string;
  idSubSls: string;
  targetAwal: number;
  pml: string;
  pcl: string;
};

type StoredImport = {
  rows?: ImportedRow[];
};

const importedAllocationsStorageKey = "marsada-imported-allocations";
const dailyReportsStorageKey = "marsada-daily-reports";

type StoredDailyReport = {
  assignmentId: string;
  subSlsId: string;
  reportDate: string;
  completedToday: number;
  status: "draft" | "dikirim" | "dikembalikan" | "disetujui";
};

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function nameFromEmail(email: string) {
  return normalize(email.split("@")[0].replace(/[._-]+/g, " "));
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PclImportDashboard() {
  const [pclName, setPclName] = useState("PCL");
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [reports, setReports] = useState<StoredDailyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let name = "";
      let ownedRows: ImportedRow[] = [];
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user?.email) name = nameFromEmail(data.user.email);
      } catch {
        name = "";
      }

      const saved = window.localStorage.getItem(importedAllocationsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredImport;
        const activeRows = (parsed.rows ?? []).filter((row) => row.idSubSls && row.targetAwal > 0);
        ownedRows = name ? activeRows.filter((row) => normalize(row.pcl) === name) : [];
      }

      try {
        const serverRows = await getMyPclAssignmentsAction();
        if (serverRows.length >= ownedRows.length) {
          ownedRows = serverRows.map((row) => ({
            kecamatan: row.district,
            desa: row.village,
            namaSls: row.sls,
            kodeSubSls: "",
            idSubSls: row.subSlsId,
            targetAwal: row.load,
            pml: row.pml,
            pcl: row.pcl
          }));
        }
      } catch {
        // Local import preview remains available before Supabase is configured.
      }

      setPclName(titleCase(ownedRows[0]?.pcl || name || "PCL"));
      setRows(ownedRows);
      const savedReports = window.localStorage.getItem(dailyReportsStorageKey);
      if (savedReports) {
        try {
          setReports(JSON.parse(savedReports) as StoredDailyReport[]);
        } catch {
          window.localStorage.removeItem(dailyReportsStorageKey);
        }
      }
      setIsLoading(false);
    }
    load();
  }, []);

  const target = useMemo(() => rows.reduce((sum, row) => sum + row.targetAwal, 0), [rows]);
  const approvedReports = useMemo(() => reports.filter((report) => report.status === "disetujui"), [reports]);
  const completedBySubSls = useMemo(() => {
    const map = new Map<string, number>();
    approvedReports.forEach((report) => {
      map.set(report.subSlsId, (map.get(report.subSlsId) ?? 0) + report.completedToday);
    });
    return map;
  }, [approvedReports]);
  const completed = useMemo(() => rows.reduce((sum, row) => sum + (completedBySubSls.get(row.idSubSls) ?? 0), 0), [completedBySubSls, rows]);
  const today = new Date().toISOString().slice(0, 10);
  const todayDone = useMemo(() => approvedReports.filter((report) => report.reportDate === today).reduce((sum, report) => sum + report.completedToday, 0), [approvedReports, today]);
  const remaining = Math.max(0, target - completed);
  const progressValue = pct(completed, target);

  if (!rows.length) {
    return (
      <div className="space-y-5">
        <section className="rounded-[2rem] bg-[#0b2a4a] p-5 text-white shadow-2xl shadow-blue-950/20">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">Dashboard PCL</p>
          <h2 className="mt-2 text-2xl font-black">{pclName}</h2>
          <p className="mt-1 text-sm text-blue-100">{isLoading ? "Memuat wilayah tugas..." : "Belum ada wilayah tugas yang cocok dengan akun login ini."}</p>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Wilayah Tugas Belum Terhubung</CardTitle>
            <CardDescription>Pastikan akun login memakai nama petugas hasil import, misalnya annisatul.padlah untuk PCL ANNISATUL PADLAH.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-[#0b2a4a] p-5 text-white shadow-2xl shadow-blue-950/20">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">Dashboard PCL</p>
        <h2 className="mt-2 text-2xl font-black">{pclName}</h2>
        <p className="mt-1 text-sm text-blue-100">Wilayah tugas dari alokasi import. Progres resmi akan bertambah setelah laporan disetujui PML.</p>
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Progres Saya</span>
            <span>{progressValue}%</span>
          </div>
          <Progress value={progressValue} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {[
          ["Target Saya", numberId(target)],
          ["SLS/Sub-SLS", numberId(rows.length)],
          ["Selesai", numberId(completed)],
          ["Sisa", numberId(remaining)],
          ["Progres", `${progressValue}%`],
          ["Hasil Hari Ini", numberId(todayDone)],
          ["Kebutuhan per Hari", numberId(Math.ceil(remaining / 57))],
          ["Status Progres", completed > 0 ? "Berjalan" : "Belum ada laporan"]
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="p-4">
              <CardDescription className="text-xs">{label}</CardDescription>
              <CardTitle className="mt-1 text-xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Wilayah Tugas Saya</CardTitle>
          <CardDescription>PCL hanya melihat SLS/Sub-SLS yang menjadi tugasnya.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row) => (
            <article key={row.idSubSls} className="rounded-3xl border border-[var(--border)] bg-white/55 p-4 dark:bg-white/5">
              {(() => {
                const rowCompleted = completedBySubSls.get(row.idSubSls) ?? 0;
                const rowRemaining = Math.max(0, row.targetAwal - rowCompleted);
                const rowProgress = pct(rowCompleted, row.targetAwal);
                return (
                  <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{titleCase(row.desa)}</p>
                  <p className="text-sm text-slate-500">SLS {titleCase(row.namaSls)} / {row.kodeSubSls} - {row.idSubSls}</p>
                </div>
                <Badge>{rowCompleted > 0 ? "disetujui" : "draft"}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Metric label="Kecamatan" value={titleCase(row.kecamatan)} />
                <Metric label="PML" value={titleCase(row.pml)} />
                <Metric label="Target" value={numberId(row.targetAwal)} />
                <Metric label="Selesai" value={numberId(rowCompleted)} />
                <Metric label="Sisa" value={numberId(rowRemaining)} />
                <Metric label="Progres" value={`${rowProgress}%`} />
              </div>
                  </>
                );
              })()}
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
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
