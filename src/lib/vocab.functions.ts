import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  sentence: z.string().min(3).max(2000),
  movieTitle: z.string().max(200).optional(),
});

const WordSchema = z.object({
  word: z.string(),
  ipa: z.string(),
  partOfSpeech: z.string(),
  frequency: z.enum(["Very Common", "Common", "Uncommon", "Rare"]),
  definition: z.string(),
  examples: z.array(z.string()),
});

const ResultSchema = z.object({
  explanation: z.string().nullish(),
  words: z.array(WordSchema),
});

function stripFence(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/, "")
      .trim();
  }
  return trimmed;
}

export const extractWords = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("AI is not configured for this app yet.");
    }

    const prompt = `You are a vocabulary coach for advanced English learners watching movies.
Input${data.movieTitle ? ` from the movie "${data.movieTitle}"` : ""}:
"""${data.sentence}"""

STEP 1 — "explanation":
- If the input is a full sentence (a clause with a subject and a verb, or clearly a line of dialogue), explain what the WHOLE sentence means, paraphrased in very simple everyday English (max 40 words). Mention the tone/implication if it is figurative or sarcastic.
- If the input is only a single word or a short phrase (not a full sentence), set "explanation" to null.

STEP 2 — "words":
Pick the words or phrasal verbs a B2/C1 learner would find difficult (usually 1-5, never easy words like "the", "watch", "go").
PARENTHESES RULE: any text the user wrapped in parentheses ( ) MUST get its own entry, even if it is easy or very common. Use the text inside the parentheses as the "word" (lemma form), and never include the parentheses characters themselves in any field. Put these entries first.
For each entry, return JSON with keys:
- word: the base/lemma form as used
- ipa: British-style IPA phonetic transcription wrapped in slashes, correct IPA unicode symbols
- partOfSpeech: one of noun, verb, adjective, adverb, phrasal verb, idiom, preposition, pronoun, conjunction
- frequency: exactly one of "Very Common", "Common", "Uncommon", "Rare" describing real-world usage frequency
- definition: one clear English definition (max 25 words)
- examples: exactly 3 examples that sound like real spoken English a native speaker would actually say — casual, contemporary, concrete situations; no textbook, formal or stilted phrasing, no "One must...", and each under 15 words

Respond with ONLY JSON: {"explanation": string|null, "words":[...]}.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      let message = "Word extraction failed. Please try again.";
      try {
        const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
        message = parsed.error?.message ?? parsed.message ?? message;
      } catch {
        /* keep default */
      }
      if (res.status === 429) message = "Too many requests right now — wait a moment and try again.";
      throw new Error(message);
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(stripFence(content));
    } catch {
      throw new Error("The AI response could not be read. Try rephrasing the sentence.");
    }

    const result = ResultSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error("The AI response was incomplete. Try again.");
    }

    return {
      explanation: result.data.explanation?.trim() || null,
      words: result.data.words.map((w) => ({
        ...w,
        examples: w.examples.slice(0, 3),
      })),
    };
  });
