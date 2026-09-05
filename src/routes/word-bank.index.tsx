import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AddMovieDialog } from "@/components/AddMovieDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { MovieThumb } from "@/components/MovieThumb";
import { useAppState } from "@/lib/store";
import { matchesWord, posLabel } from "@/lib/wordsearch";

export const Route = createFileRoute("/word-bank/")({
  head: () => ({
    meta: [
      { title: "Word Bank — CineVocab" },
      {
        name: "description",
        content:
          "Your movie shelf: every film you're learning from, with its poster, and the words you saved from each one.",
      },
      { property: "og:title", content: "Word Bank — CineVocab" },
      {
        property: "og:description",
        content: "A poster shelf of your movies — tap one to see the vocabulary you saved from it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WordBank,
});

function WordBank() {
  const { movies, words } = useAppState();
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");

  const q = query.trim();
  const results = useMemo(() => {
    if (!q) return [];
    return words
      .filter((w) => matchesWord(q, w.word) || matchesWord(q, w.definition))
      .slice(0, 30);
  }, [q, words]);

  return (
    <AppShell tab="Word Bank" right={<ExportDialog movies={movies} words={words} />}>
      <div className="pt-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a word in any form…"
            aria-label="Search your saved words"
            className="w-full rounded-[10px] border border-line bg-raised py-2.5 pl-9 pr-9 text-[13px] text-fg outline-none placeholder:text-muted focus:border-accent/50"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-accent"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {q ? (
          <div className="mt-4 space-y-2">
            {results.length === 0 ? (
              <p className="pt-6 text-center text-[13px] text-muted">
                Nothing saved that looks like &ldquo;{q}&rdquo; yet.
              </p>
            ) : (
              results.map((w) => {
                const movie = movies.find((m) => m.id === w.movieId);
                return (
                  <Link
                    key={w.id}
                    to="/word-bank/$movieId"
                    params={{ movieId: w.movieId }}
                    search={{ w: w.id }}
                    className="slip flex items-center gap-3 rounded-[10px] border border-line bg-surface p-2.5 transition-colors hover:border-accent/50"
                  >
                    {movie ? (
                      <MovieThumb
                        movie={movie}
                        className="h-14 w-10 shrink-0 rounded-[6px] border border-line"
                        textClassName="text-sm"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold leading-tight text-fg">
                        {w.word}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                        {posLabel(w.partOfSpeech)} · {movie?.title ?? "no movie"}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[12px] text-fg/75">{w.definition}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        ) : movies.length === 0 ? (
          <div className="pt-10 text-center">
            <p className="text-[13px] leading-relaxed text-muted">
              No movies yet. Add the film you're watching to start a shelf.
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-[9px] bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground"
            >
              <Plus className="size-3.5" /> Add a movie
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {movies.map((movie) => {
              const count = words.filter((w) => w.movieId === movie.id).length;
              return (
                <Link
                  key={movie.id}
                  to="/word-bank/$movieId"
                  params={{ movieId: movie.id }}
                  search={{ w: undefined }}
                  className="group block"
                >
                  <MovieThumb
                    movie={movie}
                    className="aspect-2/3 w-full rounded-[9px] border border-line transition-colors group-hover:border-accent/50"
                    textClassName="text-2xl"
                  />
                  <p className="mt-1.5 line-clamp-2 text-[12px] font-semibold leading-snug text-fg">
                    {movie.title}
                  </p>
                  <p className="font-mono text-[10px] text-muted">{count} words</p>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex aspect-2/3 w-full flex-col items-center justify-center gap-1.5 rounded-[9px] border border-dashed border-line text-[11px] font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Plus className="size-4" /> Add
            </button>
          </div>
        )}
      </div>
      <AddMovieDialog open={addOpen} onOpenChange={setAddOpen} />
    </AppShell>
  );
}
