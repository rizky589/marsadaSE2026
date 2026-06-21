"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const officerSchema = z.object({
  name: z.string().min(3),
  role: z.enum(["PML", "PCL", "Admin"]),
  district: z.string().min(2),
  village: z.string().optional(),
  target_load: z.coerce.number().int().min(0)
});

const progressSchema = z.object({
  officer_id: z.string().uuid(),
  progress_date: z.string().date(),
  completed_load: z.coerce.number().int().min(0),
  checked_by_pml: z.coerce.number().int().min(0),
  note: z.string().max(280).optional()
});

const dailyReportSchema = z
  .object({
    report_id: z.string().uuid().optional(),
    report_date: z.string().date(),
    assignment_id: z.string().uuid(),
    start_time: z.string().min(1),
    end_time: z.string().min(1),
    visited: z.coerce.number().int().min(0),
    completed_today: z.coerce.number().int().min(0),
    pending: z.coerce.number().int().min(0),
    revisit: z.coerce.number().int().min(0),
    not_met: z.coerce.number().int().min(0),
    refused: z.coerce.number().int().min(0),
    temporarily_closed: z.coerce.number().int().min(0),
    permanently_closed: z.coerce.number().int().min(0),
    moved: z.coerce.number().int().min(0),
    not_found: z.coerce.number().int().min(0),
    duplicate: z.coerce.number().int().min(0),
    new_business: z.coerce.number().int().min(0),
    note: z.string().max(600).optional(),
    issue: z.string().max(600).optional(),
    follow_up_plan: z.string().max(600).optional(),
    documentation_path: z.string().max(400).optional(),
    status: z.enum(["draft", "dikirim"])
  })
  .superRefine((values, ctx) => {
    if (values.report_date < "2026-05-01" || values.report_date > "2026-06-30") {
      ctx.addIssue({ code: "custom", path: ["report_date"], message: "Tanggal harus dalam periode kegiatan" });
    }
    if (values.end_time < values.start_time) {
      ctx.addIssue({ code: "custom", path: ["end_time"], message: "Jam selesai tidak boleh lebih awal dari jam mulai" });
    }
  });

const reviewReportSchema = z.object({
  report_id: z.string().uuid(),
  decision: z.enum(["disetujui", "dikembalikan"]),
  pml_note: z.string().max(600).optional()
}).superRefine((values, ctx) => {
  if (values.decision === "dikembalikan" && !values.pml_note?.trim()) {
    ctx.addIssue({ code: "custom", path: ["pml_note"], message: "Catatan wajib diisi saat laporan dikembalikan" });
  }
});

const issueSchema = z.object({
  issue_date: z.string().date(),
  location: z.string().min(2),
  category: z.string().min(2),
  description: z.string().min(5).max(600),
  status: z.enum(["Terbuka", "Diproses", "Selesai"]).default("Terbuka")
});

const supervisionSchema = z.object({
  supervision_date: z.string().date(),
  assignment_id: z.string().uuid(),
  supervision_type: z.string().min(3),
  inspected_objects: z.coerce.number().int().min(0),
  result: z.string().min(5),
  matched_count: z.coerce.number().int().min(0),
  need_fix_count: z.coerce.number().int().min(0),
  issue: z.string().max(600).optional(),
  direction: z.string().max(600).optional(),
  follow_up: z.string().max(600).optional(),
  follow_up_status: z.enum(["belum ditindaklanjuti", "diproses", "selesai"]),
  documentation_path: z.string().max(400).optional()
});

const ticketSchema = z.object({
  ticket_date: z.string().date(),
  district: z.string().min(2),
  village: z.string().min(2),
  sls_code: z.string().optional(),
  category: z.string().min(3),
  urgency: z.enum(["rendah", "sedang", "tinggi", "kritis"]),
  description: z.string().min(5),
  follow_up: z.string().optional(),
  pml_id: z.string().uuid().optional()
});

const appSettingsSchema = z.object({
  nama_kegiatan: z.string().min(1).max(160),
  tanggal_mulai: z.string().date(),
  tanggal_selesai: z.string().date(),
  target_kabupaten: z.coerce.number().int().min(0),
  green_min: z.coerce.number(),
  yellow_min: z.coerce.number(),
  orange_min: z.coerce.number(),
  max_upload_mb: z.coerce.number().int().positive(),
  private_bucket: z.string().min(1).max(120)
}).superRefine((values, ctx) => {
  if (values.tanggal_selesai < values.tanggal_mulai) {
    ctx.addIssue({
      code: "custom",
      path: ["tanggal_selesai"],
      message: "Periode selesai tidak boleh lebih awal dari periode mulai."
    });
  }
  if (!(values.green_min >= values.yellow_min && values.yellow_min >= values.orange_min)) {
    ctx.addIssue({
      code: "custom",
      path: ["green_min"],
      message: "Urutan batas harus hijau >= kuning >= oranye."
    });
  }
});

const importBatchSchema = z.object({
  file_name: z.string().min(1),
  row_count: z.coerce.number().int().min(0),
  total_target: z.coerce.number().int().min(0),
  validation_summary: z.record(z.string(), z.unknown())
});

const allocationImportRowSchema = z.object({
  kecamatan: z.string().min(1),
  desa: z.string().min(1),
  namaSls: z.string().min(1),
  kodeSubSls: z.string().min(1),
  idSubSls: z.string().min(1),
  targetAwal: z.coerce.number().int().positive(),
  flagPbi: z.string().optional(),
  kkOpenPbi: z.coerce.number().int().min(0).default(0),
  pml: z.string().min(1),
  pcl: z.string().min(1),
  supervisor: z.string().optional()
});

const allocationImportSchema = z.object({
  fileName: z.string().min(1),
  rows: z.array(allocationImportRowSchema).min(1).max(5000),
  decisions: z.object({
    sugiantoDifferentPcl: z.boolean().default(false),
    targetZeroDecision: z.enum(["isi-target", "tidak-aktif"]).optional()
  }).default({ sugiantoDifferentPcl: false })
});

const createPetugasLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  namaPetugas: z.string().min(2),
  jenis: z.enum(["PML", "PCL"]),
  role: z.enum(["pml", "pcl"])
}).refine((values) => (values.jenis === "PML" && values.role === "pml") || (values.jenis === "PCL" && values.role === "pcl"), {
  message: "Jenis petugas dan role login tidak sesuai.",
  path: ["role"]
});

