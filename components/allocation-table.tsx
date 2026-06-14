"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Assignment } from "@/lib/types";
import { numberId } from "@/lib/utils";

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

function toAssignment(row: ImportedRow, index: number): Assignment {
  const resolvedPcl = resolvePclName(row.pcl, row.pml);
  return {
    id: `saved-${row.idSubSls || index}`,
    district: titleCase(row.kecamatan),
    village: titleCase(row.desa),
    sls: row.kodeSubSls ? `${row.namaSls} / ${row.kodeSubSls}` : row.namaSls,
    subSlsId: row.idSubSls,
    load: row.targetAwal,
    pml: titleCase(row.pml),
    pmlId: `pml-${row.pml.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    pcl: titleCase(resolvedPcl),
    pclId: `pcl-${resolvedPcl.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  };
}

export function AllocationTable({ fallbackRows }: { fallbackRows: Assignment[] }) {
  const [storedRows, setStoredRows] = useState<Assignment[] | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const saved = window.localStorage.getItem(importedAllocationsStorageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as StoredImport;
      const rows = parsed.rows?.map(toAssignment).filter((row) => row.subSlsId && row.load > 0);
      if (rows?.length) {
        setStoredRows(rows);
        setSavedAt(parsed.savedAt ?? null);
      }
    } catch {
      window.localStorage.removeItem(importedAllocationsStorageKey);
    }
  }, []);

  const rows = storedRows?.length ? storedRows : fallbackRows;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const sourceText = useMemo(() => {
    if (!storedRows?.length) return "Menampilkan data contoh karena belum ada import tersimpan di browser ini.";
    return `${numberId(storedRows.length)} baris aktif dari import Excel tersimpan${savedAt ? ` pada ${new Date(savedAt).toLocaleString("id-ID")}` : ""}.`;
  }, [savedAt, storedRows]);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-blue-200 bg-blue-50/80 p-4 text-sm font-bold text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
        {sourceText}
      </div>
      <div className="overflow-x-auto rounded-3xl border border-[var(--border)]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-100/80 text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-300">
            <tr>{["Kecamatan", "Desa/Kelurahan", "SLS/Sub-SLS", "ID Sub-SLS", "Muatan", "PML", "PCL", "Status"].map((head) => <th key={head} className="px-4 py-3 font-black">{head}</th>)}</tr>
          </thead>
          <tbody>{visibleRows.map((item) => <tr key={item.id} className="border-t border-[var(--border)] transition hover:bg-orange-50/70 dark:hover:bg-white/5"><td className="px-4 py-4">{item.district}</td><td className="px-4 py-4">{item.village}</td><td className="px-4 py-4 font-bold">{item.sls}</td><td className="px-4 py-4 font-mono text-xs">{item.subSlsId}</td><td className="px-4 py-4">{numberId(item.load)}</td><td className="px-4 py-4">{item.pml}</td><td className="px-4 py-4">{item.pcl}</td><td className="px-4 py-4"><Badge>Aman</Badge></td></tr>)}</tbody>
        </table>
      </div>
      <PaginationControls page={safePage} totalPages={totalPages} totalRows={rows.length} onPageChange={setPage} />
    </div>
  );
}

function PaginationControls({ page, totalPages, totalRows, onPageChange }: { page: number; totalPages: number; totalRows: number; onPageChange: (page: number) => void }) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1);
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[var(--border)] bg-white/60 p-3 text-sm dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-bold text-slate-500 dark:text-slate-300">Halaman {page} dari {totalPages} • {numberId(totalRows)} baris</p>
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
