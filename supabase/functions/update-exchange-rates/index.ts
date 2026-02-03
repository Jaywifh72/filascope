import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Combined list of currencies from both tables
const TARGET_CURRENCIES = [
  'CAD', 'EUR', 'GBP', 'AUD', 'JPY',
  'CNY', 'KRW', 'PLN', 'CZK', 'SEK', 'CHF', 'INR', 'MXN'
];

// Currency metadata for exchange_rates table
const CURRENCY_METADATA: Record<string, { name: string; symbol: string }> = {
  USD: { name: 'US Dollar', symbol: '$' },
  CAD: { name: 'Canadian Dollar', symbol: 'CA$' },
  EUR: { name: 'Euro', symbol: '€' },
  GBP: { name: 'British Pound', symbol: '£' },
  AUD: { name: 'Australian Dollar', symbol: 'A$' },
  JPY: { name: 'Japanese Yen', symbol: '¥' },
  CNY: { name: 'Chinese Yuan', symbol: '¥' },
  KRW: { name: 'South Korean Won', symbol: '₩' },
  PLN: { name: 'Polish Zloty', symbol: 'zł' },
  CZK: { name: 'Czech Koruna', symbol: 'Kč' },
  SEK: { name: 'Swedish Krona', symbol: 'kr' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF' },
  INR: { name: 'Indian Rupee', symbol: '₹' },
  MXN: { name: 'Mexican Peso', symbol: '$' },
};

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

  const startTime = Date.now();

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
      legacyUpdated: [] as string[],
      newTableUpdated: [] as string[],
      skipped: [] as string[],
      errors: [] as { currency: string; error: string }[],
    };

    const fetchedAt = new Date().toISOString();

    // Update each target currency in BOTH tables
    for (const currency of TARGET_CURRENCIES) {
      const rate = data.rates[currency];
      
      if (!rate) {
        console.warn(`Currency ${currency} not found in API response`);
        results.skipped.push(currency);
        continue;
      }

      const inverseRate = 1 / rate; // rate_to_usd = how much USD is 1 unit of currency

      // 1. Update legacy table: currency_exchange_rates
      const { error: legacyError } = await supabase
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

      if (legacyError) {
        console.error(`Error updating legacy table for ${currency}:`, legacyError);
        results.errors.push({ currency, error: `legacy: ${legacyError.message}` });
      } else {
        results.legacyUpdated.push(currency);
      }

      // 2. Update new table: exchange_rates
      const metadata = CURRENCY_METADATA[currency] || { name: currency, symbol: currency };
      const { error: newTableError } = await supabase
        .from('exchange_rates')
        .upsert(
          {
            currency_code: currency,
            currency_name: metadata.name,
            currency_symbol: metadata.symbol,
            rate_to_usd: Math.round(inverseRate * 1000000) / 1000000, // 6 decimal precision
            updated_at: fetchedAt,
          },
          {
            onConflict: 'currency_code',
          }
        );

      if (newTableError) {
        console.error(`Error updating new table for ${currency}:`, newTableError);
        results.errors.push({ currency, error: `new: ${newTableError.message}` });
      } else {
        results.newTableUpdated.push(currency);
      }

      console.log(`Updated ${currency}: rate=${rate}, inverse=${inverseRate.toFixed(6)}`);
    }

    // Ensure USD is always set correctly in new table (rate_to_usd = 1.0)
    await supabase
      .from('exchange_rates')
      .upsert(
        {
          currency_code: 'USD',
          currency_name: 'US Dollar',
          currency_symbol: '$',
          rate_to_usd: 1.0,
          updated_at: fetchedAt,
        },
        { onConflict: 'currency_code' }
      );

    const duration = Date.now() - startTime;

    const summary = {
      success: true,
      timestamp: fetchedAt,
      source: 'exchangerate-api.com',
      base_currency: 'USD',
      legacy_updated_count: results.legacyUpdated.length,
      new_table_updated_count: results.newTableUpdated.length + 1, // +1 for USD
      skipped_count: results.skipped.length,
      error_count: results.errors.length,
      updated_currencies: results.newTableUpdated,
      skipped_currencies: results.skipped,
      errors: results.errors,
      duration_ms: duration,
    };

    // Log to sync_logs
    await supabase.from('sync_logs').insert({
      sync_type: 'exchange_rates',
      data_source: 'exchangerate-api.com',
      status: results.errors.length > 0 ? 'completed_with_errors' : 'completed',
      records_updated: results.newTableUpdated.length + 1,
      success_details: {
        api_date: data.time_last_update_utc,
        currencies_updated: results.newTableUpdated,
        legacy_updated: results.legacyUpdated,
        duration_ms: duration,
        sample_rates: {
          CAD: data.rates['CAD'],
          EUR: data.rates['EUR'],
          GBP: data.rates['GBP'],
        },
      },
      error_message: results.errors.length > 0 
        ? results.errors.map(e => `${e.currency}: ${e.error}`).join('; ')
        : null,
    });

    console.log('Update complete:', summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Exchange rate update failed:', error);

    // Log failure to sync_logs
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from('sync_logs').insert({
        sync_type: 'exchange_rates',
        data_source: 'exchangerate-api.com',
        status: 'failed',
        records_updated: 0,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        success_details: { duration_ms: duration },
      });
    } catch (logError) {
      console.error('Failed to log error to sync_logs:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
