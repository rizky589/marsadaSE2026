"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { syncCurrentUserProfileAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dashboardPathForRole } from "@/lib/role-routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Minimal 8 karakter")
});

type FormValues = z.infer<typeof schema>;
type ProfileRole = { role?: string | null };

function fallbackRoleFromEmail(email: string) {
  const emailLocal = email.split("@")[0].toLowerCase();
  return emailLocal.includes("admin") ? "admin_kabupaten" : emailLocal.includes("pml") ? "pml" : "pcl";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), timeoutMs);
  });
  const result = await Promise.race([promise, timeout]);
  if (timeoutId) clearTimeout(timeoutId);
  return result as T | null;
}

export function AuthForm({ mode, compact = false }: { mode: "login" | "register"; compact?: boolean }) {
  const router = useRouter();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: FormValues) {
    try {
      const supabase = createClient();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword(values)
          : await supabase.auth.signUp({ email: values.email, password: values.password });

      if (result.error) throw result.error;
      const fallbackRole = fallbackRoleFromEmail(values.email);
      let profile: ProfileRole | null = null;

      if (mode === "login" && result.data.user) {
        const quickProfile = await withTimeout(
          Promise.resolve(supabase.from("profiles").select("role").eq("id", result.data.user.id).maybeSingle()),
          900
        );
        profile = quickProfile?.data as ProfileRole | null;

        if (!profile?.role) {
          profile = await withTimeout(syncCurrentUserProfileAction(), 1200);
        }
      }

      const targetPath = dashboardPathForRole(profile?.role ?? fallbackRole);
      toast.success(mode === "login" ? "Berhasil masuk" : "Registrasi berhasil");
      router.push(mode === "login" ? targetPath : "/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Supabase belum dikonfigurasi");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn(compact ? "space-y-3" : "space-y-4")}>
      <label className={cn("block", compact ? "space-y-1.5" : "space-y-2")}>
        <span className="text-sm font-semibold">Email</span>
        <div className="relative">
          <Mail className={cn("pointer-events-none absolute left-4 text-slate-400", compact ? "top-2.5 h-4 w-4" : "top-3 h-5 w-5")} />
          <Input className={cn("text-slate-950", compact ? "h-10 rounded-xl pl-10" : "pl-12")} placeholder="nama@bps.go.id" {...form.register("email")} />
        </div>
        {form.formState.errors.email ? <span className="text-xs text-orange-200">{form.formState.errors.email.message}</span> : null}
      </label>
      <label className={cn("block", compact ? "space-y-1.5" : "space-y-2")}>
        <span className="text-sm font-semibold">Kata sandi</span>
        <div className="relative">
          <Lock className={cn("pointer-events-none absolute left-4 text-slate-400", compact ? "top-2.5 h-4 w-4" : "top-3 h-5 w-5")} />
          <Input className={cn("text-slate-950", compact ? "h-10 rounded-xl pl-10" : "pl-12")} type="password" placeholder="Minimal 8 karakter" {...form.register("password")} />
        </div>
        {form.formState.errors.password ? <span className="text-xs text-orange-200">{form.formState.errors.password.message}</span> : null}
      </label>
      <Button className={cn("w-full", compact && "h-10 rounded-xl")} disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
      </Button>
    </form>
  );
}
