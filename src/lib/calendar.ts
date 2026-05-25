import type { Task, ReminderMode } from "./types";

/**
 * Generate an .ics calendar event string for a task.
 * Includes a VALARM (alarm) if a reminderMode is set.
 */
export function generateICS(task: Task): string {
  if (!task.dueDate || !task.dueTime) return "";

  // Parse the date from the ISO dueDate (just need YYYY-MM-DD)
  const datePart = task.dueDate.slice(0, 10).replace(/-/g, "");
  const [hourStr] = task.dueTime.split(":");
  const hour = parseInt(hourStr, 10);
  const timePart = `${String(hour).padStart(2, "0")}0000`;

  const dtStart = `${datePart}T${timePart}`;
  // End time = start + 1 hour
  const endHour = (hour + 1) % 24;
  const dtEnd = `${datePart}T${String(endHour).padStart(2, "0")}0000`;

  const uid = `${task.id}@momentum.app`;
  const now = new Date();
  const dtstamp = formatICSDate(now);
  const summary = escapeICS(task.title);
  const description = task.description ? escapeICS(task.description) : "";

  let alarm = "";
  if (task.reminderMode && task.reminderMode !== "none") {
    const minutes = REMINDER_MINUTES[task.reminderMode];
    if (minutes !== undefined) {
      alarm = [
        "BEGIN:VALARM",
        "TRIGGER:-PT" + minutes + "M",
        "ACTION:DISPLAY",
        `DESCRIPTION:${summary} — in ${minutes} minutes`,
        "END:VALARM",
      ].join("\r\n");
    }
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Momentum//Task Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    ...(description ? [`DESCRIPTION:${description}`] : []),
    "STATUS:CONFIRMED",
    ...(alarm ? [alarm] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

const REMINDER_MINUTES: Partial<Record<ReminderMode, number>> = {
  "10min": 10,
  "15min": 15,
  "30min": 30,
};

function formatICSDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Download an .ics file for the given task, or open it on mobile.
 */
export function downloadCalendarEvent(task: Task): boolean {
  const ics = generateICS(task);
  if (!ics) return false;

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // On mobile, try to open the .ics which triggers the native calendar add flow
  // On desktop, it downloads the file
  const a = document.createElement("a");
  a.href = url;
  a.download = `${task.title.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up the object URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}
