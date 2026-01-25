import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  entityType: string;
  entityId: string;
  urlField: string;
  url: string;
  errorType?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ReportRequest = await req.json();
    const { entityType, entityId, urlField, url, errorType } = body;

    // Validate required fields
    if (!entityType || !entityId || !urlField || !url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: entityType, entityId, urlField, url" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate entity type
    const validEntityTypes = ["filament", "printer", "accessory"];
    if (!validEntityTypes.includes(entityType)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid entityType. Must be one of: ${validEntityTypes.join(", ")}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Simple rate limiting by checking recent reports (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: recentReports } = await supabase
      .from("url_validation_results")
      .select("*", { count: "exact", head: true })
      .eq("entity_id", entityId)
      .eq("url_field", urlField)
      .gte("checked_at", fiveMinutesAgo);

    if (recentReports && recentReports > 0) {
      // Already reported recently, just return success
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "URL already reported recently" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Upsert the broken URL report
    const { error: upsertError } = await supabase
      .from("url_validation_results")
      .upsert({
        entity_type: entityType,
        entity_id: entityId,
        url_field: urlField,
        url: url,
        status: "broken",
        status_code: errorType === "404" ? 404 : null,
        checked_at: new Date().toISOString(),
        manually_verified: false,
        // Note: user-reported entries will have no verified_by field
      }, { 
        onConflict: "entity_type,entity_id,url_field" 
      });

    if (upsertError) {
      console.error("Error upserting URL report:", upsertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to save report" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Broken URL reported: ${entityType}/${entityId}/${urlField} - ${url}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "URL reported successfully" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in report-broken-url:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
