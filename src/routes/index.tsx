import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTasksStore } from "@/stores/tasks";
import { useHabitsStore, currentStreak } from "@/stores/habits";
import { rankTasks } from "@/lib/attention";
import { TaskRow } from "@/components/TaskRow";
import { TaskEditor } from "@/components/TaskEditor";
import type { Task } from "@/lib/types";
import { formatDueLabel, isOverdue } from "@/lib/date";
import { differenceInCalendarDays, format, isToday, parseISO } from "date-fns";
import { ArrowUpRight, Flame, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Focus — Momentum" },
      { name: "description", content: "Your top three priorities, right now." },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good night";
}

function Dashboard() {
  const tasks = useTasksStore((s) => s.tasks);
  const toggle = useTasksStore((s) => s.toggleComplete);
  const habits = useHabitsStore((s) => s.habits);
  const [editing, setEditing] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const focus = useMemo(() => rankTasks(tasks).slice(0, 3), [tasks]);

  const stats = useMemo(() => {
    const active = tasks.filter((t) => t.status === "pending").length;
    const completedToday = tasks.filter(
      (t) => t.status === "completed" && t.completedAt && isToday(parseISO(t.completedAt)),
    ).length;
    const overdue = tasks.filter((t) => t.status === "pending" && isOverdue(t.dueDate)).length;
    const bestStreak = habits.reduce((m, h) => Math.max(m, currentStreak(h.history)), 0);
    return { active, completedToday, overdue, bestStreak };
  }, [tasks, habits]);

  const upcoming = useMemo(() => {
    const today = new Date();
    return tasks
      .filter((t) => t.status === "pending" && t.dueDate)
      .map((t) => ({ t, d: differenceInCalendarDays(parseISO(t.dueDate!), today) }))
      .filter(({ d }) => d >= 0 && d <= 7)
      .sort((a, b) => a.d - b.d)
      .slice(0, 5)
      .map(({ t }) => t);
  }, [tasks]);

  const open = (t: Task) => {
    setEditing(t);
    setEditOpen(true);
  };
  const now = new Date();

  return (
    <div>
      {/* Hero — date, greeting, settings */}
      <header className="safe-top">
        <div className="flex items-start justify-between pt-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {format(now, "EEEE · MMM d")}
            </p>
            <h1 className="mt-1.5 text-[34px] font-semibold leading-[1.05] tracking-tight text-balance">
              {greeting()}.
            </h1>
          </div>
          <Link
            to="/settings"
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground/70 transition active:scale-95"
            aria-label="Settings"
          >
            <SettingsIcon className="h-[18px] w-[18px]" strokeWidth={2} />
          </Link>
        </div>

        {/* Pulse strip — single elegant row */}
        <div className="mt-5 grid grid-cols-4 overflow-hidden rounded-2xl bg-surface hairline">
          <PulseCell label="Active" value={stats.active} />
          <PulseCell
            label="Done"
            value={stats.completedToday}
            accent={stats.completedToday > 0 ? "success" : undefined}
          />
          <PulseCell
            label="Overdue"
            value={stats.overdue}
            accent={stats.overdue > 0 ? "destructive" : undefined}
          />
          <PulseCell
            label="Streak"
            value={stats.bestStreak}
            icon={
              stats.bestStreak > 0 ? (
                <Flame className="h-[13px] w-[13px] text-warning" strokeWidth={2.2} />
              ) : undefined
            }
          />
        </div>
      </header>

      {/* Focus */}
      <section className="mt-9">
        <SectionHeader title="Focus" hint="What deserves attention" />
        {focus.length === 0 ? (
          <EmptyCard title="You're all clear" body="Add a task to start focusing." />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-surface hairline">
            {focus.map((t, i) => (
              <div key={t.id} className={i > 0 ? "hairline-t" : ""}>
                <TaskRow task={t} onToggle={toggle} onOpen={open} showAttention flat />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section className="mt-9">
        <div className="mb-3 flex items-end justify-between px-1">
          <SectionHeader title="Next seven days" inline />
          <Link
            to="/tasks"
            className="flex items-center gap-0.5 text-[13px] font-medium text-muted-foreground transition active:text-foreground"
          >
            All tasks <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyCard title="A clear week ahead" compact />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-surface hairline">
            {upcoming.map((t, i) => (
              <button
                key={t.id}
                onClick={() => open(t)}
                className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition active:bg-muted/50 ${i > 0 ? "hairline-t" : ""}`}
              >
                <span className="truncate text-[15px] font-medium">{t.title}</span>
                <span className="num ml-3 shrink-0 text-[12.5px] font-medium uppercase tracking-wider text-muted-foreground">
                  {formatDueLabel(t.dueDate)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <TaskEditor open={editOpen} onOpenChange={setEditOpen} task={editing} />
    </div>
  );
}

function SectionHeader({
  title,
  hint,
  inline,
}: {
  title: string;
  hint?: string;
  inline?: boolean;
}) {
  return (
    <div className={inline ? "" : "mb-3 px-1"}>
      <h2 className="text-[20px] font-semibold tracking-tight">{title}</h2>
      {hint && <p className="mt-0.5 text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PulseCell({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent?: "destructive" | "success";
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center px-2 py-3.5 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-[var(--color-hairline)]">
      <div className="flex items-baseline gap-1">
        {icon}
        <span
          className={`num text-[22px] font-semibold leading-none tracking-tight ${
            accent === "destructive"
              ? "text-destructive"
              : accent === "success"
                ? "text-success"
                : ""
          }`}
        >
          {value}
        </span>
      </div>
      <span className="mt-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function EmptyCard({ title, body, compact }: { title: string; body?: string; compact?: boolean }) {
  return (
    <div className={`rounded-2xl bg-surface hairline text-center ${compact ? "py-6" : "py-10"}`}>
      <p className="font-medium">{title}</p>
      {body && <p className="mt-1 text-sm text-muted-foreground">{body}</p>}
    </div>
  );
}
