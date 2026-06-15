import { RekapImportSummary } from "@/components/rekap-import-summary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RekapPage() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Rekap dan Ekspor</CardTitle>
          <CardDescription>Kabupaten, kecamatan, desa, SLS, PML, PCL, laporan harian, kendala, pengawasan, dan prediksi penyelesaian.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RekapImportSummary />
        </CardContent>
      </Card>
    </div>
  );
}
