import { AllocationTable } from "@/components/allocation-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getImportedAllocations } from "@/lib/allocation-file";
import { assignments } from "@/lib/mock-data";
import { numberId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function AlokasiPage() {
  const importedAssignments = getImportedAllocations(80);
  const rows = importedAssignments.length ? importedAssignments : assignments;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alokasi SLS/Sub-SLS</CardTitle>
        <CardDescription>
          {importedAssignments.length ? `${numberId(importedAssignments.length)} baris aktif dari file alokasi ditampilkan sebagai preview. Baris muatan 0 tidak masuk penugasan aktif.` : "Satu PCL dapat menangani beberapa SLS/Sub-SLS dan satu desa dapat ditangani beberapa PCL."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AllocationTable fallbackRows={rows} />
      </CardContent>
    </Card>
  );
}
