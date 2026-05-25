import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, Priority, ReminderMode } from "@/lib/types";
import { useTasksStore } from "@/stores/tasks";
import { Trash2, Archive, RotateCcw, Clock, CalendarPlus, Bell } from "lucide-react";
import { PRIORITY_LABEL } from "./PriorityDot";
import { cn } from "@/lib/utils";
import { downloadCalendarEvent } from "@/lib/calendar";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null; // null/undefined = create mode
}

/** Build list of selectable hours from now onward (for today) or all 24h (for future dates). */
function getAvailableHours(selectedDate: string): { hour: number; label: string }[] {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isToday = selectedDate === todayStr;

  const currentHour = now.getHours();
  const results: { hour: number; label: string }[] = [];

  for (let h = 0; h < 24; h++) {
    if (isToday && h <= currentHour) continue; // skip past hours
    const ampm = h < 12 ? "AM" : "PM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    results.push({ hour: h, label: `${display}:00 ${ampm}` });
  }

  return results;
}

/** Format 24h hour to display string */
function formatHour(hour24: number): string {
  const ampm = hour24 < 12 ? "AM" : "PM";
  const display = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  return `${display}:00 ${ampm}`;
}

const REMINDER_OPTIONS: { value: ReminderMode; label: string }[] = [
  { value: "none", label: "No notification" },
  { value: "10min", label: "10 min before" },
  { value: "15min", label: "15 min before" },
  { value: "30min", label: "30 min before" },
];

