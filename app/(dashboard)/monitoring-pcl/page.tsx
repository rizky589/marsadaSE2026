import { ImportResultPanel } from "@/components/import-result-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default function Page() {
  return <Card><CardHeader><CardTitle>Monitoring PCL</CardTitle><CardDescription>Daftar PCL, PML pembina, jumlah SLS, dan target dari hasil import.</CardDescription></CardHeader><CardContent><ImportResultPanel mode="hubungan" /></CardContent></Card>;
}
