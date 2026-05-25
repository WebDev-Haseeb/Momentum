import type { Task } from "./types";

const PRIORITY_WEIGHT: Record<Task["priority"], number> = {
  critical: 100,
  high: 70,
  medium: 40,
  low: 15,
};

function daysBetween(a: Date, b: Date) {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function scoreTask(task: Task, now: Date = new Date()): number {
  let score = PRIORITY_WEIGHT[task.priority];

  if (task.dueDate) {
    const due = startOfDay(new Date(task.dueDate));
    const today = startOfDay(now);
    const diff = daysBetween(due, today);
    if (diff < 0) score += 80 + Math.min(40, -diff * 2);
    else if (diff === 0) score += 60;
    else if (diff === 1) score += 40;
    else if (diff <= 7) score += 20;
  }

  // Neglect: days since last update
  const updated = new Date(task.updatedAt);
  const daysSince = Math.max(0, daysBetween(now, updated));
  score += Math.min(30, daysSince);

  // Recent activity dampener (last 2 hours)
  const hoursSince = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
  if (hoursSince < 2) score -= 20;

  return score;
}

export function rankTasks(tasks: Task[], now: Date = new Date()): Task[] {
  return tasks
    .filter((t) => t.status === "pending")
    .map((t) => ({ t, s: scoreTask(t, now) }))
    .sort((a, b) => b.s - a.s)
    .map(({ t }) => t);
}
