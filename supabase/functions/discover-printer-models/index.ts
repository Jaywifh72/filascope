import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoverRequest {
  brand_id: string;
}

interface ScrapeConfig {
  model_list_url: string;
  product_url_base: string;
  filter_pattern?: string;
  list_page: {
    product_links_pattern: string;
  };
  product_page: {
    title_pattern?: string;
    specs_mapping?: Record<string, string>;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Check if this is a service role key (bypasses user auth check)
    const isServiceRole = authHeader.includes('service_role') || 
                          authHeader.includes('eyJpc3MiOiJzZXJ2aWNl');

    // Only validate user if NOT using service role key
    if (!isServiceRole) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        console.error('Auth error:', authError);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // For service role, set user to admin by default
    const user = isServiceRole ? { id: 'service_role', role: 'admin' } : null;

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    console.log('Role check:', { userId: user.id, roleData, roleError });

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { brand_id }: DiscoverRequest = await req.json();

    if (!brand_id) {
      return new Response(JSON.stringify({ error: 'brand_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting model discovery for brand:', brand_id);

    // Get brand details with scrape config
    const { data: brand, error: brandError } = await supabase
      .from('printer_brands')
      .select('*')
      .eq('id', brand_id)
      .single();

    if (brandError || !brand) {
      console.error('Brand not found:', brandError);
      return new Response(JSON.stringify({ error: 'Brand not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!brand.scrape_config) {
      return new Response(
        JSON.stringify({ 
          error: 'No scrape configuration found for this brand. Please add scrape_config first.' 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const scrapeConfig = brand.scrape_config as ScrapeConfig;

    // Start background task
    const backgroundTask = async () => {
      let discoveryRunId: string | null = null;
      
      try {
        console.log('Background task started for brand:', brand.brand);
        
        // Create discovery run record
        const { data: discoveryRun, error: runError } = await supabase
          .from('discovery_runs')
          .insert({
            brand_id: brand_id,
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (runError || !discoveryRun) {
          throw new Error(`Failed to create discovery run: ${runError?.message}`);
        }

        discoveryRunId = discoveryRun.id;
        console.log('Discovery run created:', discoveryRunId);
        
        // Initialize Firecrawl
        const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
        if (!firecrawlApiKey) {
          throw new Error('FIRECRAWL_API_KEY not configured');
        }

        const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
        let newModelsCount = 0;
        let modelsFound = 0;

        // Step 1: Scrape the models list page
        console.log('Scraping models list from:', scrapeConfig.model_list_url);
        const modelsPageResult = await firecrawl.scrapeUrl(scrapeConfig.model_list_url, {
          formats: ['markdown', 'html'],
        });

        if (!modelsPageResult.success) {
          throw new Error('Failed to scrape models list page');
        }

        console.log('Models list page scraped successfully');

        // Step 2: Extract model names from the page with brand-specific intelligence
        const markdown = modelsPageResult.markdown || '';
        const html = modelsPageResult.html || '';
        const modelMap = new Map<string, string>(); // modelName -> productUrl

        console.log('Extracting model names for brand:', brand.brand);

        // Brand-specific model extraction
        if (brand.brand.toLowerCase() === 'anycubic') {
          // Anycubic: ONLY scrape Kobra series (all FDM printers)
          // Photon series = resin (skip all)
          const linkMatches = html.matchAll(/href="([^"]*\/products\/[^"]+)"/gi);
          const productUrls = new Set<string>();
          
          for (const match of linkMatches) {
            const url = match[1];
            const urlLower = url.toLowerCase();
            
            // ONLY include Kobra printers - all other Anycubic printers are resin or accessories
            if (!urlLower.includes('kobra')) {
              continue;
            }
            
            // Skip accessories even within Kobra line
            if (urlLower.includes('accessory') || urlLower.includes('accessories')) continue;
            if (urlLower.includes('plate')) continue;
            if (urlLower.includes('nozzle')) continue;
            if (urlLower.includes('tool')) continue;
            if (urlLower.includes('filament')) continue;
            
            productUrls.add(url);
            console.log(`Found Kobra printer URL: ${url}`);
          }
          
          console.log(`Found ${productUrls.size} Anycubic Kobra (FDM) printer URLs`);
          
          // Extract model names from URLs
          for (const url of productUrls) {
            const pathMatch = url.match(/\/products\/([^\/\?#]+)/);
            if (pathMatch) {
              const slug = pathMatch[1];
              
              // Convert slug to readable name (e.g., "kobra-2-pro" -> "Kobra 2 Pro")
              const modelName = slug
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              // Final safety check: must contain "Kobra"
              if (!modelName.toLowerCase().includes('kobra')) {
                console.log(`Skipping non-Kobra model: ${modelName}`);
                continue;
              }
              
              modelMap.set(modelName, url);
              console.log(`Extracted Kobra FDM model: ${modelName}`);
            }
          }
        } else if (brand.brand.toLowerCase() === 'ankermake') {
          // AnkerMake: Extract FDM printers only (exclude UV printers)
          // Look for links matching /s/product/ pattern with "AnkerMake" in the text
          const linkPattern = /\[([^\]]+)\]\(([^)]*\/s\/product\/[^)]+)\)/g;
          const linkMatches = markdown.matchAll(linkPattern);
          
          for (const match of linkMatches) {
            const title = match[1].trim();
            const url = match[2];
            
            // ONLY include AnkerMake FDM printers (not UV printers)
            if (!title.toLowerCase().includes('ankermake')) {
              continue;
            }
            
            // Skip UV printers
            if (title.toLowerCase().includes('uv')) {
              console.log(`Skipping UV printer: ${title}`);
              continue;
            }
            
            // Extract model name from title (e.g., "AnkerMake M5 3D Printer" -> "M5")
            const modelMatch = title.match(/AnkerMake\s+([^\s]+)/i);
            if (modelMatch) {
              const modelName = modelMatch[1];
              modelMap.set(modelName, url);
              console.log(`Found AnkerMake FDM printer: ${modelName} at ${url}`);
            }
          }
          
          console.log(`Found ${modelMap.size} AnkerMake FDM printer URLs`);
        } else if (brand.brand.toLowerCase() === 'bambu lab') {
          // Bambu Lab: Extract all FDM printers from collection page
          // Look for links matching /products/ pattern with "Bambu Lab" in the title
          const linkPattern = /##\s+\[Bambu Lab ([^\]]+)\]\(([^)]+)\)/g;
          const linkMatches = markdown.matchAll(linkPattern);
          
          for (const match of linkMatches) {
            const modelName = match[1].trim();
            const url = match[2];
            
            // Store model with its URL
            modelMap.set(modelName, url);
            console.log(`Found Bambu Lab printer: ${modelName} at ${url}`);
          }
          
          console.log(`Found ${modelMap.size} Bambu Lab printer URLs`);
        } else if (brand.brand.toLowerCase() === 'creality') {
          // Creality: Extract FDM printers from three series (Flagship, Ender, Hi)
          // Look for /products/ links that match their naming patterns
          const linkPattern = /##\s+\[([^\]]+)\]\((https:\/\/www\.creality\.com\/products\/[^)]+)\)/g;
          const linkMatches = markdown.matchAll(linkPattern);
          
          for (const match of linkMatches) {
            const modelName = match[1].trim();
            const url = match[2];
            
            // Filter out non-printer products (accessories, parts, etc.)
            const isAccessory = modelName.toLowerCase().includes('filament') ||
                              modelName.toLowerCase().includes('nozzle') ||
                              modelName.toLowerCase().includes('extruder kit') ||
                              modelName.toLowerCase().includes('upgrade kit') ||
                              modelName.toLowerCase().includes('bed');
            
            if (isAccessory) {
              console.log(`Skipping Creality accessory: ${modelName}`);
              continue;
            }
            
            // Store model with its URL
            modelMap.set(modelName, url);
            console.log(`Found Creality printer: ${modelName} at ${url}`);
          }
          
          console.log(`Found ${modelMap.size} Creality printer URLs`);
        } else if (brand.brand.toLowerCase() === 'elegoo') {
          // Elegoo: Extract FDM printers from Shopify collection page
          // Look for product links in HTML with proper titles
          const linkPattern = /<a[^>]+href="([^"]*\/products\/[^"]+)"[^>]*>([^<]*(?:<[^>]+>[^<]*)*?)<\/a>/gi;
          const linkMatches = html.matchAll(linkPattern);
          const productUrls = new Map<string, string>(); // url -> title
          
          for (const match of linkMatches) {
            const url = match[1];
            let title = match[2].replace(/<[^>]+>/g, '').trim(); // Strip HTML tags
            
            // Skip empty titles
            if (!title || title.length < 3) continue;
            
            // Skip navigation/UI links
            if (title.toLowerCase().includes('skip to') || 
                title.toLowerCase().includes('search') ||
                title.toLowerCase().includes('cart') ||
                title.toLowerCase().includes('account')) {
              continue;
            }
            
            // Skip non-printer products
            if (title.toLowerCase().includes('resin') ||
                title.toLowerCase().includes('wash') ||
                title.toLowerCase().includes('cure') ||
                title.toLowerCase().includes('filament') ||
                title.toLowerCase().includes('build plate') ||
                title.toLowerCase().includes('spare') ||
                title.toLowerCase().includes('accessory')) {
              continue;
            }
            
            // For Elegoo, we want the full product name as it appears
            productUrls.set(url, title);
          }
          
          console.log(`Found ${productUrls.size} potential Elegoo printer URLs from HTML parsing`);
          
          // Deduplicate by URL and take the longest/most descriptive title
          const finalUrls = new Map<string, string>();
          for (const [url, title] of productUrls) {
            const normalizedUrl = url.split('?')[0]; // Remove query params
            
            if (!finalUrls.has(normalizedUrl) || title.length > finalUrls.get(normalizedUrl)!.length) {
              finalUrls.set(normalizedUrl, title);
            }
          }
          
          // Store in modelMap
          for (const [url, title] of finalUrls) {
            const fullUrl = url.startsWith('http') ? url : `${scrapeConfig.product_url_base}${url}`;
            modelMap.set(title, fullUrl);
            console.log(`Found Elegoo printer: ${title} at ${fullUrl}`);
          }
          
          console.log(`Found ${modelMap.size} Elegoo printer URLs after deduplication`);
        } else if (brand.brand.toLowerCase() === 'flashforge') {
          // FlashForge: Extract FDM printers from collection page
          // Look for product card containers specifically
          const productCardPattern = /<div[^>]+class="[^"]*product-card[^"]*"[^>]*>[\s\S]*?<a[^>]+href="([^"]*\/products\/[^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<\/div>/gi;
          const productUrls = new Map<string, string>(); // url -> title
          
          let cardMatches = html.matchAll(productCardPattern);
          for (const match of cardMatches) {
            const url = match[1];
            let title = match[2].trim();
            
            if (title && url) {
              productUrls.set(url, title);
            }
          }
          
          // If no product cards found, try alternative pattern for product grid items
          if (productUrls.size === 0) {
            const gridPattern = /<div[^>]+class="[^"]*grid__item[^"]*"[^>]*>[\s\S]*?<a[^>]+href="([^"]*\/products\/[^"]+)"[^>]*>[\s\S]*?<div[^>]+class="[^"]*card-information[^"]*"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/gi;
            const gridMatches = html.matchAll(gridPattern);
            
            for (const match of gridMatches) {
              const url = match[1];
              let title = match[2].trim();
              
              if (title && url) {
                productUrls.set(url, title);
              }
            }
          }
          
          console.log(`Found ${productUrls.size} potential FlashForge products from structured HTML`);
          
          // Filter to only actual printers
          const filteredUrls = new Map<string, string>();
          
          for (const [url, title] of productUrls) {
            const titleLower = title.toLowerCase();
            
            // Skip review text
            if (titleLower.includes('review')) continue;
            
            // Skip filament materials
            if (titleLower.match(/\b(pla|abs|petg|asa|tpu|nylon|pc|pva|hips)\b/)) continue;
            
            // Skip filament-related products
            if (titleLower.includes('filament') || 
                titleLower.includes('spool') ||
                titleLower.includes('lucky box')) continue;
            
            // Skip accessories and kits
            if (titleLower.includes('kit') ||
                titleLower.includes('camera') ||
                titleLower.includes('enclosure') ||
                titleLower.includes('nozzle') ||
                titleLower.includes('build plate') ||
                titleLower.includes('spare') ||
                titleLower.includes('accessory')) continue;
            
            // Must contain printer-related keywords or be a known FlashForge printer model
            const isPrinterLike = titleLower.includes('printer') ||
                                 titleLower.includes('3d') ||
                                 titleLower.match(/\b(adventurer|guider|creator|dreamer|finder|inventor)\b/i) ||
                                 titleLower.match(/\b(ad\d+[xm]?|g\d+u?)\b/i); // Model codes like AD5X, G3U
            
            if (isPrinterLike) {
              // Clean up title - remove "FlashForge" prefix if present
              let cleanTitle = title;
              if (cleanTitle.toLowerCase().startsWith('flashforge ')) {
                cleanTitle = cleanTitle.substring(11).trim();
              }
              
              filteredUrls.set(url, cleanTitle);
              console.log(`Identified FlashForge printer: ${cleanTitle} at ${url}`);
            }
          }
          
          console.log(`Filtered to ${filteredUrls.size} actual FlashForge printers`);
          
          // Deduplicate by URL
          const finalUrls = new Map<string, string>();
          for (const [url, title] of filteredUrls) {
            const normalizedUrl = url.split('?')[0]; // Remove query params
            
            if (!finalUrls.has(normalizedUrl) || title.length > finalUrls.get(normalizedUrl)!.length) {
              finalUrls.set(normalizedUrl, title);
            }
          }
          
          // Store in modelMap
          for (const [url, title] of finalUrls) {
            const fullUrl = url.startsWith('http') ? url : `${scrapeConfig.product_url_base}${url}`;
            modelMap.set(title, fullUrl);
            console.log(`Found FlashForge printer: ${title} at ${fullUrl}`);
          }
          
          console.log(`Found ${modelMap.size} FlashForge printer URLs after deduplication`);
        } else if (brand.brand.toLowerCase() === 'flsun') {
          // FLSUN: Extract FDM printers from Shopify collection page
          // Look for product links in HTML with proper titles
          const linkPattern = /<a[^>]+href="([^"]*\/products\/[^"]+)"[^>]*>([^<]*(?:<[^>]+>[^<]*)*?)<\/a>/gi;
          const linkMatches = html.matchAll(linkPattern);
          const productUrls = new Map<string, string>(); // url -> title
          
          for (const match of linkMatches) {
            const url = match[1];
            let title = match[2].replace(/<[^>]+>/g, '').trim(); // Strip HTML tags
            
            // Skip empty titles
            if (!title || title.length < 3) continue;
            
            // Skip navigation/UI links
            if (title.toLowerCase().includes('skip to') || 
                title.toLowerCase().includes('search') ||
                title.toLowerCase().includes('cart') ||
                title.toLowerCase().includes('account') ||
                title.toLowerCase().includes('menu')) {
              continue;
            }
            
            // Skip non-printer products
            if (title.toLowerCase().includes('spare part') ||
                title.toLowerCase().includes('accessory') ||
                title.toLowerCase().includes('filament') ||
                title.toLowerCase().includes('nozzle') ||
                title.toLowerCase().includes('bed') ||
                title.toLowerCase().includes('tool') ||
                title.toLowerCase().includes('kit')) {
              continue;
            }
            
            // Must contain printer-related keywords
            const isPrinterLike = title.toLowerCase().includes('printer') ||
                                 title.toLowerCase().includes('3d') ||
                                 title.toLowerCase().match(/\b(t1|v400|s1|sr|q5|qs)\b/i); // Common FLSUN model codes
            
            if (!isPrinterLike) continue;
            
            productUrls.set(url, title);
          }
          
          console.log(`Found ${productUrls.size} potential FLSUN printer URLs from HTML parsing`);
          
          // Deduplicate by URL and take the longest/most descriptive title
          const finalUrls = new Map<string, string>();
          for (const [url, title] of productUrls) {
            const normalizedUrl = url.split('?')[0]; // Remove query params
            
            if (!finalUrls.has(normalizedUrl) || title.length > finalUrls.get(normalizedUrl)!.length) {
              finalUrls.set(normalizedUrl, title);
            }
          }
          
          // Store in modelMap
          for (const [url, title] of finalUrls) {
            const fullUrl = url.startsWith('http') ? url : `${scrapeConfig.product_url_base}${url}`;
            
            // Clean up title - remove "FLSUN" prefix if present for consistency
            let cleanTitle = title;
            if (cleanTitle.toLowerCase().startsWith('flsun ')) {
              cleanTitle = cleanTitle.substring(6).trim();
            }
            
            modelMap.set(cleanTitle, fullUrl);
            console.log(`Found FLSUN printer: ${cleanTitle} at ${fullUrl}`);
          }
          
          console.log(`Found ${modelMap.size} FLSUN printer URLs after deduplication`);
        } else if (brand.brand.toLowerCase() === 'snapmaker') {
          // Snapmaker: Extract from /collections/best-selling-3d-printed-items
          // Filter to only actual printers using product URL patterns
          const linkPattern = /\/products\/(snapmaker-2-0|snapmaker-artisan|snapmaker-j1s|snapmaker-u1)/gi;
          const linkMatches = html.matchAll(linkPattern);
          
          for (const match of linkMatches) {
            const url = match[0];
            
            // Extract model name from URL slug
            const pathMatch = url.match(/\/products\/([^\/\?#]+)/);
            if (pathMatch) {
              const slug = pathMatch[1];
              
              // Convert slug to readable name (e.g., "snapmaker-2-0-modular-3-in-1-3d-printer-a250t" -> "Snapmaker 2.0 A250T")
              let modelName = slug
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
                .replace(/\s+3d\s+printer/i, '')
                .replace(/modular\s+3\s+in\s+1/i, '')
                .trim();
              
              // Clean up common patterns
              modelName = modelName
                .replace(/Snapmaker\s+2\s+0/i, 'Snapmaker 2.0')
                .replace(/\s+/g, ' ');
              
              const fullUrl = url.startsWith('http') ? url : `${scrapeConfig.product_url_base}${url}`;
              modelMap.set(modelName, fullUrl);
              console.log(`Found Snapmaker printer: ${modelName} at ${fullUrl}`);
            }
          }
          
          console.log(`Found ${modelMap.size} Snapmaker printer URLs`);
        } else if (brand.brand.toLowerCase() === 'sovol') {
          // Sovol: Extract from /collections/3d-printer (Shopify-based)
          const linkPattern = /\/products\/sovol-[^"'\s]+/gi;
          const linkMatches = html.matchAll(linkPattern);
          
          for (const match of linkMatches) {
            const url = match[0];
            
            // Extract model name from URL slug
            const pathMatch = url.match(/\/products\/sovol-([^\/\?#]+)/);
            if (pathMatch) {
              const slug = pathMatch[1];
              
              // Convert slug to readable name (e.g., "sv08-3d-printer" -> "Sovol SV08")
              let modelName = slug
                .replace(/-3d-printer.*$/i, '')
                .replace(/-/g, ' ')
                .toUpperCase()
                .replace(/\s+/g, ' ')
                .trim();
              
              // Add "Sovol" prefix if not present
              if (!modelName.toLowerCase().startsWith('sovol')) {
                modelName = `Sovol ${modelName}`;
              }
              
              const fullUrl = url.startsWith('http') ? url : `${scrapeConfig.product_url_base}${url}`;
              modelMap.set(modelName, fullUrl);
              console.log(`Found Sovol printer: ${modelName} at ${fullUrl}`);
            }
          }
          
          console.log(`Found ${modelMap.size} Sovol printer URLs`);
        } else if (brand.brand.toLowerCase() === 'ultimaker') {
          // Ultimaker: Extract from /3d-printers/ with nested series structure
          // URL pattern: /3d-printers/[series]/[model-name]/
          const linkPattern = /\/3d-printers\/[^\/]+\/ultimaker-[^\/\?#"']+\//gi;
          const linkMatches = html.matchAll(linkPattern);
          
          for (const match of linkMatches) {
            const url = match[0];
            
            // Extract model name from URL (e.g., "/3d-printers/method-series/ultimaker-method-xl/" -> "Ultimaker Method XL")
            const pathMatch = url.match(/\/ultimaker-([^\/\?#]+)/);
            if (pathMatch) {
              const slug = pathMatch[1];
              
              // Convert slug to readable name (e.g., "method-xl" -> "Ultimaker Method XL")
              let modelName = slug
                .replace(/-/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')
                .trim();
              
              // Add "Ultimaker" prefix
              modelName = `Ultimaker ${modelName}`;
              
              const fullUrl = url.startsWith('http') ? url : `${scrapeConfig.product_url_base}${url}`;
              modelMap.set(modelName, fullUrl);
              console.log(`Found Ultimaker printer: ${modelName} at ${fullUrl}`);
            }
          }
          
          console.log(`Found ${modelMap.size} Ultimaker printer URLs`);
        } else if (brand.brand.toLowerCase() === 'voron design') {
          // Voron Design has fixed URLs for each model - no collection page to scrape
          const voronModels = [
            { name: 'Voron 0.2', url: 'https://vorondesign.com/voron0.2' },
            { name: 'Voron 2.4', url: 'https://vorondesign.com/voron2.4' },
            { name: 'Voron Trident', url: 'https://vorondesign.com/voron_trident' },
            { name: 'Voron Switchwire', url: 'https://vorondesign.com/voron_switchwire' },
            { name: 'Voron Legacy', url: 'https://vorondesign.com/voron_legacy' }
          ];
          
          for (const model of voronModels) {
            modelMap.set(model.name, model.url);
            console.log(`Added Voron model: ${model.name} at ${model.url}`);
          }
          
          console.log(`Added ${modelMap.size} Voron Design printer URLs`);
        } else if (brand.brand.toLowerCase() === 'prusa research') {
          // Prusa Research: Extract printers from WordPress-based site
          // Look for product links in HTML
          const linkPattern = /<a[^>]+href="([^"]*\/product\/[^"]+)"[^>]*>([^<]*(?:<[^>]+>[^<]*)*?)<\/a>/gi;
          const linkMatches = html.matchAll(linkPattern);
          const productUrls = new Map<string, string>(); // url -> title
          
          for (const match of linkMatches) {
            const url = match[1];
            let title = match[2].replace(/<[^>]+>/g, '').trim(); // Strip HTML tags
            
            // Skip empty titles
            if (!title || title.length < 3) continue;
            
            // Skip navigation/UI links
            if (title.toLowerCase().includes('skip to') || 
                title.toLowerCase().includes('search') ||
                title.toLowerCase().includes('cart') ||
                title.toLowerCase().includes('account') ||
                title.toLowerCase().includes('menu') ||
                title.toLowerCase().includes('compare')) {
              continue;
            }
            
            // Skip non-printer products (accessories, upgrades, kits)
            if (title.toLowerCase().includes('upgrade') ||
                title.toLowerCase().includes('spare') ||
                title.toLowerCase().includes('accessory') ||
                title.toLowerCase().includes('filament') ||
                title.toLowerCase().includes('nozzle') ||
                title.toLowerCase().includes('sheet') ||
                title.toLowerCase().includes('enclosure') ||
                title.toLowerCase().includes('tool') ||
                title.toLowerCase().includes('kit') && !title.toLowerCase().includes('3d printer kit')) {
              continue;
            }
            
            // Must contain printer-related keywords or known Prusa model names
            const isPrinterLike = title.toLowerCase().includes('printer') ||
                                 title.toLowerCase().includes('3d') ||
                                 title.toLowerCase().match(/\b(mk[234]s?|xl|mini|core one|i3)\b/i); // Common Prusa models
            
            if (!isPrinterLike) continue;
            
            productUrls.set(url, title);
          }
          
          console.log(`Found ${productUrls.size} potential Prusa printer URLs from HTML parsing`);
          
          // Deduplicate by URL and take the longest/most descriptive title
          const finalUrls = new Map<string, string>();
          for (const [url, title] of productUrls) {
            const normalizedUrl = url.split('?')[0]; // Remove query params
            
            if (!finalUrls.has(normalizedUrl) || title.length > finalUrls.get(normalizedUrl)!.length) {
              finalUrls.set(normalizedUrl, title);
            }
          }
          
          // Store in modelMap
          for (const [url, title] of finalUrls) {
            const fullUrl = url.startsWith('http') ? url : `${scrapeConfig.product_url_base}${url}`;
            
            // Clean up title - normalize Prusa naming and remove extra info
            let cleanTitle = title;
            
            // Remove "Original Prusa" prefix if present for consistency (we know it's Prusa)
            if (cleanTitle.toLowerCase().startsWith('original prusa ')) {
              cleanTitle = cleanTitle.substring(15).trim();
            } else if (cleanTitle.toLowerCase().startsWith('prusa ')) {
              cleanTitle = cleanTitle.substring(6).trim();
            }
            
            // Remove everything after certain markers that indicate extra info
            // This handles prices, lead times, and other suffixes more reliably
            cleanTitle = cleanTitle.split(/[\$€£¥]/)[0].trim(); // Remove from currency symbols onward
            cleanTitle = cleanTitle.split(/estimated\s+lead/i)[0].trim(); // Remove from "Estimated lead" onward
            cleanTitle = cleanTitle.split(/ships?\s+in/i)[0].trim(); // Remove from "Ships in" onward
            cleanTitle = cleanTitle.split(/available\s+on\s+request/i)[0].trim();
            cleanTitle = cleanTitle.split(/this product is/i)[0].trim();
            cleanTitle = cleanTitle.split(/in\s*stock/i)[0].trim(); // Remove "In stock" suffix
            
            // Remove common suffix patterns
            cleanTitle = cleanTitle.replace(/\+\s*$/i, '').trim(); // Remove trailing "+"
            
            // Remove any trailing/leading special characters and multiple spaces
            cleanTitle = cleanTitle.replace(/[,\-–—\+]+$/, '').trim();
            cleanTitle = cleanTitle.replace(/^\+\s*/, '').trim();
            cleanTitle = cleanTitle.replace(/\s+/g, ' ');
            
            // Skip if title is too short after cleaning
            if (cleanTitle.length < 2) continue;
            
            modelMap.set(cleanTitle, fullUrl);
            console.log(`Found Prusa printer: ${cleanTitle} at ${fullUrl}`);
          }
          
          console.log(`Found ${modelMap.size} Prusa printer URLs after deduplication`);
        } else if (brand.brand.toLowerCase() === 'qidi tech') {
          // QIDI Tech: Extract printers from Shopify collection page
          // Look for product links in HTML with proper titles
          const linkPattern = /<a[^>]+href="([^"]*\/products\/[^"]+)"[^>]*>([^<]*(?:<[^>]+>[^<]*)*?)<\/a>/gi;
          const linkMatches = html.matchAll(linkPattern);
          const productUrls = new Map<string, string>(); // url -> title
          
          for (const match of linkMatches) {
            const url = match[1];
            let title = match[2].replace(/<[^>]+>/g, '').trim(); // Strip HTML tags
            
            // Skip empty titles
            if (!title || title.length < 3) continue;
            
            // Skip navigation/UI links
            if (title.toLowerCase().includes('skip to') || 
                title.toLowerCase().includes('search') ||
                title.toLowerCase().includes('cart') ||
                title.toLowerCase().includes('account') ||
                title.toLowerCase().includes('menu')) {
              continue;
            }
            
            // Skip non-printer products
            if (title.toLowerCase().includes('spare part') ||
                title.toLowerCase().includes('accessory') ||
                title.toLowerCase().includes('filament') ||
                title.toLowerCase().includes('nozzle') ||
                title.toLowerCase().includes('bed') ||
                title.toLowerCase().includes('tool') ||
                title.toLowerCase().includes('kit') && !title.toLowerCase().includes('printer')) {
              continue;
            }
            
            // Must contain printer-related keywords or known Qidi model names
            const isPrinterLike = title.toLowerCase().includes('printer') ||
                                 title.toLowerCase().includes('3d') ||
                                 title.toLowerCase().match(/\b(max|plus|x-max|i-fast|q1|smart)\b/i); // Common QIDI models
            
            if (!isPrinterLike) continue;
            
            productUrls.set(url, title);
          }
          
          console.log(`Found ${productUrls.size} potential QIDI printer URLs from HTML parsing`);
          
          // Deduplicate by URL and take the longest/most descriptive title
          const finalUrls = new Map<string, string>();
          for (const [url, title] of productUrls) {
            const normalizedUrl = url.split('?')[0]; // Remove query params
            
            if (!finalUrls.has(normalizedUrl) || title.length > finalUrls.get(normalizedUrl)!.length) {
              finalUrls.set(normalizedUrl, title);
            }
          }
          
          // Store in modelMap
          for (const [url, title] of finalUrls) {
            const fullUrl = url.startsWith('http') ? url : `${scrapeConfig.product_url_base}${url}`;
            
            // Clean up title to extract only the model name
            let cleanTitle = title;
            
            // Remove status prefixes first (Sale, Sold out, etc.)
            cleanTitle = cleanTitle.replace(/^(Sale|Sold\s*out)\s*/i, '').trim();
            
            // Remove brand names (QIDI, Qidi, Qidi Tech)
            cleanTitle = cleanTitle.replace(/\b(QIDI|Qidi)(\s*Tech)?\s*/gi, '').trim();
            
            // Remove "3D Printer" suffix
            cleanTitle = cleanTitle.replace(/\s*3D\s*Printer\s*$/i, '').trim();
            
            // Remove everything after certain markers (pricing, stock info)
            cleanTitle = cleanTitle.split(/[\$€£¥]/)[0].trim(); // Remove from currency symbols onward
            cleanTitle = cleanTitle.split(/from\s+[\$€£¥]/i)[0].trim(); // Remove "from $X" pricing
            cleanTitle = cleanTitle.split(/in\s*stock/i)[0].trim(); // Remove "In stock"
            cleanTitle = cleanTitle.split(/out\s+of\s+stock/i)[0].trim(); // Remove "Out of stock"
            cleanTitle = cleanTitle.split(/pre-?order/i)[0].trim(); // Remove "Pre-order"
            cleanTitle = cleanTitle.split(/ships?\s+in/i)[0].trim(); // Remove shipping info
            
            // Remove common suffix patterns and extra whitespace
            cleanTitle = cleanTitle.replace(/\+\s*$/i, '').trim(); // Remove trailing "+"
            cleanTitle = cleanTitle.replace(/[,\-–—\+]+$/, '').trim();
            cleanTitle = cleanTitle.replace(/^\+\s*/, '').trim();
            cleanTitle = cleanTitle.replace(/\s+/g, ' ');
            
            // Skip if title is too short after cleaning
            if (cleanTitle.length < 2) continue;
            
            modelMap.set(cleanTitle, fullUrl);
            console.log(`Found QIDI printer: ${cleanTitle} at ${fullUrl}`);
          }
          
          console.log(`Found ${modelMap.size} QIDI printer URLs after deduplication`);
        } else if (brand.brand.toLowerCase() === 'ratrig') {
          // Ratrig: Extract printers from Shopify collection page
          console.log('Extracting Ratrig printer models from product listing page');
          
          // Ratrig uses product-item-meta__title class for product links
          const linkPattern = /<a[^>]+href="(\/products\/[^"]+)"[^>]*class="product-item-meta__title"[^>]*>([^<]+)<\/a>/gi;
          const linkMatches = html.matchAll(linkPattern);
          const productUrls = new Map<string, string>();
          
          for (const match of linkMatches) {
            const path = match[1];
            let title = match[2].trim();
            
            if (!title || title.length < 3) continue;
            
            // Skip obvious non-printer items
            if (title.toLowerCase().includes('flexplate') ||
                title.toLowerCase().includes('extruder') ||
                title.toLowerCase().includes('pulley') ||
                title.toLowerCase().includes('led light') ||
                title.toLowerCase().includes('stepper motor') ||
                title.toLowerCase().includes('hub hat') ||
                title.toLowerCase().includes('splitter') ||
                title.toLowerCase().includes('toolboard') ||
                title.toLowerCase().includes('plate set') && !title.toLowerCase().includes('v-core')) {
              console.log(`Skipping non-printer item: ${title}`);
              continue;
            }
            
            const fullUrl = `${scrapeConfig.product_url_base}${path}`;
            productUrls.set(fullUrl, title);
            console.log(`Found potential Ratrig product: ${title} at ${fullUrl}`);
          }
          
          console.log(`Found ${productUrls.size} potential Ratrig printer URLs from HTML parsing`);
          
          // Process and clean titles
          for (const [url, title] of productUrls) {
            let cleanTitle = title;
            
            // Remove status prefixes
            cleanTitle = cleanTitle.replace(/^(Sale|Sold out|New|Pre-order)\s*/i, '').trim();
            
            // Remove brand names
            cleanTitle = cleanTitle.replace(/\s*-\s*Ratrig\s*/gi, '').trim();
            cleanTitle = cleanTitle.replace(/^(Ratrig|Rat\s*Rig)\s*/gi, '').trim();
            
            // Remove common suffixes like "- US" or "- EU"
            cleanTitle = cleanTitle.replace(/\s*-\s*(US|EU|UK|CA)\s*$/i, '').trim();
            
            // Remove "3D Printer" suffix
            cleanTitle = cleanTitle.replace(/\s*3D\s*Printer\s*$/i, '').trim();
            
            // Remove upgrade/kit suffixes for filtering but keep for actual name
            const isUpgradeKit = /upgrade|kit/i.test(cleanTitle);
            
            // Remove pricing and marketing info
            cleanTitle = cleanTitle.split(/[\$€£¥]/)[0].trim();
            cleanTitle = cleanTitle.split(/from\s+[\$€£¥]/i)[0].trim();
            
            // Clean up extra characters and whitespace
            cleanTitle = cleanTitle.replace(/[,\-–—]+$/, '').trim();
            cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
            
            // Skip if title is too short
            if (cleanTitle.length < 3) {
              console.log(`Skipping short title: ${cleanTitle}`);
              continue;
            }
            
            // Only include items that are actual printers or printer kits
            // Look for V-Core in the name as those are the main printer lines
            if (!cleanTitle.toLowerCase().includes('v-core')) {
              console.log(`Skipping non-V-Core item: ${cleanTitle}`);
              continue;
            }
            
            modelMap.set(cleanTitle, url);
            console.log(`Found Ratrig printer: ${cleanTitle} at ${url}`);
          }
          
          console.log(`Found ${modelMap.size} Ratrig printer URLs after deduplication`);
        } else if (brand.brand.toLowerCase() === 'snapmaker') {
          // Snapmaker: Extract printers from Shopify collection page
          console.log('Extracting Snapmaker printer models from product listing page');
          
          const filterPattern = scrapeConfig.filter_pattern || '(artisan|snapmaker-2-0|j1s|j1|u1|a250|a350)';
          
          // Extract all product links from collection page
          const linkPattern = /<a[^>]+href="(\/products\/[^"]+)"[^>]*>/gi;
          const linkMatches = html.matchAll(linkPattern);
          const productUrls = new Map<string, string>();
          
          for (const match of linkMatches) {
            const path = match[1];
            
            // Filter by known printer model patterns in URL
            if (!path.match(new RegExp(filterPattern, 'i'))) {
              continue;
            }
            
            // Extract model name from URL path
            const pathParts = path.split('/').filter(p => p);
            let modelName = pathParts[pathParts.length - 1] || '';
            
            // Clean up URL slug to make it readable
            modelName = modelName
              .replace(/-/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase())
              .replace(/\s+/g, ' ')
              .trim();
            
            const fullUrl = `${scrapeConfig.product_url_base}${path}`;
            productUrls.set(fullUrl, modelName);
            console.log(`Found Snapmaker printer: ${modelName} at ${fullUrl}`);
          }
          
          console.log(`Found ${productUrls.size} potential Snapmaker printer URLs from filtered links`);
          
          // Add to model map
          for (const [url, title] of productUrls) {
            let cleanTitle = title;
            
            // Remove "Snapmaker" prefix if present
            cleanTitle = cleanTitle.replace(/^Snapmaker\s*/i, '').trim();
            
            // Skip if empty after cleaning
            if (cleanTitle.length < 2) continue;
            
            modelMap.set(cleanTitle, url);
          }
          
          console.log(`Found ${modelMap.size} Snapmaker printer URLs after deduplication`);
        } else if (brand.brand.toLowerCase() === 'raise3d') {
          // Raise3D: Extract printers from product listing page
          console.log('Extracting Raise3D printer models from product listing page');
          
          // Look for links that contain printer model identifiers
          const linkPattern = /<a[^>]+href="([^"]*(?:pro|e2|rme|forge|raise3d)[^"]*)"[^>]*>([^<]*(?:<[^>]+>[^<]*)*?)<\/a>/gi;
          const linkMatches = html.matchAll(linkPattern);
          const productUrls = new Map<string, string>(); // url -> title
          
          for (const match of linkMatches) {
            const url = match[1];
            let title = match[2].replace(/<[^>]+>/g, '').trim(); // Strip HTML tags
            
            // Skip empty titles
            if (!title || title.length < 3) continue;
            
            // Skip navigation/UI links
            if (title.toLowerCase().includes('skip to') || 
                title.toLowerCase().includes('search') ||
                title.toLowerCase().includes('cart') ||
                title.toLowerCase().includes('account') ||
                title.toLowerCase().includes('menu') ||
                title.toLowerCase().includes('learn more') ||
                title.toLowerCase().includes('shop now')) {
              continue;
            }
            
            // Skip non-printer products
            if (title.toLowerCase().includes('accessory') ||
                title.toLowerCase().includes('filament') ||
                title.toLowerCase().includes('support') ||
                title.toLowerCase().includes('news') ||
                title.toLowerCase().includes('download') ||
                title.toLowerCase().includes('software')) {
              continue;
            }
            
            // Filter for actual printer product pages
            if (url.includes('/3d-printers/') || 
                url.match(/\/(pro|e2|rme|forge)/i)) {
              productUrls.set(url, title);
            }
          }
          
          console.log(`Found ${productUrls.size} potential Raise3D printer URLs from HTML parsing`);
          
          // Deduplicate by URL
          const finalUrls = new Map<string, string>();
          for (const [url, title] of productUrls) {
            const normalizedUrl = url.split('?')[0]; // Remove query params
            
            if (!finalUrls.has(normalizedUrl) || title.length > finalUrls.get(normalizedUrl)!.length) {
              finalUrls.set(normalizedUrl, title);
            }
          }
          
          // Store in modelMap with cleaned titles
          for (const [url, title] of finalUrls) {
            const fullUrl = url.startsWith('http') ? url : `${scrapeConfig.product_url_base}${url}`;
            
            // Clean up title to extract only the model name
            let cleanTitle = title;
            
            // Remove status prefixes
            cleanTitle = cleanTitle.replace(/^(New|Sale|Available|Coming\s*Soon)\s*/i, '').trim();
            
            // Remove brand name
            cleanTitle = cleanTitle.replace(/\b(Raise3D|Raise)\s*/gi, '').trim();
            
            // Remove "3D Printer" suffix
            cleanTitle = cleanTitle.replace(/\s*3D\s*Printer\s*$/i, '').trim();
            
            // Remove pricing and marketing info
            cleanTitle = cleanTitle.split(/[\$€£¥]/)[0].trim();
            cleanTitle = cleanTitle.split(/from\s+[\$€£¥]/i)[0].trim();
            cleanTitle = cleanTitle.split(/learn\s*more/i)[0].trim();
            cleanTitle = cleanTitle.split(/shop\s*now/i)[0].trim();
            
            // Remove common suffix patterns
            cleanTitle = cleanTitle.replace(/[,\-–—\+]+$/, '').trim();
            cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
            
            // Skip if title is too short after cleaning
            if (cleanTitle.length < 2) continue;
            
            // Validate it's an actual printer model (starts with "Pro" or "E" followed by number)
            const isValidModel = /^(Pro|E)\d+/i.test(cleanTitle);
            if (!isValidModel) {
              console.log(`Skipping non-printer item: ${cleanTitle}`);
              continue;
            }
            
            modelMap.set(cleanTitle, fullUrl);
            console.log(`Found Raise3D printer: ${cleanTitle} at ${fullUrl}`);
          }
          
          console.log(`Found ${modelMap.size} Raise3D printer URLs after deduplication`);
        } else {
          // Generic extraction for other brands
          const lines = markdown.split('\n');
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('-')) {
              const match = trimmedLine.match(/([A-Z0-9\s\-]+\s+[A-Z0-9]+)/);
              if (match) {
                const modelName = match[1].trim();
                // For generic brands, we'll construct the URL later
                modelMap.set(modelName, '');
              }
            }
          }
        }

        modelsFound = modelMap.size;
        console.log(`Found ${modelsFound} potential model names`);

        // Step 3: Check which models already exist
        const { data: existingPrinters } = await supabase
          .from('printers')
          .select('model_name')
          .eq('brand_id', brand_id);

        const existingModelNames = new Set(
          existingPrinters?.map(p => p.model_name.toLowerCase()) || []
        );

        // Step 4: For each new model, scrape details and create entry
        for (const [modelName, productUrl] of modelMap) {
          const wasNew = !existingModelNames.has(modelName.toLowerCase());
          
          if (!wasNew) {
            console.log(`Model ${modelName} already exists, skipping`);
            
            // Log that we found it but it wasn't new
            await supabase.from('discovery_models').insert({
              discovery_run_id: discoveryRunId,
              model_name: modelName,
              was_new: false,
              discovered_at: new Date().toISOString(),
            });
            
            continue;
          }

          try {
            // Construct model URL
            let modelUrl: string;
            
            if (productUrl) {
              // Use the provided URL (for brands like AnkerMake with ID-based URLs)
              modelUrl = productUrl;
            } else {
              // Construct from slug (for brands like Anycubic with slug-based URLs)
              const modelSlug = modelName.toLowerCase().replace(/\s+/g, '-');
              modelUrl = `${scrapeConfig.product_url_base}/products/${modelSlug}`;
            }

            console.log(`Scraping model details for: ${modelName} from ${modelUrl}`);

            // Scrape model page
            const modelPageResult = await firecrawl.scrapeUrl(modelUrl, {
              formats: ['markdown', 'html'],
            });

            if (!modelPageResult.success) {
              console.error(`Failed to scrape model page for ${modelName}`);
              
              // Log failed discovery attempt
              await supabase.from('discovery_models').insert({
                discovery_run_id: discoveryRunId,
                model_name: modelName,
                was_new: false,
                discovered_at: new Date().toISOString(),
              });
              
              continue;
            }

            // Validate that this is actually a printer product page
            const pageMarkdown = (modelPageResult.markdown || '').toLowerCase();
            const pageHtml = (modelPageResult.html || '').toLowerCase();
            
            // Check for printer-related keywords
            const isPrinterPage = (
              pageMarkdown.includes('printer') ||
              pageMarkdown.includes('build volume') ||
              pageMarkdown.includes('nozzle') ||
              pageMarkdown.includes('extruder') ||
              pageMarkdown.includes('print speed') ||
              pageHtml.includes('3d printer')
            );
            
            // Check for non-printer keywords (accessories, consumables)
            const isNonPrinter = (
              pageMarkdown.includes('wash and cure') ||
              pageMarkdown.includes('resin bottle') ||
              pageMarkdown.includes('build plate only') ||
              pageMarkdown.includes('replacement part') ||
              pageMarkdown.includes('accessory kit')
            );
            
            if (!isPrinterPage || isNonPrinter) {
              console.log(`Skipping ${modelName} - does not appear to be a printer product`);
              
              // Log non-printer discovery
              await supabase.from('discovery_models').insert({
                discovery_run_id: discoveryRunId,
                model_name: modelName,
                was_new: false,
                discovered_at: new Date().toISOString(),
              });
              
              continue;
            }
            
            console.log(`Validated ${modelName} as a printer product`)

            
            console.log(`Validated ${modelName} as a printer product`);

            // Parse specs from markdown
            const specs = parseModelSpecs(pageMarkdown, modelName);

            // Insert new printer with pending status
            const { data: newPrinter, error: insertError } = await supabase
              .from('printers')
              .insert({
                brand_id: brand_id,
                model_name: modelName,
                printer_id: `${brand.brand.toLowerCase().replace(/\s+/g, '_')}_${modelName.toLowerCase().replace(/\s+/g, '_')}`,
                status: 'pending',
                official_product_url: modelUrl,
                ...specs,
              })
              .select()
              .single();

            if (insertError) {
              console.error(`Error inserting model ${modelName}:`, insertError);
            } else {
              console.log(`Successfully added pending model: ${modelName}`);
              newModelsCount++;
              
              // Log the discovered model
              await supabase.from('discovery_models').insert({
                discovery_run_id: discoveryRunId,
                printer_id: newPrinter.id,
                model_name: modelName,
                was_new: true,
                discovered_at: new Date().toISOString(),
              });
            }

            // Rate limiting - wait between requests
            await new Promise(resolve => setTimeout(resolve, 2000));

          } catch (modelError) {
            console.error(`Error processing model ${modelName}:`, modelError);
          }
        }

        // Step 5: Update discovery run as completed
        await supabase
          .from('discovery_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            models_found: modelsFound,
            models_added: newModelsCount,
          })
          .eq('id', discoveryRunId!);

        // Update brand with discovery stats
        await supabase
          .from('printer_brands')
          .update({
            last_discovery_run_at: new Date().toISOString(),
            new_models_found_count: newModelsCount,
          })
          .eq('id', brand_id);

        console.log(`Discovery complete. Found ${modelsFound} models, added ${newModelsCount} new ones.`);

      } catch (error) {
        console.error('Background task error:', error);
        
        // Update discovery run as failed
        if (discoveryRunId) {
          await supabase
            .from('discovery_runs')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', discoveryRunId);
        }
      }
    };

    // Start background task without awaiting
    backgroundTask();

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Model discovery started in background',
        brand: brand.brand,
      }),
      {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in discover-printer-models:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper function to parse specs from markdown
function parseModelSpecs(markdown: string, modelName: string): Record<string, any> {
  const specs: Record<string, any> = {};

  // Extract build volume
  const buildVolumeMatch = markdown.match(/build volume[:\s]+(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/i);
  if (buildVolumeMatch) {
    specs.build_volume_x_mm = parseInt(buildVolumeMatch[1]);
    specs.build_volume_y_mm = parseInt(buildVolumeMatch[2]);
    specs.build_volume_z_mm = parseInt(buildVolumeMatch[3]);
  }

  // Extract max nozzle temperature
  const nozzleTempMatch = markdown.match(/nozzle temp[erature]*[:\s]+(\d+)\s*°?C/i);
  if (nozzleTempMatch) {
    specs.max_nozzle_temp_c = parseInt(nozzleTempMatch[1]);
  }

  // Extract max bed temperature
  const bedTempMatch = markdown.match(/bed temp[erature]*[:\s]+(\d+)\s*°?C/i);
  if (bedTempMatch) {
    specs.bed_max_temp_c = parseInt(bedTempMatch[1]);
  }

  // Extract print speed
  const speedMatch = markdown.match(/print speed[:\s]+(\d+)\s*mm\/s/i);
  if (speedMatch) {
    specs.max_print_speed_mms = parseInt(speedMatch[1]);
  }

  // Check for enclosure
  specs.has_enclosure = /enclosure|enclosed|chamber/i.test(markdown);

  // Check for auto bed leveling
  specs.auto_bed_leveling = /auto[- ]?bed[- ]?level|abl/i.test(markdown);

  // Check for heated bed
  specs.bed_heated = /heated[- ]?bed/i.test(markdown);

  return specs;
}
