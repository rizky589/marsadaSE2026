import { ProgressForm } from "@/components/progress-form";
import { ReportHistoryPanel } from "@/components/report-history-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProgresPage() {
  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
      <Card className="-mx-4 min-w-0 rounded-none border-x-0 sm:mx-0 sm:max-w-none sm:rounded-3xl sm:border" style={{ width: "auto", maxWidth: "100%" }}>
        <CardHeader>
          <CardTitle>Input Harian PCL</CardTitle>
          <CardDescription className="break-words [overflow-wrap:anywhere]">Form HP. Wilayah, PML, dan target terisi otomatis.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressForm />
        </CardContent>
      </Card>

      <Card className="-mx-4 min-w-0 rounded-none border-x-0 sm:mx-0 sm:max-w-none sm:rounded-3xl sm:border" style={{ width: "auto", maxWidth: "100%" }}>
        <CardHeader>
          <CardTitle>Riwayat Laporan</CardTitle>
          <CardDescription>Progres resmi hanya dihitung dari laporan berstatus disetujui.</CardDescription>
        </CardHeader>
        <ReportHistoryPanel />
      </Card>
    </div>
  );
}
