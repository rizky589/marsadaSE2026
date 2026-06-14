import Link from "next/link";
import { ShieldPlus } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <section className="glass w-full max-w-md rounded-[2rem] p-6 text-white shadow-2xl sm:p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
          <ShieldPlus className="h-6 w-6 text-orange-300" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Daftar MARSADA</h1>
          <p className="text-sm text-white/75">Akses terbatas untuk petugas internal</p>
        </div>
      </div>
      <AuthForm mode="register" />
      <p className="mt-6 text-center text-sm text-white/75">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-bold text-orange-300 hover:text-orange-200">
          Masuk
        </Link>
      </p>
    </section>
  );
}
