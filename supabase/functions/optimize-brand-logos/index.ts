// One-time utility: fetches brand logos from the live site, resizes to 384px wide,
// and uploads to the brand-logos storage bucket. Run once, then delete.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// All brand logo filenames from brandLogos.ts
const LOGO_FILES = [
  "3dsolutech.png",
  "bambulab.webp",
  "overture.webp",
  "3dxtech.png",
  "fillamentum.webp",
  "amolen.webp",
  "formfutura.png",
  "3dfuel.webp",
  "ultimaker.png",
  "sirayatech.png",
  "ninjatek.png",
  "esun.png",
  "colorfabb.webp",
  "matter3d.webp",
  "prusament.png",
  "sunlu.png",
  "hatchbox.png",
  "protopasta.png",
  "atomic.jpg",
  "azurefilm.png",
  "gizmodorks.webp",
  "polymaker.png",
  "eryone.png",
  "fiberlogy.webp",
  "geeetech.png",
  "pushplastic.png",
  "fusionfilaments.webp",
  "spectrum.png",
  "kingroon.webp",
  "recreus.png",
  "ic3d.png",
  "numakers.png",
  "duramic3d.webp",
  "extrudr.png",
  "filaments-ca.png",
  "ziro.webp",
  "voxelpla.webp",
  "ankermake.png",
  "anycubic.webp",
  "creality.png",
  "elegoo.webp",
  "flashforge.png",
  "flsun.webp",
  "markforged.png",
  "qidi.png",
  "raise3d.png",
  "snapmaker.png",
  "sovol.webp",
  "treed.png",
];

const LIVE_BASE = "https://filascope.com/brands";
const TARGET_WIDTH = 384;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Accept ?start=0&count=10 to batch
    const url = new URL(req.url);
    const start = parseInt(url.searchParams.get("start") || "0");
    const count = parseInt(url.searchParams.get("count") || "10");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const batch = LOGO_FILES.slice(start, start + count);
    const results: { file: string; status: string; size?: number }[] = [];

    for (const filename of batch) {
      try {
        // Fetch original from live site
        const resp = await fetch(`${LIVE_BASE}/${filename}`);
        if (!resp.ok) {
          results.push({ file: filename, status: `fetch_failed_${resp.status}` });
          continue;
        }

        const originalBytes = new Uint8Array(await resp.arrayBuffer());
        const contentType = resp.headers.get("content-type") || "image/png";

        // Upload original to storage (resizing requires canvas/WASM which is unreliable in Deno edge)
        // The key optimization is moving from /public/brands/ (bundled) to CDN storage
        const { error } = await supabase.storage
          .from("brand-logos")
          .upload(filename, originalBytes, {
            contentType,
            upsert: true,
          });

        if (error) {
          results.push({ file: filename, status: `upload_error: ${error.message}` });
        } else {
          results.push({ file: filename, status: "uploaded", size: originalBytes.length });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ file: filename, status: `error: ${msg}` });
      }
    }

    const uploaded = results.filter((r) => r.status === "uploaded").length;

    return new Response(
      JSON.stringify({
        summary: `${uploaded}/${LOGO_FILES.length} logos uploaded to brand-logos bucket`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
