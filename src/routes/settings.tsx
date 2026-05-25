import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings";
import { useTasksStore } from "@/stores/tasks";
import { useHabitsStore } from "@/stores/habits";
import { useNotesStore } from "@/stores/notes";
import { estimateUsage, kvClear } from "@/lib/db";
import { exportData, type ExportFormat, type ExportScope } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sun, Moon, Monitor, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ThemeMode } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Momentum" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const s = useSettingsStore();
  const tasks = useTasksStore();
  const habits = useHabitsStore();
  const notes = useNotesStore();
  const [usage, setUsage] = useState<number | null>(null);

  useEffect(() => {
    estimateUsage().then(setUsage);
  }, [tasks.tasks, habits.habits, notes.notes]);

  const doExport = (scope: ExportScope, fmt: ExportFormat) => {
    exportData({ tasks: tasks.tasks, habits: habits.habits, notes: notes.notes }, scope, fmt);
    toast.success("Export downloaded");
  };

  const resetAll = async () => {
    await kvClear();
    tasks.deleteAll();
    habits.deleteAll();
    notes.deleteAll();
    toast.success("Application reset");
  };

  return (
    <div className="space-y-7 pt-1">
      <Group title="Appearance">
        <div className="rounded-2xl bg-surface p-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                ["light", "Light", Sun],
                ["dark", "Dark", Moon],
                ["system", "System", Monitor],
              ] as const
            ).map(([mode, label, Icon]) => (
              <button
                key={mode}
                onClick={() => s.setTheme(mode as ThemeMode)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition",
                  s.theme === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Group>

      <Group title="Notifications">
        <Card>
          <Row>
            <Label htmlFor="notif">Enable notifications</Label>
            <Switch
              id="notif"
              checked={s.notificationsEnabled}
              onCheckedChange={async (v) => {
                if (v && typeof Notification !== "undefined") {
                  try {
                    await Notification.requestPermission();
                  } catch (error) {
                    console.error("Notification permission request failed", error);
                  }
                }
                s.setSetting("notificationsEnabled", v);
              }}
            />
          </Row>
          <Divider />
          <Row>
            <Label htmlFor="tr">Task reminders</Label>
            <Switch
              id="tr"
              checked={s.taskRemindersEnabled}
              onCheckedChange={(v) => s.setSetting("taskRemindersEnabled", v)}
            />
          </Row>
          <Divider />
          <Row>
            <Label htmlFor="hr">Habit reminders</Label>
            <Switch
              id="hr"
              checked={s.habitRemindersEnabled}
              onCheckedChange={(v) => s.setSetting("habitRemindersEnabled", v)}
            />
          </Row>
          <Divider />
          <Row>
            <Label htmlFor="snd">Reminder sounds</Label>
            <Switch
              id="snd"
              checked={s.reminderSoundsEnabled}
              onCheckedChange={(v) => s.setSetting("reminderSoundsEnabled", v)}
            />
          </Row>
        </Card>
      </Group>

      <Group title="Export" subtitle="One-tap download. No server.">
        <Card>
          <ExportRow label="Everything" scope="all" onPick={doExport} />
          <Divider />
          <ExportRow label="Active tasks" scope="tasks-active" onPick={doExport} />
          <Divider />
          <ExportRow label="Completed tasks" scope="tasks-completed" onPick={doExport} />
          <Divider />
          <ExportRow label="Archived tasks" scope="tasks-archived" onPick={doExport} />
          <Divider />
          <ExportRow label="Notes" scope="notes" onPick={doExport} />
          <Divider />
          <ExportRow label="Habits" scope="habits" onPick={doExport} />
        </Card>
      </Group>

      <Group title="Storage">
        <Card>
          <Row>
            <span className="text-sm">Tasks</span>
            <span className="text-sm text-muted-foreground">{tasks.tasks.length}</span>
          </Row>
          <Divider />
          <Row>
            <span className="text-sm">Notes</span>
            <span className="text-sm text-muted-foreground">{notes.notes.length}</span>
          </Row>
          <Divider />
          <Row>
            <span className="text-sm">Habits</span>
            <span className="text-sm text-muted-foreground">{habits.habits.length}</span>
          </Row>
          <Divider />
          <Row>
            <span className="text-sm">Local storage</span>
            <span className="text-sm text-muted-foreground">
              {usage != null ? `${(usage / 1024).toFixed(1)} KB` : "—"}
            </span>
          </Row>
        </Card>
      </Group>

      <Group title="Danger zone">
        <Card>
          <DangerRow
            label="Delete all tasks"
            onConfirm={() => {
              tasks.deleteAll();
              toast.success("All tasks deleted");
            }}
          />
          <Divider />
          <DangerRow
            label="Delete all notes"
            onConfirm={() => {
              notes.deleteAll();
              toast.success("All notes deleted");
            }}
          />
          <Divider />
          <DangerRow
            label="Delete all habits"
            onConfirm={() => {
              habits.deleteAll();
              toast.success("All habits deleted");
            }}
          />
          <Divider />
          <DangerRow label="Reset application" onConfirm={resetAll} />
        </Card>
      </Group>

      <p className="pb-4 text-center text-xs text-muted-foreground/70">Momentum · v1.0</p>
    </div>
  );
}

function Group({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 px-1">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-surface px-4">{children}</div>;
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between py-3.5">{children}</div>;
}
function Divider() {
  return <div className="h-px bg-border" />;
}

function ExportRow({
  label,
  scope,
  onPick,
}: {
  label: string;
  scope: ExportScope;
  onPick: (s: ExportScope, f: ExportFormat) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1">
        {(["md", "txt", "json"] as ExportFormat[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant="ghost"
            className="h-8 rounded-full px-3 text-xs uppercase"
            onClick={() => onPick(scope, f)}
          >
            <Download className="h-3 w-3 mr-1" />
            {f}
          </Button>
        ))}
      </div>
    </div>
  );
}

function DangerRow({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="flex w-full items-center justify-between py-3.5 text-left text-destructive">
          <span className="text-sm">{label}</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
