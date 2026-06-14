import { SupervisionForm } from "@/components/supervision-form";
import { IssueTicketModule } from "@/components/issue-ticket-module";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supervisionActivities } from "@/lib/mock-data";
import { formatDate, numberId } from "@/lib/utils";

export default function PengawasanPage() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Pengawasan PML</CardTitle>
          <CardDescription>Input kegiatan pengawasan dengan dokumentasi pada private bucket Supabase Storage.</CardDescription>
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
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {supervisionActivities.map((item) => (
            <article key={item.id} className="rounded-3xl border border-[var(--border)] bg-white/60 p-5 dark:bg-white/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ff7a1a]">{formatDate(item.date)}</p>
                  <h3 className="mt-1 font-black">{item.pclName}</h3>
                  <p className="text-sm text-slate-500">{item.village} / SLS {item.sls}</p>
                </div>
                <Badge>{item.followUpStatus}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <Metric label="Diperiksa" value={numberId(item.inspectedObjects)} />
                <Metric label="Sesuai" value={numberId(item.matched)} />
                <Metric label="Perbaikan" value={numberId(item.needFix)} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.result}</p>
            </article>
          ))}
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