const importedDailyReportSchema = z
  .object({
    report_date: z.string().date(),
    assignment_id: z.string().uuid(),
    start_time: z.string().min(1),
    end_time: z.string().min(1),
    visited: z.coerce.number().int().min(0),
    completed_today: z.coerce.number().int().min(0),
    pending: z.coerce.number().int().min(0),
    revisit: z.coerce.number().int().min(0),
    not_met: z.coerce.number().int().min(0),
    refused: z.coerce.number().int().min(0),
    temporarily_closed: z.coerce.number().int().min(0),
    permanently_closed: z.coerce.number().int().min(0),
    moved: z.coerce.number().int().min(0),
    not_found: z.coerce.number().int().min(0),
    duplicate: z.coerce.number().int().min(0),
    new_business: z.coerce.number().int().min(0),
    note: z.string().max(600).optional(),
    issue: z.string().max(600).optional(),
    follow_up_plan: z.string().max(600).optional(),
    documentation_path: z.string().max(400).optional(),
    status: z.enum(["draft", "dikirim"])
  })
  .superRefine((values, ctx) => {
    if (values.report_date < "2026-05-01" || values.report_date > "2026-06-30") {
      ctx.addIssue({ code: "custom", path: ["report_date"], message: "Tanggal harus dalam periode kegiatan" });
    }
    if (values.end_time < values.start_time) {
      ctx.addIssue({ code: "custom", path: ["end_time"], message: "Jam selesai tidak boleh lebih awal dari jam mulai" });
    }
  });

async function requireSupabase() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  return supabase;
}

async function getProfile(supabase: Awaited<ReturnType<typeof requireSupabase>>) {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Sesi pengguna tidak valid.");

  const { data: profile, error } = await supabase.from("profiles").select("id, role, kecamatan_id, petugas_id").eq("id", user.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile) {
    const synced = await syncCurrentUserProfileAction();
    return { id: synced.id, role: synced.role, kecamatan_id: null, petugas_id: synced.petugas_id };
  }
  return profile as { id: string; role: string; kecamatan_id: string | null; petugas_id: string | null };
}

async function writeAuditLog(supabase: Awaited<ReturnType<typeof requireSupabase>>, action: string, entity: string, entityId: string, metadata?: Record<string, unknown>) {
  await supabase.from("audit_logs").insert({
    action,
    entity,
    entity_id: entityId,
    metadata: metadata ?? {}
  });
}

async function getImportActor() {
  const supabase = await requireSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Sesi pengguna tidak valid.");

  const service = createServiceClient();
  const { data: profile, error } = await service.from("profiles").select("id, role").eq("id", user.id).maybeSingle();
  if (error) throw new Error(error.message);
  const safeProfile = profile ?? await syncCurrentUserProfileAction();
  if (!["admin_kabupaten", "super_admin"].includes(String(safeProfile.role))) throw new Error("Hanya admin yang dapat menyimpan import alokasi.");
  return { id: user.id, role: String(safeProfile.role) };
}

