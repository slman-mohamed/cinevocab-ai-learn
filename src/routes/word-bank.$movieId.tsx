import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExportDialog } from "@/components/ExportDialog";
import { MovieThumb } from "@/components/MovieThumb";
import { MovieChooserDialog } from "@/components/MoveWordDialog";
import { WordCard } from "@/components/WordCard";
import { deleteWord, moveWord, updateWord, useAppState } from "@/lib/store";
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

function selectClass(active: boolean) {
  return cn(
    "w-full appearance-none rounded-[9px] border bg-raised px-3 py-2.5 text-[12px] font-semibold outline-none transition-colors",
    active ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-fg/85",
  );
}

function MovieWords() {
  const { movieId } = Route.useParams();
  const { w: focusId } = Route.useSearch();
  const { movies, words } = useAppState();
  const movie = movies.find((m) => m.id === movieId) ?? null;
  const [moving, setMoving] = useState<string | null>(null);
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
      right={movie ? <ExportDialog movies={[movie]} words={all} fixedScope /> : undefined}
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
              <div className="mt-5 overflow-hidden rounded-[14px] border border-line bg-surface">
                {/* sprocket strip */}
                <div className="flex items-center justify-between gap-1.5 border-b border-line/70 bg-raised/40 px-3 py-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                    Reel controls
                  </span>
                  <span className="flex gap-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} className="size-1 rounded-full bg-line" />
                    ))}
                  </span>
                </div>

                <div className="space-y-3 p-3">
                  {/* word type rail */}
                  <div>
                    <p className="pb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                      Word type
                    </p>
                    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
                      <button type="button" onClick={() => setPos(null)} className={chipClass(pos === null)}>
                        Everything
                        <span className="ml-1.5 font-mono text-[10px] opacity-60">{all.length}</span>
                      </button>
                      {posCounts.map(([p, n]) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPos(pos === p ? null : p)}
                          className={chipClass(pos === p)}
                        >
                          <span className={cn("mr-1.5 inline-block size-1.5 rounded-full", dotClass(p))} />
                          {p}
                          <span className="ml-1.5 font-mono text-[10px] opacity-60">{n}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* level meters */}
                  {freqCounts.length > 0 ? (
                    <div>
                      <p className="pb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                        How common
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {freqCounts.map(([level, n]) => {
                          const bars = 4 - FREQ_ORDER.indexOf(level);
                          const on = freq === level;
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setFreq(on ? null : level)}
                              className={cn(
                                "flex items-center justify-between rounded-[9px] border px-2.5 py-2 text-left transition-colors",
                                on
                                  ? "border-accent/50 bg-accent/10 text-accent"
                                  : "border-line bg-raised text-fg/80 hover:border-accent/30",
                              )}
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-[11.5px] font-semibold">{level}</span>
                                <span className="mt-1 flex gap-[3px]">
                                  {Array.from({ length: 4 }).map((_, i) => (
                                    <span
                                      key={i}
                                      className={cn(
                                        "h-[3px] w-3.5 rounded-full",
                                        i < bars
                                          ? on
                                            ? "bg-accent"
                                            : "bg-fg/50"
                                          : "bg-line",
                                      )}
                                    />
                                  ))}
                                </span>
                              </span>
                              <span className="ml-2 font-mono text-[11px] opacity-70">{n}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* sort segmented rail */}
                  <div>
                    <p className="pb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                      Order
                    </p>
                    <div className="flex rounded-[10px] border border-line bg-raised p-1">
                      {SORTS.map(({ key, label, Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSort(key)}
                          title={label}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-[7px] px-2 py-1.5 text-[11px] font-semibold transition-colors",
                            sort === key
                              ? "bg-accent text-accent-foreground"
                              : "text-muted hover:text-accent",
                          )}
                        >
                          <Icon className="size-3.5 shrink-0" />
                          <span className="truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {sort === "type" && typeOrder.length > 1 ? (
                    <div className="rounded-[10px] border border-dashed border-line/80 p-2">
                      <p className="px-0.5 pb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                        Drag-free group order
                      </p>
                      <div className="space-y-1">
                        {typeOrder.map((p, i) => (
                          <div
                            key={p}
                            className="flex items-center gap-2 rounded-[8px] bg-raised px-2 py-1.5"
                          >
                            <span className="font-mono text-[10px] text-muted">{i + 1}</span>
                            <span className={cn("size-1.5 rounded-full", dotClass(p))} />
                            <span className="flex-1 truncate text-[12px] font-semibold text-fg/85">
                              {p}
                              <span className="ml-1.5 font-mono text-[10px] text-muted">
                                {posCounts.find(([x]) => x === p)?.[1] ?? 0}
                              </span>
                            </span>
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
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {pos || freq ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPos(null);
                        setFreq(null);
                      }}
                      className="w-full rounded-[9px] border border-line px-3 py-2 text-[11.5px] font-semibold text-muted hover:border-accent/40 hover:text-accent"
                    >
                      Clear filters · showing {items.length} of {all.length}
                    </button>
                  ) : null}
                </div>
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
