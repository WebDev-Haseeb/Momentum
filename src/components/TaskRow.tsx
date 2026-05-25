import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { PRIORITY_COLOR_VAR } from "./PriorityDot";
import { formatDueLabel, isOverdue } from "@/lib/date";

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onOpen?: (task: Task) => void;
  showAttention?: boolean;
  /** Flat mode: no card chrome, used when rendered inside a grouped container */
  flat?: boolean;
}

export function TaskRow({ task, onToggle, onOpen, showAttention, flat }: Props) {
  const completed = task.status === "completed";
  const overdue = !completed && isOverdue(task.dueDate);

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 px-4 py-3.5 transition active:bg-muted/40",
        !flat && "rounded-2xl bg-surface hairline",
      )}
      onClick={() => onOpen?.(task)}
      role="button"
    >
      {/* Priority accent rail */}
      <span
        aria-hidden
        className="absolute left-0 top-3 h-[calc(100%-1.5rem)] w-[3px] rounded-full"
        style={{
          background: `var(${PRIORITY_COLOR_VAR[task.priority]})`,
          opacity: completed ? 0.25 : 1,
        }}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={cn(
          "mt-0.5 ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition",
          completed
            ? "border-success bg-success text-white"
            : "border-muted-foreground/30 hover:border-foreground",
        )}
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
      >
        {completed && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[15px] font-medium leading-tight",
            completed && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        {(task.dueDate || task.description) && (
          <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            {task.dueDate && (
              <span
                className={cn("flex items-center gap-1", overdue && "text-destructive font-medium")}
              >
                {overdue && <AlertCircle className="h-3 w-3" strokeWidth={2.4} />}
                {formatDueLabel(task.dueDate)}
              </span>
            )}
            {task.description && task.dueDate && (
              <span className="text-muted-foreground/40">·</span>
            )}
            {task.description && <span className="truncate">{task.description}</span>}
          </div>
        )}
      </div>
      {showAttention && (
        <div
          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground"
          aria-label="Needs attention"
        />
      )}
    </div>
  );
}
