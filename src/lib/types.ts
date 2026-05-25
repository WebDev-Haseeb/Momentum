export type Priority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "completed" | "archived";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string; // ISO
  reminderAt?: string; // ISO
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon?: string; // emoji
  createdAt: string;
  // ISO date strings (YYYY-MM-DD) on which habit was completed
  history: string[];
  reminderEnabled?: boolean;
  reminderTime?: string; // HH:mm
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export type ThemeMode = "light" | "dark" | "system";

export interface Settings {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  taskRemindersEnabled: boolean;
  habitRemindersEnabled: boolean;
  reminderSoundsEnabled: boolean;
}
