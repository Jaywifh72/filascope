import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate price to reject obviously incorrect values
// - Prices below $150 (no real 3D printer costs less)
// - Common promotional discount amounts ($50, $60, $70, $80, $90, $100 off patterns)
function isValidPrinterPrice(price: number | null | undefined): boolean {
  if (price === null || price === undefined) return false;
  
  // Reject prices below $150
  if (price < 150) {
    console.log(`⚠️ Rejected price $${price} - below minimum threshold ($150)`);
    return false;
  }
  
  // Reject common promotional discount amounts (within $5 tolerance)
  const discountAmounts = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140];
  for (const discount of discountAmounts) {
    if (Math.abs(price - discount) <= 5) {
      console.log(`⚠️ Rejected price $${price} - matches common discount pattern (~$${discount} off)`);
      return false;
    }
  }
  
  // Reject suspiciously low round numbers that look like accessory prices
  const accessoryPrices = [13.99, 14.99, 19.99, 24.99, 29.99, 39.99, 49.99];
  for (const accessoryPrice of accessoryPrices) {
    if (Math.abs(price - accessoryPrice) < 1) {
      console.log(`⚠️ Rejected price $${price} - looks like accessory price`);
      return false;
    }
  }
  
  // Reject single-digit prices (obvious errors)
  if (price < 10) {
    console.log(`⚠️ Rejected price $${price} - single digit error`);
    return false;
  }
  
  return true;
}

