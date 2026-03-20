const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Brand-specific software page URL patterns - prioritize GitHub releases for version history
const BRAND_SOFTWARE_URLS: Record<string, (printerName: string) => string[]> = {
  'Bambu Lab': () => [
    // GitHub releases first - has comprehensive version history
    'https://github.com/bambulab/BambuStudio/releases',
    'https://wiki.bambulab.com/en/software/bambu-studio/release-notes',
    'https://wiki.bambulab.com/en/software/bambu-studio',
    'https://bambulab.com/en/download',
  ],
  'Prusa Research': () => [
    // GitHub releases for full version history
    'https://github.com/prusa3d/PrusaSlicer/releases',
    'https://www.prusa3d.com/page/prusaslicer_424/',
    'https://help.prusa3d.com/tag/prusaslicer',
  ],
  'Creality': () => [
    'https://github.com/CrealityOfficial/CrealityPrint/releases',
    'https://www.creality.com/pages/download',
  ],
  'Anycubic': () => [
    'https://www.anycubic.com/pages/firmware-software',
  ],
  'QIDI': () => [
    'https://github.com/QIDITECH/QIDISlicer/releases',
    'https://wiki.qidi3d.com/en/software',
  ],
  'Elegoo': () => [
    'https://www.elegoo.com/pages/3d-printing-user-support',
  ],
  'UltiMaker': () => [
    'https://github.com/Ultimaker/Cura/releases',
    'https://ultimaker.com/software/ultimaker-cura/',
  ],
  'FlashForge': () => [
    'https://www.flashforge.com/download-center',
  ],
  'Raise3D': () => [
    'https://github.com/nickvf/ideaMaker/releases',
    'https://www.raise3d.com/ideamaker/',
  ],
  'Snapmaker': () => [
    'https://github.com/Snapmaker/Luban/releases',
    'https://snapmaker.com/snapmaker-luban',
  ],
  'Sovol': () => [
    'https://github.com/Sovol3d/SV08/releases',
  ],
};

// Known mobile apps with their app store URLs
const KNOWN_MOBILE_APPS: Record<string, { name: string; google_play_url: string; app_store_url: string }[]> = {
  'Bambu Lab': [
    {
      name: 'Bambu Handy',
      google_play_url: 'https://play.google.com/store/apps/details?id=com.bambulab.handy',
      app_store_url: 'https://apps.apple.com/app/bambu-handy/id1589027990',
    },
  ],
  'Prusa Research': [
    {
      name: 'Prusa',
      google_play_url: 'https://play.google.com/store/apps/details?id=cz.prusa3d.connect',
      app_store_url: 'https://apps.apple.com/app/prusa/id1497002502',
    },
  ],
  'Creality': [
    {
      name: 'Creality Cloud',
      google_play_url: 'https://play.google.com/store/apps/details?id=com.creality.crealitycloud',
      app_store_url: 'https://apps.apple.com/app/creality-cloud/id1581055918',
    },
  ],
  'Anycubic': [
    {
      name: 'Anycubic',
      google_play_url: 'https://play.google.com/store/apps/details?id=com.anycubic.anycubicapp',
      app_store_url: 'https://apps.apple.com/app/anycubic/id1599852498',
    },
  ],
  'Elegoo': [
    {
      name: 'ELEGOO Link',
      google_play_url: 'https://play.google.com/store/apps/details?id=com.elegoo.link',
      app_store_url: 'https://apps.apple.com/app/elegoo-link/id1625893710',
    },
  ],
  'FlashForge': [
    {
      name: 'FlashCloud',
      google_play_url: 'https://play.google.com/store/apps/details?id=com.flashforge.flashcloud',
      app_store_url: 'https://apps.apple.com/app/flashcloud/id1492131878',
    },
  ],
  'Raise3D': [
    {
      name: 'Raise3D',
      google_play_url: 'https://play.google.com/store/apps/details?id=com.raise3d.raise3d',
      app_store_url: 'https://apps.apple.com/app/raise3d/id1456391305',
    },
  ],
  'Snapmaker': [
    {
      name: 'Snapmaker Luban',
      google_play_url: 'https://play.google.com/store/apps/details?id=com.snapmaker.luban',
      app_store_url: 'https://apps.apple.com/app/snapmaker-luban/id1593159908',
    },
  ],
};

