import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TDSData {
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  nozzle_temp_sweetspot_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  print_speed_max_mms: number | null;
  fan_min_percent: number | null;
  fan_max_percent: number | null;
  drying_temp_c: number | null;
  drying_time_hours: number | null;
  density_g_cm3: number | null;
  tensile_strength_xy_mpa: number | null;
  tensile_modulus_xy_mpa: number | null;
  elongation_break_xy_percent: number | null;
  flexural_strength_mpa: number | null;
  shore_hardness_d: number | null;
  tg_c: number | null;
  melt_temp_c: number | null;
  moisture_sensitivity_level: string | null;
  is_nozzle_abrasive: boolean | null;
  extraction_confidence: number;
  raw_text: string;
}

const TDS_EXTRACTION_PROMPT = `You are a technical data sheet (TDS) parser for 3D printing filaments. Extract all available specifications from the provided TDS content.

Return a JSON object with these fields (use null if not found):

PRINT SETTINGS:
- nozzle_temp_min_c: Minimum nozzle/hotend temperature in Celsius (number)
- nozzle_temp_max_c: Maximum nozzle/hotend temperature in Celsius (number)
- nozzle_temp_sweetspot_c: Recommended/optimal nozzle temperature in Celsius (number)
- bed_temp_min_c: Minimum bed/platform temperature in Celsius (number)
- bed_temp_max_c: Maximum bed/platform temperature in Celsius (number)
- print_speed_max_mms: Maximum print speed in mm/s (number)
- fan_min_percent: Minimum cooling fan percentage (number 0-100)
- fan_max_percent: Maximum cooling fan percentage (number 0-100)

DRYING:
- drying_temp_c: Recommended drying temperature in Celsius (number)
- drying_time_hours: Recommended drying time in hours (number)

PHYSICAL PROPERTIES:
- density_g_cm3: Density in g/cm³ (number, typically 1.0-1.5)
- tensile_strength_xy_mpa: Tensile strength in MPa (number)
- tensile_modulus_xy_mpa: Tensile/Young's modulus in MPa (number)
- elongation_break_xy_percent: Elongation at break in percent (number)
- flexural_strength_mpa: Flexural strength in MPa (number)
- shore_hardness_d: Shore D hardness (number)
- tg_c: Glass transition temperature in Celsius (number)
- melt_temp_c: Melting temperature in Celsius (number)

OTHER:
- moisture_sensitivity_level: "low", "medium", or "high"
- is_nozzle_abrasive: true if contains glass fiber, carbon fiber, metal, or other abrasive materials (boolean)
- extraction_confidence: Your confidence in the extraction accuracy from 0-100 (number)

IMPORTANT RULES:
1. Only extract values explicitly stated in the TDS
2. Convert all temperatures to Celsius
3. For temperature ranges like "200-220°C", extract min and max separately
4. For single recommended temps, use that as the sweetspot
5. Return ONLY valid JSON, no additional text

TDS CONTENT:
`;

async function fetchTDSContent(tdsUrl: string, firecrawlApiKey: string): Promise<string | null> {
  console.log(`Fetching TDS from: ${tdsUrl}`);
  
  // Handle PDF URLs - use Firecrawl to scrape
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: tdsUrl,
        formats: ['markdown'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl error:', await response.text());
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || '';
    
    if (markdown.length < 100) {
      console.log('TDS content too short, might be a download link');
      return null;
    }
    
    console.log(`Extracted ${markdown.length} characters from TDS`);
    return markdown;
  } catch (error) {
    console.error('Error fetching TDS:', error);
    return null;
  }
}

