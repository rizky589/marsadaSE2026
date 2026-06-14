"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const LaburaMap = dynamic(() => import("@/components/labura-map").then((mod) => mod.LaburaMap), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full rounded-[2rem]" />
});

export function MapPanel() {
  return <LaburaMap />;
}
