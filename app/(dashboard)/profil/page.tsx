import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ProfilPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Pengguna</CardTitle>
        <CardDescription>Informasi akun internal dan preferensi notifikasi.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2"><span className="text-sm font-bold">Nama</span><Input defaultValue="Admin Kabupaten" /></label>
        <label className="space-y-2"><span className="text-sm font-bold">Email</span><Input defaultValue="admin@bps.go.id" /></label>
        <label className="space-y-2"><span className="text-sm font-bold">Peran</span><Input defaultValue="admin" /></label>
        <label className="space-y-2"><span className="text-sm font-bold">Zona waktu</span><Input defaultValue="Asia/Jakarta" /></label>
        <div className="sm:col-span-2"><Button><UserRound className="h-4 w-4" /> Simpan Profil</Button></div>
      </CardContent>
    </Card>
  );
}
