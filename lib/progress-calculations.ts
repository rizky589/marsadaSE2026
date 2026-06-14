import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Assignment, DailyReport, Officer } from "@/lib/types";

export type ProgressThresholds = {
  greenMin: number;
  yellowMin: number;
  orangeMin: number;
};

export type ProgressCategory = "hijau" | "kuning" | "oranye" | "merah" | "abu-abu";

export const defaultProgressThresholds: ProgressThresholds = {
  greenMin: -5,
  yellowMin: -10,
  orangeMin: -20
};

export const activityCalendar = {
  start: "2026-05-01",
  end: "2026-06-30",
  asOf: "2026-05-04"
};

export function safePct(done: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, (done / target) * 100));
}

export function safeDiv(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export function officialCompleted(reports: DailyReport[], assignmentId?: string) {
  return reports
    .filter((report) => report.status === "disetujui" && (!assignmentId || report.assignmentId === assignmentId))
    .reduce((sum, report) => sum + report.completedToday, 0);
}

export function cumulativeBefore(report: DailyReport, reports: DailyReport[]) {
  return reports
    .filter((item) => item.assignmentId === report.assignmentId && item.status === "disetujui" && item.reportDate < report.reportDate)
    .reduce((sum, item) => sum + item.completedToday, 0);
}

export function assignmentProgress(assignment: Assignment, reports: DailyReport[]) {
  const completed = officialCompleted(reports, assignment.id);
  const remaining = Math.max(0, assignment.load - completed);
  return {
    target: assignment.load,
    completed,
    remaining,
    percent: safePct(completed, assignment.load)
  };
}

export function pclProgress(pclId: string, assignments: Assignment[], reports: DailyReport[]) {
  const owned = assignments.filter((assignment) => assignment.pclId === pclId);
  return aggregateProgress(owned, reports);
}

export function pmlProgress(pmlId: string, assignments: Assignment[], reports: DailyReport[]) {
  const owned = assignments.filter((assignment) => assignment.pmlId === pmlId);
  return aggregateProgress(owned, reports);
}

export function villageProgress(village: string, assignments: Assignment[], reports: DailyReport[]) {
  return aggregateProgress(assignments.filter((assignment) => assignment.village === village), reports);
}

export function districtProgress(district: string, assignments: Assignment[], reports: DailyReport[]) {
  return aggregateProgress(assignments.filter((assignment) => assignment.district === district), reports);
}

export function regencyProgress(assignments: Assignment[], reports: DailyReport[]) {
  return aggregateProgress(assignments, reports);
}

export function aggregateProgress(scopeAssignments: Assignment[], reports: DailyReport[]) {
  const target = scopeAssignments.reduce((sum, assignment) => sum + assignment.load, 0);
  const assignmentIds = new Set(scopeAssignments.map((assignment) => assignment.id));
  const completed = reports
    .filter((report) => report.status === "disetujui" && assignmentIds.has(report.assignmentId))
    .reduce((sum, report) => sum + report.completedToday, 0);
  const remaining = Math.max(0, target - completed);
  return {
    target,
    completed,
    remaining,
    percent: safePct(completed, target)
  };
}

export function activeDays(start: string, asOf: string) {
  return Math.max(0, differenceInCalendarDays(parseISO(asOf), parseISO(start)) + 1);
}

export function totalDays(start: string, end: string) {
  return Math.max(0, differenceInCalendarDays(parseISO(end), parseISO(start)) + 1);
}

export function productivity(completed: number, start = activityCalendar.start, asOf = activityCalendar.asOf) {
  return safeDiv(completed, activeDays(start, asOf));
}

export function dailyNeed(remaining: number, asOf = activityCalendar.asOf, end = activityCalendar.end) {
  const remainingDays = Math.max(0, differenceInCalendarDays(parseISO(end), parseISO(asOf)));
  return safeDiv(remaining, remainingDays);
}

export function timeProgress(start = activityCalendar.start, end = activityCalendar.end, asOf = activityCalendar.asOf) {
  return safePct(activeDays(start, asOf), totalDays(start, end));
}

export function progressCategory(realization: number, hasReport: boolean, thresholds: ProgressThresholds = defaultProgressThresholds) {
  if (!hasReport) return "abu-abu" satisfies ProgressCategory;
  const diff = realization - timeProgress();
  if (diff >= thresholds.greenMin) return "hijau" satisfies ProgressCategory;
  if (diff >= thresholds.yellowMin) return "kuning" satisfies ProgressCategory;
  if (diff >= thresholds.orangeMin) return "oranye" satisfies ProgressCategory;
  return "merah" satisfies ProgressCategory;
}

export function progressCategoryLabel(category: ProgressCategory) {
  const labels: Record<ProgressCategory, string> = {
    hijau: "Hijau",
    kuning: "Kuning",
    oranye: "Oranye",
    merah: "Merah",
    "abu-abu": "Belum ada laporan"
  };
  return labels[category];
}

export function officerName(officers: Officer[], id: string) {
  return officers.find((officer) => officer.id === id)?.name ?? "-";
}
