import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

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
async function getGscAccessToken(creds: {
  client_email: string;
  private_key: string;
  token_uri: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
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

interface GscRow {
  date: string;
  query: string | null;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  country: string;
  device: string;
}

/** Fetch GSC Search Analytics for a date range with given dimensions */
async function fetchGscRows(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[]
): Promise<GscRow[]> {
  const encodedSite = encodeURIComponent(siteUrl);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`;

  const body = {
    startDate,
    endDate,
    dimensions,
    rowLimit: 25000,
    dataState: "final",
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GSC API error: ${resp.status} ${text}`);
  }

  const json = await resp.json();
  const rows: GscRow[] = [];

  for (const row of json.rows ?? []) {
    const keys: Record<string, string> = {};
    dimensions.forEach((dim, i) => { keys[dim] = row.keys[i]; });
    rows.push({
      date: keys["date"] ?? startDate,
      query: keys["query"] ?? "",
      page: keys["page"] ?? "",
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
      country: keys["country"] ?? "zz",
      device: keys["device"] ?? "DESKTOP",
    });
  }

  return rows;
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. Validate caller — accept service role key (cron) or admin user JWT
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

    // 2. Check for GSC credentials
    const credJson = Deno.env.get("GSC_SERVICE_ACCOUNT_JSON");
    if (!credJson) {
      return new Response(
        JSON.stringify({ error: "GSC_SERVICE_ACCOUNT_JSON not configured", code: "NO_CREDENTIALS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const creds = JSON.parse(credJson);
    if (!creds.client_email || !creds.private_key || !creds.token_uri) {
      return new Response(
        JSON.stringify({ error: "Invalid service account JSON", code: "INVALID_CREDENTIALS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parse request body for date range
    const body = await req.json().catch(() => ({}));
    const startDate: string = body.start_date ?? getDateDaysAgo(3);
    const endDate: string = body.end_date ?? getDateDaysAgo(1);
    const siteUrl: string = body.site_url ?? "https://filascope.com";

    // 4. Get OAuth token
    const accessToken = await getGscAccessToken(creds);

    // 5. Fetch data with query+page+date+country+device dimensions
    const rows = await fetchGscRows(
      accessToken,
      siteUrl,
      startDate,
      endDate,
      ["date", "query", "page", "country", "device"]
    );

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ synced: 0, message: "No data returned from GSC API for date range", date_range: `${startDate} to ${endDate}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Upsert in batches of 500
    const BATCH = 500;
    let totalUpserted = 0;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error: upsertError } = await supabaseAdmin
        .from("search_console_data")
        .upsert(batch, {
          onConflict: "date,query,page,country,device",
          ignoreDuplicates: false,
        });
      if (upsertError) throw new Error(`Upsert failed: ${upsertError.message}`);
      totalUpserted += batch.length;
    }

    return new Response(
      JSON.stringify({ synced: totalUpserted, date_range: `${startDate} to ${endDate}`, site: siteUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("search-console-sync error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
