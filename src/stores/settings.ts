import { create } from "zustand";
import type { Settings, ThemeMode } from "@/lib/types";
import { kvGet, kvSet } from "@/lib/db";

const KEY = "settings";

const DEFAULTS: Settings = {
  theme: "system",
  notificationsEnabled: false,
  taskRemindersEnabled: true,
  habitRemindersEnabled: true,
  reminderSoundsEnabled: true,
};

interface SettingsState extends Settings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setTheme: (theme: ThemeMode) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
}

function persist(s: Settings) {
  void kvSet(KEY, s);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    const data = (await kvGet<Settings>(KEY)) ?? DEFAULTS;
    set({ ...data, hydrated: true });
    applyTheme(data.theme);
    if (data.theme === "system" && typeof window !== "undefined") {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (get().theme === "system") applyTheme("system");
      });
    }
  },
  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    persist({ ...(get() as Settings), theme });
  },
  setSetting: (key, value) => {
    set({ [key]: value } as Partial<SettingsState>);
    const { hydrated: _h, hydrate: _hy, setTheme: _st, setSetting: _ss, ...rest } = get();
    persist({ ...(rest as Settings), [key]: value });
  },
}));
