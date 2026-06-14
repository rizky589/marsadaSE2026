import type { Assignment, DailyProgress, DailyReport, Issue, IssueTicket, Officer, SupervisionActivity } from "@/lib/types";

export const districts = [
  "Aek Kuo",
  "Aek Natas",
  "Kualuh Hilir",
  "Kualuh Hulu",
  "Kualuh Leidong",
  "Kualuh Selatan",
  "Marbau",
  "Na IX-X"
];

export const officers: Officer[] = [
  { id: "pml-001", name: "Maya Sari", role: "PML", district: "Kualuh Hulu", target: 3840, progress: 2560, status: "Aman" },
  { id: "pml-002", name: "Rizky Pratama", role: "PML", district: "Aek Natas", target: 4210, progress: 2714, status: "Perlu Perhatian" },
  { id: "pcl-001", name: "Andi Saputra", role: "PCL", district: "Kualuh Hulu", village: "Aek Kanopan", supervisorId: "pml-001", target: 560, progress: 420, status: "Aman" },
  { id: "pcl-002", name: "Nabila Putri", role: "PCL", district: "Kualuh Hulu", village: "Aek Kanopan", supervisorId: "pml-001", target: 510, progress: 299, status: "Perlu Perhatian" },
  { id: "pcl-003", name: "Fajar Harahap", role: "PCL", district: "Aek Natas", village: "Simonis", supervisorId: "pml-002", target: 610, progress: 332, status: "Perlu Perhatian" }
];

export const assignments: Assignment[] = [
  { id: "als-001", district: "Kualuh Hulu", village: "Aek Kanopan", sls: "001A", subSlsId: "12.23.040.001A", load: 282, pml: "Maya Sari", pmlId: "pml-001", pcl: "Andi Saputra", pclId: "pcl-001" },
  { id: "als-002", district: "Kualuh Hulu", village: "Aek Kanopan", sls: "001B", subSlsId: "12.23.040.001B", load: 278, pml: "Maya Sari", pmlId: "pml-001", pcl: "Andi Saputra", pclId: "pcl-001" },
  { id: "als-003", district: "Kualuh Hulu", village: "Aek Kanopan", sls: "002A", subSlsId: "12.23.040.002A", load: 510, pml: "Maya Sari", pmlId: "pml-001", pcl: "Nabila Putri", pclId: "pcl-002" },
  { id: "als-004", district: "Aek Natas", village: "Simonis", sls: "011A", subSlsId: "12.23.020.011A", load: 320, pml: "Rizky Pratama", pmlId: "pml-002", pcl: "Fajar Harahap", pclId: "pcl-003" },
  { id: "als-005", district: "Aek Natas", village: "Simonis", sls: "011B", subSlsId: "12.23.020.011B", load: 290, pml: "Rizky Pratama", pmlId: "pml-002", pcl: "Fajar Harahap", pclId: "pcl-003" }
];

export const progress: DailyProgress[] = [
  { id: "prog-001", date: "2026-05-02", pclName: "Andi Saputra", district: "Kualuh Hulu", target: 560, completed: 420, checked: 382 },
  { id: "prog-002", date: "2026-05-02", pclName: "Nabila Putri", district: "Kualuh Hulu", target: 510, completed: 299, checked: 240, issue: "Butuh validasi batas SLS" },
  { id: "prog-003", date: "2026-05-02", pclName: "Fajar Harahap", district: "Aek Natas", target: 610, completed: 332, checked: 280, issue: "Cuaca menghambat kunjungan" },
  { id: "prog-004", date: "2026-05-03", pclName: "Andi Saputra", district: "Kualuh Hulu", target: 560, completed: 447, checked: 410 },
  { id: "prog-005", date: "2026-05-03", pclName: "Nabila Putri", district: "Kualuh Hulu", target: 510, completed: 322, checked: 270 }
];

export const issues: Issue[] = [
  { id: "kendala-001", date: "2026-05-02", location: "Aek Kanopan", category: "Wilayah", description: "Perlu konfirmasi batas Sub-SLS dengan aparat desa.", status: "Diproses" },
  { id: "kendala-002", date: "2026-05-03", location: "Simonis", category: "Lapangan", description: "Akses lokasi tertunda karena cuaca.", status: "Terbuka" }
];

export const supervisionActivities: SupervisionActivity[] = [
  {
    id: "was-001",
    date: "2026-05-04",
    pmlName: "Maya Sari",
    pclName: "Andi Saputra",
    district: "Kualuh Hulu",
    village: "Aek Kanopan",
    sls: "001A",
    type: "Pemeriksaan lapangan",
    inspectedObjects: 18,
    result: "Sebagian besar sesuai, perlu koreksi klasifikasi pending.",
    matched: 15,
    needFix: 3,
    issue: "Beberapa objek belum bertemu perlu jadwal ulang.",
    direction: "Pisahkan pending, belum bertemu, dan kunjungan ulang.",
    followUp: "PCL memperbaiki laporan harian berikutnya.",
    followUpStatus: "diproses"
  }
];

