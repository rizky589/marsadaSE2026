import { AllocationTable } from "@/components/allocation-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getImportedAllocations } from "@/lib/allocation-file";
import { numberId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function AlokasiPage() {
  const importedAssignments = getImportedAllocations(80);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alokasi SLS/Sub-SLS</CardTitle>
        <CardDescription>
          {importedAssignments.length ? `${numberId(importedAssignments.length)} baris aktif dari file alokasi ditampilkan sebagai preview. Baris muatan 0 tidak masuk penugasan aktif.` : "Data alokasi resmi akan tampil setelah import Excel tersimpan ke Supabase."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AllocationTable fallbackRows={importedAssignments} />
      </CardContent>
    </Card>
  );
}
