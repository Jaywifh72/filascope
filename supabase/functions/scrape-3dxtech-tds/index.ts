import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Normalize material names for matching
function normalizeMaterialName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/carbon\s*fiber/gi, 'cf')
    .replace(/glass\s*fiber/gi, 'gf')
    .replace(/nylon/gi, 'pa')
    .replace(/polycarbonate/gi, 'pc')
    .replace(/\+/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if two material names are a potential match
function isMaterialMatch(tdsName: string, productTitle: string): boolean {
  const normalizedTds = normalizeMaterialName(tdsName);
  const normalizedProduct = normalizeMaterialName(productTitle);
  
  // Extract key material identifiers
  const tdsWords = normalizedTds.split(' ').filter(w => w.length > 1);
  const productWords = normalizedProduct.split(' ').filter(w => w.length > 1);
  
  // Check for key material matches
  const materialPatterns = [
    'esd', 'carbonx', 'fibrex', 'thermax', 'triton', 'amidex', 'ecomax', 'hyperlite', 'obsidian',
    'pekk', 'peek', 'pei', 'ultem', 'pps', 'pvdf', 'pc', 'petg', 'abs', 'pla', 'pa6', 'pa12', 
    'nylon', 'asa', 'tpu', 'cf', 'gf', 'htn', 'ppa', 'pp', 'pctg', 'ppsu', 'pes'
  ];
  
  // Find matching material patterns in both strings
  const tdsPatterns = materialPatterns.filter(p => normalizedTds.includes(p));
  const productPatterns = materialPatterns.filter(p => normalizedProduct.includes(p));
  
  // If they share at least 2 material patterns, consider it a match
  const sharedPatterns = tdsPatterns.filter(p => productPatterns.includes(p));
  
  if (sharedPatterns.length >= 2) {
    return true;
  }
  
  // Also check for brand line matches (e.g., "3DXSTAT ESD PETG" should match "3DXTech 3DXSTAT ESD-PETG")
  if (normalizedTds.includes('3dxstat') && normalizedProduct.includes('3dxstat')) {
    return sharedPatterns.length >= 1;
  }
  if (normalizedTds.includes('carbonx') && normalizedProduct.includes('carbonx')) {
    return sharedPatterns.length >= 1;
  }
  if (normalizedTds.includes('fibrex') && normalizedProduct.includes('fibrex')) {
    return sharedPatterns.length >= 1;
  }
  if (normalizedTds.includes('thermax') && normalizedProduct.includes('thermax')) {
    return sharedPatterns.length >= 1;
  }
  if (normalizedTds.includes('triton') && normalizedProduct.includes('triton')) {
    return sharedPatterns.length >= 1;
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
    // Pattern: <td>MATERIAL_NAME</td><td><a href="TDS_URL">
    const tdsEntries: { materialName: string; tdsUrl: string }[] = [];
    
    // Find all rows with TDS links
    const rowPattern = /<tr[^>]*>[\s\S]*?<td[^>]*>(?:<[^>]*>)*\s*([^<]+(?:™|®)?[^<]*)\s*(?:<\/[^>]*>)*<\/td>\s*<td[^>]*>(?:<[^>]*>)*\s*<a[^>]*href=["']([^"']*_TDS[^"']*\.pdf[^"']*)["']/gi;
    
    let match;
    while ((match = rowPattern.exec(html)) !== null) {
      const materialName = match[1].replace(/<[^>]*>/g, '').trim();
      let tdsUrl = match[2];
      
      // Ensure URL is absolute
      if (!tdsUrl.startsWith('http')) {
        tdsUrl = tdsUrl.startsWith('//') ? `https:${tdsUrl}` : `https://cdn.shopify.com${tdsUrl}`;
      }
      
      if (materialName && tdsUrl && tdsUrl.includes('_TDS') && !tdsUrl.toLowerCase().includes('sds')) {
        tdsEntries.push({ materialName, tdsUrl });
        console.log(`Found TDS: "${materialName}" -> ${tdsUrl}`);
      }
    }

    // Also try a more general pattern for PDF links with TDS in filename
    const pdfPattern = /href=["']([^"']*(?:cdn\.shopify\.com|3dxtech)[^"']*_TDS[^"']*\.pdf)["']/gi;
    const foundUrls = new Set(tdsEntries.map(e => e.tdsUrl));
    
    while ((match = pdfPattern.exec(html)) !== null) {
      let tdsUrl = match[1];
      if (!tdsUrl.startsWith('http')) {
        tdsUrl = tdsUrl.startsWith('//') ? `https:${tdsUrl}` : `https://cdn.shopify.com${tdsUrl}`;
      }
      
      if (!foundUrls.has(tdsUrl)) {
        // Extract material name from URL
        const urlMatch = tdsUrl.match(/\/([^/]+)_TDS[^.]*\.pdf/i);
        if (urlMatch) {
          const materialName = urlMatch[1].replace(/_/g, ' ').replace(/v\d+(\.\d+)?$/i, '').trim();
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

    for (const filament of filaments) {
      let bestMatch: { materialName: string; tdsUrl: string } | null = null;
      
      // Try to find the best matching TDS entry
      for (const tds of tdsEntries) {
        if (isMaterialMatch(tds.materialName, filament.product_title)) {
          bestMatch = tds;
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
          console.log(`Updated: ${filament.product_title} -> ${bestMatch.materialName}`);
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
        results.push({ 
          id: filament.id, 
          title: filament.product_title, 
          error: "No TDS match found" 
        });
        notMatched++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      tdsEntriesFound: tdsEntries.length,
      filamentsProcessed: filaments.length,
      updated,
      notMatched,
      results: results.slice(0, 50), // Limit results to avoid huge response
      tdsEntries: tdsEntries.slice(0, 20), // Show some found TDS entries for debugging
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
