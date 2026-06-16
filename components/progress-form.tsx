"use client";

import type * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Save, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { getMyPclAssignmentsAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { Assignment } from "@/lib/types";

const activityPeriod = {
  start: "2026-05-01",
  end: "2026-06-30"
};

const numericFields = [
  "visited",
  "completedToday",
  "pending",
  "revisit",
  "notMet",
  "refused",
  "temporarilyClosed",
  "permanentlyClosed",
  "moved",
  "notFound",
  "duplicate",
  "newBusiness"
] as const;

const schema = z
  .object({
    reportDate: z.string().date(),
    assignmentId: z.string().min(1, "Penugasan wajib dipilih"),
    startTime: z.string().min(1, "Jam mulai wajib diisi"),
    endTime: z.string().min(1, "Jam selesai wajib diisi"),
    visited: z.coerce.number().int().min(0),
    completedToday: z.coerce.number().int().min(0),
    pending: z.coerce.number().int().min(0),
    revisit: z.coerce.number().int().min(0),
    notMet: z.coerce.number().int().min(0),
    refused: z.coerce.number().int().min(0),
    temporarilyClosed: z.coerce.number().int().min(0),
    permanentlyClosed: z.coerce.number().int().min(0),
    moved: z.coerce.number().int().min(0),
    notFound: z.coerce.number().int().min(0),
    duplicate: z.coerce.number().int().min(0),
    newBusiness: z.coerce.number().int().min(0),
    note: z.string().max(600).optional(),
    issue: z.string().max(600).optional(),
    followUpPlan: z.string().max(600).optional(),
    documentationName: z.string().optional()
  })
  .superRefine((values, ctx) => {
    if (values.reportDate < activityPeriod.start || values.reportDate > activityPeriod.end) {
      ctx.addIssue({ code: "custom", path: ["reportDate"], message: "Tanggal harus dalam periode kegiatan" });
    }
    if (values.endTime < values.startTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "Jam selesai tidak boleh lebih awal dari jam mulai" });
    }
  });

type Values = z.infer<typeof schema>;
type InputValues = z.input<typeof schema>;

const numberLabels: Record<(typeof numericFields)[number], string> = {
  visited: "Jumlah dikunjungi",
  completedToday: "Jumlah selesai hari ini",
  pending: "Pending",
  revisit: "Kunjungan ulang",
  notMet: "Belum bertemu",
  refused: "Menolak",
  temporarilyClosed: "Tutup sementara",
  permanentlyClosed: "Tutup permanen",
  moved: "Pindah",
  notFound: "Tidak ditemukan",
  duplicate: "Duplikat",
  newBusiness: "Usaha baru"
};

type ImportedRow = {
  kecamatan: string;
  desa: string;
  namaSls: string;
  kodeSubSls: string;
  idSubSls: string;
  targetAwal: number;
  pml: string;
  pcl: string;
};

const importedAllocationsStorageKey = "marsada-imported-allocations";
const dailyReportsStorageKey = "marsada-daily-reports";

type StoredDailyReport = {
  id: string;
  reportDate: string;
  assignmentId: string;
  district: string;
  village: string;
  sls: string;
  subSlsId: string;
  target: number;
  pml: string;
  pcl: string;
  visited: number;
  completedToday: number;
  pending: number;
  startTime: string;
  endTime: string;
  note?: string;
  issue?: string;
  followUpPlan?: string;
  status: "draft" | "dikirim" | "dikembalikan" | "disetujui";
  updatedAt: string;
};

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function nameFromEmail(email: string) {
  return normalize(email.split("@")[0].replace(/[._-]+/g, " "));
}

