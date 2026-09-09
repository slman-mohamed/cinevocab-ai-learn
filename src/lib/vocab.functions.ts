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

    const prompt = `Vocabulary coach for advanced English learners watching movies.
Input${data.movieTitle ? ` from "${data.movieTitle}"` : ""}:
"""${data.sentence}"""

"explanation": if the input is a full sentence or line of dialogue, paraphrase the WHOLE sentence in very simple everyday English (max 40 words), noting tone if figurative or sarcastic. If it is just a word or short phrase, use null.

"words":
- PARENTHESES RULE: if any text is wrapped in ( ), return ONLY entries for the text inside the parentheses — even if easy or very common — and nothing else. Never include the parentheses characters in any field.
- Otherwise: at most 3 entries, the hardest words or phrasal verbs for a B2/C1 learner. Skip easy words.
Each entry:
- word: base/lemma form
- ipa: British IPA in slashes, correct IPA unicode
- partOfSpeech: noun|verb|adjective|adverb|phrasal verb|idiom|preposition|pronoun|conjunction
- frequency: "Very Common"|"Common"|"Uncommon"|"Rare"
- definition: one clear English definition, max 25 words
- examples: exactly 3 lines a native speaker would really say — casual, contemporary, concrete, each under 15 words; no textbook or formal phrasing

Respond with ONLY JSON: {"explanation": string|null, "words":[...]}.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
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

const AskSchema = z.object({
  word: z.string().min(1).max(120),
  definition: z.string().max(500).optional(),
  sentence: z.string().max(2000).optional(),
  question: z.string().min(2).max(500),
});

export const askAboutWord = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AskSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("AI is not configured for this app yet.");
    }

    const prompt = `You are a friendly English tutor helping an intermediate/advanced learner.
The learner is studying the word or phrase: "${data.word}".${
      data.definition ? `\nIts definition: ${data.definition}` : ""
    }${data.sentence ? `\nIt appeared in this line: """${data.sentence}"""` : ""}

Their question: """${data.question}"""

Answer only about this word/phrase, in clear simple English, max 70 words. Use short concrete examples if helpful. Plain text only, no markdown, no headings.`;

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
      let message = "Could not answer that question. Please try again.";
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
    const answer = (payload.choices?.[0]?.message?.content ?? "").trim();
    if (!answer) throw new Error("The AI did not return an answer. Try rephrasing.");
    return { answer };
  });

