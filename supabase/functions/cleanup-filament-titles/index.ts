import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract weight and pack data from title
function extractDataFromTitle(title: string): { 
  cleanedTitle: string; 
  extractedWeightG: number | null; 
  extractedPackQty: number | null 
} {
  let cleanedTitle = title;
  let extractedWeightG: number | null = null;
  let extractedPackQty: number | null = null;

  // Pattern 1: [MOQ: XKG] - Multi-pack minimum order
  const moqMatch = cleanedTitle.match(/\[MOQ:\s*(\d+(?:\.\d+)?)\s*KG\]/i);
  if (moqMatch) {
    extractedWeightG = Math.round(parseFloat(moqMatch[1]) * 1000);
    cleanedTitle = cleanedTitle.replace(/\[MOQ:\s*\d+(?:\.\d+)?\s*KG\]/gi, '');
  }

  // Pattern 2: XKG Large Spool / XKG Spool
  const largeSpool = cleanedTitle.match(/(\d+(?:\.\d+)?)\s*KG\s*(?:Large\s+)?Spool/i);
  if (largeSpool && !extractedWeightG) {
    extractedWeightG = Math.round(parseFloat(largeSpool[1]) * 1000);
  }

  // Pattern 3: Leading weight like "3KG PLA" or "5KG PETG"
  const leadingWeight = cleanedTitle.match(/^(\d+(?:\.\d+)?)\s*KG\s+/i);
  if (leadingWeight && !extractedWeightG) {
    extractedWeightG = Math.round(parseFloat(leadingWeight[1]) * 1000);
    cleanedTitle = cleanedTitle.replace(/^(\d+(?:\.\d+)?)\s*KG\s+/i, '');
  }

  // Pattern 4: Weight in brackets like (1KG) or (0.8KG)
  const bracketWeight = cleanedTitle.match(/\((\d+(?:\.\d+)?)\s*KG\)/i);
  if (bracketWeight && !extractedWeightG) {
    extractedWeightG = Math.round(parseFloat(bracketWeight[1]) * 1000);
  }

  // Pattern 5: Pack quantity like "6 Pack" or "4-Pack"
  const packMatch = cleanedTitle.match(/(\d+)\s*[-]?\s*Pack/i);
  if (packMatch) {
    extractedPackQty = parseInt(packMatch[1]);
  }

  return { cleanedTitle: cleanedTitle.trim(), extractedWeightG, extractedPackQty };
}

