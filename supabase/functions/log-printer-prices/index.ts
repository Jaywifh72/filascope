import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    
    // Create client for auth check
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: hasAdminRole, error: roleError } = await authClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });

    if (roleError || !hasAdminRole) {
      console.log(`Access denied for user ${user.id} - not an admin`);
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    console.log(`Admin ${user.id} starting daily printer price logging...`);

    // Fetch all printers with prices
    const { data: printers, error: printersError } = await supabase
      .from("printers")
      .select("id, current_price_usd_store, current_price_usd_amazon, msrp_usd")
      .or("current_price_usd_store.not.is.null,current_price_usd_amazon.not.is.null,msrp_usd.not.is.null");

    if (printersError) {
      console.error("Error fetching printers:", printersError);
      throw printersError;
    }

    console.log(`Found ${printers?.length || 0} printers with price data`);

    const priceRecords: any[] = [];

    for (const printer of printers || []) {
      // Log store price
      if (printer.current_price_usd_store) {
        priceRecords.push({
          printer_id: printer.id,
          price: printer.current_price_usd_store,
          price_type: "store",
          currency: "USD",
          source: "daily_log",
        });
      }

      // Log Amazon price
      if (printer.current_price_usd_amazon) {
        priceRecords.push({
          printer_id: printer.id,
          price: printer.current_price_usd_amazon,
          price_type: "amazon",
          currency: "USD",
          source: "daily_log",
        });
      }

      // Log MSRP (only if no other prices exist for tracking)
      if (printer.msrp_usd && !printer.current_price_usd_store && !printer.current_price_usd_amazon) {
        priceRecords.push({
          printer_id: printer.id,
          price: printer.msrp_usd,
          price_type: "msrp",
          currency: "USD",
          source: "daily_log",
        });
      }
    }

    console.log(`Inserting ${priceRecords.length} price records...`);

    if (priceRecords.length > 0) {
      const { error: insertError } = await supabase
        .from("printer_price_history")
        .insert(priceRecords);

      if (insertError) {
        console.error("Error inserting price history:", insertError);
        throw insertError;
      }
    }

    console.log("Daily price logging completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: `Logged ${priceRecords.length} price records for ${printers?.length || 0} printers`,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in log-printer-prices:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
