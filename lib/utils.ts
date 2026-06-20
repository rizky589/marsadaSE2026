import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date) {
  return format(new Date(value), "dd/MM/yyyy", { locale: id });
}

export function pct(done: number, target: number) {
  if (!target) return 0;
  const value = Math.min(100, (done / target) * 100);
  if (value > 0 && value < 1) return Number(value.toFixed(1));
  return Math.round(value);
}

export function numberId(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function percentId(value: number) {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value)}%`;
}
