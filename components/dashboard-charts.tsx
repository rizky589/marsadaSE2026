"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const WeeklyChart = dynamic(() => import("@/components/charts").then((mod) => mod.WeeklyChart), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full" />
});

const DistrictChart = dynamic(() => import("@/components/charts").then((mod) => mod.DistrictChart), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full" />
});

export function WeeklyChartPanel() {
  return <WeeklyChart />;
}

export function DistrictChartPanel() {
  return <DistrictChart />;
}
