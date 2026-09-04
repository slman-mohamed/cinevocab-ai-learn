import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExportDialog } from "@/components/ExportDialog";
import { MovieThumb } from "@/components/MovieThumb";
import { MovieChooserDialog } from "@/components/MoveWordDialog";
import { WordCard } from "@/components/WordCard";
import { deleteWord, moveWord, updateWord, useAppState } from "@/lib/store";
import { dueLabel } from "@/lib/srs";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/word-bank/$movieId")({
  head: () => ({
    meta: [
      { title: "Movie words — CineVocab" },
      {
        name: "description",
        content: "Every word you saved from this movie, in the order you learned it — move cards between movies or delete them.",
      },
      { property: "og:title", content: "Movie words — CineVocab" },
      {
        property: "og:description",
        content: "A single movie's vocabulary folder inside your CineVocab word bank.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MovieWords,
});

function MovieWords() {
  const { movieId } = Route.useParams();
  const { movies, words } = useAppState();
  const movie = movies.find((m) => m.id === movieId) ?? null;
  const [moving, setMoving] = useState<string | null>(null);

  const items = words
    .filter((w) => w.movieId === movieId)
    .sort((a, b) => a.createdAt - b.createdAt);

  return (
    <AppShell
      tab="Word Bank"
      right={movie ? <ExportDialog movies={[movie]} words={items} /> : undefined}
    >
      <div className="pt-5">
        <Link
          to="/word-bank"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted hover:text-accent"
        >
          <ArrowLeft className="size-3.5" /> All movies
        </Link>

        {!movie ? (
          <p className="pt-10 text-center text-[13px] text-muted">That movie is no longer in your shelf.</p>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-3.5">
              <MovieThumb
                movie={movie}
                className="h-30 w-20 rounded-[8px] border border-line"
                textClassName="text-2xl"
              />
              <div className="min-w-0">
                <h2 className="text-[19px] font-semibold leading-tight text-fg">{movie.title}</h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  {items.length} {items.length === 1 ? "word" : "words"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              {items.length === 0 ? (
                <p className="pt-6 text-center text-[13px] text-muted">
                  No words from this movie yet.
                </p>
              ) : (
                items.map((w, i) => (
                  <WordCard
                    key={w.id}
                    word={w}
                    index={i}
                    meta={dueLabel(w)}
                    onMove={() => setMoving(w.id)}
                    onDelete={() => deleteWord(w.id)}
                    onQaChange={(qa) => updateWord(w.id, { qa })}
                  />
                ))

              )}
            </div>
          </>
        )}
      </div>

      <MovieChooserDialog
        open={moving !== null}
        onOpenChange={(open) => setMoving(open ? moving : null)}
        movies={movies}
        currentMovieId={movieId}
        title="Move this card to…"
        onPick={(target) => {
          if (!moving) return;
          moveWord(moving, target);
          setMoving(null);
          notify(`Moved to ${movies.find((m) => m.id === target)?.title ?? "movie"}`);
        }}
      />
    </AppShell>
  );
}
