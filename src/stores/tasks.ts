import { create } from "zustand";
import type { Task, Priority, ReminderMode } from "@/lib/types";
import { kvGet, kvSet } from "@/lib/db";

const KEY = "tasks";

interface TasksState {
  tasks: Task[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addTask: (input: {
    title: string;
    description?: string;
    priority?: Priority;
    dueDate?: string;
    dueTime?: string;
    reminderAt?: string;
    reminderMode?: ReminderMode;
  }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleComplete: (id: string) => void;
  archive: (id: string) => void;
  restore: (id: string) => void;
  remove: (id: string) => void;
  deleteAll: () => void;
}

function persist(tasks: Task[]) {
  void kvSet(KEY, tasks);
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    const data = (await kvGet<Task[]>(KEY)) ?? [];
    set({ tasks: data, hydrated: true });
  },
  addTask: (input) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      priority: input.priority ?? "medium",
      dueDate: input.dueDate,
      dueTime: input.dueTime,
      reminderAt: input.reminderAt,
      reminderMode: input.reminderMode ?? "none",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    const tasks = [task, ...get().tasks];
    set({ tasks });
    persist(tasks);
    return task;
  },
  updateTask: (id, patch) => {
    const tasks = get().tasks.map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
    );
    set({ tasks });
    persist(tasks);
  },
  toggleComplete: (id) => {
    const now = new Date().toISOString();
    const tasks = get().tasks.map((t) =>
      t.id === id
        ? t.status === "completed"
          ? { ...t, status: "pending" as const, completedAt: undefined, updatedAt: now }
          : { ...t, status: "completed" as const, completedAt: now, updatedAt: now }
        : t,
    );
    set({ tasks });
    persist(tasks);
  },
  archive: (id) => get().updateTask(id, { status: "archived" }),
  restore: (id) => get().updateTask(id, { status: "pending" }),
  remove: (id) => {
    const tasks = get().tasks.filter((t) => t.id !== id);
    set({ tasks });
    persist(tasks);
  },
  deleteAll: () => {
    set({ tasks: [] });
    persist([]);
  },
}));
