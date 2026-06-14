import { ImportResultPanel } from "@/components/import-result-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default function Page() {
  return <Card><CardHeader><CardTitle>Target dan Realisasi</CardTitle><CardDescription>Target aktual hasil import. Realisasi resmi akan bertambah setelah laporan PML disetujui.</CardDescription></CardHeader><CardContent><ImportResultPanel mode="penugasan" /></CardContent></Card>;
}
