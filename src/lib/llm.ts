// Opt-in LLM synthesis — called CLIENT-SIDE with a user-supplied key so it works
// even on a static host (GitHub Pages). The key lives only in the user's browser
// (localStorage) and is sent straight to the provider, never to our own server or repo.
// Free key: https://aistudio.google.com  ·  model gemini-2.5-flash (free tier).

export const GEMINI_MODEL = "gemini-2.5-flash";

const prompt = (situation: unknown) =>
  "You are Meridian's Risk Fusion synthesis agent for India's crude-procurement desk. " +
  "Given this situation JSON, write ONE decisive executive brief of at most 30 words — " +
  "state the disruption, the economic stakes, and the recommended reroute. " +
  "No preamble, no markdown, no quotes.\n\n" +
  JSON.stringify(situation);

/** Returns an LLM-written brief, or null on any failure / rate-limit (caller degrades to the deterministic brief). */
export async function geminiSynthesize(
  situation: unknown,
  apiKey: string,
  model = GEMINI_MODEL,
): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 12_000);
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt(situation) }] }],
          // thinkingBudget:0 — 2.5-flash otherwise spends the whole output budget on hidden
          // reasoning and returns empty text for a short brief.
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 120,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      },
    );
    clearTimeout(to);
    if (!r.ok) return null;
    const j = await r.json();
    const text: string =
      j?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join(" ")
        .trim() ?? "";
    return text || null;
  } catch {
    return null;
  }
}

/** Lightweight key validation — one tiny generateContent ping. */
export async function geminiValidate(apiKey: string): Promise<boolean> {
  const out = await geminiSynthesize({ ping: "ok" }, apiKey);
  return out !== null;
}