function normalizeImportText(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function cleanSupabaseHost(value: string | undefined) {
  try {
    return value ? new URL(value.trim()).host : "-";
  } catch {
    return "-";
  }
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function mapBy<T>(items: T[], keyGetter: (item: T) => string) {
  const map = new Map<string, T>();
  items.forEach((item) => map.set(keyGetter(item), item));
  return map;
}

function resolveImportedPclName(name: string, pml: string, decisions: z.infer<typeof allocationImportSchema>["decisions"]) {
  if (decisions.sugiantoDifferentPcl && name === "SUGIANTO" && pml === "ISMAIL MUNTHE") return "SUGIANTO - TIM ISMAIL MUNTHE";
  if (decisions.sugiantoDifferentPcl && name === "SUGIANTO" && pml === "RAHMAT PAUJI HASIBUAN") return "SUGIANTO - TIM RAHMAT PAUJI HASIBUAN";
  return name;
}

async function findOrCreatePetugas(supabase: ReturnType<typeof createServiceClient>, nama: string, jenis: "PML" | "PCL", kecamatanId?: string) {
  const { data: existing, error: selectError } = await supabase
    .from("petugas")
    .select("id")
    .eq("nama", nama)
    .eq("jenis", jenis)
    .maybeSingle();
  if (selectError) throw new Error(selectError.message);
  if (existing?.id) return existing.id as string;

  const { data, error } = await supabase
    .from("petugas")
    .insert({ nama, jenis, kecamatan_id: kecamatanId ?? null, aktif: true })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function importAllocationToSupabaseAction(input: z.input<typeof allocationImportSchema>) {
  try {
    return await importAllocationToSupabase(input);
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Import alokasi gagal."
    };
  }
}

async function importAllocationToSupabase(input: z.input<typeof allocationImportSchema>) {
  const values = allocationImportSchema.parse(input);
  const actor = await getImportActor();
  const service = createServiceClient();

  const normalizedRows = values.rows.map((row) => {
    const pml = normalizeImportText(row.pml);
    const pcl = resolveImportedPclName(normalizeImportText(row.pcl), pml, values.decisions);
    return {
      ...row,
      kecamatan: normalizeImportText(row.kecamatan),
      desa: normalizeImportText(row.desa),
      namaSls: normalizeImportText(row.namaSls),
      kodeSubSls: row.kodeSubSls.trim(),
      idSubSls: row.idSubSls.trim(),
      flagPbi: row.flagPbi?.trim() || null,
      pml,
      pcl
    };
  });

  const duplicateIds = normalizedRows.map((row) => row.idSubSls).filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicateIds.length) throw new Error(`Duplikasi ID Sub-SLS: ${duplicateIds.slice(0, 5).join(", ")}`);
  if (normalizedRows.some((row) => row.targetAwal <= 0)) throw new Error("Masih ada muatan tidak positif pada baris aktif.");

  const totalTarget = normalizedRows.reduce((sum, row) => sum + row.targetAwal, 0);

  const { data: kegiatan, error: kegiatanError } = await service
    .from("kegiatan")
    .upsert({
      nama: "Sensus Ekonomi 2026",
      tanggal_mulai: "2026-05-01",
      tanggal_selesai: "2026-06-30",
      target_kabupaten: totalTarget,
      aktif: true
    }, { onConflict: "nama" })
    .select("id")
    .single();
  if (kegiatanError) throw new Error(kegiatanError.message);
  const kegiatanId = kegiatan.id as string;

  const { data: batch, error: batchError } = await service
    .from("import_batches")
    .insert({
      kegiatan_id: kegiatanId,
      nama_file: values.fileName,
      jumlah_baris: normalizedRows.length,
      total_target: totalTarget,
      status: "draft",
      ringkasan_validasi: {
        decisions: values.decisions,
        kecamatan: new Set(normalizedRows.map((row) => row.kecamatan)).size,
        pml: new Set(normalizedRows.map((row) => row.pml)).size,
        pcl: new Set(normalizedRows.map((row) => row.pcl)).size
      },
      dibuat_oleh: actor.id
    })
    .select("id")
    .single();
  if (batchError) throw new Error(batchError.message);

  try {
    const kecamatanMap = new Map<string, string>();
    const desaMap = new Map<string, string>();
    const slsMap = new Map<string, string>();
    const pmlMap = new Map<string, string>();
    const pclMap = new Map<string, string>();

    const kecamatanNames = uniqueValues(normalizedRows.map((row) => row.kecamatan));
    const { data: kecamatanData, error: kecamatanError } = await service
      .from("kecamatan")
      .upsert(kecamatanNames.map((nama) => ({ nama })), { onConflict: "nama" })
      .select("id, nama");
    if (kecamatanError) throw new Error(kecamatanError.message);
    kecamatanData?.forEach((item) => kecamatanMap.set(String(item.nama), String(item.id)));

    const desaRows = mapBy(
      normalizedRows.map((row) => {
        const kecamatanId = kecamatanMap.get(row.kecamatan);
        if (!kecamatanId) throw new Error(`Kecamatan tidak ditemukan: ${row.kecamatan}`);
        return { key: `${row.kecamatan}|${row.desa}`, kecamatan_id: kecamatanId, nama: row.desa };
      }),
      (row) => row.key
    );
    const { data: desaData, error: desaError } = await service
      .from("desa")
      .upsert([...desaRows.values()].map(({ kecamatan_id, nama }) => ({ kecamatan_id, nama })), { onConflict: "kecamatan_id,nama" })
      .select("id, kecamatan_id, nama");
    if (desaError) throw new Error(desaError.message);
    desaData?.forEach((item) => {
      const kecamatanName = [...kecamatanMap.entries()].find(([, id]) => id === String(item.kecamatan_id))?.[0];
      if (kecamatanName) desaMap.set(`${kecamatanName}|${item.nama}`, String(item.id));
    });

    const pmlNames = uniqueValues(normalizedRows.map((row) => row.pml));
    const pclNames = uniqueValues(normalizedRows.map((row) => row.pcl));
    const { data: existingPml, error: existingPmlError } = await service
      .from("petugas")
      .select("id, nama")
      .eq("jenis", "PML")
      .in("nama", pmlNames);
    if (existingPmlError) throw new Error(existingPmlError.message);
    existingPml?.forEach((item) => pmlMap.set(String(item.nama), String(item.id)));

    const { data: existingPcl, error: existingPclError } = await service
      .from("petugas")
      .select("id, nama")
      .eq("jenis", "PCL")
      .in("nama", pclNames);
    if (existingPclError) throw new Error(existingPclError.message);
    existingPcl?.forEach((item) => pclMap.set(String(item.nama), String(item.id)));

    const missingPml = pmlNames.filter((nama) => !pmlMap.has(nama));
    if (missingPml.length) {
      const { data, error } = await service
        .from("petugas")
        .insert(missingPml.map((nama) => ({ nama, jenis: "PML", kecamatan_id: kecamatanMap.get(normalizedRows.find((row) => row.pml === nama)?.kecamatan ?? "") ?? null, aktif: true })))
        .select("id, nama");
      if (error) throw new Error(error.message);
      data?.forEach((item) => pmlMap.set(String(item.nama), String(item.id)));
    }

    const missingPcl = pclNames.filter((nama) => !pclMap.has(nama));
    if (missingPcl.length) {
      const { data, error } = await service
        .from("petugas")
        .insert(missingPcl.map((nama) => ({ nama, jenis: "PCL", kecamatan_id: kecamatanMap.get(normalizedRows.find((row) => row.pcl === nama)?.kecamatan ?? "") ?? null, aktif: true })))
        .select("id, nama");
      if (error) throw new Error(error.message);
      data?.forEach((item) => pclMap.set(String(item.nama), String(item.id)));
    }

    const slsPayload = normalizedRows.map((row) => {
      const kecamatanId = kecamatanMap.get(row.kecamatan);
      if (!kecamatanId) throw new Error(`Kecamatan tidak ditemukan: ${row.kecamatan}`);
      const desaId = desaMap.get(`${row.kecamatan}|${row.desa}`);
      if (!desaId) throw new Error(`Desa tidak ditemukan: ${row.kecamatan} - ${row.desa}`);
      return {
        desa_id: desaId,
        nama_sls: row.namaSls,
        kode_sub_sls: row.kodeSubSls,
        id_sub_sls: row.idSubSls,
        target_awal: row.targetAwal,
        target_aktual: row.targetAwal,
        flag_pbi: row.flagPbi,
        kk_open_pbi: row.kkOpenPbi
      };
    });
    const { data: slsData, error: slsError } = await service
      .from("sls")
      .upsert(slsPayload, { onConflict: "id_sub_sls" })
      .select("id, id_sub_sls");
    if (slsError) throw new Error(slsError.message);
    slsData?.forEach((item) => slsMap.set(String(item.id_sub_sls), String(item.id)));

    const relationRows = mapBy(
      normalizedRows.map((row) => {
        const pmlId = pmlMap.get(row.pml);
        const pclId = pclMap.get(row.pcl);
        if (!pmlId || !pclId) throw new Error(`Petugas import tidak lengkap untuk ID ${row.idSubSls}`);
        return { key: `${kegiatanId}|${pclId}|true`, kegiatan_id: kegiatanId, pml_id: pmlId, pcl_id: pclId, aktif: true };
      }),
      (row) => row.key
    );
    const { error: relationError } = await service
      .from("hubungan_pml_pcl")
      .upsert([...relationRows.values()].map(({ kegiatan_id, pml_id, pcl_id, aktif }) => ({ kegiatan_id, pml_id, pcl_id, aktif })), { onConflict: "kegiatan_id,pcl_id,aktif" });
    if (relationError) throw new Error(relationError.message);

    const assignmentRows = mapBy(
      normalizedRows.map((row) => {
        const slsId = slsMap.get(row.idSubSls);
        const pmlId = pmlMap.get(row.pml);
        const pclId = pclMap.get(row.pcl);
        if (!slsId || !pmlId || !pclId) throw new Error(`Referensi penugasan tidak lengkap untuk ID ${row.idSubSls}`);
        return { key: `${kegiatanId}|${slsId}|${pclId}`, kegiatan_id: kegiatanId, sls_id: slsId, pml_id: pmlId, pcl_id: pclId, target_aktual: row.targetAwal, aktif: true };
      }),
      (row) => row.key
    );
    const { error: assignmentError } = await service
      .from("penugasan")
      .upsert([...assignmentRows.values()].map(({ kegiatan_id, sls_id, pml_id, pcl_id, target_aktual, aktif }) => ({ kegiatan_id, sls_id, pml_id, pcl_id, target_aktual, aktif })), { onConflict: "kegiatan_id,sls_id,pcl_id" });
    if (assignmentError) throw new Error(assignmentError.message);

    const { error: updateBatchError } = await service
      .from("import_batches")
      .update({ status: "tersimpan" })
      .eq("id", batch.id);
    if (updateBatchError) throw new Error(updateBatchError.message);

    await service.from("audit_logs").insert({
      actor_id: actor.id,
      aksi: "import_alokasi_excel",
      tabel: "import_batches",
      record_id: batch.id,
      sesudah: { jumlah_baris: normalizedRows.length, total_target: totalTarget }
    });

    revalidatePath("/upload");
    revalidatePath("/alokasi");
    revalidatePath("/master-wilayah");
    revalidatePath("/master-petugas");
    revalidatePath("/hubungan-pml-pcl");
    revalidatePath("/penugasan");

    return {
      ok: true as const,
      importBatchId: batch.id as string,
      rowCount: normalizedRows.length,
      totalTarget
    };
  } catch (error) {
    await service.from("import_batches").update({ status: "gagal" }).eq("id", batch.id);
    await service.from("import_errors").insert({
      import_batch_id: batch.id,
      kode_error: "IMPORT_GAGAL",
      pesan: error instanceof Error ? error.message : "Import gagal",
      data_baris: {}
    });
    throw error;
  }
}

export async function createPetugasLoginAction(input: z.input<typeof createPetugasLoginSchema>) {
  const values = createPetugasLoginSchema.parse(input);
  const actor = await getImportActor();
  const service = createServiceClient();
  const namaPetugas = normalizeImportText(values.namaPetugas);

  const { data: petugas, error: petugasError } = await service
    .from("petugas")
    .select("id, nama, jenis, kecamatan_id")
    .eq("nama", namaPetugas)
    .eq("jenis", values.jenis)
    .maybeSingle();
  if (petugasError) throw new Error(petugasError.message);
  if (!petugas) throw new Error(`Petugas ${namaPetugas} belum ada. Import alokasi terlebih dahulu.`);

  const { data: existingUsers, error: listError } = await service.auth.admin.listUsers();
  if (listError) throw new Error(listError.message);
  const existingUser = existingUsers.users.find((user) => user.email?.toLowerCase() === values.email.toLowerCase());
  const authResult = existingUser
    ? { data: { user: existingUser }, error: null }
    : await service.auth.admin.createUser({
      email: values.email,
      password: values.password,
      email_confirm: true,
      user_metadata: { full_name: petugas.nama, role: values.role }
    });

  if (authResult.error) throw new Error(authResult.error.message);
  const user = authResult.data.user;
  if (!user) throw new Error("User Supabase gagal dibuat.");

  const { error: profileError } = await service
    .from("profiles")
    .upsert({
      id: user.id,
      nama_lengkap: petugas.nama,
      role: values.role,
      petugas_id: petugas.id,
      kecamatan_id: petugas.kecamatan_id,
      aktif: true
    }, { onConflict: "id" });
  if (profileError) throw new Error(profileError.message);

  await service.from("audit_logs").insert({
    actor_id: actor.id,
    aksi: "create_petugas_login",
    tabel: "profiles",
    record_id: user.id,
    sesudah: { email: values.email, nama_petugas: petugas.nama, role: values.role, petugas_id: petugas.id }
  });

  revalidatePath("/petugas");
  revalidatePath("/master-petugas");

  return {
    userId: user.id,
    email: values.email,
    namaPetugas: petugas.nama,
    role: values.role
  };
}

function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export async function syncCurrentUserProfileAction() {
  const supabase = await requireSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user?.email) throw new Error("Sesi pengguna tidak valid.");

  const { data: existing } = await supabase.from("profiles").select("id, nama_lengkap, role, petugas_id").eq("id", user.id).maybeSingle();
  if (existing?.role) {
    return existing as { id: string; nama_lengkap: string | null; role: string; petugas_id: string | null };
  }

  const service = createServiceClient();
  const candidateName = nameFromEmail(user.email);
  const { data: petugas, error: petugasError } = await service
    .from("petugas")
    .select("id, nama, jenis, kecamatan_id")
    .ilike("nama", candidateName)
    .limit(1)
    .maybeSingle();
  if (petugasError) throw new Error(petugasError.message);
  if (!petugas) {
    const metadataRole = typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null;
    const emailLocal = user.email.split("@")[0].toLowerCase();
    const inferredRole = metadataRole ?? (emailLocal.includes("admin") ? "admin_kabupaten" : emailLocal.includes("pml") ? "pml" : "pcl");
    const fallbackName = candidateName || user.email;
    const { error: fallbackProfileError } = await service
      .from("profiles")
      .upsert({
        id: user.id,
        nama_lengkap: fallbackName,
        role: inferredRole,
        petugas_id: null,
        kecamatan_id: null,
        aktif: true
      }, { onConflict: "id" });
    if (fallbackProfileError) throw new Error(fallbackProfileError.message);
    return { id: user.id, nama_lengkap: fallbackName, role: inferredRole, petugas_id: null };
  }

  const role = petugas.jenis === "PML" ? "pml" : petugas.jenis === "PCL" ? "pcl" : "admin_kabupaten";
  const { error: profileError } = await service
    .from("profiles")
    .upsert({
      id: user.id,
      nama_lengkap: petugas.nama,
      role,
      petugas_id: petugas.id,
      kecamatan_id: petugas.kecamatan_id,
      aktif: true
    }, { onConflict: "id" });
  if (profileError) throw new Error(profileError.message);

  return { id: user.id, nama_lengkap: petugas.nama as string, role, petugas_id: petugas.id as string };
}

