import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Fetch 3DXTech filaments missing TDS URLs
    const { data: filaments, error: fetchError } = await supabase
      .from("filaments")
      .select("id, product_title, product_url, tds_url")
      .ilike("vendor", "%3DXTech%")
      .is("tds_url", null)
      .not("product_url", "is", null)
      .limit(50);

    if (fetchError) {
      console.error("Error fetching filaments:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${filaments?.length || 0} 3DXTech filaments missing TDS URLs`);

    if (!filaments || filaments.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No 3DXTech filaments missing TDS URLs",
        updated: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    let failed = 0;
    const results: { id: string; title: string; tds_url?: string; error?: string }[] = [];

    for (const filament of filaments) {
      try {
        console.log(`Processing: ${filament.product_title}`);
        
        let tdsUrl: string | null = null;

        // Try Firecrawl scraping
        if (firecrawlKey && filament.product_url) {
          try {
            const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${firecrawlKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: filament.product_url,
                formats: ["html"],
                onlyMainContent: false,
              }),
            });

            if (scrapeResponse.ok) {
              const scrapeData = await scrapeResponse.json();
              const html = scrapeData.data?.html || "";
              
              // Look for TDS/Technical Data Sheet links
              const tdsPatterns = [
                /href=["']([^"']*(?:tds|technical-data-sheet|datasheet)[^"']*\.pdf)["']/gi,
                /href=["']([^"']*cdn\.shopify\.com[^"']*\.pdf)["']/gi,
                /href=["']([^"']*\.pdf)["'][^>]*>(?:[^<]*(?:TDS|Technical Data|Data Sheet|Datasheet))/gi,
                /<a[^>]*href=["']([^"']*\.pdf)["'][^>]*>[^<]*(?:TDS|Technical|Data Sheet)/gi,
              ];

              for (const pattern of tdsPatterns) {
                const matches = [...html.matchAll(pattern)];
                for (const match of matches) {
                  const url = match[1];
                  if (url && !url.includes("sds") && !url.toLowerCase().includes("safety")) {
                    tdsUrl = url.startsWith("http") ? url : `https:${url.startsWith("//") ? url : `//${url}`}`;
                    console.log(`Found TDS URL: ${tdsUrl}`);
                    break;
                  }
                }
                if (tdsUrl) break;
              }

              // Also check for direct PDF links in product description
              if (!tdsUrl) {
                const pdfLinks = html.match(/https?:\/\/[^"'\s]*3dxtech[^"'\s]*\.pdf/gi);
                if (pdfLinks) {
                  for (const link of pdfLinks) {
                    if (!link.toLowerCase().includes("sds") && !link.toLowerCase().includes("safety")) {
                      tdsUrl = link;
                      console.log(`Found direct PDF link: ${tdsUrl}`);
                      break;
                    }
                  }
                }
              }
            }
          } catch (scrapeError) {
            console.error(`Firecrawl error for ${filament.product_title}:`, scrapeError);
          }
        }

        // Try constructing TDS URL from product handle
        if (!tdsUrl && filament.product_url) {
          // 3DXTech often uses predictable TDS URL patterns
          const handleMatch = filament.product_url.match(/\/products\/([^/?]+)/);
          if (handleMatch) {
            const handle = handleMatch[1];
            // Try common 3DXTech TDS URL patterns
            const possibleUrls = [
              `https://cdn.shopify.com/s/files/1/0068/5568/2077/files/${handle}_TDS.pdf`,
              `https://cdn.shopify.com/s/files/1/0068/5568/2077/files/${handle.toUpperCase()}_TDS.pdf`,
            ];
            
            for (const url of possibleUrls) {
              try {
                const checkResponse = await fetch(url, { method: "HEAD" });
                if (checkResponse.ok) {
                  tdsUrl = url;
                  console.log(`Found TDS via URL construction: ${tdsUrl}`);
                  break;
                }
              } catch {
                // URL doesn't exist, continue
              }
            }
          }
        }

        if (tdsUrl) {
          const { error: updateError } = await supabase
            .from("filaments")
            .update({ tds_url: tdsUrl })
            .eq("id", filament.id);

          if (updateError) {
            console.error(`Update error for ${filament.product_title}:`, updateError);
            results.push({ id: filament.id, title: filament.product_title, error: updateError.message });
            failed++;
          } else {
            results.push({ id: filament.id, title: filament.product_title, tds_url: tdsUrl });
            updated++;
          }
        } else {
          console.log(`No TDS found for: ${filament.product_title}`);
          results.push({ id: filament.id, title: filament.product_title, error: "No TDS URL found" });
          failed++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing ${filament.product_title}:`, error);
        results.push({ 
          id: filament.id, 
          title: filament.product_title, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
        failed++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total: filaments.length,
      updated,
      failed,
      results,
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
