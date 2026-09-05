/** Flexible word matching so a search for one form finds another (run/running, happy/happiness). */

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z\s]/g, " ").trim();
}

const suffixes = [
  "iness",
  "ness",
  "ingly",
  "fully",
  "ously",
  "ities",
  "ity",
  "ically",
  "ally",
  "ment",
  "ions",
  "ion",
  "ising",
  "izing",
  "ised",
  "ized",
  "ise",
  "ize",
  "ies",
  "ied",
  "iest",
  "ier",
  "est",
  "ing",
  "ers",
  "er",
  "ed",
  "ly",
  "al",
  "ous",
  "ive",
  "ful",
  "less",
  "able",
  "ible",
  "s",
];

/** crude stem: strip a common suffix and normalise a doubled/`e` ending */
export function stem(raw: string) {
  let w = normalize(raw).replace(/\s+/g, "");
  if (w.length < 4) return w;
  for (const suf of suffixes) {
    if (w.length - suf.length >= 3 && w.endsWith(suf)) {
      w = w.slice(0, w.length - suf.length);
      break;
    }
  }
  if (/([bdfglmnprt])\1$/.test(w)) w = w.slice(0, -1);
  if (w.endsWith("i")) w = `${w.slice(0, -1)}y`;
  return w;
}

/** true when the query plausibly refers to the same lexeme as the target word/phrase */
export function matchesWord(query: string, target: string) {
  const q = normalize(query);
  if (!q) return false;
  const t = normalize(target);
  if (t.includes(q)) return true;

  const qStems = q.split(/\s+/).map(stem).filter(Boolean);
  const tStems = t.split(/\s+/).map(stem).filter(Boolean);
  if (qStems.length === 0 || tStems.length === 0) return false;

  return qStems.every((qs) =>
    tStems.some((ts) => ts === qs || (qs.length >= 4 && (ts.startsWith(qs) || qs.startsWith(ts)))),
  );
}

/** short display label for a part of speech, used for filters and grouping */
export function posLabel(pos: string) {
  const p = pos.toLowerCase().trim();
  if (p.includes("phrasal")) return "phrasal verb";
  if (p.includes("phrase") || p.includes("idiom")) return "phrase";
  if (p.startsWith("noun")) return "noun";
  if (p.startsWith("verb")) return "verb";
  if (p.startsWith("adj")) return "adjective";
  if (p.startsWith("adv")) return "adverb";
  return p || "other";
}
