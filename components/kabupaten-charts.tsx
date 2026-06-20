"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { getImportedAllocationSnapshotAction } from "@/app/actions";
import { SafeResponsiveContainer } from "@/components/safe-responsive-container";
import { loadImportedAllocations, normalizeName, resolvePclName, titleCase, type ImportedAllocationRow } from "@/lib/imported-allocations";
import { pct, percentId } from "@/lib/utils";

const colors = ["#2563eb", "#ff7a1a", "#10b981", "#ef4444", "#64748b", "#8b5cf6"];
const axisTick = { fill: "currentColor", fontSize: 12 };
const dailyReportsStorageKey = "marsada-daily-reports";
const percentTooltipFormatter = (value: unknown) => percentId(Number(value) || 0);

type StoredDailyReport = {
  subSlsId: string;
  reportDate: string;
  pcl: string;
  completedToday: number;
  status: "draft" | "dikirim" | "dikembalikan" | "disetujui";
};

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-4 text-slate-900 dark:bg-slate-900/60 dark:text-slate-50">
      <h3 className="mb-3 text-sm font-black text-slate-900 dark:text-slate-50">{title}</h3>
      {children}
    </div>
  );
}

function groupTargets(rows: ImportedAllocationRow[], completedBySubSls: Map<string, number>, keyFn: (row: ImportedAllocationRow) => string) {
  const map = new Map<string, { target: number; selesai: number }>();
  rows.forEach((row) => {
    const key = keyFn(row);
    const current = map.get(key) ?? { target: 0, selesai: 0 };
    current.target += row.targetAwal;
    current.selesai += completedBySubSls.get(row.idSubSls) ?? 0;
    map.set(key, current);
  });
  return [...map.entries()].map(([name, value]) => ({ name, target: value.target, selesai: value.selesai, progress: pct(value.selesai, value.target) }));
}

