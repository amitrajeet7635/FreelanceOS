import { format, formatDistanceToNow, differenceInDays, parseISO } from "date-fns";

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function weekStartISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().split("T")[0];
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM yyyy");
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function daysUntil(date: string | Date): number {
  const d = typeof date === "string" ? parseISO(date) : date;
  return differenceInDays(d, new Date());
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function pct(val: number, total: number): number {
  if (total === 0) return 0;
  return clamp(Math.round((val / total) * 100), 0, 100);
}
