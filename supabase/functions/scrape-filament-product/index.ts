import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedFilament {
  product_title: string;
  vendor: string;
  material: string | null;
  color: string | null;
  color_hex: string | null;
  color_family: string | null;
  finish_type: string | null;
  variant_price: number | null;
  currency: string;
  variant_compare_at_price: number | null;
  diameter_nominal_mm: number;
  net_weight_g: number | null;
  transmission_distance: number | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  product_url: string;
  featured_image: string | null;
  tds_url: string | null;
  extraction_confidence: number;
}

interface AffiliateConfig {
  vendor_name: string;
  affiliate_url_pattern: string | null;
  affiliate_id: string | null;
  amazon_us_tag: string | null;
  amazon_uk_tag: string | null;
  amazon_de_tag: string | null;
}

const EXTRACTION_PROMPT = `You are a 3D printing filament product page parser. Extract filament specifications from this product page content.

Return ONLY valid JSON (no markdown, no code blocks) with these fields. Use null for missing values:

{
  "product_title": "Full product name as shown on page",
  "vendor": "Brand/manufacturer name (e.g., Bambu Lab, Polymaker, Overture)",
  "material": "Filament type (PLA, PETG, ABS, TPU, ASA, PLA+, etc.)",
  "color": "Color name (e.g., Jade White, Matte Black)",
  "color_hex": "Hex color code if visible (e.g., #E8F5E9)",
  "color_family": "Color category (Red, Blue, Green, Yellow, Orange, Purple, Pink, Brown, Black, White, Gray, Gold, Silver, Transparent, Multicolor)",
  "finish_type": "Matte, Silk, Glossy, Satin, Metallic, Marble, Wood, etc.",
  "variant_price": 24.99,
  "currency": "USD",
  "variant_compare_at_price": 29.99,
  "diameter_nominal_mm": 1.75,
  "net_weight_g": 1000,
  "transmission_distance": 4.2,
  "nozzle_temp_min_c": 190,
  "nozzle_temp_max_c": 220,
  "bed_temp_min_c": 45,
  "bed_temp_max_c": 60,
  "featured_image": "URL to main product image",
  "tds_url": "URL to technical data sheet PDF if found",
  "extraction_confidence": 85
}

CRITICAL FIELD - transmission_distance:
- This is the TD (Transmission Distance) value in mm used for HueForge lithophanes
- Look for "TD", "Transmission Distance", "Light Transmission", or similar terms
- Typical values range from 0.5 to 8.0 mm
- If not found, set to null

PRICING NOTES:
- Extract numeric price without currency symbols
- Currency should be "USD", "EUR", "GBP", "CAD", "AUD", etc.
- compare_at_price is the original/MSRP price if item is on sale

extraction_confidence: Rate 0-100 based on how complete and reliable the extraction is.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!roleData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping filament product URL:', url);

    // Step 1: Scrape with Firecrawl
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('FIRECRAWL_API_KEY_1');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeResponse.json();
    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || 'Failed to scrape URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pageContent = scrapeData.data?.markdown || scrapeData.markdown || '';
    const pageLinks = scrapeData.data?.links || scrapeData.links || [];
    
    console.log('Scraped content length:', pageContent.length);

    // Step 2: Extract with AI (Lovable AI / Gemini)
    const lovableKey = Deno.env.get('OPENAI_API_KEY');
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: EXTRACTION_PROMPT },
          { role: 'user', content: `Extract filament data from this product page:\n\nURL: ${formattedUrl}\n\nPage Content:\n${pageContent.substring(0, 15000)}` }
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI extraction error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'AI extraction failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    console.log('AI response:', aiContent.substring(0, 500));

    // Parse AI response
    let extracted: ScrapedFilament;
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanJson = aiContent.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.slice(7);
      }
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.slice(3);
      }
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.slice(0, -3);
      }
      
      extracted = JSON.parse(cleanJson.trim());
      extracted.product_url = formattedUrl;
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to parse extracted data',
          raw_response: aiContent.substring(0, 1000)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look for TDS URL in page links if not found
    if (!extracted.tds_url) {
      const tdsLink = pageLinks.find((link: string) => 
        link.toLowerCase().includes('tds') || 
        link.toLowerCase().includes('datasheet') ||
        link.toLowerCase().includes('technical') && link.toLowerCase().includes('.pdf')
      );
      if (tdsLink) {
        extracted.tds_url = tdsLink;
      }
    }

    // Step 3: Get affiliate suggestion
    let affiliateUrl = formattedUrl;
    let affiliateSuggestion: AffiliateConfig | null = null;
    
    try {
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey!);
      
      const { data: configs } = await adminSupabase
        .from('affiliate_configs')
        .select('vendor_name, affiliate_url_pattern, affiliate_id, amazon_us_tag, amazon_uk_tag, amazon_de_tag')
        .eq('is_active', true);

      if (configs && extracted.vendor) {
        const vendorLower = extracted.vendor.toLowerCase();
        affiliateSuggestion = configs.find((c: AffiliateConfig) => 
          vendorLower.includes(c.vendor_name.toLowerCase()) ||
          c.vendor_name.toLowerCase().includes(vendorLower)
        ) || null;

        // Apply affiliate pattern if found
        if (affiliateSuggestion?.affiliate_url_pattern) {
          affiliateUrl = affiliateSuggestion.affiliate_url_pattern
            .replace('{url}', encodeURIComponent(formattedUrl))
            .replace('{affiliate_id}', affiliateSuggestion.affiliate_id || '');
        }
      }
    } catch (affError) {
      console.error('Affiliate lookup error:', affError);
    }

    // Step 4: Check for duplicates
    let existingFilament = null;
    try {
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey!);
      
      // Try exact URL match first
      const { data: urlMatch } = await adminSupabase
        .from('filaments')
        .select('id, product_title, vendor, product_url')
        .eq('product_url', formattedUrl)
        .limit(1);

      if (urlMatch && urlMatch.length > 0) {
        existingFilament = urlMatch[0];
      } else if (extracted.vendor && extracted.product_title) {
        // Try vendor + title match
        const { data: titleMatch } = await adminSupabase
          .from('filaments')
          .select('id, product_title, vendor, product_url')
          .ilike('vendor', extracted.vendor)
          .ilike('product_title', extracted.product_title)
          .limit(1);

        if (titleMatch && titleMatch.length > 0) {
          existingFilament = titleMatch[0];
        }
      }
    } catch (dupError) {
      console.error('Duplicate check error:', dupError);
    }

    console.log('Extraction complete. Confidence:', extracted.extraction_confidence);

    return new Response(
      JSON.stringify({
        success: true,
        data: extracted,
        affiliate: {
          originalUrl: formattedUrl,
          affiliateUrl,
          suggestion: affiliateSuggestion,
        },
        existingFilament,
        scrapeMetadata: {
          contentLength: pageContent.length,
          linksFound: pageLinks.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('scrape-filament-product error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
