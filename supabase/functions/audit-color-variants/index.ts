import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FilamentRow {
  id: string;
  product_title: string;
  product_url: string | null;
  product_line_id: string | null;
  vendor: string | null;
  material: string | null;
  color_hex: string | null;
  net_weight_g: number | null;
}

interface ProductLineInfo {
  product_line_id: string;
  vendor: string;
  database_count: number;
  sample_title: string;
  sample_url: string | null;
  material: string | null;
  filaments: FilamentRow[];
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
  uiDisplayCount: number;
  websiteCount: number | null;
  status: 'match' | 'mismatch' | 'data_quality_issue' | 'website_error' | 'no_url' | 'bundle_skipped';
  discrepancy: number | null;
  hexDuplicates: string[];
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
    dataQualityIssues: number;
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

// ============== UI DEDUPLICATION LOGIC (from useFilamentColorVariants.ts) ==============
// This replicates the exact logic used by the UI to count unique colors

const COLOR_WORDS = [
  'Beige', 'Black', 'Blue', 'Brown', 'Burgundy', 'Charcoal', 'Copper', 'Cream', 'Cyan',
  'Gold', 'Gray', 'Grey', 'Green', 'Ivory', 'Lavender', 'Magenta', 'Maroon', 'Navy',
  'Olive', 'Orange', 'Peach', 'Pink', 'Purple', 'Red', 'Rose', 'Salmon', 'Silver',
  'Tan', 'Teal', 'Turquoise', 'Violet', 'White', 'Yellow', 'Natural', 'Clear', 'Transparent',
];

const PRODUCT_VARIANT_TERMS = [
  'Matte', 'Matt', 'Silk', 'Glitter', 'Silk Glitter', 'Carbon Fiber', 'CF',
  'Recycled', 'CMYK Bundle', 'CMYK', 'Bundle', 'Bulk Buy', 'Wood Fill', 'HF', 'High Flow',
  '10 rolls', '10 packs', 'Pack', 'Pellets', 'Large-Format',
  'Conductive', 'ESD', 'Performance', 'Essentials', 'Basics',
];

function cleanProductTitle(title: string): string {
  let cleaned = title.trim();
  // Remove marketing suffixes
  cleaned = cleaned.replace(/\s*-?\s*Bambu\s+AMS\s+Compatible\s*$/i, '');
  cleaned = cleaned.replace(/\s*-?\s*AMS\s+Compatible\s*$/i, '');
  cleaned = cleaned.replace(/\s*-?\s*Bambu\s+Compatible\s*$/i, '');
  cleaned = cleaned.replace(/\s*\|\s*Matter3D\s*$/i, '');
  cleaned = cleaned.replace(/\s*\|\s*[\w\s]+$/i, '');
  // Remove weight/diameter patterns
  cleaned = cleaned.replace(/\s*,?\s*\d+(?:\.\d+)?\s*mm.*$/i, '');
  cleaned = cleaned.replace(/\s*,?\s*\d+(?:\.\d+)?\s*(?:kg|g|KG|G).*$/i, '');
  return cleaned.replace(/\s+/g, ' ').trim();
}

function getBaseProductName(title: string): string {
  const cleanedTitle = cleanProductTitle(title);
  let normalizedTitle = cleanedTitle
    .replace(/\s*\(NFC\)\s*/gi, '')
    .replace(/\s+Refill\s*$/gi, '')
    .trim();
  
  // AMOLEN-specific product lines
  const amelonProductLines = [
    'Crystal-Transparent Gradient Variety Pack', 'Gradient Variety Pack', 'Variety Pack',
    'Basic-High Speed', 'Basic High Speed', 'Basic Dual Color-High Speed', 'Basic Dual Color',
    'Matte Rainbow', 'Matte Triple', 'Matte Dual', 'Matte Basic', 'Matte Tri-Color',
    'Silk Rainbow', 'Silk Triple', 'Silk Dual', 'Silk Starry', 'Silk Tri-Color',
    'Transparent Rainbow', 'Crystal-Transparent',
    'Matte', 'Silk', 'Marble', 'Marble Texture', 'Sparkle', 'Galaxy', 'Glow in the Dark', 'Glow',
    'Wood', 'Carbon Fiber', 'Metal', 'Transparent', 'Clear',
    'Basic', '90A Flexible', '95A Flexible', '85A',
  ];
  const sortedProductLines = [...amelonProductLines].sort((a, b) => b.length - a.length);
  
  for (const productLine of sortedProductLines) {
    const regex = new RegExp(
      `^((?:PLA\\+?|PETG|ABS|TPU|TPE|ASA|PEBA|PA\\d*|PC|HIPS|PVA|Nylon)\\s+${productLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?:[,\\s]+Filament)?(?:[,\\s]+[\\d.]+\\s*mm.*|[,\\s]+.+)?$`,
      'i'
    );
    const match = normalizedTitle.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  
  // Pattern: Handle "Brand Material Color Weight"
  const weightMatch = normalizedTitle.match(/^(.+?\s+(?:PLA\+?|PETG|ABS|TPU|TPE|ASA|PA\d*|PC(?:\s+Blend)?|HIPS|PVA|Nylon|PA11\s+Carbon\s+Fiber))\s+.+?\s+\d+(?:\.\d+)?(?:kg|g)\s*$/i);
  if (weightMatch) return weightMatch[1].trim();
  
  // Pattern: "Brand Material - Variant" (dash separator)
  const dashMatch = normalizedTitle.match(/^(.+?)\s+-\s+(.+)$/);
  if (dashMatch) {
    const beforeDash = dashMatch[1].trim();
    const afterDash = dashMatch[2].trim();
    const startsWithVariant = PRODUCT_VARIANT_TERMS.some(term => 
      afterDash.toLowerCase().startsWith(term.toLowerCase())
    );
    if (startsWithVariant) {
      return normalizedTitle.replace(/\s+Bambu\s+AMS\s+Compatible\s*$/i, '').replace(/\s+AMS\s+Compatible\s*$/i, '').trim();
    }
    return beforeDash;
  }
  
  // Pattern: Check for color word at the end
  const sortedColors = [...COLOR_WORDS].sort((a, b) => b.length - a.length);
  for (const color of sortedColors) {
    const regex = new RegExp(`^(.+?)\\s+${color}$`, 'i');
    const match = normalizedTitle.match(regex);
    if (match) return match[1].trim();
  }
  
  return normalizedTitle;
}

function isProductVariant(term: string): boolean {
  const termLower = term.toLowerCase();
  return PRODUCT_VARIANT_TERMS.some(v => termLower.includes(v.toLowerCase()));
}

function getColorFromTitle(title: string, baseName: string): string | null {
  const cleanedTitle = cleanProductTitle(title);
  
  let cleanTitle = cleanedTitle
    .replace(/\s*\(NFC\)\s*/gi, '')
    .replace(/\s+Refill\s*$/gi, '')
    .replace(/\s+\d+(?:\.\d+)?(?:kg|g)\s*$/gi, '')
    .trim();
  
  const cleanTitleNoFilament = cleanTitle.replace(/\s+Filament\b/gi, '').trim();
  
  if (cleanTitleNoFilament === baseName || cleanTitle === baseName) return null;
  
  // Pattern: parentheses color
  const parenMatch = cleanTitle.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const extracted = parenMatch[1].trim();
    if (isProductVariant(extracted)) return null;
    return extracted;
  }
  
  // Pattern: Dash separator
  const dashMatch = cleanedTitle.match(/^.+?\s+-\s+(.+?)(?:\s+\d+(?:\.\d+)?(?:kg|g))?(?:\s*\(NFC\))?(?:\s+Refill)?$/i);
  if (dashMatch) {
    const extracted = dashMatch[1].trim();
    if (isProductVariant(extracted)) return null;
    return extracted;
  }
  
  // Fallback: check with "Filament" stripped first (handles Amolen pattern)
  if (cleanTitleNoFilament.startsWith(baseName)) {
    const extracted = cleanTitleNoFilament.slice(baseName.length).replace(/^[\s-]+/, '').trim();
    if (!extracted || isProductVariant(extracted)) return null;
    return extracted;
  }
  
  // Original fallback: everything after base name
  if (cleanTitle.startsWith(baseName)) {
    const extracted = cleanTitle.slice(baseName.length).replace(/^[\s-]+/, '').trim();
    if (!extracted || isProductVariant(extracted)) return null;
    return extracted;
  }
  
  return null;
}

function normalizeColorName(colorName: string, vendor: string): string {
  let normalized = colorName.toLowerCase().trim();
  const brandPrefixes = [
    'prusa', 'prusament', 'bambu', 'bambulab', 'creality', 'anycubic',
    'polymaker', 'esun', 'hatchbox', 'overture', 'sunlu', 'elegoo', 'amolen'
  ];
  const vendorLower = vendor?.toLowerCase() || '';
  const allPrefixes = [...brandPrefixes, vendorLower].filter(Boolean);
  
  for (const prefix of allPrefixes) {
    if (normalized.startsWith(prefix + ' ')) {
      normalized = normalized.slice(prefix.length).trim();
      break;
    }
  }
  return normalized;
}

/**
 * Simulates the UI deduplication logic from useFilamentColorVariants
 * Returns the count of unique colors that would be displayed in the UI
 * Also returns which hex codes are duplicated (data quality issue)
 */
function calculateUiDisplayCount(filaments: FilamentRow[]): { count: number; hexDuplicates: string[] } {
  if (!filaments.length) return { count: 0, hexDuplicates: [] };
  
  const vendor = filaments[0].vendor || '';
  const baseName = getBaseProductName(filaments[0].product_title);
  
  const seenColors = new Set<string>();
  const hexToColors = new Map<string, string[]>(); // Track which colors share a hex
  let uniqueCount = 0;
  
  for (const filament of filaments) {
    const colorName = getColorFromTitle(filament.product_title, baseName);
    const hasColorHex = filament.color_hex && filament.color_hex.length > 0;
    
    // Skip variants with no color identifier
    if (!colorName && !hasColorHex) {
      continue;
    }
    
    // Determine the color key used for deduplication
    let colorKey: string;
    if (colorName) {
      colorKey = normalizeColorName(colorName, vendor);
    } else {
      colorKey = filament.color_hex?.toLowerCase() || filament.id;
    }
    
    // Track hex duplicates for data quality reporting
    if (filament.color_hex) {
      const hexLower = filament.color_hex.toLowerCase();
      const existing = hexToColors.get(hexLower) || [];
      existing.push(colorName || filament.product_title);
      hexToColors.set(hexLower, existing);
    }
    
    if (!seenColors.has(colorKey)) {
      seenColors.add(colorKey);
      uniqueCount++;
    }
  }
  
  // Identify hex codes that are duplicated (same hex for different colors)
  const hexDuplicates: string[] = [];
  for (const [hex, colors] of hexToColors) {
    if (colors.length > 1) {
      hexDuplicates.push(`${hex}: ${colors.join(', ')}`);
    }
  }
  
  return { count: uniqueCount, hexDuplicates };
}

// ============== END UI DEDUPLICATION LOGIC ==============

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
    
