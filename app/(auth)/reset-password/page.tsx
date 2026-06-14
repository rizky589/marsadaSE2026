import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  return (
    <section className="glass w-full max-w-md rounded-[2rem] p-6 text-white shadow-2xl sm:p-8">
      <LockKeyhole className="mb-4 h-9 w-9 text-orange-300" />
      <h1 className="text-2xl font-black">Reset Password</h1>
      <p className="mt-2 text-sm text-white/75">Buat kata sandi baru minimal 8 karakter.</p>
      <form className="mt-6 space-y-4">
        <Input type="password" placeholder="Password baru" className="text-slate-950" />
        <Input type="password" placeholder="Ulangi password" className="text-slate-950" />
        <Button className="w-full">Simpan Password</Button>
      </form>
    </section>
  );
}
