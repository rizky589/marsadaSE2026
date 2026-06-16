"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { numberId } from "@/lib/utils";

type ImportMode = "wilayah" | "petugas" | "hubungan" | "penugasan";

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
  savedAt?: string;
  rows?: ImportedRow[];
};

const importedAllocationsStorageKey = "marsada-imported-allocations";
const pageSize = 25;

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function resolvePclName(name: string, pml: string) {
  if (name === "SUGIANTO" && pml === "ISMAIL MUNTHE") return "SUGIANTO - TIM ISMAIL MUNTHE";
  if (name === "SUGIANTO" && pml === "RAHMAT PAUJI HASIBUAN") return "SUGIANTO - TIM RAHMAT PAUJI HASIBUAN";
  return name;
}

export function ImportResultPanel({ mode }: { mode: ImportMode }) {
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(importedAllocationsStorageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as StoredImport;
      setRows((parsed.rows ?? []).filter((row) => row.idSubSls && row.targetAwal > 0));
      setSavedAt(parsed.savedAt ?? null);
    } catch {
      window.localStorage.removeItem(importedAllocationsStorageKey);
    }
  }, []);

  const summary = useMemo(() => buildSummary(rows), [rows]);

  if (!rows.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Belum Ada Import Tersimpan</CardTitle>
          <CardDescription>Upload dan simpan alokasi Excel terlebih dahulu agar halaman ini menampilkan data nyata.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-blue-200 bg-blue-50/80 p-4 text-sm font-bold text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
        Data dari import Excel tersimpan: {numberId(rows.length)} penugasan aktif{savedAt ? `, disimpan ${new Date(savedAt).toLocaleString("id-ID")}` : ""}.
      </div>

      {mode === "wilayah" ? <WilayahView rows={rows} summary={summary} /> : null}
      {mode === "petugas" ? <PetugasView summary={summary} /> : null}
      {mode === "hubungan" ? <HubunganView summary={summary} /> : null}
      {mode === "penugasan" ? <PenugasanView rows={rows} /> : null}
    </div>
  );
}

function buildSummary(rows: ImportedRow[]) {
  const districtSet = new Set<string>();
  const villageSet = new Set<string>();
  const slsSet = new Set<string>();
  const pmlMap = new Map<string, { name: string; sls: number; target: number }>();
  const pclMap = new Map<string, { name: string; pml: string; sls: number; target: number }>();
  const relationMap = new Map<string, { pml: string; pcl: string; sls: number; target: number }>();

  rows.forEach((row) => {
    const pml = row.pml;
    const pcl = resolvePclName(row.pcl, row.pml);
    const villageKey = `${row.kecamatan}|${row.desa}`;
    const slsKey = `${row.kecamatan}|${row.desa}|${row.namaSls}|${row.idSubSls}`;
    const pclKey = `${pcl}|${pml}`;
    const relationKey = `${pml}|${pcl}`;
    districtSet.add(row.kecamatan);
    villageSet.add(villageKey);
    slsSet.add(slsKey);
    pmlMap.set(pml, {
      name: pml,
      sls: (pmlMap.get(pml)?.sls ?? 0) + 1,
      target: (pmlMap.get(pml)?.target ?? 0) + row.targetAwal
    });
    pclMap.set(pclKey, {
      name: pcl,
      pml,
      sls: (pclMap.get(pclKey)?.sls ?? 0) + 1,
      target: (pclMap.get(pclKey)?.target ?? 0) + row.targetAwal
    });
    relationMap.set(relationKey, {
      pml,
      pcl,
      sls: (relationMap.get(relationKey)?.sls ?? 0) + 1,
      target: (relationMap.get(relationKey)?.target ?? 0) + row.targetAwal
    });
  });

  return {
    districtCount: districtSet.size,
    villageCount: villageSet.size,
    slsCount: slsSet.size,
    target: rows.reduce((sum, row) => sum + row.targetAwal, 0),
    pmlRows: [...pmlMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    pclRows: [...pclMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    relationRows: [...relationMap.values()].sort((a, b) => a.pml.localeCompare(b.pml) || a.pcl.localeCompare(b.pcl))
  };
}

function Metrics({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-3xl border border-[var(--border)] bg-white/70 p-4 text-slate-900 dark:bg-slate-900/60 dark:text-slate-50">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-300">{item.label}</p>
          <p className="mt-2 text-2xl font-black">{typeof item.value === "number" ? numberId(item.value) : item.value}</p>
        </div>
      ))}
    </section>
  );
}

