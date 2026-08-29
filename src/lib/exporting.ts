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

/** Opens a print-ready document (Save as PDF) with correct IPA glyph rendering. */
export function exportPdf(movies: Movie[], words: SavedWord[], docTitle: string) {
  const groups = movies
    .map((m) => ({ movie: m, items: words.filter((w) => w.movieId === m.id) }))
    .filter((g) => g.items.length > 0);

  const body = groups
    .map(
      (g) => `
      <section class="movie">
        <h1>${escapeHtml(g.movie.title)}${g.movie.year ? ` <span class="year">(${escapeHtml(g.movie.year)})</span>` : ""}</h1>
        <p class="count">${g.items.length} words</p>
        ${g.items
          .map(
            (w) => `
          <article>
            <h2>${escapeHtml(w.word)}</h2>
            <p class="meta"><span class="pill ipa">${escapeHtml(w.ipa)}</span><span class="pill pos">${escapeHtml(w.partOfSpeech)}</span><span class="pill freq">${escapeHtml(w.frequency)}</span></p>
            <p class="def">${escapeHtml(w.definition)}</p>
            <ul>${w.examples.map((ex) => `<li>${escapeHtml(ex)}</li>`).join("")}</ul>
          </article>`,
          )
          .join("")}
      </section>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(docTitle)}</title>
<style>
  @page { margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif; color: #16181c; margin: 0; }
  section.movie { page-break-after: always; }
  section.movie:last-child { page-break-after: auto; }
  h1 { font-size: 20pt; margin: 0 0 2pt; letter-spacing: -0.01em; }
  h1 .year { font-size: 12pt; font-weight: 400; color: #6b7280; }
  p.count { margin: 0 0 10pt; font-size: 8.5pt; letter-spacing: 0.16em; text-transform: uppercase; color: #6b7280; }
  article { border-top: 0.6pt solid #d7dae0; padding: 6pt 0 5pt; page-break-inside: avoid; }
  h2 { font-size: 13pt; margin: 0 0 3pt; }
  p.meta { margin: 0 0 4pt; white-space: nowrap; }
  .pill { display: inline-block; border-radius: 999px; padding: 1.5pt 6pt; font-size: 8.5pt; margin-right: 4pt; white-space: nowrap; }
  .ipa { font-family: "Charis SIL", "Doulos SIL", "Gentium Plus", "Segoe UI", "DejaVu Sans", "Arial Unicode MS", sans-serif; background: #fdf1da; color: #8a5a06; }
  .pos { background: #e7f1fb; color: #1f5f96; }
  .freq { background: #eaf6ee; color: #1f6b3f; }
  p.def { margin: 0 0 3pt; font-size: 10pt; line-height: 1.35; }
  ul { margin: 0; padding-left: 12pt; }
  li { font-size: 9.5pt; line-height: 1.3; color: #4b5158; margin: 0; }
</style></head><body>${body || "<p>No words saved yet.</p>"}</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
  return true;
}
