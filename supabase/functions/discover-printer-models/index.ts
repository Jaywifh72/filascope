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
  models_list_url: string;
  model_url_pattern: string;
  selectors: {
    model_list: string;
    model_name?: string;
    specs?: Record<string, string>;
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
      try {
        console.log('Background task started for brand:', brand.brand);
        
        // Initialize Firecrawl
        const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
        if (!firecrawlApiKey) {
          throw new Error('FIRECRAWL_API_KEY not configured');
        }

        const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
        let newModelsCount = 0;

        // Step 1: Scrape the models list page
        console.log('Scraping models list from:', scrapeConfig.models_list_url);
        const modelsPageResult = await firecrawl.scrapeUrl(scrapeConfig.models_list_url, {
          formats: ['markdown', 'html'],
        });

        if (!modelsPageResult.success) {
          throw new Error('Failed to scrape models list page');
        }

        console.log('Models list page scraped successfully');

        // Step 2: Extract model names from the page
        // This is a simplified extraction - in production, you'd parse the HTML based on selectors
        const markdown = modelsPageResult.markdown || '';
        const modelNames: string[] = [];

        // Extract model names using regex patterns based on brand
        // This is a basic implementation - customize based on actual brand pages
        const lines = markdown.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          // Look for lines that might contain model names
          if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('-')) {
            // Basic model name detection (customize per brand)
            const match = trimmedLine.match(/([A-Z0-9\s\-]+\s+[A-Z0-9]+)/);
            if (match) {
              modelNames.push(match[1].trim());
            }
          }
        }

        console.log(`Found ${modelNames.length} potential model names`);

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
          if (existingModelNames.has(modelName.toLowerCase())) {
            console.log(`Model ${modelName} already exists, skipping`);
            continue;
          }

          try {
            // Construct model URL
            const modelUrl = scrapeConfig.model_url_pattern.replace(
              '{model}',
              modelName.toLowerCase().replace(/\s+/g, '-')
            );

            console.log(`Scraping model details for: ${modelName} from ${modelUrl}`);

            // Scrape model page
            const modelPageResult = await firecrawl.scrapeUrl(modelUrl, {
              formats: ['markdown', 'html'],
            });

            if (!modelPageResult.success) {
              console.error(`Failed to scrape model page for ${modelName}`);
              continue;
            }

            // Parse specs from markdown (simplified - customize based on brand pages)
            const modelMarkdown = modelPageResult.markdown || '';
            const specs = parseModelSpecs(modelMarkdown, modelName);

            // Insert new printer with pending status
            const { error: insertError } = await supabase
              .from('printers')
              .insert({
                brand_id: brand_id,
                model_name: modelName,
                printer_id: `${brand.brand.toLowerCase().replace(/\s+/g, '_')}_${modelName.toLowerCase().replace(/\s+/g, '_')}`,
                status: 'pending',
                official_product_url: modelUrl,
                ...specs,
              });

            if (insertError) {
              console.error(`Error inserting model ${modelName}:`, insertError);
            } else {
              console.log(`Successfully added pending model: ${modelName}`);
              newModelsCount++;
            }

            // Rate limiting - wait between requests
            await new Promise(resolve => setTimeout(resolve, 2000));

          } catch (modelError) {
            console.error(`Error processing model ${modelName}:`, modelError);
          }
        }

        // Step 5: Update brand with discovery stats
        const { error: updateError } = await supabase
          .from('printer_brands')
          .update({
            last_discovery_run_at: new Date().toISOString(),
            new_models_found_count: newModelsCount,
          })
          .eq('id', brand_id);

        if (updateError) {
          console.error('Error updating brand stats:', updateError);
        }

        console.log(`Discovery complete. Found ${newModelsCount} new models.`);

      } catch (error) {
        console.error('Background task error:', error);
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
