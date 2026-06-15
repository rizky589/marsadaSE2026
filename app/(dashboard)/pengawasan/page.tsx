import { SupervisionForm } from "@/components/supervision-form";
import { IssueTicketModule } from "@/components/issue-ticket-module";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PengawasanPage() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Pengawasan PML</CardTitle>
          <CardDescription>Input kegiatan pengawasan berdasarkan alokasi import. Riwayat akan terisi setelah pengawasan tersimpan.</CardDescription>
        </CardHeader>
        <CardContent>
          <SupervisionForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengawasan</CardTitle>
          <CardDescription>Catatan pemeriksaan lapangan dan tindak lanjut PML.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white/55 p-6 text-center text-sm font-bold text-slate-500 dark:bg-white/5 dark:text-slate-300">
            Belum ada riwayat pengawasan tersimpan.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tiket Kendala</CardTitle>
          <CardDescription>Alur kendala: PCL membuat, PML menindaklanjuti, dapat diteruskan admin, lalu ditutup.</CardDescription>
        </CardHeader>
        <CardContent>
          <IssueTicketModule />
        </CardContent>
      </Card>
    </div>
  );
}