export const issueTickets: IssueTicket[] = [
  {
    id: "tik-001",
    date: "2026-05-04",
    createdBy: "Andi Saputra",
    assignedTo: "Maya Sari",
    district: "Kualuh Hulu",
    village: "Aek Kanopan",
    sls: "001A",
    category: "responden sulit ditemui",
    urgency: "sedang",
    description: "Beberapa objek perlu kunjungan setelah jam kerja.",
    followUp: "PML menyarankan kunjungan ulang sore.",
    status: "diproses PML"
  },
  {
    id: "tik-002",
    date: "2026-05-04",
    createdBy: "Nabila Putri",
    assignedTo: "Admin Kabupaten",
    district: "Kualuh Hulu",
    village: "Aek Kanopan",
    sls: "002A",
    category: "target tidak sesuai",
    urgency: "tinggi",
    description: "Muatan lapangan terindikasi berbeda dengan daftar alokasi.",
    status: "diteruskan admin"
  }
];

export const dailyReports: DailyReport[] = [
  {
    id: "lap-001",
    reportDate: "2026-05-03",
    assignmentId: "als-001",
    pclId: "pcl-001",
    pclName: "Andi Saputra",
    district: "Kualuh Hulu",
    village: "Aek Kanopan",
    sls: "001A",
    subSlsId: "12.23.040.001A",
    pml: "Maya Sari",
    target: 282,
    startTime: "08:00",
    endTime: "15:30",
    visited: 48,
    completedToday: 42,
    pending: 6,
    revisit: 4,
    notMet: 2,
    refused: 0,
    temporarilyClosed: 1,
    permanentlyClosed: 0,
    moved: 0,
    notFound: 0,
    duplicate: 0,
    newBusiness: 3,
    note: "Progres lancar, perlu kunjungan ulang sore.",
    issue: "",
    followUpPlan: "Kunjungan ulang setelah jam kerja.",
    status: "disetujui",
    pmlNote: "Disetujui, bukti pengawasan lengkap.",
    submittedAt: "2026-05-03T09:00:00+07:00",
    reviewedAt: "2026-05-03T16:00:00+07:00"
  },
  {
    id: "lap-002",
    reportDate: "2026-05-03",
    assignmentId: "als-002",
    pclId: "pcl-001",
    pclName: "Andi Saputra",
    district: "Kualuh Hulu",
    village: "Aek Kanopan",
    sls: "001B",
    subSlsId: "12.23.040.001B",
    pml: "Maya Sari",
    target: 278,
    startTime: "08:15",
    endTime: "14:45",
    visited: 36,
    completedToday: 31,
    pending: 5,
    revisit: 3,
    notMet: 2,
    refused: 0,
    temporarilyClosed: 0,
    permanentlyClosed: 0,
    moved: 0,
    notFound: 0,
    duplicate: 0,
    newBusiness: 1,
    note: "Perlu koreksi jumlah pending.",
    issue: "Ada perbedaan catatan kunjungan ulang.",
    followUpPlan: "Perbaiki rincian sebelum dikirim ulang.",
    status: "dikembalikan",
    pmlNote: "Mohon pisahkan pending dan belum bertemu."
  },
  {
    id: "lap-003",
    reportDate: "2026-05-04",
    assignmentId: "als-003",
    pclId: "pcl-002",
    pclName: "Nabila Putri",
    district: "Kualuh Hulu",
    village: "Aek Kanopan",
    sls: "002A",
    subSlsId: "12.23.040.002A",
    pml: "Maya Sari",
    target: 510,
    startTime: "08:00",
    endTime: "13:30",
    visited: 28,
    completedToday: 24,
    pending: 4,
    revisit: 2,
    notMet: 1,
    refused: 1,
    temporarilyClosed: 0,
    permanentlyClosed: 0,
    moved: 0,
    notFound: 0,
    duplicate: 0,
    newBusiness: 2,
    status: "dikirim",
    submittedAt: "2026-05-04T14:00:00+07:00"
  }
];

export const weeklySeries = [
  { day: "Sen", selesai: 1850, periksa: 1510 },
  { day: "Sel", selesai: 2490, periksa: 2090 },
  { day: "Rab", selesai: 3260, periksa: 2840 },
  { day: "Kam", selesai: 4210, periksa: 3600 },
  { day: "Jum", selesai: 5140, periksa: 4380 },
  { day: "Sab", selesai: 6020, periksa: 5100 },
  { day: "Min", selesai: 6410, periksa: 5480 }
];

export const districtSeries = districts.map((name, index) => ({
  name,
  target: [15320, 14870, 13690, 18110, 12140, 15450, 16020, 15400][index],
  selesai: [9210, 8840, 7410, 11920, 6250, 9720, 10450, 9010][index]
}));
