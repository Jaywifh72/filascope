// This function should be called after any admin save of filament_properties,
// filament_trait_tags, or filament_use_cases data to keep embeddings in sync.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filament_id } = await req.json();

    if (!filament_id) {
      return new Response(
        JSON.stringify({ success: false, error: "filament_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // STEP 1 — Fetch all filament data
    const [filamentRes, propsRes, traitsRes, useCasesRes] = await Promise.all([
      supabase.from("filaments").select("product_title, vendor, material").eq("id", filament_id).single(),
      supabase.from("filament_properties").select("*").eq("filament_id", filament_id).single(),
      supabase.from("filament_trait_tags").select("*").eq("filament_id", filament_id),
      supabase.from("filament_use_cases").select("*").eq("filament_id", filament_id),
    ]);

    if (filamentRes.error || !filamentRes.data) {
      return new Response(
        JSON.stringify({ success: false, error: `Filament not found: ${filamentRes.error?.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filament = filamentRes.data;
    const props = propsRes.data;
    const traits = traitsRes.data || [];
    const useCases = useCasesRes.data || [];

    // STEP 2 — Build embedding text
    const parts: string[] = [];

    // Header line
    const brandName = filament.vendor || "Unknown Brand";
    const filamentName = filament.product_title || "Unknown Filament";
    const materialType = filament.material || "Unknown Material";
    parts.push(`${brandName} ${filamentName} is a ${materialType} filament.`);

    if (props) {
      const p = props as Record<string, unknown>;

      if (p.heat_resistance_c != null) parts.push(`Heat resistance: up to ${p.heat_resistance_c}°C.`);
      if (p.glass_transition_c != null) parts.push(`Glass transition temperature: ${p.glass_transition_c}°C.`);

      if (p.print_temp_min != null || p.print_temp_max != null) {
        parts.push(`Print temperature: ${p.print_temp_min ?? "?"}–${p.print_temp_max ?? "?"}°C.`);
      }
      if (p.bed_temp_min != null || p.bed_temp_max != null) {
        parts.push(`Bed temperature: ${p.bed_temp_min ?? "?"}–${p.bed_temp_max ?? "?"}°C.`);
      }

      if (p.warping_risk != null) parts.push(`Warping risk: ${p.warping_risk}.`);
      if (p.enclosure_required != null) parts.push(`Enclosure required: ${p.enclosure_required ? "yes" : "no"}.`);
      if (p.drying_required != null) parts.push(`Drying required: ${p.drying_required ? "yes" : "no"}.`);
      if (p.food_safe != null) parts.push(`Food safe: ${p.food_safe ? "yes" : "no"}.`);
      if (p.outdoor_suitable != null) parts.push(`Outdoor suitable: ${p.outdoor_suitable ? "yes" : "no"}.`);
      if (p.uv_resistance_score != null) parts.push(`UV resistance: ${p.uv_resistance_score}/10.`);
      if (p.moisture_resistance_score != null) parts.push(`Moisture resistance: ${p.moisture_resistance_score}/10.`);
      if (p.flexibility_score != null) parts.push(`Flexibility: ${p.flexibility_score}/10.`);
      if (p.layer_adhesion_score != null) parts.push(`Layer adhesion: ${p.layer_adhesion_score}/10.`);
      if (p.abrasive != null) parts.push(`Abrasive (needs hardened nozzle): ${p.abrasive ? "yes" : "no"}.`);
      if (p.translucency != null) parts.push(`Translucency: ${p.translucency}.`);
      if (p.surface_finish != null) parts.push(`Surface finish: ${p.surface_finish}.`);
    }

    // Trait tags by category
    const strengths = traits.filter((t: Record<string, unknown>) => t.category === "strength").map((t: Record<string, unknown>) => t.trait);
    const weaknesses = traits.filter((t: Record<string, unknown>) => t.category === "weakness").map((t: Record<string, unknown>) => t.trait);
    const avoidIf = traits.filter((t: Record<string, unknown>) => t.category === "avoid_if").map((t: Record<string, unknown>) => t.trait);

    if (strengths.length > 0) parts.push(`Strengths: ${strengths.join(", ")}.`);
    if (weaknesses.length > 0) parts.push(`Weaknesses: ${weaknesses.join(", ")}.`);

    // Use cases
    const bestUseCases = useCases
      .filter((uc: Record<string, unknown>) => uc.suitability === "ideal" || uc.suitability === "good")
      .map((uc: Record<string, unknown>) => uc.use_case);
    if (bestUseCases.length > 0) parts.push(`Best use cases: ${bestUseCases.join(", ")}.`);

    if (avoidIf.length > 0) parts.push(`Avoid if: ${avoidIf.join(", ")}.`);

    const embeddingText = parts.join("\n");

    // STEP 3 — Call OpenAI Embeddings
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: embeddingText,
      }),
    });

    if (!embeddingResponse.ok) {
      const errBody = await embeddingResponse.text();
      return new Response(
        JSON.stringify({ success: false, error: `OpenAI API error: ${embeddingResponse.status} ${errBody}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const embeddingData = await embeddingResponse.json();
    const embeddingVector = embeddingData.data?.[0]?.embedding;

    if (!embeddingVector) {
      return new Response(
        JSON.stringify({ success: false, error: "No embedding returned from OpenAI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // STEP 4 — Upsert into filament_search_embeddings
    const { error: upsertError } = await supabase
      .from("filament_search_embeddings")
      .upsert(
        {
          filament_id,
          embedding_text: embeddingText,
          embedding_json: JSON.stringify(embeddingVector),
          generated_at: new Date().toISOString(),
        },
        { onConflict: "filament_id" }
      );

    if (upsertError) {
      return new Response(
        JSON.stringify({ success: false, error: `Upsert failed: ${upsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // STEP 5 — Response
    return new Response(
      JSON.stringify({ success: true, filament_id, characters: embeddingText.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-filament-embedding error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
