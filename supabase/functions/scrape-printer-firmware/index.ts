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
  brandName: string,
  sourceUrl: string
): Promise<FirmwareRelease[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    console.log('No Lovable API key, skipping AI extraction');
    return [];
  }
  
  console.log(`Using AI to extract firmware for ${printerName}`);
  
  // Truncate markdown to avoid token limits but keep more for detailed notes
  const truncatedMarkdown = markdown.slice(0, 30000);
  
  const prompt = `You are extracting DETAILED PRINTER FIRMWARE release information for the "${brandName} ${printerName}" 3D printer from this webpage content.

CRITICAL - ONLY EXTRACT PRINTER FIRMWARE:
- INCLUDE: Printer firmware (runs on the printer itself, controls motion, heating, AMS, etc.)
- EXCLUDE: Slicer software (Bambu Studio, PrusaSlicer, Cura, OrcaSlicer, etc.)
- EXCLUDE: Desktop/mobile apps
- EXCLUDE: Network plugins or add-ons
- EXCLUDE: Handy app versions

For EACH printer firmware release you find, extract:
1. **version** (required): The exact version number (e.g., "1.2.3.4", "v2.0.1")
2. **release_date**: The release date in YYYY-MM-DD format
3. **release_notes**: DETAILED description of what's in this release. Include:
   - New features added
   - Bug fixes
   - Improvements and optimizations
   - Hardware compatibility changes
   - Print quality improvements
   Format as a readable summary with bullet points if multiple items. Be comprehensive but concise (max 2000 chars).
4. **changelog**: Additional technical changes if available (separate from release_notes)
5. **known_issues**: Any bugs or limitations mentioned for this version
6. **download_url**: Direct download link to the firmware file if available

IMPORTANT:
- Only include PRINTER FIRMWARE specifically for "${printerName}" or its variants
- DO NOT include Bambu Studio, Bambu Handy, PrusaSlicer, or any other software versions
- Extract ALL firmware releases found, not just the latest
- The release_notes should contain the ACTUAL content of what changed
- If release notes list specific improvements like "improved first layer calibration", include those details

Return a JSON object with a "releases" array. Example:
{
  "releases": [
    {
      "version": "1.2.3.4",
      "release_date": "2024-12-01",
      "release_notes": "### New Features\\n- Added support for high-speed PLA profiles\\n- Improved AMS material detection\\n\\n### Bug Fixes\\n- Fixed first layer calibration issue\\n- Resolved WiFi connectivity problems",
      "changelog": "Technical: Updated motion control algorithms",
      "known_issues": "May require bed re-leveling after update",
      "download_url": "https://..."
    }
  ]
}

Content to extract from:
${truncatedMarkdown}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a firmware changelog parser. Extract detailed, accurate firmware release information from webpage content. Return valid JSON only. Include comprehensive release notes with specific features and fixes mentioned in the source.' 
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
    
    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }
    
    // Parse the JSON response
    const parsed = JSON.parse(jsonContent);
    const firmwareArray = Array.isArray(parsed) ? parsed : (parsed.releases || parsed.firmware || []);
    
    console.log(`AI extracted ${firmwareArray.length} firmware releases`);
    
    // Filter out software versions (Bambu Studio, slicers, apps, etc.)
    const softwarePatterns = [
      /bambu\s*studio/i,
      /orca\s*slicer/i,
      /prusa\s*slicer/i,
      /cura/i,
      /handy/i,
      /network\s*plugin/i,
      /desktop\s*app/i,
      /mobile\s*app/i,
      /slicer/i,
      /studio/i,
      /luban/i,
      /creality\s*print/i,
      /flashprint/i,
      /ideamaker/i,
      /qidi\s*slicer/i,
      /elegoo\s*link/i,
      /anycubic\s*app/i,
    ];
    
    // Brand-specific software names to exclude from firmware
    const BRAND_SOFTWARE_NAMES: Record<string, string[]> = {
      'Bambu Lab': ['Bambu Studio', 'Bambu Handy', 'Bambu Suite', 'Network Plugin', 'Farm Manager'],
      'Prusa Research': ['PrusaSlicer', 'Prusa Connect', 'Prusa App'],
      'Creality': ['Creality Print', 'Creality Cloud', 'Creality Sonic'],
      'Anycubic': ['Anycubic Slicer', 'Anycubic Photon Workshop', 'Anycubic App'],
      'QIDI': ['QIDI Slicer', 'QIDI Print', 'QIDISlicer'],
      'Elegoo': ['CHITUBOX', 'ELEGOO Link', 'Elegoo Mars'],
      'FlashForge': ['FlashPrint', 'FlashCloud', 'FlashDLPrint'],
      'Raise3D': ['ideaMaker', 'RaiseCloud'],
      'UltiMaker': ['UltiMaker Cura', 'UltiMaker Digital Factory'],
      'Sovol': ['Sovol Cura', 'Klipper'],
      'Snapmaker': ['Snapmaker Luban'],
    };
    
    // Brand-specific firmware version patterns (what IS firmware)
    const BRAND_FIRMWARE_VERSION_PATTERNS: Record<string, RegExp[]> = {
      // Bambu Lab firmware: 01.xx.xx.xx format (always starts with 0)
      'Bambu Lab': [/^0[0-9]\.\d{2}\.\d{2}\.\d{2}$/],
      // Prusa firmware: 5.x.x or 4.x.x format
      'Prusa Research': [/^[345]\.\d+\.\d+(-\w+)?$/],
      // Creality firmware: Various formats
      'Creality': [/^[12]\.\d+\.\d+(\.\d+)?$/, /^Marlin/i],
      // Anycubic firmware: V1.x.x or similar
      'Anycubic': [/^V?[12]\.\d+\.\d+$/i],
      // QIDI firmware: V2.x.x or V3.x.x
      'QIDI': [/^V?[23]\.\d+\.\d+$/i],
    };
    
    // Check if download URL or notes indicate software, not firmware
    const isSoftwareByContent = (fw: any): boolean => {
      const downloadUrl = (fw.download_url || '').toLowerCase();
      const notes = (fw.release_notes || '').toLowerCase();
      const changelog = (fw.changelog || '').toLowerCase();
      const combined = `${downloadUrl} ${notes} ${changelog}`;
      
      // Check for brand-specific software names
      const brandSoftware = BRAND_SOFTWARE_NAMES[brandName] || [];
      for (const swName of brandSoftware) {
        if (combined.includes(swName.toLowerCase())) {
          console.log(`Filtering by brand software name: ${swName}`);
          return true;
        }
      }
      
      // Check for software-related content
      if (combined.includes('bambu studio') || combined.includes('bambustudio')) return true;
      if (combined.includes('orcaslicer') || combined.includes('orca slicer')) return true;
      if (combined.includes('prusaslicer') || combined.includes('prusa slicer')) return true;
      if (combined.includes('bambu handy')) return true;
      if (combined.includes('farm manager')) return true;
      if (combined.includes('bambu suite')) return true;
      if (combined.includes('network plugin')) return true;
      if (combined.includes('flashprint')) return true;
      if (combined.includes('ideamaker')) return true;
      if (combined.includes('creality print')) return true;
      if (combined.includes('creality cloud')) return true;
      if (combined.includes('chitubox')) return true;
      if (downloadUrl.includes('bambustudio') || downloadUrl.includes('bambu-studio')) return true;
      if (downloadUrl.includes('github.com/bambulab/bambustudio')) return true;
      if (downloadUrl.includes('github.com/prusa3d/prusaslicer')) return true;
      if (downloadUrl.includes('github.com/softfever/orcaslicer')) return true;
      
      // Filter out forum scraping garbage
      if (combined.includes('forum.bambulab.com')) return true;
      if (combined.includes('user_avatar')) return true;
      if (combined.includes('letter_avatar')) return true;
      if (notes.includes('views') && notes.includes('likes') && notes.includes('users')) return true;
      
      return false;
    };
    
    // Software version patterns - these are NOT firmware versions
    const isSoftwareVersionPattern = (version: string): boolean => {
      const v = version.replace(/^v/i, '').trim();
      
      // Check if version matches brand-specific firmware pattern (whitelist approach)
      const firmwarePatterns = BRAND_FIRMWARE_VERSION_PATTERNS[brandName];
      if (firmwarePatterns) {
        const matchesFirmwarePattern = firmwarePatterns.some(pattern => pattern.test(v) || pattern.test(version));
        if (matchesFirmwarePattern) {
          return false; // This IS firmware, not software
        }
      }
      
      // Bambu Studio/software uses 2.x.x.x or 3.x.x format (without leading zero)
      // While Bambu firmware uses 01.xx.xx.xx format
      if (brandName === 'Bambu Lab') {
        // Software: 2.x.x, 2.x.x.x, 3.x.x
        if (/^[23]\.\d+\.\d+(\.\d+)?$/.test(v)) return true;
        // Check for firmware format - 01.xx.xx.xx
        if (/^0[0-9]\.\d{2}\.\d{2}\.\d{2}$/.test(v)) return false; // This IS firmware
      }
      
      // Generic software patterns (starting with 2.x or 3.x for slicers)
      if (/^[23]\.\d+\.\d+(\.\d+)?$/.test(v)) {
        return true;
      }
      
      // Detect version patterns that look like slicer/studio versions
      // (starting with small numbers like 1.x.x or 2.x.x without leading zeros)
      // Firmware typically uses 01.xx.xx.xx format with leading zeros
      if (/^[1-9]\.[0-9]+\.[0-9]+$/.test(v) && !v.includes('01.')) {
        // But some brands use this for firmware too, check brand-specific
        if (brandName !== 'Prusa Research' && brandName !== 'Creality') {
          return true;
        }
      }
      
      return false;
    };
    
    // Check if release notes look like junk/forum scraping
    const isJunkContent = (fw: any): boolean => {
      const notes = (fw.release_notes || '');
      
      // Forum metadata patterns
      if (/\d+\s*views\s*\d+\s*likes/i.test(notes)) return true;
      if (/\d+\s*users\s*read/i.test(notes)) return true;
      if (/Post date|Last edited by/i.test(notes)) return true;
      if (/!\[.*\]\(https:\/\/forum/i.test(notes)) return true;
      
      return false;
    };
    
    // Strict firmware version validation - WHITELIST approach for brands with known patterns
    const isValidFirmwareVersion = (version: string): boolean => {
      const v = version.replace(/^v/i, '').trim();
      
      // Bambu Lab: MUST match 01.xx.xx.xx format (starts with 0, 4 segments of 2 digits)
      if (brandName === 'Bambu Lab') {
        const isValid = /^0[0-9]\.\d{2}\.\d{2}\.\d{2}$/.test(v);
        if (!isValid) {
          console.log(`[Bambu] Rejecting non-firmware version format: ${version}`);
        }
        return isValid;
      }
      
      // Prusa: Must match 5.x.x, 4.x.x, or 3.x.x format
      if (brandName === 'Prusa Research') {
        return /^[345]\.\d+\.\d+(-\w+)?$/.test(v);
      }
      
      // Other brands - use existing logic but be strict about software patterns
      const firmwarePatterns = BRAND_FIRMWARE_VERSION_PATTERNS[brandName];
      if (firmwarePatterns) {
        return firmwarePatterns.some(pattern => pattern.test(v) || pattern.test(version));
      }
      
      // Default: reject obvious software version patterns (2.x.x, 3.x.x)
      if (/^[23]\.\d+\.\d+(\.\d+)?$/.test(v)) {
        console.log(`Rejecting software version pattern: ${version}`);
        return false;
      }
      
      return true;
    };
    
    const filteredFirmware = firmwareArray.filter((fw: any) => {
      const version = fw.version || '';
      const notes = fw.release_notes || '';
      const combined = `${version} ${notes}`.toLowerCase();
      
      // FIRST: Validate firmware version format (whitelist for Bambu Lab)
      if (!isValidFirmwareVersion(version)) {
        return false;
      }
      
      // Check content for software indicators
      if (isSoftwareByContent(fw)) {
        console.log(`Filtering out software by content: ${version}`);
        return false;
      }
      
      // Check if version looks like software (2.x.x patterns)
      if (isSoftwareVersionPattern(version)) {
        console.log(`Filtering out software version pattern: ${version}`);
        return false;
      }
      
      // Filter out junk/forum content
      if (isJunkContent(fw)) {
        console.log(`Filtering out junk content: ${version}`);
        return false;
      }
      
      // Filter out "Unknown" versions
      if (version === 'Unknown' || version === '') {
        console.log(`Filtering out invalid version: ${version}`);
        return false;
      }
      
      // Check if this looks like software, not firmware based on content patterns
      for (const pattern of softwarePatterns) {
        if (pattern.test(combined) && !combined.includes('firmware')) {
          console.log(`Filtering out software version: ${version}`);
          return false;
        }
      }
      return true;
    });
    
    console.log(`AI extracted ${firmwareArray.length} releases, kept ${filteredFirmware.length} after filtering software`);
    
    return filteredFirmware.map((fw: any, idx: number) => ({
      version: fw.version || 'Unknown',
      release_date: fw.release_date || null,
      release_notes: fw.release_notes || null,
      changelog: fw.changelog || null,
      download_url: fw.download_url || null,
      file_size_mb: fw.file_size_mb ? parseFloat(fw.file_size_mb) : null,
      known_issues: fw.known_issues || null,
      is_latest: idx === 0,
      source_url: sourceUrl,
    }));
  } catch (error) {
    console.error('AI extraction error:', error);
    return [];
  }
}

// Fetch detailed release notes from individual source pages
async function fetchDetailedReleaseNotes(
  firmware: FirmwareRelease[],
  firecrawlKey: string,
  printerName: string,
  brandName: string
): Promise<FirmwareRelease[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return firmware;
  
  // Only fetch details for releases with source URLs that have sparse notes
  const needsDetails = firmware.filter(f => 
    f.source_url && 
    (!f.release_notes || f.release_notes.length < 100)
  ).slice(0, 3); // Limit to 3 to avoid timeouts
  
  if (needsDetails.length === 0) return firmware;
  
  console.log(`Fetching detailed notes for ${needsDetails.length} releases`);
  
  for (const release of needsDetails) {
    if (!release.source_url) continue;
    
    try {
      const scrapeResult = await scrapeWithFirecrawl(release.source_url, firecrawlKey);
      
      if (scrapeResult?.success && scrapeResult?.data?.markdown) {
        const markdown = scrapeResult.data.markdown.slice(0, 20000);
        
        const detailPrompt = `Extract the detailed release notes for firmware version "${release.version}" of the ${brandName} ${printerName} from this content.

