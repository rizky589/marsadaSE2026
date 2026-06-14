import { ImportResultPanel } from "@/components/import-result-panel";
import { PetugasLoginCreator } from "@/components/petugas-login-creator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PetugasPage() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Petugas</CardTitle>
          <CardDescription>Kelola struktur PML, PCL, target, dan status supervisi.</CardDescription>
        </div>
        <Button>Sinkronkan Akun</Button>
      </CardHeader>
      <CardContent>
        <PetugasLoginCreator />
        <ImportResultPanel mode="petugas" />
      </CardContent>
    </Card>
  );
}
