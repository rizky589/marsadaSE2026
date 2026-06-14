import Link from "next/link";
import type { Route } from "next";
import { PclImportDashboard } from "@/components/pcl-import-dashboard";

export default function DashboardPclPage() {
  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <PclImportDashboard />

      <nav className="fixed bottom-3 left-3 right-3 z-30 grid grid-cols-6 rounded-[1.4rem] border border-white/70 bg-white/90 p-2 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/85 lg:hidden">
        {([
          { href: "/dashboard-pcl", label: "Beranda" },
          { href: "/alokasi", label: "Wilayah" },
          { href: "/progres", label: "Input" },
          { href: "/pengawasan", label: "Kendala" },
          { href: "/progres", label: "Riwayat" },
          { href: "/profil", label: "Profil" }
        ] satisfies { href: Route; label: string }[]).map((item) => {
          return (
            <Link key={item.label} href={item.href} className="flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-bold text-slate-500 hover:text-[#ff7a1a]">
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
