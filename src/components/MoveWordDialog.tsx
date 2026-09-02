import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddMovieDialog } from "./AddMovieDialog";
import { MovieThumb } from "./MovieThumb";
import type { Movie } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movies: Movie[];
  currentMovieId?: string | null;
  title?: string;
  onPick: (movieId: string) => void;
}

/** Pick the movie a card belongs to — used when saving and when moving a card. */
export function MovieChooserDialog({
  open,
  onOpenChange,
  movies,
  currentMovieId,
  title = "Which movie?",
  onPick,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-95 border-line bg-surface p-0 text-fg">
          <DialogHeader className="border-b border-line px-4 pt-4 pb-3">
            <DialogTitle className="text-[15px] font-semibold text-fg">{title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 space-y-1.5 overflow-y-auto p-3">
            {movies.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-muted">No movies yet.</p>
            ) : (
              movies.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onPick(m.id);
                    onOpenChange(false);
                  }}
                  disabled={m.id === currentMovieId}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[9px] border p-2 text-left transition-colors",
                    m.id === currentMovieId
                      ? "border-accent/40 bg-accent/8 opacity-60"
                      : "border-line bg-raised hover:border-accent/50",
                  )}
                >
                  <MovieThumb movie={m} className="size-9 rounded-[5px]" textClassName="text-[13px]" />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-fg">{m.title}</span>
                  {m.id === currentMovieId ? <Check className="size-4 shrink-0 text-accent" /> : null}
                </button>
              ))
            )}
          </div>
          <div className="border-t border-line p-3">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-[8px] border border-dashed border-line py-2.5 text-[13px] font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Plus className="size-3.5" /> Add a new movie
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AddMovieDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={(movie) => {
          onPick(movie.id);
          onOpenChange(false);
        }}
      />
    </>
  );
}
