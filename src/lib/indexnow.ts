import { supabase } from "@/integrations/supabase/client";

/**
 * Ping IndexNow with one or more URLs so Bing/Yandex re-crawl them immediately.
 * Silently swallows errors — IndexNow is best-effort and must never break UI flows.
 */
export async function pingIndexNow(urls: string | string[]): Promise<void> {
  const urlList = Array.isArray(urls) ? urls : [urls];
  if (urlList.length === 0) return;

  try {
    const { error } = await supabase.functions.invoke("indexnow", {
      body: { urls: urlList, batch_type: "manual" },
    });
    if (error) {
      console.warn("[IndexNow] ping failed silently:", error.message);
    }
  } catch {
    // Intentionally silent
  }
}

// ── URL builders ────────────────────────────────────────────────────────────

const BASE = "https://filascope.com";

export const indexNowUrl = {
  filament: (slug: string) => `${BASE}/filament/${slug}`,
  printer: (slug: string) => `${BASE}/printers/${slug}`,
  brand: (slug: string) => `${BASE}/brands/${slug}`,
  guide: (slug: string) => `${BASE}/guides/${slug}`,
  material: (slug: string) => `${BASE}/materials/${slug}`,
} as const;
