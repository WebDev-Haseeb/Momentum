import { useEffect, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  ListChecks,
  Plus,
  Repeat,
  StickyNote,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasksStore } from "@/stores/tasks";
import { useHabitsStore } from "@/stores/habits";
import { useNotesStore } from "@/stores/notes";
import { useSettingsStore } from "@/stores/settings";
import { TaskEditor } from "./TaskEditor";
import { NoteEditor } from "./NoteEditor";
import { HabitEditor } from "./HabitEditor";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const TABS: { to: string; label: string; icon: typeof LayoutGrid; exact?: boolean }[] = [
  { to: "/", label: "Focus", icon: LayoutGrid, exact: true },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/habits", label: "Habits", icon: Repeat },
  { to: "/notes", label: "Notes", icon: StickyNote },
];

const TITLES: Record<string, string> = {
  "/": "Focus",
  "/tasks": "Tasks",
  "/habits": "Habits",
  "/notes": "Notes",
  "/settings": "Settings",
};

export function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [fabOpen, setFabOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [habitOpen, setHabitOpen] = useState(false);

  const hydrateT = useTasksStore((s) => s.hydrate);
  const hydrateH = useHabitsStore((s) => s.hydrate);
  const hydrateN = useNotesStore((s) => s.hydrate);
  const hydrateS = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateS();
    void hydrateT();
    void hydrateH();
    void hydrateN();
  }, [hydrateS, hydrateT, hydrateH, hydrateN]);

  const title = TITLES[path] ?? "Momentum";
  const isHome = path === "/";

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col bg-background">
      {/* Header — minimal on home (the page renders its own hero), standard elsewhere */}
      {!isHome && (
        <header className="safe-top sticky top-0 z-30 bg-background/85 backdrop-blur-xl">
          <div className="flex items-center justify-between px-5 pb-3 pt-3">
            <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
            <Link
              to="/settings"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground/70 transition active:scale-95"
              aria-label="Settings"
            >
              <SettingsIcon className="h-[18px] w-[18px]" strokeWidth={2} />
            </Link>
          </div>
        </header>
      )}

      <main
        className={cn(
          "flex-1 px-4",
          isHome ? "pt-0" : "pt-2",
          "pb-[calc(env(safe-area-inset-bottom)+96px)]",
        )}
      >
        <Outlet />
      </main>

      {/* Bottom Nav — solid, edge-to-edge, opaque so content never bleeds through */}
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 bg-background hairline-t">
        <div className="safe-bottom relative flex items-stretch justify-around px-2 pt-1.5">
          {TABS.slice(0, 2).map((t) => (
            <NavItem key={t.to} {...t} active={t.exact ? path === t.to : path.startsWith(t.to)} />
          ))}
          {/* Center create button */}
          <div className="flex items-center justify-center px-1">
            <button
              onClick={() => setFabOpen(true)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg shadow-black/15 transition active:scale-90"
              aria-label="Create"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
          {TABS.slice(2).map((t) => (
            <NavItem key={t.to} {...t} active={path.startsWith(t.to)} />
          ))}
        </div>
      </nav>

      {/* FAB Choice Sheet */}
      <Sheet open={fabOpen} onOpenChange={setFabOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Create</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-2 pb-2">
            <ChoiceButton
              icon={<ListChecks className="h-5 w-5" />}
              label="New task"
              hint="Something to do"
              onClick={() => {
                setFabOpen(false);
                setTaskOpen(true);
              }}
            />
            <ChoiceButton
              icon={<StickyNote className="h-5 w-5" />}
              label="New note"
              hint="Capture a thought"
              onClick={() => {
                setFabOpen(false);
                setNoteOpen(true);
              }}
            />
            <ChoiceButton
              icon={<Repeat className="h-5 w-5" />}
              label="New habit"
              hint="Build consistency"
              onClick={() => {
                setFabOpen(false);
                setHabitOpen(true);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <TaskEditor open={taskOpen} onOpenChange={setTaskOpen} />
      <NoteEditor open={noteOpen} onOpenChange={setNoteOpen} />
      <HabitEditor open={habitOpen} onOpenChange={setHabitOpen} />
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  active: boolean;
}) {
  return (
    <Link
      to={to as "/"}
      className={cn(
        "group flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium tracking-wide transition",
        active ? "text-foreground" : "text-muted-foreground/70",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-12 items-center justify-center rounded-xl transition",
          active ? "bg-foreground/8" : "bg-transparent",
        )}
      >
        <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.4 : 1.9} />
      </div>
      <span className="uppercase">{label}</span>
    </Link>
  );
}

function ChoiceButton({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3.5 text-left transition active:scale-[0.98]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
    </button>
  );
}
