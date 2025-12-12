const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Brand-specific software page URL patterns
const BRAND_SOFTWARE_URLS: Record<string, (printerName: string) => string[]> = {
  'Bambu Lab': () => [
    'https://wiki.bambulab.com/en/software/bambu-studio',
    'https://github.com/bambulab/BambuStudio/releases',
    'https://bambulab.com/en/download',
  ],
  'Prusa Research': () => [
    'https://www.prusa3d.com/page/prusaslicer_424/',
    'https://github.com/prusa3d/PrusaSlicer/releases',
    'https://help.prusa3d.com/tag/prusaslicer',
  ],
  'Creality': () => [
    'https://www.creality.com/pages/download',
    'https://github.com/CrealityOfficial/Ender-3S1/releases',
  ],
  'Anycubic': () => [
    'https://www.anycubic.com/pages/firmware-software',
  ],
  'QIDI': () => [
    'https://wiki.qidi3d.com/en/software',
    'https://github.com/QIDITECH/QIDISlicer/releases',
  ],
  'Elegoo': () => [
    'https://www.elegoo.com/pages/3d-printing-user-support',
  ],
};

interface SoftwareRelease {
  software_name: string;
  software_type: string;
  version: string;
  release_date: string | null;
  release_notes: string | null;
  changelog: string | null;
  download_url: string | null;
  is_latest: boolean;
  source_url: string | null;
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<any> {
  console.log(`Scraping software page: ${url}`);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'links'],
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Firecrawl error for ${url}:`, error);
    return null;
  }

  return await response.json();
}

async function useAIToExtractSoftware(
  markdown: string,
  printerName: string,
  brandName: string,
  sourceUrl: string
): Promise<SoftwareRelease[]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.log('No Lovable API key, skipping AI extraction');
    return [];
  }
  
  console.log(`Using AI to extract software for ${printerName}`);
  
  const truncatedMarkdown = markdown.slice(0, 30000);
  
  const prompt = `You are extracting SOFTWARE release information for the "${brandName}" 3D printer brand from this webpage content.

Extract information about SLICERS, STUDIO SOFTWARE, and MOBILE APPS - NOT printer firmware.

For ${brandName}, look for:
${brandName === 'Bambu Lab' ? '- Bambu Studio (slicer/studio)\n- Bambu Handy (mobile app)\n- Network plugin' : ''}
${brandName === 'Prusa Research' ? '- PrusaSlicer (slicer)\n- Prusa Connect (app/cloud)' : ''}
${brandName === 'Creality' ? '- Creality Print (slicer)\n- Creality Cloud (app)' : ''}
${brandName === 'Anycubic' ? '- Anycubic Slicer\n- Anycubic App' : ''}
${brandName === 'QIDI' ? '- QIDI Slicer\n- QIDI Print' : ''}

For EACH software release you find, extract:
1. **software_name** (required): The name of the software (e.g., "Bambu Studio", "PrusaSlicer")
2. **software_type** (required): One of: "slicer", "studio", "app", "plugin"
3. **version** (required): The exact version number (e.g., "1.9.5", "2.8.0")
4. **release_date**: The release date in YYYY-MM-DD format
5. **release_notes**: DETAILED description of what's in this release including:
   - New features added
   - Bug fixes
   - Improvements
   - New printer/material profiles
   Format as readable summary with bullet points if multiple items.
6. **changelog**: Additional technical changes if available
7. **download_url**: Direct download link if available

IMPORTANT:
- Extract software that works with ${brandName} printers, especially ${printerName}
- DO NOT include printer firmware versions
- Extract ALL version releases found, not just the latest
- Include detailed release notes about actual changes

Return a JSON object with a "releases" array. Example:
{
  "releases": [
    {
      "software_name": "Bambu Studio",
      "software_type": "slicer",
      "version": "1.9.5",
      "release_date": "2024-12-01",
      "release_notes": "### New Features\\n- Added support for new filament profiles\\n- Improved print time estimation\\n\\n### Bug Fixes\\n- Fixed layer height preview",
      "changelog": null,
      "download_url": "https://..."
    }
  ]
}

Content to extract from:
${truncatedMarkdown}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a software changelog parser. Extract detailed, accurate software release information from webpage content. Return valid JSON only. Focus on slicer software and apps, NOT firmware.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', await response.text());
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return [];
    
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }
    
    const parsed = JSON.parse(jsonContent);
    const softwareArray = Array.isArray(parsed) ? parsed : (parsed.releases || parsed.software || []);
    
    // Filter out anything that looks like firmware
    const firmwarePatterns = [
      /firmware/i,
      /^v?\d+\.\d+\.\d+\.\d+$/,  // Firmware often has 4-part version
    ];
    
    const filteredSoftware = softwareArray.filter((sw: any) => {
      const name = sw.software_name || '';
      const notes = sw.release_notes || '';
      const combined = `${name} ${notes}`.toLowerCase();
      
      // Skip if it looks like firmware
      if (combined.includes('firmware')) {
        console.log(`Filtering out firmware entry: ${name} ${sw.version}`);
        return false;
      }
      
      return true;
    });
    
    console.log(`AI extracted ${softwareArray.length} releases, kept ${filteredSoftware.length} after filtering`);
    
    return filteredSoftware.map((sw: any, idx: number) => ({
      software_name: sw.software_name || 'Unknown',
      software_type: sw.software_type || 'slicer',
      version: sw.version || 'Unknown',
      release_date: sw.release_date || null,
      release_notes: sw.release_notes || null,
      changelog: sw.changelog || null,
      download_url: sw.download_url || null,
      is_latest: false, // Will be set later per software_name
      source_url: sourceUrl,
    }));
  } catch (error) {
    console.error('AI extraction error:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!firecrawlKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const { printerId, brandName, printerName } = await req.json();
    
    if (!printerId || !brandName || !printerName) {
      return new Response(
        JSON.stringify({ success: false, error: 'printerId, brandName, and printerName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraping software for ${brandName} ${printerName} (${printerId})`);
    
    // Get URLs to scrape
    const urlGenerator = BRAND_SOFTWARE_URLS[brandName];
    let urlsToScrape: string[] = [];
    
    if (urlGenerator) {
      urlsToScrape = urlGenerator(printerName);
    }
    
    // Also try a web search for software
    const searchUrl = `https://api.firecrawl.dev/v1/search`;
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${brandName} slicer software download changelog releases`,
        limit: 5,
      }),
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const searchUrls = searchData.data?.map((r: any) => r.url).filter(Boolean) || [];
      urlsToScrape = [...urlsToScrape, ...searchUrls];
    }
    
    // Deduplicate URLs
    urlsToScrape = [...new Set(urlsToScrape)];
    console.log(`URLs to scrape: ${urlsToScrape.length}`);
    
    let allSoftware: SoftwareRelease[] = [];
    
    // Scrape each URL
    for (const url of urlsToScrape.slice(0, 5)) {
      try {
        const scrapeResult = await scrapeWithFirecrawl(url, firecrawlKey);
        
        if (scrapeResult?.success && scrapeResult?.data?.markdown) {
          const markdown = scrapeResult.data.markdown;
          
          const aiSoftware = await useAIToExtractSoftware(markdown, printerName, brandName, url);
          
          if (aiSoftware.length > 0) {
            allSoftware = [...allSoftware, ...aiSoftware];
            console.log(`AI extracted ${aiSoftware.length} software releases from ${url}`);
          }
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
      }
    }
    
    // Deduplicate by software_name + version
    const uniqueSoftware = new Map<string, SoftwareRelease>();
    for (const sw of allSoftware) {
      const key = `${sw.software_name}:${sw.version}`;
      const existing = uniqueSoftware.get(key);
      if (!existing || (sw.release_notes && sw.release_notes.length > (existing.release_notes?.length || 0))) {
        uniqueSoftware.set(key, sw);
      }
    }
    
    let finalSoftware = Array.from(uniqueSoftware.values());
    
    // Sort by software_name then by date and mark latest per software
    finalSoftware.sort((a, b) => {
      if (a.software_name !== b.software_name) {
        return a.software_name.localeCompare(b.software_name);
      }
      if (a.release_date && b.release_date) {
        return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
      }
      if (a.release_date) return -1;
      if (b.release_date) return 1;
      return 0;
    });
    
    // Mark latest for each software_name
    const seenSoftware = new Set<string>();
    finalSoftware = finalSoftware.map(sw => {
      if (!seenSoftware.has(sw.software_name)) {
        seenSoftware.add(sw.software_name);
        return { ...sw, is_latest: true };
      }
      return sw;
    });
    
    console.log(`Total unique software releases found: ${finalSoftware.length}`);
    
    // Save to database
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Delete existing software for this printer
    await supabase
      .from('printer_software')
      .delete()
      .eq('printer_id', printerId);
    
    // Insert new software
    if (finalSoftware.length > 0) {
      const { error: insertError } = await supabase
        .from('printer_software')
        .insert(finalSoftware.map(sw => ({
          printer_id: printerId,
          ...sw,
        })));
      
      if (insertError) {
        console.error('Insert error:', insertError);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        software_count: finalSoftware.length,
        software: finalSoftware,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