async function extractTDSWithAI(tdsContent: string, lovableApiKey: string): Promise<TDSData | null> {
  console.log('Extracting TDS data with AI...');
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: TDS_EXTRACTION_PROMPT + tdsContent.substring(0, 15000) // Limit content size
          }
        ],
        temperature: 0.1, // Low temperature for more deterministic extraction
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return null;
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    // Clean up the JSON string
    jsonStr = jsonStr.trim();
    
    try {
      const extracted = JSON.parse(jsonStr);
      console.log('Successfully extracted TDS data:', extracted);
      return {
        nozzle_temp_min_c: extracted.nozzle_temp_min_c ?? null,
        nozzle_temp_max_c: extracted.nozzle_temp_max_c ?? null,
        nozzle_temp_sweetspot_c: extracted.nozzle_temp_sweetspot_c ?? null,
        bed_temp_min_c: extracted.bed_temp_min_c ?? null,
        bed_temp_max_c: extracted.bed_temp_max_c ?? null,
        print_speed_max_mms: extracted.print_speed_max_mms ?? null,
        fan_min_percent: extracted.fan_min_percent ?? null,
        fan_max_percent: extracted.fan_max_percent ?? null,
        drying_temp_c: extracted.drying_temp_c ?? null,
        drying_time_hours: extracted.drying_time_hours ?? null,
        density_g_cm3: extracted.density_g_cm3 ?? null,
        tensile_strength_xy_mpa: extracted.tensile_strength_xy_mpa ?? null,
        tensile_modulus_xy_mpa: extracted.tensile_modulus_xy_mpa ?? null,
        elongation_break_xy_percent: extracted.elongation_break_xy_percent ?? null,
        flexural_strength_mpa: extracted.flexural_strength_mpa ?? null,
        shore_hardness_d: extracted.shore_hardness_d ?? null,
        tg_c: extracted.tg_c ?? null,
        melt_temp_c: extracted.melt_temp_c ?? null,
        moisture_sensitivity_level: extracted.moisture_sensitivity_level ?? null,
        is_nozzle_abrasive: extracted.is_nozzle_abrasive ?? null,
        extraction_confidence: extracted.extraction_confidence ?? 0,
        raw_text: tdsContent.substring(0, 5000),
      };
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, jsonStr);
      return null;
    }
  } catch (error) {
    console.error('AI extraction error:', error);
    return null;
  }
}