type PclAssignmentRow = {
  id: string;
  target_aktual: number;
  sls?: MaybeArray<{
    nama_sls: string;
    kode_sub_sls: string;
    id_sub_sls: string;
    desa?: MaybeArray<{
      nama: string;
      kecamatan?: MaybeArray<{ nama: string }> | null;
    }> | null;
  }> | null;
  pml?: MaybeArray<{ id: string; nama: string }> | null;
  pcl?: MaybeArray<{ id: string; nama: string }> | null;
};

type MaybeArray<T> = T | T[];

type ImportedAssignmentRow = PclAssignmentRow & {
  kegiatan_id?: string | null;
  sls_id?: string | null;
  aktif?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ImportedDailyReportRow = {
  id: string;
  tanggal: string;
  penugasan_id: string;
  jumlah_dikunjungi: number;
  jumlah_selesai_hari_ini: number;
  pending: number;
  jam_mulai: string;
  jam_selesai: string;
  catatan?: string | null;
  kendala?: string | null;
  rencana_tindak_lanjut?: string | null;
  status: "draft" | "dikirim" | "dikembalikan" | "disetujui" | "dibuka_kembali";
  updated_at: string;
  penugasan?: MaybeArray<{
    target_aktual: number;
    sls?: MaybeArray<{
      nama_sls: string;
      kode_sub_sls: string;
      id_sub_sls: string;
      desa?: MaybeArray<{
        nama: string;
        kecamatan?: MaybeArray<{ nama: string }> | null;
      }> | null;
    }> | null;
    pml?: MaybeArray<{ nama: string }> | null;
    pcl?: MaybeArray<{ nama: string }> | null;
  }> | null;
};

type ProgressSlsViewRow = {
  penugasan_id: string;
  kegiatan_id: string;
  kecamatan: string;
  desa: string;
  nama_sls: string;
  kode_sub_sls: string;
  id_sub_sls: string;
  pml: string;
  pcl: string;
  target: number;
  selesai: number;
  sisa: number;
  progres: number;
  laporan_updated_at?: string | null;
};

function firstItem<T>(value: MaybeArray<T> | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getMyPclAssignmentsAction() {
  const supabase = await requireSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user?.email) throw new Error("Sesi pengguna tidak valid.");

  const profile = await syncCurrentUserProfileAction();
  if (profile.role !== "pcl" || !profile.petugas_id) return [];

  const service = createServiceClient();
  const { data, error } = await service
    .from("penugasan")
    .select("id, target_aktual, sls:sls_id(nama_sls, kode_sub_sls, id_sub_sls, desa:desa_id(nama, kecamatan:kecamatan_id(nama))), pml:pml_id(id, nama), pcl:pcl_id(id, nama)")
    .eq("pcl_id", profile.petugas_id)
    .eq("aktif", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as PclAssignmentRow[]).map((row) => {
    const sls = firstItem(row.sls);
    const desa = firstItem(sls?.desa);
    const kecamatan = firstItem(desa?.kecamatan);
    const pml = firstItem(row.pml);
    const pcl = firstItem(row.pcl);

    return {
      id: row.id,
      district: kecamatan?.nama ?? "-",
      village: desa?.nama ?? "-",
      sls: sls?.kode_sub_sls ? `${sls.nama_sls} / ${sls.kode_sub_sls}` : sls?.nama_sls ?? "-",
      subSlsId: sls?.id_sub_sls ?? "-",
      load: Number(row.target_aktual ?? 0),
      pml: pml?.nama ?? "-",
      pmlId: pml?.id ?? "",
      pcl: pcl?.nama ?? profile.nama_lengkap ?? "-",
      pclId: pcl?.id ?? profile.petugas_id ?? ""
    };
  });
}

export async function getImportedAllocationSnapshotAction() {
  const supabase = await requireSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Sesi pengguna tidak valid.");

  const service = createServiceClient();
  const { data, error } = await service
    .from("penugasan")
    .select("id, created_at, target_aktual, sls:sls_id(nama_sls, kode_sub_sls, id_sub_sls, desa:desa_id(nama, kecamatan:kecamatan_id(nama))), pml:pml_id(id, nama), pcl:pcl_id(id, nama)")
    .eq("aktif", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as unknown as ImportedAssignmentRow[]).map((row) => {
    const sls = firstItem(row.sls);
    const desa = firstItem(sls?.desa);
    const kecamatan = firstItem(desa?.kecamatan);
    const pml = firstItem(row.pml);
    const pcl = firstItem(row.pcl);

    return {
      kecamatan: kecamatan?.nama ?? "-",
      desa: desa?.nama ?? "-",
      namaSls: sls?.nama_sls ?? "-",
      kodeSubSls: sls?.kode_sub_sls ?? "",
      idSubSls: sls?.id_sub_sls ?? row.id,
      targetAwal: Number(row.target_aktual ?? 0),
      pml: pml?.nama ?? "-",
      pcl: pcl?.nama ?? "-",
      savedAt: row.created_at ?? null
    };
  });

  return {
    rows: rows.filter((row) => row.idSubSls && row.targetAwal > 0),
    savedAt: rows.findLast((row) => row.savedAt)?.savedAt ?? null
  };
}

export async function getDailyReportSnapshotAction() {
  const supabase = await requireSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Sesi pengguna tidak valid.");

  const service = createServiceClient();
  const { data, error } = await service
    .from("laporan_harian")
    .select("id, tanggal, penugasan_id, jumlah_dikunjungi, jumlah_selesai_hari_ini, pending, jam_mulai, jam_selesai, catatan, kendala, rencana_tindak_lanjut, status, updated_at, penugasan:penugasan_id(target_aktual, sls:sls_id(nama_sls, kode_sub_sls, id_sub_sls, desa:desa_id(nama, kecamatan:kecamatan_id(nama))), pml:pml_id(nama), pcl:pcl_id(nama))")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as ImportedDailyReportRow[]).map((report) => {
    const assignment = firstItem(report.penugasan);
    const sls = firstItem(assignment?.sls);
    const desa = firstItem(sls?.desa);
    const kecamatan = firstItem(desa?.kecamatan);
    const pml = firstItem(assignment?.pml);
    const pcl = firstItem(assignment?.pcl);
    return {
      id: report.id,
      reportDate: report.tanggal,
      assignmentId: report.penugasan_id,
      district: kecamatan?.nama ?? "-",
      village: desa?.nama ?? "-",
      sls: sls?.kode_sub_sls ? `${sls.nama_sls} / ${sls.kode_sub_sls}` : sls?.nama_sls ?? "-",
      subSlsId: sls?.id_sub_sls ?? report.penugasan_id,
      target: Number(assignment?.target_aktual ?? 0),
      pml: pml?.nama ?? "-",
      pcl: pcl?.nama ?? "-",
      visited: Number(report.jumlah_dikunjungi ?? 0),
      completedToday: Number(report.jumlah_selesai_hari_ini ?? 0),
      pending: Number(report.pending ?? 0),
      startTime: String(report.jam_mulai ?? "").slice(0, 5),
      endTime: String(report.jam_selesai ?? "").slice(0, 5),
      note: report.catatan ?? undefined,
      issue: report.kendala ?? undefined,
      followUpPlan: report.rencana_tindak_lanjut ?? undefined,
      status: report.status,
      updatedAt: report.updated_at
    };
  });
}

