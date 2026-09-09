import type { ExtractedWord } from "./types";

const KEY = "cinevocab.extract.v1";
const MAX = 50;

export interface ExtractResult {
  explanation: string | null;
  words: ExtractedWord[];
}

interface Entry {
  k: string;
  v: ExtractResult;
}

function normalize(sentence: string, movieTitle?: string) {
  const text = sentence
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:…"'’]+$/g, "")
    .trim();
  return `${(movieTitle ?? "").toLowerCase().trim()}::${text}`;
}

function read(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Entry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: Entry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(-MAX)));
  } catch {
    /* storage unavailable */
  }
}

/** Look up a previously extracted sentence. Returns null on a miss. */
export function getCachedExtraction(sentence: string, movieTitle?: string): ExtractResult | null {
  const k = normalize(sentence, movieTitle);
  const entries = read();
  const hit = entries.find((e) => e.k === k);
  if (!hit) return null;
  // Refresh recency so frequently used lines survive trimming.
  write([...entries.filter((e) => e.k !== k), hit]);
  return hit.v;
}

export function setCachedExtraction(
  sentence: string,
  movieTitle: string | undefined,
  value: ExtractResult,
) {
  const k = normalize(sentence, movieTitle);
  const entries = read().filter((e) => e.k !== k);
  write([...entries, { k, v: value }]);
}
