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

    const supabase = createClient(supabaseUrl, supabaseKey);
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
    
    // Skip resin detection for Anycubic Kobra printers (all FDM)
    const isAnycubicKobra = printer.model_name?.toLowerCase().includes('kobra');
    
    if (!isAnycubicKobra) {
      // Check if this is a resin printer - SKIP ALL RESIN PRINTERS
      const isResinPrinter = (
        lowerMarkdown.includes('resin') ||
        lowerMarkdown.includes('photon') ||
        lowerMarkdown.includes('sla') ||
        lowerMarkdown.includes('dlp') ||
        lowerMarkdown.includes('msla') ||
        (lowerMarkdown.includes('lcd screen') && lowerMarkdown.includes('uv')) ||
        lowerMarkdown.includes('monochrome lcd') ||
        lowerMarkdown.includes('photopolymer') ||
        lowerMarkdown.includes('405nm') || // UV wavelength used in resin printers
        lowerMarkdown.includes('vat polymerization')
      );
      
      if (isResinPrinter) {
        console.log('Detected resin printer - marking as invalid (FDM only)');
        
        await supabase
          .from('printers')
          .update({
            scrape_status: 'failed',
            scrape_error: 'Resin printer detected - only FDM printers are supported',
          })
          .eq('id', printerId);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Resin printer detected - only FDM printers are supported',
            printerId,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('Skipping resin detection for Anycubic Kobra (known FDM)');
    }

    // Extract comprehensive specifications from markdown
    const extractedSpecs = {
      // Dimensions
      build_volume_x_mm: extractNumber(markdown, ['build volume', 'print volume', 'x:', 'width']),
      build_volume_y_mm: extractNumber(markdown, ['build volume', 'print volume', 'y:', 'depth']),
      build_volume_z_mm: extractNumber(markdown, ['build volume', 'print volume', 'z:', 'height']),
      machine_width_mm: extractNumber(markdown, ['machine size', 'dimensions', 'width']),
      machine_depth_mm: extractNumber(markdown, ['machine size', 'dimensions', 'depth']),
      machine_height_mm: extractNumber(markdown, ['machine size', 'dimensions', 'height']),
      machine_weight_kg: extractNumber(markdown, ['weight', 'kg']),
      
      // Temperatures
      max_nozzle_temp_c: extractNumber(markdown, ['nozzle temp', 'hotend temp', 'max temp', '°c']),
      bed_max_temp_c: extractNumber(markdown, ['bed temp', 'heated bed', 'plate temp']),
      sustained_nozzle_temp_c: extractNumber(markdown, ['sustained temp', 'continuous temp']),
      
      // Speed & Performance
      max_print_speed_mms: extractNumber(markdown, ['max speed', 'print speed', 'mm/s']),
      recommended_quality_speed_mms: extractNumber(markdown, ['recommended speed', 'quality speed']),
      max_acceleration_xy_mmss: extractNumber(markdown, ['acceleration', 'mm/s²']),
      
      // Extruder & Nozzle
      stock_nozzle_diameter_mm: extractNumber(markdown, ['nozzle', 'diameter', 'mm']),
      filament_diameter_mm: extractNumber(markdown, ['filament diameter', '1.75', '2.85']),
      extruder_count: extractNumber(markdown, ['extruder', 'count', 'dual']),
      
      // Connectivity
      has_wifi: lowerMarkdown.includes('wifi') || lowerMarkdown.includes('wi-fi'),
      has_ethernet: lowerMarkdown.includes('ethernet') || lowerMarkdown.includes('lan'),
      has_bluetooth: lowerMarkdown.includes('bluetooth'),
      has_usb_a_port: lowerMarkdown.includes('usb-a') || lowerMarkdown.includes('usb port'),
      has_usb_c_port: lowerMarkdown.includes('usb-c') || lowerMarkdown.includes('usb type-c'),
      has_sd_card: lowerMarkdown.includes('sd card') || lowerMarkdown.includes('microsd'),
      
      // Features
      auto_bed_leveling: lowerMarkdown.includes('auto bed level') || lowerMarkdown.includes('abl'),
      has_enclosure: lowerMarkdown.includes('enclosure') || lowerMarkdown.includes('enclosed'),
      enclosure_heated: lowerMarkdown.includes('heated enclosure') || lowerMarkdown.includes('heated chamber'),
      multi_material_supported: lowerMarkdown.includes('multi material') || lowerMarkdown.includes('ams'),
      abrasive_materials_supported: lowerMarkdown.includes('hardened') || lowerMarkdown.includes('abrasive'),
      remote_monitoring_supported: lowerMarkdown.includes('camera') || lowerMarkdown.includes('monitoring'),
      remote_control_supported: lowerMarkdown.includes('remote control') || lowerMarkdown.includes('cloud'),
      input_shaping_supported: lowerMarkdown.includes('input shaping') || lowerMarkdown.includes('resonance'),
      
      // Display
      screen_type: extractText(markdown, ['screen', 'display', 'touchscreen', 'lcd']),
      screen_size_inch: extractNumber(markdown, ['screen', 'display', 'inch', '"']),
      
      // Materials
      printer_technology: lowerMarkdown.includes('fdm') ? 'FDM' : lowerMarkdown.includes('fff') ? 'FFF' : null,
      official_supported_materials: extractText(markdown, ['materials', 'filament', 'pla', 'abs', 'petg']),
      
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

    // Find product images
    const imageLinks = links.filter((link: string) => 
      /\.(jpg|jpeg|png|webp|gif)$/i.test(link) ||
      link.includes('/products/') ||
      link.includes('/images/')
    );

    // Find document links
    const documentLinks = links.filter((link: string) => 
      /\.(pdf|doc|docx)$/i.test(link) ||
      link.toLowerCase().includes('manual') ||
      link.toLowerCase().includes('datasheet') ||
      link.toLowerCase().includes('spec')
    );

    // Compile scraped data
    const scrapedData = {
      timestamp: new Date().toISOString(),
      source_url: printer.official_product_url,
      extracted_specs: extractedSpecs,
      images: {
        screenshot: screenshot ? 'data:image/png;base64,...' : null, // Truncated for storage
        product_images: imageLinks.slice(0, 10), // First 10 image URLs
      },
      documents: documentLinks.slice(0, 5), // First 5 document links
      raw_content: {
        markdown_preview: markdown.substring(0, 5000), // First 5000 chars
        total_links: links.length,
        has_screenshot: !!screenshot,
      },
      extraction_quality: {
        specs_found: Object.keys(extractedSpecs).length,
        images_found: imageLinks.length,
        documents_found: documentLinks.length,
      }
    };

    console.log('Scrape complete. Quality:', scrapedData.extraction_quality);

    // Update printer with scraped data
    const { error: updateError } = await supabase
      .from('printers')
      .update({
        scraped_data: scrapedData,
        scrape_status: 'completed',
        scrape_completed_at: new Date().toISOString(),
        scrape_error: null,
      })
      .eq('id', printerId);

    if (updateError) {
      throw updateError;
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
