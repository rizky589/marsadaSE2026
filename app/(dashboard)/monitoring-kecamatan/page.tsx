import { ImportResultPanel } from "@/components/import-result-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default function Page() {
  return <Card><CardHeader><CardTitle>Monitoring Kecamatan</CardTitle><CardDescription>Target dan cakupan wilayah per kecamatan berdasarkan hasil import.</CardDescription></CardHeader><CardContent><ImportResultPanel mode="wilayah" /></CardContent></Card>;
}
