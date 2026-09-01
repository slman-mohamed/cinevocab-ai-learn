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

const FREQ: Record<string, { level: number; cls: string }> = {
  "Very Common": { level: 4, cls: "f1" },
  Common: { level: 3, cls: "f2" },
  Uncommon: { level: 2, cls: "f3" },
  Rare: { level: 1, cls: "f4" },
};

function posClass(pos: string) {
  const p = pos.toLowerCase();
  if (p.startsWith("noun") || p.includes("pronoun")) return "p-noun";
  if (p.startsWith("verb") || p.includes("phrasal")) return "p-verb";
  if (p.startsWith("adj")) return "p-adj";
  if (p.startsWith("adv")) return "p-adv";
  return "p-other";
}

function freqPill(frequency: string) {
  const meta = FREQ[frequency] ?? FREQ.Common!;
  const bars =
    `<span class="bars">` +
    `<span class="on">${"|".repeat(meta.level)}</span>` +
    `<span class="off">${"|".repeat(4 - meta.level)}</span>` +
    `</span>`;
  return `<span class="pill ${meta.cls}">${bars}${escapeHtml(frequency)}</span>`;
}

/** Opens a print-ready card-grid document (Save as PDF) with correct IPA glyph rendering. */
export function exportPdf(movies: Movie[], words: SavedWord[], docTitle: string) {
  const groups = movies
    .map((m) => ({ movie: m, items: words.filter((w) => w.movieId === m.id) }))
    .filter((g) => g.items.length > 0);

  const body = groups
    .map(
      (g) => `
      <section class="movie">
        <header class="mhead">
          <h1>${escapeHtml(g.movie.title)}${g.movie.year ? ` <span class="year">(${escapeHtml(g.movie.year)})</span>` : ""}</h1>
          <p class="count">${g.items.length} words</p>
        </header>
        <div class="grid">
        ${g.items
          .map(
            (w) => `
          <article class="card">
            <h2>${escapeHtml(w.word)}</h2>
            <p class="meta"><span class="pill ipa">${escapeHtml(w.ipa)}</span><span class="pill ${posClass(w.partOfSpeech)}">${escapeHtml(w.partOfSpeech)}</span>${freqPill(w.frequency)}</p>
            <p class="def">${escapeHtml(w.definition)}</p>
            <ul>${w.examples.map((ex) => `<li>${escapeHtml(ex)}</li>`).join("")}</ul>
          </article>`,
          )
          .join("")}
        </div>
      </section>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(docTitle)}</title>
<style>
  @page { margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif; color: #16181c; margin: 0; }
  section.movie { break-after: page; page-break-after: always; }
  section.movie:last-child { break-after: auto; page-break-after: auto; }
  .mhead { border-bottom: 1pt solid #16181c; padding-bottom: 3pt; margin-bottom: 7pt;
    display: flex; align-items: baseline; justify-content: space-between; }
  h1 { font-size: 17pt; margin: 0; letter-spacing: -0.01em; }
  h1 .year { font-size: 11pt; font-weight: 400; color: #6b7280; }
  p.count { margin: 0; font-size: 8pt; letter-spacing: 0.16em; text-transform: uppercase; color: #6b7280; }
  .grid { column-count: 2; column-gap: 7pt; }
  @media print { .grid { column-count: 2; } }
  .card { break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid;
    border: 0.6pt solid #d7dae0; border-radius: 5pt; background: #fbfbfc;
    padding: 5pt 6pt 5.5pt; margin: 0 0 7pt; display: inline-block; width: 100%; }
  h2 { font-size: 12pt; margin: 0 0 2.5pt; letter-spacing: -0.01em; }
  p.meta { margin: 0 0 3.5pt; white-space: nowrap; overflow: hidden; }
  .pill { display: inline-block; border-radius: 999px; padding: 1pt 5pt; font-size: 7.5pt;
    margin-right: 3pt; white-space: nowrap; font-weight: 600; }
  .bars { letter-spacing: 0.06em; margin-right: 2.5pt; }
  .bars .off { opacity: 0.3; }
  .ipa { font-family: "Charis SIL", "Doulos SIL", "Gentium Plus", "Segoe UI", "DejaVu Sans", "Arial Unicode MS", sans-serif; background: #fdf1da; color: #8a5a06; font-weight: 500; }
  .p-noun { background: #fdeaea; color: #a52f2f; }
  .p-verb { background: #e8f5ec; color: #1f6b3f; }
  .p-adj { background: #e7f1fb; color: #1f5f96; }
  .p-adv { background: #f3ecfb; color: #6b3fa0; }
  .p-other { background: #eef0f3; color: #4b5158; }
  .f1 { background: #e8f5ec; color: #1f6b3f; }
  .f2 { background: #eaf3fb; color: #1f5f96; }
  .f3 { background: #fdf3e3; color: #8a5a06; }
  .f4 { background: #fdeaea; color: #a52f2f; }
  p.def { margin: 0 0 3pt; font-size: 9pt; line-height: 1.3; }
  ul { margin: 0; padding-left: 10pt; border-top: 0.5pt solid #e3e5ea; padding-top: 3pt; }
  li { font-size: 8.2pt; line-height: 1.28; color: #4b5158; margin: 0 0 1pt; }
</style></head><body>${body || "<p>No words saved yet.</p>"}</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
  return true;
}