export function KabupatenCharts() {
  const [rows, setRows] = useState<ImportedAllocationRow[]>([]);
  const [reports, setReports] = useState<StoredDailyReport[]>([]);

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
    const savedReports = window.localStorage.getItem(dailyReportsStorageKey);
    if (savedReports) {
      try {
        setReports(JSON.parse(savedReports) as StoredDailyReport[]);
      } catch {
        window.localStorage.removeItem(dailyReportsStorageKey);
      }
    }
    return () => {
      active = false;
    };
  }, []);

  const data = useMemo(() => {
    const target = rows.reduce((sum, row) => sum + row.targetAwal, 0);
    const approvedReports = reports.filter((report) => report.status === "disetujui");
    const completed = approvedReports.reduce((sum, report) => sum + report.completedToday, 0);
    const completedBySubSls = new Map<string, number>();
    approvedReports.forEach((report) => {
      completedBySubSls.set(report.subSlsId, (completedBySubSls.get(report.subSlsId) ?? 0) + report.completedToday);
    });
    const districtRows = groupTargets(rows, completedBySubSls, (row) => titleCase(row.kecamatan));
    const pmlRows = groupTargets(rows, completedBySubSls, (row) => titleCase(row.pml));
    const burdenRows = groupTargets(rows, completedBySubSls, (row) => titleCase(resolvePclName(row.pcl, row.pml))).sort((a, b) => b.target - a.target).slice(0, 20);
    const lowPclRows = [...burdenRows].sort((a, b) => a.progress - b.progress).slice(0, 20);
    const highNeedRows = burdenRows.map((row) => ({ name: row.name, kebutuhan: Math.ceil(Math.max(0, row.target - row.selesai) / 57) })).sort((a, b) => b.kebutuhan - a.kebutuhan).slice(0, 20);
    const statuses = ["draft", "dikirim", "dikembalikan", "disetujui"] as const;
    const statusRows = [
      ...statuses.map((status) => ({ status, jumlah: reports.filter((report) => report.status === status).length })),
      { status: "dibuka_kembali", jumlah: 0 }
    ];
    const dailyMap = new Map<string, number>();
    approvedReports.forEach((report) => {
      dailyMap.set(report.reportDate, (dailyMap.get(report.reportDate) ?? 0) + report.completedToday);
    });
    const productivityRows = [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([day, selesai]) => ({ day, selesai }));
    if (!productivityRows.length) {
      productivityRows.push(...["Hari 1", "Hari 2", "Hari 3", "Hari 4", "Hari 5", "Hari 6", "Hari 7"].map((day) => ({ day, selesai: 0 })));
    }
    const issueRows = [
      { category: "Rendah", jumlah: 0 },
      { category: "Sedang", jumlah: 0 },
      { category: "Tinggi", jumlah: 0 },
      { category: "Kritis", jumlah: 0 }
    ];

    return { target, completed, districtRows, pmlRows, burdenRows, lowPclRows, highNeedRows, statusRows, productivityRows, issueRows };
  }, [reports, rows]);

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-orange-200 bg-orange-50/80 p-4 text-sm font-bold text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-100">
        Belum ada alokasi tersimpan. Upload dan simpan Excel terlebih dahulu agar grafik kabupaten memakai data nyata.
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartBox title="Progres Harian Kabupaten">
        <SafeResponsiveContainer className="h-56 w-full">
          <LineChart data={data.productivityRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip />
            <Line dataKey="selesai" stroke="#2563eb" strokeWidth={3} dot={false} />
          </LineChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Target Versus Realisasi">
        <SafeResponsiveContainer className="h-56 w-full">
          <BarChart data={[{ name: "Kabupaten", target: data.target, selesai: data.completed }]} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip />
            <Bar dataKey="target" fill="#cbd5e1" radius={[10, 10, 0, 0]} />
            <Bar dataKey="selesai" fill="#ff7a1a" radius={[10, 10, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Progres Kecamatan">
        <SafeResponsiveContainer className="h-56 w-full">
          <BarChart data={data.districtRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ ...axisTick, fontSize: 10 }} interval={0} angle={-20} height={58} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip formatter={percentTooltipFormatter} />
            <Bar dataKey="progress" fill="#10b981" radius={[10, 10, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Target Per PML">
        <SafeResponsiveContainer className="h-56 w-full">
          <BarChart data={data.pmlRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ ...axisTick, fontSize: 10 }} interval={0} angle={-15} height={58} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip />
            <Bar dataKey="target" fill="#2563eb" radius={[10, 10, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Distribusi Beban PCL">
        <SafeResponsiveContainer className="h-56 w-full">
          <BarChart data={data.burdenRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ ...axisTick, fontSize: 10 }} interval={0} angle={-15} height={58} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip />
            <Bar dataKey="target" fill="#ff7a1a" radius={[10, 10, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Status Laporan">
        <SafeResponsiveContainer className="h-56 w-full">
          <PieChart>
            <Pie data={data.statusRows} dataKey="jumlah" nameKey="status" innerRadius={48} outerRadius={84} paddingAngle={4}>
              {data.statusRows.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Tren Produktivitas 7 Hari">
        <SafeResponsiveContainer className="h-56 w-full">
          <LineChart data={data.productivityRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip />
            <Line dataKey="selesai" stroke="#10b981" strokeWidth={3} />
          </LineChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="PCL Dengan Progres Terendah">
        <SafeResponsiveContainer className="h-56 w-full">
          <BarChart data={data.lowPclRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ ...axisTick, fontSize: 10 }} interval={0} angle={-15} height={58} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip formatter={percentTooltipFormatter} />
            <Bar dataKey="progress" fill="#ef4444" radius={[10, 10, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="PCL Dengan Kebutuhan Harian Tertinggi">
        <SafeResponsiveContainer className="h-56 w-full">
          <BarChart data={data.highNeedRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ ...axisTick, fontSize: 10 }} interval={0} angle={-15} height={58} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} />
            <Tooltip />
            <Bar dataKey="kebutuhan" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Komposisi Kendala">
        <SafeResponsiveContainer className="h-56 w-full">
          <PieChart>
            <Pie data={data.issueRows} dataKey="jumlah" nameKey="category" outerRadius={84}>
              {data.issueRows.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </SafeResponsiveContainer>
      </ChartBox>
    </div>
  );
}