function WilayahView({ rows, summary }: { rows: ImportedRow[]; summary: ReturnType<typeof buildSummary> }) {
  const pagination = usePagination(rows);
  return (
    <>
      <Metrics items={[{ label: "Kecamatan", value: summary.districtCount }, { label: "Desa/Kelurahan", value: summary.villageCount }, { label: "SLS/Sub-SLS", value: summary.slsCount }, { label: "Total Target", value: summary.target }]} />
      <DataTable heads={["Kecamatan", "Desa/Kelurahan", "SLS", "ID Sub-SLS", "Target"]}>
        {pagination.rows.map((row) => (
          <tr key={row.idSubSls} className="border-t border-[var(--border)] text-slate-800 transition hover:bg-orange-50/70 dark:text-slate-100 dark:hover:bg-white/5">
            <td className="px-4 py-3">{titleCase(row.kecamatan)}</td>
            <td className="px-4 py-3">{titleCase(row.desa)}</td>
            <td className="px-4 py-3 font-bold">{titleCase(row.namaSls)}</td>
            <td className="px-4 py-3 font-mono text-xs">{row.idSubSls}</td>
            <td className="px-4 py-3">{numberId(row.targetAwal)}</td>
          </tr>
        ))}
      </DataTable>
      <PaginationControls {...pagination} />
    </>
  );
}

function PetugasView({ summary }: { summary: ReturnType<typeof buildSummary> }) {
  const rows = [
    ...summary.pmlRows.map((row) => ({ role: "PML", name: row.name, pml: "-", sls: row.sls, target: row.target })),
    ...summary.pclRows.map((row) => ({ role: "PCL", name: row.name, pml: row.pml, sls: row.sls, target: row.target }))
  ];
  const pagination = usePagination(rows);
  return (
    <>
      <Metrics items={[{ label: "PML", value: summary.pmlRows.length }, { label: "PCL", value: summary.pclRows.length }, { label: "Akun Terhubung", value: "0" }, { label: "Perlu Dibuatkan Akun", value: summary.pmlRows.length + summary.pclRows.length }]} />
      <DataTable heads={["Role", "Nama Petugas", "PML Pembina", "Jumlah SLS", "Target", "Akun"]}>
        {pagination.rows.map((row) => (
          <tr key={`${row.role}-${row.name}-${row.pml}`} className="border-t border-[var(--border)] text-slate-800 transition hover:bg-orange-50/70 dark:text-slate-100 dark:hover:bg-white/5">
            <td className="px-4 py-3"><Badge>{row.role === "PML" ? "Diproses" : "Aman"}</Badge></td>
            <td className="px-4 py-3 font-bold">{titleCase(row.name)}</td>
            <td className="px-4 py-3">{row.pml === "-" ? "-" : titleCase(row.pml)}</td>
            <td className="px-4 py-3">{numberId(row.sls)}</td>
            <td className="px-4 py-3">{numberId(row.target)}</td>
            <td className="px-4 py-3"><Badge>draft</Badge></td>
          </tr>
        ))}
      </DataTable>
      <PaginationControls {...pagination} />
    </>
  );
}

