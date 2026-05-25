import type { Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLORS: Record<Priority, string> = {
  critical: "bg-priority-critical",
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

export const PRIORITY_COLOR_VAR: Record<Priority, string> = {
  critical: "--color-priority-critical",
  high: "--color-priority-high",
  medium: "--color-priority-medium",
  low: "--color-priority-low",
};

export function PriorityDot({ priority, className }: { priority: Priority; className?: string }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full", COLORS[priority], className)} />;
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};
