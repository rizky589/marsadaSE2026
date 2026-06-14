"use client";

import { AlertTriangle, CheckCircle2, FileUp, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { importAllocationToSupabaseAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { districts } from "@/lib/mock-data";

type RawRow = Record<string, string | number | boolean | null>;
type ImportRow = {
  kecamatan: string;
  desa: string;
  namaSls: string;
  kodeSubSls: string;
  idSubSls: string;
  targetAwal: number;
  flagPbi: string;
  kkOpenPbi: number;
  pml: string;
  pcl: string;
  supervisor?: string;
};

const requiredHeaders = ["nmkec", "nmdesa", "nmsls", "kdsubsls", "idsubsls_25_2", "Muatan", "Flag PBI", "KK Open PBI", "Nama Pengawas", "Nama Pendata"];
const resolvedDifferentPclNames = new Set(["SUGIANTO"]);
const resolutionStorageKey = "marsada-import-resolutions";
const importedAllocationsStorageKey = "marsada-imported-allocations";

function normalize(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function toNumber(value: unknown) {
  const parsed = Number(String(value ?? "0").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function UploadImporter() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [excludeZeroTargets, setExcludeZeroTargets] = useState(false);
  const [fileName, setFileName] = useState("alokasi.xlsx");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(resolutionStorageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { targetZeroDecision?: "isi-target" | "tidak-aktif" };
      setExcludeZeroTargets(parsed.targetZeroDecision === "tidak-aktif");
    } catch {
      window.localStorage.removeItem(resolutionStorageKey);
    }
  }, []);

  async function readFile(file: File) {
    setFileName(file.name);
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { cellDates: false, raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "", raw: false });
    const detectedHeaders = Object.keys(json[0] ?? {}).map((header) => header.trim()).filter(Boolean);
    setHeaders(detectedHeaders);
    const mapped = json
      .filter((row) => Object.values(row).some((value) => String(value ?? "").trim()))
      .map((row) => ({
        kecamatan: normalize(row.nmkec),
        desa: normalize(row.nmdesa),
        namaSls: normalize(row.nmsls),
        kodeSubSls: toText(row.kdsubsls),
        idSubSls: toText(row.idsubsls_25_2),
        targetAwal: toNumber(row.Muatan),
        flagPbi: toText(row["Flag PBI"]),
        kkOpenPbi: toNumber(row["KK Open PBI"]),
        pml: normalize(row["Nama Pengawas"]),
        pcl: normalize(row["Nama Pendata"]),
        supervisor: normalize(row.Supervisor || row["Supervisor jika tersedia"])
      }));
    setRows(mapped);
    toast.success(`${mapped.length} baris alokasi dibaca`);
  }

  const activeRows = useMemo(() => (excludeZeroTargets ? rows.filter((row) => row.targetAwal > 0) : rows), [excludeZeroTargets, rows]);
  const inactiveRows = useMemo(() => rows.filter((row) => row.targetAwal <= 0), [rows]);
  const validation = useMemo(() => validateImport(activeRows, headers), [activeRows, headers]);

  function markZeroTargetsInactive() {
    setExcludeZeroTargets(true);
    const saved = window.localStorage.getItem(resolutionStorageKey);
    const current = saved ? JSON.parse(saved) as Record<string, unknown> : {};
    window.localStorage.setItem(resolutionStorageKey, JSON.stringify({ ...current, targetZeroDecision: "tidak-aktif" }));
    toast.success("Baris muatan 0 dikeluarkan dari import aktif", {
      description: "Baris tetap dicatat sebagai keputusan admin dan tidak dihitung sebagai penugasan aktif."
    });
  }

  function saveImport() {
    if (!validation.canSave) {
      toast.error(validation.blockingErrors[0] ?? "Validasi belum memenuhi syarat");
      return;
    }

    const saved = window.localStorage.getItem(resolutionStorageKey);
    const decisions = saved ? JSON.parse(saved) as { sugiantoDifferentPcl?: boolean; targetZeroDecision?: "isi-target" | "tidak-aktif" } : {};

    startTransition(async () => {
      try {
        const result = await importAllocationToSupabaseAction({
          fileName,
          rows: activeRows,
          decisions
        });
        window.localStorage.setItem(importedAllocationsStorageKey, JSON.stringify({
          savedAt: new Date().toISOString(),
          rows: activeRows,
          importBatchId: result.importBatchId
        }));
        toast.success("Import alokasi berhasil disimpan ke Supabase", {
          description: `${result.rowCount.toLocaleString("id-ID")} baris aktif, total target ${result.totalTarget.toLocaleString("id-ID")}.`
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Import ke Supabase gagal");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex min-h-52 flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#ff7a1a]/60 bg-white/60 p-6 text-center transition hover:bg-orange-50 dark:bg-white/5 dark:hover:bg-white/10">
        <UploadCloud className="mb-3 h-10 w-10 text-[#ff7a1a]" />
        <span className="text-lg font-black">Import Alokasi Excel</span>
        <span className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-300">
          Header wajib: nmkec, nmdesa, nmsls, kdsubsls, idsubsls_25_2, Muatan, Flag PBI, KK Open PBI, Nama Pengawas, Nama Pendata.
        </span>
        <Button className="mt-5" onClick={() => inputRef.current?.click()}>
          <FileUp className="h-4 w-4" /> Pilih File Alokasi
        </Button>
        <button type="button" className="mt-3 text-sm font-bold text-[#ff7a1a] underline-offset-4 hover:underline" onClick={() => inputRef.current?.click()}>
          atau klik di sini untuk membuka file
        </button>
        <input ref={inputRef} className="sr-only" type="file" accept=".xlsx,.xls,.xlsm,.csv" onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])} />
      </div>

      {rows.length ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Summary label="Baris Aktif" value={activeRows.length} ok />
            <Summary label="Baris Tidak Aktif" value={excludeZeroTargets ? inactiveRows.length : 0} ok={inactiveRows.length === 0 || excludeZeroTargets} />
            <Summary label="PML Unik" value={validation.pmlCount} ok={validation.pmlCount === 35} />
            <Summary label="PCL Unik" value={validation.pclCount} ok={validation.pclCount === 266} />
            <Summary label="Total Target" value={validation.totalTarget} ok={validation.totalTarget > 0} />
            <Summary label="Duplikasi ID" value={validation.duplicateIds.length} ok={validation.duplicateIds.length === 0} />
            <Summary label="PCL Multi-PML" value={validation.multiPmlPcls.length} ok={validation.multiPmlPcls.length === 0} />
            <Summary label="Nama Sama" value={validation.sameNames.length} ok={validation.sameNames.length === 0} />
            <Summary label="Error Blokir" value={validation.blockingErrors.length} ok={validation.blockingErrors.length === 0} />
            <Summary label="Peringatan" value={validation.warnings.length} ok={validation.warnings.length === 0} />
          </section>

          <div className="rounded-3xl border border-[var(--border)] bg-white/55 p-4 dark:bg-white/5">
            <h3 className="font-black">Validasi Akhir</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {validation.checks.map((check) => (
                <div key={check.label} className="flex items-center gap-2 text-sm">
                  {check.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-orange-600" />}
                  <span>{check.label}</span>
                </div>
              ))}
            </div>
          </div>

          {validation.warnings.length ? (
            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
              <p className="font-black">Peringatan untuk direview admin</p>
              <ul className="mt-2 list-disc pl-5">{validation.warnings.slice(0, 8).map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </div>
          ) : null}

          {inactiveRows.length && !excludeZeroTargets ? (
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
              <p className="font-black">Baris muatan 0 ditemukan</p>
              <p className="mt-2">Baris 436 harus diberi target positif atau dikeluarkan dari import aktif.</p>
              <Button className="mt-4" onClick={markZeroTargetsInactive}>
                Tandai Muatan 0 Tidak Aktif
              </Button>
            </div>
          ) : null}

          {excludeZeroTargets && inactiveRows.length ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
              <p className="font-black">Muatan 0 tidak masuk penugasan aktif</p>
              <p className="mt-2">{inactiveRows.length} baris dikeluarkan dari import aktif berdasarkan keputusan admin.</p>
            </div>
          ) : null}

          {validation.blockingErrors.length ? (
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
              <p className="font-black">Perlu diperbaiki sebelum simpan transaction</p>
              <ul className="mt-2 list-disc pl-5">{validation.blockingErrors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-3xl border border-[var(--border)]">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-slate-100/80 dark:bg-white/5">
                <tr>{["Kecamatan", "Desa", "SLS", "Kode Sub-SLS", "ID Sub-SLS", "Target", "Flag PBI", "KK Open PBI", "PML", "PCL"].map((key) => <th key={key} className="px-4 py-3 text-left font-black">{key}</th>)}</tr>
              </thead>
              <tbody>{activeRows.slice(0, 20).map((row, index) => <tr key={`${row.idSubSls}-${index}`} className="border-t border-[var(--border)]"><td className="px-4 py-3">{row.kecamatan}</td><td className="px-4 py-3">{row.desa}</td><td className="px-4 py-3">{row.namaSls}</td><td className="px-4 py-3">{row.kodeSubSls}</td><td className="px-4 py-3 font-mono">{row.idSubSls}</td><td className="px-4 py-3">{row.targetAwal}</td><td className="px-4 py-3">{row.flagPbi}</td><td className="px-4 py-3">{row.kkOpenPbi}</td><td className="px-4 py-3">{row.pml}</td><td className="px-4 py-3">{row.pcl}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      ) : null}
      <Button onClick={saveImport} disabled={isPending}>{isPending ? "Menyimpan ke Supabase..." : "Konfirmasi Admin dan Simpan"}</Button>
    </div>
  );
}

function validateImport(rows: ImportRow[], headers: string[]) {
  const blockingErrors: string[] = [];
  const warnings: string[] = [];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) blockingErrors.push(`Header hilang: ${missingHeaders.join(", ")}`);
  const ids = rows.map((row) => row.idSubSls).filter(Boolean);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const pmlByPcl = new Map<string, Set<string>>();
  rows.forEach((row, index) => {
    if (!row.idSubSls) blockingErrors.push(`Baris ${index + 2}: ID Sub-SLS kosong`);
    if (row.targetAwal <= 0) blockingErrors.push(`Baris ${index + 2}: muatan harus positif`);
    if (!row.kecamatan || !row.desa || !row.namaSls || !row.pml || !row.pcl) blockingErrors.push(`Baris ${index + 2}: ada kolom wajib kosong`);
    if (!pmlByPcl.has(row.pcl)) pmlByPcl.set(row.pcl, new Set());
    pmlByPcl.get(row.pcl)?.add(row.pml);
  });
  const multiPmlPcls = [...pmlByPcl.entries()].filter(([, pmls]) => pmls.size > 1).map(([pcl]) => pcl);
  const unresolvedMultiPmlPcls = multiPmlPcls.filter((pcl) => !resolvedDifferentPclNames.has(pcl));
  const resolvedMultiPmlPcls = multiPmlPcls.filter((pcl) => resolvedDifferentPclNames.has(pcl));
  const pmlNames = new Set(rows.map((row) => row.pml).filter(Boolean));
  const pclNames = new Set(rows.map((row) => row.pcl).filter(Boolean));
  const sameNames = [...pclNames].filter((name) => pmlNames.has(name));
  const districtCount = new Set(rows.map((row) => row.kecamatan)).size;
  const pmlCount = pmlNames.size;
  const pclCount = pclNames.size;
  const totalTarget = rows.reduce((sum, row) => sum + row.targetAwal, 0);
  if (districtCount !== 8) warnings.push(`Jumlah kecamatan terdeteksi ${districtCount}, seharusnya 8`);
  if (pmlCount !== 35) warnings.push(`Jumlah PML terdeteksi ${pmlCount}, target awal 35. Review apakah ada PML tambahan atau variasi nama.`);
  if (pclCount !== 266) warnings.push(`Jumlah PCL terdeteksi ${pclCount}, target awal 266. Review apakah ada petugas tambahan atau nama sama orang berbeda.`);
  if (resolvedMultiPmlPcls.length) {
    warnings.push(`PCL nama sama sudah diputuskan sebagai orang berbeda: ${resolvedMultiPmlPcls.join(", ")}`);
  }
  if (unresolvedMultiPmlPcls.length) {
    blockingErrors.push(`PCL memiliki lebih dari satu PML dan belum diselesaikan: ${unresolvedMultiPmlPcls.slice(0, 5).join(", ")}${unresolvedMultiPmlPcls.length > 5 ? ", ..." : ""}`);
  }
  if (sameNames.length) {
    blockingErrors.push(`Nama muncul sebagai PML dan PCL: ${sameNames.slice(0, 5).join(", ")}${sameNames.length > 5 ? ", ..." : ""}`);
  }
  const checks = [
    { label: "8 kecamatan", ok: districtCount === 8 || (rows.length > 0 && districts.every((district) => rows.some((row) => row.kecamatan === district.toUpperCase()))) },
    { label: "35 PML atau sudah direview admin", ok: pmlCount === 35 },
    { label: "266 PCL atau sudah direview admin", ok: pclCount === 266 },
    { label: "PCL memiliki satu PML aktif atau sudah dipisah identitas", ok: unresolvedMultiPmlPcls.length === 0 },
    { label: "PCL memiliki wilayah tugas", ok: rows.every((row) => row.pcl && row.idSubSls) },
    { label: "Target tidak kosong dan positif", ok: rows.every((row) => row.targetAwal > 0) },
    { label: "Tidak ada ID Sub-SLS kosong", ok: rows.every((row) => row.idSubSls) },
    { label: "Tidak ada baris kosong", ok: rows.every((row) => Object.values(row).some(Boolean)) },
    { label: "Tidak ada duplikasi tidak sah", ok: duplicateIds.length === 0 }
  ];
  const blockingChecksOk = rows.every((row) => row.pcl && row.idSubSls && row.targetAwal > 0) && duplicateIds.length === 0 && unresolvedMultiPmlPcls.length === 0;
  return { blockingErrors, warnings, duplicateIds, multiPmlPcls, sameNames, pmlCount, pclCount, totalTarget, checks, canSave: rows.length > 0 && blockingErrors.length === 0 && blockingChecksOk };
}

function Summary({ label, value, ok }: { label: string; value: number; ok: boolean }) {
  return <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-4 dark:bg-white/5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-slate-500">{label}</p><Badge>{ok ? "Aman" : "Perlu Perhatian"}</Badge></div><p className="mt-2 text-2xl font-black">{value.toLocaleString("id-ID")}</p></div>;
}
