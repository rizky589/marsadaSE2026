import { cn } from "@/lib/utils";

const tone = {
  Aman: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  "Perlu Perhatian": "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200",
  Kritis: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200",
  Terbuka: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200",
  Diproses: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
  Selesai: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  draft: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  dikirim: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
  dikembalikan: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200",
  disetujui: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  dibuka_kembali: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"
};

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  const key = String(children) as keyof typeof tone;
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", tone[key] ?? "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200", className)}>{children}</span>;
}
