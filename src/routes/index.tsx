import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MoviePicker } from "@/components/MoviePicker";
import { MovieChooserDialog } from "@/components/MoveWordDialog";
import { WordCard } from "@/components/WordCard";
import { SentenceCard } from "@/components/SentenceCard";
import { extractWords } from "@/lib/vocab.functions";
import { notify } from "@/lib/notify";
import { saveWord, useAppState } from "@/lib/store";
import type { ExtractedWord } from "@/lib/types";

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

  const onQaChange = (word: ExtractedWord, qa: QAEntry[]) => {
    setResults((rs) => rs.map((r) => (r.word === word.word ? { ...r, qa } : r)));
    const id = savedIds[word.word];
    if (id) updateWord(id, { qa });
  };


  const mutation = useMutation({
    mutationFn: (text: string) =>
      extract({ data: { sentence: text, movieTitle: selected?.title } }),
    onSuccess: (data, text) => {
      setResults(data.words);
      setExplanation(data.explanation ?? null);
      setExplainedSentence(text);
      setSavedKeys([]);
      if (data.words.length === 0 && !data.explanation)
        notify("No difficult words found in that line", "error");
    },
    onError: (error: Error) => notify(error.message, "error"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentence.trim()) return;
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
    saveWord(word, movieId, explainedSentence || sentence.trim());
    setSavedKeys((k) => [...k, word.word]);
    notify(`Saved "${word.word}" to Word Bank`);
  };

  const onSave = (word: ExtractedWord) => {
    if (!selected) {
      setPending(word);
      return;
    }
    if (savedKeys.includes(word.word)) {
      notify(`"${word.word}" is already in your Word Bank`, "error");
      return;
    }
    commitSave(word, selected.id);
  };

  return (
    <AppShell tab="Discover">
      <MoviePicker movies={movies} words={words} selected={selected} />

      <form onSubmit={submit} className="pt-6">
        <div className="rounded-xl border border-line bg-surface">
          <div className="flex items-center gap-2 px-3.5 pt-3.5">
            <span className="size-1.5 rounded-full bg-accent" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Paste a line</p>
          </div>
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            rows={3}
            placeholder="Paste the sentence you heard in the scene…"
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
              <Loader2 className="size-4 animate-spin" /> Reading the scene…
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> Extract words
            </>
          )}
        </button>
      </form>

      {results.length > 0 || explanation ? (
        <>
          <div className="pt-7 pb-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Extracted · {results.length} {results.length === 1 ? "word" : "words"}
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
                onSave={() => onSave(w)}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="pt-10 text-center text-[13px] leading-relaxed text-muted">
          {movies.length === 0
            ? "Paste a line of dialogue — you can pick a movie for the card later."
            : "Paste a line of dialogue and CineVocab pulls out the words worth learning."}
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
