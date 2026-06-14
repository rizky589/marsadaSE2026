"use client";

import { useEffect, useMemo, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { assignments, districts, officers } from "@/lib/mock-data";

type ImportedRow = {
  kecamatan: string;
  desa: string;
  idSubSls: string;
  targetAwal: number;
  pml: string;
  pcl: string;
};

type StoredImport = {
  rows?: ImportedRow[];
};

const storageKey = "marsada-imported-allocations";

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
  const [rows, setRows] = useState<ImportedRow[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as StoredImport;
      setRows((parsed.rows ?? []).filter((row) => row.idSubSls && row.targetAwal > 0));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const options = useMemo(() => {
    if (!rows.length) {
      return {
        kecamatan: districts,
        desa: uniqueSorted(assignments.map((item) => item.village)),
        pml: uniqueSorted(officers.filter((item) => item.role === "PML").map((item) => item.name)),
        pcl: uniqueSorted(officers.filter((item) => item.role === "PCL").map((item) => item.name))
      };
    }

    return {
      kecamatan: uniqueSorted(rows.map((row) => titleCase(row.kecamatan))),
      desa: uniqueSorted(rows.map((row) => titleCase(row.desa))),
      pml: uniqueSorted(rows.map((row) => titleCase(row.pml))),
      pcl: uniqueSorted(rows.map((row) => titleCase(resolvePclName(row.pcl, row.pml))))
    };
  }, [rows]);

  return (
    <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <FilterField label="Kegiatan" value="Sensus Ekonomi 2026" />
      <FilterField label="Tanggal" type="date" value="2026-05-04" />
      <SelectField label="Kecamatan" values={["Semua kecamatan", ...options.kecamatan]} />
      <SelectField label="Desa" values={["Semua desa", ...options.desa]} />
      <SelectField label="PML" values={["Semua PML", ...options.pml]} />
      <SelectField label="PCL" values={["Semua PCL", ...options.pcl]} />
      <SelectField label="Status Laporan" values={["Semua status", "draft", "dikirim", "dikembalikan", "disetujui", "dibuka kembali"]} />
      <SelectField label="Status Progres" values={["Semua status", "Hijau", "Kuning", "Oranye", "Merah", "Belum ada laporan"]} />
    </CardContent>
  );
}

function FilterField({ label, value, type = "text" }: { label: string; value: string; type?: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold">{label}</span>
      <Input type={type} defaultValue={value} />
    </label>
  );
}

function SelectField({ label, values }: { label: string; values: string[] }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold">{label}</span>
      <select className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 text-sm outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-orange-200 dark:bg-white/10">
        {values.map((value) => <option key={value}>{value}</option>)}
      </select>
    </label>
  );
}