async function getProgressSlsRowsFromBaseTables(service: ReturnType<typeof createServiceClient>) {
  const selectColumns = "id, kegiatan_id, sls_id, aktif, created_at, updated_at, target_aktual, sls:sls_id(nama_sls, kode_sub_sls, id_sub_sls, desa:desa_id(nama, kecamatan:kecamatan_id(nama))), pml:pml_id(nama), pcl:pcl_id(nama)";
  const { data: activeAssignmentsData, error: activeAssignmentsError } = await service
    .from("penugasan")
    .select(selectColumns)
    .eq("aktif", true)
    .order("created_at", { ascending: true });
  if (activeAssignmentsError) throw new Error(activeAssignmentsError.message);

  let assignmentRows = (activeAssignmentsData ?? []) as unknown as ImportedAssignmentRow[];
  if (!assignmentRows.length) {
    const { data: allAssignmentsData, error: allAssignmentsError } = await service
      .from("penugasan")
      .select(selectColumns)
      .order("created_at", { ascending: true });
    if (allAssignmentsError) throw new Error(allAssignmentsError.message);
    assignmentRows = (allAssignmentsData ?? []) as unknown as ImportedAssignmentRow[];
  }

  const assignmentIds = assignmentRows.map((row) => row.id);
  const completedByAssignment = new Map<string, { selesai: number; updatedAt: string | null }>();
  if (assignmentIds.length) {
    const { data: reportsData, error: reportsError } = await service
      .from("laporan_harian")
      .select("penugasan_id, jumlah_selesai_hari_ini, status, updated_at")
      .in("penugasan_id", assignmentIds);
    if (reportsError) throw new Error(reportsError.message);
    (reportsData ?? []).forEach((report) => {
      if (report.status !== "disetujui") return;
      const current = completedByAssignment.get(String(report.penugasan_id)) ?? { selesai: 0, updatedAt: null };
      const updatedAt = String(report.updated_at ?? "");
      completedByAssignment.set(String(report.penugasan_id), {
        selesai: current.selesai + Number(report.jumlah_selesai_hari_ini ?? 0),
        updatedAt: !current.updatedAt || updatedAt > current.updatedAt ? updatedAt : current.updatedAt
      });
    });
  }

  const rankedRows = [...assignmentRows].sort((a, b) => {
    const completedA = completedByAssignment.get(a.id)?.selesai ?? 0;
    const completedB = completedByAssignment.get(b.id)?.selesai ?? 0;
    if ((completedB > 0 ? 1 : 0) !== (completedA > 0 ? 1 : 0)) return (completedB > 0 ? 1 : 0) - (completedA > 0 ? 1 : 0);
    if (String(b.updated_at ?? "") !== String(a.updated_at ?? "")) return String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? ""));
    if (String(b.created_at ?? "") !== String(a.created_at ?? "")) return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
    return String(a.id).localeCompare(String(b.id));
  });

  const dedupedRows = new Map<string, ImportedAssignmentRow>();
  rankedRows.forEach((row) => {
    const sls = firstItem(row.sls);
    const key = `${row.kegiatan_id ?? ""}|${row.sls_id ?? sls?.id_sub_sls ?? row.id}`;
    if (!dedupedRows.has(key)) dedupedRows.set(key, row);
  });

  return [...dedupedRows.values()].map((row) => {
    const sls = firstItem(row.sls);
    const desa = firstItem(sls?.desa);
    const kecamatan = firstItem(desa?.kecamatan);
    const pml = firstItem(row.pml);
    const pcl = firstItem(row.pcl);
    const completed = completedByAssignment.get(row.id);
    const target = Number(row.target_aktual ?? 0);
    const selesai = completed?.selesai ?? 0;
    return {
      penugasanId: row.id,
      kegiatanId: row.kegiatan_id ?? "",
      kecamatan: kecamatan?.nama ?? "-",
      desa: desa?.nama ?? "-",
      namaSls: sls?.nama_sls ?? "-",
      kodeSubSls: sls?.kode_sub_sls ?? "",
      idSubSls: sls?.id_sub_sls ?? row.id,
      pml: pml?.nama ?? "-",
      pcl: pcl?.nama ?? "-",
      target,
      selesai,
      sisa: Math.max(0, target - selesai),
      progres: target ? Number(((selesai / target) * 100).toFixed(3)) : 0,
      laporanUpdatedAt: completed?.updatedAt ?? null
    };
  });
}

