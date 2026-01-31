import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Target currencies to update (USD base)
const TARGET_CURRENCIES = [
  'CAD', 'EUR', 'GBP', 'AUD', 'JPY',
  'CNY', 'KRW', 'PLN', 'CZK', 'SEK', 'CHF', 'INR'
];

interface ExchangeRateApiResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting exchange rate update...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch latest rates from exchangerate-api.com (free tier, no API key needed)
    const apiUrl = 'https://open.er-api.com/v6/latest/USD';
    console.log(`Fetching rates from: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: ExchangeRateApiResponse = await response.json();

    if (data.result !== 'success') {
      throw new Error(`API returned error: ${JSON.stringify(data)}`);
    }

    console.log(`Received ${Object.keys(data.rates).length} rates, last update: ${data.time_last_update_utc}`);

    // Track results
    const results = {
      updated: [] as string[],
      skipped: [] as string[],
      errors: [] as { currency: string; error: string }[],
    };

    const fetchedAt = new Date().toISOString();

    // Update each target currency
    for (const currency of TARGET_CURRENCIES) {
      const rate = data.rates[currency];
      
      if (!rate) {
        console.warn(`Currency ${currency} not found in API response`);
        results.skipped.push(currency);
        continue;
      }

      const inverseRate = 1 / rate;

      // Upsert the rate into the database
      const { error } = await supabase
        .from('currency_exchange_rates')
        .upsert(
          {
            base_currency: 'USD',
            target_currency: currency,
            rate: rate,
            inverse_rate: inverseRate,
            source: 'exchangerate-api.com',
            fetched_at: fetchedAt,
          },
          {
            onConflict: 'target_currency',
          }
        );

      if (error) {
        console.error(`Error updating ${currency}:`, error);
        results.errors.push({ currency, error: error.message });
      } else {
        console.log(`Updated ${currency}: ${rate} (inverse: ${inverseRate.toFixed(6)})`);
        results.updated.push(currency);
      }
    }

    const summary = {
      success: true,
      timestamp: fetchedAt,
      source: 'exchangerate-api.com',
      base_currency: 'USD',
      updated_count: results.updated.length,
      skipped_count: results.skipped.length,
      error_count: results.errors.length,
      updated_currencies: results.updated,
      skipped_currencies: results.skipped,
      errors: results.errors,
    };

    console.log('Update complete:', summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Exchange rate update failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
