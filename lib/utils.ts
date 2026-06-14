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
  return Math.min(100, Math.round((done / target) * 100));
}

export function numberId(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}
