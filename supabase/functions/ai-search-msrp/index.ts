import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { printerIds } = await req.json();
    
    console.log(`Starting AI MSRP search for ${printerIds?.length || 'all'} printers`);

    // Fetch printers WITHOUT store prices (store price is the priority)
    let query = supabase
      .from('printers')
      .select('id, printer_id, brand_id, model_name, official_product_url, official_store_url, printer_brands(brand)')
      .is('current_price_usd_store', null)
      .limit(5); // Process 5 at a time to avoid timeouts

    if (printerIds && printerIds.length > 0) {
      query = query.in('id', printerIds);
    }

    const { data: printers, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching printers:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch printers' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!printers || printers.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No printers need price data',
          total_processed: 0,
          successful: 0,
          failed: 0,
          results: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    // Process each printer with AI search
    for (const printer of printers) {
      const brandName = (printer.printer_brands as any)?.brand || 'Unknown';
      
      // Build search query - include official store URL if available
      let searchQuery = '';
      if (printer.official_store_url || printer.official_product_url) {
        const storeUrl = printer.official_store_url || printer.official_product_url;
        searchQuery = `Check this official store page: ${storeUrl} - What is the current price in USD for the ${brandName} ${printer.model_name} 3D printer? If you cannot access that page or find the price there, search for the official store price elsewhere. If no store price is available anywhere, provide the MSRP (manufacturer's suggested retail price). Please provide only the price as a number, without currency symbols. Indicate if it's a store price or MSRP.`;
      } else {
        searchQuery = `What is the current price in USD from the official store for the ${brandName} ${printer.model_name} 3D printer? If official store price is not available, what is the MSRP (manufacturer's suggested retail price)? Please provide only the price as a number, without currency symbols. Indicate if it's a store price or MSRP.`;
      }

      console.log(`AI searching price for: ${brandName} ${printer.model_name}`, printer.official_store_url || printer.official_product_url ? `(URL: ${printer.official_store_url || printer.official_product_url})` : '');

      try {
        // Call Lovable AI Gateway
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
              role: 'system',
              content: 'You are a helpful assistant that finds accurate pricing information for 3D printers. PRIORITY: Always try to find the current official store price first from the manufacturer\'s website. Only provide MSRP if the store price is unavailable. Always provide prices in USD. If you cannot find exact pricing, provide the best estimate from official sources and indicate it is an estimate. In your response, clearly state whether you found a "store price" or "MSRP". Return the price and type in format: "PRICE_VALUE (store price)" or "PRICE_VALUE (MSRP)".'
              },
              {
                role: 'user',
                content: searchQuery
              }
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          throw new Error(`AI Gateway error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const priceText = aiData.choices[0]?.message?.content || '';
        
        console.log(`AI response for ${printer.model_name}:`, priceText);

        // Determine if it's a store price or MSRP
        const isStorePrice = priceText.toLowerCase().includes('store price');
        const isMSRP = priceText.toLowerCase().includes('msrp');

        // Extract numeric price from response
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[0].replace(/,/g, ''));
          
          if (price > 0 && price < 100000) { // Sanity check
            // Determine which field to update based on price type
            const updateField = isStorePrice ? 'current_price_usd_store' : 'msrp_usd';
            const priceType = isStorePrice ? 'store price' : 'MSRP';
            
            // Update the printer with the appropriate price field
            const { error: updateError } = await supabase
              .from('printers')
              .update({ [updateField]: price })
              .eq('id', printer.id);

            if (updateError) {
              console.error(`Error updating printer ${printer.model_name}:`, updateError);
              failed++;
              results.push({
                printer_id: printer.printer_id,
                model_name: printer.model_name,
                brand: brandName,
                success: false,
                error: 'Database update failed',
              });
            } else {
              console.log(`Successfully updated ${priceType} for ${printer.model_name}: $${price}`);
              successful++;
              results.push({
                printer_id: printer.printer_id,
                model_name: printer.model_name,
                brand: brandName,
                success: true,
                msrp_usd: price,
                ai_response: `${priceType}: $${price}`,
              });
            }
          } else {
            console.warn(`Invalid price for ${printer.model_name}: ${price}`);
            failed++;
            results.push({
              printer_id: printer.printer_id,
              model_name: printer.model_name,
              brand: brandName,
              success: false,
              error: 'Invalid price value',
            });
          }
        } else {
          console.warn(`No price found in AI response for ${printer.model_name}`);
          failed++;
          results.push({
            printer_id: printer.printer_id,
            model_name: printer.model_name,
            brand: brandName,
            success: false,
            error: 'No price found in AI response',
          });
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing ${printer.model_name}:`, error);
        failed++;
        results.push({
          printer_id: printer.printer_id,
          model_name: printer.model_name,
          brand: brandName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `AI MSRP search completed: ${successful} successful, ${failed} failed`,
        total_processed: printers.length,
        successful,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-search-msrp function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
