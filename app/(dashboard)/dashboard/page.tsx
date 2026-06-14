import { AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, Filter, MapPinned, Users } from "lucide-react";
import { DashboardFilter } from "@/components/dashboard-filter";
import { KabupatenChartsPanel } from "@/components/kabupaten-charts-panel";
import { MotionShell } from "@/components/motion-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getKabupatenDashboard } from "@/lib/dashboard-data";
import { numberId, pct } from "@/lib/utils";

export default function DashboardPage() {
  const data = getKabupatenDashboard();
  const stats = [
    { label: "Jumlah Kecamatan", value: numberId(data.districtCount), icon: MapPinned, tone: "text-blue-600" },
    { label: "Jumlah Desa", value: numberId(data.villageCount), icon: MapPinned, tone: "text-emerald-600" },
    { label: "SLS/Sub-SLS", value: numberId(data.slsCount), icon: ClipboardCheck, tone: "text-orange-600" },
    { label: "Jumlah PML", value: numberId(data.pmlCount), icon: Users, tone: "text-blue-600" },
    { label: "Jumlah PCL", value: numberId(data.pclCount), icon: Users, tone: "text-emerald-600" },
    { label: "Total Target", value: numberId(data.target), icon: BarChart3, tone: "text-orange-600" },
    { label: "Total Selesai", value: numberId(data.completed), icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Total Sisa", value: numberId(data.remaining), icon: ClipboardCheck, tone: "text-slate-600" },
    { label: "Progres Kabupaten", value: `${Math.round(data.percent)}%`, icon: BarChart3, tone: "text-blue-600" },
    { label: "PCL Aktif Hari Ini", value: numberId(data.activeToday), icon: Users, tone: "text-emerald-600" },
    { label: "PCL Belum Melapor", value: numberId(data.notReported), icon: AlertTriangle, tone: "text-orange-600" },
    { label: "Belum Diperiksa", value: numberId(data.pendingReports), icon: ClipboardCheck, tone: "text-blue-600" },
    { label: "Kendala Aktif", value: numberId(data.activeIssues), icon: AlertTriangle, tone: "text-orange-600" },
    { label: "Kendala Kritis", value: numberId(data.criticalIssues), icon: AlertTriangle, tone: "text-red-600" }
  ];

  return (
    <MotionShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#0b2a4a] p-5 text-white shadow-2xl shadow-blue-950/20 sm:p-7">
          
          <h2 className="mt-2 max-w-4xl text-3xl font-black sm:text-4xl">Monitoring SE2026 Labuhanbatu Utara</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100 sm:text-base">
            
          </p>
          <div className="mt-6 max-w-3xl space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span>Progres Kabupaten</span>
              <span>{pct(data.completed, data.target)}%</span>
            </div>
            <Progress value={data.percent} />
          </div>
        </section>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#ff7a1a]" />
              <CardTitle>Filter</CardTitle>
            </div>
            
          </CardHeader>
          <DashboardFilter />
        </Card>

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

        <Card>
          <CardHeader>
            <CardTitle>Grafik Kabupaten</CardTitle>
            
          </CardHeader>
          <CardContent>
            <KabupatenChartsPanel />
          </CardContent>
        </Card>
      </div>
    </MotionShell>
  );
}
