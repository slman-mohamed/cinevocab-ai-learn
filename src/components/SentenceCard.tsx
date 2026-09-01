import { MessageSquareQuote } from "lucide-react";

interface Props {
  sentence: string;
  explanation: string;
}

export function SentenceCard({ sentence, explanation }: Props) {
  return (
    <article className="slip rounded-xl border border-accent/35 bg-accent/[0.06] p-4">
      <div className="flex items-center gap-2">
        <MessageSquareQuote className="size-3.5 text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">In simple words</p>
      </div>
      <p className="mt-2.5 text-[13px] italic leading-relaxed text-muted">&ldquo;{sentence}&rdquo;</p>
      <p className="mt-3 border-t border-accent/20 pt-3 text-[15px] leading-relaxed text-fg">{explanation}</p>
    </article>
  );
}
