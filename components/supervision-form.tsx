"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadImportedAllocations, resolvePclName, titleCase, type ImportedAllocationRow } from "@/lib/imported-allocations";

const schema = z.object({
  date: z.string().date(),
  assignmentId: z.string().min(1),
  type: z.string().min(3),
  inspectedObjects: z.coerce.number().int().min(0),
  result: z.string().min(5),
  matched: z.coerce.number().int().min(0),
  needFix: z.coerce.number().int().min(0),
  issue: z.string().max(600).optional(),
  direction: z.string().max(600).optional(),
  followUp: z.string().max(600).optional(),
  followUpStatus: z.enum(["belum ditindaklanjuti", "diproses", "selesai"]),
  documentationName: z.string().optional()
});

type Values = z.infer<typeof schema>;
type InputValues = z.input<typeof schema>;

export function SupervisionForm() {
  const [assignments, setAssignments] = useState<ImportedAllocationRow[]>([]);
  const form = useForm<InputValues, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: "2026-05-04",
      assignmentId: "",
      type: "Pemeriksaan lapangan",
      inspectedObjects: 0,
      result: "",
      matched: 0,
      needFix: 0,
      issue: "",
      direction: "",
      followUp: "",
      followUpStatus: "belum ditindaklanjuti",
      documentationName: ""
    }
  });

  useEffect(() => {
    const importedRows = loadImportedAllocations();
    setAssignments(importedRows);
    if (importedRows[0]) form.setValue("assignmentId", importedRows[0].idSubSls);
  }, [form]);

  const selected = useMemo(() => assignments.find((item) => item.idSubSls === form.watch("assignmentId")), [assignments, form.watch("assignmentId")]);

  function onSubmit(values: Values) {
    toast.success("Pengawasan PML tersimpan", {
      description: values.documentationName ? "Foto siap disimpan ke private bucket Supabase Storage." : "Catatan pengawasan tercatat."
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal"><Input type="date" {...form.register("date")} /></Field>
        <Field label="Penugasan">
          <select className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 text-sm dark:bg-white/10" {...form.register("assignmentId")}>
            {!assignments.length ? <option value="">Belum ada alokasi import</option> : null}
            {assignments.map((item) => <option key={item.idSubSls} value={item.idSubSls}>{titleCase(resolvePclName(item.pcl, item.pml))} - {titleCase(item.namaSls)} / {item.kodeSubSls}</option>)}
          </select>
        </Field>
        <Readonly label="Nama PML" value={selected ? titleCase(selected.pml) : undefined} />
        <Readonly label="Nama PCL" value={selected ? titleCase(resolvePclName(selected.pcl, selected.pml)) : undefined} />
        <Readonly label="Kecamatan" value={selected ? titleCase(selected.kecamatan) : undefined} />
        <Readonly label="Desa" value={selected ? titleCase(selected.desa) : undefined} />
        <Readonly label="SLS" value={selected ? `${titleCase(selected.namaSls)} / ${selected.kodeSubSls}` : undefined} />
        <Field label="Jenis pengawasan"><Input {...form.register("type")} /></Field>
        <Field label="Jumlah objek diperiksa"><Input type="number" min={0} {...form.register("inspectedObjects")} /></Field>
        <Field label="Jumlah sesuai"><Input type="number" min={0} {...form.register("matched")} /></Field>
        <Field label="Jumlah perlu perbaikan"><Input type="number" min={0} {...form.register("needFix")} /></Field>
        <Field label="Status tindak lanjut"><select className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 text-sm dark:bg-white/10" {...form.register("followUpStatus")}><option>belum ditindaklanjuti</option><option>diproses</option><option>selesai</option></select></Field>
      </div>
      <TextArea label="Hasil pemeriksaan" {...form.register("result")} />
      <TextArea label="Kendala" {...form.register("issue")} />
      <TextArea label="Arahan" {...form.register("direction")} />
      <TextArea label="Tindak lanjut" {...form.register("followUp")} />
      <label className="flex min-h-28 flex-col items-center justify-center rounded-3xl border border-dashed border-[#ff7a1a]/60 bg-white/50 p-4 text-center text-sm dark:bg-white/5">
        <Camera className="mb-2 h-6 w-6 text-[#ff7a1a]" />
        <span className="font-bold">Foto dokumentasi</span>
        <span className="text-slate-500">Disimpan ke Supabase Storage private bucket</span>
        <input className="sr-only" type="file" accept="image/*" onChange={(event) => form.setValue("documentationName", event.target.files?.[0]?.name ?? "")} />
      </label>
      <Button><Save className="h-4 w-4" /> Simpan Pengawasan</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-bold">{label}</span>{children}</label>;
}

function Readonly({ label, value }: { label: string; value?: string }) {
  return <Field label={label}><Input readOnly value={value ?? "-"} className="bg-slate-100/80 font-bold dark:bg-white/10" /></Field>;
}

function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="block space-y-2"><span className="text-sm font-bold">{label}</span><textarea className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 py-3 text-sm outline-none focus:border-[#ff7a1a] dark:bg-white/10" {...props} /></label>;
}
