import { ImportResultPanel } from "@/components/import-result-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default function Page() {
  return <Card><CardHeader><CardTitle>Monitoring PML</CardTitle><CardDescription>Daftar PML, jumlah SLS, dan target tim dari hasil import.</CardDescription></CardHeader><CardContent><ImportResultPanel mode="petugas" /></CardContent></Card>;
}
