import { PmlReportQueue } from "@/components/pml-report-queue";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PemeriksaanPage() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Antrean Laporan PML</CardTitle>
          <CardDescription>Pemeriksaan harian laporan PCL. Progres resmi hanya memakai laporan berstatus disetujui.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <Step number="1" title="Buka detail" text="PML melihat target, histori SLS, laporan sebelumnya, kendala, dan angka harian." />
          <Step number="2" title="Beri catatan" text="Catatan wajib saat laporan dikembalikan dan tercatat sebagai audit trail." />
          <Step number="3" title="Setujui atau kembalikan" text="Setujui untuk mengunci laporan dan memperbarui dashboard seluruh tingkatan." />
        </CardContent>
      </Card>

      <PmlReportQueue />
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-white/55 p-4 dark:bg-white/5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0b2a4a] text-sm font-black text-white">{number}</div>
      <h3 className="font-black">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
    </div>
  );
}
