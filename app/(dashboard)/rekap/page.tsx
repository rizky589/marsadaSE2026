import { EvaluationExport } from "@/components/evaluation-export";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getKabupatenDashboard } from "@/lib/dashboard-data";
import { numberId } from "@/lib/utils";

export default function RekapPage() {
  const data = getKabupatenDashboard();
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Rekap dan Ekspor</CardTitle>
          <CardDescription>Kabupaten, kecamatan, desa, SLS, PML, PCL, laporan harian, kendala, pengawasan, dan prediksi penyelesaian.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EvaluationExport />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Target Kabupaten" value={numberId(data.target)} />
            <Metric label="Selesai" value={numberId(data.completed)} />
            <Metric label="Sisa" value={numberId(data.remaining)} />
            <Metric label="Progres" value={`${Math.round(data.percent)}%`} />
            <Metric label="PCL belum melapor" value={numberId(data.notReported)} />
            <Metric label="Belum diperiksa" value={numberId(data.pendingReports)} />
            <Metric label="Kendala aktif" value={numberId(data.activeIssues)} />
            <Metric label="Kendala kritis" value={numberId(data.criticalIssues)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl border border-[var(--border)] bg-white/55 p-4 dark:bg-white/5"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>;
}
