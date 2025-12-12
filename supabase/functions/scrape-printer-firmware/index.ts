const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Brand-specific firmware page URL patterns
const BRAND_FIRMWARE_URLS: Record<string, (printerName: string) => string[]> = {
  'Bambu Lab': (name) => [
    `https://wiki.bambulab.com/en/software/bambu-studio/firmware-history`,
    `https://wiki.bambulab.com/en/software`,
  ],
  'Prusa Research': (name) => [
    `https://help.prusa3d.com/tag/firmware`,
    `https://help.prusa3d.com/downloads`,
  ],
  'Creality': (name) => [
    `https://www.creality.com/pages/download`,
    `https://github.com/CrealityOfficial`,
  ],
  'Anycubic': (name) => [
    `https://www.anycubic.com/pages/firmware-software`,
  ],
  'QIDI': (name) => [
    `https://wiki.qidi3d.com/en/firmware`,
    `https://github.com/QIDITECH`,
  ],
  'Elegoo': (name) => [
    `https://www.elegoo.com/pages/3d-printing-user-support`,
  ],
  'Sovol': (name) => [
    `https://sovol3d.com/pages/download`,
  ],
  'FlashForge': (name) => [
    `https://www.flashforge.com/download-center`,
  ],
  'Raise3D': (name) => [
    `https://www.raise3d.com/download/`,
  ],
  'UltiMaker': (name) => [
    `https://support.ultimaker.com/s/article/Updating-firmware`,
  ],
};

interface FirmwareRelease {
  version: string;
  release_date: string | null;
  release_notes: string | null;
  changelog: string | null;
  download_url: string | null;
  file_size_mb: number | null;
  known_issues: string | null;
  is_latest: boolean;
  source_url: string | null;
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<any> {
  console.log(`Scraping firmware page: ${url}`);
  
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

function extractFirmwareFromMarkdown(markdown: string, printerName: string): FirmwareRelease[] {
  const releases: FirmwareRelease[] = [];
  const lines = markdown.split('\n');
  
  // Common version patterns
  const versionPatterns = [
    /v?(\d+\.\d+\.\d+(?:\.\d+)?)/gi,
    /version\s*[:\s]?\s*v?(\d+\.\d+\.\d+(?:\.\d+)?)/gi,
    /firmware\s*[:\s]?\s*v?(\d+\.\d+\.\d+(?:\.\d+)?)/gi,
  ];
  
  // Date patterns
  const datePatterns = [
    /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/g,
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g,
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/gi,
  ];
  
  let currentVersion: string | null = null;
  let currentNotes: string[] = [];
  let currentDate: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains a version number
    for (const pattern of versionPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);
      if (match) {
        // Save previous version if exists
        if (currentVersion) {
          releases.push({
            version: currentVersion,
            release_date: currentDate,
            release_notes: currentNotes.join('\n').trim() || null,
            changelog: null,
            download_url: null,
            file_size_mb: null,
            known_issues: null,
            is_latest: releases.length === 0,
            source_url: null,
          });
        }
        
        currentVersion = match[1];
        currentNotes = [];
        
        // Try to find date on same line
        for (const datePattern of datePatterns) {
          datePattern.lastIndex = 0;
          const dateMatch = datePattern.exec(line);
          if (dateMatch) {
            currentDate = dateMatch[1];
            break;
          }
        }
        break;
      }
    }
    
    // Collect notes for current version
    if (currentVersion && line.trim() && !line.startsWith('#')) {
      currentNotes.push(line.trim());
    }
  }
  
  // Don't forget the last version
  if (currentVersion) {
    releases.push({
      version: currentVersion,
      release_date: currentDate,
      release_notes: currentNotes.join('\n').trim() || null,
      changelog: null,
      download_url: null,
      file_size_mb: null,
      known_issues: null,
      is_latest: releases.length === 0,
      source_url: null,
    });
  }
  
  return releases;
}

