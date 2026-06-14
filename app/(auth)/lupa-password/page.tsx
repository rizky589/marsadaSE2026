import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LupaPasswordPage() {
  return (
    <section className="glass w-full max-w-md rounded-[2rem] p-6 text-white shadow-2xl sm:p-8">
      <KeyRound className="mb-4 h-9 w-9 text-orange-300" />
      <h1 className="text-2xl font-black">Lupa Password</h1>
      <p className="mt-2 text-sm text-white/75">Masukkan email akun  untuk menerima tautan reset.</p>
      <form className="mt-6 space-y-4">
        <Input type="email" placeholder="nama@bps.go.id" className="text-slate-950" />
        <Button className="w-full">Kirim Tautan Reset</Button>
      </form>
      <Link href="/login" className="mt-5 block text-center text-sm font-bold text-orange-300">Kembali ke login</Link>
    </section>
  );
}