Include:
- All new features
- Bug fixes
- Improvements
- Any compatibility notes
- Known issues

Return a JSON object with:
{
  "release_notes": "detailed notes here with markdown formatting",
  "changelog": "technical changelog if separate",
  "known_issues": "any known issues",
  "download_url": "direct download link if found"
}

Content:
${markdown}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Extract detailed firmware release notes. Return valid JSON only.' },
              { role: 'user', content: detailPrompt }
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          
          if (content) {
            let jsonContent = content;
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) jsonContent = jsonMatch[1].trim();
            
            const details = JSON.parse(jsonContent);
            
            // Update the release with detailed info
            const idx = firmware.findIndex(f => f.version === release.version);
            if (idx !== -1) {
              if (details.release_notes) firmware[idx].release_notes = details.release_notes;
              if (details.changelog) firmware[idx].changelog = details.changelog;
              if (details.known_issues) firmware[idx].known_issues = details.known_issues;
              if (details.download_url) firmware[idx].download_url = details.download_url;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching details for ${release.version}:`, error);
    }
  }
  
  return firmware;
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
          
          // Try AI extraction first with source URL
          const aiFirmware = await useAIToExtractFirmware(markdown, printerName, brandName, url);
          
          if (aiFirmware.length > 0) {
            allFirmware = [...allFirmware, ...aiFirmware];
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
      if (!existing || (fw.release_notes && fw.release_notes.length > (existing.release_notes?.length || 0))) {
        uniqueFirmware.set(fw.version, fw);
      }
    }
    
    let finalFirmware = Array.from(uniqueFirmware.values());
    
    // Mark the latest one (sort by date first if available)
    finalFirmware.sort((a, b) => {
      if (a.release_date && b.release_date) {
        return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
      }
      if (a.release_date) return -1;
      if (b.release_date) return 1;
      return 0;
    });
    
    if (finalFirmware.length > 0) {
      finalFirmware.forEach((f, i) => f.is_latest = i === 0);
    }
    
    // Fetch detailed release notes for releases with sparse notes
    finalFirmware = await fetchDetailedReleaseNotes(finalFirmware, firecrawlKey, printerName, brandName);
    
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