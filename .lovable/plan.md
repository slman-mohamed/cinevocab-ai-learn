# Cheaper, faster word extraction

Three changes to cut how much each sentence costs, without losing quality.

## 1. Fewer words per sentence
- Extract at most **3** difficult words instead of 5.
- **Parentheses override:** if the text contains anything in `( )`, explain **only** those words/phrases — nothing else is extracted, no matter how hard the rest is.
- Keep everything else as it is today: sentence-level simple-English explanation, IPA, word type, level, 3 natural examples, and the per-word question box.

## 2. Remember repeated sentences
- The result of every sentence is kept on the device, so sending the same line again shows the cards instantly and costs nothing.
- Matching ignores capital letters, extra spaces and trailing punctuation, and is scoped to the chosen movie (so the same line under a different movie is still fresh).
- The last 50 sentences are remembered; older ones drop off.
- Clearing the box with the X does not wipe the memory; it only clears what's on screen.

## 3. Cheaper model
- Switch from Gemini 3.7 Flash to **Gemini 3.1 Flash Lite** for both word extraction and the per-word questions — the low-cost model in the same family, built for exactly this kind of short extraction and explanation work.
- The prompt keeps all quality rules (natural spoken examples, correct IPA, simple explanations).
- Credit balance is unaffected by the switch; it just drains slower from here on.

## Technical notes
- `src/lib/vocab.functions.ts`: model id → `google/gemini-3.1-flash-lite` in `extractWords` and `askAboutWord`; prompt updated for the 3-word cap and the parentheses-exclusive rule; prompt text trimmed of redundancy to shrink input tokens.
- New `src/lib/extract-cache.ts`: localStorage cache (`cinevocab.extract.v1`), key = normalized sentence + movie title, value = `{ explanation, words }`, capped at 50 entries, LRU trim.
- `src/routes/index.tsx`: check the cache before calling the server function; write through on success. Q&A answers added later are not written back into the cache (they stay on the card and in the Word Bank as today).

## Verification
Send a sentence, confirm max 3 cards; send a line with `(word)` and confirm only that word appears; re-send the same line and confirm it returns instantly with no new AI request in the gateway log.
