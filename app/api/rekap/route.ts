import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

type ProgressKecamatanRow = {
  kecamatan: string;
  target: number;
  selesai: number;
  sisa: number;
  progres: number;
};

type ProgressKabupatenRow = {
  target: number;
  selesai: number;
  sisa: number;
  progres: number;
};

function dailyNeed(remaining: number) {
  return Math.ceil(Math.max(0, remaining) / 57);
}

export async function GET() {
  const service = createServiceClient();
  const { data: districtData, error: districtError } = await service
    .from("v_progress_kecamatan")
    .select("kecamatan, target, selesai, sisa, progres")
    .order("kecamatan", { ascending: true });
  if (districtError) {
    return NextResponse.json({ error: districtError.message }, { status: 500 });
  }

  const { data: kabupatenData, error: kabupatenError } = await service
    .from("v_progress_kabupaten")
    .select("target, selesai, sisa, progres")
    .limit(1)
    .maybeSingle();
  if (kabupatenError) {
    return NextResponse.json({ error: kabupatenError.message }, { status: 500 });
  }

  const rows = ((districtData ?? []) as ProgressKecamatanRow[]).map((row) => ({
    name: row.kecamatan,
    target: Number(row.target ?? 0),
    selesai_resmi: Number(row.selesai ?? 0),
    sisa: Number(row.sisa ?? 0),
    progres: Number(row.progres ?? 0),
    kebutuhan_harian: dailyNeed(Number(row.sisa ?? 0))
  }));
  const kabupaten = kabupatenData as ProgressKabupatenRow | null;

  return NextResponse.json({
    timezone: "Asia/Jakarta",
    generatedAt: new Date().toISOString(),
    kabupaten: {
      target: Number(kabupaten?.target ?? 0),
      selesai_resmi: Number(kabupaten?.selesai ?? 0),
      sisa: Number(kabupaten?.sisa ?? 0),
      progres: Number(kabupaten?.progres ?? 0)
    },
    rows
  });
}
