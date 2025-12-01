import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Parse basic specs from markdown content
    const extractedSpecs = {
      source: 'markdown_parsed',
      content_length: markdown.length,
      has_price: markdown.toLowerCase().includes('price') || markdown.includes('$'),
      has_specs: markdown.toLowerCase().includes('specification') || markdown.toLowerCase().includes('features'),
    };
    console.log('Basic data extracted from markdown');

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