export async function getProgressSlsSnapshotAction() {
  const supabase = await requireSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Sesi pengguna tidak valid.");

  const service = createServiceClient();
  const { data, error } = await service
    .from("v_progress_sls")
    .select("penugasan_id, kegiatan_id, kecamatan, desa, nama_sls, kode_sub_sls, id_sub_sls, pml, pcl, target, selesai, sisa, progres, laporan_updated_at")
    .order("kecamatan", { ascending: true })
    .order("desa", { ascending: true })
    .order("id_sub_sls", { ascending: true });

  if (error) {
    return getProgressSlsRowsFromBaseTables(service);
  }

  if (!data?.length) {
    return getProgressSlsRowsFromBaseTables(service);
  }

  return ((data ?? []) as ProgressSlsViewRow[]).map((row) => ({
    penugasanId: row.penugasan_id,
    kegiatanId: row.kegiatan_id,
    kecamatan: row.kecamatan,
    desa: row.desa,
    namaSls: row.nama_sls,
    kodeSubSls: row.kode_sub_sls,
    idSubSls: row.id_sub_sls,
    pml: row.pml,
    pcl: row.pcl,
    target: Number(row.target ?? 0),
    selesai: Number(row.selesai ?? 0),
    sisa: Number(row.sisa ?? 0),
    progres: Number(row.progres ?? 0),
    laporanUpdatedAt: row.laporan_updated_at ?? null
  }));
}

async function countTableRows(service: ReturnType<typeof createServiceClient>, table: string) {
  const { count, error } = await service.from(table).select("*", { count: "exact", head: true });
  if (error) return { count: 0, error: error.message };
  return { count: count ?? 0, error: null };
}

