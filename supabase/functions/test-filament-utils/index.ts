// Minimal test: sync-brand-catalog with just the helpers, no main handler
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ScrapingConfig,
  ExtractedFilament,
  guessColorHex,
  guessColorFamily,
  guessFinishType,
  stripMaterialPrefix,
  parseSpecsFromHtml,
  extractWeightFromText,
  detectOptionPositions,
  FILAMENT_KEYWORDS,
  NON_FILAMENT_KEYWORDS,
} from "../_shared/filament-utils.ts";

const CHROME_UA = "Mozilla/5.0 (compatible; FilaScope/1.0)";

function titleCase(str: string): string {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
