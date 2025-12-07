import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions for data extraction
function extractNumber(text: string, keywords: string[]): number | null {
  const lines = text.split('\n');
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (keywords.some(kw => lowerLine.includes(kw))) {
      const numbers = line.match(/\d+\.?\d*/g);
      if (numbers && numbers.length > 0) {
        return parseFloat(numbers[0]);
      }
    }
  }
  return null;
}

function extractText(text: string, keywords: string[]): string | null {
  const lines = text.split('\n');
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (keywords.some(kw => lowerLine.includes(kw))) {
      return line.trim();
    }
  }
  return null;
}

function extractPrice(text: string): number | null {
  const priceMatch = text.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (priceMatch) {
    return parseFloat(priceMatch[1].replace(/,/g, ''));
  }
  return null;
}

// Direct Firecrawl API calls to avoid library compatibility issues
async function firecrawlScrape(url: string, apiKey: string, formats: any[]) {
  console.log('Calling Firecrawl API for:', url, 'with formats:', formats);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      formats: formats,
      onlyMainContent: true,
    }),
  });

  const responseData = await response.json();
  console.log('Firecrawl response status:', response.status);
  
  if (!response.ok) {
    console.error('Firecrawl error response:', responseData);
    throw new Error(`Firecrawl API error: ${response.statusText} - ${JSON.stringify(responseData)}`);
  }

  return responseData;
}

interface DeepScrapeRequest {
  printerId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { printerId } = await req.json() as DeepScrapeRequest;

    console.log('Starting deep scrape for printer:', printerId);

    // Get the printer record
    const { data: printer, error: fetchError } = await supabase
      .from('printers')
      .select('*')
      .eq('id', printerId)
      .single();

    if (fetchError || !printer) {
      throw new Error(`Printer not found: ${printerId}`);
    }

    if (!printer.official_product_url) {
      throw new Error('Printer has no official_product_url to scrape');
    }

    // Validate URL is properly formatted
    try {
      new URL(printer.official_product_url);
    } catch {
      throw new Error(`Invalid URL format: ${printer.official_product_url}`);
    }

    // Check if URL is just a word or invalid value
    if (!printer.official_product_url.startsWith('http://') && !printer.official_product_url.startsWith('https://')) {
      throw new Error(`URL must start with http:// or https://: ${printer.official_product_url}`);
    }

    // Update status to in_progress
    await supabase
      .from('printers')
      .update({ scrape_status: 'in_progress', scrape_error: null })
      .eq('id', printerId);

    // Scrape the product page with all formats
    console.log('Scraping URL:', printer.official_product_url);
    const scrapeResult = await firecrawlScrape(
      printer.official_product_url, 
      firecrawlApiKey,
      ['markdown', 'html', 'links', 'screenshot']
    );

    if (!scrapeResult || !scrapeResult.data) {
      throw new Error('Failed to scrape product page - no data returned');
    }

    const data = scrapeResult.data;
    const markdown = data.markdown || '';
    const html = data.html || '';
    const links = data.links || [];
    const screenshot = data.screenshot || '';

    console.log('Scrape successful, analyzing content...');

    const lowerMarkdown = markdown.toLowerCase();

