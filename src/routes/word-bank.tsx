import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExportDialog } from "@/components/ExportDialog";
import { WordCard } from "@/components/WordCard";
import { moviePoster } from "@/components/MoviePicker";
import { deleteWord, useAppState } from "@/lib/store";
import { dueLabel } from "@/lib/srs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/word-bank")({
  head: () => ({
    meta: [
      { title: "Word Bank — CineVocab" },
      {
        name: "description",
        content: "Every word you saved, filed by movie, in the order you learned it — export any movie or your whole archive as PDF or CSV.",
      },
      { property: "og:title", content: "Word Bank — CineVocab" },
      {
        property: "og:description",
        content: "Your saved movie vocabulary organized into per-movie folders with PDF and CSV export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WordBank,
});

function WordBank() {
  const { movies, words } = useAppState();
  const [open, setOpen] = useState<string | null>(null);

  const groups = movies
    .map((movie) => ({
      movie,
      items: words.filter((w) => w.movieId === movie.id).sort((a, b) => a.createdAt - b.createdAt),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <AppShell tab="Word Bank" right={<ExportDialog movies={movies} words={words} />}>
      <div className="pt-5">
        {groups.length === 0 ? (
          <p className="pt-10 text-center text-[13px] leading-relaxed text-muted">
            Nothing saved yet. Extract words on Discover and tap the bookmark.
          </p>
        ) : (
          <div className="space-y-2.5">
            {groups.map(({ movie, items }) => {
              const expanded = open === movie.id;
              return (
                <div key={movie.id} className="rounded-xl border border-line bg-surface">
                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? null : movie.id)}
                    className="flex w-full items-center gap-3 px-3.5 py-3"
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-[5px] font-mono text-[13px] font-semibold",
                        moviePoster(movie),
                      )}
                    >
                      {movie.title.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-[14px] font-semibold text-fg">{movie.title}</span>
                      <span className="block font-mono text-[10px] text-muted">
                        {movie.year ? `${movie.year} · ` : ""}
                        {items.length} words
                      </span>
                    </span>
                    <ChevronDown
                      className={cn("size-4 shrink-0 text-muted transition-transform", expanded && "rotate-180")}
                    />
                  </button>

                  {expanded ? (
                    <div className="space-y-2.5 border-t border-line p-3">
                      {items.map((w, i) => (
                        <WordCard
                          key={w.id}
                          word={w}
                          index={i}
                          meta={dueLabel(w)}
                          onDelete={() => deleteWord(w.id)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
