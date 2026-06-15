import { EvaluationExportPanel } from "@/components/evaluation-export-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default function Page() {
  return <Card><CardHeader><CardTitle>Bahan Evaluasi</CardTitle><CardDescription>Unduh bahan evaluasi hari ini dalam Excel, CSV, PDF, atau PNG.</CardDescription></CardHeader><CardContent><EvaluationExportPanel /></CardContent></Card>;
}
