"use client";

import { Download, FileSpreadsheet, FileText, ImageDown } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { summarizeProgressRows, type DashboardProgressRow } from "@/lib/dashboard-progress";
import { numberId, pct, percentId } from "@/lib/utils";

function rows(progressRows: DashboardProgressRow[]) {
  const summary = summarizeProgressRows(progressRows);
  const pendingPcl = new Set(progressRows.filter((row) => row.selesai <= 0).map((row) => `${row.pml}|${row.pcl}`)).size;
  return [
    ["Total target kabupaten", numberId(summary.target)],
    ["Kecamatan", numberId(summary.kecamatan)],
    ["Desa/Kelurahan", numberId(summary.desa)],
    ["SLS/Sub-SLS", numberId(summary.sls)],
    ["PML", numberId(summary.pml)],
    ["PCL", numberId(summary.pcl)],
    ["Selesai resmi", numberId(summary.selesai)],
    ["Sisa", numberId(summary.sisa)],
    ["Progres kabupaten", percentId(pct(summary.selesai, summary.target))],
    ["PCL belum ada selesai disetujui", numberId(pendingPcl)],
    ["Laporan belum diperiksa", "0"],
    ["Diperbarui", summary.updatedAt ? new Date(summary.updatedAt).toLocaleString("id-ID") : "Belum ada laporan disetujui"]
  ];
}

export function EvaluationExport({ rows: progressRows }: { rows: DashboardProgressRow[] }) {
  function exportExcel() {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Komponen", "Isi"], ...rows(progressRows)]), "Evaluasi");
    XLSX.writeFile(workbook, "bahan-evaluasi-hari-ini.xlsx");
  }

  function exportCsv() {
    const csv = [["Komponen", "Isi"], ...rows(progressRows)].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bahan-evaluasi-hari-ini.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    window.print();
    toast.info("Gunakan dialog cetak browser untuk menyimpan PDF.");
  }

  function exportPng() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 700;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0b2a4a";
    ctx.font = "bold 34px Arial";
    ctx.fillText("Bahan Evaluasi Hari Ini", 48, 70);
    ctx.font = "22px Arial";
    rows(progressRows).forEach(([label, value], index) => ctx.fillText(`${label}: ${value}`.slice(0, 95), 48, 125 + index * 48));
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "bahan-evaluasi-hari-ini.png";
    link.click();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={exportExcel}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
      <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>
      <Button variant="secondary" onClick={exportPdf}><FileText className="h-4 w-4" /> PDF</Button>
      <Button variant="secondary" onClick={exportPng}><ImageDown className="h-4 w-4" /> PNG Grafik</Button>
    </div>
  );
}