function toAssignment(row: ImportedRow): Assignment {
  return {
    id: `import-${row.idSubSls}`,
    district: row.kecamatan,
    village: row.desa,
    sls: row.kodeSubSls ? `${row.namaSls} / ${row.kodeSubSls}` : row.namaSls,
    subSlsId: row.idSubSls,
    load: row.targetAwal,
    pml: row.pml,
    pmlId: `pml-${row.pml.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    pcl: row.pcl,
    pclId: `pcl-${row.pcl.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  };
}

export function ProgressForm() {
  const [importAssignments, setImportAssignments] = useState<Assignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const pclAssignments = importAssignments;
  const defaultAssignment = pclAssignments[0];
  const form = useForm<InputValues, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      reportDate: "2026-05-04",
      assignmentId: defaultAssignment?.id ?? "",
      startTime: "08:00",
      endTime: "15:00",
      visited: 0,
      completedToday: 0,
      pending: 0,
      revisit: 0,
      notMet: 0,
      refused: 0,
      temporarilyClosed: 0,
      permanentlyClosed: 0,
      moved: 0,
      notFound: 0,
      duplicate: 0,
      newBusiness: 0,
      note: "",
      issue: "",
      followUpPlan: "",
      documentationName: ""
    }
  });

  useEffect(() => {
    async function loadAssignments() {
      let pclName = "";
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user?.email) pclName = nameFromEmail(data.user.email);
      } catch {
        pclName = "";
      }

      let rows: Assignment[] = [];
      const saved = window.localStorage.getItem(importedAllocationsStorageKey);
      if (saved && pclName) {
        const parsed = JSON.parse(saved) as { rows?: ImportedRow[] };
        rows = (parsed.rows ?? [])
          .filter((row) => row.idSubSls && row.targetAwal > 0 && normalize(row.pcl) === pclName)
          .map(toAssignment);
      }

      try {
        const serverRows = await getMyPclAssignmentsAction();
        if (serverRows.length >= rows.length) rows = serverRows;
      } catch {
        // Local import preview remains available before Supabase is configured.
      }

      setImportAssignments(rows);
      if (rows[0]) form.setValue("assignmentId", rows[0].id);
      setIsLoadingAssignments(false);
    }
    loadAssignments();
  }, [form]);
  const selectedAssignmentId = form.watch("assignmentId");
  const selected = useMemo(() => pclAssignments.find((item) => item.id === selectedAssignmentId), [pclAssignments, selectedAssignmentId]);

  function resolveSubmitIntent(event?: React.BaseSyntheticEvent): "draft" | "dikirim" {
    const submitter = event?.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
    const value = submitter instanceof HTMLButtonElement ? submitter.value : "";
    return value === "dikirim" ? "dikirim" : "draft";
  }

  function onSubmit(values: Values, event?: React.BaseSyntheticEvent) {
    const submitIntent = resolveSubmitIntent(event);
    const assignment = pclAssignments.find((item) => item.id === values.assignmentId);
    if (!assignment) {
      toast.error("Penugasan belum dipilih.");
      return;
    }

    const report: StoredDailyReport = {
      id: `${values.assignmentId}-${values.reportDate}`,
      reportDate: values.reportDate,
      assignmentId: values.assignmentId,
      district: assignment.district,
      village: assignment.village,
      sls: assignment.sls,
      subSlsId: assignment.subSlsId,
      target: assignment.load,
      pml: assignment.pml,
      pcl: assignment.pcl,
      visited: values.visited,
      completedToday: values.completedToday,
      pending: values.pending,
      startTime: values.startTime,
      endTime: values.endTime,
      note: values.note,
      issue: values.issue,
      followUpPlan: values.followUpPlan,
      status: submitIntent,
      updatedAt: new Date().toISOString()
    };
    const saved = window.localStorage.getItem(dailyReportsStorageKey);
    const reports = saved ? JSON.parse(saved) as StoredDailyReport[] : [];
    const nextReports = reports.filter((item) => item.id !== report.id);
    nextReports.unshift(report);
    window.localStorage.setItem(dailyReportsStorageKey, JSON.stringify(nextReports));

    toast.success(submitIntent === "draft" ? "Laporan tersimpan sebagai draft" : `Laporan ${assignment.sls} dikirim ke PML`);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="min-w-0 break-words rounded-3xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900 [overflow-wrap:anywhere] dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
        Progres resmi bertambah setelah PML menyetujui laporan. PCL hanya memilih SLS tugasnya.
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Tanggal</span>
          <Input type="date" {...form.register("reportDate")} />
          {form.formState.errors.reportDate ? <span className="text-xs text-red-600">{form.formState.errors.reportDate.message}</span> : null}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Penugasan/SLS</span>
          <select className="h-11 w-full min-w-0 rounded-2xl border border-[var(--border)] bg-white/80 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-orange-200 dark:bg-slate-900/70 dark:text-slate-50 dark:focus:ring-orange-500/20" {...form.register("assignmentId")}>
            {!pclAssignments.length ? <option value="">{isLoadingAssignments ? "Memuat penugasan..." : "Belum ada penugasan aktif"}</option> : null}
            {pclAssignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.sls} - {assignment.village}
              </option>
            ))}
          </select>
          {form.formState.errors.assignmentId ? <span className="text-xs text-red-600">{form.formState.errors.assignmentId.message}</span> : null}
        </label>
      </div>

      <div className="grid min-w-0 gap-3 rounded-3xl border border-[var(--border)] bg-white/70 p-4 text-slate-900 dark:bg-slate-900/60 dark:text-slate-50 sm:grid-cols-2">
        <ReadonlyField label="Nama kecamatan otomatis" value={selected?.district} />
        <ReadonlyField label="Nama desa otomatis" value={selected?.village} />
        <ReadonlyField label="Nama SLS otomatis" value={selected?.sls} />
        <ReadonlyField label="ID Sub-SLS otomatis" value={selected?.subSlsId} />
        <ReadonlyField label="PML otomatis" value={selected?.pml} />
        <ReadonlyField label="Target SLS otomatis" value={selected?.load.toLocaleString("id-ID")} />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Jam mulai</span>
          <Input type="time" {...form.register("startTime")} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Jam selesai</span>
          <Input type="time" {...form.register("endTime")} />
          {form.formState.errors.endTime ? <span className="text-xs text-red-600">{form.formState.errors.endTime.message}</span> : null}
        </label>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {numericFields.map((field) => (
          <label key={field} className="space-y-2">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{numberLabels[field]}</span>
            <Input type="number" inputMode="numeric" min={0} {...form.register(field)} />
            {form.formState.errors[field] ? <span className="text-xs text-red-600">{form.formState.errors[field]?.message}</span> : null}
          </label>
        ))}
      </div>

      <div className="grid gap-4">
        <TextArea label="Catatan" {...form.register("note")} />
        <TextArea label="Kendala" {...form.register("issue")} />
        <TextArea label="Rencana tindak lanjut" {...form.register("followUpPlan")} />
        <label className="flex min-h-28 flex-col items-center justify-center rounded-3xl border border-dashed border-[#ff7a1a]/60 bg-white/50 p-4 text-center text-sm transition hover:bg-orange-50 dark:bg-white/5">
          <UploadCloud className="mb-2 h-6 w-6 text-[#ff7a1a]" />
          <span className="font-bold">Dokumentasi opsional</span>
          <span className="text-slate-500 dark:text-slate-300">Unggah foto/file pendukung tanpa data responden rahasia</span>
          <input className="sr-only" type="file" accept="image/*,.pdf" onChange={(event) => form.setValue("documentationName", event.target.files?.[0]?.name ?? "")} />
        </label>
      </div>

      <div className="sticky bottom-24 z-10 grid min-w-0 gap-3 rounded-3xl border border-white/70 bg-white/85 p-3 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/80 sm:static sm:flex sm:justify-end sm:bg-transparent sm:p-0 sm:shadow-none">
        <Button type="submit" variant="secondary" value="draft">
          <Save className="h-4 w-4" /> Simpan Draft
        </Button>
        <Button type="submit" value="dikirim">
          <Send className="h-4 w-4" /> Kirim ke PML
        </Button>
      </div>
    </form>
  );
}

function ReadonlyField({ label, value }: { label: string; value?: string | number }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-300">{label}</span>
      <Input readOnly tabIndex={-1} value={value ?? "-"} className="bg-slate-100/80 font-bold text-slate-700 dark:bg-slate-950/60 dark:text-slate-100" />
    </label>
  );
}

function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
      <textarea className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#ff7a1a] focus:ring-2 focus:ring-orange-200 dark:bg-slate-900/70 dark:text-slate-50 dark:focus:ring-orange-500/20" {...props} />
    </label>
  );
}
