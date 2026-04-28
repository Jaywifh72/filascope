import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyReport {
  period: {
    start: string;
    end: string;
  };
  totalClicks: number;
  topPrograms: Array<{
    brand_name: string;
    clicks: number;
    percentage: number;
  }>;
  topFilaments: Array<{
    product_name: string;
    clicks: number;
    brand: string;
  }>;
  dailyBreakdown: Array<{
    date: string;
    clicks: number;
  }>;
  previousWeekComparison?: {
    totalClicks: number;
    change: number;
    changePercentage: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin, error: roleCheckError } = await supabaseUser.rpc('has_role', {
      _user_id: requestingUser.id,
      _role: 'admin',
    });

    if (roleCheckError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date ranges
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setUTCHours(0, 0, 0, 0);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);

    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setUTCHours(23, 59, 59, 999);

    // Query current week clicks
    const { data: currentWeekClicks, error: currentError } = await supabase
      .from('affiliate_clicks')
      .select('*')
      .gte('clicked_at', weekStart.toISOString())
      .lte('clicked_at', weekEnd.toISOString());

    if (currentError) {
      throw new Error(`Error fetching current week: ${currentError.message}`);
    }

    // Query previous week clicks for comparison
    const { data: prevWeekClicks, error: prevError } = await supabase
      .from('affiliate_clicks')
      .select('*')
      .gte('clicked_at', prevWeekStart.toISOString())
      .lte('clicked_at', prevWeekEnd.toISOString());

    if (prevError) {
      console.error('Error fetching previous week (non-critical):', prevError.message);
    }

    const clicks = currentWeekClicks || [];
    const prevClicks = prevWeekClicks || [];

    // Calculate total clicks
    const totalClicks = clicks.length;

    // Calculate top programs by brand
    const brandCounts = new Map<string, number>();
    clicks.forEach(click => {
      const brand = click.brand_name || 'Unknown';
      brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
    });

    const topPrograms = Array.from(brandCounts.entries())
      .map(([brand_name, clicks]) => ({
        brand_name,
        clicks,
        percentage: ((clicks / totalClicks) * 100).toFixed(1)
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Calculate top filaments/products
    const productCounts = new Map<string, { clicks: number; brand: string }>();
    clicks.forEach(click => {
      if (click.product_name) {
        const key = click.product_name;
        const existing = productCounts.get(key);
        productCounts.set(key, {
          clicks: (existing?.clicks || 0) + 1,
          brand: click.brand_name || 'Unknown'
        });
      }
    });

    const topFilaments = Array.from(productCounts.entries())
      .map(([product_name, data]) => ({
        product_name,
        clicks: data.clicks,
        brand: data.brand
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Calculate daily breakdown
    const dailyBreakdown = new Map<string, number>();
    clicks.forEach(click => {
      const date = new Date(click.clicked_at).toISOString().split('T')[0];
      dailyBreakdown.set(date, (dailyBreakdown.get(date) || 0) + 1);
    });

    const dailyData = Array.from(dailyBreakdown.entries())
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate week-over-week comparison
    const previousWeekComparison = prevClicks.length > 0 ? {
      totalClicks: prevClicks.length,
      change: totalClicks - prevClicks.length,
      changePercentage: prevClicks.length > 0
        ? (((totalClicks - prevClicks.length) / prevClicks.length) * 100).toFixed(1)
        : 'N/A'
    } : undefined;

    const report: WeeklyReport = {
      period: {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
      },
      totalClicks,
      topPrograms,
      topFilaments,
      dailyBreakdown: dailyData,
      previousWeekComparison
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in affiliate-report function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
