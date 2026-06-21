export function dashboardPathForRole(role?: string | null) {
  switch (role) {
    case "pcl":
      return "/dashboard-pcl";
    case "pml":
      return "/dashboard-pml";
    case "pimpinan":
      return "/dashboard-eksekutif";
    case "koordinator_kecamatan":
      return "/monitoring-kecamatan";
    case "admin_kabupaten":
    case "super_admin":
    default:
      return "/dashboard";
  }
}

export function formatRoleLabel(role?: string | null) {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    admin_kabupaten: "Admin Kabupaten",
    koordinator_kecamatan: "Koordinator Kecamatan",
    pml: "PML",
    pcl: "PCL",
    pimpinan: "Pimpinan",
    user: "User"
  };
  return labels[role ?? ""] ?? (role ?? "user").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