    // Extract comprehensive specifications from markdown
    const extractedSpecs = {
      // Dimensions
      build_volume_x_mm: extractNumber(markdown, ['build volume', 'print volume', 'printing volume', 'x:', 'width']),
      build_volume_y_mm: extractNumber(markdown, ['build volume', 'print volume', 'printing volume', 'y:', 'depth']),
      build_volume_z_mm: extractNumber(markdown, ['build volume', 'print volume', 'printing volume', 'z:', 'height']),
      machine_width_mm: extractNumber(markdown, ['machine size', 'machine dimension', 'dimensions', 'width']),
      machine_depth_mm: extractNumber(markdown, ['machine size', 'machine dimension', 'dimensions', 'depth']),
      machine_height_mm: extractNumber(markdown, ['machine size', 'machine dimension', 'dimensions', 'height']),
      machine_weight_kg: extractNumber(markdown, ['machine weight', 'weight', 'kg']),
      
      // Package Specifications
      package_width_mm: extractNumber(markdown, ['package', 'packaging dimension', 'box size', 'width']),
      package_depth_mm: extractNumber(markdown, ['package', 'packaging dimension', 'box size', 'depth']),
      package_height_mm: extractNumber(markdown, ['package', 'packaging dimension', 'box size', 'height']),
      package_weight_kg: extractNumber(markdown, ['package weight', 'packaging weight', 'box weight']),
      
      // Temperatures
      max_nozzle_temp_c: extractNumber(markdown, ['nozzle temp', 'hotend temp', 'max temp', 'max temperature', '°c', 'celsius']),
      bed_max_temp_c: extractNumber(markdown, ['bed temp', 'hotbed', 'heated bed', 'plate temp', 'build plate']),
      sustained_nozzle_temp_c: extractNumber(markdown, ['sustained temp', 'continuous temp']),
      
      // Speed & Performance
      max_print_speed_mms: extractNumber(markdown, ['max speed', 'maximum speed', 'print speed', 'mm/s', 'speed']),
      recommended_quality_speed_mms: extractNumber(markdown, ['recommended speed', 'quality speed', 'standard speed']),
      max_acceleration_xy_mmss: extractNumber(markdown, ['acceleration', 'mm/s²', 'mm/s2']),
      
      // Extruder & Nozzle
      stock_nozzle_diameter_mm: extractNumber(markdown, ['nozzle', 'diameter', 'standard', 'mm']),
      filament_diameter_mm: extractNumber(markdown, ['filament diameter', '1.75', '2.85']),
      extruder_count: extractNumber(markdown, ['extruder', 'count', 'dual']),
      supported_nozzle_diameters_mm: extractText(markdown, ['nozzle diameter', 'expandable', 'compatible nozzle']),
      
      // Hotend Details
      hotend_type: extractText(markdown, ['hotend', 'hot end', 'extruder type']),
      hotend_material_composition: extractText(markdown, ['ceramic', 'throat tube', 'hotend material', 'aerospace grade']),
      quick_release_hotend: lowerMarkdown.includes('quick release') || lowerMarkdown.includes('quick-release') || lowerMarkdown.includes('tool-free hotend'),
      
      // Connectivity
      has_wifi: lowerMarkdown.includes('wifi') || lowerMarkdown.includes('wi-fi'),
      has_ethernet: lowerMarkdown.includes('ethernet') || lowerMarkdown.includes('lan'),
      has_bluetooth: lowerMarkdown.includes('bluetooth'),
      has_usb_a_port: lowerMarkdown.includes('usb-a') || lowerMarkdown.includes('usb port') || lowerMarkdown.includes('usb (print only)'),
      has_usb_c_port: lowerMarkdown.includes('usb-c') || lowerMarkdown.includes('usb type-c'),
      has_sd_card: lowerMarkdown.includes('sd card') || lowerMarkdown.includes('microsd'),
      
      // Basic Features
      auto_bed_leveling: lowerMarkdown.includes('auto bed level') || lowerMarkdown.includes('abl') || lowerMarkdown.includes('auto-leveling'),
      auto_bed_leveling_method: extractText(markdown, ['leveling', 'leviq', 'abl', 'z-offset']),
      z_offset_supported: lowerMarkdown.includes('z-offset') || lowerMarkdown.includes('z offset'),
      has_enclosure: lowerMarkdown.includes('enclosure') || lowerMarkdown.includes('enclosed'),
      enclosure_heated: lowerMarkdown.includes('heated enclosure') || lowerMarkdown.includes('heated chamber'),
      multi_material_supported: lowerMarkdown.includes('multi material') || lowerMarkdown.includes('multicolor') || lowerMarkdown.includes('ams') || lowerMarkdown.includes('ace pro'),
      abrasive_materials_supported: lowerMarkdown.includes('hardened') || lowerMarkdown.includes('abrasive'),
      remote_monitoring_supported: lowerMarkdown.includes('camera') || lowerMarkdown.includes('monitoring') || lowerMarkdown.includes('video monitoring'),
      remote_control_supported: lowerMarkdown.includes('remote control') || lowerMarkdown.includes('cloud') || lowerMarkdown.includes('app control'),
      input_shaping_supported: lowerMarkdown.includes('input shaping') || lowerMarkdown.includes('resonance'),
      power_loss_recovery: lowerMarkdown.includes('power loss') || lowerMarkdown.includes('power resume'),
      
      // Advanced Features
      pressure_advance_supported: lowerMarkdown.includes('pressure advance') || lowerMarkdown.includes('flow calibration'),
      flow_calibration_supported: lowerMarkdown.includes('flow calibration') || lowerMarkdown.includes('pressure advance'),
      filament_runout_detection: lowerMarkdown.includes('filament detection') || lowerMarkdown.includes('runout detection') || lowerMarkdown.includes('auto resume'),
      filament_entanglement_detection: lowerMarkdown.includes('entanglement detection') || lowerMarkdown.includes('filament tangle'),
      ai_spaghetti_detection: lowerMarkdown.includes('spaghetti detection') || lowerMarkdown.includes('ai detection') || lowerMarkdown.includes('failure detection'),
      object_skip_supported: lowerMarkdown.includes('object-skip') || lowerMarkdown.includes('object skip') || lowerMarkdown.includes('skip object'),
      area_leveling_supported: lowerMarkdown.includes('area leveling') || lowerMarkdown.includes('zone leveling'),
      
      // Display
      screen_type: extractText(markdown, ['screen', 'display', 'touchscreen', 'capacitive', 'lcd']),
      screen_size_inch: extractNumber(markdown, ['screen', 'display', 'inch', '"', 'touchscreen']),
      
      // Bed Type
      bed_type: extractText(markdown, ['bed type', 'build plate', 'pei', 'spring steel', 'hotbed']),
      
      // Firmware
      firmware_family: extractText(markdown, ['firmware', 'kobra os', 'marlin', 'klipper']),
      
      // Materials
      printer_technology: lowerMarkdown.includes('fdm') ? 'FDM' : lowerMarkdown.includes('fff') ? 'FFF' : null,
      official_supported_materials: extractText(markdown, ['supporting filaments', 'materials', 'filament', 'pla', 'abs', 'petg', 'tpu']),
      extruder_type: extractText(markdown, ['extruder type', 'extrusion', 'direct drive', 'bowden']),
      
      // Noise
      noise_level_printing_db: extractNumber(markdown, ['noise', 'db', 'decibel', 'sound']),
      
      // Language Support
      ui_language_options: extractText(markdown, ['language', 'multilingual', 'en', 'cn', 'de', 'fr']),
      
      // Pricing
      msrp_usd: extractPrice(markdown),
      
      // Metadata
      content_length: markdown.length,
      extraction_confidence: 'basic_pattern_matching'
    };
    
