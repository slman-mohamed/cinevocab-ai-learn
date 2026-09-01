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
Sentence${data.movieTitle ? ` from the movie "${data.movieTitle}"` : ""}:
"""${data.sentence}"""

Pick the words or phrasal verbs a B2/C1 learner would find difficult (usually 1-5, never easy words like "the", "watch", "go").
For each, return JSON with keys:
- word: the base/lemma form as used
- ipa: British-style IPA phonetic transcription wrapped in slashes, correct IPA unicode symbols
- partOfSpeech: one of noun, verb, adjective, adverb, phrasal verb, idiom, preposition, pronoun, conjunction
- frequency: exactly one of "Very Common", "Common", "Uncommon", "Rare" describing real-world usage frequency
- definition: one clear English definition (max 25 words)
- examples: exactly 3 natural example sentences a native speaker would say, each using the word

Respond with ONLY JSON: {"words":[...]}. If no difficult words exist, return {"words":[]}.`;

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
      words: result.data.words.map((w) => ({
        ...w,
        examples: w.examples.slice(0, 3),
      })),
    };
  });
