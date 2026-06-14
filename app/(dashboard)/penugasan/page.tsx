import { ImportResultPanel } from "@/components/import-result-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Penugasan</CardTitle>
        <CardDescription>Alokasi SLS/Sub-SLS ke PML dan PCL. Baris muatan 0 tidak masuk penugasan aktif.</CardDescription>
      </CardHeader>
      <CardContent>
        <ImportResultPanel mode="penugasan" />
      </CardContent>
    </Card>
  );
}