// Known desktop software with download URLs
const KNOWN_DESKTOP_SOFTWARE: Record<string, { name: string; software_type: string; download_url: string; description: string }[]> = {
  'Bambu Lab': [
    {
      name: 'Bambu Studio',
      software_type: 'slicer',
      download_url: 'https://bambulab.com/en/download/studio',
      description: 'Official slicer software for Bambu Lab printers. Slice 3D models and manage print settings.',
    },
  ],
  'Prusa Research': [
    {
      name: 'PrusaSlicer',
      software_type: 'slicer',
      download_url: 'https://www.prusa3d.com/page/prusaslicer_424/',
      description: 'Official slicer software for Prusa printers. Open-source with advanced features.',
    },
  ],
  'Creality': [
    {
      name: 'Creality Print',
      software_type: 'slicer',
      download_url: 'https://www.creality.com/pages/download',
      description: 'Official slicer software for Creality printers.',
    },
  ],
  'QIDI': [
    {
      name: 'QIDI Slicer',
      software_type: 'slicer',
      download_url: 'https://github.com/QIDITECH/QIDISlicer/releases',
      description: 'Official slicer software for QIDI printers based on OrcaSlicer.',
    },
  ],
  'UltiMaker': [
    {
      name: 'UltiMaker Cura',
      software_type: 'slicer',
      download_url: 'https://ultimaker.com/software/ultimaker-cura/',
      description: 'Popular open-source slicer software developed by UltiMaker.',
    },
  ],
  'FlashForge': [
    {
      name: 'FlashPrint',
      software_type: 'slicer',
      download_url: 'https://www.flashforge.com/download-center',
      description: 'Official slicer software for FlashForge printers.',
    },
  ],
  'Raise3D': [
    {
      name: 'ideaMaker',
      software_type: 'slicer',
      download_url: 'https://www.raise3d.com/ideamaker/',
      description: 'Official slicer software for Raise3D printers with advanced features.',
    },
  ],
  'Snapmaker': [
    {
      name: 'Snapmaker Luban',
      software_type: 'studio',
      download_url: 'https://snapmaker.com/snapmaker-luban',
      description: 'All-in-one software for Snapmaker machines: 3D printing, CNC, and laser.',
    },
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
  download_url_windows: string | null;
  download_url_mac: string | null;
  download_url_linux: string | null;
  supported_platforms: string[];
  is_latest: boolean;
  source_url: string | null;
  is_mobile_app: boolean;
  google_play_url: string | null;
  app_store_url: string | null;
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<any> {
  console.log(`Scraping software page: ${url}`);
  
  // For GitHub releases, we want more content
  const isGitHub = url.includes('github.com');
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'links'],
      onlyMainContent: !isGitHub, // Get full page for GitHub to capture all releases
      waitFor: isGitHub ? 5000 : 3000, // Wait longer for GitHub pages
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
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    console.log('No Lovable API key, skipping AI extraction');
    return [];
  }
  
  console.log(`Using AI to extract software for ${printerName}`);
  
  // Increase limit for GitHub releases pages which have more content
  const isGitHubReleases = sourceUrl.includes('github.com') && sourceUrl.includes('releases');
  const truncatedMarkdown = markdown.slice(0, isGitHubReleases ? 60000 : 30000);
  
  // Brand-specific software information
  const BRAND_SOFTWARE_INFO: Record<string, string> = {
    'Bambu Lab': `Known Bambu Lab software:
- Bambu Studio: Desktop slicer software (versions like 1.x.x, 2.x.x). INCLUDE ALL VERSIONS.
- Bambu Handy: Mobile app for iOS/Android. INCLUDE with app store links.
- Network Plugin: Browser plugin for connecting to printers.

IMPORTANT: Bambu Studio versions are like 1.9.5, 2.0.0, 2.1.0 - these are SOFTWARE, NOT firmware.
Bambu Lab FIRMWARE uses format 01.xx.xx.xx (starts with 0). Do NOT include firmware versions.`,
    'Prusa Research': `Known Prusa software:
- PrusaSlicer: Desktop slicer (versions like 2.x.x). INCLUDE ALL VERSIONS.
- Prusa Connect: Cloud/mobile app. INCLUDE with app store links.
- Prusa App: Mobile companion app.

Prusa FIRMWARE uses format 5.x.x or 4.x.x. PrusaSlicer is SOFTWARE (2.x.x format).`,
    'Creality': `Known Creality software:
- Creality Print: Desktop slicer software. INCLUDE ALL VERSIONS.
- Creality Cloud: Mobile app. INCLUDE with app store links.
- Creality Sonic: Audio monitoring app.`,
    'Anycubic': `Known Anycubic software:
- Anycubic Slicer: Desktop slicer software.
- Anycubic Photon Workshop: Resin printer slicer.
- Anycubic App: Mobile companion app. INCLUDE with app store links.`,
    'QIDI': `Known QIDI software:
- QIDI Slicer / QIDISlicer: Desktop slicer software. INCLUDE ALL VERSIONS.
- QIDI Print: Alternative slicer software.`,
    'Elegoo': `Known Elegoo software:
- CHITUBOX: Supported slicer for resin printers.
- ELEGOO Link: Mobile app. INCLUDE with app store links.`,
    'FlashForge': `Known FlashForge software:
- FlashPrint: Desktop slicer software.
- FlashCloud: Mobile app and cloud service.
- FlashDLPrint: Resin printer slicer.`,
    'Raise3D': `Known Raise3D software:
- ideaMaker: Desktop slicer software. INCLUDE ALL VERSIONS.
- RaiseCloud: Cloud management and mobile app.`,
    'UltiMaker': `Known UltiMaker software:
- UltiMaker Cura: Desktop slicer software (versions like 5.x.x). INCLUDE ALL VERSIONS.
- UltiMaker Digital Factory: Cloud management platform.`,
    'Snapmaker': `Known Snapmaker software:
- Snapmaker Luban: Desktop software for 3D printing, CNC, and laser. INCLUDE ALL VERSIONS.`,
    'Sovol': `Known Sovol software:
- Klipper/Mainsail/Fluidd: Web interfaces for Klipper-based printers.
- Sovol Cura profile: Cura slicer profiles.`,
  };
  
  const brandInfo = BRAND_SOFTWARE_INFO[brandName] || `Extract all slicer software, studio apps, and mobile apps for ${brandName} printers.`;
  
  const prompt = `You are extracting SOFTWARE release information for the "${brandName}" 3D printer brand from this webpage content.

${brandInfo}

CRITICAL INSTRUCTIONS:
1. Extract ONLY software (slicers, studio apps, mobile apps, plugins)
2. Do NOT extract printer firmware
3. **EXTRACT ALL VERSION RELEASES YOU FIND** - This is a GitHub releases page or changelog. Extract EVERY version listed, not just the latest. We need a complete version history (aim for 10-20+ versions if available).
4. For each version, extract the FULL release notes including all bullet points, features, fixes, and changes.
5. For mobile apps, ALWAYS include app store links
6. **EXTRACT OS-SPECIFIC DOWNLOAD URLs** - GitHub releases typically have separate downloads for Windows (.exe, .msi), Mac (.dmg, .app.zip, arm64.dmg, x64.dmg), and Linux (.AppImage, .deb, .tar.gz). Extract ALL of them.

For EACH software release, extract:
1. **software_name** (required): The name (e.g., "Bambu Studio", "PrusaSlicer")
2. **software_type** (required): One of: "slicer", "studio", "app", "plugin"
3. **version** (required): The exact version number (e.g., "2.1.0", "1.9.5")
4. **release_date**: The release date in YYYY-MM-DD format
5. **release_notes**: DETAILED description - include ALL bullet points, features, bug fixes, and improvements. Format as markdown with headers and lists.
6. **changelog**: Additional technical changes
7. **download_url**: Generic download link if no OS-specific URLs found
8. **download_url_windows**: Direct download URL for Windows installer (.exe, .msi)
9. **download_url_mac**: Direct download URL for macOS installer (.dmg or .app.zip)
10. **download_url_linux**: Direct download URL for Linux package (.AppImage, .deb, or .tar.gz)
11. **supported_platforms**: Array of platforms this software supports (e.g., ["windows", "mac", "linux"] or ["ios", "android"])
12. **is_mobile_app**: Boolean - true for iOS/Android apps
13. **google_play_url**: Google Play Store URL for mobile apps
14. **app_store_url**: Apple App Store URL for mobile apps

OS-SPECIFIC URL EXTRACTION RULES:
- For Windows: Look for links containing ".exe", ".msi", or "win64" in the filename
- For macOS: Look for links containing ".dmg", ".app.zip", "macos", or "darwin" in the filename
- For Linux: Look for links containing ".AppImage", ".deb", ".tar.gz", or "linux" in the filename
- GitHub release assets are usually under /releases/download/v{version}/
- ONLY extract OS-specific URLs for the CURRENT/LATEST version. Older versions should have null for download URLs.

IMPORTANT: Extract as many historical versions as you can find. If this is a GitHub releases page, there should be many versions listed. Include them ALL with their complete release notes.

Return a JSON object with a "releases" array. Example with OS-specific URLs:
{
  "releases": [
    {
      "software_name": "Bambu Studio",
      "software_type": "slicer",
      "version": "2.1.0",
      "release_date": "2024-12-01",
      "release_notes": "### New Features\\n- Added support for new filament profiles\\n- Improved slicing speed\\n\\n### Bug Fixes\\n- Fixed layer height issue",
      "changelog": null,
      "download_url": null,
      "download_url_windows": "https://github.com/bambulab/BambuStudio/releases/download/v2.1.0/Bambu_Studio-win64-v2.1.0.exe",
      "download_url_mac": "https://github.com/bambulab/BambuStudio/releases/download/v2.1.0/Bambu_Studio-macos-v2.1.0.dmg",
      "download_url_linux": "https://github.com/bambulab/BambuStudio/releases/download/v2.1.0/Bambu_Studio-linux-v2.1.0.AppImage",
      "supported_platforms": ["windows", "mac", "linux"],
      "is_mobile_app": false,
      "google_play_url": null,
      "app_store_url": null
    },
    {
      "software_name": "Bambu Studio",
      "software_type": "slicer",
      "version": "2.0.3",
      "release_date": "2024-11-15",
      "release_notes": "### Bug Fixes\\n- Fixed crash on startup\\n- Improved stability",
      "changelog": null,
      "download_url": null,
      "download_url_windows": null,
      "download_url_mac": null,
      "download_url_linux": null,
      "supported_platforms": ["windows", "mac", "linux"],
      "is_mobile_app": false,
      "google_play_url": null,
      "app_store_url": null
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
            content: 'You are a software changelog parser. Extract detailed, accurate software release information from webpage content. Return valid JSON only. Focus on slicer software and apps, NOT firmware. Be thorough and include all versions found.' 
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
    
    // Brand-specific FIRMWARE version patterns (what to EXCLUDE)
    const BRAND_FIRMWARE_PATTERNS: Record<string, RegExp[]> = {
      // Bambu Lab firmware: 01.xx.xx.xx format (STARTS with 0, 4 segments)
      'Bambu Lab': [/^0[0-9]\.\d{2}\.\d{2}\.\d{2}$/],
      // Prusa firmware: 5.x.x or 4.x.x (higher major versions)
      'Prusa Research': [/^[45]\.\d+\.\d+(-\w+)?$/],
      // Creality firmware
      'Creality': [/^V?[12]\.\d+\.\d+(\.\d+)?$/i],
      // Anycubic firmware
      'Anycubic': [/^V?[12]\.\d+\.\d+$/i],
      // QIDI firmware
      'QIDI': [/^V?[23]\.\d+\.\d+$/i],
    };
    
    // Check if version matches FIRMWARE pattern for this brand (to exclude)
    const isFirmwareVersion = (version: string): boolean => {
      const v = version.replace(/^v/i, '').trim();
      const patterns = BRAND_FIRMWARE_PATTERNS[brandName];
      if (patterns) {
        const matches = patterns.some(pattern => pattern.test(v) || pattern.test(version));
        if (matches) {
          console.log(`Detected firmware version pattern: ${version}`);
          return true;
        }
      }
      return false;
    };
    
    // Check if the software name indicates it's actually firmware
    const isFirmwareByName = (name: string): boolean => {
      const n = (name || '').toLowerCase();
      if (n.includes('firmware')) return true;
      // But NOT if it mentions software names
      if (n.includes('studio') || n.includes('slicer') || n.includes('handy') || 
          n.includes('app') || n.includes('plugin') || n.includes('connect') ||
          n.includes('print') || n.includes('luban') || n.includes('cura')) {
        return false;
      }
      return false;
    };
    
    // Filter out entries that are actually firmware
    const filteredSoftware = softwareArray.filter((sw: any) => {
      const name = (sw.software_name || '').toLowerCase();
      const version = sw.version || '';
      
      // Skip if name indicates firmware
      if (isFirmwareByName(name)) {
        console.log(`Filtering out by name (firmware): ${sw.software_name} ${version}`);
        return false;
      }
      
      // Skip if version matches firmware pattern AND name doesn't clearly indicate software
      if (isFirmwareVersion(version)) {
        // Double check - is this clearly software by name?
        const isClearlySoftware = name.includes('studio') || name.includes('slicer') || 
                                   name.includes('handy') || name.includes('app') ||
                                   name.includes('plugin') || name.includes('connect') ||
                                   name.includes('luban') || name.includes('cura') ||
                                   name.includes('ideamaker') || name.includes('print');
        if (!isClearlySoftware) {
          console.log(`Filtering out by firmware version pattern: ${sw.software_name} ${version}`);
          return false;
        }
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
      download_url_windows: sw.download_url_windows || null,
      download_url_mac: sw.download_url_mac || null,
      download_url_linux: sw.download_url_linux || null,
      supported_platforms: sw.supported_platforms || ['windows', 'mac', 'linux'],
      is_latest: false, // Will be set later per software_name
      source_url: sourceUrl,
      is_mobile_app: sw.is_mobile_app === true || sw.software_type === 'app',
      google_play_url: sw.google_play_url || null,
      app_store_url: sw.app_store_url || null,
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
    
    // Ensure known mobile apps for this brand are included with proper app store links
    const knownApps = KNOWN_MOBILE_APPS[brandName];
    if (knownApps) {
      for (const app of knownApps) {
        // Check if we already have this app in our scraped results
        const existingApp = allSoftware.find(sw => 
          sw.software_name.toLowerCase().includes(app.name.toLowerCase()) ||
          app.name.toLowerCase().includes(sw.software_name.toLowerCase())
        );
        
        if (existingApp) {
          // Update existing app with app store URLs if missing
          if (!existingApp.google_play_url) {
            existingApp.google_play_url = app.google_play_url;
          }
          if (!existingApp.app_store_url) {
            existingApp.app_store_url = app.app_store_url;
          }
          existingApp.is_mobile_app = true;
        } else {
          // Add the known app as a placeholder entry
          allSoftware.push({
            software_name: app.name,
            software_type: 'app',
            version: 'Latest',
            release_date: null,
            release_notes: `Official mobile app for ${brandName} 3D printers. Download from your device's app store.`,
            changelog: null,
            download_url: null,
            download_url_windows: null,
            download_url_mac: null,
            download_url_linux: null,
            supported_platforms: ['ios', 'android'],
            is_latest: true,
            source_url: app.app_store_url,
            is_mobile_app: true,
            google_play_url: app.google_play_url,
            app_store_url: app.app_store_url,
          });
          console.log(`Added known mobile app: ${app.name}`);
        }
      }
    }
    
    // Ensure known desktop software for this brand is included
    const knownDesktopSoftware = KNOWN_DESKTOP_SOFTWARE[brandName];
    if (knownDesktopSoftware) {
      for (const software of knownDesktopSoftware) {
        // Check if we already have this software in our scraped results
        const existingSoftware = allSoftware.find(sw => 
          sw.software_name.toLowerCase().includes(software.name.toLowerCase()) ||
          software.name.toLowerCase().includes(sw.software_name.toLowerCase())
        );
        
        if (!existingSoftware) {
          // Add known desktop software as a placeholder entry
          allSoftware.push({
            software_name: software.name,
            software_type: software.software_type,
            version: 'Latest',
            release_date: null,
            release_notes: software.description,
            changelog: null,
            download_url: software.download_url,
            download_url_windows: null,
            download_url_mac: null,
            download_url_linux: null,
            supported_platforms: ['windows', 'mac', 'linux'],
            is_latest: true,
            source_url: software.download_url,
            is_mobile_app: false,
            google_play_url: null,
            app_store_url: null,
          });
          console.log(`Added known desktop software: ${software.name}`);
        }
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
