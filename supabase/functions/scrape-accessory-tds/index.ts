import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AccessoryRow {
  id: string;
  name: string;
  brand: string | null;
  accessory_type: string;
  product_url: string | null;
  tds_url: string | null;
  specs: Record<string, unknown> | null;
}

// TDS URL patterns to search for
const TDS_PATTERNS = [
  /href=["']([^"']*(?:tds|technical-data|datasheet|data-sheet|spec-sheet)[^"']*\.pdf)["']/gi,
  /href=["']([^"']*\.pdf)["'][^>]*>(?:[^<]*(?:tds|technical|datasheet|spec))/gi,
  /["'](https?:\/\/[^"']*(?:tds|technical-data|datasheet|spec-sheet)[^"']*\.pdf)["']/gi,
];

// Hotend-specific spec extraction
const HOTEND_EXTRACTION_PROMPT = `Extract the following specifications from this Technical Data Sheet for a 3D printer hotend/nozzle:

- max_temp_c: Maximum operating temperature in Celsius (number)
- thermal_conductivity: Heat transfer properties or thermal conductivity value
- material: Nozzle material (brass, hardened steel, copper, plated copper, etc.)
- thread_type: Thread type (M6, MK8, V6, etc.)
- heatbreak_material: Heatbreak material (titanium, steel, bimetal)
- heater_power_w: Heater wattage rating (number)
- thermistor_type: Thermistor type (NTC 100K, PT1000, etc.)
- flow_rate_mm3s: Maximum volumetric flow rate in mm³/s (number)
- abrasion_resistant: Whether it's suitable for abrasive filaments (true/false)

Return ONLY a valid JSON object with these fields. Use null for unknown values.`;

// Build plate-specific spec extraction
const BUILD_PLATE_EXTRACTION_PROMPT = `Extract the following specifications from this Technical Data Sheet for a 3D printer build plate:

- surface_type: Surface type (PEI, textured, smooth, glass, etc.)
- coating: Coating type (powder-coated, smooth PEI, etc.)
- max_temp_c: Maximum bed temperature in Celsius (number)
- flatness_tolerance_mm: Surface flatness tolerance in mm (number)
- magnetic: Whether it's magnetic (true/false)
- release_temp_c: Temperature for part release in Celsius (number)
- compatible_materials: Compatible filament materials (comma-separated string)

Return ONLY a valid JSON object with these fields. Use null for unknown values.`;

// AMS/MMU-specific spec extraction
const AMS_EXTRACTION_PROMPT = `Extract the following specifications from this Technical Data Sheet for a 3D printer multi-material system (AMS/MMU):

- filament_slots: Number of filament spools supported (number)
- max_drying_temp_c: Maximum drying temperature in Celsius (number)
- humidity_control: Whether it has humidity control (true/false)
- supported_materials: Compatible filament types (comma-separated string)
- buffer_system: Type of filament buffering system
- purge_volume_mm3: Material waste during color change in mm³ (number)

Return ONLY a valid JSON object with these fields. Use null for unknown values.`;

function getExtractionPrompt(accessoryType: string): string {
  switch (accessoryType) {
    case "hotend":
      return HOTEND_EXTRACTION_PROMPT;
    case "build_plate":
      return BUILD_PLATE_EXTRACTION_PROMPT;
    case "ams_mmu":
      return AMS_EXTRACTION_PROMPT;
    default:
      return HOTEND_EXTRACTION_PROMPT;
  }
}

