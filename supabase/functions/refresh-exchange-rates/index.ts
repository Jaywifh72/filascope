import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Exchange rate API endpoint (using a free API)
const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify authorization (optional, but recommended)
    const authHeader = req.headers.get('Authorization');
    if (authHeader && !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching exchange rates from external API...');

    // Fetch current exchange rates
    const response = await fetch(EXCHANGE_RATE_API_URL);
    if (!response.ok) {
      throw new Error(`Exchange rate API failed: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Received exchange rates:', {
      base: data.base,
      date: data.date,
      currencies: Object.keys(data.rates).length
    });

    // Supported currencies
    const supportedCurrencies = [
      'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 
      'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CNY'
    ];

    const exchangeRateDate = new Date().toISOString();
    const updates = [];

    // Update each supported currency
    for (const currency of supportedCurrencies) {
      const rateToUsd = currency === 'USD' ? 1.0 : data.rates[currency];
      
      if (rateToUsd === undefined) {
        console.warn(`No rate found for ${currency}, skipping`);
        continue;
      }

      // Upsert exchange rate
      const { data: upsertData, error } = await supabase
        .from('exchange_rates')
        .upsert(
          {
            currency_code: currency,
            rate_to_usd: rateToUsd,
            exchange_rate_date: exchangeRateDate,
            source: 'api',
            confidence: 0.95
          },
          { onConflict: 'currency_code' }
        );

      if (error) {
        console.error(`Failed to update ${currency}:`, error);
        continue;
      }

      updates.push({ currency, rateToUsd });
    }

    // Get statistics
    const { count } = await supabase
      .from('exchange_rates')
      .select('*', { count: 'exact', head: true });

    console.log(`Successfully updated ${updates.length} currencies`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Exchange rates refreshed successfully`,
        updated_count: updates.length,
        total_rates: count,
        exchange_rate_date: exchangeRateDate,
        updated_currencies: updates.map(u => `${u.currency}: ${u.rateToUsd.toFixed(4)}`)
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Exchange rate refresh failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
