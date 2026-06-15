"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TicketCategory, TicketUrgency } from "@/lib/types";

const categories: TicketCategory[] = ["responden sulit ditemui", "penolakan", "wilayah sulit dijangkau", "target tidak sesuai", "muatan tidak ditemukan", "aplikasi resmi bermasalah", "jaringan internet", "akun petugas", "perangkat", "administrasi", "lainnya"];
const urgencies: TicketUrgency[] = ["rendah", "sedang", "tinggi", "kritis"];

export function IssueTicketModule() {
  const [category, setCategory] = useState<TicketCategory>("responden sulit ditemui");
  const [urgency, setUrgency] = useState<TicketUrgency>("sedang");

  return (
    <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <form className="glass rounded-3xl p-5" onSubmit={(event) => { event.preventDefault(); toast.success("Tiket kendala dibuat", { description: "PML menerima notifikasi untuk menindaklanjuti." }); }}>
        <h3 className="text-lg font-black">Buat Tiket Kendala</h3>
        <p className="mt-1 text-sm text-slate-500">PCL membuat tiket, PML menindaklanjuti, admin dapat menetapkan penanggung jawab.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Tanggal"><Input type="date" defaultValue="2026-05-04" /></Field>
          <Field label="Desa"><Input placeholder="Nama desa/kelurahan" /></Field>
          <Field label="SLS"><Input placeholder="SLS/Sub-SLS" /></Field>
          <Field label="Kategori"><select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 text-sm dark:bg-white/10">{categories.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Urgensi"><select value={urgency} onChange={(e) => setUrgency(e.target.value as TicketUrgency)} className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 text-sm dark:bg-white/10">{urgencies.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Penanggung jawab"><Input placeholder="Diisi admin jika diteruskan" /></Field>
        </div>
        <label className="mt-3 block space-y-2"><span className="text-sm font-bold">Uraian kendala</span><textarea className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 py-3 text-sm dark:bg-white/10" /></label>
        <Button className="mt-4"><Send className="h-4 w-4" /> Kirim Tiket</Button>
      </form>

      <div className="glass flex min-h-64 items-center justify-center rounded-3xl p-5 text-center">
        <div>
          <h3 className="font-black">Belum Ada Tiket Kendala</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-300">
            Data contoh lama sudah dihapus. Tiket kendala akan tampil di sini setelah PCL/PML membuat tiket.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-bold">{label}</span>{children}</label>;
}
