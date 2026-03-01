const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BRAND_SLUG_MAP: Record<string, string> = {
  'Fiberlogy': 'fiberlogy',
  'Overture': 'overture',
  'TreeD Filaments': 'treed-filaments',
  'Ultimaker': 'ultimaker',
  'Proto-Pasta': 'proto-pasta',
  'FormFutura': 'formfutura',
  'Fillamentum': 'fillamentum',
  'Fusion Filaments': 'fusion-filaments',
  'Geeetech': 'geeetech',
  'VoxelPLA': 'voxelpla',
  'Push Plastic': 'push-plastic',
  'Hatchbox': 'hatchbox',
  'Prusament': 'prusament',
  'ColorFabb': 'colorfabb',
  'Polymaker': 'polymaker',
  'eSUN': 'esun',
  'Sunlu': 'sunlu',
  'Bambu Lab': 'bambu-lab',
  'Amolen': 'amolen',
  'Extrudr': 'extrudr',
  'Inland': 'inland',
  'Eryone': 'eryone',
  'Creality': 'creality',
  'Anycubic': 'anycubic',
  'Duramic 3D': 'duramic-3d',
  'Siraya Tech': 'siraya-tech',
  'Gizmo Dorks': 'gizmo-dorks',
  'Paramount 3D': 'paramount-3d',
  'Spectrum Filaments': 'spectrum-filaments',
  'AzureFilm': 'azurefilm',
  'Atomic Filament': 'atomic-filament',
};

const BASE_URL = 'https://3dfilamentprofiles.com/filaments';
const FIRECRAWL_API = 'https://api.firecrawl.dev/v1/scrape';
const RATE_LIMIT_MS = 2000;
const TIME_LIMIT_MS = 120_000;

interface BrandResult {
  brand: string;
  pages: number;
  totalRows: number;
  withTd: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  error?: string;
}

interface ParsedRow {
  brand: string;
  material: string;
  type: string;
  color: string;
  hex: string;
  td: number;
}

/** Extract link text from markdown `[text](url)` or return raw text */
function extractText(cell: string): string {
  const match = cell.trim().match(/^\[([^\]]*)\]\([^)]*\)$/);
  return match ? match[1].trim() : cell.trim();
}

/** Parse hex from a cell like `#FF0000` or `[#FF0000](...)` */
function extractHex(cell: string): string {
  const text = extractText(cell);
  const match = text.match(/#?([0-9A-Fa-f]{6})/);
  return match ? match[1].toUpperCase() : '';
}

/** Parse TD value from cell — could be `[0.3](url)` or just `0.3` */
function extractTd(cell: string): number | null {
  const text = extractText(cell);
  if (!text || text === '⊕' || text === '-' || text === '—') return null;
  const val = parseFloat(text);
  return isNaN(val) ? null : val;
}

/** Build material_type from Material + Type columns */
function buildMaterialType(material: string, type: string): string {
  if (!type || type.toLowerCase() === material.toLowerCase()) return material;
  // If type contains the material name, use type as-is (e.g., "PolyTerra PLA" stays)
  if (type.toLowerCase().includes(material.toLowerCase())) return type;
  // Otherwise combine: "PLA" + "Basic" -> "PLA Basic"
  return `${material} ${type}`.trim();
}

/** Parse markdown table rows from Firecrawl output */
function parseMarkdownTable(markdown: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    // Skip non-table lines and header/separator rows
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1); // Remove empty first/last from split
    if (cells.length < 6) continue;

    // Skip header row (contains "Brand" or "BRAND" text)
    const firstCell = extractText(cells[0]);
    if (firstCell.toLowerCase() === 'brand' || firstCell.startsWith('---')) continue;

    const brand = extractText(cells[0]);
    const material = extractText(cells[1]);
    const type = extractText(cells[2]);
    const color = extractText(cells[3]);
    const hex = extractHex(cells[4]);
    const td = extractTd(cells[5]);

    if (!brand || !material || !color) continue;
    if (td === null) continue; // Only interested in rows with TD values

    rows.push({ brand, material, type, color, hex, td });
  }

  return rows;
}

