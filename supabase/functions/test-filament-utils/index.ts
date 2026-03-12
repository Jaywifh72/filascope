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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  const hex = guessColorHex("red");
  return new Response(JSON.stringify({ hex, keywords: FILAMENT_KEYWORDS.length }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
