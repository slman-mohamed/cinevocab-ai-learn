import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, BookmarkCheck, FolderInput, Loader2, MoreVertical, SendHorizonal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PillBadges } from "./PillBadges";
import { askAboutWord } from "@/lib/vocab.functions";
import { notify } from "@/lib/notify";
import type { ExtractedWord, QAEntry, SavedWord } from "@/lib/types";
import { cn } from "@/lib/utils";


interface Props {
  word: ExtractedWord | SavedWord;
  index?: number;
  saved?: boolean;
  meta?: string;
  sourceSentence?: string;
  /** DOM id used to scroll a specific card into view */
  cardId?: string;
  /** briefly highlights the card, e.g. after arriving from search */
  flash?: boolean;
  onSave?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  /** persists the question/answer thread so it survives saving and appears in the Word Bank */
  onQaChange?: (qa: QAEntry[]) => void;
}


export function WordCard({
  word,
  index = 0,
  saved,
  meta,
  sourceSentence,
  cardId,
  flash,

  onSave,
  onMove,
  onDelete,
  onQaChange,
}: Props) {
  const ask = useServerFn(askAboutWord);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const qa = word.qa ?? [];

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    try {
      const res = await ask({
        data: {
          word: word.word,
          definition: word.definition,
          sentence: sourceSentence ?? (word as SavedWord).sourceSentence,
          question: q,
        },
      });
      onQaChange?.([...qa, { question: q, answer: res.answer }]);
      setQuestion("");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not answer that question", "error");
    } finally {
      setAsking(false);
    }
  };


  return (
    <article
      id={cardId}
      className={cn(
        "rounded-xl border border-line bg-surface p-4",
        flash ? "flash-card" : "slip",
      )}
      style={flash ? undefined : { animationDelay: `${index * 90}ms` }}
    >

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[22px] font-semibold leading-tight text-fg">{word.word}</p>
          {meta ? (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{meta}</p>
          ) : null}
        </div>
        {onSave ? (
          <button
            type="button"
            onClick={onSave}
            aria-label={saved ? "Remove from Word Bank" : "Save word"}
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-[9px] border transition-all active:scale-90",
              saved
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-line bg-raised text-muted hover:border-accent/50 hover:text-accent",
            )}
          >
            {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          </button>
        ) : null}
        {onMove ? (
          <button
            type="button"
            onClick={onMove}
            aria-label="Move word to another movie"
            className="grid size-9 shrink-0 place-items-center rounded-[9px] border border-line bg-raised text-muted transition-colors hover:border-accent/50 hover:text-accent"
          >
            <FolderInput className="size-4" />
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete word"
            className="grid size-9 shrink-0 place-items-center rounded-[9px] border border-line bg-raised text-muted transition-colors hover:border-destructive/50 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>

      <PillBadges ipa={word.ipa} partOfSpeech={word.partOfSpeech} frequency={word.frequency} />

      <p className="mt-3 text-[14px] leading-relaxed text-fg/85">{word.definition}</p>

      <div className="mt-3.5 space-y-2 border-t border-line pt-3">
        {word.examples.map((ex, i) => (
          <p key={i} className="text-[13px] leading-relaxed text-muted">
            &ldquo;{ex}&rdquo;
          </p>
        ))}
      </div>

      {onQaChange ? (
        <div className="mt-3.5 border-t border-line pt-3">
          {qa.length > 0 ? (
            <div className="mb-2.5 space-y-2.5">
              {qa.map((entry, i) => (
                <div key={i} className="rounded-[10px] border border-line bg-raised p-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    {entry.question}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-fg/90">{entry.answer}</p>
                </div>
              ))}
            </div>
          ) : null}
          <form onSubmit={submitQuestion} className="flex items-center gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask about "${word.word}"…`}
              className="min-w-0 flex-1 rounded-[9px] border border-line bg-raised px-2.5 py-2 text-[13px] text-fg outline-none placeholder:text-muted focus:border-accent/50"
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              aria-label="Ask about this word"
              className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-accent text-accent-foreground disabled:opacity-40"
            >
              {asking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <SendHorizonal className="size-4" />
              )}
            </button>
          </form>
        </div>
      ) : null}
    </article>

  );
}
