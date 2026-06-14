export type AppRole = "super_admin" | "admin_kabupaten" | "koordinator_kecamatan" | "pml" | "pcl" | "pimpinan";
export type Role = AppRole;
export type ReportStatus = "draft" | "dikirim" | "dikembalikan" | "disetujui" | "dibuka_kembali";
export type SupervisionStatus = "belum ditindaklanjuti" | "diproses" | "selesai";
export type TicketStatus = "baru" | "diproses PML" | "diteruskan admin" | "selesai" | "ditutup";
export type TicketUrgency = "rendah" | "sedang" | "tinggi" | "kritis";
export type TicketCategory =
  | "responden sulit ditemui"
  | "penolakan"
  | "wilayah sulit dijangkau"
  | "target tidak sesuai"
  | "muatan tidak ditemukan"
  | "aplikasi resmi bermasalah"
  | "jaringan internet"
  | "akun petugas"
  | "perangkat"
  | "administrasi"
  | "lainnya";

export type Officer = {
  id: string;
  name: string;
  role: "PML" | "PCL" | "Admin";
  district: string;
  village?: string;
  supervisorId?: string;
  target: number;
  progress: number;
  status: "Aman" | "Perlu Perhatian" | "Kritis";
};

export type DailyProgress = {
  id: string;
  date: string;
  pclName: string;
  district: string;
  target: number;
  completed: number;
  checked: number;
  issue?: string;
};

export type Assignment = {
  id: string;
  district: string;
  village: string;
  sls: string;
  subSlsId: string;
  load: number;
  pml: string;
  pmlId: string;
  pcl: string;
  pclId: string;
};

export type Issue = {
  id: string;
  date: string;
  location: string;
  category: string;
  description: string;
  status: "Terbuka" | "Diproses" | "Selesai";
};

export type SupervisionActivity = {
  id: string;
  date: string;
  pmlName: string;
  pclName: string;
  district: string;
  village: string;
  sls: string;
  type: string;
  inspectedObjects: number;
  result: string;
  matched: number;
  needFix: number;
  issue?: string;
  direction?: string;
  followUp?: string;
  followUpStatus: SupervisionStatus;
  documentationUrl?: string;
};

export type IssueTicket = {
  id: string;
  date: string;
  createdBy: string;
  assignedTo?: string;
  district: string;
  village: string;
  sls?: string;
  category: TicketCategory;
  urgency: TicketUrgency;
  description: string;
  followUp?: string;
  status: TicketStatus;
};

export type DailyReport = {
  id: string;
  reportDate: string;
  assignmentId: string;
  pclId: string;
  pclName: string;
  district: string;
  village: string;
  sls: string;
  subSlsId: string;
  pml: string;
  target: number;
  startTime: string;
  endTime: string;
  visited: number;
  completedToday: number;
  pending: number;
  revisit: number;
  notMet: number;
  refused: number;
  temporarilyClosed: number;
  permanentlyClosed: number;
  moved: number;
  notFound: number;
  duplicate: number;
  newBusiness: number;
  note?: string;
  issue?: string;
  followUpPlan?: string;
  documentationUrl?: string;
  status: ReportStatus;
  pmlNote?: string;
  submittedAt?: string;
  reviewedAt?: string;
};
