import { useEffect, type ReactNode } from "react";
import { hydrateStore } from "@/lib/store";
import { BottomNav } from "./BottomNav";

interface Props {
  tab: string;
  right?: ReactNode;
  children: ReactNode;
}

export function AppShell({ tab, right, children }: Props) {
  useEffect(() => {
    hydrateStore();
  }, []);

  return (
    <div className="min-h-screen bg-ink pb-32 text-fg">
      <div className="mx-auto w-full max-w-105 px-5">
        <header className="flex items-center justify-between pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-[4px] bg-accent font-mono text-sm font-semibold text-accent-foreground">
              C
            </span>
            <div className="leading-none">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">CineVocab</p>
              <h1 className="mt-1 text-[13px] font-semibold text-fg">{tab}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">{right}</div>
        </header>

        <div className="h-px w-full bg-line" />

        {children}
      </div>
      <BottomNav />
    </div>
  );
}
