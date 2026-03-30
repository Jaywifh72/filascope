import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { normalizeTempRange } from '../_shared/normalization-engine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TempResult {
  nozzle?: { min: number; max: number };
  bed?: { min: number; max: number };
  drying?: { temp: number; hours?: number };
}

/**
 * Parse temperature specs from raw HTML text.
 * Handles formats like:
 *   Nozzle: 190-220°C  |  Printing Temp: 200°C  |  Hotend: 200~230°C
 *   Bed temp: 25-60°C  |  Drying: 55°C for 4h
 */
function parseTempsFromHtml(html: string): TempResult {
  // Strip tags for easier matching
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const result: TempResult = {};

  // ── Nozzle ─────────────────────────────────────────────────────────────────
  const nozzlePatterns = [
    /(?:nozzle|printing|extrusion|hotend|extruder|print)\s*(?:temp(?:erature)?)?[:\s]+(\d{3})\s*[~\-–]\s*(\d{3})\s*°?\s*[Cc]/i,
    /(?:nozzle|printing|extrusion|hotend|extruder|print)\s*(?:temp(?:erature)?)?[:\s]+(\d{3})\s*°?\s*[Cc]/i,
  ];
  for (const pat of nozzlePatterns) {
    const m = text.match(pat);
    if (m) {
      const min = parseInt(m[1]);
      const max = m[2] ? parseInt(m[2]) : min;
      if (min >= 150 && min <= 500 && max >= min) {
        result.nozzle = { min, max };
        break;
      }
    }
  }

  // ── Bed ────────────────────────────────────────────────────────────────────
  const bedPatterns = [
    /(?:bed|build\s*plate|platform|heated\s*bed)\s*(?:temp(?:erature)?)?[:\s]+(\d{2,3})\s*[~\-–]\s*(\d{2,3})\s*°?\s*[Cc]/i,
    /(?:bed|build\s*plate|platform|heated\s*bed)\s*(?:temp(?:erature)?)?[:\s]+(\d{2,3})\s*°?\s*[Cc]/i,
  ];
  for (const pat of bedPatterns) {
    const m = text.match(pat);
    if (m) {
      const min = parseInt(m[1]);
      const max = m[2] ? parseInt(m[2]) : min;
      if (min >= 0 && min <= 200 && max >= min) {
        result.bed = { min, max };
        break;
      }
    }
  }

  // ── Drying ─────────────────────────────────────────────────────────────────
  const dryMatch = text.match(
    /dry(?:ing)?\s*(?:at|temp(?:erature)?)?[:\s]+(\d{2,3})\s*°?\s*[Cc]\s*(?:for\s*(\d+)\s*(?:h(?:ours?)?|hrs?))?/i,
  );
  if (dryMatch) {
    const temp = parseInt(dryMatch[1]);
    if (temp >= 40 && temp <= 150) {
      result.drying = { temp, hours: dryMatch[2] ? parseInt(dryMatch[2]) : undefined };
    }
  }

  return result;
}

/**
 * Look for TDS/datasheet PDF links in HTML.
 */
function findTdsLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const anchorPattern = /<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = anchorPattern.exec(html)) !== null) {
    const href = m[1];
    const text = m[2];
    const isRelevant =
      /tds|technical|datasheet|specification|data.sheet/i.test(href) ||
      /tds|technical|datasheet|specification/i.test(text);
    if (isRelevant && href.endsWith('.pdf')) {
      try {
        links.push(new URL(href, baseUrl).toString());
      } catch {
        if (href.startsWith('http')) links.push(href);
      }
    }
  }
  return [...new Set(links)];
}

const RATE_LIMIT_MS = 500;
let lastReqAt = 0;

async function rateLimitedFetch(url: string): Promise<string | null> {
  const wait = RATE_LIMIT_MS - (Date.now() - lastReqAt);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastReqAt = Date.now();

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FilaScope-bot/1.0)' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    let body: { limit?: number } = {};
    try { body = await req.json(); } catch { /* no body */ }
    const limit = Math.min(body.limit ?? 50, 200);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch filaments still missing temps AND with a product_url
    const { data: filaments, error } = await supabase
      .from('filaments')
      .select('id, product_url, material')
      .is('nozzle_temp_min_c', null)
      .not('product_url', 'is', null)
      .limit(limit);

    if (error) throw error;
    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, extracted: 0, tdsFound: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let extracted = 0;
    let tdsFound = 0;

    for (const f of filaments) {
      const html = await rateLimitedFetch(f.product_url);
      if (!html) continue;

      const temps = parseTempsFromHtml(html);
      const tdsLinks = findTdsLinks(html, f.product_url);

      const patch: Record<string, unknown> = { id: f.id };
      let hasData = false;

      if (temps.nozzle) {
        patch.nozzle_temp_min_c = temps.nozzle.min;
        patch.nozzle_temp_max_c = temps.nozzle.max;
        hasData = true;
      }
      if (temps.bed) {
        patch.bed_temp_min_c = temps.bed.min;
        patch.bed_temp_max_c = temps.bed.max;
        hasData = true;
      }
      if (temps.drying) {
        patch.drying_temp_c = temps.drying.temp;
        if (temps.drying.hours) patch.drying_time_hours = temps.drying.hours;
        hasData = true;
      }
      if (tdsLinks.length > 0) {
        patch.data_source_urls = tdsLinks;
        tdsFound++;
      }

      if (hasData || tdsLinks.length > 0) {
        // Medium confidence — scraped from product HTML
        if (hasData) {
          patch.admin_notes = '[temp:scraped:medium]';
          extracted++;
        }
        await supabase.from('filaments').upsert([patch] as any[], { onConflict: 'id' });
      }
    }

    console.log(`[extract-product-specs] processed=${filaments.length} extracted=${extracted} tdsFound=${tdsFound}`);

    return new Response(
      JSON.stringify({ success: true, processed: filaments.length, extracted, tdsFound }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[extract-product-specs] error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
