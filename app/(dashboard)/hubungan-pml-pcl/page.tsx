import { ImportResultPanel } from "@/components/import-result-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hubungan PML-PCL</CardTitle>
        <CardDescription>Relasi PML dengan PCL bawahan hasil import, termasuk pemisahan nama sama yang sudah diputuskan.</CardDescription>
      </CardHeader>
      <CardContent>
        <ImportResultPanel mode="hubungan" />
      </CardContent>
    </Card>
  );
}
