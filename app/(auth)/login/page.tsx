import { AuthForm } from "@/components/auth-form";
import { BrandLockup } from "@/components/brand-lockup";

export default function LoginPage() {
  return (
    <section className="w-full max-w-[22rem] rounded-[1.7rem] border border-white/25 bg-slate-950/42 p-5 text-white shadow-2xl shadow-slate-950/25 backdrop-blur-md sm:max-w-sm sm:p-6">
      <BrandLockup className="mb-6 justify-start" textClassName="text-left" light compact showLogo={false} subtitle="Monitoring, Analisis, Rekap, Supervisi, dan Data Lapangan Sensus Ekonomi 2026 Kabupaten Labuhanbatu Utara" />
      <AuthForm mode="login" compact />
      <div className="mt-4 grid gap-2 text-[11px] leading-snug text-white/80">
        <div className="rounded-2xl bg-white/10 px-3 py-2.5">
          <span className="font-black text-orange-200">PCL</span> masuk ke Dashboard PCL untuk melihat wilayah tugas dan input progres harian.
        </div>
        <div className="rounded-2xl bg-white/10 px-3 py-2.5">
          <span className="font-black text-orange-200">PML</span> masuk ke Dashboard PML untuk memeriksa laporan PCL, menyetujui, atau mengembalikan.
        </div>
      </div>
    </section>
  );
}
