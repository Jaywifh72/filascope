import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductLineInfo {
  product_line_id: string;
  vendor: string;
  database_count: number;
  sample_title: string;
  sample_url: string | null;
  material: string | null;
}

interface AuditResult {
  productLineId: string;
  vendor: string;
  material: string | null;
  sampleProduct: {
    title: string;
    url: string | null;
  };
  databaseCount: number;
  websiteCount: number | null;
  status: 'match' | 'mismatch' | 'website_error' | 'no_url' | 'bundle_skipped';
  discrepancy: number | null;
  errorMessage: string | null;
  scrapedAt: string;
}

interface AuditReport {
  generatedAt: string;
  vendor: string | null;
  totalProductLines: number;
  auditResults: AuditResult[];
  summary: {
    matches: number;
    mismatches: number;
    websiteErrors: number;
    noUrl: number;
    bundlesSkipped: number;
    mismatchRate: string;
  };
}

// Bundle/pack detection patterns
const BUNDLE_PATTERNS = [
  'variety pack', 'sample pack', 'bundle', 'combo', 'set of',
  'multi-pack', 'multipack', '2-pack', '3-pack', '4-pack', '5-pack',
  '2 pack', '3 pack', '4 pack', '5 pack', '6 pack', '8 pack', '10 pack', '12 pack',
  '2kg', '3kg', '4kg', '5kg', '8kg', '10kg', '12kg',
  'assorted', 'collection', 'starter kit'
];

function isBundleProduct(title: string, productLineId: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerId = productLineId.toLowerCase();
  
  return BUNDLE_PATTERNS.some(pattern => 
    lowerTitle.includes(pattern) || lowerId.includes(pattern)
  );
}

