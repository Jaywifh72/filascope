import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active, non-triggered price alerts with their filament's current price
    const { data: alerts, error: alertsError } = await supabase
      .from("price_alerts")
      .select(`
        id,
        filament_id,
        target_price,
        user_id,
        email,
        filament:filaments(
          id,
          product_title,
          variant_price,
          vendor
        )
      `)
      .eq("is_active", true)
      .is("triggered_at", null);

    if (alertsError) {
      throw new Error(`Failed to fetch alerts: ${alertsError.message}`);
    }

    let triggeredCount = 0;
    const triggeredAlerts: Array<{
      id: string;
      filament_name: string;
      target_price: number;
      current_price: number;
      user_id: string | null;
      email: string | null;
    }> = [];

    for (const alert of alerts || []) {
      const currentPrice = (alert.filament as any)?.variant_price;
      if (currentPrice == null) continue;

      // Check if current price is at or below target
      if (currentPrice <= alert.target_price) {
        // Mark alert as triggered
        const { error: updateError } = await supabase
          .from("price_alerts")
          .update({
            triggered_at: new Date().toISOString(),
            triggered_price: currentPrice,
          })
          .eq("id", alert.id);

        if (!updateError) {
          triggeredCount++;
          triggeredAlerts.push({
            id: alert.id,
            filament_name: (alert.filament as any)?.product_title || "Unknown",
            target_price: alert.target_price,
            current_price: currentPrice,
            user_id: alert.user_id,
            email: alert.email,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_alerts_checked: alerts?.length || 0,
        triggered_count: triggeredCount,
        triggered_alerts: triggeredAlerts,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error checking price alerts:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
