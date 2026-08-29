import { useState } from "react";
import { FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { downloadCsv, exportPdf } from "@/lib/exporting";
import { notify } from "@/lib/notify";
import type { Movie, SavedWord } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  movies: Movie[];
  words: SavedWord[];
}

export function ExportDialog({ movies, words }: Props) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<string>("all");
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");

  const run = () => {
    const selectedMovies = scope === "all" ? movies : movies.filter((m) => m.id === scope);
    const selectedWords = words
      .filter((w) => selectedMovies.some((m) => m.id === w.movieId))
      .sort((a, b) => a.createdAt - b.createdAt);

    if (selectedWords.length === 0) {
      notify("Nothing to export yet", "error");
      return;
    }

    const name = scope === "all" ? "CineVocab-All-Movies" : (selectedMovies[0]?.title ?? "CineVocab");
    if (format === "csv") {
      downloadCsv(selectedMovies, selectedWords, name);
      notify(`Exported ${selectedWords.length} words as CSV`);
    } else {
      const ok = exportPdf(selectedMovies, selectedWords, name);
      notify(ok ? "PDF ready — use your print dialog to save" : "Allow pop-ups to export a PDF", ok ? "success" : "error");
    }
    setOpen(false);
  };

  const optionClass = (active: boolean) =>
    cn(
      "flex-1 rounded-[8px] border px-3 py-2 text-[12px] font-semibold transition-colors",
      active ? "border-accent/50 bg-accent/12 text-accent" : "border-line bg-raised text-muted",
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-line bg-raised px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-accent/50 hover:text-accent"
        >
          <FileDown className="size-3.5" /> Export
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-95 border-line bg-surface text-fg">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold text-fg">Export word bank</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Scope</p>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="mt-1.5 w-full rounded-[8px] border border-line bg-raised px-3 py-2.5 text-[14px] text-fg outline-none focus:border-accent/60"
            >
              <option value="all">All movies</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Format</p>
            <div className="mt-1.5 flex gap-2">
              <button type="button" onClick={() => setFormat("pdf")} className={optionClass(format === "pdf")}>
                PDF
              </button>
              <button type="button" onClick={() => setFormat("csv")} className={optionClass(format === "csv")}>
                CSV
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={run}
            className="w-full rounded-[9px] bg-accent py-3 text-[14px] font-semibold text-accent-foreground"
          >
            Export
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
