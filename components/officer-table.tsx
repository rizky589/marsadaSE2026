"use client";

import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { officers } from "@/lib/mock-data";
import type { Officer } from "@/lib/types";
import { numberId, pct } from "@/lib/utils";

export function OfficerTable() {
  const [filter, setFilter] = useState("");
  const columns = useMemo<ColumnDef<Officer>[]>(
    () => [
      { accessorKey: "name", header: "Nama" },
      { accessorKey: "role", header: "Peran" },
      { accessorKey: "district", header: "Kecamatan" },
      {
        accessorKey: "target",
        header: "Target",
        cell: ({ row }) => numberId(row.original.target)
      },
      {
        id: "progress",
        header: "Progres",
        cell: ({ row }) => {
          const value = pct(row.original.progress, row.original.target);
          return (
            <div className="min-w-40 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{numberId(row.original.progress)}</span>
                <span>{value}%</span>
              </div>
              <Progress value={value} />
            </div>
          );
        }
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge>{row.original.status}</Badge>
      }
    ],
    []
  );

  const table = useReactTable({
    data: officers,
    columns,
    state: { globalFilter: filter },
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-slate-400" />
        <Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Cari petugas, kecamatan, status..." className="pl-12" />
      </div>
      <div className="overflow-x-auto rounded-3xl border border-[var(--border)]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-100/80 text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-300">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>{group.headers.map((header) => <th key={header.id} className="px-4 py-3 font-black">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)] transition hover:bg-orange-50/70 dark:hover:bg-white/5">
                {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-4 align-middle">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Sebelumnya</Button>
          <Button variant="secondary" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Berikutnya</Button>
        </div>
      </div>
    </div>
  );
}
