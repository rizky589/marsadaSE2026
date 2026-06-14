import { ImportResultPanel } from "@/components/import-result-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Master Petugas</CardTitle>
        <CardDescription>PML, PCL, target, jumlah SLS, dan status awal akun login.</CardDescription>
      </CardHeader>
      <CardContent>
        <ImportResultPanel mode="petugas" />
      </CardContent>
    </Card>
  );
}
