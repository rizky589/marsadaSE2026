import { MapPanel } from "@/components/map-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PetaPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Peta Monitoring</CardTitle>
        <CardDescription>Titik ringkas wilayah pengawasan. Layer ini dapat diganti GeoJSON kecamatan/desa dari Supabase Storage.</CardDescription>
      </CardHeader>
      <CardContent><MapPanel /></CardContent>
    </Card>
  );
}
