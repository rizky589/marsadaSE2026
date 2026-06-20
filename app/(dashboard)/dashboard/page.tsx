import { Filter } from "lucide-react";
import { Suspense } from "react";
import { DashboardFilter } from "@/components/dashboard-filter";
import { KabupatenImportOverview } from "@/components/kabupaten-import-overview";
import { KabupatenChartsPanel } from "@/components/kabupaten-charts-panel";
import { MotionShell } from "@/components/motion-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <MotionShell>
      <div className="space-y-5">
        <Suspense fallback={null}>
          <KabupatenImportOverview />
        </Suspense>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#ff7a1a]" />
              <CardTitle>Filter</CardTitle>
            </div>
            
          </CardHeader>
          <Suspense fallback={null}>
            <DashboardFilter />
          </Suspense>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grafik Kabupaten</CardTitle>
            
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <KabupatenChartsPanel />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </MotionShell>
  );
}