async function findTDSUrl(productUrl: string, firecrawlApiKey: string): Promise<string | null> {
  console.log(`Searching for TDS on product page: ${productUrl}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['html', 'links'],
        onlyMainContent: false,
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl error:', await response.text());
      return null;
    }

    const data = await response.json();
    const html = data.data?.html || '';
    const links = data.data?.links || [];
    
    // Search for TDS/datasheet links
    const tdsPatterns = [
      /href=["']([^"']*(?:tds|technical[-_]?data[-_]?sheet|datasheet|spec[-_]?sheet)[^"']*\.pdf)["']/gi,
      /href=["']([^"']*\.pdf[^"']*)["'][^>]*>(?:[^<]*(?:TDS|Technical Data|Data Sheet|Specifications))/gi,
    ];
    
    for (const pattern of tdsPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let tdsUrl = match[1];
        if (!tdsUrl.startsWith('http')) {
          const baseUrl = new URL(productUrl);
          tdsUrl = new URL(tdsUrl, baseUrl.origin).href;
        }
        console.log(`Found TDS URL: ${tdsUrl}`);
        return tdsUrl;
      }
    }
    
    // Check links array for PDF links
    for (const link of links) {
      const lowerLink = link.toLowerCase();
      if (lowerLink.includes('.pdf') && 
          (lowerLink.includes('tds') || lowerLink.includes('data') || lowerLink.includes('spec'))) {
        console.log(`Found TDS URL from links: ${link}`);
        return link;
      }
    }
    
    console.log('No TDS URL found on product page');
    return null;
  } catch (error) {
    console.error('Error finding TDS:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const { data: isAdmin } = await authClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { tds_url, product_url, filament_id } = await req.json();
    
    let finalTdsUrl = tds_url;
    
    // If no TDS URL provided, try to find one from product page
    if (!finalTdsUrl && product_url) {
      finalTdsUrl = await findTDSUrl(product_url, firecrawlApiKey);
    }
    
    if (!finalTdsUrl) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No TDS URL found',
        data: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch TDS content
    const tdsContent = await fetchTDSContent(finalTdsUrl, firecrawlApiKey);
    
    if (!tdsContent) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Could not fetch TDS content',
        tds_url: finalTdsUrl,
        data: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Extract data with AI
    const extractedData = await extractTDSWithAI(tdsContent, lovableApiKey);
    
    if (!extractedData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'AI extraction failed',
        tds_url: finalTdsUrl,
        data: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // If filament_id provided, update the database
    if (filament_id) {
      const updateData: any = {
        tds_url: finalTdsUrl,
      };
      
      // Only update non-null values
      if (extractedData.nozzle_temp_min_c !== null) updateData.nozzle_temp_min_c = extractedData.nozzle_temp_min_c;
      if (extractedData.nozzle_temp_max_c !== null) updateData.nozzle_temp_max_c = extractedData.nozzle_temp_max_c;
      if (extractedData.nozzle_temp_sweetspot_c !== null) updateData.nozzle_temp_sweetspot_c = extractedData.nozzle_temp_sweetspot_c;
      if (extractedData.bed_temp_min_c !== null) updateData.bed_temp_min_c = extractedData.bed_temp_min_c;
      if (extractedData.bed_temp_max_c !== null) updateData.bed_temp_max_c = extractedData.bed_temp_max_c;
      if (extractedData.print_speed_max_mms !== null) updateData.print_speed_max_mms = extractedData.print_speed_max_mms;
      if (extractedData.fan_min_percent !== null) updateData.fan_min_percent = extractedData.fan_min_percent;
      if (extractedData.fan_max_percent !== null) updateData.fan_max_percent = extractedData.fan_max_percent;
      if (extractedData.drying_temp_c !== null) updateData.drying_temp_c = extractedData.drying_temp_c;
      if (extractedData.drying_time_hours !== null) updateData.drying_time_hours = extractedData.drying_time_hours;
      if (extractedData.density_g_cm3 !== null) updateData.density_g_cm3 = extractedData.density_g_cm3;
      if (extractedData.tensile_strength_xy_mpa !== null) updateData.tensile_strength_xy_mpa = extractedData.tensile_strength_xy_mpa;
      if (extractedData.tensile_modulus_xy_mpa !== null) updateData.tensile_modulus_xy_mpa = extractedData.tensile_modulus_xy_mpa;
      if (extractedData.elongation_break_xy_percent !== null) updateData.elongation_break_xy_percent = extractedData.elongation_break_xy_percent;
      if (extractedData.flexural_strength_mpa !== null) updateData.flexural_strength_mpa = extractedData.flexural_strength_mpa;
      if (extractedData.shore_hardness_d !== null) updateData.shore_hardness_d = extractedData.shore_hardness_d;
      if (extractedData.tg_c !== null) updateData.tg_c = extractedData.tg_c;
      if (extractedData.melt_temp_c !== null) updateData.melt_temp_c = extractedData.melt_temp_c;
      if (extractedData.moisture_sensitivity_level !== null) updateData.moisture_sensitivity_level = extractedData.moisture_sensitivity_level;
      if (extractedData.is_nozzle_abrasive !== null) updateData.is_nozzle_abrasive = extractedData.is_nozzle_abrasive;
      
      const { error: updateError } = await supabase
        .from('filaments')
        .update(updateData)
        .eq('id', filament_id);
      
      if (updateError) {
        console.error('Database update error:', updateError);
      } else {
        console.log(`Updated filament ${filament_id} with TDS data`);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      tds_url: finalTdsUrl,
      data: extractedData,
      fields_extracted: Object.entries(extractedData)
        .filter(([k, v]) => v !== null && k !== 'raw_text' && k !== 'extraction_confidence')
        .length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in parse-filament-tds:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
