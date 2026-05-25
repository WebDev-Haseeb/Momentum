import { create } from "zustand";
import type { Note } from "@/lib/types";
import { kvGet, kvSet } from "@/lib/db";

const KEY = "notes";

interface NotesState {
  notes: Note[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addNote: (input: { title?: string; content: string }) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  archive: (id: string) => void;
  unarchive: (id: string) => void;
  remove: (id: string) => void;
  deleteAll: () => void;
}

function persist(notes: Note[]) {
  void kvSet(KEY, notes);
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    const data = (await kvGet<Note[]>(KEY)) ?? [];
    set({ notes: data, hydrated: true });
  },
  addNote: ({ title, content }) => {
    const now = new Date().toISOString();
    const n: Note = {
      id: crypto.randomUUID(),
      title: (title ?? "").trim(),
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
      archived: false,
    };
    const notes = [n, ...get().notes];
    set({ notes });
    persist(notes);
    return n;
  },
  updateNote: (id, patch) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
    );
    set({ notes });
    persist(notes);
  },
  archive: (id) => get().updateNote(id, { archived: true }),
  unarchive: (id) => get().updateNote(id, { archived: false }),
  remove: (id) => {
    const notes = get().notes.filter((n) => n.id !== id);
    set({ notes });
    persist(notes);
  },
  deleteAll: () => {
    set({ notes: [] });
    persist([]);
  },
}));