async function searchPriceWithAI(
  brandName: string,
  modelName: string,
  storeUrl: string | null,
  priceType: 'store' | 'amazon',
  lovableApiKey: string
): Promise<{ success: boolean; price?: number; response?: string }> {
  const priceTypeLabel = priceType === 'store' ? 'official store price' : 'Amazon price';
  const searchQuery = `Based on your training data, what is the ${priceTypeLabel} in USD for the ${brandName} ${modelName} 3D printer${storeUrl ? ` (reference: ${storeUrl})` : ''}? Provide only the numeric price value, without currency symbols. If you cannot find this specific price type, respond with "NOT FOUND".`;

  console.log(`AI searching ${priceType} price for: ${brandName} ${modelName}`, storeUrl ? `(Reference: ${storeUrl})` : '');

  try {
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that provides pricing information for 3D printers based on your training data. Note: You cannot access live websites. Provide pricing from your knowledge of manufacturer prices and Amazon listings. Always provide prices in USD as numeric values only. If you cannot find the SPECIFIC price type requested (store vs Amazon), respond with "NOT FOUND".`
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
    
    console.log(`AI response for ${modelName} (${priceType}):`, priceText);

    // Check if not found
    if (priceText.toUpperCase().includes('NOT FOUND')) {
      return { success: false, response: priceText };
    }

    // Extract numeric price
    const priceMatch = priceText.match(/[\d,]+\.?\d*/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[0].replace(/,/g, ''));
      
      // Use enhanced validation to reject invalid prices
      if (price > 0 && price < 100000 && isValidPrinterPrice(price)) {
        return { success: true, price, response: priceText };
      } else {
        console.log(`⚠️ AI returned price $${price} but failed validation`);
      }
    }

    return { success: false, response: priceText };
  } catch (error) {
    console.error(`Error searching ${priceType} price:`, error);
    return { success: false, response: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    const { printerIds, brand } = await req.json();
    
    console.log(`Starting AI price search with priority: store → amazon (no prices) → amazon (missing)${brand ? ` for brand: ${brand}` : ''}`);

    const results = [];
    let successful = 0;
    let failed = 0;

    // PRIORITY 1 & 2: Printers with NO prices at all - try store first, then Amazon
    let noPriceQuery = supabase
      .from('printers')
      .select('id, printer_id, brand_id, model_name, official_product_url, official_store_url, current_price_usd_store, current_price_usd_amazon, msrp_usd, printer_brands!inner(brand)')
      .is('current_price_usd_store', null)
      .is('current_price_usd_amazon', null)
      .is('msrp_usd', null)
      .limit(7); // Process 7 at a time for priority 1+2

    if (printerIds && printerIds.length > 0) {
      noPriceQuery = noPriceQuery.in('id', printerIds);
    }
    
    if (brand) {
      noPriceQuery = noPriceQuery.eq('printer_brands.brand', brand);
    }

    const { data: noPricePrinters, error: noPriceError } = await noPriceQuery;

    if (noPriceError) {
      console.error('Error fetching no-price printers:', noPriceError);
    } else if (noPricePrinters && noPricePrinters.length > 0) {
      console.log(`\n=== PRIORITY 1 & 2: Processing ${noPricePrinters.length} printers with NO prices ===`);
      
      for (const printer of noPricePrinters) {
        const brandName = (printer.printer_brands as any)?.brand || 'Unknown';
        const storeUrl = printer.official_store_url || printer.official_product_url;

        // Priority 1: Try store price first
        const storeResult = await searchPriceWithAI(brandName, printer.model_name, storeUrl, 'store', lovableApiKey);
        
        if (storeResult.success && storeResult.price) {
          const { error: updateError } = await supabase
            .from('printers')
            .update({ current_price_usd_store: storeResult.price })
            .eq('id', printer.id);

          if (!updateError) {
            console.log(`✓ Priority 1 SUCCESS: Store price for ${printer.model_name}: $${storeResult.price}`);
            successful++;
            results.push({
              printer_id: printer.printer_id,
              model_name: printer.model_name,
              brand: brandName,
              success: true,
              price_type: 'store',
              price: storeResult.price,
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }

        // Priority 2: Store failed, try Amazon price
        console.log(`Store price not found, trying Amazon for ${printer.model_name}...`);
        const amazonResult = await searchPriceWithAI(brandName, printer.model_name, storeUrl, 'amazon', lovableApiKey);
        
        if (amazonResult.success && amazonResult.price) {
          const { error: updateError } = await supabase
            .from('printers')
            .update({ current_price_usd_amazon: amazonResult.price })
            .eq('id', printer.id);

          if (!updateError) {
            console.log(`✓ Priority 2 SUCCESS: Amazon price for ${printer.model_name}: $${amazonResult.price}`);
            successful++;
            results.push({
              printer_id: printer.printer_id,
              model_name: printer.model_name,
              brand: brandName,
              success: true,
              price_type: 'amazon',
              price: amazonResult.price,
            });
          } else {
            failed++;
            results.push({
              printer_id: printer.printer_id,
              model_name: printer.model_name,
              brand: brandName,
              success: false,
              error: 'Database update failed',
            });
          }
        } else {
          console.warn(`✗ Both store and Amazon prices not found for ${printer.model_name}`);
          failed++;
          results.push({
            printer_id: printer.printer_id,
            model_name: printer.model_name,
            brand: brandName,
            success: false,
            error: 'No prices found',
          });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // PRIORITY 3: Printers missing Amazon price (but may have other prices)
    let noAmazonQuery = supabase
      .from('printers')
      .select('id, printer_id, brand_id, model_name, official_product_url, official_store_url, current_price_usd_amazon, printer_brands!inner(brand)')
      .is('current_price_usd_amazon', null)
      .limit(3); // Process 3 more for priority 3

    if (printerIds && printerIds.length > 0) {
      noAmazonQuery = noAmazonQuery.in('id', printerIds);
    }
    
    if (brand) {
      noAmazonQuery = noAmazonQuery.eq('printer_brands.brand', brand);
    }

    const { data: noAmazonPrinters, error: noAmazonError } = await noAmazonQuery;

    if (noAmazonError) {
      console.error('Error fetching no-amazon printers:', noAmazonError);
    } else if (noAmazonPrinters && noAmazonPrinters.length > 0) {
      console.log(`\n=== PRIORITY 3: Processing ${noAmazonPrinters.length} printers missing Amazon prices ===`);
      
      for (const printer of noAmazonPrinters) {
        const brandName = (printer.printer_brands as any)?.brand || 'Unknown';
        const storeUrl = printer.official_store_url || printer.official_product_url;

        const amazonResult = await searchPriceWithAI(brandName, printer.model_name, storeUrl, 'amazon', lovableApiKey);
        
        if (amazonResult.success && amazonResult.price) {
          const { error: updateError } = await supabase
            .from('printers')
            .update({ current_price_usd_amazon: amazonResult.price })
            .eq('id', printer.id);

          if (!updateError) {
            console.log(`✓ Priority 3 SUCCESS: Amazon price for ${printer.model_name}: $${amazonResult.price}`);
            successful++;
            results.push({
              printer_id: printer.printer_id,
              model_name: printer.model_name,
              brand: brandName,
              success: true,
              price_type: 'amazon',
              price: amazonResult.price,
            });
          } else {
            failed++;
            results.push({
              printer_id: printer.printer_id,
              model_name: printer.model_name,
              brand: brandName,
              success: false,
              error: 'Database update failed',
            });
          }
        } else {
          console.warn(`✗ Amazon price not found for ${printer.model_name}`);
          failed++;
          results.push({
            printer_id: printer.printer_id,
            model_name: printer.model_name,
            brand: brandName,
            success: false,
            error: 'Amazon price not found',
          });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const totalProcessed = (noPricePrinters?.length || 0) + (noAmazonPrinters?.length || 0);

    if (totalProcessed === 0) {
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

    return new Response(
      JSON.stringify({
        message: `AI price search completed: ${successful} successful, ${failed} failed`,
        total_processed: totalProcessed,
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
