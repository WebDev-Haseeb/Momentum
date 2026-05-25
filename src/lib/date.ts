import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  differenceInCalendarDays,
  parseISO,
} from "date-fns";

export function todayKey(d: Date = new Date()) {
  return format(d, "yyyy-MM-dd");
}

export function formatDueLabel(iso?: string): string {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  const diff = differenceInCalendarDays(d, new Date());
  if (diff > 0 && diff <= 6) return format(d, "EEEE");
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return format(d, "MMM d");
}

export function isOverdue(iso?: string) {
  if (!iso) return false;
  const due = parseISO(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}
