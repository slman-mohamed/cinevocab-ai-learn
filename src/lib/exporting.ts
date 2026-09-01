import type { Movie, SavedWord } from "./types";

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function downloadCsv(movies: Movie[], words: SavedWord[], filename: string) {
  const header = ["Movie", "Word", "IPA", "Part of Speech", "Frequency", "Definition", "Example 1", "Example 2", "Example 3"];
  const rows = words.map((w) => {
    const movie = movies.find((m) => m.id === w.movieId);
    return [
      movie?.title ?? "Unknown",
      w.word,
      w.ipa,
      w.partOfSpeech,
      w.frequency,
      w.definition,
      w.examples[0] ?? "",
      w.examples[1] ?? "",
      w.examples[2] ?? "",
    ].map(escapeCsv).join(",");
  });
  const csv = "\uFEFF" + [header.map(escapeCsv).join(","), ...rows].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const FREQ_LEVEL: Record<string, number> = {
  "Very Common": 4,
  Common: 3,
  Uncommon: 2,
  Rare: 1,
};

function posToken(pos: string) {
  const p = pos.toLowerCase();
  if (p.startsWith("noun") || p.includes("pronoun")) return "noun";
  if (p.startsWith("verb") || p.includes("phrasal")) return "verb";
  if (p.startsWith("adj")) return "adj";
  if (p.startsWith("adv")) return "adv";
  return "other";
}

function freqToken(freq: string) {
  if (freq === "Very Common") return "f1";
  if (freq === "Common") return "f2";
  if (freq === "Uncommon") return "f3";
  return "f4";
}

function bars(level: number) {
  return `<span class="bars">${"|".repeat(level)}<span class="dim">${"|".repeat(4 - level)}</span></span>`;
}

/** Opens a print-ready document (Save as PDF) styled like the in-app word cards. */
export function exportPdf(movies: Movie[], words: SavedWord[], docTitle: string) {
  const groups = movies
    .map((m) => ({ movie: m, items: words.filter((w) => w.movieId === m.id) }))
    .filter((g) => g.items.length > 0);

  const body = groups
    .map(
      (g) => `
      <section class="movie">
        <header class="mhead">
          <span class="poster">${escapeHtml(g.movie.title.charAt(0).toUpperCase())}</span>
          <span>
            <h1>${escapeHtml(g.movie.title)}${g.movie.year ? ` <span class="year">(${escapeHtml(g.movie.year)})</span>` : ""}</h1>
            <p class="count">${g.items.length} words</p>
          </span>
        </header>
        <div class="cards">
        ${g.items
          .map(
            (w) => `
          <article class="card">
            <h2>${escapeHtml(w.word)}</h2>
            <p class="meta"><span class="pill ipa">${escapeHtml(w.ipa)}</span><span class="pill pos ${posToken(w.partOfSpeech)}">${escapeHtml(w.partOfSpeech.toLowerCase())}</span><span class="pill freq ${freqToken(w.frequency)}">${bars(FREQ_LEVEL[w.frequency] ?? 3)}${escapeHtml(w.frequency)}</span></p>
            <p class="def">${escapeHtml(w.definition)}</p>
            <ul>${w.examples.map((ex) => `<li>&ldquo;${escapeHtml(ex)}&rdquo;</li>`).join("")}</ul>
          </article>`,
          )
          .join("")}
        </div>
      </section>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(docTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
  @page { margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { background: #0a0b0e; }
  body {
    font-family: "Space Grotesk", "Helvetica Neue", Arial, sans-serif;
    color: #ece7db; margin: 0; padding: 0;
  }
  section.movie { page-break-after: always; padding: 2mm 0; }
  section.movie:last-child { page-break-after: auto; }
  .mhead { display: flex; align-items: center; gap: 8pt; margin: 0 0 8pt; }
  .poster {
    width: 22pt; height: 22pt; border-radius: 4pt; background: #2a2c33; color: #e8b45a;
    font-family: "JetBrains Mono", monospace; font-size: 11pt; font-weight: 600;
    display: inline-flex; align-items: center; justify-content: center;
  }
  h1 { font-size: 17pt; margin: 0; letter-spacing: -0.01em; color: #ece7db; }
  h1 .year { font-size: 10pt; font-weight: 400; color: #9a9aa4; }
  p.count {
    margin: 1pt 0 0; font-family: "JetBrains Mono", monospace; font-size: 7pt;
    letter-spacing: 0.18em; text-transform: uppercase; color: #9a9aa4;
  }
  .cards { display: flex; flex-direction: column; gap: 5pt; }
  .card {
    border: 0.6pt solid #3a3d45; border-radius: 9pt; background: #1b1d22;
    padding: 7pt 9pt; page-break-inside: avoid;
  }
  h2 { font-size: 13.5pt; font-weight: 600; margin: 0; color: #ece7db; letter-spacing: -0.01em; }
  p.meta { margin: 4pt 0 5pt; white-space: nowrap; }
  .pill {
    display: inline-block; border-radius: 999pt; padding: 1.5pt 6pt; margin-right: 3.5pt;
    font-family: "JetBrains Mono", monospace; font-size: 7.5pt; font-weight: 500; white-space: nowrap;
  }
  .bars { letter-spacing: 0.1em; margin-right: 3pt; }
  .bars .dim { opacity: 0.3; }
  .ipa { background: rgba(232,180,90,0.14); color: #e8b45a;
    font-family: "JetBrains Mono", "Charis SIL", "Doulos SIL", "DejaVu Sans", monospace; }
  .pos.noun { background: rgba(233,124,96,0.16); color: #e97c60; }
  .pos.verb { background: rgba(122,214,160,0.16); color: #7ad6a0; }
  .pos.adj  { background: rgba(122,166,229,0.16); color: #7aa6e5; }
  .pos.adv  { background: rgba(190,133,236,0.16); color: #be85ec; }
  .pos.other{ background: rgba(233,158,193,0.16); color: #e99ec1; }
  .freq.f1 { background: rgba(122,214,160,0.16); color: #7ad6a0; }
  .freq.f2 { background: rgba(232,180,90,0.16); color: #e8b45a; }
  .freq.f3 { background: rgba(122,166,229,0.16); color: #7aa6e5; }
  .freq.f4 { background: rgba(190,133,236,0.16); color: #be85ec; }
  p.def { margin: 0 0 5pt; font-size: 9.5pt; line-height: 1.4; color: rgba(236,231,219,0.87); }
  ul { margin: 0; padding: 5pt 0 0; list-style: none; border-top: 0.6pt solid #3a3d45; }
  li { font-size: 8.8pt; line-height: 1.35; color: #9a9aa4; margin: 0 0 2pt; }
  li:last-child { margin-bottom: 0; }
</style></head><body>${body || "<p>No words saved yet.</p>"}</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 800);
  return true;
}

