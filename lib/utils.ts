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
  if (value > 0 && value < 0.01) return Number(value.toFixed(3));
  if (value > 0 && value < 1) return Number(value.toFixed(2));
  return Math.round(value);
}

export function numberId(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function percentId(value: number) {
  const maximumFractionDigits = value > 0 && value < 0.01 ? 3 : value > 0 && value < 1 ? 2 : 1;
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits }).format(value)}%`;
}
