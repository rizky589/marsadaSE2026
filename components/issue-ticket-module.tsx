"use client";

import { Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { issueTickets } from "@/lib/mock-data";
import type { TicketCategory, TicketUrgency } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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
          <Field label="Desa"><Input defaultValue="Aek Kanopan" /></Field>
          <Field label="SLS"><Input defaultValue="001A" /></Field>
          <Field label="Kategori"><select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 text-sm dark:bg-white/10">{categories.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Urgensi"><select value={urgency} onChange={(e) => setUrgency(e.target.value as TicketUrgency)} className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 text-sm dark:bg-white/10">{urgencies.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Penanggung jawab"><Input placeholder="Diisi admin jika diteruskan" /></Field>
        </div>
        <label className="mt-3 block space-y-2"><span className="text-sm font-bold">Uraian kendala</span><textarea className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 py-3 text-sm dark:bg-white/10" /></label>
        <Button className="mt-4"><Send className="h-4 w-4" /> Kirim Tiket</Button>
      </form>

      <div className="space-y-3">
        {issueTickets.map((ticket) => (
          <article key={ticket.id} className="glass rounded-3xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ff7a1a]">{formatDate(ticket.date)} - {ticket.urgency}</p>
                <h3 className="mt-1 font-black">{ticket.category}</h3>
                <p className="text-sm text-slate-500">{ticket.village} / SLS {ticket.sls}</p>
              </div>
              <Badge>{ticket.status}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{ticket.description}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Button variant="secondary" onClick={() => toast.info("PML menerima dan menindaklanjuti tiket")}>Proses PML</Button>
              <Button variant="secondary" onClick={() => toast.info("Tiket diteruskan ke admin")}>Teruskan Admin</Button>
              <Button onClick={() => toast.success("Kendala ditutup setelah selesai")}><ShieldCheck className="h-4 w-4" /> Tutup</Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-bold">{label}</span>{children}</label>;
}
