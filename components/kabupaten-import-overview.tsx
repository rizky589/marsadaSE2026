"use client";

import { AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, MapPinned, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { loadImportedAllocations, summarizeImportedAllocations, type ImportedAllocationRow } from "@/lib/imported-allocations";
import { numberId } from "@/lib/utils";

export function KabupatenImportOverview() {
  const [rows, setRows] = useState<ImportedAllocationRow[]>([]);

  useEffect(() => {
    setRows(loadImportedAllocations());
  }, []);

  const summary = useMemo(() => summarizeImportedAllocations(rows), [rows]);
  const stats = [
    { label: "Jumlah Kecamatan", value: numberId(summary.kecamatan), icon: MapPinned, tone: "text-blue-600" },
    { label: "Jumlah Desa", value: numberId(summary.desa), icon: MapPinned, tone: "text-emerald-600" },
    { label: "SLS/Sub-SLS", value: numberId(summary.sls), icon: ClipboardCheck, tone: "text-orange-600" },
    { label: "Jumlah PML", value: numberId(summary.pml), icon: Users, tone: "text-blue-600" },
    { label: "Jumlah PCL", value: numberId(summary.pcl), icon: Users, tone: "text-emerald-600" },
    { label: "Total Target", value: numberId(summary.target), icon: BarChart3, tone: "text-orange-600" },
    { label: "Total Selesai", value: "0", icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Total Sisa", value: numberId(summary.target), icon: ClipboardCheck, tone: "text-slate-600" },
    { label: "Progres Kabupaten", value: "0%", icon: BarChart3, tone: "text-blue-600" },
    { label: "PCL Aktif Hari Ini", value: "0", icon: Users, tone: "text-emerald-600" },
    { label: "PCL Belum Melapor", value: numberId(summary.pcl), icon: AlertTriangle, tone: "text-orange-600" },
    { label: "Belum Diperiksa", value: "0", icon: ClipboardCheck, tone: "text-blue-600" },
    { label: "Kendala Aktif", value: "0", icon: AlertTriangle, tone: "text-orange-600" },
    { label: "Kendala Kritis", value: "0", icon: AlertTriangle, tone: "text-red-600" }
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] bg-[#0b2a4a] p-5 text-white shadow-2xl shadow-blue-950/20 sm:p-7">
        <h2 className="mt-2 max-w-4xl text-3xl font-black sm:text-4xl">Monitoring SE2026 Labuhanbatu Utara</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100 sm:text-base">
          {rows.length ? `${numberId(rows.length)} alokasi aktif dari Excel tersimpan. Progres resmi menunggu laporan PCL disetujui PML.` : "Upload dan simpan alokasi Excel terlebih dahulu agar dashboard memakai data nyata."}
        </p>
        <div className="mt-6 max-w-3xl space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Progres Kabupaten</span>
            <span>0%</span>
          </div>
          <Progress value={0} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                <div>
                  <CardDescription className="text-xs">{item.label}</CardDescription>
                  <CardTitle className="mt-1 text-xl">{item.value}</CardTitle>
                </div>
                <Icon className={`h-6 w-6 ${item.tone}`} />
              </CardHeader>
            </Card>
          );
        })}
      </section>
    </>
  );
}
