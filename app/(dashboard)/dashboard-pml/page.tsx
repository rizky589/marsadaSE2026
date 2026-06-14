import Link from "next/link";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getPmlDashboard } from "@/lib/dashboard-data";
import { formatDate, numberId, pct } from "@/lib/utils";

export default function DashboardPmlPage() {
  const data = getPmlDashboard();
  const stats = [
    ["Jumlah PCL Bawahan", numberId(data.pclCount)],
    ["Jumlah SLS", numberId(data.slsCount)],
    ["Target Tim", numberId(data.target)],
    ["Selesai", numberId(data.completed)],
    ["Sisa", numberId(data.remaining)],
    ["Progres Tim", `${Math.round(data.percent)}%`],
    ["PCL Aktif Hari Ini", numberId(data.activeToday)],
    ["PCL Belum Melapor", numberId(data.notReported)],
    ["Menunggu Pemeriksaan", numberId(data.pendingReports)],
    ["Kendala Aktif", numberId(data.activeIssues)]
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-[#0b2a4a] p-5 text-white shadow-2xl shadow-blue-950/20 sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">Dashboard PML</p>
        <h2 className="mt-2 text-2xl font-black sm:text-3xl">{data.officer?.name ?? "PML"}</h2>
        <p className="mt-1 text-sm text-blue-100">Pantau progres tim, laporan PCL, dan kebutuhan harian.</p>
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Progres Tim</span>
            <span>{Math.round(data.percent)}%</span>
          </div>
          <Progress value={data.percent} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="p-4">
              <CardDescription className="text-xs">{label}</CardDescription>
              <CardTitle className="mt-1 text-xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Tabel PCL Bawahan</CardTitle>
          <CardDescription>PML dapat membuka detail PCL sampai tingkat SLS.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-3xl border border-[var(--border)]">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-slate-100/80 text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-300">
                <tr>
                  {["Nama PCL", "Jumlah SLS", "Target", "Hasil Hari Ini", "Kumulatif", "Sisa", "Progres", "Kebutuhan/Hari", "Terakhir Melapor", "Status", "Dikembalikan", "Detail"].map((head) => (
                    <th key={head} className="px-4 py-3 font-black">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.pclRows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)] transition hover:bg-orange-50/70 dark:hover:bg-white/5">
                    <td className="px-4 py-4 font-black">{row.name}</td>
                    <td className="px-4 py-4">{numberId(row.slsCount)}</td>
                    <td className="px-4 py-4">{numberId(row.target)}</td>
                    <td className="px-4 py-4">{numberId(row.todayDone)}</td>
                    <td className="px-4 py-4">{numberId(row.completed)}</td>
                    <td className="px-4 py-4">{numberId(row.remaining)}</td>
                    <td className="px-4 py-4">
                      <div className="min-w-32 space-y-2">
                        <div className="flex justify-between text-xs font-bold"><span>{pct(row.completed, row.target)}%</span></div>
                        <Progress value={row.percent} />
                      </div>
                    </td>
                    <td className="px-4 py-4">{numberId(Math.ceil(row.dailyNeed))}</td>
                    <td className="px-4 py-4">{row.lastReported ? formatDate(row.lastReported) : "-"}</td>
                    <td className="px-4 py-4"><Badge>{row.statusLabel}</Badge></td>
                    <td className="px-4 py-4">{numberId(row.returned)}</td>
                    <td className="px-4 py-4">
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/petugas?detail=${row.id}`}>
                          <Eye className="h-4 w-4" /> Detail
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
