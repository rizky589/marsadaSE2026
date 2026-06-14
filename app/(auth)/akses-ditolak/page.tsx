import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AksesDitolakPage() {
  return (
    <section className="glass w-full max-w-md rounded-[2rem] p-6 text-center text-white shadow-2xl sm:p-8">
      <ShieldX className="mx-auto mb-4 h-12 w-12 text-orange-300" />
      <h1 className="text-2xl font-black">Akses Ditolak</h1>
      <p className="mt-2 text-sm text-white/75">Akun Anda tidak memiliki izin untuk membuka halaman ini.</p>
      <Button asChild className="mt-6"><Link href="/dashboard">Kembali</Link></Button>
    </section>
  );
}
