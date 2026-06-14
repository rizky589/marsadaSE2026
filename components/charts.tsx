"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { SafeResponsiveContainer } from "@/components/safe-responsive-container";
import { districtSeries, weeklySeries } from "@/lib/mock-data";

export function WeeklyChart() {
  return (
    <SafeResponsiveContainer className="h-72 w-full">
        <LineChart data={weeklySeries} margin={{ left: -22, right: 8, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 18, border: "1px solid rgba(15,23,42,.12)" }} />
          <Line type="monotone" dataKey="selesai" stroke="#2563eb" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="periksa" stroke="#10b981" strokeWidth={3} dot={false} />
        </LineChart>
    </SafeResponsiveContainer>
  );
}

export function DistrictChart() {
  return (
    <SafeResponsiveContainer className="h-72 w-full">
        <BarChart data={districtSeries} margin={{ left: -22, right: 8, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.22)" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={0} angle={-20} height={70} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 18, border: "1px solid rgba(15,23,42,.12)" }} />
          <Bar dataKey="target" fill="#cbd5e1" radius={[10, 10, 0, 0]} />
          <Bar dataKey="selesai" fill="#ff7a1a" radius={[10, 10, 0, 0]} />
        </BarChart>
    </SafeResponsiveContainer>
  );
}
