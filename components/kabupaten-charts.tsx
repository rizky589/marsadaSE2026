"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { SafeResponsiveContainer } from "@/components/safe-responsive-container";
import { getKabupatenDashboard } from "@/lib/dashboard-data";

const data = getKabupatenDashboard();
const colors = ["#2563eb", "#ff7a1a", "#10b981", "#ef4444", "#64748b", "#8b5cf6"];

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-white/55 p-4 dark:bg-white/5">
      <h3 className="mb-3 text-sm font-black">{title}</h3>
      {children}
    </div>
  );
}

export function KabupatenCharts() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartBox title="Progres Harian Kabupaten">
        <SafeResponsiveContainer className="h-56 w-full">
          <LineChart data={data.productivityRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Line dataKey="selesai" stroke="#2563eb" strokeWidth={3} dot={false} />
          </LineChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Target Versus Realisasi">
        <SafeResponsiveContainer className="h-56 w-full">
          <BarChart data={[{ name: "Kabupaten", target: data.target, selesai: data.completed }]} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="target" fill="#cbd5e1" radius={[10, 10, 0, 0]} />
            <Bar dataKey="selesai" fill="#ff7a1a" radius={[10, 10, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Progres 8 Kecamatan">
        <SafeResponsiveContainer className="h-56 w-full">
          <BarChart data={data.districtRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={0} angle={-20} height={58} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="progress" fill="#10b981" radius={[10, 10, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Progres Per PML">
        <SafeResponsiveContainer className="h-56 w-full">
          <BarChart data={data.pmlRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="progress" fill="#2563eb" radius={[10, 10, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Distribusi Beban PCL">
        <SafeResponsiveContainer className="h-56 w-full">
          <BarChart data={data.burdenRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="target" fill="#ff7a1a" radius={[10, 10, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Status Laporan">
        <SafeResponsiveContainer className="h-56 w-full">
          <PieChart>
            <Pie data={data.statusRows} dataKey="jumlah" nameKey="status" innerRadius={48} outerRadius={84} paddingAngle={4}>
              {data.statusRows.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Tren Produktivitas 7 Hari">
        <SafeResponsiveContainer className="h-56 w-full">
          <LineChart data={data.productivityRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Line dataKey="selesai" stroke="#10b981" strokeWidth={3} />
          </LineChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="PCL Dengan Progres Terendah">
        <SafeResponsiveContainer className="h-56 w-full">
          <BarChart data={data.lowPclRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="progress" fill="#ef4444" radius={[10, 10, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="PCL Dengan Kebutuhan Harian Tertinggi">
        <SafeResponsiveContainer className="h-56 w-full">
          <BarChart data={data.highNeedRows} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="kebutuhan" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </ChartBox>

      <ChartBox title="Komposisi Kendala">
        <SafeResponsiveContainer className="h-56 w-full">
          <PieChart>
            <Pie data={data.issueRows} dataKey="jumlah" nameKey="category" outerRadius={84}>
              {data.issueRows.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </SafeResponsiveContainer>
      </ChartBox>
    </div>
  );
}