// Extract color count from website using Firecrawl
async function extractColorCountFromWebsite(url: string, vendor: string, firecrawlApiKey: string): Promise<{ count: number | null; error: string | null }> {
  try {
    console.log(`Scraping ${url} for color count...`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Firecrawl error for ${url}:`, errorData);
      return { count: null, error: `HTTP ${response.status}: ${errorData.error || 'Unknown error'}` };
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      return { count: null, error: 'No content returned from scraper' };
    }

    const markdown = data.data.markdown || '';
    const html = data.data.html || '';
    
    // Different extraction strategies based on vendor/platform
    let colorCount: number | null = null;
    
    // Strategy 1: Look for color swatches in Shopify stores
    const swatchMatches = html.match(/class="[^"]*swatch[^"]*"/gi);
    if (swatchMatches && swatchMatches.length > 0) {
      // Filter for unique color-related swatches
      const colorSwatches = html.match(/data-value="[^"]+"/gi);
      if (colorSwatches) {
        const uniqueColors = new Set(colorSwatches.map((s: string) => s.toLowerCase()));
        colorCount = uniqueColors.size;
        console.log(`Found ${colorCount} color swatches for ${vendor}`);
      }
    }
    
    // Strategy 2: Look for variant options in Shopify JSON
    if (!colorCount) {
      const variantJsonMatch = html.match(/var\s+meta\s*=\s*({[^}]+})/i);
      if (variantJsonMatch) {
        try {
          const meta = JSON.parse(variantJsonMatch[1]);
          if (meta.product && meta.product.variants) {
            colorCount = meta.product.variants.length;
          }
        } catch (e) {
          // JSON parse failed, continue to next strategy
        }
      }
    }
    
    // Strategy 3: Count color-related list items in markdown
    if (!colorCount) {
      const colorListPattern = /^\s*[-*]\s*(?:\*\*)?([A-Za-z\s]+(?:Blue|Red|Green|Yellow|Orange|Purple|Pink|Black|White|Gray|Grey|Brown|Gold|Silver|Bronze|Navy|Teal|Coral|Mint|Lavender|Magenta|Cyan|Beige|Ivory|Maroon|Olive|Salmon|Turquoise|Violet|Indigo|Lime|Aqua|Fuchsia|Charcoal|Crimson|Emerald|Sapphire|Ruby|Amber|Jade|Pearl|Onyx|Ebony|Mahogany|Copper|Brass|Platinum|Champagne|Rose|Peach|Plum|Orchid|Lilac|Tangerine|Mustard|Rust|Khaki|Burgundy|Slate|Stone|Sand|Cream|Chocolate|Coffee|Mocha|Caramel|Honey|Lemon|Butter|Sky|Ocean|Forest|Grass|Moss|Pine|Cedar|Walnut|Cherry|Maple|Oak|Chestnut|Taupe|Mauve|Dusty|Pastel|Neon|Fluorescent|Metallic|Matte|Gloss|Satin|Shimmer|Sparkle|Glitter|Rainbow|Multicolor|Dual|Triple|Gradient|Ombre|Silk|Galaxy|Starry|Cosmic|Wood|Marble|Stone|Concrete|Terracotta|Clay|Brick|Tile|Glass|Crystal|Ice|Snow|Cloud|Storm|Thunder|Lightning|Fire|Flame|Blaze|Ember|Ash|Smoke|Shadow|Midnight|Eclipse|Sunset|Sunrise|Dawn|Dusk|Twilight|Moonlight|Starlight|Sunlight|Daylight)[^*\n]*)(?:\*\*)?\s*$/gim;
      const colorMatches = markdown.match(colorListPattern);
      if (colorMatches && colorMatches.length >= 3) {
        colorCount = colorMatches.length;
        console.log(`Found ${colorCount} colors via list pattern for ${vendor}`);
      }
    }
    
    // Strategy 4: Count unique color mentions for specific vendors
    if (!colorCount) {
      // For Amolen and similar, count color dropdown options
      const selectOptionMatches = html.match(/<option[^>]*>([^<]+)<\/option>/gi);
      if (selectOptionMatches && selectOptionMatches.length > 2) {
        // Filter out non-color options like sizes
        const colorOptions = selectOptionMatches.filter((opt: string) => {
          const value = opt.replace(/<[^>]+>/g, '').toLowerCase();
          return !value.includes('kg') && !value.includes('lb') && 
                 !value.includes('gram') && !value.includes('roll') &&
                 value.length > 2 && value.length < 50;
        });
        if (colorOptions.length > 0) {
          colorCount = colorOptions.length;
          console.log(`Found ${colorCount} color options from select for ${vendor}`);
        }
      }
    }
    
    // Strategy 5: AI-based extraction as fallback (count from markdown)
    if (!colorCount) {
      // Look for numbered color lists
      const numberedColorPattern = /^\d+\.\s+([A-Za-z\s]+)/gm;
      const numberedMatches = markdown.match(numberedColorPattern);
      if (numberedMatches && numberedMatches.length >= 3) {
        colorCount = numberedMatches.length;
        console.log(`Found ${colorCount} colors via numbered list for ${vendor}`);
      }
    }
    
    if (colorCount && colorCount > 0) {
      return { count: colorCount, error: null };
    }
    
    return { count: null, error: 'Could not extract color count from page' };
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return { count: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vendor, limit, skipScrape, saveResults } = await req.json();
    
    console.log(`Starting color variant audit - vendor: ${vendor || 'all'}, limit: ${limit || 'none'}, skipScrape: ${skipScrape}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('FIRECRAWL_API_KEY_1');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Query to get all unique product lines with their variant counts
    let query = supabase
      .from('filaments')
      .select('product_line_id, vendor, product_title, product_url, material')
      .not('product_line_id', 'is', null);
    
    if (vendor) {
      query = query.ilike('vendor', vendor);
    }
    
    const { data: filaments, error: queryError } = await query;
    
    if (queryError) {
      throw new Error(`Database query failed: ${queryError.message}`);
    }
    
    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          report: {
            generatedAt: new Date().toISOString(),
            vendor: vendor || null,
            totalProductLines: 0,
            auditResults: [],
            summary: { matches: 0, mismatches: 0, websiteErrors: 0, noUrl: 0, bundlesSkipped: 0, mismatchRate: '0%' }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Group by product_line_id and count variants
    const productLineMap = new Map<string, ProductLineInfo>();
    
    for (const filament of filaments) {
      if (!filament.product_line_id) continue;
      
      const existing = productLineMap.get(filament.product_line_id);
      if (existing) {
        existing.database_count++;
        // Keep the first sample URL we find
        if (!existing.sample_url && filament.product_url) {
          existing.sample_url = filament.product_url;
          existing.sample_title = filament.product_title;
        }
      } else {
        productLineMap.set(filament.product_line_id, {
          product_line_id: filament.product_line_id,
          vendor: filament.vendor || 'Unknown',
          database_count: 1,
          sample_title: filament.product_title,
          sample_url: filament.product_url,
          material: filament.material,
        });
      }
    }
    
    console.log(`Found ${productLineMap.size} unique product lines`);
    
    // Convert to array and optionally limit
    let productLines = Array.from(productLineMap.values());
    if (limit && limit > 0) {
      productLines = productLines.slice(0, limit);
    }
    
    // Generate audit run ID for grouping
    const auditRunId = crypto.randomUUID();
    
    const auditResults: AuditResult[] = [];
    
    for (const productLine of productLines) {
      const result: AuditResult = {
        productLineId: productLine.product_line_id,
        vendor: productLine.vendor,
        material: productLine.material,
        sampleProduct: {
          title: productLine.sample_title,
          url: productLine.sample_url,
        },
        databaseCount: productLine.database_count,
        websiteCount: null,
        status: 'no_url',
        discrepancy: null,
        errorMessage: null,
        scrapedAt: new Date().toISOString(),
      };
      
      // Check if this is a bundle product
      if (isBundleProduct(productLine.sample_title, productLine.product_line_id)) {
        result.status = 'bundle_skipped';
        result.errorMessage = 'Bundle/pack product - 1:1 color match not applicable';
        auditResults.push(result);
        continue;
      }
      
      // If no URL or skipping scrape, just record the database count
      if (!productLine.sample_url) {
        result.status = 'no_url';
        result.errorMessage = 'No product URL available for scraping';
        auditResults.push(result);
        continue;
      }
      
      if (skipScrape) {
        result.status = 'no_url'; // Treat as unverified when skipping
        result.errorMessage = 'Website scrape skipped';
        auditResults.push(result);
        continue;
      }
      
      // Scrape the website for color count
      if (firecrawlApiKey) {
        const { count, error } = await extractColorCountFromWebsite(
          productLine.sample_url, 
          productLine.vendor,
          firecrawlApiKey
        );
        
        if (error) {
          result.status = 'website_error';
          result.errorMessage = error;
        } else if (count !== null) {
          result.websiteCount = count;
          result.discrepancy = count - productLine.database_count;
          result.status = result.discrepancy === 0 ? 'match' : 'mismatch';
        } else {
          result.status = 'website_error';
          result.errorMessage = 'Could not determine color count';
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        result.status = 'website_error';
        result.errorMessage = 'Firecrawl API key not configured';
      }
      
      auditResults.push(result);
    }
    
    // Calculate summary
    const summary = {
      matches: auditResults.filter(r => r.status === 'match').length,
      mismatches: auditResults.filter(r => r.status === 'mismatch').length,
      websiteErrors: auditResults.filter(r => r.status === 'website_error').length,
      noUrl: auditResults.filter(r => r.status === 'no_url').length,
      bundlesSkipped: auditResults.filter(r => r.status === 'bundle_skipped').length,
      mismatchRate: '0%',
    };
    
    const verifiedCount = summary.matches + summary.mismatches;
    if (verifiedCount > 0) {
      summary.mismatchRate = `${((summary.mismatches / verifiedCount) * 100).toFixed(1)}%`;
    }
    
    const report: AuditReport = {
      generatedAt: new Date().toISOString(),
      vendor: vendor || null,
      totalProductLines: auditResults.length,
      auditResults,
      summary,
    };
    
    // Optionally save results to database
    if (saveResults) {
      const logsToInsert = auditResults.map(r => ({
        product_line_id: r.productLineId,
        vendor: r.vendor,
        database_count: r.databaseCount,
        website_count: r.websiteCount,
        status: r.status,
        sample_product_title: r.sampleProduct.title,
        sample_product_url: r.sampleProduct.url,
        discrepancy: r.discrepancy,
        error_message: r.errorMessage,
        audit_run_id: auditRunId,
      }));
      
      const { error: insertError } = await supabase
        .from('color_audit_logs')
        .insert(logsToInsert);
      
      if (insertError) {
        console.error('Failed to save audit logs:', insertError);
      } else {
        console.log(`Saved ${logsToInsert.length} audit logs with run ID ${auditRunId}`);
      }
    }
    
    console.log(`Audit complete: ${summary.matches} matches, ${summary.mismatches} mismatches, ${summary.websiteErrors} errors`);
    
    return new Response(
      JSON.stringify({ success: true, report, auditRunId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Audit error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});