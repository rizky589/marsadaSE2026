import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, ClipboardCheck, Database, FileSpreadsheet, FileText, Send, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const steps: {
  title: string;
  description: string;
  href: Route;
  action: string;
  icon: typeof FileSpreadsheet;
  tone: string;
}[] = [
  {
    title: "Admin mengimpor alokasi Excel",
    description: "File alokasi dibaca, header divalidasi, ID Sub-SLS dipertahankan sebagai teks, lalu admin meninjau ringkasan import.",
    href: "/upload",
    action: "Buka Import",
    icon: FileSpreadsheet,
    tone: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
  },
  {
    title: "Data wilayah dan petugas divalidasi",
    description: "Sistem memeriksa 8 kecamatan, 35 PML, 266 PCL, duplikasi, PCL multi-PML, target kosong, dan ID Sub-SLS kosong.",
    href: "/duplikasi-petugas",
    action: "Cek Validasi",
    icon: ShieldCheck,
    tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
  },
  {
    title: "PCL memperoleh daftar SLS/Sub-SLS",
    description: "Penugasan mengikat PCL ke SLS/Sub-SLS, desa, kecamatan, PML, dan target. PCL tidak mengetik wilayah manual.",
    href: "/alokasi",
    action: "Lihat Alokasi",
    icon: Users,
    tone: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-200"
  },
  {
    title: "PCL menginput hasil harian",
    description: "PCL memilih penugasan miliknya, mengisi hasil harian, lalu menyimpan draft atau mengirim laporan kepada PML.",
    href: "/progres",
    action: "Input Progres",
    icon: Send,
    tone: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
  },
  {
    title: "PML menyetujui atau mengembalikan",
    description: "PML memeriksa target, histori SLS, kendala, catatan, kumulatif, dan memutuskan laporan masuk progres resmi atau perlu perbaikan.",
    href: "/pemeriksaan",
    action: "Periksa Laporan",
    icon: ClipboardCheck,
    tone: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
  },
  {
    title: "Laporan disetujui masuk progres resmi",
    description: "Hanya status disetujui yang dihitung untuk progres SLS, PCL, PML, desa, kecamatan, dan kabupaten.",
    href: "/target-realisasi",
    action: "Target Realisasi",
    icon: Database,
    tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
  },
  {
    title: "Dashboard diperbarui otomatis",
    description: "Kartu statistik, grafik, status progres, PCL belum melapor, laporan belum diperiksa, dan kendala aktif ikut berubah.",
    href: "/dashboard",
    action: "Lihat Dashboard",
    icon: CheckCircle2,
    tone: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-200"
  },
  {
    title: "Admin dan pimpinan melihat bahan evaluasi",
    description: "Bahan evaluasi harian dapat diunduh untuk progres kabupaten, kecamatan, PML/PCL terendah, kendala, dan prediksi selesai.",
    href: "/bahan-evaluasi",
    action: "Unduh Evaluasi",
    icon: FileText,
    tone: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
  }
];

export function MonitoringWorkflow() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alur Monitoring Resmi</CardTitle>
        <CardDescription>Rantai kerja dari import alokasi sampai bahan evaluasi. Progres resmi hanya berasal dari laporan yang disetujui PML.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 lg:grid-cols-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="group relative min-w-0 rounded-3xl border border-[var(--border)] bg-white/60 p-4 transition hover:-translate-y-0.5 hover:border-[#ff7a1a]/60 hover:shadow-xl hover:shadow-blue-950/10 dark:bg-white/5">
                <div className="flex min-w-0 gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${step.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff7a1a]">Tahap {index + 1}</p>
                        <h3 className="mt-1 text-sm font-black text-slate-950 dark:text-white sm:text-base">{step.title}</h3>
                      </div>
                      {index < steps.length - 1 ? <ArrowRight className="mt-1 hidden h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#ff7a1a] sm:block" /> : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{step.description}</p>
                    <Button asChild variant="secondary" className="mt-4 cursor-pointer hover:text-[#ff7a1a]">
                      <Link href={step.href}>{step.action}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
