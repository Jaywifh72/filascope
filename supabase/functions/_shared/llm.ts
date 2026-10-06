// Shared LLM call for FilaScope edge functions — OpenAI only (Jay, 2026-10-06: no Anthropic outside Claude Code).
// Secret: OPENAI_API_KEY (Supabase function secret). Models are env-overridable without a code change:
//   OPENAI_MODEL        default gpt-6-sol   (analysis / writing; replaces Claude Sonnet)
//   OPENAI_MODEL_SMALL  default gpt-6-luna  (extraction / judging; cheap)
const BASE = Deno.env.get("OPENAI_BASE_URL") ?? "https://api.openai.com/v1";

export const MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-6-sol";
export const MODEL_SMALL = Deno.env.get("OPENAI_MODEL_SMALL") ?? "gpt-6-luna";

export function llmConfigured(): boolean {
  return !!Deno.env.get("OPENAI_API_KEY");
}

export async function chat(opts: { user: string; system?: string; maxTokens?: number; model?: string }): Promise<string> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model ?? MODEL,
      max_completion_tokens: opts.maxTokens ?? 2000,
      messages: [...(opts.system ? [{ role: "system", content: opts.system }] : []), { role: "user", content: opts.user }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
