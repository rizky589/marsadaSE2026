"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createPetugasLoginAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PetugasLoginCreator() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("annisatul.padlah@bps.go.id");
  const [password, setPassword] = useState("Marsada2026!");
  const [namaPetugas, setNamaPetugas] = useState("Annisatul Padlah");
  const [jenis, setJenis] = useState<"PCL" | "PML">("PCL");

  function submit() {
    startTransition(async () => {
      try {
        const role = jenis === "PML" ? "pml" : "pcl";
        const result = await createPetugasLoginAction({ email, password, namaPetugas, jenis, role });
        toast.success(`Akun ${result.namaPetugas} berhasil dibuat`, {
          description: `${result.email} sudah terhubung sebagai ${result.role.toUpperCase()}.`
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal membuat akun petugas");
      }
    });
  }

  return (
    <div className="mb-5 rounded-3xl border border-blue-200 bg-blue-50/80 p-4 text-slate-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-slate-50">
      <div className="mb-4">
        <h3 className="font-black text-blue-950 dark:text-blue-100">Buat 1 Akun Login Petugas</h3>
        <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
          Gunakan email resmi/aktif petugas. Hindari email dummy seperti @marsada.local untuk produksi.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Nama Petugas</span>
          <Input value={namaPetugas} onChange={(event) => setNamaPetugas(event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Jenis</span>
          <select className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 text-sm font-semibold text-slate-900 outline-none dark:bg-slate-900/70 dark:text-slate-50" value={jenis} onChange={(event) => setJenis(event.target.value as "PCL" | "PML")}>
            <option value="PCL">PCL</option>
            <option value="PML">PML</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Email Login</span>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Password Awal</span>
          <Input type="text" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <div className="flex items-end">
          <Button className="w-full" onClick={submit} disabled={isPending}>
            {isPending ? "Membuat..." : "Buat Akun"}
          </Button>
        </div>
      </div>
    </div>
  );
}
