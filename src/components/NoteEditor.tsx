import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Note } from "@/lib/types";
import { useNotesStore } from "@/stores/notes";
import { useTasksStore } from "@/stores/tasks";
import { Trash2, Archive, ListChecks, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note | null;
}

export function NoteEditor({ open, onOpenChange, note }: Props) {
  const { addNote, updateNote, remove, archive, unarchive } = useNotesStore();
  const addTask = useTasksStore((s) => s.addTask);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(note?.title ?? "");
      setContent(note?.content ?? "");
    }
  }, [open, note]);

  const save = () => {
    if (!content.trim() && !title.trim()) return;
    if (note) updateNote(note.id, { title: title.trim(), content: content.trim() });
    else addNote({ title, content });
    onOpenChange(false);
  };

  const convert = () => {
    if (!note) return;
    addTask({ title: note.title || note.content.slice(0, 60), description: note.content });
    toast.success("Converted to task");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{note ? "Edit note" : "New note"}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ntitle">Title</Label>
            <Input
              id="ntitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional title"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ncontent">Note</Label>
            <Textarea
              id="ncontent"
              autoFocus={!note}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Capture anything..."
              rows={8}
              className="text-base resize-none"
            />
          </div>
          <Button
            onClick={save}
            className="w-full h-12 rounded-2xl"
            disabled={!content.trim() && !title.trim()}
          >
            {note ? "Save changes" : "Add note"}
          </Button>
          {note && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button variant="outline" onClick={convert}>
                <ListChecks className="h-4 w-4 mr-1" /> Task
              </Button>
              {note.archived ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    unarchive(note.id);
                    onOpenChange(false);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Restore
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    archive(note.id);
                    onOpenChange(false);
                  }}
                >
                  <Archive className="h-4 w-4 mr-1" /> Archive
                </Button>
              )}
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => {
                  remove(note.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
