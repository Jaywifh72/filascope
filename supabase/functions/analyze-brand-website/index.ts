import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const AI_GATEWAY_URL = 'https://api.openai.com/v1/chat/completions';
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

interface AnalysisRequest {
  brandSlug: string;
  forceRefresh?: boolean;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  variants: Array<{
    id: number;
    title: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    price: string;
    sku: string | null;
  }>;
  options: Array<{ name: string; values: string[] }>;
  images: Array<{ src: string; alt: string | null }>;
}

async function callOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `You are an expert at analyzing e-commerce websites, specifically 3D printer filament stores. Your job is to understand how products are structured and provide extraction rules for automated scraping. Be precise and focus on patterns, not individual examples.`
        },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    if (response.status === 402) {
      throw new Error('Payment required');
    }
    const errorText = await response.text();
    throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function fetchShopifyProducts(baseUrl: string, limit = 10): Promise<ShopifyProduct[]> {
  try {
    const url = `${baseUrl}/products.json?limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; FilamentScraper/1.0)'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch products: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    return [];
  }
}

// Non-Shopify brands (like Bambu Lab) need alternative product discovery
// Bambu Lab's collection pages are fully JS-rendered, so we use known product slugs
const BAMBULAB_KNOWN_PRODUCTS = [
  'pla-basic-filament', 'pla-matte', 'pla-silk-upgrade', 'pla-translucent',
  'petg-hf', 'petg-translucent', 'abs-filament', 'pla-tough-upgrade',
  'pla-sparkle', 'pla-metal', 'pla-galaxy', 'pla-wood', 'asa',
  'tpu-95a-hf', 'pla-cf', 'petg-cf', 'pa6-gf', 'abs-gf'
];

async function fetchProductsViaFirecrawl(baseUrl: string, productsPath: string = '/collections/all', brandSlug?: string): Promise<{ products: any[], html: string | null }> {
  console.log(`[fetchProductsViaFirecrawl] Called with baseUrl=${baseUrl}, productsPath=${productsPath}, brandSlug=${brandSlug}`);
  
  // Special handling for Bambu Lab - their collection pages are fully JS-rendered
  if (brandSlug === 'bambu-lab') {
    console.log('[fetchProductsViaFirecrawl] Using hardcoded product list for Bambu Lab');
    const products = BAMBULAB_KNOWN_PRODUCTS.slice(0, 10).map(slug => ({
      handle: slug,
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      variants: [],
      options: [],
    }));
    console.log(`[fetchProductsViaFirecrawl] Returning ${products.length} hardcoded products:`, products.map(p => p.handle));
    return { products, html: null };
  }

  if (!FIRECRAWL_API_KEY) {
    console.warn('FIRECRAWL_API_KEY not configured');
    return { products: [], html: null };
  }

  try {
    const url = `${baseUrl}${productsPath}`;
    console.log(`Fetching products via Firecrawl: ${url}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl error: ${response.status}`);
      return { products: [], html: null };
    }

    const data = await response.json();
    const html = data.data?.html || '';
    
    // Extract product links and titles from HTML
    const productLinks = html.match(/href="\/products\/([^"]+)"/gi) || [];
    const uniqueSlugs = [...new Set(productLinks.map((link: string) => {
      const match = link.match(/href="\/products\/([^"?]+)/i);
      return match ? match[1] : null;
    }).filter(Boolean))];

    // Extract product info from __NEXT_DATA__ if available (for Next.js sites)
    let nextDataProducts: any[] = [];
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const pageProps = nextData?.props?.pageProps;
        if (pageProps?.products) {
          nextDataProducts = pageProps.products;
        } else if (pageProps?.initialProducts) {
          nextDataProducts = pageProps.initialProducts;
        }
      } catch (e) {
        console.log('Could not parse __NEXT_DATA__');
      }
    }

    // Build product list from discovered slugs
    const products = (uniqueSlugs as string[]).slice(0, 10).map((slug) => ({
      handle: slug,
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      variants: [],
      options: [],
    }));

    console.log(`Found ${products.length} products via Firecrawl`);
    return { products, html };
  } catch (error) {
    console.error('Error fetching via Firecrawl:', error);
    return { products: [], html: null };
  }
}

async function fetchProductPageHTML(url: string): Promise<string | null> {
  if (!FIRECRAWL_API_KEY) {
    console.warn('FIRECRAWL_API_KEY not configured, skipping HTML analysis');
    return null;
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data?.html || null;
  } catch (error) {
    console.error('Error fetching HTML:', error);
    return null;
  }
}

function extractSwatchInfo(html: string): { type: string; count: number; samples: string[] } {
  const samples: string[] = [];
  let type = 'none';
  let count = 0;

  // Look for color swatch patterns
  const cssSwatchMatch = html.match(/background-color:\s*(#[0-9A-Fa-f]{6}|rgb\([^)]+\))/gi);
  const cssCount = cssSwatchMatch?.length ?? 0;
  if (cssCount > 0) {
    type = 'css_color';
    count = cssCount;
    samples.push(...(cssSwatchMatch?.slice(0, 5) ?? []));
  }

  // Look for image alt text swatches
  const imgAltMatch = html.match(/<img[^>]*alt="([^"]*(?:color|swatch|filament)[^"]*)"[^>]*>/gi);
  const imgCount = imgAltMatch?.length ?? 0;
  if (imgCount > cssCount) {
    type = 'image_alt';
    count = imgCount;
    samples.push(...(imgAltMatch?.slice(0, 5) ?? []));
  }

  // Look for cross-product links (common in Shopify stores)
  const linkMatch = html.match(/<a[^>]*href="\/products\/[^"]*"[^>]*>.*?<img[^>]*alt="[^"]*"[^>]*>.*?<\/a>/gis);
  const linkCount = linkMatch?.length ?? 0;
  if (linkCount > Math.max(cssCount, imgCount)) {
    type = 'cross_product_link';
    count = linkCount;
    samples.push(...(linkMatch?.slice(0, 3).map(l => l.slice(0, 200)) ?? []));
  }

  return { type, count, samples };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandSlug, forceRefresh = false }: AnalysisRequest = await req.json();

    if (!brandSlug) {
      return new Response(
        JSON.stringify({ error: 'brandSlug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get brand info
    const { data: brand, error: brandError } = await supabase
      .from('automated_brands')
      .select('*')
      .eq('brand_slug', brandSlug)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ error: `Brand not found: ${brandSlug}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing profile
    const { data: existingProfile } = await supabase
      .from('brand_scraper_profiles')
      .select('*')
      .eq('brand_slug', brandSlug)
      .single();

    // Skip if recently analyzed (within 24 hours) unless forced
    if (existingProfile && !forceRefresh) {
      const lastAnalyzed = new Date(existingProfile.last_analyzed_at || 0);
      const hoursSinceAnalysis = (Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60);
      if (hoursSinceAnalysis < 24) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            profile: existingProfile,
            message: 'Using cached profile (analyzed within 24 hours)'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Analyzing brand: ${brand.display_name} (${brandSlug})`);

    // Step 1: Fetch sample products - try Shopify JSON first, then Firecrawl fallback
    let products: any[] = [];
    let productHtml: string | null = null;
    let isShopify = brand.platform_type === 'shopify';
    
    // Try Shopify JSON API first (only for Shopify stores)
    if (isShopify) {
      products = await fetchShopifyProducts(brand.base_url, 10);
    }
    
    // Fallback to Firecrawl for non-Shopify stores or if Shopify JSON failed
    if (products.length === 0) {
      console.log(`[Main] Shopify JSON unavailable or not Shopify platform, using Firecrawl for ${brandSlug}`);
      isShopify = false;
      
      // Determine collection path based on brand
      let collectionPath = '/collections/all';
      if (brandSlug === 'bambu-lab') {
        collectionPath = '/collections/filament';
      }
      
      console.log(`[Main] Calling fetchProductsViaFirecrawl with brandSlug=${brandSlug}`);
      const firecrawlResult = await fetchProductsViaFirecrawl(brand.base_url, collectionPath, brandSlug);
      products = firecrawlResult.products;
      productHtml = firecrawlResult.html;
      console.log(`[Main] fetchProductsViaFirecrawl returned ${products.length} products`);
    }
    
    if (products.length === 0) {
      console.error(`[Main] No products found for ${brandSlug} after all attempts`);
      return new Response(
        JSON.stringify({ error: 'Could not fetch products from brand website (tried Shopify JSON and Firecrawl)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Main] Fetched ${products.length} sample products (source: ${isShopify ? 'Shopify JSON' : 'Firecrawl'}):`, products.map((p: any) => p.handle));

    // Step 2: Fetch HTML from a sample product page for swatch analysis (if not already fetched)
    if (!productHtml && products[0]?.handle) {
      // Use US store URL for Bambu Lab (their base_url may not have regional subdomain)
      const productBaseUrl = brandSlug === 'bambu-lab' 
        ? 'https://us.store.bambulab.com' 
        : brand.base_url;
      const sampleProductUrl = `${productBaseUrl}/products/${products[0].handle}`;
      console.log(`[Main] Fetching product HTML from: ${sampleProductUrl}`);
      productHtml = await fetchProductPageHTML(sampleProductUrl);
    }
    const swatchInfo = productHtml ? extractSwatchInfo(productHtml) : { type: 'none', count: 0, samples: [] };

    // Step 3: Prepare data for AI analysis
    const sampleProductsData = products.slice(0, 5).map(p => ({
      title: p.title,
      handle: p.handle,
      productType: p.product_type || 'filament',
      options: p.options || [],
      variantSamples: (p.variants || []).slice(0, 3).map((v: any) => ({
        title: v.title,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
        sku: v.sku
      }))
    }));

    // Step 4: AI Analysis
    const dataSource = isShopify ? 'Shopify JSON API' : 'Firecrawl HTML Scrape';
    const analysisPrompt = `Analyze this 3D printer filament e-commerce website to understand its product architecture.

BRAND: ${brand.display_name}
WEBSITE: ${brand.base_url}
PLATFORM: ${brand.platform_type}${brand.platform_type !== 'shopify' ? ' (custom platform, NOT Shopify)' : ''}

SAMPLE PRODUCTS (from ${dataSource}):
${JSON.stringify(sampleProductsData, null, 2)}

SWATCH DETECTION FROM HTML:
- Type detected: ${swatchInfo.type}
- Count: ${swatchInfo.count}
${swatchInfo.samples.length > 0 ? `- Samples: ${swatchInfo.samples.join('\n')}` : ''}

Analyze and respond with this exact JSON structure:
{
  "productStructure": "one_product_per_color" | "multi_color_variants" | "hybrid",
  "variantSchema": {
    "option1": "what option1 represents (color/material/diameter/weight/size)",
    "option2": "what option2 represents or null",
    "option3": "what option3 represents or null"
  },
  "swatchType": "css_color" | "image_alt" | "cross_product_link" | "none",
  "titleFormatPattern": "description of title format, e.g., 'ProductLine, Color, Diameter' or 'ProductLine - Color (Weight)'",
  "colorExtractionRules": [
    "Rule 1: Primary method to extract color",
    "Rule 2: Fallback method",
    "..."
  ],
  "productLineExtractionRules": [
    "Rule 1: How to identify product line from title",
    "Rule 2: How to identify from handle",
    "..."
  ],
  "discoveredProductLines": ["Standard PLA", "Pro PETG", "..."],
  "discoveredColors": [
    {"name": "Natural", "hex": "#F5F5DC"},
    {"name": "Matte Black", "hex": "#1A1A1A"},
    "..."
  ],
  "materialPatterns": {
    "PLA": ["pla", "standard pla", "pla+"],
    "PETG": ["petg", "workday petg"],
    "..."
  },
  "specialCases": [
    "Any special handling notes, e.g., 'ReFuel products have multiple materials in one Shopify product'",
    "..."
  ],
  "analysisConfidence": 0.0 to 1.0,
  "analysisNotes": "Summary of key findings and any uncertainties"
}

Be precise and derive rules from the actual data, not assumptions.`;

    console.log('Calling AI for analysis...');
    const aiResponse = await callOpenAI(analysisPrompt);
    
    // Parse AI response - strip markdown code blocks if present
    let analysis;
    try {
      let cleanedResponse = aiResponse;
      
      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/i, '');
      cleanedResponse = cleanedResponse.replace(/\n?```\s*$/i, '');
      cleanedResponse = cleanedResponse.trim();
      
      // Find the JSON object in the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('AI Response:', aiResponse);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI analysis', rawResponse: aiResponse.slice(0, 500) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Upsert the profile
    const profileData = {
      brand_slug: brandSlug,
      brand_id: brand.id,
      product_structure: analysis.productStructure || 'multi_color_variants',
      variant_schema: analysis.variantSchema || {},
      swatch_type: analysis.swatchType || swatchInfo.type || 'none',
      title_format_pattern: analysis.titleFormatPattern || null,
      color_extraction_rules: analysis.colorExtractionRules || [],
      product_line_extraction_rules: analysis.productLineExtractionRules || [],
      price_interpretation: 'per_spool',
      product_line_synonyms: {},
      color_hex_mappings: analysis.discoveredColors?.reduce((acc: Record<string, string>, c: any) => {
        if (c.name && c.hex) acc[c.name.toLowerCase()] = c.hex;
        return acc;
      }, {}) || {},
      material_patterns: analysis.materialPatterns || {},
      discovered_product_lines: analysis.discoveredProductLines || [],
      discovered_colors: analysis.discoveredColors || [],
      special_cases: analysis.specialCases || [],
      last_analyzed_at: new Date().toISOString(),
      analysis_confidence: analysis.analysisConfidence || 0.7,
      sample_products: sampleProductsData,
      analysis_notes: analysis.analysisNotes || null,
      updated_at: new Date().toISOString()
    };

    const { data: profile, error: upsertError } = await supabase
      .from('brand_scraper_profiles')
      .upsert(profileData, { onConflict: 'brand_slug' })
      .select()
      .single();

    if (upsertError) {
      console.error('Failed to save profile:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save profile', details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Profile saved for ${brandSlug} with confidence ${analysis.analysisConfidence}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile,
        message: `Brand profile ${existingProfile ? 'updated' : 'created'} successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-brand-website:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
