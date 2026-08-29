import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PillBadges } from "@/components/PillBadges";
import { notify } from "@/lib/notify";
import { nextSchedule, dueLabel, type Rating } from "@/lib/srs";
import { updateWord, useAppState } from "@/lib/store";
import type { SavedWord } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review & Quiz — CineVocab" },
      {
        name: "description",
        content: "Flip flashcards on a spaced-repetition schedule, then test recall with fill-in-the-blank, multiple choice and matching quizzes.",
      },
      { property: "og:title", content: "Review & Quiz — CineVocab" },
      {
        property: "og:description",
        content: "Spaced repetition flashcards plus three quiz modes built from the words you saved while watching.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Review,
});

type Mode = "flashcards" | "blank" | "choice" | "match";

const modes: Array<{ id: Mode; label: string }> = [
  { id: "flashcards", label: "Flashcards" },
  { id: "blank", label: "Fill blank" },
  { id: "choice", label: "Choice" },
  { id: "match", label: "Matching" },
];

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function Review() {
  const { words } = useAppState();
  const [mode, setMode] = useState<Mode>("flashcards");

  return (
    <AppShell
      tab="Review & Quiz"
      right={
        <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {words.length} words
        </span>
      }
    >
      <div className="flex gap-1.5 overflow-x-auto pt-4 pb-1">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
              mode === m.id
                ? "border-accent/50 bg-accent/12 text-accent"
                : "border-line bg-raised text-muted",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {words.length === 0 ? (
        <p className="pt-12 text-center text-[13px] leading-relaxed text-muted">
          Save some words first — your review deck builds itself.
        </p>
      ) : (
        <div className="pt-5">
          {mode === "flashcards" ? <Flashcards words={words} /> : null}
          {mode === "blank" ? <FillBlank words={words} /> : null}
          {mode === "choice" ? <MultipleChoice words={words} /> : null}
          {mode === "match" ? <Matching words={words} /> : null}
        </div>
      )}
    </AppShell>
  );
}