export function TaskEditor({ open, onOpenChange, task }: Props) {
  const { addTask, updateTask, remove, archive, restore } = useTasksStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [reminderMode, setReminderMode] = useState<ReminderMode>("none");

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setPriority(task?.priority ?? "medium");
      setDueDate(task?.dueDate ? task.dueDate.slice(0, 10) : "");
      if (task?.dueTime) {
        const [hStr] = task.dueTime.split(":");
        setSelectedHour(parseInt(hStr, 10));
      } else {
        setSelectedHour(null);
      }
      setReminderMode(task?.reminderMode ?? "none");
    }
  }, [open, task]);

  const availableHours = useMemo(
    () => (dueDate ? getAvailableHours(dueDate) : []),
    [dueDate],
  );

  // Reset selected hour if it's no longer in the available list (e.g. date changed to today)
  useEffect(() => {
    if (selectedHour !== null && dueDate) {
      const stillAvailable = availableHours.some((h) => h.hour === selectedHour);
      if (!stillAvailable) {
        setSelectedHour(null);
        setReminderMode("none");
      }
    }
  }, [availableHours, selectedHour, dueDate]);

  const save = () => {
    if (!title.trim()) return;
    const iso = dueDate ? new Date(dueDate + "T09:00:00").toISOString() : undefined;
    const dueTime = selectedHour !== null ? `${String(selectedHour).padStart(2, "0")}:00` : undefined;
    const mode = dueTime ? reminderMode : "none";

    if (task) {
      updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: iso,
        dueTime,
        reminderMode: mode,
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: iso,
        dueTime,
        reminderMode: mode,
      });
    }
    onOpenChange(false);
  };

  /** Save and immediately download the .ics calendar event */
  const saveAndAddToCalendar = () => {
    if (!title.trim()) return;
    const iso = dueDate ? new Date(dueDate + "T09:00:00").toISOString() : undefined;
    const dueTime = selectedHour !== null ? `${String(selectedHour).padStart(2, "0")}:00` : undefined;
    const mode = dueTime ? reminderMode : "none";

    let savedTask: Task;
    if (task) {
      updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: iso,
        dueTime,
        reminderMode: mode,
      });
      savedTask = {
        ...task,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: iso,
        dueTime,
        reminderMode: mode,
      };
    } else {
      savedTask = addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: iso,
        dueTime,
        reminderMode: mode,
      });
    }

    const ok = downloadCalendarEvent(savedTask);
    if (ok) {
      toast.success("Calendar event downloaded — add it to get notified!");
    } else {
      toast.error("Could not generate calendar event");
    }
    onOpenChange(false);
  };

  const hasTimeSet = selectedHour !== null && dueDate;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{task ? "Edit task" : "New task"}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              autoFocus={!task}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              className="text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["critical", "high", "medium", "low"] as Priority[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date — full width, separated */}
          <div className="space-y-1.5">
            <Label htmlFor="due">Due date</Label>
            <Input
              id="due"
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (!e.target.value) {
                  setSelectedHour(null);
                  setReminderMode("none");
                }
              }}
              className="w-full"
            />
          </div>

          {/* Time Picker — appears only when date is set */}
          {dueDate && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Time{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
              </div>

              {availableHours.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-xl bg-muted/60 px-3 py-2.5">
                  No hours remaining today. Pick a future date for time options.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto rounded-2xl bg-muted/40 p-2">
                  {availableHours.map((h) => (
                    <button
                      key={h.hour}
                      type="button"
                      onClick={() => {
                        if (selectedHour === h.hour) {
                          setSelectedHour(null);
                          setReminderMode("none");
                        } else {
                          setSelectedHour(h.hour);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-center rounded-xl py-2 text-[13px] font-medium transition active:scale-95",
                        selectedHour === h.hour
                          ? "bg-foreground text-background shadow-sm"
                          : "bg-background text-foreground/80 hover:bg-muted",
                      )}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected time summary */}
              {selectedHour !== null && (
                <p className="text-xs text-muted-foreground px-1">
                  Deadline set for{" "}
                  <span className="font-semibold text-foreground">
                    {formatHour(selectedHour)}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Notification Reminder — appears only when a time is selected */}
          {hasTimeSet && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Notify me</Label>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {REMINDER_OPTIONS.map((opt) => {
                  const active = reminderMode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setReminderMode(opt.value)}
                      className={cn(
                        "flex items-center justify-center rounded-xl px-3 py-2.5 text-[13px] font-medium transition active:scale-[0.98]",
                        active
                          ? "bg-foreground text-background"
                          : "bg-muted/50 text-foreground/80 hover:bg-muted",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {reminderMode !== "none" && (
                <p className="text-xs text-muted-foreground px-1">
                  You&apos;ll get a notification via your phone&apos;s calendar.
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5 pt-1">
            {/* Primary: Add to Calendar (if time + reminder set) */}
            {hasTimeSet && reminderMode !== "none" ? (
              <>
                <Button
                  onClick={saveAndAddToCalendar}
                  className="w-full h-12 rounded-2xl text-base gap-2"
                  disabled={!title.trim()}
                >
                  <CalendarPlus className="h-4.5 w-4.5" />
                  {task ? "Save & add to calendar" : "Add task & calendar event"}
                </Button>
                <button
                  type="button"
                  onClick={save}
                  disabled={!title.trim()}
                  className="w-full text-center text-[13px] font-medium text-muted-foreground py-1.5 transition active:text-foreground disabled:opacity-50"
                >
                  Save without calendar
                </button>
              </>
            ) : (
              <Button
                onClick={save}
                className="w-full h-12 rounded-2xl text-base"
                disabled={!title.trim()}
              >
                {task ? "Save changes" : "Add task"}
              </Button>
            )}
          </div>

          {/* Edit-mode action buttons */}
          {task && (
            <div className="flex gap-2 pt-1 pb-1">
              {/* Re-download calendar event if time is set */}
              {task.dueTime && task.reminderMode && task.reminderMode !== "none" && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    downloadCalendarEvent(task);
                    toast.success("Calendar event downloaded");
                  }}
                >
                  <CalendarPlus className="h-4 w-4 mr-1.5" /> Calendar
                </Button>
              )}
              {task.status === "archived" ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    restore(task.id);
                    onOpenChange(false);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Restore
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    archive(task.id);
                    onOpenChange(false);
                  }}
                >
                  <Archive className="h-4 w-4 mr-1.5" /> Archive
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1 text-destructive"
                onClick={() => {
                  remove(task.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
