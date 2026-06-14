import { SettingsForm } from "@/components/settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { roleLabels, rolePermissions } from "@/lib/rbac";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Settings Kegiatan</CardTitle>
          <CardDescription>Konfigurasi periode, target, akses, dan penyimpanan file pendukung.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Pengguna</CardTitle>
          <CardDescription>Hak akses operasional MARSADA untuk monitoring internal SE2026.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {Object.entries(roleLabels).map(([role, label]) => (
            <article key={role} className="rounded-3xl border border-[var(--border)] bg-white/55 p-4 dark:bg-white/5">
              <h3 className="font-black">{label}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {rolePermissions[role as keyof typeof rolePermissions].map((permission) => (
                  <span key={permission} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-200">
                    {permission}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