/** Extract total page count from "Page X of Y" text */
function parseTotalPages(markdown: string): number {
  const match = markdown.match(/Page\s+\d+\s+of\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<{ success: boolean; markdown?: string; error?: string }> {
  const response = await fetch(FIRECRAWL_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.error || `HTTP ${response.status}` };
  }

  const markdown = data.data?.markdown || data.markdown || '';
  return { success: true, markdown };
}

async function processBrand(
  brandName: string,
  slug: string,
  firecrawlKey: string,
  supabaseUrl: string,
  serviceRoleKey: string,
  startTime: number,
): Promise<BrandResult> {
  const result: BrandResult = { brand: brandName, pages: 0, totalRows: 0, withTd: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    // Fetch page 1
    const url1 = `${BASE_URL}/${slug}`;
    console.log(`Scraping ${brandName}: ${url1}`);
    let scrapeResult = await scrapeWithFirecrawl(url1, firecrawlKey);

    // Retry once on failure
    if (!scrapeResult.success) {
      console.log(`Retry for ${brandName} after 5s...`);
      await new Promise(r => setTimeout(r, 5000));
      scrapeResult = await scrapeWithFirecrawl(url1, firecrawlKey);
    }

    if (!scrapeResult.success) {
      result.error = scrapeResult.error || 'Firecrawl failed';
      return result;
    }

    const totalPages = parseTotalPages(scrapeResult.markdown!);
    result.pages = totalPages;

    // Collect all rows across pages
    const allRows: ParsedRow[] = [];
    const page1Rows = parseMarkdownTable(scrapeResult.markdown!);
    allRows.push(...page1Rows);

    // Fetch remaining pages
    for (let page = 2; page <= totalPages; page++) {
      // Time guard
      if (Date.now() - startTime > TIME_LIMIT_MS) {
        console.log(`Time limit approaching, stopping at page ${page - 1}/${totalPages} for ${brandName}`);
        break;
      }

      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
      const pageUrl = `${BASE_URL}/${slug}?page=${page}`;
      console.log(`Scraping ${brandName} page ${page}/${totalPages}`);
      const pageResult = await scrapeWithFirecrawl(pageUrl, firecrawlKey);

      if (pageResult.success && pageResult.markdown) {
        const rows = parseMarkdownTable(pageResult.markdown);
        allRows.push(...rows);
      } else {
        console.warn(`Failed to fetch page ${page} for ${brandName}: ${pageResult.error}`);
        result.errors++;
      }
    }

    result.totalRows = allRows.length;
    result.withTd = allRows.length; // All rows already filtered to have TD

    // Upsert to database
    if (allRows.length > 0) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const db = createClient(supabaseUrl, serviceRoleKey);

      // Build values for bulk upsert
      const values = allRows.map(row => ({
        brand_name: brandName, // Use our canonical brand name
        color_name: row.color,
        material_type: buildMaterialType(row.material, row.type),
        td_value: row.td,
        color_hex: row.hex || null,
        source: '3dfilamentprofiles_auto',
        confidence: 'medium',
      }));

      // Upsert in batches of 50
      const BATCH_SIZE = 50;
      for (let i = 0; i < values.length; i += BATCH_SIZE) {
        const batch = values.slice(i, i + BATCH_SIZE);

        const { data, error } = await db
          .from('td_reference_values')
          .upsert(batch, {
            onConflict: 'brand_name,material_type,color_name',
            ignoreDuplicates: false,
          })
          .select('id');

        if (error) {
          // If upsert fails (likely due to the functional index), fall back to individual inserts
          console.warn(`Batch upsert failed, falling back to individual: ${error.message}`);
          for (const val of batch) {
            try {
              // Check if exists with high confidence
              const { data: existing } = await db
                .from('td_reference_values')
                .select('id, confidence, td_value')
                .ilike('brand_name', val.brand_name)
                .ilike('material_type', val.material_type)
                .ilike('color_name', val.color_name)
                .limit(1)
                .single();

              if (existing) {
                if (existing.confidence === 'high') {
                  result.skipped++;
                } else if (existing.td_value !== val.td_value) {
                  await db
                    .from('td_reference_values')
                    .update({ td_value: val.td_value, color_hex: val.color_hex, source: val.source, updated_at: new Date().toISOString() })
                    .eq('id', existing.id);
                  result.updated++;
                } else {
                  result.skipped++;
                }
              } else {
                await db.from('td_reference_values').insert(val);
                result.inserted++;
              }
            } catch (e) {
              console.warn(`Error upserting row: ${JSON.stringify(val)}`, e);
              result.errors++;
            }
          }
        } else {
          // Batch succeeded — approximate counts
          result.inserted += batch.length;
        }
      }
    }
  } catch (e: any) {
    result.error = e.message || String(e);
    console.error(`Error processing ${brandName}:`, e);
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand, allBrands } = await req.json();

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const startTime = Date.now();
    const results: BrandResult[] = [];

    if (allBrands) {
      // Process all brands
      for (const [brandName, slug] of Object.entries(BRAND_SLUG_MAP)) {
        if (Date.now() - startTime > TIME_LIMIT_MS) {
          console.log('Time limit reached, stopping.');
          break;
        }
        const r = await processBrand(brandName, slug, firecrawlKey, supabaseUrl, serviceRoleKey, startTime);
        results.push(r);
        console.log(`${brandName}: ${r.withTd} TD values, ${r.inserted} inserted, ${r.updated} updated, ${r.skipped} skipped`);
        // Rate limit between brands
        if (Date.now() - startTime < TIME_LIMIT_MS) {
          await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
        }
      }
    } else if (brand) {
      // Find slug for the specified brand
      const slug = BRAND_SLUG_MAP[brand];
      if (!slug) {
        return new Response(
          JSON.stringify({ success: false, error: `Unknown brand: ${brand}. Available: ${Object.keys(BRAND_SLUG_MAP).join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const r = await processBrand(brand, slug, firecrawlKey, supabaseUrl, serviceRoleKey, startTime);
      results.push(r);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Provide "brand" or "allBrands: true"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Completed in ${elapsed}s. Processed ${results.length} brands.`);

    return new Response(
      JSON.stringify({ success: true, results, elapsed_seconds: parseFloat(elapsed) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('scrape-td-values error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
