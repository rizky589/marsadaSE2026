"use client";

import { Download, FileUp } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { createPetugasLoginAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { numberId } from "@/lib/utils";

type BulkLoginRow = {
  namaPetugas: string;
  jabatan: "PCL" | "PML";
  email: string;
  password: string;
};

type RawBulkRow = Record<string, string | number | boolean | null>;

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeJenis(value: unknown): "PCL" | "PML" {
  return normalizeText(value).toUpperCase() === "PML" ? "PML" : "PCL";
}

export function PetugasLoginCreator() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("annisatul.padlah@bps.go.id");
  const [password, setPassword] = useState("Marsada2026!");
  const [namaPetugas, setNamaPetugas] = useState("Annisatul Padlah");
  const [jenis, setJenis] = useState<"PCL" | "PML">("PCL");
  const [bulkRows, setBulkRows] = useState<BulkLoginRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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

  function downloadTemplate() {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([
      { nama_petugas: "ANNISATUL PADLAH", jenis: "PCL", email: "annisatul.padlah@bps.go.id", password: "Marsada2026!" },
      { nama_petugas: "DIAN AYU UTAMI", jenis: "PML", email: "dian.ayu.utami@bps.go.id", password: "Marsada2026!" }
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Login");
    XLSX.writeFile(workbook, "template-login-petugas.xlsx");
  }

  async function readBulkFile(file: File) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { cellDates: false, raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<RawBulkRow>(sheet, { defval: "", raw: false });
    const mapped = json
      .map((row) => ({
        namaPetugas: normalizeText(row.nama_petugas || row["Nama Petugas"] || row.namaPetugas),
        jabatan: normalizeJenis(row.jabatan || row.Jabatan || row.jenis || row.Jenis),
        email: normalizeText(row.email || row["Email Login"]),
        password: normalizeText(row.password || row["Password Awal"])
      }))
      .filter((row) => row.namaPetugas && row.email && row.password);
    setBulkRows(mapped);
    toast.success(`${numberId(mapped.length)} baris login petugas dibaca`);
  }

  function submitBulk() {
    if (!bulkRows.length) {
      toast.error("Upload template login petugas terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      let success = 0;
      const failed: string[] = [];
      for (const row of bulkRows) {
        try {
          const role = row.jabatan === "PML" ? "pml" : "pcl";
          const result = await createPetugasLoginAction({
            email: row.email,
            password: row.password,
            namaPetugas: row.namaPetugas,
            jenis: row.jabatan,
            role
          });
          if (result.email) success += 1;
        } catch (error) {
          failed.push(`${row.namaPetugas}: ${error instanceof Error ? error.message : "gagal"}`);
        }
      }

      if (success) {
        toast.success(`${numberId(success)} akun petugas berhasil dibuat`);
      }
      if (failed.length) {
        toast.error(`${numberId(failed.length)} akun gagal dibuat`, {
          description: failed.slice(0, 3).join(" | ")
        });
      }
    });
  }

  return (
    <div className="mb-5 space-y-4 rounded-3xl border border-blue-200 bg-blue-50/80 p-4 text-slate-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-slate-50">
      <div>
        <h3 className="font-black text-blue-950 dark:text-blue-100">Buat Akun Login Petugas</h3>
        <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">Gunakan email resmi/aktif petugas. Nama petugas harus cocok dengan data hasil import alokasi.</p>
      </div>

      <section className="rounded-2xl bg-white/70 p-3 dark:bg-slate-950/30">
        <h4 className="font-black">Buat 1 Akun</h4>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
      </section>

      <section className="rounded-2xl bg-white/70 p-3 dark:bg-slate-950/30">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="font-black">Import Banyak Akun</h4>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Header template: nama_petugas, jenis, email, password.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={downloadTemplate}>
              <Download className="h-4 w-4" /> Download Template
            </Button>
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
              <FileUp className="h-4 w-4" /> Upload Excel
            </Button>
            <input ref={inputRef} type="file" className="sr-only" accept=".xlsx,.xls,.csv" onChange={(event) => event.target.files?.[0] && readBulkFile(event.target.files[0])} />
          </div>
        </div>

        {bulkRows.length ? (
          <div className="mt-3 space-y-3">
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-100/80 text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-300">
                  <tr>{["Nama Petugas", "Jenis", "Email", "Password"].map((head) => <th key={head} className="px-3 py-2 font-black">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {bulkRows.slice(0, 8).map((row, index) => (
                    <tr key={`${row.email}-${index}`} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2 font-bold">{row.namaPetugas}</td>
                      <td className="px-3 py-2">{row.jabatan}</td>
                      <td className="px-3 py-2">{row.email}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={submitBulk} disabled={isPending}>
                {isPending ? "Memproses..." : `Buat ${numberId(bulkRows.length)} Akun`}
              </Button>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">Preview menampilkan 8 baris pertama.</span>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
