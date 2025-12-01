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

    // Verify user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
        const modelNames: string[] = [];

        console.log('Extracting model names for brand:', brand.brand);

        // Brand-specific model extraction
        if (brand.brand.toLowerCase() === 'anycubic') {
          // Anycubic has two main printer lines: Kobra (FDM) and Photon (Resin)
          // Extract from product links in HTML
          const linkMatches = html.matchAll(/href="([^"]*\/products\/[^"]+)"/gi);
          const productUrls = new Set<string>();
          
          for (const match of linkMatches) {
            const url = match[1];
            const urlLower = url.toLowerCase();
            
            // Only include links that contain printer line names
            if (urlLower.includes('kobra') || urlLower.includes('photon')) {
              // Skip accessories, filaments, resins, etc.
              if (urlLower.includes('resin') && !urlLower.includes('photon')) continue;
              if (urlLower.includes('filament')) continue;
              if (urlLower.includes('wash')) continue;
              if (urlLower.includes('cure')) continue;
              if (urlLower.includes('accessory') || urlLower.includes('accessories')) continue;
              if (urlLower.includes('plate')) continue;
              if (urlLower.includes('nozzle')) continue;
              if (urlLower.includes('tool')) continue;
              
              productUrls.add(url);
            }
          }
          
          console.log(`Found ${productUrls.size} potential Anycubic printer product URLs`);
          
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
              
              modelNames.push(modelName);
              console.log(`Extracted model: ${modelName} from ${url}`);
            }
          }
        } else {
          // Generic extraction for other brands
          const lines = markdown.split('\n');
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('-')) {
              const match = trimmedLine.match(/([A-Z0-9\s\-]+\s+[A-Z0-9]+)/);
              if (match) {
                modelNames.push(match[1].trim());
              }
            }
          }
        }

        modelsFound = modelNames.length;
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
        for (const modelName of modelNames) {
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
            // Construct model URL from base + model name pattern
            const modelSlug = modelName.toLowerCase().replace(/\s+/g, '-');
            const modelUrl = `${scrapeConfig.product_url_base}/products/${modelSlug}`;

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
