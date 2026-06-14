import { ImportResultPanel } from "@/components/import-result-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Master Wilayah</CardTitle>
        <CardDescription>Kecamatan, desa/kelurahan, SLS, ID Sub-SLS, dan target hasil import.</CardDescription>
      </CardHeader>
      <CardContent>
        <ImportResultPanel mode="wilayah" />
      </CardContent>
    </Card>
  );
}