function Flashcards({ words }: { words: SavedWord[] }) {
  const deck = useMemo(() => {
    const due = words.filter((w) => w.dueAt <= Date.now());
    return (due.length > 0 ? due : words).slice().sort((a, b) => a.dueAt - b.dueAt);
  }, [words]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = deck[Math.min(index, deck.length - 1)];
  if (!card) return null;

  const rate = (rating: Rating) => {
    updateWord(card.id, nextSchedule(card, rating));
    notify(`"${card.word}" scheduled — ${rating}`);
    setFlipped(false);
    setIndex((i) => (i + 1 < deck.length ? i + 1 : 0));
  };

  return (
    <div>
      <div className="flex items-center justify-between pb-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          Card {Math.min(index + 1, deck.length)} / {deck.length}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{dueLabel(card)}</p>
      </div>

      <div className="[perspective:1200px]">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="flip-3d relative block w-full text-left"
          style={{ transform: flipped ? "rotateY(180deg)" : "none", minHeight: "300px" }}
        >
          <div className="backface-hidden grid min-h-[300px] place-items-center rounded-xl border border-line bg-surface p-6">
            <div className="text-center">
              <p className="text-[28px] font-semibold text-fg">{card.word}</p>
              <p className="mt-2 font-mono text-[11px] text-accent">{card.ipa}</p>
              <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                Tap to reveal
              </p>
            </div>
          </div>
          <div
            className="backface-hidden absolute inset-0 min-h-[300px] rounded-xl border border-line bg-raised p-5"
            style={{ transform: "rotateY(180deg)" }}
          >
            <p className="text-[18px] font-semibold text-fg">{card.word}</p>
            <PillBadges
              ipa={card.ipa}
              partOfSpeech={card.partOfSpeech}
              frequency={card.frequency}
              size="sm"
            />
            <p className="mt-3 text-[14px] leading-relaxed text-fg/85">{card.definition}</p>
            <div className="mt-3 space-y-1.5 border-t border-line pt-3">
              {card.examples.map((ex, i) => (
                <p key={i} className="text-[12.5px] leading-relaxed text-muted">
                  &ldquo;{ex}&rdquo;
                </p>
              ))}
            </div>
          </div>
        </button>
      </div>

      {flipped ? (
        <div className="mt-3 flex gap-2">
          {(["hard", "medium", "easy"] as Rating[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => rate(r)}
              className={cn(
                "flex-1 rounded-[9px] border py-2.5 text-[12px] font-semibold capitalize transition-colors",
                r === "hard" && "border-pos-noun/40 bg-pos-noun/12 text-pos-noun",
                r === "medium" && "border-accent/40 bg-accent/12 text-accent",
                r === "easy" && "border-pos-verb/40 bg-pos-verb/12 text-pos-verb",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FillBlank({ words }: { words: SavedWord[] }) {
  const pool = useMemo(() => shuffle(words), [words]);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "right" | "wrong">("idle");

  const card = pool[i % pool.length]!;
  const sentence = (card.sourceSentence || card.examples[0] || card.word).replace(
    new RegExp(card.word, "gi"),
    "______",
  );

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = value.trim().toLowerCase() === card.word.toLowerCase();
    setState(ok ? "right" : "wrong");
    notify(ok ? "Correct!" : `Not quite — it's "${card.word}"`, ok ? "success" : "error");
  };

  const next = () => {
    setI((n) => n + 1);
    setValue("");
    setState("idle");
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Complete the line</p>
      <p className="mt-3 text-[15px] leading-relaxed text-fg/90">&ldquo;{sentence}&rdquo;</p>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">{card.definition}</p>
      <form onSubmit={check} className="mt-4 space-y-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type the missing word"
          className={cn(
            "w-full rounded-[8px] border bg-raised px-3 py-2.5 text-[14px] text-fg outline-none",
            state === "right" && "border-pos-verb/60",
            state === "wrong" && "border-pos-noun/60",
            state === "idle" && "border-line focus:border-accent/60",
          )}
        />
        {state === "idle" ? (
          <button
            type="submit"
            className="w-full rounded-[9px] bg-accent py-2.5 text-[13px] font-semibold text-accent-foreground"
          >
            Check
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="flex w-full items-center justify-center gap-1.5 rounded-[9px] border border-line bg-raised py-2.5 text-[13px] font-semibold text-fg"
          >
            <RotateCcw className="size-3.5" /> Next line
          </button>
        )}
      </form>
    </div>
  );
}

function MultipleChoice({ words }: { words: SavedWord[] }) {
  const [round, setRound] = useState(0);
  const question = useMemo(() => {
    const pool = shuffle(words);
    const answer = pool[0]!;
    const distractors = pool.slice(1, 4);
    return { answer, options: shuffle([answer, ...distractors]) };
  }, [words, round]);
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (picked) return;
    setPicked(id);
    const ok = id === question.answer.id;
    notify(ok ? "Correct!" : `That's "${words.find((w) => w.id === id)?.word}"`, ok ? "success" : "error");
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Which word means…</p>
      <p className="mt-3 text-[15px] leading-relaxed text-fg/90">{question.answer.definition}</p>
      <div className="mt-4 space-y-2">
        {question.options.map((o) => {
          const isAnswer = o.id === question.answer.id;
          const revealed = picked !== null;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => choose(o.id)}
              className={cn(
                "w-full rounded-[9px] border px-3 py-2.5 text-left text-[14px] font-medium transition-colors",
                !revealed && "border-line bg-raised text-fg hover:border-accent/50",
                revealed && isAnswer && "border-pos-verb/50 bg-pos-verb/12 text-pos-verb",
                revealed && !isAnswer && picked === o.id && "border-pos-noun/50 bg-pos-noun/12 text-pos-noun",
                revealed && !isAnswer && picked !== o.id && "border-line bg-raised text-muted",
              )}
            >
              {o.word}
            </button>
          );
        })}
      </div>
      {picked ? (
        <button
          type="button"
          onClick={() => {
            setPicked(null);
            setRound((r) => r + 1);
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[9px] bg-accent py-2.5 text-[13px] font-semibold text-accent-foreground"
        >
          <RotateCcw className="size-3.5" /> Next question
        </button>
      ) : null}
    </div>
  );
}

function Matching({ words }: { words: SavedWord[] }) {
  const [round, setRound] = useState(0);
  const set = useMemo(() => shuffle(words).slice(0, 4), [words, round]);
  const defs = useMemo(() => shuffle(set), [set]);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);

  const pickDef = (id: string) => {
    if (!activeWord) return;
    if (activeWord === id) {
      setMatched((m) => [...m, id]);
      notify("Matched!");
    } else {
      notify("Not a match — try again", "error");
    }
    setActiveWord(null);
  };

  const done = matched.length === set.length;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        Match word to meaning
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="space-y-2">
          {set.map((w) => (
            <button
              key={w.id}
              type="button"
              disabled={matched.includes(w.id)}
              onClick={() => setActiveWord(w.id)}
              className={cn(
                "w-full rounded-[9px] border px-2.5 py-2 text-left text-[13px] font-semibold transition-colors",
                matched.includes(w.id)
                  ? "border-pos-verb/40 bg-pos-verb/10 text-pos-verb"
                  : activeWord === w.id
                    ? "border-accent/60 bg-accent/12 text-accent"
                    : "border-line bg-raised text-fg",
              )}
            >
              {w.word}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {defs.map((w) => (
            <button
              key={w.id}
              type="button"
              disabled={matched.includes(w.id)}
              onClick={() => pickDef(w.id)}
              className={cn(
                "w-full rounded-[9px] border px-2.5 py-2 text-left text-[11.5px] leading-snug transition-colors",
                matched.includes(w.id)
                  ? "border-pos-verb/40 bg-pos-verb/10 text-pos-verb"
                  : "border-line bg-raised text-muted hover:border-accent/40",
              )}
            >
              {w.definition}
            </button>
          ))}
        </div>
      </div>
      {done ? (
        <button
          type="button"
          onClick={() => {
            setMatched([]);
            setRound((r) => r + 1);
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[9px] bg-accent py-2.5 text-[13px] font-semibold text-accent-foreground"
        >
          <RotateCcw className="size-3.5" /> New set
        </button>
      ) : null}
    </div>
  );
}
