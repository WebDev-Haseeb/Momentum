import { useEffect, useState } from "react";
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
import type { Task, Priority } from "@/lib/types";
import { useTasksStore } from "@/stores/tasks";
import { Trash2, Archive, RotateCcw } from "lucide-react";
import { PRIORITY_LABEL } from "./PriorityDot";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null; // null/undefined = create mode
}

export function TaskEditor({ open, onOpenChange, task }: Props) {
  const { addTask, updateTask, remove, archive, restore } = useTasksStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setPriority(task?.priority ?? "medium");
      setDueDate(task?.dueDate ? task.dueDate.slice(0, 10) : "");
    }
  }, [open, task]);

  const save = () => {
    if (!title.trim()) return;
    const iso = dueDate ? new Date(dueDate + "T09:00:00").toISOString() : undefined;
    if (task) {
      updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: iso,
      });
    } else {
      addTask({ title, description, priority, dueDate: iso });
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{task ? "Edit task" : "New task"}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
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
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-1.5">
              <Label htmlFor="due">Due date</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={save}
            className="w-full h-12 rounded-2xl text-base"
            disabled={!title.trim()}
          >
            {task ? "Save changes" : "Add task"}
          </Button>

          {task && (
            <div className="flex gap-2 pt-2">
              {task.status === "archived" ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    restore(task.id);
                    onOpenChange(false);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Restore
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
                  <Archive className="h-4 w-4 mr-2" /> Archive
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
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
