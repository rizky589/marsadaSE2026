import type { AppRole } from "@/lib/types";

export const roleLabels: Record<AppRole, string> = {
  super_admin: "Admin Kabupaten",
  admin_kabupaten: "Admin Kabupaten",
  koordinator_kecamatan: "Admin Kabupaten",
  pml: "Admin Kabupaten",
  pcl: "Admin Kabupaten",
  pimpinan: "Admin Kabupaten"
};

export const rolePermissions: Record<AppRole, string[]> = {
  super_admin: ["Lihat seluruh data", "Impor Excel", "Kelola wilayah", "Kelola PML/PCL", "Kelola penugasan", "Kelola target", "Ekspor laporan", "Lihat audit log"],
  admin_kabupaten: ["Lihat seluruh data", "Impor Excel", "Kelola wilayah", "Kelola PML/PCL", "Kelola penugasan", "Kelola target", "Ekspor laporan", "Lihat audit log"],
  koordinator_kecamatan: ["Lihat seluruh data", "Impor Excel", "Kelola wilayah", "Kelola PML/PCL", "Kelola penugasan", "Kelola target", "Ekspor laporan", "Lihat audit log"],
  pml: ["Lihat seluruh data", "Impor Excel", "Kelola wilayah", "Kelola PML/PCL", "Kelola penugasan", "Kelola target", "Ekspor laporan", "Lihat audit log"],
  pcl: ["Lihat seluruh data", "Impor Excel", "Kelola wilayah", "Kelola PML/PCL", "Kelola penugasan", "Kelola target", "Ekspor laporan", "Lihat audit log"],
  pimpinan: ["Lihat seluruh data", "Impor Excel", "Kelola wilayah", "Kelola PML/PCL", "Kelola penugasan", "Kelola target", "Ekspor laporan", "Lihat audit log"]
};

export function canWrite(role: AppRole) {
  return role === "admin_kabupaten" || role === "super_admin";
}

export function canReview(role: AppRole) {
  return role === "admin_kabupaten" || role === "super_admin";
}
