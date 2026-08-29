import { Link } from "@tanstack/react-router";
import { Clapperboard, Library, Target } from "lucide-react";

const tabs = [
  { to: "/", label: "Discover", Icon: Clapperboard },
  { to: "/word-bank", label: "Word Bank", Icon: Library },
  { to: "/review", label: "Review", Icon: Target },
] as const;

export function BottomNav() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-ink via-ink/95 to-transparent pb-4 pt-6">
      <nav className="mx-auto flex w-[calc(100%-2.5rem)] max-w-105 items-center justify-between rounded-2xl border border-line bg-surface/95 px-3 py-2 backdrop-blur">
        {tabs.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-1 flex-col items-center gap-1 rounded-[9px] py-2 text-muted transition-colors"
            activeProps={{ className: "bg-raised text-accent" }}
          >
            <Icon className="size-4" />
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
