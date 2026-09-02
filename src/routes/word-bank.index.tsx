import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AddMovieDialog } from "@/components/AddMovieDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { MovieThumb } from "@/components/MovieThumb";
import { useAppState } from "@/lib/store";

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

  return (
    <AppShell tab="Word Bank" right={<ExportDialog movies={movies} words={words} />}>
      <div className="pt-5">
        {movies.length === 0 ? (
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
          <>
            <div className="grid grid-cols-3 gap-3">
              {movies.map((movie) => {
                const count = words.filter((w) => w.movieId === movie.id).length;
                return (
                  <Link
                    key={movie.id}
                    to="/word-bank/$movieId"
                    params={{ movieId: movie.id }}
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
          </>
        )}
      </div>
      <AddMovieDialog open={addOpen} onOpenChange={setAddOpen} />
    </AppShell>
  );
}