export async function getDashboardDatabaseHealthAction() {
  await getImportActor();
  const service = createServiceClient();
  const tableNames = ["kecamatan", "desa", "sls", "petugas", "penugasan", "laporan_harian", "v_progress_sls"] as const;
  const results = await Promise.all(tableNames.map(async (table) => [table, await countTableRows(service, table)] as const));
  const counts = Object.fromEntries(results.map(([table, result]) => [table, result.count])) as Record<(typeof tableNames)[number], number>;
  const errors = results.filter(([, result]) => result.error).map(([table, result]) => `${table}: ${result.error}`);

  const { data: latestImport } = await service
    .from("import_batches")
    .select("nama_file, jumlah_baris, total_target, status, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: reportStatus } = await service
    .from("laporan_harian")
    .select("status, jumlah_selesai_hari_ini");

  const laporanByStatus = (reportStatus ?? []).reduce<Record<string, { count: number; selesai: number }>>((acc, report) => {
    const status = String(report.status ?? "-");
    acc[status] = acc[status] ?? { count: 0, selesai: 0 };
    acc[status].count += 1;
    acc[status].selesai += Number(report.jumlah_selesai_hari_ini ?? 0);
    return acc;
  }, {});

  return {
    supabaseHost: cleanSupabaseHost(process.env.NEXT_PUBLIC_SUPABASE_URL),
    counts,
    errors,
    latestImport: latestImport
      ? {
        fileName: String(latestImport.nama_file ?? "-"),
        rowCount: Number(latestImport.jumlah_baris ?? 0),
        totalTarget: Number(latestImport.total_target ?? 0),
        status: String(latestImport.status ?? "-"),
        createdAt: String(latestImport.created_at ?? "")
      }
      : null,
    laporanByStatus
  };
}

export async function saveImportedDailyReportAction(input: z.input<typeof importedDailyReportSchema>) {
  const values = importedDailyReportSchema.parse(input);
  const supabase = await requireSupabase();
  const profile = await getProfile(supabase);
  if (!["pcl", "admin_kabupaten", "super_admin"].includes(profile.role)) throw new Error("Hanya PCL yang dapat menginput laporan harian.");

  const service = createServiceClient();
  const { data: assignment, error: assignmentError } = await service
    .from("penugasan")
    .select("id, kegiatan_id, pcl_id, target_aktual")
    .eq("id", values.assignment_id)
    .eq("aktif", true)
    .single();
  if (assignmentError || !assignment) throw new Error("Penugasan tidak ditemukan.");
  if (profile.role === "pcl" && assignment.pcl_id !== profile.petugas_id) throw new Error("PCL hanya dapat memilih SLS tugasnya.");

  const { data: approvedRows, error: approvedError } = await service
    .from("laporan_harian")
    .select("jumlah_selesai_hari_ini")
    .eq("penugasan_id", values.assignment_id)
    .eq("status", "disetujui");
  if (approvedError) throw new Error(approvedError.message);
  const approvedTotal = (approvedRows ?? []).reduce((sum, row) => sum + Number(row.jumlah_selesai_hari_ini ?? 0), 0);
  if (approvedTotal + values.completed_today > Number(assignment.target_aktual)) {
    throw new Error("Kumulatif selesai melebihi target aktual dan perlu persetujuan admin.");
  }

  const { error } = await service
    .from("laporan_harian")
    .upsert({
      kegiatan_id: assignment.kegiatan_id,
      penugasan_id: values.assignment_id,
      pcl_id: assignment.pcl_id,
      tanggal: values.report_date,
      jam_mulai: values.start_time,
      jam_selesai: values.end_time,
      jumlah_dikunjungi: values.visited,
      jumlah_selesai_hari_ini: values.completed_today,
      pending: values.pending,
      kunjungan_ulang: values.revisit,
      belum_bertemu: values.not_met,
      menolak: values.refused,
      tutup_sementara: values.temporarily_closed,
      tutup_permanen: values.permanently_closed,
      pindah: values.moved,
      tidak_ditemukan: values.not_found,
      duplikat: values.duplicate,
      usaha_baru: values.new_business,
      catatan: values.note || null,
      kendala: values.issue || null,
      rencana_tindak_lanjut: values.follow_up_plan || null,
      dokumentasi_path: values.documentation_path || null,
      status: values.status,
      dibuat_oleh: profile.id,
      dikirim_pada: values.status === "dikirim" ? new Date().toISOString() : null
    }, { onConflict: "penugasan_id,tanggal" });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard-pcl");
  revalidatePath("/dashboard-pml");
  revalidatePath("/pemeriksaan");
}

export async function reviewImportedDailyReportAction(reportId: string, status: "disetujui" | "dikembalikan") {
  const supabase = await requireSupabase();
  const profile = await getProfile(supabase);
  if (!["pml", "admin_kabupaten", "super_admin"].includes(profile.role)) throw new Error("Hanya PML atau admin yang dapat memeriksa laporan.");

  const service = createServiceClient();
  const { data: report, error: reportError } = await service
    .from("laporan_harian")
    .select("id, penugasan:penugasan_id(pml_id)")
    .eq("id", z.string().uuid().parse(reportId))
    .single();
  if (reportError || !report) throw new Error("Laporan tidak ditemukan.");
  const assignment = firstItem((report as { penugasan?: MaybeArray<{ pml_id: string }> | null }).penugasan);
  if (profile.role === "pml" && assignment?.pml_id !== profile.petugas_id) throw new Error("PML hanya dapat memeriksa laporan PCL bawahannya.");

  const { error } = await service.from("laporan_harian").update({ status }).eq("id", reportId);
  if (error) throw new Error(error.message);

  await service.from("pemeriksaan_laporan").insert({
    laporan_harian_id: reportId,
    pml_id: assignment?.pml_id ?? profile.petugas_id,
    status
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard-pml");
  revalidatePath("/pemeriksaan");
}

export async function createOfficerAction(input: z.input<typeof officerSchema>) {
  const values = officerSchema.parse(input);
  const supabase = await requireSupabase();
  const { error } = await supabase.from("officers").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath("/petugas");
}

export async function upsertProgressAction(input: z.input<typeof progressSchema>) {
  const values = progressSchema.parse(input);
  const supabase = await requireSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("daily_progress").upsert({ ...values, created_by: user?.id }, { onConflict: "officer_id,progress_date" });
  if (error) throw new Error(error.message);
  revalidatePath("/progres");
  revalidatePath("/dashboard");
}

export async function saveDailyReportAction(input: z.input<typeof dailyReportSchema>) {
  const values = dailyReportSchema.parse(input);
  const supabase = await requireSupabase();
  const profile = await getProfile(supabase);
  if (!["pcl", "admin_kabupaten", "super_admin"].includes(profile.role)) throw new Error("Hanya PCL yang dapat menginput laporan harian.");

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("id, pcl_id, load_target")
    .eq("id", values.assignment_id)
    .single();
  if (assignmentError || !assignment) throw new Error("Penugasan tidak ditemukan.");
  if (profile.role === "pcl" && assignment.pcl_id !== profile.petugas_id) throw new Error("PCL hanya dapat memilih SLS tugasnya.");

  const { data: existing } = await supabase
    .from("daily_reports")
    .select("id, status")
    .eq("assignment_id", values.assignment_id)
    .eq("report_date", values.report_date)
    .maybeSingle();

  if (existing && existing.id !== values.report_id) throw new Error("Laporan ganda pada tanggal dan penugasan yang sama tidak diperbolehkan.");
  if (existing?.status === "disetujui") throw new Error("Laporan yang sudah disetujui tidak dapat diedit.");
  if (existing && !["draft", "dikembalikan", "dibuka_kembali"].includes(existing.status)) throw new Error("Laporan ini sedang menunggu pemeriksaan PML.");

  const { data: approvedRows } = await supabase
    .from("daily_reports")
    .select("completed_today")
    .eq("assignment_id", values.assignment_id)
    .eq("status", "disetujui");
  const approvedTotal = (approvedRows ?? []).reduce((sum, row) => sum + Number(row.completed_today ?? 0), 0);
  if (approvedTotal + values.completed_today > Number(assignment.load_target)) {
    throw new Error("Kumulatif selesai melebihi target aktual dan perlu persetujuan admin.");
  }

  const { report_id: reportId, ...reportValues } = values;
  const payload = {
    ...reportValues,
    ...(reportId ? { id: reportId } : {}),
    pcl_id: assignment.pcl_id,
    submitted_at: values.status === "dikirim" ? new Date().toISOString() : null,
    created_by: profile.id,
    updated_by: profile.id
  };
  const { data, error } = await supabase.from("daily_reports").upsert(payload).select("id").single();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, values.status === "dikirim" ? "submit_daily_report" : "save_daily_report_draft", "daily_reports", data.id, {
    assignment_id: values.assignment_id,
    report_date: values.report_date
  });
  revalidatePath("/progres");
  revalidatePath("/pemeriksaan");
}

export async function reviewDailyReportAction(input: z.input<typeof reviewReportSchema>) {
  const values = reviewReportSchema.parse(input);
  const supabase = await requireSupabase();
  const profile = await getProfile(supabase);
  if (!["pml", "admin_kabupaten", "super_admin"].includes(profile.role)) throw new Error("Hanya PML atau admin yang dapat memeriksa laporan.");

  const { data: report, error: reportError } = await supabase
    .from("daily_reports")
    .select("id, status, pcl_id, assignments(pml_id)")
    .eq("id", values.report_id)
    .single();
  if (reportError || !report) throw new Error("Laporan tidak ditemukan.");
  if (report.status !== "dikirim") throw new Error("Hanya laporan berstatus dikirim yang dapat diperiksa.");

  const assignment = Array.isArray(report.assignments) ? report.assignments[0] : report.assignments;
  if (profile.role === "pml" && assignment?.pml_id !== profile.petugas_id) throw new Error("PML hanya dapat memeriksa laporan PCL bawahannya.");

  const { error } = await supabase
    .from("daily_reports")
    .update({
      status: values.decision,
      pml_note: values.pml_note,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", values.report_id);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, values.decision === "disetujui" ? "approve_daily_report" : "return_daily_report", "daily_reports", values.report_id, {
    pml_note: values.pml_note
  });
  const { data: pclProfile } = await supabase.from("profiles").select("id").eq("petugas_id", report.pcl_id).maybeSingle();
  if (pclProfile?.id) {
    await supabase.from("notifications").insert({
      user_id: pclProfile.id,
      title: values.decision === "disetujui" ? "Laporan disetujui PML" : "Laporan dikembalikan PML",
      body: values.decision === "disetujui" ? "Laporan dikunci dan masuk progres resmi." : "Laporan dapat diperbaiki sesuai catatan PML.",
      entity: "daily_reports",
      entity_id: values.report_id
    });
  }
  revalidatePath("/progres");
  revalidatePath("/pemeriksaan");
  revalidatePath("/dashboard");
}

export async function createIssueAction(input: z.input<typeof issueSchema>) {
  const values = issueSchema.parse(input);
  const supabase = await requireSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("issues").insert({ ...values, created_by: user?.id });
  if (error) throw new Error(error.message);
  revalidatePath("/pengawasan");
}

export async function createSupervisionAction(input: z.input<typeof supervisionSchema>) {
  const values = supervisionSchema.parse(input);
  const supabase = await requireSupabase();
  const profile = await getProfile(supabase);
  if (!["pml", "admin_kabupaten", "super_admin"].includes(profile.role)) throw new Error("Hanya PML atau admin yang dapat menyimpan pengawasan.");

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("district, village, sls_code, pml_id, pcl_id")
    .eq("id", values.assignment_id)
    .single();
  if (assignmentError || !assignment) throw new Error("Penugasan tidak ditemukan.");
  if (profile.role === "pml" && assignment.pml_id !== profile.petugas_id) throw new Error("PML hanya dapat menginput pengawasan untuk timnya.");

  const { assignment_id: _assignmentId, ...payloadValues } = values;
  const { data, error } = await supabase.from("supervisions").insert({
    ...payloadValues,
    pml_id: assignment.pml_id,
    pcl_id: assignment.pcl_id,
    district: assignment.district,
    village: assignment.village,
    sls_code: assignment.sls_code,
    created_by: profile.id
  }).select("id").single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, "create_supervision", "supervisions", data.id);
  revalidatePath("/pengawasan");
}

export async function createIssueTicketAction(input: z.input<typeof ticketSchema>) {
  const values = ticketSchema.parse(input);
  const supabase = await requireSupabase();
  const profile = await getProfile(supabase);
  if (profile.role === "pimpinan") throw new Error("Pimpinan bersifat read-only.");
  const { data, error } = await supabase.from("issue_tickets").insert({
    ...values,
    created_by: profile.id,
    status: "baru"
  }).select("id").single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, "create_issue_ticket", "issue_tickets", data.id, { urgency: values.urgency, category: values.category });
  revalidatePath("/pengawasan");
}

