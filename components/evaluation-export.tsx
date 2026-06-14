"use client";

import { Download, FileSpreadsheet, FileText, ImageDown } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { getKabupatenDashboard } from "@/lib/dashboard-data";

const data = getKabupatenDashboard();

function rows() {
  return [
    ["Progres kabupaten", `${Math.round(data.percent)}%`],
    ["Progres 8 kecamatan", data.districtRows.map((row) => `${row.name}: ${row.progress}%`).join("; ")],
    ["PML terendah", data.pmlRows.slice().sort((a, b) => a.progress - b.progress)[0]?.name ?? "-"],
    ["PCL terendah", data.lowPclRows[0]?.name ?? "-"],
    ["PCL belum melapor", String(data.notReported)],
    ["Laporan belum diperiksa", String(data.pendingReports)],
    ["Desa belum mulai", data.districtRows.filter((row) => row.selesai === 0).map((row) => row.name).join(", ") || "-"],
    ["Kendala aktif", String(data.activeIssues)],
    ["Kendala kritis", String(data.criticalIssues)],
    ["Prediksi selesai", data.remaining === 0 ? "Selesai" : "Berjalan sesuai kebutuhan harian"]
  ];
}

export function EvaluationExport() {
  function exportExcel() {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Komponen", "Isi"], ...rows()]), "Evaluasi");
    XLSX.writeFile(workbook, "bahan-evaluasi-hari-ini.xlsx");
  }

  function exportCsv() {
    const csv = [["Komponen", "Isi"], ...rows()].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
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
    rows().forEach(([label, value], index) => ctx.fillText(`${label}: ${value}`.slice(0, 95), 48, 125 + index * 48));
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
