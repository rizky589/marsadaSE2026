"use client";

import { Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadImportedAllocations, normalizeName, resolvePclName, titleCase, type ImportedAllocationRow } from "@/lib/imported-allocations";
import { numberId } from "@/lib/utils";

export function PmlReportQueue() {
  const [rows, setRows] = useState<ImportedAllocationRow[]>([]);

  useEffect(() => {
    setRows(loadImportedAllocations());
  }, []);

  const summary = useMemo(() => {
    const pml = new Set<string>();
    const pcl = new Set<string>();
    rows.forEach((row) => {
      pml.add(normalizeName(row.pml));
      pcl.add(`${normalizeName(row.pml)}|${resolvePclName(row.pcl, row.pml)}`);
    });
    return { pml: pml.size, pcl: pcl.size, sls: rows.length, target: rows.reduce((sum, row) => sum + row.targetAwal, 0) };
  }, [rows]);

  const sampleRows = rows.slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Masuk</CardTitle>
        <CardDescription>Belum ada laporan harian terkirim dari PCL. Antrean akan terisi setelah PCL mengirim laporan ke PML.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="PML dari alokasi" value={numberId(summary.pml)} />
          <Metric label="PCL dari alokasi" value={numberId(summary.pcl)} />
          <Metric label="SLS/Sub-SLS" value={numberId(summary.sls)} />
          <Metric label="Target" value={numberId(summary.target)} />
        </div>

        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white/55 p-6 text-center dark:bg-white/5">
          <Inbox className="mx-auto h-10 w-10 text-[#ff7a1a]" />
          <h3 className="mt-3 font-black">Belum Ada Laporan Menunggu Pemeriksaan</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
            Data lama telah dihapus dari antrean. Setelah PCL mengirim progres harian, laporan berstatus dikirim akan muncul di sini untuk disetujui atau dikembalikan PML.
          </p>
        </div>

        {sampleRows.length ? (
          <div className="overflow-x-auto rounded-3xl border border-[var(--border)]">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-100/80 text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-300">
                <tr>{["PML", "PCL", "Desa", "SLS/Sub-SLS", "Target", "Status Laporan"].map((head) => <th key={head} className="px-4 py-3 font-black">{head}</th>)}</tr>
              </thead>
              <tbody>
                {sampleRows.map((row) => (
                  <tr key={row.idSubSls} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">{titleCase(row.pml)}</td>
                    <td className="px-4 py-3 font-bold">{titleCase(resolvePclName(row.pcl, row.pml))}</td>
                    <td className="px-4 py-3">{titleCase(row.desa)}</td>
                    <td className="px-4 py-3">{titleCase(row.namaSls)} / {row.kodeSubSls}</td>
                    <td className="px-4 py-3">{numberId(row.targetAwal)}</td>
                    <td className="px-4 py-3">Belum dikirim</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
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
