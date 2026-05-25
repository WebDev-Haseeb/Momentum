import {
  BookOpen,
  Dumbbell,
  Droplet,
  Brain,
  Code2,
  Pen,
  Bed,
  Salad,
  Target,
  Palette,
  Music,
  Footprints,
  Sparkles,
  Sun,
  Moon,
  Heart,
  Coffee,
  Bike,
  Leaf,
  Camera,
  Languages,
  GraduationCap,
} from "lucide-react";

export const HABIT_ICONS = {
  sparkles: Sparkles,
  book: BookOpen,
  run: Footprints,
  water: Droplet,
  meditate: Brain,
  code: Code2,
  write: Pen,
  sleep: Bed,
  food: Salad,
  target: Target,
  art: Palette,
  music: Music,
  gym: Dumbbell,
  sun: Sun,
  moon: Moon,
  heart: Heart,
  coffee: Coffee,
  bike: Bike,
  nature: Leaf,
  photo: Camera,
  language: Languages,
  study: GraduationCap,
} as const;

export type HabitIconKey = keyof typeof HABIT_ICONS;

export const DEFAULT_HABIT_ICON: HabitIconKey = "sparkles";

export function getHabitIcon(key?: string) {
  if (key && key in HABIT_ICONS) return HABIT_ICONS[key as HabitIconKey];
  return HABIT_ICONS[DEFAULT_HABIT_ICON];
}
