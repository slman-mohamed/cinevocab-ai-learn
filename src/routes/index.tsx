import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MoviePicker } from "@/components/MoviePicker";
import { MovieChooserDialog } from "@/components/MoveWordDialog";
import { WordCard } from "@/components/WordCard";
import { SentenceCard } from "@/components/SentenceCard";
import { extractWords } from "@/lib/vocab.functions";
import { getCachedExtraction, setCachedExtraction } from "@/lib/extract-cache";
import { notify } from "@/lib/notify";
import {
  clearDiscovery,
  deleteWord,
  getState,
  hydrateStore,
  saveWord,
  setDiscoveryResults,
  setDiscoverySentence,
  subscribeState,
  updateWord,
  useAppState,
} from "@/lib/store";
import type { ExtractedWord, QAEntry } from "@/lib/types";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CineVocab — Learn English vocabulary from movies" },
      {
        name: "description",
        content:
          "Paste a line from any movie and CineVocab extracts the difficult words with IPA, part of speech, frequency, definitions and native examples.",
      },
      { property: "og:title", content: "CineVocab — Learn English vocabulary from movies" },
      {
        property: "og:description",
        content: "Turn movie dialogue into flashcards: AI word extraction, a movie-organized word bank and spaced-repetition review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});

function Discover() {
  const { movies, words, selectedMovieId } = useAppState();
  const selected = movies.find((m) => m.id === selectedMovieId) ?? null;
  const [sentence, setSentence] = useState("");
  const [results, setResults] = useState<ExtractedWord[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainedSentence, setExplainedSentence] = useState("");
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<ExtractedWord | null>(null);
  const extract = useServerFn(extractWords);

  // Restore the last Discover extraction after the store hydrates from localStorage.
  useEffect(() => {
    const tryRestore = () => {
      hydrateStore();
      const s = getState();
      if (s.lastSubmittedSentence || (s.lastResults ?? []).length || s.lastExplanation) {
        setSentence(s.lastSubmittedSentence || "");
        setResults(s.lastResults ?? []);
        setExplanation(s.lastExplanation ?? null);
        setExplainedSentence(s.lastSubmittedSentence || "");
        return true;
      }
      return false;
    };

    if (tryRestore()) return;

    // Hydration may happen in a parent effect after this one; listen once.
    let unsubscribe = () => {};
    unsubscribe = subscribeState(() => {
      if (tryRestore()) unsubscribe();
    });
    return () => unsubscribe();
  }, []);

  // Persist results/explanation back to the store whenever they change.
  const hasResults = results.length > 0 || explanation !== null;
  useEffect(() => {
    if (hasResults) {
      setDiscoveryResults(results, explanation);
    }
  }, [hasResults, results, explanation]);

  const onQaChange = (word: ExtractedWord, qa: QAEntry[]) => {
    setResults((rs) => rs.map((r) => (r.word === word.word ? { ...r, qa } : r)));
    const id = savedIds[word.word];
    if (id) updateWord(id, { qa });
  };


  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const cached = getCachedExtraction(text, selected?.title);
      if (cached) return cached;
      const fresh = await extract({ data: { sentence: text, movieTitle: selected?.title } });
      setCachedExtraction(text, selected?.title, {
        explanation: fresh.explanation ?? null,
        words: fresh.words,
      });
      return fresh;
    },
    onSuccess: (data, text) => {
      setResults(data.words);
      setExplanation(data.explanation ?? null);
      setExplainedSentence(text);
      setSavedKeys([]);
      setSavedIds({});
      if (data.words.length === 0 && !data.explanation)
        notify("No difficult words found in that line", "error");
    },
    onError: (error: Error) => notify(error.message, "error"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentence.trim()) return;
    setDiscoverySentence(sentence.trim());
    mutation.mutate(sentence.trim());
  };

  const commitSave = (word: ExtractedWord, movieId: string) => {
    const already = words.some(
      (w) => w.movieId === movieId && w.word.toLowerCase() === word.word.toLowerCase(),
    );
    if (already) {
      notify(`"${word.word}" is already in that movie`, "error");
      return;
    }
    const latest = results.find((r) => r.word === word.word) ?? word;
    const savedCard = saveWord(latest, movieId, explainedSentence || sentence.trim());
    setSavedKeys((k) => [...k, word.word]);
    setSavedIds((m) => ({ ...m, [word.word]: savedCard.id }));
    notify(`Saved "${word.word}" to Word Bank`);
  };


  const onSave = (word: ExtractedWord) => {
    const existing =
      savedIds[word.word] ??
      (selected
        ? words.find(
            (w) => w.movieId === selected.id && w.word.toLowerCase() === word.word.toLowerCase(),
          )?.id
        : undefined);

    if (existing) {
      deleteWord(existing);
      setSavedKeys((k) => k.filter((w) => w !== word.word));
      setSavedIds(({ [word.word]: _removed, ...rest }) => rest);
      notify(`Removed "${word.word}" from your Word Bank`);
      return;
    }

    if (!selected) {
      setPending(word);
      return;
    }
    commitSave(word, selected.id);
  };

  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <AppShell tab="Discover">
      <MoviePicker movies={movies} words={words} selected={selected} />

      <form onSubmit={submit} className="pt-6">
        <div className="relative rounded-xl border border-line bg-surface">
          <div className="flex items-center gap-2 px-3.5 pt-3.5">
            <span className="size-1.5 rounded-full bg-accent" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              What did you hear?
            </p>
          </div>
          {sentence ? (
            <button
              type="button"
              onClick={() => {
                setSentence("");
                setResults([]);
                setExplanation(null);
                setExplainedSentence("");
                setSavedKeys([]);
                setSavedIds({});
                clearDiscovery();
                inputRef.current?.focus();
              }}
              onMouseDown={(e) => e.preventDefault()}
              aria-label="Clear the text"
              className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-[7px] border border-line bg-raised text-muted transition-colors hover:border-destructive/50 hover:text-destructive"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
          <textarea
            ref={inputRef}
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            rows={3}
            placeholder="Type or paste a word, phrase or full line from the scene…"
            className="w-full resize-none bg-transparent px-3.5 pt-2.5 pb-3.5 text-[15px] leading-relaxed text-fg outline-none placeholder:text-muted"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending || !sentence.trim()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] bg-accent py-3 text-[14px] font-semibold text-accent-foreground ring-1 ring-accent/40 disabled:opacity-40"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Working out the meaning…
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> Understand the meaning
            </>
          )}
        </button>
      </form>

      {results.length > 0 || explanation ? (
        <>
          <div className="pt-7 pb-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Worth learning · {results.length} {results.length === 1 ? "word" : "words"}
            </p>
          </div>
          <div className="space-y-3">
            {explanation ? (
              <SentenceCard sentence={explainedSentence} explanation={explanation} />
            ) : null}
            {results.map((w, i) => (
              <WordCard
                key={`${w.word}-${i}`}
                word={w}
                index={i}
                saved={
                  savedKeys.includes(w.word) ||
                  (!!selected &&
                    words.some(
                      (s) => s.movieId === selected.id && s.word.toLowerCase() === w.word.toLowerCase(),
                    ))
                }
                sourceSentence={explainedSentence || sentence.trim()}
                onSave={() => onSave(w)}
                onQaChange={(qa) => onQaChange(w, qa)}

              />
            ))}
          </div>
        </>
      ) : (
        <p className="pt-10 text-center text-[13px] leading-relaxed text-muted">
          {movies.length === 0
            ? "Paste anything you didn't catch — you can file it under a movie later."
            : "Paste anything you didn't catch and we'll explain it in simple English."}
        </p>
      )}

      <MovieChooserDialog
        open={pending !== null}
        onOpenChange={(open) => setPending(open ? pending : null)}
        movies={movies}
        title="Which movie should this card go to?"
        onPick={(movieId) => {
          if (pending) commitSave(pending, movieId);
          setPending(null);
        }}
      />
    </AppShell>
  );
}
