import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useTasksStore } from "@/stores/tasks";
import { TaskRow } from "@/components/TaskRow";
import { TaskEditor } from "@/components/TaskEditor";
import type { Task, TaskStatus, Priority } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowDownUp, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Momentum" }] }),
  component: TasksPage,
});

type Sort = "priority" | "due" | "newest" | "oldest" | "updated";

const PRIORITY_RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function TasksPage() {
  const tasks = useTasksStore((s) => s.tasks);
  const toggle = useTasksStore((s) => s.toggleComplete);
  const [tab, setTab] = useState<TaskStatus>("pending");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("priority");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const list = useMemo(() => {
    let arr = tasks.filter((t) => t.status === tab);
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter(
        (t) => t.title.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s),
      );
    }
    arr = [...arr].sort((a, b) => {
      switch (sort) {
        case "priority":
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        case "due":
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        case "newest":
          return b.createdAt.localeCompare(a.createdAt);
        case "oldest":
          return a.createdAt.localeCompare(b.createdAt);
        case "updated":
          return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
    return arr;
  }, [tasks, tab, q, sort]);

  const open = (t: Task) => {
    setEditing(t);
    setEditOpen(true);
  };

  return (
    <div className="space-y-3 pt-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks"
          className="h-11 rounded-2xl bg-muted/60 border-0 pl-9 text-base"
        />
      </div>

      <div className="flex items-center gap-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TaskStatus)} className="flex-1">
          <TabsList className="w-full rounded-full bg-muted/60">
            <TabsTrigger value="pending" className="rounded-full">
              Active
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-full">
              Done
            </TabsTrigger>
            <TabsTrigger value="archived" className="rounded-full">
              Archive
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 shrink-0">
              <ArrowDownUp className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(
              [
                ["priority", "Priority"],
                ["due", "Due date"],
                ["newest", "Newest first"],
                ["oldest", "Oldest first"],
                ["updated", "Recently updated"],
              ] as const
            ).map(([k, l]) => (
              <DropdownMenuItem
                key={k}
                onClick={() => setSort(k)}
                className="flex items-center justify-between gap-3"
              >
                <span>{l}</span>
                {sort === k && <Check className="h-3.5 w-3.5" strokeWidth={2.4} />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
            {q
              ? "No matches"
              : tab === "pending"
                ? "No active tasks"
                : tab === "completed"
                  ? "Nothing completed yet"
                  : "Archive is empty"}
          </div>
        ) : (
          list.map((t) => <TaskRow key={t.id} task={t} onToggle={toggle} onOpen={open} />)
        )}
      </div>

      <TaskEditor open={editOpen} onOpenChange={setEditOpen} task={editing} />
    </div>
  );
}
