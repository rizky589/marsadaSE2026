"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const Charts = dynamic(() => import("@/components/kabupaten-charts").then((mod) => mod.KabupatenCharts), {
  ssr: false,
  loading: () => <Skeleton className="h-[460px] w-full rounded-3xl" />
});

export function KabupatenChartsPanel() {
  return <Charts />;
}
