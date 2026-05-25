import type { Task, Habit, Note } from "./types";
import { format } from "date-fns";

export type ExportFormat = "md" | "txt" | "json";
export type ExportScope =
  | "all"
  | "tasks-active"
  | "tasks-completed"
  | "tasks-archived"
  | "notes"
  | "habits";

interface Bundle {
  tasks: Task[];
  notes: Note[];
  habits: Habit[];
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return format(new Date(iso), "yyyy-MM-dd");
  } catch {
    return iso;
  }
}

function taskToMd(t: Task) {
  return [
    `# ${t.title}`,
    ``,
    `Priority: ${t.priority}`,
    `Status: ${t.status}`,
    t.dueDate ? `Due Date: ${fmtDate(t.dueDate)}` : null,
    `Created: ${fmtDate(t.createdAt)}`,
    t.description ? `\nDescription:\n${t.description}` : null,
    `\n---\n`,
  ]
    .filter(Boolean)
    .join("\n");
}

function noteToMd(n: Note) {
  return [
    `# ${n.title || "Untitled"}`,
    ``,
    n.content,
    ``,
    `Created: ${fmtDate(n.createdAt)}`,
    `\n---\n`,
  ].join("\n");
}

function habitToMd(h: Habit) {
  return [
    `# ${h.name}`,
    ``,
    `Created: ${fmtDate(h.createdAt)}`,
    `Total Completions: ${h.history.length}`,
    h.history.length
      ? `\nCompletion History:\n${h.history
          .sort()
          .map((d) => `- ${d}`)
          .join("\n")}`
      : null,
    `\n---\n`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildScope(bundle: Bundle, scope: ExportScope) {
  switch (scope) {
    case "all":
      return bundle;
    case "tasks-active":
      return { tasks: bundle.tasks.filter((t) => t.status === "pending"), notes: [], habits: [] };
    case "tasks-completed":
      return { tasks: bundle.tasks.filter((t) => t.status === "completed"), notes: [], habits: [] };
    case "tasks-archived":
      return { tasks: bundle.tasks.filter((t) => t.status === "archived"), notes: [], habits: [] };
    case "notes":
      return { tasks: [], notes: bundle.notes, habits: [] };
    case "habits":
      return { tasks: [], notes: [], habits: bundle.habits };
  }
}

export function toMarkdown(bundle: Bundle): string {
  const parts: string[] = [
    `# Momentum Export`,
    `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
    ``,
  ];
  if (bundle.tasks.length) {
    parts.push(`## Tasks\n`);
    parts.push(...bundle.tasks.map(taskToMd));
  }
  if (bundle.notes.length) {
    parts.push(`## Notes\n`);
    parts.push(...bundle.notes.map(noteToMd));
  }
  if (bundle.habits.length) {
    parts.push(`## Habits\n`);
    parts.push(...bundle.habits.map(habitToMd));
  }
  return parts.join("\n");
}

export function toPlainText(bundle: Bundle): string {
  // Markdown is already very readable; strip leading # marks
  return toMarkdown(bundle).replace(/^#+\s/gm, "");
}

export function toJson(bundle: Bundle): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), ...bundle }, null, 2);
}

export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportData(bundle: Bundle, scope: ExportScope, fmt: ExportFormat) {
  const scoped = buildScope(bundle, scope);
  const stamp = format(new Date(), "yyyyMMdd-HHmm");
  if (fmt === "json") {
    download(`momentum-${scope}-${stamp}.json`, toJson(scoped), "application/json");
  } else if (fmt === "md") {
    download(`momentum-${scope}-${stamp}.md`, toMarkdown(scoped), "text/markdown");
  } else {
    download(`momentum-${scope}-${stamp}.txt`, toPlainText(scoped), "text/plain");
  }
}
