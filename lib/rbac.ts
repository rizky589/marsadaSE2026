import type { AppRole } from "@/lib/types";

export const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin_kabupaten: "Admin Kabupaten",
  koordinator_kecamatan: "Koordinator Kecamatan",
  pml: "PML",
  pcl: "PCL",
  pimpinan: "Pimpinan"
};

export const rolePermissions: Record<AppRole, string[]> = {
  super_admin: ["Akses penuh", "Kelola seluruh akun", "Kelola role", "Atur kegiatan", "Buka laporan terkunci", "Lihat seluruh audit log"],
  admin_kabupaten: ["Lihat seluruh data", "Impor Excel", "Kelola wilayah", "Kelola PML/PCL", "Kelola penugasan", "Kelola target", "Ekspor laporan", "Lihat audit log"],
  koordinator_kecamatan: ["Lihat kecamatannya", "Lihat desa/SLS/PML/PCL", "Lihat progres", "Lihat kendala", "Unduh rekap kecamatan"],
  pml: ["Lihat PCL bawahan", "Periksa laporan PCL", "Setujui laporan", "Kembalikan laporan", "Input pengawasan", "Tindak lanjuti kendala", "Unduh rekap tim"],
  pcl: ["Lihat data sendiri", "Lihat wilayah tugas", "Input progres harian", "Perbaiki laporan dikembalikan", "Input kendala", "Lihat riwayat laporan"],
  pimpinan: ["Read-only", "Lihat dashboard", "Lihat rekap", "Unduh bahan evaluasi"]
};

export function canWrite(role: AppRole) {
  return role !== "pimpinan" && role !== "koordinator_kecamatan";
}

export function canReview(role: AppRole) {
  return role === "pml" || role === "admin_kabupaten" || role === "super_admin";
}
