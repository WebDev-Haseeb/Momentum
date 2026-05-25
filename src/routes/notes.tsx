import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useNotesStore } from "@/stores/notes";
import { NoteEditor } from "@/components/NoteEditor";
import type { Note } from "@/lib/types";
import { Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Notes — Momentum" }] }),
  component: NotesPage,
});

function NotesPage() {
  const notes = useNotesStore((s) => s.notes);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  const list = useMemo(() => {
    let arr = notes.filter((n) => (tab === "archived" ? n.archived : !n.archived));
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter(
        (n) => n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s),
      );
    }
    return arr.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, q, tab]);

  return (
    <div className="space-y-3 pt-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes"
          className="h-11 rounded-2xl bg-muted/60 border-0 pl-9 text-base"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="w-full rounded-full bg-muted/60">
          <TabsTrigger value="active" className="rounded-full">
            Active
          </TabsTrigger>
          <TabsTrigger value="archived" className="rounded-full">
            Archived
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-2">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
            {q ? "No matches" : "No notes yet"}
          </div>
        ) : (
          list.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                setEditing(n);
                setOpen(true);
              }}
              className="rounded-2xl bg-surface hairline p-4 text-left transition active:scale-[0.99]"
            >
              {n.title && <p className="font-semibold truncate">{n.title}</p>}
              <p className={`text-sm text-muted-foreground line-clamp-3 ${n.title ? "mt-1" : ""}`}>
                {n.content || "Empty note"}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground/70">
                {format(parseISO(n.updatedAt), "MMM d, yyyy")}
              </p>
            </button>
          ))
        )}
      </div>

      <NoteEditor open={open} onOpenChange={setOpen} note={editing} />
    </div>
  );
}
