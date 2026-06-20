"use client";

import { Download, RotateCcw } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { getDailyReportSnapshotAction, getImportedAllocationSnapshotAction } from "@/app/actions";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dashboardFiltersFromParams, filterImportedRowsWithReports } from "@/lib/dashboard-filtering";
import type { ImportedAllocationRow } from "@/lib/imported-allocations";
import { numberId, pct, percentId } from "@/lib/utils";

type StoredImport = {
  rows?: ImportedAllocationRow[];
};

const storageKey = "marsada-imported-allocations";
type StoredDailyReport = {
  subSlsId: string;
  reportDate: string;
  pml?: string;
  pcl: string;
  completedToday: number;
  status: "draft" | "dikirim" | "dikembalikan" | "disetujui";
};

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function resolvePclName(name: string, pml: string) {
  if (name === "SUGIANTO" && pml === "ISMAIL MUNTHE") return "SUGIANTO - TIM ISMAIL MUNTHE";
  if (name === "SUGIANTO" && pml === "RAHMAT PAUJI HASIBUAN") return "SUGIANTO - TIM RAHMAT PAUJI HASIBUAN";
  return name;
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
}

export function DashboardFilter() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<ImportedAllocationRow[]>([]);
  const [reports, setReports] = useState<StoredDailyReport[]>([]);

  useEffect(() => {
    let active = true;

    function loadLocalImport() {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved || !active) return;
      try {
        const parsed = JSON.parse(saved) as StoredImport;
        setRows((parsed.rows ?? []).filter((row) => row.idSubSls && row.targetAwal > 0));
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

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
      loadLocalImport();
    }

    loadRows();
    async function loadReports() {
      try {
        const serverReports = await getDailyReportSnapshotAction();
        if (active) {
          setReports(serverReports as StoredDailyReport[]);
        }
      } catch {
        if (active) setReports([]);
      }
    }
    loadReports();
    return () => {
      active = false;
    };
  }, []);

  const selected = useMemo(() => dashboardFiltersFromParams(searchParams), [searchParams]);

  const options = useMemo(() => {
    return {
      kecamatan: uniqueSorted(rows.map((row) => titleCase(row.kecamatan))),
      desa: uniqueSorted(rows.map((row) => titleCase(row.desa))),
      pml: uniqueSorted(rows.map((row) => titleCase(row.pml))),
      pcl: uniqueSorted(rows.map((row) => titleCase(resolvePclName(row.pcl, row.pml))))
    };
  }, [rows]);

  const filteredRows = useMemo(() => filterImportedRowsWithReports(rows, selected, reports), [rows, reports, selected]);

  function setFilter(key: "kecamatan" | "desa" | "pml" | "pcl" | "status_laporan" | "status_progress", value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value || value.toLowerCase().startsWith("semua ")) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.replace(`${pathname}${next.toString() ? `?${next.toString()}` : ""}` as Route, { scroll: false });
  }

  function resetFilters() {
    router.replace(pathname as Route, { scroll: false });
  }

  function exportPclProgress() {
    if (!filteredRows.length) {
      toast.error("Tidak ada data sesuai filter untuk diekspor.");
      return;
    }

    const approvedReports = reports.filter((report) => report.status === "disetujui");
    const completedBySubSls = new Map<string, number>();
    approvedReports.forEach((report) => {
      completedBySubSls.set(report.subSlsId, (completedBySubSls.get(report.subSlsId) ?? 0) + report.completedToday);
    });

    const grouped = new Map<string, { pml: string; pcl: string; kecamatan: Set<string>; desa: Set<string>; sls: number; target: number; selesai: number }>();
    filteredRows.forEach((row) => {
      const pcl = titleCase(resolvePclName(row.pcl, row.pml));
      const pml = titleCase(row.pml);
      const key = `${pml}|${pcl}`;
      const current = grouped.get(key) ?? { pml, pcl, kecamatan: new Set<string>(), desa: new Set<string>(), sls: 0, target: 0, selesai: 0 };
      current.kecamatan.add(titleCase(row.kecamatan));
      current.desa.add(titleCase(row.desa));
      current.sls += 1;
      current.target += row.targetAwal;
      current.selesai += completedBySubSls.get(row.idSubSls) ?? 0;
      grouped.set(key, current);
    });

    const exportRows = [...grouped.values()]
      .sort((a, b) => a.pml.localeCompare(b.pml, "id") || a.pcl.localeCompare(b.pcl, "id"))
      .map((row) => ({
        PML: row.pml,
        PCL: row.pcl,
        Kecamatan: [...row.kecamatan].join(", "),
        Desa: row.desa.size,
        "SLS/Sub-SLS": row.sls,
        Target: row.target,
        Selesai: row.selesai,
        Sisa: Math.max(0, row.target - row.selesai),
        Progres: percentId(pct(row.selesai, row.target))
      }));

    const updatedAt = new Date();
    const updatedAtText = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta"
    }).format(updatedAt).replace(/\./g, ":");
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Progress per PCL"],
      [`Diperbarui ${updatedAtText} WIB`],
      [`Filter aktif: ${filteredRows.length} alokasi`]
    ]);
    XLSX.utils.sheet_add_json(worksheet, exportRows, { origin: "A4" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Progress PCL");
    XLSX.writeFile(workbook, `progress-pcl-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Excel progress per PCL diunduh`, {
      description: `${numberId(exportRows.length)} PCL sesuai filter aktif.`
    });
  }

  return (
    <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <FilterField label="Kegiatan" value="Sensus Ekonomi 2026" />
      <FilterField label="Tanggal" type="date" value="2026-05-04" />
      <SelectField label="Kecamatan" value={selected.kecamatan ?? "Semua kecamatan"} values={["Semua kecamatan", ...options.kecamatan]} onChange={(value) => setFilter("kecamatan", value)} />
      <SelectField label="Desa" value={selected.desa ?? "Semua desa"} values={["Semua desa", ...options.desa]} onChange={(value) => setFilter("desa", value)} />
      <SelectField label="PML" value={selected.pml ?? "Semua PML"} values={["Semua PML", ...options.pml]} onChange={(value) => setFilter("pml", value)} />
      <SelectField label="PCL" value={selected.pcl ?? "Semua PCL"} values={["Semua PCL", ...options.pcl]} onChange={(value) => setFilter("pcl", value)} />
      <SelectField label="Status Laporan" value={selected.statusLaporan ?? "Semua status"} values={["Semua status", "draft", "dikirim", "dikembalikan", "disetujui", "belum ada laporan"]} onChange={(value) => setFilter("status_laporan", value)} />
      <SelectField label="Status Progres" value={selected.statusProgress ?? "Semua status"} values={["Semua status", "Hijau", "Kuning", "Oranye", "Merah", "Belum ada laporan"]} onChange={(value) => setFilter("status_progress", value)} />
      <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-4">
        <Button type="button" onClick={exportPclProgress}>
          <Download className="h-4 w-4" /> Download Progress per PCL
        </Button>
        <Button type="button" variant="secondary" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4" /> Reset Filter
        </Button>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">{numberId(filteredRows.length)} alokasi sesuai filter</span>
      </div>
    </CardContent>
  );
}

function FilterField({ label, value, type = "text" }: { label: string; value: string; type?: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
      <Input type={type} defaultValue={value} />
    </label>
  );
}

function SelectField({ label, values, value, onChange }: { label: string; values: string[]; value?: string; onChange?: (value: string) => void }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
      <select value={value} onChange={(event) => onChange?.(event.target.value)} className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-orange-200 dark:bg-slate-900/70 dark:text-slate-50 dark:focus:ring-orange-500/20">
        {values.map((value) => <option key={value}>{value}</option>)}
      </select>
    </label>
  );
}
