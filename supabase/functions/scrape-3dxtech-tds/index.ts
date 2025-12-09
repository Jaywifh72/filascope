import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Normalize material names for matching - strip colors, sizes, special chars
function normalizeMaterialName(name: string): string {
  return name
    .toLowerCase()
    // Remove brand prefix
    .replace(/^3dxtech\s*/i, '')
    // Remove trademark symbols
    .replace(/[™®©]/g, '')
    // Remove HTML entities
    .replace(/&nbsp;/g, ' ')
    // Remove color suffixes (e.g., "- Black", "- Red", "- Nylon Black")
    .replace(/\s*-\s*(?:black|white|red|blue|grey|gray|green|orange|yellow|tan|natural|dark\s*grey|mid\s*blue|reflex\s*blue|blue\s*frost|glacier\s*grey|nylon\s*black|antique\s*white|tactical\s*tan).*$/i, '')
    // Remove size/variant info
    .replace(/\s*,?\s*\d+\.?\d*mm.*$/i, '')
    .replace(/\s*-\s*default\s*title.*$/i, '')
    // Normalize material names
    .replace(/carbon\s*fiber/gi, 'cf')
    .replace(/glass\s*fiber/gi, 'gf')
    .replace(/polycarbonate/gi, 'pc')
    .replace(/nylon\s*12/gi, 'pa12')
    .replace(/nylon\s*6/gi, 'pa6')
    .replace(/nylon/gi, 'pa')
    // Remove dashes, plus signs, extra spaces
    .replace(/[\+\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract the base product line (e.g., "3DXSTAT", "CarbonX", "FibreX")
function extractProductLine(name: string): string | null {
  const normalized = name.toLowerCase().replace(/[™®©]/g, '');
  
  const productLines = [
    '3dxstat', 'carbonx', 'fibrex', 'thermax', 'triton', 'amidex', 
    'ecomax', 'hyperlite', 'obsidian', 'fluorx', 'wearx', 'ceramix',
    '3dxmax', '3dxflex', 'aquatek', 'simubone', 'firewire', 'ezpc', 
    'max-g', 'maxg', 'ion', '3dxtech'
  ];
  
  for (const line of productLines) {
    if (normalized.includes(line)) {
      return line.replace('-', '');
    }
  }
  
  // Check for standalone "MAX" that isn't "MAX-G"
  if (/\bmax\b/i.test(normalized) && !normalized.includes('max-g') && !normalized.includes('maxg') && !normalized.includes('ecomax') && !normalized.includes('3dxmax') && !normalized.includes('thermax')) {
    return 'max';
  }
  
  return null;
}

// Extract material type (e.g., "PETG", "ABS", "PC", "PA6")
function extractMaterialType(name: string): string | null {
  const normalized = name.toLowerCase();
  
  // Order matters - check longer/specific patterns first
  const materials = [
    'pekk', 'peek', 'pei', 'ultem', 'pps', 'pvdf', 'ppsu', 'pes', 'ppa',
    'petg', 'pctg', 'r-petg', 'rpetg',
    'pa12', 'pa6-66', 'pa6', 'pa',
    'pc', 'abs', 'pla', 'asa', 'tpu', 'pva', 'pp',
    'htn', 'lts2', 'bas', '9085', '1010'
  ];
  
  for (const mat of materials) {
    // Use word boundary check for short material names
    const pattern = mat.length <= 3 ? new RegExp(`\\b${mat}\\b`, 'i') : new RegExp(mat, 'i');
    if (pattern.test(normalized)) {
      // Normalize r-petg/rpetg to petg
      if (mat === 'r-petg' || mat === 'rpetg') return 'petg';
      return mat;
    }
  }
  return null;
}

// Extract TPU hardness (e.g., "85A", "95A")
function extractTpuHardness(name: string): string | null {
  const match = name.match(/\b(\d{2}A)\b/i);
  return match ? match[1].toUpperCase() : null;
}

// Check if product has fiber reinforcement
function hasFiberReinforcement(name: string): { cf: boolean; gf: boolean } {
  const normalized = name.toLowerCase();
  return {
    cf: /\bcf\b/.test(normalized) || normalized.includes('carbon'),
    gf: /\bgf\b/.test(normalized) || normalized.includes('glass')
  };
}

// Check if two material names match
function isMaterialMatch(tdsName: string, productTitle: string): boolean {
  const normalizedTds = normalizeMaterialName(tdsName);
  const normalizedProduct = normalizeMaterialName(productTitle);
  
  console.log(`  Comparing TDS:"${normalizedTds}" vs Product:"${normalizedProduct}"`);
  
  // Direct match after normalization
  if (normalizedTds === normalizedProduct) {
    return true;
  }
  
  // Extract product lines
  const tdsLine = extractProductLine(tdsName);
  const productLine = extractProductLine(productTitle);
  
  // Extract material types
  const tdsMaterial = extractMaterialType(tdsName);
  const productMaterial = extractMaterialType(productTitle);
  
  // Extract fiber reinforcement
  const tdsFiber = hasFiberReinforcement(tdsName);
  const productFiber = hasFiberReinforcement(productTitle);
  
  console.log(`    TDS line:${tdsLine} mat:${tdsMaterial} cf:${tdsFiber.cf} | Product line:${productLine} mat:${productMaterial} cf:${productFiber.cf}`);
  
  // Special case: TPU with hardness rating
  const tdsHardness = extractTpuHardness(tdsName);
  const productHardness = extractTpuHardness(productTitle);
  if (tdsMaterial === 'tpu' && productMaterial === 'tpu') {
    // If both have hardness, they must match
    if (tdsHardness && productHardness) {
      return tdsHardness === productHardness;
    }
    // If TDS has no hardness but product does, still match (generic TDS)
    if (!tdsHardness && productHardness) {
      return true;
    }
  }
  
  // Special case: "3DXTECH ABS" products - match line + material
  if (productLine === '3dxtech' && tdsLine === '3dxtech') {
    if (tdsMaterial && productMaterial && tdsMaterial === productMaterial) {
      if (tdsFiber.cf === productFiber.cf && tdsFiber.gf === productFiber.gf) {
        return true;
      }
    }
  }
  
  // Special case: Standalone "MAX PLA" products (not MAX-G)
  if (productLine === 'max' && tdsLine === 'max') {
    return true;
  }
  
  // Special case: "AquaTek PVA"
  if ((tdsLine === 'aquatek' || normalizedTds.includes('aquatek')) && 
      (productLine === 'aquatek' || normalizedProduct.includes('aquatek'))) {
    return true;
  }
  
  // Special case: "CeramiX" products
  if ((tdsLine === 'ceramix' || normalizedTds.includes('ceramix')) && 
      (productLine === 'ceramix' || normalizedProduct.includes('ceramix'))) {
    return true;
  }
  
  // Special case: "ECOMAX R-PETG" products
  if ((tdsLine === 'ecomax' || normalizedTds.includes('ecomax')) && 
      (productLine === 'ecomax' || normalizedProduct.includes('ecomax'))) {
    return true;
  }
  
  // Special case: AmideX products
  if ((tdsLine === 'amidex' || normalizedTds.includes('amidex')) && 
      (productLine === 'amidex' || normalizedProduct.includes('amidex'))) {
    // Check material type matches if both have it
    if (tdsMaterial && productMaterial) {
      // Handle "Nylon 6-66" vs "pa6" vs "pa12"
      const tdsNylon = tdsName.toLowerCase();
      const prodNylon = productTitle.toLowerCase();
      if (tdsNylon.includes('6-66') && prodNylon.includes('6-66')) return true;
      if (tdsNylon.includes('nylon 12') && prodNylon.includes('nylon 12')) return true;
      if (tdsMaterial === productMaterial) return true;
    }
    return true;
  }
  
  // Match by product line + material + fiber type
  if (tdsLine && productLine && tdsLine === productLine) {
    // Same product line
    if (tdsMaterial && productMaterial) {
      // Both have material types - they should match
      if (tdsMaterial === productMaterial) {
        // Check fiber reinforcement matches
        if (tdsFiber.cf === productFiber.cf && tdsFiber.gf === productFiber.gf) {
          return true;
        }
      }
    } else {
      // One doesn't have explicit material - match if fibers match
      if (tdsFiber.cf === productFiber.cf && tdsFiber.gf === productFiber.gf) {
        return true;
      }
    }
  }
  
  // Special case: "MAX-G PETG" should match "MAX-G™ PETG"
  if (normalizedTds.includes('max g') && normalizedProduct.includes('max g')) {
    return true;
  }
  
  // Special case: "ezPC" products
  if (normalizedTds.includes('ezpc') && normalizedProduct.includes('ezpc')) {
    return true;
  }
  
  // Special case: Triton products - match by material type
  if (tdsLine === 'triton' && productLine === 'triton') {
    if (tdsMaterial && productMaterial && tdsMaterial === productMaterial) {
      // Check fiber matches too for Triton CF products
      if (tdsFiber.cf === productFiber.cf && tdsFiber.gf === productFiber.gf) {
        return true;
      }
    }
    // Handle special Triton cases like "9085 BAS", "Ultem 1010 BAS"
    if (normalizedTds.includes('9085') && normalizedProduct.includes('9085')) return true;
    if (normalizedTds.includes('1010') && normalizedProduct.includes('1010')) return true;
    if (normalizedTds.includes('ultem') && normalizedProduct.includes('ultem')) return true;
  }
  
  // Fallback: check if normalized names contain each other (only for longer names)
  if (normalizedTds.length > 8 && normalizedProduct.length > 8) {
    if (normalizedProduct.includes(normalizedTds) || normalizedTds.includes(normalizedProduct)) {
      return true;
    }
  }
  
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

    const authClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: hasAdmin } = await authClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!hasAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Scrape the centralized TDS page
    console.log("Scraping 3DXTech TDS page...");
    
    if (!firecrawlKey) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://www.3dxtech.com/pages/tech-data-sheets-safety-data-sheets",
        formats: ["html"],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error("Firecrawl error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to scrape TDS page", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeResponse.json();
    const html = scrapeData.data?.html || "";
    
    console.log(`Got HTML with length: ${html.length}`);

    // Step 2: Extract all TDS entries from the table
    const tdsEntries: { materialName: string; tdsUrl: string }[] = [];
    
    // Find all TDS PDF links with their associated material names
    // Pattern: look for table rows with material name in first cell and TDS link in second
    const rowPattern = /<tr[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>[\s\S]*?<a[^>]*href=["']([^"']*_TDS[^"']*\.pdf[^"']*)["']/gi;
    
    let match;
    const foundUrls = new Set<string>();
    
    while ((match = rowPattern.exec(html)) !== null) {
      // Clean the material name - remove HTML tags
      const materialName = match[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      let tdsUrl = match[2];
      
      // Ensure URL is absolute
      if (!tdsUrl.startsWith('http')) {
        tdsUrl = tdsUrl.startsWith('//') ? `https:${tdsUrl}` : `https://cdn.shopify.com${tdsUrl}`;
      }
      
      // Skip SDS links and duplicates
      if (materialName && tdsUrl && tdsUrl.includes('_TDS') && 
          !tdsUrl.toLowerCase().includes('sds') && !foundUrls.has(tdsUrl)) {
        tdsEntries.push({ materialName, tdsUrl });
        foundUrls.add(tdsUrl);
        console.log(`Found TDS: "${materialName}" -> ${tdsUrl}`);
      }
    }

    // Also extract TDS URLs from standalone links and infer material name from filename
    const pdfPattern = /href=["']([^"']*(?:cdn\.shopify\.com|3dxtech)[^"']*_TDS[^"']*\.pdf[^"']*)["']/gi;
    
    while ((match = pdfPattern.exec(html)) !== null) {
      let tdsUrl = match[1];
      if (!tdsUrl.startsWith('http')) {
        tdsUrl = tdsUrl.startsWith('//') ? `https:${tdsUrl}` : `https://cdn.shopify.com${tdsUrl}`;
      }
      
      if (!foundUrls.has(tdsUrl) && !tdsUrl.toLowerCase().includes('sds')) {
        // Extract material name from URL filename
        const urlMatch = tdsUrl.match(/\/([^/]+)_TDS[^.]*\.pdf/i);
        if (urlMatch) {
          const materialName = urlMatch[1]
            .replace(/_/g, ' ')
            .replace(/v\d+(\.\d+)?$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
          tdsEntries.push({ materialName, tdsUrl });
          foundUrls.add(tdsUrl);
          console.log(`Found TDS from URL: "${materialName}" -> ${tdsUrl}`);
        }
      }
    }

    console.log(`Total TDS entries found: ${tdsEntries.length}`);

    if (tdsEntries.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No TDS entries found on page",
        htmlLength: html.length
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Fetch 3DXTech filaments missing TDS URLs
    const { data: filaments, error: fetchError } = await supabase
      .from("filaments")
      .select("id, product_title, product_url, tds_url")
      .ilike("vendor", "%3DXTech%")
      .is("tds_url", null);

    if (fetchError) {
      console.error("Error fetching filaments:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${filaments?.length || 0} 3DXTech filaments missing TDS URLs`);

    if (!filaments || filaments.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No 3DXTech filaments missing TDS URLs",
        tdsEntriesFound: tdsEntries.length,
        updated: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 4: Match filaments to TDS entries
    let updated = 0;
    let notMatched = 0;
    const results: { id: string; title: string; tds_url?: string; matched_to?: string; error?: string }[] = [];
    const unmatchedProducts: string[] = [];

    for (const filament of filaments) {
      let bestMatch: { materialName: string; tdsUrl: string } | null = null;
      
      // Try to find the best matching TDS entry
      for (const tds of tdsEntries) {
        if (isMaterialMatch(tds.materialName, filament.product_title)) {
          bestMatch = tds;
          console.log(`MATCH: "${filament.product_title}" -> "${tds.materialName}"`);
          break;
        }
      }
      
      if (bestMatch) {
        const { error: updateError } = await supabase
          .from("filaments")
          .update({ tds_url: bestMatch.tdsUrl })
          .eq("id", filament.id);

        if (updateError) {
          console.error(`Update error for ${filament.product_title}:`, updateError);
          results.push({ 
            id: filament.id, 
            title: filament.product_title, 
            error: updateError.message 
          });
        } else {
          results.push({ 
            id: filament.id, 
            title: filament.product_title, 
            tds_url: bestMatch.tdsUrl,
            matched_to: bestMatch.materialName
          });
          updated++;
        }
      } else {
        console.log(`No TDS match for: ${filament.product_title}`);
        unmatchedProducts.push(filament.product_title);
        notMatched++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      tdsEntriesFound: tdsEntries.length,
      filamentsProcessed: filaments.length,
      updated,
      notMatched,
      results: results.slice(0, 50),
      unmatchedProducts: unmatchedProducts.slice(0, 30),
      tdsEntries: tdsEntries.map(t => t.materialName),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
