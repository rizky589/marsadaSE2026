"use client";

import { AlertTriangle, ArrowRightLeft, FileSpreadsheet, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const resolutionStorageKey = "marsada-import-resolutions";

const duplicates = [
  {
    name: "SUGIANTO",
    issue: "Nama SUGIANTO terdeteksi pada dua tim PML, dan keduanya dikonfirmasi sebagai PCL yang berbeda",
    recommendation: "Pertahankan role keduanya sebagai PCL. Pisahkan menjadi dua identitas internal agar import tidak menggabungkan keduanya sebagai satu PCL. Nama tampilan tetap dapat memakai SUGIANTO, tetapi kode/alias internal harus berbeda.",
    details: ["ISMAIL MUNTHE: 4 SLS/Sub-SLS", "RAHMAT PAUJI HASIBUAN: 4 SLS/Sub-SLS"],
    resolution: ["SUGIANTO - TIM ISMAIL MUNTHE", "SUGIANTO - TIM RAHMAT PAUJI HASIBUAN"]
  }
];

const allocationIssues = [
  {
    title: "Muatan 0 pada alokasi",
    issue: "Baris 436 belum dapat dijadikan penugasan aktif karena target harus positif.",
    recommendation: "Isi target aktual jika wilayah tetap dikerjakan, atau tandai sebagai tidak aktif/dikeluarkan dari import aktif jika memang tidak memiliki muatan.",
    details: ["KUALUH LEIDONG / TELUK PULAI LUAR", "SLS PERSIAPAN", "ID Sub-SLS 1223080003100100", "PML DEDI HENRI TANJUNG", "PCL ANWAR SIDDIK"]
  }
];

export default function DuplikasiPetugasPage() {
  const [savedDifferentPeople, setSavedDifferentPeople] = useState(false);
  const [targetDecision, setTargetDecision] = useState<"isi-target" | "tidak-aktif" | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(resolutionStorageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { sugiantoDifferentPcl?: boolean; targetZeroDecision?: "isi-target" | "tidak-aktif" };
      setSavedDifferentPeople(Boolean(parsed.sugiantoDifferentPcl));
      setTargetDecision(parsed.targetZeroDecision ?? null);
    } catch {
      window.localStorage.removeItem(resolutionStorageKey);
    }
  }, []);

  function saveResolution(update: { sugiantoDifferentPcl?: boolean; targetZeroDecision?: "isi-target" | "tidak-aktif" }) {
    const saved = window.localStorage.getItem(resolutionStorageKey);
    const current = saved ? JSON.parse(saved) as Record<string, unknown> : {};
    window.localStorage.setItem(resolutionStorageKey, JSON.stringify({ ...current, ...update }));
  }

  function saveDifferentPeople() {
    setSavedDifferentPeople(true);
    saveResolution({ sugiantoDifferentPcl: true });
    toast.success("SUGIANTO disimpan sebagai dua PCL berbeda", {
      description: "Import akan memakai alias internal berbeda untuk mencegah penggabungan petugas."
    });
  }

  function saveTargetDecision(decision: "isi-target" | "tidak-aktif") {
    setTargetDecision(decision);
    saveResolution({ targetZeroDecision: decision });
    toast.info(decision === "isi-target" ? "Keputusan target dicatat" : "Wilayah ditandai tidak aktif untuk review admin", {
      description: decision === "isi-target" ? "Isi nilai target aktual sebelum import final." : "Baris muatan 0 perlu dikeluarkan dari import aktif sebelum simpan."
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Penyelesaian Duplikasi Petugas</CardTitle>
          <CardDescription>Review nama sama, PCL dengan lebih dari satu PML, dan konflik role sebelum import disimpan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {duplicates.map((item) => (
            <article key={item.name} className="rounded-3xl border border-[var(--border)] bg-white/60 p-5 dark:bg-white/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{item.issue}</p>
                </div>
                <ArrowRightLeft className="h-5 w-5 text-[#ff7a1a]" />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {item.details.map((detail) => (
                  <div key={detail} className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm font-bold dark:bg-white/5">
                    {detail}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.recommendation}</p>
              <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <p className="text-sm font-black text-emerald-900 dark:text-emerald-100">Keputusan: pisahkan identitas petugas</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {item.resolution.map((resolution) => (
                    <div key={resolution} className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-emerald-950 dark:bg-white/10 dark:text-emerald-100">
                      <span className="block text-xs font-black uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">Role PCL</span>
                      <span className="mt-1 block">{resolution}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={saveDifferentPeople} disabled={savedDifferentPeople}>
                  <UserCheck className="h-4 w-4" /> Simpan Sebagai Orang Berbeda
                </Button>
                <Button variant="secondary">
                  <ArrowRightLeft className="h-4 w-4" /> Edit Alias Internal
                </Button>
              </div>
              {savedDifferentPeople ? (
                <p className="mt-3 rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-100">
                  Tersimpan: SUGIANTO diperlakukan sebagai dua PCL berbeda.
                </p>
              ) : null}
            </article>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#ff7a1a]" />
            <CardTitle>Validasi Alokasi</CardTitle>
          </div>
          <CardDescription>Masalah target atau wilayah harus diselesaikan sebelum tombol simpan import diaktifkan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allocationIssues.map((item) => (
            <article key={item.title} className="rounded-3xl border border-orange-200 bg-orange-50/80 p-5 dark:border-orange-500/20 dark:bg-orange-500/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-orange-900 dark:text-orange-100">{item.title}</h3>
                  <p className="mt-1 text-sm text-orange-800 dark:text-orange-200">{item.issue}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {item.details.map((detail) => (
                  <div key={detail} className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-orange-950 dark:bg-white/10 dark:text-orange-100">
                    {detail}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-orange-900 dark:text-orange-100">{item.recommendation}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => saveTargetDecision("isi-target")}>
                  <UserCheck className="h-4 w-4" /> Isi Target Aktual
                </Button>
                <Button variant="secondary" onClick={() => saveTargetDecision("tidak-aktif")}>Tandai Tidak Aktif</Button>
              </div>
              {targetDecision ? (
                <p className="mt-3 rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-orange-900 dark:bg-white/10 dark:text-orange-100">
                  Keputusan sementara: {targetDecision === "isi-target" ? "target aktual perlu diisi" : "baris ditandai tidak aktif untuk review admin"}.
                </p>
              ) : null}
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