    let colorCount: number | null = null;
    
    // Strategy 1: Look for color swatches in Shopify stores
    const swatchMatches = html.match(/class="[^"]*swatch[^"]*"/gi);
    if (swatchMatches && swatchMatches.length > 0) {
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
      const colorListPattern = /^\s*[-*]\s*(?:\*\*)?([A-Za-z\s]+(?:Blue|Red|Green|Yellow|Orange|Purple|Pink|Black|White|Gray|Grey|Brown|Gold|Silver|Rainbow|Clear|Transparent)[^*\n]*)(?:\*\*)?\s*$/gim;
      const colorMatches = markdown.match(colorListPattern);
      if (colorMatches && colorMatches.length >= 3) {
        colorCount = colorMatches.length;
        console.log(`Found ${colorCount} colors via list pattern for ${vendor}`);
      }
    }
    
    // Strategy 4: Count unique color mentions for specific vendors
    if (!colorCount) {
      const selectOptionMatches = html.match(/<option[^>]*>([^<]+)<\/option>/gi);
      if (selectOptionMatches && selectOptionMatches.length > 2) {
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
    
    // Strategy 5: Look for numbered color lists
    if (!colorCount) {
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
    
    // Query to get all filaments with product_line_id
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, product_line_id, vendor, material, color_hex, net_weight_g')
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
            summary: { matches: 0, mismatches: 0, dataQualityIssues: 0, websiteErrors: 0, noUrl: 0, bundlesSkipped: 0, mismatchRate: '0%' }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Group by product_line_id and collect all filaments for each line
    const productLineMap = new Map<string, ProductLineInfo>();
    
    for (const filament of filaments) {
      if (!filament.product_line_id) continue;
      
      const existing = productLineMap.get(filament.product_line_id);
      if (existing) {
        existing.database_count++;
        existing.filaments.push(filament as FilamentRow);
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
          filaments: [filament as FilamentRow],
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
      // Calculate UI display count using the deduplication logic
      const { count: uiDisplayCount, hexDuplicates } = calculateUiDisplayCount(productLine.filaments);
      
      const result: AuditResult = {
        productLineId: productLine.product_line_id,
        vendor: productLine.vendor,
        material: productLine.material,
        sampleProduct: {
          title: productLine.sample_title,
          url: productLine.sample_url,
        },
        databaseCount: productLine.database_count,
        uiDisplayCount,
        websiteCount: null,
        status: 'no_url',
        discrepancy: null,
        hexDuplicates,
        errorMessage: null,
        scrapedAt: new Date().toISOString(),
      };
      
      // Check for data quality issues (DB count != UI display count)
      const hasDataQualityIssue = productLine.database_count !== uiDisplayCount && hexDuplicates.length > 0;
      
      // Check if this is a bundle product
      if (isBundleProduct(productLine.sample_title, productLine.product_line_id)) {
        result.status = 'bundle_skipped';
        result.errorMessage = 'Bundle/pack product - 1:1 color match not applicable';
        auditResults.push(result);
        continue;
      }
      
      // If no URL or skipping scrape, just record the database count
      if (!productLine.sample_url) {
        result.status = hasDataQualityIssue ? 'data_quality_issue' : 'no_url';
        result.errorMessage = hasDataQualityIssue ? `Data quality issue: ${hexDuplicates.length} duplicate hex codes` : 'No product URL available for scraping';
        auditResults.push(result);
        continue;
      }
      
      if (skipScrape) {
        result.status = hasDataQualityIssue ? 'data_quality_issue' : 'no_url';
        result.errorMessage = hasDataQualityIssue ? `Data quality issue: ${hexDuplicates.length} duplicate hex codes` : 'Website scrape skipped';
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
          result.status = hasDataQualityIssue ? 'data_quality_issue' : 'website_error';
          result.errorMessage = hasDataQualityIssue ? `Data quality issue + ${error}` : error;
        } else if (count !== null) {
          result.websiteCount = count;
          // Compare UI display count vs website count
          result.discrepancy = count - uiDisplayCount;
          
          if (hasDataQualityIssue) {
            result.status = 'data_quality_issue';
            result.errorMessage = `${hexDuplicates.length} duplicate hex codes causing incorrect UI display`;
          } else if (result.discrepancy === 0) {
            result.status = 'match';
          } else {
            result.status = 'mismatch';
          }
        } else {
          result.status = hasDataQualityIssue ? 'data_quality_issue' : 'website_error';
          result.errorMessage = hasDataQualityIssue ? `Data quality issue: Could not determine color count` : 'Could not determine color count';
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        result.status = hasDataQualityIssue ? 'data_quality_issue' : 'website_error';
        result.errorMessage = hasDataQualityIssue ? `Data quality issue + Firecrawl API key not configured` : 'Firecrawl API key not configured';
      }
      
      auditResults.push(result);
    }
    
    // Calculate summary
    const summary = {
      matches: auditResults.filter(r => r.status === 'match').length,
      mismatches: auditResults.filter(r => r.status === 'mismatch').length,
      dataQualityIssues: auditResults.filter(r => r.status === 'data_quality_issue').length,
      websiteErrors: auditResults.filter(r => r.status === 'website_error').length,
      noUrl: auditResults.filter(r => r.status === 'no_url').length,
      bundlesSkipped: auditResults.filter(r => r.status === 'bundle_skipped').length,
      mismatchRate: '0%',
    };
    
    const verifiedCount = summary.matches + summary.mismatches + summary.dataQualityIssues;
    if (verifiedCount > 0) {
      const problemCount = summary.mismatches + summary.dataQualityIssues;
      summary.mismatchRate = `${((problemCount / verifiedCount) * 100).toFixed(1)}%`;
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
    
    console.log(`Audit complete: ${summary.matches} matches, ${summary.mismatches} mismatches, ${summary.dataQualityIssues} data quality issues`);
    
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