    console.log('Extracted specifications:', Object.keys(extractedSpecs).filter(k => {
      const value = extractedSpecs[k as keyof typeof extractedSpecs];
      return value !== null;
    }).length, 'of', Object.keys(extractedSpecs).length, 'fields');

    // Find product images from HTML - look for actual image tags and their src attributes
    let productImages: string[] = [];
    
    // Extract images from HTML using regex patterns for common product image structures
    if (html) {
      // Look for img tags with src attributes
      const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      const imgMatches: IterableIterator<RegExpMatchArray> = html.matchAll(imgTagRegex);
      
      for (const match of imgMatches) {
        const imgSrc = match[1] as string;
        // Filter for product images - exclude icons, logos, small images
        if (imgSrc && 
            /\.(jpg|jpeg|png|webp)$/i.test(imgSrc) &&
            !imgSrc.includes('icon') &&
            !imgSrc.includes('logo') &&
            !imgSrc.includes('favicon') &&
            !imgSrc.includes('thumbnail') &&
            (imgSrc.includes('product') || imgSrc.includes('cdn') || imgSrc.includes('assets') || imgSrc.includes('uploads'))) {
          // Make URL absolute if it's relative
          let fullUrl = imgSrc;
          if (imgSrc.startsWith('//')) {
            fullUrl = 'https:' + imgSrc;
          } else if (imgSrc.startsWith('/')) {
            const urlObj = new URL(printer.official_product_url);
            fullUrl = urlObj.origin + imgSrc;
          }
          productImages.push(fullUrl);
        }
      }
    }
    
