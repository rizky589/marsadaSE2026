"use client";

import { useEffect, useMemo, useState } from "react";
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

type ProfileRecord = {
  role?: string | null;
  nama_lengkap?: string | null;
};

const storageKey = "marsada-imported-allocations";
const dailyReportsStorageKey = "marsada-daily-reports";

type StoredDailyReport = {
  subSlsId: string;
  reportDate: string;
  pml: string;
  pcl: string;
  completedToday: number;
  status: "draft" | "dikirim" | "dikembalikan" | "disetujui";
};

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function nameFromEmail(email: string) {
  return normalize(email.split("@")[0].replace(/[._-]+/g, " "));
}

function resolvePclName(name: string, pml: string) {
  if (name === "SUGIANTO" && pml === "ISMAIL MUNTHE") return "SUGIANTO - TIM ISMAIL MUNTHE";
  if (name === "SUGIANTO" && pml === "RAHMAT PAUJI HASIBUAN") return "SUGIANTO - TIM RAHMAT PAUJI HASIBUAN";
  return name;
}

export function PmlImportDashboard() {
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [reports, setReports] = useState<StoredDailyReport[]>([]);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (user) {
          const { data } = await supabase.from("profiles").select("role, nama_lengkap").eq("id", user.id).maybeSingle();
          setProfile((data as ProfileRecord | null) ?? { role: user.user_metadata?.role as string | undefined, nama_lengkap: user.email ? nameFromEmail(user.email) : null });
        }
      } catch {
        setProfile(null);
      }

      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as StoredImport;
          setRows((parsed.rows ?? []).filter((row) => row.idSubSls && row.targetAwal > 0));
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }

      const savedReports = window.localStorage.getItem(dailyReportsStorageKey);
      if (savedReports) {
        try {
          setReports(JSON.parse(savedReports) as StoredDailyReport[]);
        } catch {
          window.localStorage.removeItem(dailyReportsStorageKey);
        }
      }
    }
    load();
  }, []);

  const visibleRows = useMemo(() => {
    if (profile?.role !== "pml") return rows;
    const pmlName = normalize(profile.nama_lengkap ?? "");
    return rows.filter((row) => normalize(row.pml) === pmlName);
  }, [profile, rows]);

  const approvedReports = useMemo(() => reports.filter((report) => report.status === "disetujui"), [reports]);
  const completedBySubSls = useMemo(() => {
    const map = new Map<string, number>();
    approvedReports.forEach((report) => {
      map.set(report.subSlsId, (map.get(report.subSlsId) ?? 0) + report.completedToday);
    });
    return map;
  }, [approvedReports]);
  const pendingReports = useMemo(() => reports.filter((report) => report.status === "dikirim").length, [reports]);
  const today = new Date().toISOString().slice(0, 10);
  const activeToday = useMemo(() => new Set(reports.filter((report) => report.reportDate === today).map((report) => normalize(report.pcl))).size, [reports, today]);

  const pmlRows = useMemo(() => {
    const map = new Map<string, { name: string; pcls: Set<string>; sls: number; target: number; completed: number; villages: Set<string> }>();
    visibleRows.forEach((row) => {
      const key = normalize(row.pml);
      const current = map.get(key) ?? { name: row.pml, pcls: new Set<string>(), sls: 0, target: 0, completed: 0, villages: new Set<string>() };
      current.pcls.add(resolvePclName(normalize(row.pcl), normalize(row.pml)));
      current.villages.add(`${normalize(row.kecamatan)}|${normalize(row.desa)}`);
      current.sls += 1;
      current.target += row.targetAwal;
      current.completed += completedBySubSls.get(row.idSubSls) ?? 0;
      map.set(key, current);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));
  }, [completedBySubSls, visibleRows]);

  const pclRows = useMemo(() => {
    const map = new Map<string, { pml: string; name: string; sls: number; target: number; completed: number; villages: Set<string> }>();
    visibleRows.forEach((row) => {
      const resolvedPcl = resolvePclName(normalize(row.pcl), normalize(row.pml));
      const key = `${normalize(row.pml)}|${resolvedPcl}`;
      const current = map.get(key) ?? { pml: row.pml, name: resolvedPcl, sls: 0, target: 0, completed: 0, villages: new Set<string>() };
      current.sls += 1;
      current.target += row.targetAwal;
      current.completed += completedBySubSls.get(row.idSubSls) ?? 0;
      current.villages.add(`${normalize(row.kecamatan)}|${normalize(row.desa)}`);
      map.set(key, current);
    });
    return [...map.values()].sort((a, b) => a.pml.localeCompare(b.pml, "id") || a.name.localeCompare(b.name, "id"));
  }, [completedBySubSls, visibleRows]);

  const totalTarget = pmlRows.reduce((sum, row) => sum + row.target, 0);
  const totalCompleted = pmlRows.reduce((sum, row) => sum + row.completed, 0);
  const totalRemaining = Math.max(0, totalTarget - totalCompleted);
  const teamProgress = pct(totalCompleted, totalTarget);
  const totalPcl = new Set(pclRows.map((row) => `${normalize(row.pml)}|${normalize(row.name)}`)).size;
  const totalSls = visibleRows.length;

  if (!rows.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data PML Belum Tersedia</CardTitle>
          <CardDescription>Upload dan simpan alokasi Excel terlebih dahulu agar menu PML menampilkan data nyata, bukan data contoh.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-[#0b2a4a] p-5 text-white shadow-2xl shadow-blue-950/20 sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">Dashboard PML</p>
        <h2 className="mt-2 text-2xl font-black sm:text-3xl">{profile?.role === "pml" ? titleCase(profile.nama_lengkap ?? "PML") : "Monitoring Seluruh PML"}</h2>
        <p className="mt-1 text-sm text-blue-100">Data PML, PCL bawahan, SLS/Sub-SLS, dan target berasal dari alokasi Excel tersimpan.</p>
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Progres Tim</span>
            <span>{teamProgress}%</span>
          </div>
          <Progress value={teamProgress} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Jumlah PML", numberId(pmlRows.length)],
          ["Jumlah PCL Bawahan", numberId(totalPcl)],
          ["Jumlah SLS", numberId(totalSls)],
          ["Target Tim", numberId(totalTarget)],
          ["Selesai", numberId(totalCompleted)],
          ["Sisa", numberId(totalRemaining)],
          ["Progres Tim", `${teamProgress}%`],
          ["PCL Aktif Hari Ini", numberId(activeToday)],
          ["Menunggu Pemeriksaan", numberId(pendingReports)],
          ["Kendala Aktif", "0"]
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
          <CardTitle>Daftar PML</CardTitle>
          <CardDescription>Ringkasan target dan jumlah PCL bawahan dari alokasi import.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-3xl border border-[var(--border)]">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-100/80 text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-300">
                <tr>{["PML", "PCL Bawahan", "Desa", "SLS/Sub-SLS", "Target", "Selesai", "Progres", "Status"].map((head) => <th key={head} className="px-4 py-3 font-black">{head}</th>)}</tr>
              </thead>
              <tbody>
                {pmlRows.map((row) => (
                  <tr key={row.name} className="border-t border-[var(--border)] transition hover:bg-orange-50/70 dark:hover:bg-white/5">
                    <td className="px-4 py-4 font-black">{titleCase(row.name)}</td>
                    <td className="px-4 py-4">{numberId(row.pcls.size)}</td>
                    <td className="px-4 py-4">{numberId(row.villages.size)}</td>
                    <td className="px-4 py-4">{numberId(row.sls)}</td>
                    <td className="px-4 py-4">{numberId(row.target)}</td>
                    <td className="px-4 py-4">{numberId(row.completed)}</td>
                    <td className="px-4 py-4">
                      <div className="min-w-32 space-y-2">
                        <div className="text-xs font-bold">{pct(row.completed, row.target)}%</div>
                        <Progress value={pct(row.completed, row.target)} />
                      </div>
                    </td>
                    <td className="px-4 py-4"><Badge>{row.completed > 0 ? "disetujui" : "Belum ada laporan"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabel PCL Bawahan</CardTitle>
          <CardDescription>PCL bawahan dikelompokkan berdasarkan PML hasil import.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-3xl border border-[var(--border)]">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-100/80 text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-300">
                <tr>{["PML", "Nama PCL", "Desa", "Jumlah SLS", "Target", "Selesai", "Sisa", "Progres", "Kebutuhan/Hari", "Status"].map((head) => <th key={head} className="px-4 py-3 font-black">{head}</th>)}</tr>
              </thead>
              <tbody>
                {pclRows.map((row) => (
                  <tr key={`${row.pml}-${row.name}`} className="border-t border-[var(--border)] transition hover:bg-orange-50/70 dark:hover:bg-white/5">
                    <td className="px-4 py-4">{titleCase(row.pml)}</td>
                    <td className="px-4 py-4 font-black">{titleCase(row.name)}</td>
                    <td className="px-4 py-4">{numberId(row.villages.size)}</td>
                    <td className="px-4 py-4">{numberId(row.sls)}</td>
                    <td className="px-4 py-4">{numberId(row.target)}</td>
                    <td className="px-4 py-4">{numberId(row.completed)}</td>
                    <td className="px-4 py-4">{numberId(Math.max(0, row.target - row.completed))}</td>
                    <td className="px-4 py-4">
                      <div className="min-w-32 space-y-2">
                        <div className="text-xs font-bold">{pct(row.completed, row.target)}%</div>
                        <Progress value={pct(row.completed, row.target)} />
                      </div>
                    </td>
                    <td className="px-4 py-4">{numberId(Math.ceil(Math.max(0, row.target - row.completed) / 57))}</td>
                    <td className="px-4 py-4"><Badge>{row.completed > 0 ? "disetujui" : "Belum ada laporan"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
