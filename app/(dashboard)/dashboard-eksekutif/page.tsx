import { SimplePage } from "@/components/simple-page";
export default function Page() {
  return <SimplePage title="Dashboard Eksekutif" description="Ringkasan read-only untuk pimpinan." items={["Progres kabupaten", "Progres kecamatan", "Kendala kritis", "Bahan evaluasi"]} />;
}