    // Fallback: also check links array for direct image URLs (but be more selective)
    const imageLinks = links.filter((link: string) => {
      const lowerLink = link.toLowerCase();
      return /\.(jpg|jpeg|png|webp)$/i.test(link) &&
        !lowerLink.includes('/products/') && // Exclude product page links
        !lowerLink.includes('icon') &&
        !lowerLink.includes('logo') &&
        (lowerLink.includes('cdn') || lowerLink.includes('assets') || lowerLink.includes('uploads') || lowerLink.includes('image'));
    });
    
    productImages = [...new Set([...productImages, ...imageLinks])]; // Remove duplicates
    
    console.log(`Found ${productImages.length} product images`);

    // Find document links
    const documentLinks = links.filter((link: string) => 
      /\.(pdf|doc|docx)$/i.test(link) ||
      link.toLowerCase().includes('manual') ||
      link.toLowerCase().includes('datasheet') ||
      link.toLowerCase().includes('spec')
    );

    // Extract accessories from markdown and links
    const accessories: Array<{
      type: 'nozzle' | 'build_plate' | 'ams_mmu';
      name: string;
      specs: any;
      price: number | null;
      url: string;
    }> = [];

    // Extract nozzles
    const nozzleKeywords = ['nozzle', 'hardened', 'brass', '0.2mm', '0.4mm', '0.6mm', '0.8mm'];
    for (const link of links) {
      const lowerLink = link.toLowerCase();
      if (nozzleKeywords.some(kw => lowerLink.includes(kw)) && 
          (lowerLink.includes('/products/') || lowerLink.includes('/shop/'))) {
        // Extract name from URL
        const urlParts = link.split('/');
        const productSlug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
        const name = productSlug.replace(/-/g, ' ').replace(/\?.*$/, '');
        
        // Look for diameter in name
        const diameterMatch = name.match(/(\d+\.?\d*)\s*mm/i);
        
        accessories.push({
          type: 'nozzle',
          name: name,
          specs: {
            diameter_mm: diameterMatch ? parseFloat(diameterMatch[1]) : null,
            material: lowerLink.includes('hardened') ? 'Hardened Steel' : 
                     lowerLink.includes('brass') ? 'Brass' : null
          },
          price: null, // Will be extracted if available
          url: link
        });
      }
    }

    // Extract build plates
    const plateKeywords = ['build plate', 'pei', 'bed', 'sheet', 'magnetic', 'textured', 'smooth'];
    for (const link of links) {
      const lowerLink = link.toLowerCase();
      if (plateKeywords.some(kw => lowerLink.includes(kw)) && 
          (lowerLink.includes('/products/') || lowerLink.includes('/shop/')) &&
          !lowerLink.includes('nozzle')) {
        const urlParts = link.split('/');
        const productSlug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
        const name = productSlug.replace(/-/g, ' ').replace(/\?.*$/, '');
        
        accessories.push({
          type: 'build_plate',
          name: name,
          specs: {
            surface: lowerLink.includes('textured') ? 'Textured' : 
                    lowerLink.includes('smooth') ? 'Smooth' : 
                    lowerLink.includes('pei') ? 'PEI' : null,
            magnetic: lowerLink.includes('magnetic')
          },
          price: null,
          url: link
        });
      }
    }

    // Extract AMS/MMU systems
    const amsKeywords = ['ams', 'mmu', 'multi material', 'multicolor', 'ace', 'ace pro'];
    for (const link of links) {
      const lowerLink = link.toLowerCase();
      if (amsKeywords.some(kw => lowerLink.includes(kw)) && 
          (lowerLink.includes('/products/') || lowerLink.includes('/shop/'))) {
        const urlParts = link.split('/');
        const productSlug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
        const name = productSlug.replace(/-/g, ' ').replace(/\?.*$/, '');
        
        // Look for spool capacity
        const spoolMatch = name.match(/(\d+)\s*(spool|color)/i);
        
        accessories.push({
          type: 'ams_mmu',
          name: name,
          specs: {
            spool_capacity: spoolMatch ? parseInt(spoolMatch[1]) : null,
            heated: lowerLink.includes('heated') || lowerLink.includes('dryer')
          },
          price: null,
          url: link
        });
      }
    }

