"use client";

import { Settings } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveAppSettingsAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type SettingsValues = {
  nama_kegiatan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  target_kabupaten: number;
  green_min: number;
  yellow_min: number;
  orange_min: number;
  max_upload_mb: number;
  private_bucket: string;
};

const storageKey = "marsada-app-settings";
const defaults: SettingsValues = {
  nama_kegiatan: "Sensus Ekonomi 2026",
  tanggal_mulai: "2026-05-01",
  tanggal_selesai: "2026-06-30",
  target_kabupaten: 121000,
  green_min: -5,
  yellow_min: -10,
  orange_min: -20,
  max_upload_mb: 5,
  private_bucket: "marsada-private"
};

export function SettingsForm() {
  const [values, setValues] = useState<SettingsValues>(defaults);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadSettings() {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setValues({ ...defaults, ...JSON.parse(saved) });

      try {
        const supabase = createClient();
        const { data } = await supabase.from("pengaturan_aplikasi").select("green_min, yellow_min, orange_min, max_upload_mb, private_bucket").eq("id", true).maybeSingle();
        const { data: kegiatan } = await supabase.from("kegiatan").select("nama, tanggal_mulai, tanggal_selesai, target_kabupaten").eq("aktif", true).limit(1).maybeSingle();
        if (data) {
          setValues((current) => ({
            ...current,
            green_min: Number(data.green_min),
            yellow_min: Number(data.yellow_min),
            orange_min: Number(data.orange_min),
            max_upload_mb: Number(data.max_upload_mb),
            private_bucket: String(data.private_bucket)
          }));
        }
        if (kegiatan) {
          setValues((current) => ({
            ...current,
            nama_kegiatan: String(kegiatan.nama),
            tanggal_mulai: String(kegiatan.tanggal_mulai),
            tanggal_selesai: String(kegiatan.tanggal_selesai),
            target_kabupaten: Number(kegiatan.target_kabupaten)
          }));
        }
      } catch {
        // Local fallback remains usable before Supabase is configured.
      }
    }
    loadSettings();
  }, []);

  function updateValue<K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function saveSettings() {
    startTransition(async () => {
      try {
        const saved = await saveAppSettingsAction(values);
        window.localStorage.setItem(storageKey, JSON.stringify(saved));
        toast.success("Settings berhasil disimpan");
      } catch (error) {
        window.localStorage.setItem(storageKey, JSON.stringify(values));
        toast.error(error instanceof Error ? `Tersimpan lokal: ${error.message}` : "Settings tersimpan lokal");
      }
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2"><span className="text-sm font-bold">Nama kegiatan</span><Input value={values.nama_kegiatan} onChange={(event) => updateValue("nama_kegiatan", event.target.value)} /></label>
      <label className="space-y-2"><span className="text-sm font-bold">Target muatan kabupaten</span><Input type="number" min={0} value={values.target_kabupaten} onChange={(event) => updateValue("target_kabupaten", Number(event.target.value))} /></label>
      <label className="space-y-2"><span className="text-sm font-bold">Periode mulai</span><Input type="date" value={values.tanggal_mulai} onChange={(event) => updateValue("tanggal_mulai", event.target.value)} /></label>
      <label className="space-y-2"><span className="text-sm font-bold">Periode selesai</span><Input type="date" value={values.tanggal_selesai} onChange={(event) => updateValue("tanggal_selesai", event.target.value)} /></label>
      <label className="space-y-2"><span className="text-sm font-bold">Bucket Supabase Storage</span><Input value={values.private_bucket} onChange={(event) => updateValue("private_bucket", event.target.value)} /></label>
      <label className="space-y-2"><span className="text-sm font-bold">Maksimal upload MB</span><Input type="number" min={1} value={values.max_upload_mb} onChange={(event) => updateValue("max_upload_mb", Number(event.target.value))} /></label>
      <label className="space-y-2"><span className="text-sm font-bold">Batas hijau minimal</span><Input type="number" value={values.green_min} onChange={(event) => updateValue("green_min", Number(event.target.value))} /></label>
      <label className="space-y-2"><span className="text-sm font-bold">Batas kuning minimal</span><Input type="number" value={values.yellow_min} onChange={(event) => updateValue("yellow_min", Number(event.target.value))} /></label>
      <label className="space-y-2"><span className="text-sm font-bold">Batas oranye minimal</span><Input type="number" value={values.orange_min} onChange={(event) => updateValue("orange_min", Number(event.target.value))} /></label>
      <label className="space-y-2"><span className="text-sm font-bold">Kategori merah</span><Input readOnly value="Selisih di bawah batas oranye" /></label>
      <div className="sm:col-span-2">
        <Button type="button" onClick={saveSettings} disabled={isPending}>
          <Settings className="h-4 w-4" /> {isPending ? "Menyimpan..." : "Simpan Settings"}
        </Button>
      </div>
    </div>
  );
}
