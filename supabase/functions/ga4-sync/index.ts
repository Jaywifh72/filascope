import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Helpers ----------------------------------------------------------------

function base64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/** Import PEM-encoded RSA private key as a CryptoKey for RS256 signing */
async function importRsaPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const derBinary = atob(pemBody);
  const derBuffer = new Uint8Array(derBinary.length);
  for (let i = 0; i < derBinary.length; i++) derBuffer[i] = derBinary.charCodeAt(i);
  return crypto.subtle.importKey(
    "pkcs8",
    derBuffer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/** Build and sign a service-account JWT, exchange it for a Bearer token */
async function getGa4AccessToken(creds: {
  client_email: string;
  private_key: string;
  token_uri: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: creds.token_uri,
    exp: now + 3600,
    iat: now,
  };

  const enc = new TextEncoder();
  const headerB64 = base64urlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const privateKey = await importRsaPrivateKey(creds.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    enc.encode(signingInput)
  );
  const signatureB64 = base64urlEncode(signature);
  const jwt = `${signingInput}.${signatureB64}`;

  const tokenResp = await fetch(creds.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResp.ok) {
    const text = await tokenResp.text();
    throw new Error(`Token exchange failed: ${tokenResp.status} ${text}`);
  }
  const { access_token } = await tokenResp.json();
  return access_token as string;
}

/** Run a GA4 Data API report */
async function runGa4Report(
  accessToken: string,
  propertyId: string,
  reportBody: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reportBody),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GA4 API error: ${resp.status} ${text}`);
  }

  return await resp.json();
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapDateRange(range: string): string {
  switch (range) {
    case "7d": return "7daysAgo";
    case "90d": return "90daysAgo";
    case "30d":
    default: return "30daysAgo";
  }
}

// --- Main handler -----------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. Validate caller -- accept service role key (cron) or admin user JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    let authorized = false;

    // Allow cron / internal calls that present the service role key directly
    if (token === serviceRoleKey) {
      authorized = true;
    } else if (token) {
      // Validate as a logged-in admin user
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: userData } = await supabaseUser.auth.getUser();
      if (userData?.user?.id) {
        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (roleData) authorized = true;
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check for GA4 credentials
    const credJson = Deno.env.get("GSC_SERVICE_ACCOUNT_JSON");
    if (!credJson) {
      return new Response(
        JSON.stringify({ error: "GSC_SERVICE_ACCOUNT_JSON not configured", code: "NO_CREDENTIALS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try parsing as JSON first; if it fails, try base64 decoding
    let parsedJson = credJson;
    try {
      JSON.parse(credJson);
    } catch {
      // Likely base64 encoded
      parsedJson = new TextDecoder().decode(Uint8Array.from(atob(credJson), c => c.charCodeAt(0)));
    }
    const creds = JSON.parse(parsedJson);
    if (!creds.client_email || !creds.private_key || !creds.token_uri) {
      return new Response(
        JSON.stringify({ error: "Invalid service account JSON", code: "INVALID_CREDENTIALS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const propertyId = Deno.env.get("GA4_PROPERTY_ID");
    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: "GA4_PROPERTY_ID not configured", code: "NO_PROPERTY_ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parse request body for date range
    const body = await req.json().catch(() => ({}));
    const dateRange: string = body.date_range ?? "30d";
    const startDate = mapDateRange(dateRange);
    const today = getTodayDate();

    // 4. Get OAuth token
    const accessToken = await getGa4AccessToken(creds);

    // 5. Run all 4 GA4 reports
    let totalSynced = 0;

    // --- Call 1: Daily summaries ---
    const dailyReport = await runGa4Report(accessToken, propertyId, {
      dateRanges: [{ startDate, endDate: "yesterday" }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    });

    const dailyRows = ((dailyReport as any).rows ?? []).map((row: any) => {
      const dateRaw = row.dimensionValues[0].value; // YYYYMMDD
      const dateFormatted = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`;
      return {
        date: dateFormatted,
        metric_type: "daily_summary",
        data: {
          sessions: Number(row.metricValues[0].value),
          totalUsers: Number(row.metricValues[1].value),
          screenPageViews: Number(row.metricValues[2].value),
          bounceRate: Number(row.metricValues[3].value),
          averageSessionDuration: Number(row.metricValues[4].value),
        },
      };
    });

    if (dailyRows.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from("ga4_analytics")
        .upsert(dailyRows, { onConflict: "date,metric_type", ignoreDuplicates: false });
      if (upsertError) throw new Error(`Daily summary upsert failed: ${upsertError.message}`);
      totalSynced += dailyRows.length;
    }

    // --- Call 2: Top pages ---
    const pagesReport = await runGa4Report(accessToken, propertyId, {
      dateRanges: [{ startDate, endDate: "yesterday" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "averageSessionDuration" },
      ],
      limit: "20",
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    });

    const topPages = ((pagesReport as any).rows ?? []).map((row: any) => ({
      pagePath: row.dimensionValues[0].value,
      screenPageViews: Number(row.metricValues[0].value),
      totalUsers: Number(row.metricValues[1].value),
      averageSessionDuration: Number(row.metricValues[2].value),
    }));

    {
      const { error: upsertError } = await supabaseAdmin
        .from("ga4_analytics")
        .upsert(
          [{ date: today, metric_type: "top_pages", data: topPages }],
          { onConflict: "date,metric_type", ignoreDuplicates: false }
        );
      if (upsertError) throw new Error(`Top pages upsert failed: ${upsertError.message}`);
      totalSynced += 1;
    }

    // --- Call 3: Traffic sources ---
    const sourcesReport = await runGa4Report(accessToken, propertyId, {
      dateRanges: [{ startDate, endDate: "yesterday" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });

    const trafficSources = ((sourcesReport as any).rows ?? []).map((row: any) => ({
      channelGroup: row.dimensionValues[0].value,
      sessions: Number(row.metricValues[0].value),
      totalUsers: Number(row.metricValues[1].value),
    }));

    {
      const { error: upsertError } = await supabaseAdmin
        .from("ga4_analytics")
        .upsert(
          [{ date: today, metric_type: "traffic_sources", data: trafficSources }],
          { onConflict: "date,metric_type", ignoreDuplicates: false }
        );
      if (upsertError) throw new Error(`Traffic sources upsert failed: ${upsertError.message}`);
      totalSynced += 1;
    }

    // --- Call 4: Devices ---
    const devicesReport = await runGa4Report(accessToken, propertyId, {
      dateRanges: [{ startDate, endDate: "yesterday" }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }],
    });

    const devices = ((devicesReport as any).rows ?? []).map((row: any) => ({
      deviceCategory: row.dimensionValues[0].value,
      sessions: Number(row.metricValues[0].value),
    }));

    {
      const { error: upsertError } = await supabaseAdmin
        .from("ga4_analytics")
        .upsert(
          [{ date: today, metric_type: "devices", data: devices }],
          { onConflict: "date,metric_type", ignoreDuplicates: false }
        );
      if (upsertError) throw new Error(`Devices upsert failed: ${upsertError.message}`);
      totalSynced += 1;
    }

    return new Response(
      JSON.stringify({ synced: totalSynced, date_range: dateRange }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ga4-sync error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
