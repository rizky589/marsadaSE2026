export type ImportedAllocationRow = {
  kecamatan: string;
  desa: string;
  namaSls: string;
  kodeSubSls: string;
  idSubSls: string;
  targetAwal: number;
  pml: string;
  pcl: string;
};

export const importedAllocationsStorageKey = "marsada-imported-allocations";

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function resolvePclName(name: string, pml: string) {
  const normalizedName = normalizeName(name);
  const normalizedPml = normalizeName(pml);
  if (normalizedName === "SUGIANTO" && normalizedPml === "ISMAIL MUNTHE") return "SUGIANTO - TIM ISMAIL MUNTHE";
  if (normalizedName === "SUGIANTO" && normalizedPml === "RAHMAT PAUJI HASIBUAN") return "SUGIANTO - TIM RAHMAT PAUJI HASIBUAN";
  return normalizedName;
}

export function loadImportedAllocations() {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(importedAllocationsStorageKey);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved) as { rows?: ImportedAllocationRow[] };
    return (parsed.rows ?? []).filter((row) => row.idSubSls && row.targetAwal > 0);
  } catch {
    window.localStorage.removeItem(importedAllocationsStorageKey);
    return [];
  }
}

export function summarizeImportedAllocations(rows: ImportedAllocationRow[]) {
  const kecamatan = new Set<string>();
  const desa = new Set<string>();
  const sls = new Set<string>();
  const pml = new Set<string>();
  const pcl = new Set<string>();

  rows.forEach((row) => {
    kecamatan.add(normalizeName(row.kecamatan));
    desa.add(`${normalizeName(row.kecamatan)}|${normalizeName(row.desa)}`);
    sls.add(row.idSubSls);
    pml.add(normalizeName(row.pml));
    pcl.add(`${normalizeName(row.pml)}|${resolvePclName(row.pcl, row.pml)}`);
  });

  return {
    kecamatan: kecamatan.size,
    desa: desa.size,
    sls: sls.size,
    pml: pml.size,
    pcl: pcl.size,
    target: rows.reduce((sum, row) => sum + row.targetAwal, 0)
  };
}
