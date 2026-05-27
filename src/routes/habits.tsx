import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useHabitsStore, currentStreak, longestStreak } from "@/stores/habits";
import type { Habit } from "@/lib/types";
import { todayKey } from "@/lib/date";
import { HabitEditor } from "@/components/HabitEditor";
import { Check, Flame, RotateCcw, Target, Trophy } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { getHabitIcon } from "@/lib/habit-icons";
import { toast } from "sonner";

export const Route = createFileRoute("/habits")({
  head: () => ({ meta: [{ title: "Habits — Momentum" }] }),
  component: HabitsPage,
});

function HabitsPage() {
  const habits = useHabitsStore((s) => s.habits);
  const toggleToday = useHabitsStore((s) => s.toggleToday);
  const toggleYesterday = useHabitsStore((s) => s.toggleYesterday);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [open, setOpen] = useState(false);

  const handleToggleToday = useCallback(
    (habit: Habit) => {
      const newStreak = toggleToday(habit.id);
      // Check if the streak just hit the goal
      if (habit.goalDays && newStreak > 0 && newStreak === habit.goalDays) {
        toast.success(`🎉 ${habit.name} — ${habit.goalDays}-day streak reached!`, {
          description: "Amazing consistency! Keep going or set a new goal.",
          duration: 5000,
        });
      }
      // Also celebrate multiples of the goal
      if (
        habit.goalDays &&
        newStreak > habit.goalDays &&
        newStreak % habit.goalDays === 0
      ) {
        toast.success(
          `🔥 ${habit.name} — ${newStreak} days! That's ${newStreak / habit.goalDays}x your goal!`,
          { duration: 4000 },
        );
      }
    },
    [toggleToday],
  );

  return (
    <div className="space-y-3 pt-1">
      {habits.length === 0 ? (
        <div className="rounded-2xl bg-surface hairline py-12 text-center text-muted-foreground">
          No habits yet. Tap + to add your first.
        </div>
      ) : (
        habits.map((h) => (
          <HabitCard
            key={h.id}
            habit={h}
            onToggleToday={() => handleToggleToday(h)}
            onToggleYesterday={() => toggleYesterday(h.id)}
            onEdit={() => {
              setEditing(h);
              setOpen(true);
            }}
          />
        ))
      )}
      <HabitEditor open={open} onOpenChange={setOpen} habit={editing} />
    </div>
  );
}

function HabitCard({
  habit,
  onToggleToday,
  onToggleYesterday,
  onEdit,
}: {
  habit: Habit;
  onToggleToday: () => void;
  onToggleYesterday: () => void;
  onEdit: () => void;
}) {
  const today = todayKey();
  const yKey = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const doneToday = habit.history.includes(today);
  const doneYesterday = habit.history.includes(yKey);
  const Icon = getHabitIcon(habit.icon);

  const last30 = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const d = subDays(new Date(), 29 - i);
      const k = format(d, "yyyy-MM-dd");
      return { k, on: habit.history.includes(k) };
    });
  }, [habit.history]);

  const streak = currentStreak(habit.history);
  const best = longestStreak(habit.history);
  const pct = last30.filter((d) => d.on).length;

  // Goal progress
  const hasGoal = habit.goalDays && habit.goalDays > 0;
  const goalProgress = hasGoal ? Math.min(streak / habit.goalDays!, 1) : 0;
  const goalReached = hasGoal && streak >= habit.goalDays!;

  return (
    <div className="rounded-2xl bg-surface hairline p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onEdit}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80 transition active:scale-95"
          aria-label="Edit habit"
        >
          <Icon className="h-[20px] w-[20px]" strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={onEdit} className="block text-left">
            <p className="truncate text-[16px] font-semibold tracking-tight">{habit.name}</p>
          </button>
          <div className="mt-0.5 flex items-center gap-3 text-[12px] text-muted-foreground num">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-warning" strokeWidth={2.2} /> {streak} day
              {streak === 1 ? "" : "s"}
            </span>
            <span>Best {best}</span>
            <span>{pct}/30</span>
          </div>
        </div>
        <button
          onClick={onToggleToday}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90",
            doneToday ? "border-success bg-success text-white" : "border-border bg-background",
          )}
          aria-label="Toggle today"
        >
          {doneToday && <Check strokeWidth={3} className="h-[18px] w-[18px]" />}
        </button>
      </div>

      {/* Goal progress bar */}
      {hasGoal && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              {goalReached ? (
                <>
                  <Trophy className="h-3 w-3 text-warning" strokeWidth={2.2} />
                  <span className="text-warning">Goal reached!</span>
                </>
              ) : (
                <>
                  <Target className="h-3 w-3" strokeWidth={2.2} />
                  <span>{streak}/{habit.goalDays} days</span>
                </>
              )}
            </div>
            <span className="text-[11px] font-medium text-muted-foreground num">
              {Math.round(goalProgress * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                goalReached ? "bg-warning" : "bg-foreground/70",
              )}
              style={{ width: `${Math.round(goalProgress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Last 30 days chart */}
      <div className={cn("flex gap-[3px]", hasGoal ? "mt-3" : "mt-4")}>
        {last30.map((d) => (
          <div
            key={d.k}
            className={cn("h-6 flex-1 rounded-[3px]", d.on ? "bg-foreground" : "bg-muted")}
            title={d.k}
          />
        ))}
      </div>

      {!doneToday && (
        <button
          onClick={onToggleYesterday}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-muted/60 py-2 text-[12px] text-muted-foreground transition active:scale-[0.98]"
        >
          {doneYesterday ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> Marked yesterday — tap to undo
            </>
          ) : (
            <>
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.2} /> Missed yesterday? Mark it now
            </>
          )}
        </button>
      )}
    </div>
  );
}
