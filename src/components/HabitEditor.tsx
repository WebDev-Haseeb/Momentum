import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Habit } from "@/lib/types";
import { useHabitsStore } from "@/stores/habits";
import { Trash2 } from "lucide-react";
import { HABIT_ICONS, DEFAULT_HABIT_ICON, type HabitIconKey } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
}

const ICON_KEYS = Object.keys(HABIT_ICONS) as HabitIconKey[];

export function HabitEditor({ open, onOpenChange, habit }: Props) {
  const { addHabit, updateHabit, remove } = useHabitsStore();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<HabitIconKey>(DEFAULT_HABIT_ICON);

  useEffect(() => {
    if (open) {
      setName(habit?.name ?? "");
      const k = habit?.icon as HabitIconKey | undefined;
      setIcon(k && k in HABIT_ICONS ? k : DEFAULT_HABIT_ICON);
    }
  }, [open, habit]);

  const save = () => {
    if (!name.trim()) return;
    if (habit) updateHabit(habit.id, { name: name.trim(), icon });
    else addHabit({ name, icon });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{habit ? "Edit habit" : "New habit"}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 pb-2">
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
          <Button onClick={save} className="w-full h-12 rounded-2xl" disabled={!name.trim()}>
            {habit ? "Save changes" : "Add habit"}
          </Button>
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