async function useAIToExtractFirmware(
  markdown: string,
  printerName: string,
  brandName: string
): Promise<FirmwareRelease[]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.log('No Lovable API key, skipping AI extraction');
    return [];
  }
  
  console.log(`Using AI to extract firmware for ${printerName}`);
  
  // Truncate markdown to avoid token limits
  const truncatedMarkdown = markdown.slice(0, 15000);
  
  const prompt = `Extract all firmware releases for the ${printerName} 3D printer from this content. 
For each firmware release, extract:
- version (required): The version number (e.g., "1.2.3" or "v1.2.3.4")
- release_date: Date in YYYY-MM-DD format if found
- release_notes: Summary of what's new/fixed (max 500 chars)
- known_issues: Any known problems mentioned
- download_url: Direct download link if available

Only include firmware specifically for ${printerName} or compatible with it.
Return a JSON array of objects. If no firmware found, return empty array [].

Content:
${truncatedMarkdown}`;

  try {
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a firmware data extractor. Return only valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', await response.text());
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return [];
    
    // Parse the JSON response
    const parsed = JSON.parse(content);
    const firmwareArray = Array.isArray(parsed) ? parsed : (parsed.firmware || parsed.releases || []);
    
    return firmwareArray.map((fw: any, idx: number) => ({
      version: fw.version || 'Unknown',
      release_date: fw.release_date || null,
      release_notes: fw.release_notes || null,
      changelog: fw.changelog || null,
      download_url: fw.download_url || null,
      file_size_mb: fw.file_size_mb || null,
      known_issues: fw.known_issues || null,
      is_latest: idx === 0,
      source_url: null,
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

    const { printerId, brandName, printerName, firmwareUrl } = await req.json();
    
    if (!printerId || !brandName || !printerName) {
      return new Response(
        JSON.stringify({ success: false, error: 'printerId, brandName, and printerName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraping firmware for ${brandName} ${printerName} (${printerId})`);
    
    // Get URLs to scrape
    const urlGenerator = BRAND_FIRMWARE_URLS[brandName];
    let urlsToScrape: string[] = [];
    
    if (firmwareUrl) {
      urlsToScrape.push(firmwareUrl);
    }
    
    if (urlGenerator) {
      urlsToScrape = [...urlsToScrape, ...urlGenerator(printerName)];
    }
    
    // Also try a web search for firmware
    const searchUrl = `https://api.firecrawl.dev/v1/search`;
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${brandName} ${printerName} firmware download changelog`,
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
    
    let allFirmware: FirmwareRelease[] = [];
    let sourceUrl: string | null = null;
    
    // Scrape each URL
    for (const url of urlsToScrape.slice(0, 5)) {
      try {
        const scrapeResult = await scrapeWithFirecrawl(url, firecrawlKey);
        
        if (scrapeResult?.success && scrapeResult?.data?.markdown) {
          const markdown = scrapeResult.data.markdown;
          
          // Try AI extraction first
          const aiFirmware = await useAIToExtractFirmware(markdown, printerName, brandName);
          
          if (aiFirmware.length > 0) {
            allFirmware = [...allFirmware, ...aiFirmware.map(f => ({ ...f, source_url: url }))];
            sourceUrl = url;
            console.log(`AI extracted ${aiFirmware.length} firmware releases from ${url}`);
          } else {
            // Fallback to regex extraction
            const regexFirmware = extractFirmwareFromMarkdown(markdown, printerName);
            if (regexFirmware.length > 0) {
              allFirmware = [...allFirmware, ...regexFirmware.map(f => ({ ...f, source_url: url }))];
              sourceUrl = url;
              console.log(`Regex extracted ${regexFirmware.length} firmware releases from ${url}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
      }
    }
    
    // Deduplicate by version
    const uniqueFirmware = new Map<string, FirmwareRelease>();
    for (const fw of allFirmware) {
      const existing = uniqueFirmware.get(fw.version);
      if (!existing || (fw.release_notes && !existing.release_notes)) {
        uniqueFirmware.set(fw.version, fw);
      }
    }
    
    const finalFirmware = Array.from(uniqueFirmware.values());
    
    // Mark the latest one
    if (finalFirmware.length > 0) {
      finalFirmware.forEach((f, i) => f.is_latest = i === 0);
    }
    
    console.log(`Total unique firmware releases found: ${finalFirmware.length}`);
    
    // Save to database
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Delete existing firmware for this printer
    await supabase
      .from('printer_firmware')
      .delete()
      .eq('printer_id', printerId);
    
    // Insert new firmware
    if (finalFirmware.length > 0) {
      const { error: insertError } = await supabase
        .from('printer_firmware')
        .insert(finalFirmware.map(fw => ({
          printer_id: printerId,
          ...fw,
        })));
      
      if (insertError) {
        console.error('Insert error:', insertError);
      }
    }
    
    // Update printer with firmware URL if found
    if (sourceUrl) {
      await supabase
        .from('printers')
        .update({ firmware_url: sourceUrl })
        .eq('id', printerId);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        firmware_count: finalFirmware.length,
        source_url: sourceUrl,
        firmware: finalFirmware,
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