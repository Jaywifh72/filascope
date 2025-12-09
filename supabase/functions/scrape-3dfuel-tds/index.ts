import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 3D-Fuel uses consistent TDS URL patterns based on material type
const TDS_URLS: Record<string, string> = {
  'Pro PCTG': 'https://cdn.shopify.com/s/files/1/2367/7807/files/Pro_PCTG_TDS.pdf',
  'Pro PETG': 'https://cdn.shopify.com/s/files/1/2367/7807/files/Pro_PETG_TDS.pdf',
  'Pro PLA': 'https://cdn.shopify.com/s/files/1/2367/7807/files/Pro_PLA_TDS.pdf',
  'Standard PLA': 'https://cdn.shopify.com/s/files/1/2367/7807/files/Standard_PLA_TDS.pdf',
  'Workday ABS': 'https://cdn.shopify.com/s/files/1/2367/7807/files/Workday_ABS_TDS.pdf',
  'Workday PETG': 'https://cdn.shopify.com/s/files/1/2367/7807/files/Workday_PETG_TDS.pdf',
  'c2renew': 'https://cdn.shopify.com/s/files/1/2367/7807/files/c2renew_TDS.pdf',
  'Buzzed': 'https://cdn.shopify.com/s/files/1/2367/7807/files/Buzzed_TDS.pdf',
  'Entwined': 'https://cdn.shopify.com/s/files/1/2367/7807/files/Entwined_TDS.pdf',
  'Landfillament': 'https://cdn.shopify.com/s/files/1/2367/7807/files/Landfillament_TDS.pdf',
  'Wound Up': 'https://cdn.shopify.com/s/files/1/2367/7807/files/Wound_Up_TDS.pdf',
  'Glass Filled': 'https://cdn.shopify.com/s/files/1/2367/7807/files/Glass_Filled_HTPLA_TDS.pdf',
  'Carbon Fiber Reinforced': 'https://cdn.shopify.com/s/files/1/2367/7807/files/CFR_HTPLA_TDS.pdf',
};

function getMaterialType(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('pro pctg')) return 'Pro PCTG';
  if (lowerTitle.includes('pro petg')) return 'Pro PETG';
  if (lowerTitle.includes('pro pla')) return 'Pro PLA';
  if (lowerTitle.includes('standard pla')) return 'Standard PLA';
  if (lowerTitle.includes('workday abs')) return 'Workday ABS';
  if (lowerTitle.includes('workday petg')) return 'Workday PETG';
  if (lowerTitle.includes('c2renew')) return 'c2renew';
  if (lowerTitle.includes('buzzed')) return 'Buzzed';
  if (lowerTitle.includes('entwined')) return 'Entwined';
  if (lowerTitle.includes('landfillament')) return 'Landfillament';
  if (lowerTitle.includes('wound up')) return 'Wound Up';
  if (lowerTitle.includes('glass filled') || lowerTitle.includes('glass-filled')) return 'Glass Filled';
  if (lowerTitle.includes('carbon fiber') || lowerTitle.includes('cfr')) return 'Carbon Fiber Reinforced';
  
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin } = await authClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get 3D-Fuel filaments missing TDS URLs
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title')
      .eq('vendor', '3D-Fuel')
      .is('tds_url', null)
      .order('product_title');

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch filaments', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${filaments?.length || 0} 3D-Fuel filaments missing TDS URLs`);

    const results = {
      updated: 0,
      skipped: 0,
      details: [] as { title: string; status: string; tds_url?: string }[]
    };

    for (const filament of filaments || []) {
      const materialType = getMaterialType(filament.product_title);
      
      if (!materialType) {
        console.log(`[SKIP] No material type match for: ${filament.product_title}`);
        results.skipped++;
        results.details.push({ title: filament.product_title, status: 'no_match' });
        continue;
      }

      const tdsUrl = TDS_URLS[materialType];
      if (!tdsUrl) {
        console.log(`[SKIP] No TDS URL for material: ${materialType}`);
        results.skipped++;
        results.details.push({ title: filament.product_title, status: 'no_tds_url' });
        continue;
      }

      // Verify TDS URL exists
      try {
        const response = await fetch(tdsUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.log(`[SKIP] TDS URL not accessible for ${filament.product_title}: ${tdsUrl}`);
          results.skipped++;
          results.details.push({ title: filament.product_title, status: 'url_not_accessible' });
          continue;
        }
      } catch (e) {
        console.log(`[SKIP] Failed to verify TDS URL for ${filament.product_title}`);
        results.skipped++;
        results.details.push({ title: filament.product_title, status: 'verification_failed' });
        continue;
      }

      // Update filament with TDS URL
      const { error: updateError } = await supabase
        .from('filaments')
        .update({ tds_url: tdsUrl })
        .eq('id', filament.id);

      if (updateError) {
        console.error(`[ERROR] Failed to update ${filament.product_title}:`, updateError);
        results.details.push({ title: filament.product_title, status: 'update_failed' });
      } else {
        console.log(`[UPDATE] ${filament.product_title} -> ${tdsUrl}`);
        results.updated++;
        results.details.push({ title: filament.product_title, status: 'updated', tds_url: tdsUrl });
      }
    }

    console.log(`Completed: ${results.updated} updated, ${results.skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${results.updated} filaments, skipped ${results.skipped}`,
        ...results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-3dfuel-tds:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