export async function saveAppSettingsAction(input: z.input<typeof appSettingsSchema>) {
  const values = appSettingsSchema.parse(input);
  const supabase = await requireSupabase();
  const profile = await getProfile(supabase);
  if (!["admin_kabupaten", "super_admin"].includes(profile.role)) throw new Error("Hanya admin yang dapat menyimpan pengaturan.");

  const { nama_kegiatan, tanggal_mulai, tanggal_selesai, target_kabupaten, ...settingsValues } = values;

  const { error } = await supabase
    .from("pengaturan_aplikasi")
    .upsert({ id: true, ...settingsValues }, { onConflict: "id" });
  if (error) throw new Error(error.message);

  const { error: kegiatanError } = await supabase
    .from("kegiatan")
    .upsert({
      nama: nama_kegiatan,
      tanggal_mulai,
      tanggal_selesai,
      target_kabupaten,
      aktif: true
    }, { onConflict: "nama" });
  if (kegiatanError) throw new Error(kegiatanError.message);

  await writeAuditLog(supabase, "update_app_settings", "pengaturan_aplikasi", "00000000-0000-0000-0000-000000000000", values);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return values;
}

export async function createImportBatchAction(input: z.input<typeof importBatchSchema>) {
  const values = importBatchSchema.parse(input);
  const supabase = await requireSupabase();
  const profile = await getProfile(supabase);
  if (!["admin_kabupaten", "super_admin"].includes(profile.role)) throw new Error("Hanya admin yang dapat mengimpor alokasi.");
  const { data, error } = await supabase.from("import_batches").insert({
    ...values,
    status: "validated",
    imported_by: profile.id
  }).select("id").single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, "create_import_batch", "import_batches", data.id, values.validation_summary);
  revalidatePath("/upload");
}

export async function deleteIssueAction(id: string) {
  const supabase = await requireSupabase();
  const { error } = await supabase.from("issues").delete().eq("id", z.string().uuid().parse(id));
  if (error) throw new Error(error.message);
  revalidatePath("/pengawasan");
}
