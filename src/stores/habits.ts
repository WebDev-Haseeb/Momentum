import { create } from "zustand";
import type { Habit } from "@/lib/types";
import { kvGet, kvSet } from "@/lib/db";
import { todayKey } from "@/lib/date";
import { format, subDays, parseISO, differenceInCalendarDays } from "date-fns";

const KEY = "habits";

interface HabitsState {
  habits: Habit[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addHabit: (input: { name: string; icon?: string; goalDays?: number }) => Habit;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  remove: (id: string) => void;
  /** Toggle today's completion. Returns the new streak count so UI can check for goal hits. */
  toggleToday: (id: string) => number;
  toggleYesterday: (id: string) => void;
  deleteAll: () => void;
}

function persist(habits: Habit[]) {
  void kvSet(KEY, habits);
}

/**
 * Calculate the current consecutive streak ending at today (or yesterday).
 * Uses local midnight boundaries — each day resets at exactly 12:00 AM.
 * `todayKey()` returns YYYY-MM-DD based on `new Date()`, which uses the
 * device's local timezone, so the day boundary is always local midnight.
 */
export function currentStreak(history: string[]): number {
  if (!history.length) return 0;
  const set = new Set(history);
  let streak = 0;
  let cursor = new Date();
  // If today not completed, start from yesterday
  if (!set.has(todayKey(cursor))) {
    cursor = subDays(cursor, 1);
    if (!set.has(format(cursor, "yyyy-MM-dd"))) return 0;
  }
  while (set.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export function longestStreak(history: string[]): number {
  if (!history.length) return 0;
  const sorted = [...history].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInCalendarDays(parseISO(sorted[i]), parseISO(sorted[i - 1]));
    if (diff === 1) run += 1;
    else run = 1;
    if (run > best) best = run;
  }
  return best;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    const data = (await kvGet<Habit[]>(KEY)) ?? [];
    set({ habits: data, hydrated: true });
  },
  addHabit: ({ name, icon, goalDays }) => {
    const h: Habit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      icon,
      goalDays: goalDays && goalDays > 0 ? goalDays : undefined,
      createdAt: new Date().toISOString(),
      history: [],
    };
    const habits = [h, ...get().habits];
    set({ habits });
    persist(habits);
    return h;
  },
  updateHabit: (id, patch) => {
    const habits = get().habits.map((h) => (h.id === id ? { ...h, ...patch } : h));
    set({ habits });
    persist(habits);
  },
  remove: (id) => {
    const habits = get().habits.filter((h) => h.id !== id);
    set({ habits });
    persist(habits);
  },
  toggleToday: (id) => {
    const key = todayKey();
    let newStreak = 0;
    const habits = get().habits.map((h) => {
      if (h.id !== id) return h;
      const has = h.history.includes(key);
      const updated = has ? h.history.filter((d) => d !== key) : [...h.history, key];
      newStreak = has ? 0 : currentStreak(updated);
      return { ...h, history: updated };
    });
    set({ habits });
    persist(habits);
    return newStreak;
  },
  toggleYesterday: (id) => {
    const key = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const habits = get().habits.map((h) => {
      if (h.id !== id) return h;
      const has = h.history.includes(key);
      return { ...h, history: has ? h.history.filter((d) => d !== key) : [...h.history, key] };
    });
    set({ habits });
    persist(habits);
  },
  deleteAll: () => {
    set({ habits: [] });
    persist([]);
  },
}));
