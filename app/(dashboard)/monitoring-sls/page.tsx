import { ImportResultPanel } from "@/components/import-result-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default function Page() {
  return <Card><CardHeader><CardTitle>Monitoring SLS</CardTitle><CardDescription>SLS/Sub-SLS aktif dari import, termasuk ID Sub-SLS bertipe teks dan target aktual.</CardDescription></CardHeader><CardContent><ImportResultPanel mode="penugasan" /></CardContent></Card>;
}
