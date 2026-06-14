import { UploadImporter } from "@/components/upload-importer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadPage() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Import Alokasi Excel</CardTitle>
          <CardDescription>Validasi header, normalisasi, deteksi duplikasi, preview, dan histori import.</CardDescription>
        </div>
        <Button asChild variant="secondary"><Link href="/duplikasi-petugas">Penyelesaian Duplikasi</Link></Button>
      </CardHeader>
      <CardContent><UploadImporter /></CardContent>
    </Card>
  );
}
