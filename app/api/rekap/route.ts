import { NextResponse } from "next/server";
import { assignments, dailyReports, districts } from "@/lib/mock-data";
import { dailyNeed, districtProgress, productivity, regencyProgress } from "@/lib/progress-calculations";

export async function GET() {
  const rows = districts.map((district) => {
    const progress = districtProgress(district, assignments, dailyReports);
    return {
      name: district,
      target: progress.target,
      selesai_resmi: progress.completed,
      sisa: progress.remaining,
      progres: Number(progress.percent.toFixed(2)),
      rata_rata_harian: Number(productivity(progress.completed).toFixed(2)),
      kebutuhan_harian: Number(dailyNeed(progress.remaining).toFixed(2))
    };
  });
  const kabupaten = regencyProgress(assignments, dailyReports);

  return NextResponse.json({
    timezone: "Asia/Jakarta",
    generatedAt: new Date().toISOString(),
    kabupaten: {
      target: kabupaten.target,
      selesai_resmi: kabupaten.completed,
      sisa: kabupaten.remaining,
      progres: Number(kabupaten.percent.toFixed(2))
    },
    rows
  });
}