function HubunganView({ summary }: { summary: ReturnType<typeof buildSummary> }) {
  const pagination = usePagination(summary.relationRows);
  return (
    <>
      <Metrics items={[{ label: "Relasi PML-PCL", value: summary.relationRows.length }, { label: "PML", value: summary.pmlRows.length }, { label: "PCL", value: summary.pclRows.length }, { label: "Konflik Aktif", value: 0 }]} />
      <DataTable heads={["PML", "PCL Bawahan", "Jumlah SLS", "Target Tim PCL", "Status"]}>
        {pagination.rows.map((row) => (
          <tr key={`${row.pml}-${row.pcl}`} className="border-t border-[var(--border)] text-slate-800 transition hover:bg-orange-50/70 dark:text-slate-100 dark:hover:bg-white/5">
            <td className="px-4 py-3 font-bold">{titleCase(row.pml)}</td>
            <td className="px-4 py-3">{titleCase(row.pcl)}</td>
            <td className="px-4 py-3">{numberId(row.sls)}</td>
            <td className="px-4 py-3">{numberId(row.target)}</td>
            <td className="px-4 py-3"><Badge>Aman</Badge></td>
          </tr>
        ))}
      </DataTable>
      <PaginationControls {...pagination} />
    </>
  );
}

function PenugasanView({ rows }: { rows: ImportedRow[] }) {
  const pagination = usePagination(rows);
  return (
    <>
      <Metrics items={[{ label: "Penugasan Aktif", value: rows.length }, { label: "Baris Muatan 0", value: "Tidak aktif" }, { label: "Status Import", value: "Tersimpan" }, { label: "Sumber", value: "Excel" }]} />
      <DataTable heads={["Kecamatan", "Desa", "SLS/Sub-SLS", "ID Sub-SLS", "Target", "PML", "PCL"]}>
        {pagination.rows.map((row) => (
          <tr key={row.idSubSls} className="border-t border-[var(--border)] text-slate-800 transition hover:bg-orange-50/70 dark:text-slate-100 dark:hover:bg-white/5">
            <td className="px-4 py-3">{titleCase(row.kecamatan)}</td>
            <td className="px-4 py-3">{titleCase(row.desa)}</td>
            <td className="px-4 py-3 font-bold">{titleCase(row.namaSls)} / {row.kodeSubSls}</td>
            <td className="px-4 py-3 font-mono text-xs">{row.idSubSls}</td>
            <td className="px-4 py-3">{numberId(row.targetAwal)}</td>
            <td className="px-4 py-3">{titleCase(row.pml)}</td>
            <td className="px-4 py-3">{titleCase(resolvePclName(row.pcl, row.pml))}</td>
          </tr>
        ))}
      </DataTable>
      <PaginationControls {...pagination} />
    </>
  );
}

function DataTable({ heads, children }: { heads: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-[var(--border)] bg-white/60 dark:bg-slate-950/30">
      <table className="w-full min-w-[900px] text-left text-sm text-slate-800 dark:text-slate-100">
        <thead className="bg-slate-100/90 text-xs uppercase text-slate-600 dark:bg-slate-900/80 dark:text-slate-200">
          <tr>{heads.map((head) => <th key={head} className="px-4 py-3 font-black">{head}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function usePagination<T>(rows: T[]) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { rows: visibleRows, page: safePage, totalPages, totalRows: rows.length, onPageChange: setPage };
}

function PaginationControls({ page, totalPages, totalRows, onPageChange }: { page: number; totalPages: number; totalRows: number; onPageChange: (page: number) => void }) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1);
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[var(--border)] bg-white/70 p-3 text-sm text-slate-800 dark:bg-slate-900/60 dark:text-slate-100 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-bold text-slate-600 dark:text-slate-300">Halaman {page} dari {totalPages} - {numberId(totalRows)} baris</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Sebelumnya</Button>
        {pages.map((item, index) => (
          <span key={`${item}-${index}`} className="contents">
            {index > 0 && item - pages[index - 1] > 1 ? <span className="px-1 py-2 font-bold text-slate-400">...</span> : null}
            <Button variant={item === page ? "default" : "secondary"} size="sm" onClick={() => onPageChange(item)}>{item}</Button>
          </span>
        ))}
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Berikutnya</Button>
      </div>
    </div>
  );
}