// Clean title with comprehensive rules
function intelligentTitleClean(title: string): string {
  let cleaned = title;

  // Remove bracket patterns
  cleaned = cleaned.replace(/\[MOQ:\s*\d+(?:\.\d+)?\s*KG\]/gi, '');
  cleaned = cleaned.replace(/\[Bigger Size[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\[Get \d+ for[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\[USA[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\[[^\]]*Deal[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\[[^\]]*Sale[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\[[^\]]*Free[^\]]*\]/gi, '');

  // Remove generic phrases
  cleaned = cleaned.replace(/3D\s+Printer\s+Filament/gi, '');
  cleaned = cleaned.replace(/3D\s+Printing\s+Filament/gi, '');
  cleaned = cleaned.replace(/3D\s+Filament/gi, '');
  cleaned = cleaned.replace(/Printer\s+Filament/gi, '');
  cleaned = cleaned.replace(/Filament\s+Collection/gi, '');
  cleaned = cleaned.replace(/FDM\s+Filament/gi, '');

  // Remove promotional text
  cleaned = cleaned.replace(/Buy\s+\d+[,\s]+Get\s+\d+\s+Free/gi, '');
  cleaned = cleaned.replace(/Flash\s+Sale/gi, '');
  cleaned = cleaned.replace(/Flash\s+Deal/gi, '');
  cleaned = cleaned.replace(/Prime\s+Deal/gi, '');
  cleaned = cleaned.replace(/Christmas\s+Bulk\s+Sale/gi, '');
  cleaned = cleaned.replace(/Bulk\s+Sale/gi, '');
  cleaned = cleaned.replace(/\d+-\d+kg\s+Deals?/gi, '');

  // Remove redundant descriptors
  cleaned = cleaned.replace(/Large\s+Spool/gi, '');
  cleaned = cleaned.replace(/\d+(?:\.\d+)?\s*KG\s+Spool/gi, '');
  cleaned = cleaned.replace(/\d+(?:\.\d+)?KG/gi, '');

  // Clean parenthetical expansions - keep the short form
  cleaned = cleaned.replace(/PLA\+\s*\(PLA\s*Plus\)/gi, 'PLA+');
  cleaned = cleaned.replace(/High\s+Speed\s+PLA\s*\(HS[_-]?PLA\)/gi, 'High Speed PLA');
  cleaned = cleaned.replace(/PA6-CF\s*\([^)]+\)/gi, 'PA6-CF');
  cleaned = cleaned.replace(/PP\s*\(Polypropylene\)/gi, 'PP');
  cleaned = cleaned.replace(/PC\s*\(Polycarbonate\)/gi, 'PC');
  cleaned = cleaned.replace(/TPU\s*\(Thermoplastic[^)]*\)/gi, 'TPU');

  // Remove weight mentions like "1KG" standalone
  cleaned = cleaned.replace(/\b\d+(?:\.\d+)?\s*KG\b/gi, '');
  cleaned = cleaned.replace(/\b\d+(?:\.\d+)?\s*G\b/gi, '');

  // Remove trailing "Filament" if it's redundant
  cleaned = cleaned.replace(/\s+Filament\s*$/i, '');

  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Remove trailing commas, dashes, or other punctuation
  cleaned = cleaned.replace(/[,\-–—]\s*$/, '').trim();

  return cleaned;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { limit = 100, offset = 0, dryRun = false } = await req.json().catch(() => ({}));

    // Fetch filaments
    const { data: filaments, error: fetchError } = await supabase
      .from("filaments")
      .select("id, product_title, net_weight_g, pack_quantity")
      .range(offset, offset + limit - 1);

    if (fetchError) throw fetchError;

    const updates: any[] = [];
    const changes: any[] = [];

    for (const filament of filaments || []) {
      const originalTitle = filament.product_title;
      const { cleanedTitle, extractedWeightG, extractedPackQty } = extractDataFromTitle(originalTitle);
      const finalTitle = intelligentTitleClean(cleanedTitle);

      const updateData: any = {};
      let hasChanges = false;

      // Only update if title actually changed
      if (finalTitle !== originalTitle && finalTitle.length > 0) {
        updateData.product_title = finalTitle;
        hasChanges = true;
      }

      // Update weight if extracted and current is null or 1000 (default)
      if (extractedWeightG && (!filament.net_weight_g || filament.net_weight_g === 1000)) {
        updateData.net_weight_g = extractedWeightG;
        hasChanges = true;
      }

      // Update pack quantity if extracted and current is null or 1
      if (extractedPackQty && (!filament.pack_quantity || filament.pack_quantity === 1)) {
        updateData.pack_quantity = extractedPackQty;
        hasChanges = true;
      }

      if (hasChanges) {
        changes.push({
          id: filament.id,
          original: originalTitle,
          cleaned: finalTitle,
          weightChange: extractedWeightG ? `${filament.net_weight_g || 'null'} → ${extractedWeightG}` : null,
          packChange: extractedPackQty ? `${filament.pack_quantity || 'null'} → ${extractedPackQty}` : null,
        });

        if (!dryRun) {
          updates.push(
            supabase.from("filaments").update(updateData).eq("id", filament.id)
          );
        }
      }
    }

    // Execute updates
    if (!dryRun && updates.length > 0) {
      await Promise.all(updates);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: filaments?.length || 0,
        changed: changes.length,
        dryRun,
        offset,
        changes: changes.slice(0, 20), // Show first 20 changes
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
