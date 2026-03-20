import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a 3D printing filament expert. Parse the user's query into structured search parameters. Return ONLY valid JSON with these exact fields (all optional, use null if not applicable):

{
  "material_types": [],
  "min_heat_resistance_c": null,
  "max_flexibility_score": null,
  "min_flexibility_score": null,
  "use_cases": [],
  "require_traits": [],
  "avoid_weaknesses": [],
  "printer_constraints": { "no_enclosure": false, "standard_nozzle_only": false },
  "properties": { "food_safe": null, "outdoor_suitable": null, "drying_required": null },
  "semantic_query": "",
  "explanation": ""
}

Rules:
- material_types: array of strings like ["PLA","PETG","ABS","ASA","TPU","Nylon","PC","PLA+"]
- min_heat_resistance_c: integer, infer from context (e.g. 'car interior' = 80, 'engine bay' = 120, 'high heat' = 80)
- use_cases: plain english use cases e.g. ['outdoor enclosures','functional mechanical parts','HueForge lithophanes']
- require_traits: traits user needs e.g. ['high heat resistance','UV resistant','food safe']
- avoid_weaknesses: things user wants to avoid e.g. ['warping','brittle','moisture sensitive']
- semantic_query: a refined, expert-level version of the query for embedding search
- explanation: one sentence describing what the user is looking for, written for display to the user`;

interface ParsedIntent {
  material_types: string[];
  min_heat_resistance_c: number | null;
  max_flexibility_score: number | null;
  min_flexibility_score: number | null;
  use_cases: string[];
  require_traits: string[];
  avoid_weaknesses: string[];
  printer_constraints: { no_enclosure: boolean; standard_nozzle_only: boolean };
  properties: { food_safe: boolean | null; outdoor_suitable: boolean | null; drying_required: boolean | null };
  semantic_query: string;
  explanation: string;
}

async function parseIntent(query: string): Promise<ParsedIntent> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "parse_filament_query",
            description: "Parse a filament search query into structured intent",
            parameters: {
              type: "object",
              properties: {
                material_types: { type: "array", items: { type: "string" } },
                min_heat_resistance_c: { type: ["integer", "null"] },
                max_flexibility_score: { type: ["integer", "null"] },
                min_flexibility_score: { type: ["integer", "null"] },
                use_cases: { type: "array", items: { type: "string" } },
                require_traits: { type: "array", items: { type: "string" } },
                avoid_weaknesses: { type: "array", items: { type: "string" } },
                printer_constraints: {
                  type: "object",
                  properties: {
                    no_enclosure: { type: "boolean" },
                    standard_nozzle_only: { type: "boolean" },
                  },
                },
                properties: {
                  type: "object",
                  properties: {
                    food_safe: { type: ["boolean", "null"] },
                    outdoor_suitable: { type: ["boolean", "null"] },
                    drying_required: { type: ["boolean", "null"] },
                  },
                },
                semantic_query: { type: "string" },
                explanation: { type: "string" },
              },
              required: ["material_types", "use_cases", "require_traits", "avoid_weaknesses", "semantic_query", "explanation"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "parse_filament_query" } },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No tool call in AI response");

  const parsed = JSON.parse(toolCall.function.arguments);
  return {
    material_types: parsed.material_types || [],
    min_heat_resistance_c: parsed.min_heat_resistance_c ?? null,
    max_flexibility_score: parsed.max_flexibility_score ?? null,
    min_flexibility_score: parsed.min_flexibility_score ?? null,
    use_cases: parsed.use_cases || [],
    require_traits: parsed.require_traits || [],
    avoid_weaknesses: parsed.avoid_weaknesses || [],
    printer_constraints: {
      no_enclosure: parsed.printer_constraints?.no_enclosure ?? false,
      standard_nozzle_only: parsed.printer_constraints?.standard_nozzle_only ?? false,
    },
    properties: {
      food_safe: parsed.properties?.food_safe ?? null,
      outdoor_suitable: parsed.properties?.outdoor_suitable ?? null,
      drying_required: parsed.properties?.drying_required ?? null,
    },
    semantic_query: parsed.semantic_query || "",
    explanation: parsed.explanation || "",
  };
}

function getPriceColumn(region: string): string {
  const map: Record<string, string> = {
    US: "variant_price",
    CA: "price_cad",
    EU: "price_eur",
    UK: "price_gbp",
    AU: "price_aud",
    JP: "price_jpy",
  };
  return map[region] || "variant_price";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { query, region = "US" } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ results: [], intent: null, query: "", totalFound: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitized = query.trim().slice(0, 300);
    let intent: ParsedIntent | null = null;
    let usedFallback = false;

    // STEP 1 — Intent Parsing
    try {
      intent = await parseIntent(sanitized);
    } catch (err) {
      console.error("Intent parsing failed, using fallback:", err);
      usedFallback = true;
    }

    // STEP 5 — Fallback path
    if (usedFallback || !intent) {
      const pattern = `%${sanitized}%`;
      const { data: fallbackRows, error: fbErr } = await supabase
        .from("filaments")
        .select("id, product_title, product_handle, vendor, material, variant_price, price_cad, price_eur, price_gbp, price_aud, price_jpy, featured_image")
        .or(`product_title.ilike.${pattern},vendor.ilike.${pattern},material.ilike.${pattern}`)
        .limit(15);

      if (fbErr) console.error("Fallback query error:", fbErr);

      const results = (fallbackRows || []).map((f: any) => ({
        id: f.id,
        name: f.product_title,
        slug: f.product_handle,
        score: 0,
        matchReasons: [],
        brand: f.vendor,
        material: f.material,
        price: f[getPriceColumn(region)] ?? f.variant_price,
        image: f.featured_image,
        properties: null,
        use_cases: [],
      }));

      // STEP 6 — Logging
      await supabase.from("intelligent_search_logs").insert({
        query: sanitized,
        parsed_intent: null,
        result_count: results.length,
        region,
      });

      return new Response(
        JSON.stringify({ results, intent: null, query: sanitized, totalFound: results.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // STEP 2 — Spec-Filtered Database Query
    // Build base query for filaments with properties
    let dbQuery = supabase
      .from("filaments")
      .select(`
        id, product_title, product_handle, vendor, material,
        variant_price, price_cad, price_eur, price_gbp, price_aud, price_jpy,
        featured_image,
        filament_properties!left(
          heat_resistance_c, glass_transition_c,
          print_temp_min, print_temp_max, bed_temp_min, bed_temp_max,
          tensile_strength_mpa, impact_strength_score, flexibility_score,
          layer_adhesion_score, uv_resistance_score, moisture_resistance_score,
          food_safe, biodegradable, outdoor_suitable, warping_risk,
          support_removal, enclosure_required, abrasive, drying_required,
          translucency, surface_finish
        ),
        filament_trait_tags!left(id, trait, trait_category, confidence),
        filament_use_cases!left(id, use_case, suitability, notes)
      `)
      .limit(60);

    // Apply material filter
    if (intent.material_types.length > 0) {
      const materialFilters = intent.material_types
        .map((m) => `material.ilike.%${m}%`)
        .join(",");
      dbQuery = dbQuery.or(materialFilters);
    }

    // Apply property filters via RPC or post-filter
    // Since nested filters on joined tables aren't directly supported,
    // we'll fetch and post-filter
    const { data: filaments, error: dbErr } = await dbQuery;

    if (dbErr) {
      console.error("Database query error:", dbErr);
      return new Response(
        JSON.stringify({ error: "Database query failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Post-filter based on intent
    let filtered = (filaments || []).filter((f: any) => {
      const props = Array.isArray(f.filament_properties)
        ? f.filament_properties[0]
        : f.filament_properties;

      if (!props) return true; // Keep filaments without properties (they'll score low)

      if (intent!.min_heat_resistance_c != null) {
        if (props.heat_resistance_c == null || props.heat_resistance_c < intent!.min_heat_resistance_c) {
          return false;
        }
      }

      if (intent!.printer_constraints.no_enclosure && props.enclosure_required === true) {
        return false;
      }

      if (intent!.printer_constraints.standard_nozzle_only && props.abrasive === true) {
        return false;
      }

      if (intent!.properties.food_safe === true && props.food_safe !== true) {
        return false;
      }

      if (intent!.properties.outdoor_suitable === true && props.outdoor_suitable !== true) {
        return false;
      }

      return true;
    });

    // STEP 3 — Trait Scoring
    const scored = filtered.map((f: any) => {
      let score = 0.3;
      const matchReasons: string[] = [];

      const props = Array.isArray(f.filament_properties)
        ? f.filament_properties[0]
        : f.filament_properties;
      const traits: any[] = Array.isArray(f.filament_trait_tags) ? f.filament_trait_tags : [];
      const useCases: any[] = Array.isArray(f.filament_use_cases) ? f.filament_use_cases : [];

      // Trait matching
      for (const reqTrait of intent!.require_traits) {
        const found = traits.find(
          (t: any) =>
            (t.trait_category === "strength" || t.trait_category === "use_case") &&
            t.trait.toLowerCase().includes(reqTrait.toLowerCase())
        );
        if (found) {
          score += 0.25;
          matchReasons.push(found.trait);
        }
      }

      // Use case matching
      for (const uc of intent!.use_cases) {
        const found = useCases.find(
          (u: any) => u.use_case.toLowerCase().includes(uc.toLowerCase())
        );
        if (found) {
          if (found.suitability === "ideal") {
            score += 0.35;
          } else if (found.suitability === "good") {
            score += 0.2;
          }
          matchReasons.push(`Good for: ${found.use_case}`);
        }
      }

      // Weakness penalties
      for (const weakness of intent!.avoid_weaknesses) {
        const found = traits.find(
          (t: any) =>
            t.trait_category === "weakness" &&
            t.trait.toLowerCase().includes(weakness.toLowerCase())
        );
        if (found) {
          score -= 0.2;
        }
      }

      // Heat resistance bonus
      if (intent!.min_heat_resistance_c != null && props?.heat_resistance_c != null) {
        const excess = props.heat_resistance_c - intent!.min_heat_resistance_c;
        if (excess >= 0) {
          score += Math.min(excess / 80, 0.3);
          matchReasons.push(`Heat resistant to ${props.heat_resistance_c}°C`);
        }
      }

      // No enclosure bonus
      if (intent!.printer_constraints.no_enclosure && props && props.enclosure_required === false) {
        matchReasons.push("No enclosure needed");
      }

      return {
        id: f.id,
        name: f.product_title,
        slug: f.product_handle,
        score: Math.max(0, Math.min(1, score)),
        matchReasons,
        brand: f.vendor,
        material: f.material,
        price: f[getPriceColumn(region)] ?? f.variant_price,
        image: f.featured_image,
        properties: props || null,
        use_cases: useCases,
      };
    });

    // STEP 4 — Sort and Return
    scored.sort((a: any, b: any) => b.score - a.score);
    const totalFound = scored.length;
    const top15 = scored.slice(0, 15);

    // STEP 6 — Logging
    await supabase.from("intelligent_search_logs").insert({
      query: sanitized,
      parsed_intent: intent as any,
      result_count: totalFound,
      region,
    });

    return new Response(
      JSON.stringify({
        results: top15,
        intent,
        query: sanitized,
        totalFound,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Intelligent search error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
