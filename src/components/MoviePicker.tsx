import { useMemo, useState } from "react";
import { Check, ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddMovieDialog } from "./AddMovieDialog";
import { MovieThumb } from "./MovieThumb";
import { removeMovie, selectMovie } from "@/lib/store";
import type { Movie, SavedWord } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  movies: Movie[];
  words: SavedWord[];
  selected: Movie | null;
}

export function MoviePicker({ movies, words, selected }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? movies.filter((m) => m.title.toLowerCase().includes(q)) : movies;
  }, [movies, query]);

  const countFor = (movieId: string) => words.filter((w) => w.movieId === movieId).length;

  return (
    <div className="pt-4">
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex w-full items-center gap-3 rounded-[10px] border border-line bg-surface p-2.5 text-left transition-colors hover:border-accent/40"
      >
        <MovieThumb movie={selected} className="size-[52px] rounded-[6px]" textClassName="text-lg" />
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Now scanning
          </span>
          <span className="block truncate text-[15px] font-semibold text-fg">
            {selected ? selected.title : "Choose a movie (optional)"}
          </span>
        </span>
        <span className="flex items-center rounded-[7px] bg-raised px-2.5 py-2 text-muted">
          <ChevronDown className="size-4" />
        </span>
      </button>

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-dashed border-line px-3 py-2 text-[12px] font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent"
      >
        <Plus className="size-3.5" /> Add a movie
      </button>

      {/* Movie picker sheet */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-95 border-line bg-surface p-0 text-fg">
          <DialogHeader className="border-b border-line px-4 pt-4 pb-3">
            <DialogTitle className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Your movies
            </DialogTitle>
          </DialogHeader>
          <div className="px-4">
            <div className="flex items-center gap-2 rounded-[8px] border border-line bg-raised px-3">
              <Search className="size-3.5 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies…"
                className="w-full bg-transparent py-2.5 text-[13px] text-fg outline-none placeholder:text-muted"
              />
            </div>
          </div>
          <div className="max-h-72 space-y-1.5 overflow-y-auto px-4 pb-2">
            {selected ? (
              <button
                type="button"
                onClick={() => {
                  selectMovie(null);
                  setPickerOpen(false);
                }}
                className="w-full rounded-[9px] border border-line bg-raised px-3 py-2 text-left text-[12px] text-muted hover:text-accent"
              >
                Clear selection
              </button>
            ) : null}
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-muted">No movies yet.</p>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-center gap-3 rounded-[9px] border p-2",
                    selected?.id === m.id ? "border-accent/40 bg-accent/8" : "border-line bg-raised",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      selectMovie(m.id);
                      setPickerOpen(false);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <MovieThumb movie={m} className="size-9 rounded-[5px]" textClassName="text-[13px]" />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold text-fg">{m.title}</span>
                      <span className="block font-mono text-[10px] text-muted">{countFor(m.id)} words</span>
                    </span>
                  </button>
                  {selected?.id === m.id ? <Check className="size-4 shrink-0 text-accent" /> : null}
                  <button
                    type="button"
                    aria-label={`Remove ${m.title}`}
                    onClick={() => removeMovie(m.id)}
                    className="shrink-0 text-muted transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-line p-3">
            <button
              type="button"
              onClick={() => {
                setPickerOpen(false);
                setAddOpen(true);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-[8px] bg-accent py-2.5 text-[13px] font-semibold text-accent-foreground"
            >
              <Plus className="size-3.5" /> Add a movie
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AddMovieDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