    console.log(`Found ${accessories.length} accessories: ${accessories.filter(a => a.type === 'nozzle').length} nozzles, ${accessories.filter(a => a.type === 'build_plate').length} plates, ${accessories.filter(a => a.type === 'ams_mmu').length} AMS/MMU`);

    // Compile scraped data
    const scrapedData = {
      timestamp: new Date().toISOString(),
      source_url: printer.official_product_url,
      extracted_specs: extractedSpecs,
      images: {
        screenshot: screenshot ? 'data:image/png;base64,...' : null, // Truncated for storage
        product_images: productImages.slice(0, 10), // First 10 image URLs
      },
      documents: documentLinks.slice(0, 5), // First 5 document links
      raw_content: {
        markdown_preview: markdown.substring(0, 5000), // First 5000 chars
        total_links: links.length,
        has_screenshot: !!screenshot,
      },
      extraction_quality: {
        specs_found: Object.keys(extractedSpecs).length,
        images_found: productImages.length,
        documents_found: documentLinks.length,
      }
    };

    console.log('Scrape complete. Quality:', scrapedData.extraction_quality);

    // Delete existing accessories for this printer
    console.log('Clearing old accessories for printer:', printerId);
    await supabase
      .from('printer_accessories')
      .delete()
      .eq('printer_id', printerId);

    // Insert new accessories
    if (accessories.length > 0) {
      console.log('Inserting', accessories.length, 'accessories');
      const accessoryInserts = accessories.map(acc => ({
        printer_id: printerId,
        accessory_type: acc.type,
        name: acc.name,
        specs: acc.specs,
        price: acc.price,
        product_url: acc.url,
      }));

      const { error: accessoryError } = await supabase
        .from('printer_accessories')
        .insert(accessoryInserts);

      if (accessoryError) {
        console.error('Error inserting accessories:', accessoryError);
      } else {
        console.log('Successfully inserted accessories');
      }
    }

    // Update printer with scraped data - with retry logic
    console.log('Updating database for printer:', printerId);
    let updateAttempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (updateAttempts < maxAttempts) {
      updateAttempts++;
      console.log(`Database update attempt ${updateAttempts}/${maxAttempts}`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('printers')
        .update({
          scraped_data: scrapedData,
          scrape_status: 'completed',
          scrape_completed_at: new Date().toISOString(),
          scrape_error: null,
        })
        .eq('id', printerId)
        .select();

      if (!updateError) {
        console.log('Database update successful:', updateData);
        
        // Verify the update
        const { data: verifyData } = await supabase
          .from('printers')
          .select('scrape_status, scraped_data')
          .eq('id', printerId)
          .single();
        
        if (verifyData?.scrape_status === 'completed' && verifyData?.scraped_data) {
          console.log('Update verified successfully');
          break;
        } else {
          console.warn('Update verification failed, retrying...', verifyData);
          lastError = new Error('Update verification failed');
        }
      } else {
        console.error(`Update attempt ${updateAttempts} failed:`, updateError);
        lastError = updateError;
      }

      if (updateAttempts < maxAttempts) {
        // Wait with exponential backoff before retrying
        const delay = 1000 * Math.pow(2, updateAttempts - 1);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (updateAttempts >= maxAttempts && lastError) {
      console.error('All update attempts failed');
      throw new Error(`Failed to update database after ${maxAttempts} attempts: ${lastError.message || lastError}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        printerId,
        scrapedData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Deep scrape error:', error);
    
    // Try to update error status if we have the printer ID
    const { printerId } = await req.json().catch(() => ({}));
    if (printerId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('printers')
        .update({
          scrape_status: 'failed',
          scrape_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', printerId);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
