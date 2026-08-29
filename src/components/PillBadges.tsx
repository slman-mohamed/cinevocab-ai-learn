import { cn } from "@/lib/utils";
import type { FrequencyLevel } from "@/lib/types";

function posToken(pos: string) {
  const p = pos.toLowerCase();
  if (p.startsWith("noun") || p.includes("pronoun")) return "noun";
  if (p.startsWith("verb") || p.includes("phrasal")) return "verb";
  if (p.startsWith("adj")) return "adj";
  if (p.startsWith("adv")) return "adv";
  return "other";
}

const posStyles: Record<string, string> = {
  noun: "bg-pos-noun/15 text-pos-noun",
  verb: "bg-pos-verb/15 text-pos-verb",
  adj: "bg-pos-adj/15 text-pos-adj",
  adv: "bg-pos-adv/15 text-pos-adv",
  other: "bg-pos-other/15 text-pos-other",
};

const freqMeta: Record<FrequencyLevel, { level: number; style: string }> = {
  "Very Common": { level: 4, style: "bg-freq-1/15 text-freq-1" },
  Common: { level: 3, style: "bg-freq-2/15 text-freq-2" },
  Uncommon: { level: 2, style: "bg-freq-3/15 text-freq-3" },
  Rare: { level: 1, style: "bg-freq-4/15 text-freq-4" },
};

interface Props {
  ipa: string;
  partOfSpeech: string;
  frequency: FrequencyLevel;
  size?: "sm" | "md";
}

export function PillBadges({ ipa, partOfSpeech, frequency, size = "md" }: Props) {
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  const meta = freqMeta[frequency] ?? freqMeta.Common;

  return (
    <div className="mt-2.5 flex flex-nowrap items-center gap-1.5 overflow-x-auto whitespace-nowrap">
      <span
        className={cn(
          "settle shrink-0 rounded-full bg-accent/12 font-mono font-medium text-accent",
          pad,
        )}
        style={{ animationDelay: "60ms" }}
      >
        {ipa}
      </span>
      <span
        className={cn(
          "settle shrink-0 rounded-full font-mono font-medium lowercase",
          posStyles[posToken(partOfSpeech)],
          pad,
        )}
        style={{ animationDelay: "120ms" }}
      >
        {partOfSpeech}
      </span>
      <span
        className={cn("settle shrink-0 rounded-full font-mono font-medium", meta.style, pad)}
        style={{ animationDelay: "180ms" }}
      >
        <span className="mr-1 tracking-[0.1em]">
          {"|".repeat(meta.level)}
          <span className="opacity-30">{"|".repeat(4 - meta.level)}</span>
        </span>
        {frequency}
      </span>
    </div>
  );
}
