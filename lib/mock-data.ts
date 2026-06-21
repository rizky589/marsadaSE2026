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

export const officers: Officer[] = [];
export const assignments: Assignment[] = [];
export const progress: DailyProgress[] = [];
export const issues: Issue[] = [];
export const supervisionActivities: SupervisionActivity[] = [];
export const issueTickets: IssueTicket[] = [];
export const dailyReports: DailyReport[] = [];
export const weeklySeries: { day: string; selesai: number; periksa: number }[] = [];
export const districtSeries: { name: string; target: number; selesai: number }[] = [];
