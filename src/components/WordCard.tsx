import { Bookmark, BookmarkCheck, FolderInput, Trash2 } from "lucide-react";
import { PillBadges } from "./PillBadges";
import type { ExtractedWord, SavedWord } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  word: ExtractedWord | SavedWord;
  index?: number;
  saved?: boolean;
  meta?: string;
  onSave?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
}

export function WordCard({ word, index = 0, saved, meta, onSave, onMove, onDelete }: Props) {
  return (
    <article
      className="slip rounded-xl border border-line bg-surface p-4"
      style={{ animationDelay: `${index * 90}ms` }}
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
            disabled={saved}
            aria-label={saved ? "Already saved" : "Save word"}
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
    </article>
  );
}
