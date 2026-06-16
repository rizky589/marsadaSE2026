"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Bell, Check, ChevronDown, ClipboardCheck, FileSpreadsheet, FileText, Home, LogOut, Map, Menu, Settings, ShieldCheck, Upload, UserRound, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { syncCurrentUserProfileAction } from "@/app/actions";
import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { dashboardPathForRole, formatRoleLabel } from "@/lib/role-routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type NavItem = { href: Route; label: string; icon: typeof Home; roles?: string[] };
type Account = {
  name: string;
  email: string;
  role: string;
};
type ProfileRecord = {
  nama_lengkap?: string | null;
  full_name?: string | null;
  role?: string | null;
};

function normalizeAccountRole(role: string | null | undefined, email: string | undefined) {
  if (role && role !== "user") return role;
  const local = email?.split("@")[0]?.toLowerCase() ?? "";
  if (local.includes("admin")) return "admin_kabupaten";
  if (local.includes("pml")) return "pml";
  return "pcl";
}

const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home, roles: ["super_admin", "admin_kabupaten"] },
  { href: "/dashboard-pcl", label: "PCL", icon: BarChart3, roles: ["pcl", "super_admin", "admin_kabupaten"] },
  { href: "/dashboard-pml", label: "PML", icon: ClipboardCheck, roles: ["pml", "super_admin", "admin_kabupaten"] },
  { href: "/petugas", label: "Petugas", icon: Users, roles: ["super_admin", "admin_kabupaten"] },
  { href: "/upload", label: "Import", icon: Upload, roles: ["super_admin", "admin_kabupaten"] },
  { href: "/alokasi", label: "Alokasi", icon: FileSpreadsheet, roles: ["pcl", "pml", "koordinator_kecamatan", "pimpinan", "super_admin", "admin_kabupaten"] },
  { href: "/master-wilayah", label: "Wilayah", icon: Map, roles: ["koordinator_kecamatan", "super_admin", "admin_kabupaten"] },
  { href: "/penugasan", label: "Penugasan", icon: ClipboardCheck, roles: ["super_admin", "admin_kabupaten"] },
  { href: "/progres", label: "Progres", icon: BarChart3, roles: ["pcl", "super_admin", "admin_kabupaten"] },
  { href: "/pemeriksaan", label: "Pemeriksaan", icon: ClipboardCheck, roles: ["pml", "super_admin", "admin_kabupaten"] },
  { href: "/pengawasan", label: "Pengawasan", icon: ShieldCheck, roles: ["pml", "super_admin", "admin_kabupaten"] },
  { href: "/rekap", label: "Rekap", icon: FileText, roles: ["pml", "koordinator_kecamatan", "pimpinan", "super_admin", "admin_kabupaten"] },
  { href: "/profil", label: "Profil", icon: UserRound, roles: ["koordinator_kecamatan", "pimpinan", "super_admin", "admin_kabupaten", "user"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["super_admin", "admin_kabupaten"] }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [account, setAccount] = useState<Account>({
    name: "Admin Kabupaten",
    email: "admin@marsada.local",
    role: "admin_kabupaten"
  });
  const visibleNav = nav.filter((item) => !item.roles || item.roles.includes(account.role));
  const current = nav.find((item) => item.href === pathname)?.label ?? "MARSADA";

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user || !active) return;

        let profileRecord: ProfileRecord | null = null;
        const { data: profile } = await supabase
          .from("profiles")
          .select("nama_lengkap, role")
          .eq("id", user.id)
          .maybeSingle();
        profileRecord = profile as ProfileRecord | null;

        if (!profileRecord) {
          const { data: legacyProfile } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .maybeSingle();
          profileRecord = legacyProfile as ProfileRecord | null;
        }

        const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined;
        if (!profileRecord?.role) {
          const synced = await syncCurrentUserProfileAction();
          profileRecord = {
            nama_lengkap: synced.nama_lengkap,
            role: synced.role
          };
        }
        const normalizedRole = normalizeAccountRole(profileRecord?.role, user.email);
        setAccount({
          name: profileRecord?.nama_lengkap || profileRecord?.full_name || metadataName || user.email?.split("@")[0] || "Pengguna MARSADA",
          email: user.email ?? "email belum tersedia",
          role: normalizedRole
        });
      } catch {
        // Supabase may be unavailable in local mock mode; keep a safe fallback.
      }
    }

    loadAccount();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const target = dashboardPathForRole(account.role);
    const shouldRedirect =
      (account.role === "pcl" && pathname === "/dashboard") ||
      (account.role === "pml" && pathname === "/dashboard") ||
      (account.role === "pimpinan" && pathname === "/dashboard");
    if (shouldRedirect) router.replace(target);
  }, [account.role, pathname, router]);

  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // If Supabase is not configured, still return to login for local preview.
    }
    setAccountOpen(false);
    router.replace("/login");
    router.refresh();
  }

  const MenuList = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn("space-y-1", !mobile && "pr-1")}>
      {visibleNav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all hover:bg-orange-50 hover:text-[#ff7a1a] dark:hover:bg-white/10",
              active ? "bg-[#0b2a4a] text-white shadow-lg shadow-blue-950/10 dark:bg-blue-200 dark:text-slate-950" : "text-slate-600 dark:text-slate-300",
              mobile && "py-4"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <aside className="fixed left-4 top-4 z-30 hidden h-[calc(100vh-2rem)] w-72 flex-col rounded-[2rem] border border-white/60 bg-white/70 p-4 shadow-2xl shadow-blue-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/50 lg:flex">
        <Link href="/dashboard" className="mb-5 block shrink-0 px-2 py-3">
          <BrandLockup />
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
          <MenuList />
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/60 lg:ml-80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff7a1a]"></p>
            <h1 className="truncate text-xl font-black text-slate-950 dark:text-white sm:text-2xl">{current}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Notifikasi">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1.5 text-left transition hover:bg-orange-50 hover:text-[#ff7a1a] dark:hover:bg-white/10"
                aria-expanded={accountOpen}
                aria-label="Buka menu akun"
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                  <UserRound className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-[220px] truncate text-sm font-black text-slate-950 dark:text-white">{account.name}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
                    {formatRoleLabel(account.role)} <ChevronDown className={cn("h-3.5 w-3.5 transition", accountOpen && "rotate-180")} />
                  </span>
                </span>
              </button>

              <AnimatePresence>
                {accountOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-14 z-50 w-[calc(100vw-2rem)] max-w-80 overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-blue-950/20 dark:border-white/10 dark:bg-slate-950"
                  >
                    <div className="bg-violet-700 p-5 text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black">Signed in as</p>
                          <p className="truncate text-sm font-bold">{account.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      {!["pcl", "pml"].includes(account.role) ? (
                        <>
                          <Link href="/profil" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-[#ff7a1a] dark:text-slate-200 dark:hover:bg-white/10">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
                              <UserRound className="h-4 w-4" />
                            </span>
                            Profile Saya
                          </Link>
                          <div className="my-2 h-px bg-slate-100 dark:bg-white/10" />
                        </>
                      ) : null}
                      <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Ganti Peran</p>
                      <button type="button" className="flex w-full items-center justify-between rounded-2xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                        <span className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-blue-600" /> {formatRoleLabel(account.role)}</span>
                        <Check className="h-4 w-4" />
                      </button>
                      <button type="button" className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-orange-50 hover:text-[#ff7a1a] dark:text-slate-300 dark:hover:bg-white/10">
                        <span className="h-2 w-2 rounded-full bg-slate-300" /> Pimpinan
                      </button>
                      <div className="my-2 h-px bg-slate-100 dark:bg-white/10" />
                      <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10">
                          <LogOut className="h-4 w-4" />
                        </span>
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            <Button variant="secondary" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="lg:ml-80">
        <div className="mx-auto min-w-0 max-w-7xl overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>

      <div className="fixed bottom-3 left-3 right-3 z-20 grid min-w-0 grid-cols-[repeat(5,minmax(0,1fr))] rounded-[1.5rem] border border-white/70 bg-white/85 p-2 shadow-2xl shadow-blue-950/12 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/80 lg:hidden">
        {visibleNav.slice(0, 5).map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-bold transition", active ? "bg-[#0b2a4a] text-white" : "text-slate-500 hover:text-[#ff7a1a]")}>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.aside className="absolute right-0 top-0 h-full w-[86vw] max-w-sm bg-white p-5 shadow-2xl dark:bg-slate-950" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 240 }}>
              <div className="mb-6 flex items-center justify-between">
                <BrandLockup subtitle="SE2026 Labura" />
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Tutup menu">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <MenuList mobile />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
