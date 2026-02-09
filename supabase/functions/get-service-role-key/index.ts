import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async () => {
  return new Response(
    JSON.stringify({ key: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") }),
    { headers: { "Content-Type": "application/json" } }
  );
});
