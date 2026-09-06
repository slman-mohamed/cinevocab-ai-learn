import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUp, ArrowDown, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExportDialog } from "@/components/ExportDialog";
import { MovieThumb } from "@/components/MovieThumb";
import { MovieChooserDialog } from "@/components/MoveWordDialog";
import { WordCard } from "@/components/WordCard";
import { deleteWord, moveWord, updateWord, useAppState } from "@/lib/store";
import { dueLabel } from "@/lib/srs";
import { notify } from "@/lib/notify";
import { posLabel } from "@/lib/wordsearch";
import { cn } from "@/lib/utils";
import type { FrequencyLevel, SavedWord } from "@/lib/types";

const FREQ_ORDER: FrequencyLevel[] = ["Very Common", "Common", "Uncommon", "Rare"];

type SortKey = "oldest" | "newest" | "common" | "type";

export const Route = createFileRoute("/word-bank/$movieId")({
  validateSearch: (search: Record<string, unknown>) => ({
    w: typeof search["w"] === "string" ? (search["w"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Movie words — CineVocab" },
      {
        name: "description",
        content:
          "Every word you saved from this movie, in the order you learned it — filter by word type or how common it is, move cards between movies or delete them.",
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

function chip(active: boolean) {
  return cn(
    "shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
    active
      ? "border-accent/50 bg-accent/15 text-accent"
      : "border-line bg-raised text-muted hover:border-accent/40 hover:text-accent",
  );
}

function MovieWords() {
  const { movieId } = Route.useParams();
  const { w: focusId } = Route.useSearch();
  const { movies, words } = useAppState();
  const movie = movies.find((m) => m.id === movieId) ?? null;
  const [moving, setMoving] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pos, setPos] = useState<string | null>(null);
  const [freq, setFreq] = useState<FrequencyLevel | null>(null);
  const [sort, setSort] = useState<SortKey>("oldest");
  const [typeOrder, setTypeOrder] = useState<string[]>([]);
  const [flashId, setFlashId] = useState<string | null>(null);

  const all = useMemo(
    () => words.filter((x) => x.movieId === movieId).sort((a, b) => a.createdAt - b.createdAt),
    [words, movieId],
  );

  const posCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const x of all) {
      const key = posLabel(x.partOfSpeech);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const freqCounts = useMemo(
    () =>
      FREQ_ORDER.map(
        (level) => [level, all.filter((x) => x.frequency === level).length] as const,
      ).filter(([, n]) => n > 0),
    [all],
  );

  // keep the manual type order in sync with the types present in this movie
  useEffect(() => {
    const present = posCounts.map(([p]) => p);
    setTypeOrder((prev) => {
      const kept = prev.filter((p) => present.includes(p));
      const added = present.filter((p) => !kept.includes(p));
      return [...kept, ...added];
    });
  }, [posCounts]);

  const items = useMemo(() => {
    let list = all;
    if (pos) list = list.filter((x) => posLabel(x.partOfSpeech) === pos);
    if (freq) list = list.filter((x) => x.frequency === freq);
    const rank = (x: SavedWord) => FREQ_ORDER.indexOf(x.frequency);
    const typeRank = (x: SavedWord) => {
      const i = typeOrder.indexOf(posLabel(x.partOfSpeech));
      return i === -1 ? 999 : i;
    };
    const sorted = [...list];
    if (sort === "newest") sorted.sort((a, b) => b.createdAt - a.createdAt);
    else if (sort === "oldest") sorted.sort((a, b) => a.createdAt - b.createdAt);
    else if (sort === "common")
      sorted.sort((a, b) => rank(a) - rank(b) || a.createdAt - b.createdAt);
    else sorted.sort((a, b) => typeRank(a) - typeRank(b) || a.createdAt - b.createdAt);
    return sorted;
  }, [all, pos, freq, sort, typeOrder]);

  // arriving from search: clear filters, scroll to the card and flash it
  useEffect(() => {
    if (!focusId) return;
    setPos(null);
    setFreq(null);
    const t = setTimeout(() => {
      document
        .getElementById(`word-${focusId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashId(focusId);
    }, 250);
    return () => clearTimeout(t);
  }, [focusId]);

  useEffect(() => {
    if (!flashId) return;
    const t = setTimeout(() => setFlashId(null), 3400);
    return () => clearTimeout(t);
  }, [flashId]);

  const moveType = (index: number, dir: -1 | 1) => {
    setSort("type");
    setTypeOrder((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const a = next[index]!;
      next[index] = next[target]!;
      next[target] = a;
      return next;
    });
  };

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
          <p className="pt-10 text-center text-[13px] text-muted">
            That movie is no longer in your shelf.
          </p>
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
                  {items.length === all.length
                    ? `${all.length} ${all.length === 1 ? "word" : "words"}`
                    : `${items.length} of ${all.length} words`}
                </p>
              </div>
            </div>

            {all.length > 0 ? (
              <div className="mt-5 space-y-2">
                <div className="flex gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Filter by word type</span>
                    <select
                      value={pos ?? ""}
                      onChange={(e) => setPos(e.target.value || null)}
                      className={selectClass(pos !== null)}
                    >
                      <option value="">All types · {all.length}</option>
                      {posCounts.map(([p, n]) => (
                        <option key={p} value={p}>
                          {p} · {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Filter by how common</span>
                    <select
                      value={freq ?? ""}
                      onChange={(e) => setFreq((e.target.value || null) as FrequencyLevel | null)}
                      className={selectClass(freq !== null)}
                    >
                      <option value="">All levels · {all.length}</option>
                      {freqCounts.map(([level, n]) => (
                        <option key={level} value={level}>
                          {level} · {n}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Sort the cards</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className={selectClass(sort !== "oldest")}
                    >
                      <option value="oldest">Oldest first</option>
                      <option value="newest">Newest first</option>
                      <option value="common">Most common first</option>
                      <option value="type">Grouped by word type</option>
                    </select>
                  </label>
                  {pos || freq ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPos(null);
                        setFreq(null);
                      }}
                      className="shrink-0 rounded-[9px] border border-line bg-raised px-3 py-2.5 text-[12px] font-semibold text-muted hover:text-accent"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>

                {sort === "type" && typeOrder.length > 1 ? (
                  <div className="rounded-[11px] border border-line bg-surface p-2">
                    <p className="px-1 pb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                      Group order
                    </p>
                    <div className="space-y-1">
                      {typeOrder.map((p, i) => (
                        <div
                          key={p}
                          className="flex items-center justify-between rounded-[8px] bg-raised px-2.5 py-1.5"
                        >
                          <span className="text-[12px] font-semibold text-fg/85">
                            {p}{" "}
                            <span className="font-mono text-[10px] text-muted">
                              {posCounts.find(([x]) => x === p)?.[1] ?? 0}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveType(i, -1)}
                              disabled={i === 0}
                              aria-label={`Move ${p} up`}
                              className="grid size-7 place-items-center rounded-md text-muted hover:text-accent disabled:opacity-25"
                            >
                              <ArrowUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveType(i, 1)}
                              disabled={i === typeOrder.length - 1}
                              aria-label={`Move ${p} down`}
                              className="grid size-7 place-items-center rounded-md text-muted hover:text-accent disabled:opacity-25"
                            >
                              <ArrowDown className="size-3.5" />
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}


            <div className="mt-5 space-y-2.5">
              {items.length === 0 ? (
                <p className="pt-6 text-center text-[13px] text-muted">
                  {all.length === 0
                    ? "No words from this movie yet."
                    : "No cards match those filters."}
                </p>
              ) : (
                items.map((w, i) => (
                  <WordCard
                    key={w.id}
                    word={w}
                    index={i}
                    cardId={`word-${w.id}`}
                    flash={flashId === w.id}
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