async function findTdsUrl(productUrl: string, firecrawlApiKey: string): Promise<string | null> {
  try {
    console.log(`Scraping product page for TDS: ${productUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ["links"],
        onlyMainContent: false,
        timeout: 10000,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const html = data.data?.html || "";
    const markdown = data.data?.markdown || "";
    console.log(`Firecrawl returned data for ${productUrl}`);
    const links = data.data?.links || [];
    
    console.log(`Found ${links.length} links on page`);

    // Keywords to look for TDS/datasheet links
    const tdsKeywords = ["tds", "datasheet", "data-sheet", "technical-data", "spec-sheet", "specifications", "specs"];
    const documentKeywords = ["download", "document", "pdf", "resources", "support"];

    // First check extracted links for obvious TDS files
    for (const link of links) {
      const lowerLink = link.toLowerCase();
      for (const keyword of tdsKeywords) {
        if (lowerLink.includes(keyword)) {
          console.log(`Found TDS link with keyword "${keyword}": ${link}`);
          return link;
        }
      }
    }

    // Check for PDF links that might be TDS
    const pdfLinks = links.filter((link: string) => link.toLowerCase().endsWith(".pdf"));
    console.log(`Found ${pdfLinks.length} PDF links`);
    
    if (pdfLinks.length > 0) {
      // Prioritize PDFs with TDS-related names
      for (const pdf of pdfLinks) {
        const filename = pdf.split("/").pop()?.toLowerCase() || "";
        for (const keyword of [...tdsKeywords, "spec", "data", "sheet", "info"]) {
          if (filename.includes(keyword)) {
            console.log(`Found TDS PDF by filename: ${pdf}`);
            return pdf;
          }
        }
      }
      // Return first PDF if no TDS-specific name found
      console.log(`Using first PDF found: ${pdfLinks[0]}`);
      return pdfLinks[0];
    }

    // Search HTML for embedded PDF links or download buttons
    const htmlPdfMatches = html.match(/href=["']([^"']+\.pdf)["']/gi) || [];
    console.log(`Found ${htmlPdfMatches.length} PDF links in HTML`);
    
    for (const match of htmlPdfMatches) {
      const urlMatch = match.match(/href=["']([^"']+)["']/i);
      if (urlMatch?.[1]) {
        let url = urlMatch[1];
        if (url.startsWith("/")) {
          const baseUrl = new URL(productUrl);
          url = `${baseUrl.origin}${url}`;
        }
        console.log(`Found PDF in HTML: ${url}`);
        return url;
      }
    }

    // Check markdown for any document/download links
    const markdownLinks = markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    for (const mdLink of markdownLinks) {
      const linkMatch = mdLink.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const text = linkMatch[1].toLowerCase();
        const url = linkMatch[2];
        if (text.includes("download") || text.includes("pdf") || text.includes("spec") || text.includes("data")) {
          console.log(`Found document link in markdown: ${url}`);
          if (url.endsWith(".pdf") || url.includes(".pdf")) {
            return url;
          }
        }
      }
    }

    console.log(`No TDS found for: ${productUrl}`);
    return null;
  } catch (error) {
    console.error(`Error finding TDS URL:`, error);
    return null;
  }
}

async function extractTdsContent(tdsUrl: string, firecrawlApiKey: string): Promise<string | null> {
  try {
    console.log(`Extracting TDS content from: ${tdsUrl}`);
    
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: tdsUrl,
        formats: ["markdown"],
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl PDF error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data?.markdown || null;
  } catch (error) {
    console.error(`Error extracting TDS content:`, error);
    return null;
  }
}

async function extractSpecsWithAI(
  content: string,
  accessoryType: string,
  lovableApiKey: string
): Promise<Record<string, unknown> | null> {
  try {
    const prompt = getExtractionPrompt(accessoryType);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Here is the Technical Data Sheet content:\n\n${content.substring(0, 10000)}` },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`AI extraction error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error(`Error extracting specs with AI:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!firecrawlApiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }
    if (!lovableApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { accessoryType, forceRescrape, limit = 5 } = await req.json();

    // Build query for accessories
    let query = supabase
      .from("printer_accessories")
      .select("id, name, brand, accessory_type, product_url, tds_url, specs")
      .not("product_url", "is", null);

    if (accessoryType && accessoryType !== "all") {
      query = query.eq("accessory_type", accessoryType);
    }

    if (!forceRescrape) {
      query = query.is("tds_url", null);
    }

    query = query.limit(limit);

    const { data: accessories, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Processing ${accessories?.length || 0} accessories for TDS scraping`);

    const results: Array<{
      id: string;
      name: string;
      status: "found" | "not_found" | "extracted" | "error";
      tds_url?: string;
      specs_extracted?: number;
      error?: string;
    }> = [];

    let found = 0;
    let extracted = 0;
    let failed = 0;

    for (const accessory of (accessories || []) as AccessoryRow[]) {
      try {
        console.log(`Processing: ${accessory.name}`);

        if (!accessory.product_url) {
          results.push({ id: accessory.id, name: accessory.name, status: "error", error: "No product URL" });
          failed++;
          continue;
        }

        // Find TDS URL
        const tdsUrl = await findTdsUrl(accessory.product_url, firecrawlApiKey);

        if (!tdsUrl) {
          results.push({ id: accessory.id, name: accessory.name, status: "not_found" });
          
          // Update with null to mark as checked
          await supabase
            .from("printer_accessories")
            .update({ tds_url: "N/A" })
            .eq("id", accessory.id);
          
          failed++;
          continue;
        }

        found++;

        // Extract TDS content
        const tdsContent = await extractTdsContent(tdsUrl, firecrawlApiKey);
        
        let specsExtracted = 0;
        let updatedSpecs = accessory.specs || {};

        if (tdsContent) {
          // Use AI to extract specs
          const extractedSpecs = await extractSpecsWithAI(tdsContent, accessory.accessory_type, lovableApiKey);
          
          if (extractedSpecs) {
            // Merge extracted specs with existing specs
            for (const [key, value] of Object.entries(extractedSpecs)) {
              if (value !== null && value !== undefined) {
                updatedSpecs[key] = value;
                specsExtracted++;
              }
            }
            extracted++;
          }
        }

        // Update database
        await supabase
          .from("printer_accessories")
          .update({ 
            tds_url: tdsUrl,
            specs: updatedSpecs
          })
          .eq("id", accessory.id);

        results.push({ 
          id: accessory.id, 
          name: accessory.name, 
          status: specsExtracted > 0 ? "extracted" : "found",
          tds_url: tdsUrl,
          specs_extracted: specsExtracted
        });

      } catch (error) {
        console.error(`Error processing ${accessory.name}:`, error);
        results.push({ 
          id: accessory.id, 
          name: accessory.name, 
          status: "error", 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
        failed++;
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_processed: accessories?.length || 0,
        tds_found: found,
        specs_extracted: extracted,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("TDS scraping error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
