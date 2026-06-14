import { SimplePage } from "@/components/simple-page";
export default function Page() {
  return <SimplePage title="Laporan Harian" description="Daftar laporan PCL, status, dan audit trail." items={["Draft", "Dikirim", "Dikembalikan", "Disetujui"]} />;
}
