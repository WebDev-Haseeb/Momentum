import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Habit } from "@/lib/types";
import { useHabitsStore } from "@/stores/habits";
import { Trash2, Target } from "lucide-react";
import { HABIT_ICONS, DEFAULT_HABIT_ICON, type HabitIconKey } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
}

const ICON_KEYS = Object.keys(HABIT_ICONS) as HabitIconKey[];

const QUICK_GOALS = [7, 14, 21, 30, 60, 90] as const;

export function HabitEditor({ open, onOpenChange, habit }: Props) {
  const { addHabit, updateHabit, remove } = useHabitsStore();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<HabitIconKey>(DEFAULT_HABIT_ICON);
  const [goalDays, setGoalDays] = useState<string>("");

  useEffect(() => {
    if (open) {
      setName(habit?.name ?? "");
      const k = habit?.icon as HabitIconKey | undefined;
      setIcon(k && k in HABIT_ICONS ? k : DEFAULT_HABIT_ICON);
      setGoalDays(habit?.goalDays ? String(habit.goalDays) : "");
    }
  }, [open, habit]);

  const save = () => {
    if (!name.trim()) return;
    const goal = parseInt(goalDays, 10);
    const validGoal = !isNaN(goal) && goal > 0 ? goal : undefined;

    if (habit) {
      updateHabit(habit.id, { name: name.trim(), icon, goalDays: validGoal });
    } else {
      addHabit({ name: name.trim(), icon, goalDays: validGoal });
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{habit ? "Edit habit" : "New habit"}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-5 pb-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="hname">Name</Label>
            <Input
              id="hname"
              autoFocus={!habit}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read 20 minutes"
            />
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_KEYS.map((k) => {
                const Icon = HABIT_ICONS[k];
                const selected = icon === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setIcon(k)}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-xl transition active:scale-95",
                      selected
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground/70 hover:bg-muted/80",
                    )}
                    aria-label={k}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Streak Goal */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">
                Streak goal{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
            </div>

            {/* Quick-pick buttons */}
            <div className="grid grid-cols-6 gap-1.5">
              {QUICK_GOALS.map((g) => {
                const active = goalDays === String(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoalDays(active ? "" : String(g))}
                    className={cn(
                      "flex items-center justify-center rounded-xl py-2 text-[13px] font-medium transition active:scale-95",
                      active
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-muted/60 text-foreground/80 hover:bg-muted",
                    )}
                  >
                    {g}d
                  </button>
                );
              })}
            </div>

            {/* Custom input */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={999}
                value={goalDays}
                onChange={(e) => setGoalDays(e.target.value)}
                placeholder="Custom days"
                className="flex-1"
              />
              {goalDays && (
                <button
                  type="button"
                  onClick={() => setGoalDays("")}
                  className="text-xs text-muted-foreground px-2 py-1 rounded-lg hover:bg-muted transition"
                >
                  Clear
                </button>
              )}
            </div>

            {goalDays && parseInt(goalDays, 10) > 0 && (
              <p className="text-xs text-muted-foreground px-1">
                You'll see a congrats when you hit a{" "}
                <span className="font-semibold text-foreground">{goalDays}-day</span> streak!
              </p>
            )}
          </div>

          {/* Save */}
          <Button onClick={save} className="w-full h-12 rounded-2xl text-base" disabled={!name.trim()}>
            {habit ? "Save changes" : "Add habit"}
          </Button>

          {/* Delete */}
          {habit && (
            <Button
              variant="outline"
              className="w-full text-destructive"
              onClick={() => {
                remove(habit.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete habit
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
