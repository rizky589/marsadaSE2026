import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import type { Assignment } from "@/lib/types";

type RawAllocationRow = Record<string, string | number | boolean | null | undefined>;

function normalize(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function toNumber(value: unknown) {
  const parsed = Number(String(value ?? "0").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function resolvePclName(name: string, pml: string) {
  if (name === "SUGIANTO" && pml === "ISMAIL MUNTHE") return "SUGIANTO - TIM ISMAIL MUNTHE";
  if (name === "SUGIANTO" && pml === "RAHMAT PAUJI HASIBUAN") return "SUGIANTO - TIM RAHMAT PAUJI HASIBUAN";
  return name;
}

export function getImportedAllocations(limit = 50): Assignment[] {
  const filePath = path.join(process.cwd(), "alokasi.xlsx");
  if (!existsSync(filePath)) return [];

  let rows: RawAllocationRow[] = [];
  try {
    const workbook = XLSX.readFile(filePath, { cellDates: false, raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<RawAllocationRow>(sheet, { defval: "", raw: false });
  } catch {
    return [];
  }

  return rows
    .map((row, index) => {
      const load = toNumber(row.Muatan);
      const pml = normalize(row["Nama Pengawas"]);
      const pcl = resolvePclName(normalize(row["Nama Pendata"]), pml);
      return {
        id: `import-${toText(row.idsubsls_25_2) || index}`,
        district: titleCase(normalize(row.nmkec)),
        village: titleCase(normalize(row.nmdesa)),
        sls: normalize(row.nmsls),
        subSlsId: toText(row.idsubsls_25_2),
        load,
        pml: titleCase(pml),
        pmlId: `pml-${pml.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        pcl: titleCase(pcl),
        pclId: `pcl-${pcl.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
      };
    })
    .filter((row) => row.subSlsId && row.load > 0)
    .slice(0, limit);
}
