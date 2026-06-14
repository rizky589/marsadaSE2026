import { assignments, dailyReports, districts, issues, officers } from "@/lib/mock-data";
import {
  assignmentProgress,
  dailyNeed,
  districtProgress,
  pmlProgress,
  productivity,
  progressCategory,
  progressCategoryLabel,
  regencyProgress
} from "@/lib/progress-calculations";

export const today = "2026-05-04";

export function getLastReportDate(assignmentId: string) {
  return dailyReports
    .filter((report) => report.assignmentId === assignmentId)
    .map((report) => report.reportDate)
    .sort()
    .at(-1);
}

export function getPclDashboard(pclId = "pcl-001") {
  const ownedAssignments = assignments.filter((assignment) => assignment.pclId === pclId);
  const ownedReports = dailyReports.filter((report) => report.pclId === pclId);
  const target = ownedAssignments.reduce((sum, assignment) => sum + assignment.load, 0);
  const completed = ownedReports.filter((report) => report.status === "disetujui").reduce((sum, report) => sum + report.completedToday, 0);
  const todayDone = ownedReports.filter((report) => report.reportDate === today).reduce((sum, report) => sum + report.completedToday, 0);
  const remaining = Math.max(0, target - completed);
  const percent = target ? (completed / target) * 100 : 0;
  const category = progressCategory(percent, completed > 0);

  return {
    officer: officers.find((officer) => officer.id === pclId),
    target,
    completed,
    remaining,
    percent,
    todayDone,
    dailyNeed: dailyNeed(remaining),
    remainingDays: 57,
    category,
    categoryLabel: progressCategoryLabel(category),
    assignments: ownedAssignments.map((assignment) => {
      const progress = assignmentProgress(assignment, dailyReports);
      const status = progressCategory(progress.percent, progress.completed > 0);
      return {
        ...assignment,
        completed: progress.completed,
        remaining: progress.remaining,
        percent: progress.percent,
        status,
        statusLabel: progressCategoryLabel(status),
        lastReported: getLastReportDate(assignment.id)
      };
    })
  };
}

export function getPmlDashboard(pmlId = "pml-001") {
  const teamAssignments = assignments.filter((assignment) => assignment.pmlId === pmlId);
  const pclIds = [...new Set(teamAssignments.map((assignment) => assignment.pclId))];
  const teamProgress = pmlProgress(pmlId, assignments, dailyReports);
  const todayReporterIds = new Set(dailyReports.filter((report) => report.reportDate === today && pclIds.includes(report.pclId)).map((report) => report.pclId));
  const pendingReports = dailyReports.filter((report) => report.status === "dikirim" && teamAssignments.some((assignment) => assignment.id === report.assignmentId)).length;

  return {
    officer: officers.find((officer) => officer.id === pmlId),
    pclCount: pclIds.length,
    slsCount: teamAssignments.length,
    target: teamProgress.target,
    completed: teamProgress.completed,
    remaining: teamProgress.remaining,
    percent: teamProgress.percent,
    activeToday: todayReporterIds.size,
    notReported: Math.max(0, pclIds.length - todayReporterIds.size),
    pendingReports,
    activeIssues: issues.filter((issue) => issue.status !== "Selesai").length,
    pclRows: pclIds.map((pclId) => {
      const pclAssignments = assignments.filter((assignment) => assignment.pclId === pclId);
      const target = pclAssignments.reduce((sum, assignment) => sum + assignment.load, 0);
      const reports = dailyReports.filter((report) => report.pclId === pclId);
      const completed = reports.filter((report) => report.status === "disetujui").reduce((sum, report) => sum + report.completedToday, 0);
      const todayDone = reports.filter((report) => report.reportDate === today).reduce((sum, report) => sum + report.completedToday, 0);
      const returned = reports.filter((report) => report.status === "dikembalikan").length;
      const percent = target ? (completed / target) * 100 : 0;
      const status = progressCategory(percent, completed > 0);
      return {
        id: pclId,
        name: officers.find((officer) => officer.id === pclId)?.name ?? "-",
        slsCount: pclAssignments.length,
        target,
        todayDone,
        completed,
        remaining: Math.max(0, target - completed),
        percent,
        dailyNeed: dailyNeed(Math.max(0, target - completed)),
        lastReported: reports.map((report) => report.reportDate).sort().at(-1),
        statusLabel: progressCategoryLabel(status),
        returned
      };
    })
  };
}

export function getKabupatenDashboard() {
  const regency = regencyProgress(assignments, dailyReports);
  const pmls = officers.filter((officer) => officer.role === "PML");
  const pcls = officers.filter((officer) => officer.role === "PCL");
  const activeToday = new Set(dailyReports.filter((report) => report.reportDate === today).map((report) => report.pclId)).size;
  const pendingReports = dailyReports.filter((report) => report.status === "dikirim").length;
  const villages = new Set(assignments.map((assignment) => `${assignment.district}/${assignment.village}`));
  const criticalIssues = issues.filter((issue) => issue.status === "Terbuka").length;

  return {
    districtCount: districts.length,
    villageCount: villages.size,
    slsCount: assignments.length,
    pmlCount: pmls.length,
    pclCount: pcls.length,
    target: regency.target,
    completed: regency.completed,
    remaining: regency.remaining,
    percent: regency.percent,
    activeToday,
    notReported: Math.max(0, pcls.length - activeToday),
    pendingReports,
    activeIssues: issues.filter((issue) => issue.status !== "Selesai").length,
    criticalIssues,
    districtRows: districts.map((district) => {
      const progress = districtProgress(district, assignments, dailyReports);
      return { name: district, target: progress.target, selesai: progress.completed, progress: Math.round(progress.percent) };
    }),
    pmlRows: pmls.map((pml) => {
      const progress = pmlProgress(pml.id, assignments, dailyReports);
      return { name: pml.name, target: progress.target, selesai: progress.completed, progress: Math.round(progress.percent) };
    }),
    burdenRows: pcls.map((pcl) => ({
      name: pcl.name,
      target: assignments.filter((assignment) => assignment.pclId === pcl.id).reduce((sum, assignment) => sum + assignment.load, 0)
    })),
    statusRows: ["draft", "dikirim", "dikembalikan", "disetujui", "dibuka_kembali"].map((status) => ({
      status,
      jumlah: dailyReports.filter((report) => report.status === status).length
    })),
    productivityRows: ["28/04", "29/04", "30/04", "01/05", "02/05", "03/05", "04/05"].map((day, index) => ({
      day,
      selesai: [0, 0, 0, 0, 0, 73, 0][index]
    })),
    lowPclRows: pcls.map((pcl) => {
      const row = getPmlDashboard(pcl.supervisorId ?? "pml-001").pclRows.find((item) => item.id === pcl.id);
      return { name: pcl.name, progress: Math.round(row?.percent ?? 0) };
    }).sort((a, b) => a.progress - b.progress),
    highNeedRows: pcls.map((pcl) => {
      const row = getPmlDashboard(pcl.supervisorId ?? "pml-001").pclRows.find((item) => item.id === pcl.id);
      return { name: pcl.name, kebutuhan: Math.ceil(row?.dailyNeed ?? 0) };
    }).sort((a, b) => b.kebutuhan - a.kebutuhan),
    issueRows: ["Wilayah", "Lapangan", "Teknis", "Lainnya"].map((category) => ({
      category,
      jumlah: issues.filter((issue) => issue.category === category).length
    }))
  };
}

export function formatAverage(value: number) {
  return Math.round(value).toLocaleString("id-ID");
}
