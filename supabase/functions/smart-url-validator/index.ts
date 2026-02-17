import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Brand URL patterns for intelligent slug mutation ─────────────────────────
interface BrandPattern {
  domain: RegExp;
  extractHandle: (url: string) => string | null;
  buildUrl: (handle: string, region?: string) => string;
  slugVariants: (handle: string) => string[];
}

const BRAND_PATTERNS: Record<string, BrandPattern> = {
  creality: {
    domain: /store\.creality\.com/i,
    extractHandle: (url) => {
      const m = url.match(/store\.creality\.com(?:\/[a-z]{2})?\/products\/([^?#/]+)/i);
      return m?.[1] || null;
    },
    buildUrl: (handle, region) => {
      const prefix = region && region !== 'US' ? `/${region.toLowerCase()}` : '';
      return `https://store.creality.com${prefix}/products/${handle}`;
    },
    slugVariants: (handle) => {
      const variants = [handle];
      // Try with/without "creality-" prefix
      if (handle.startsWith('creality-')) variants.push(handle.replace('creality-', ''));
      else variants.push(`creality-${handle}`);
      // Try with/without "-3d-printer-filament"
      if (!handle.includes('filament')) variants.push(`${handle}-filament`);
      if (!handle.includes('3d-printer')) variants.push(`${handle}-3d-printer-filament`);
      // Remove trailing suffixes
      variants.push(handle.replace(/-filament$/, '').replace(/-3d-printer-filament$/, ''));
      return [...new Set(variants)];
    },
  },
  bambulab: {
    domain: /store\.bambulab\.com/i,
    extractHandle: (url) => {
      const m = url.match(/(?:[a-z]{2}\.)?store\.bambulab\.com\/products\/([^?#/]+)/i);
      return m?.[1] || null;
    },
    buildUrl: (handle, region) => {
      const sub = region && region !== 'US' ? `${region.toLowerCase()}.` : 'us.';
      return `https://${sub}store.bambulab.com/products/${handle}`;
    },
    slugVariants: (handle) => {
      const variants = [handle];
      if (handle.includes('-pla')) {
        variants.push(handle.replace('-pla-', '-pla-basic-'));
        variants.push(handle.replace('-pla-', '-pla-matte-'));
      }
      if (handle.includes('basic')) variants.push(handle.replace('-basic', ''));
      return [...new Set(variants)];
    },
  },
  esun: {
    domain: /esun3dstore\.com|esun3d\.com/i,
    extractHandle: (url) => {
      const m = url.match(/(?:esun3dstore|esun3d)\.com\/products\/([^?#/]+)/i);
      return m?.[1] || null;
    },
    buildUrl: (handle) => `https://esun3dstore.com/products/${handle}`,
    slugVariants: (handle) => {
      const variants = [handle];
      // Try eSUN naming patterns
      if (handle.includes('esun-')) variants.push(handle.replace('esun-', ''));
      else variants.push(`esun-${handle}`);
      // PLA+ vs PLA-Plus
      if (handle.includes('pla-plus')) variants.push(handle.replace('pla-plus', 'pla+'));
      if (handle.includes('pla+')) variants.push(handle.replace('pla+', 'pla-plus'));
      return [...new Set(variants)];
    },
  },
  formfutura: {
    domain: /formfutura\.com/i,
    extractHandle: (url) => {
      const m = url.match(/formfutura\.com\/(?:products\/)?([^?#/]+)/i);
      return m?.[1] || null;
    },
    buildUrl: (handle) => `https://formfutura.com/${handle}`,
    slugVariants: (handle) => {
      const variants = [handle];
      // FormFutura uses root-level slugs
      if (!handle.includes('formfutura')) variants.push(`${handle}-filament`);
      variants.push(handle.replace(/-filament$/, ''));
      return [...new Set(variants)];
    },
  },
  anycubic: {
    domain: /(?:store\.anycubic|(?:ca|uk|eu|au)\.anycubic)\.com/i,
    extractHandle: (url) => {
      const m = url.match(/(?:store\.anycubic|(?:ca|uk|eu|au)\.anycubic)\.com\/(?:products\/)?([^?#/]+)/i);
      return m?.[1] || null;
    },
    buildUrl: (handle, region) => {
      const regionMap: Record<string, string> = {
        US: 'store', CA: 'ca', UK: 'uk', EU: 'eu', AU: 'au',
      };
      const sub = region ? (regionMap[region.toUpperCase()] || 'store') : 'store';
      return `https://${sub}.anycubic.com/products/${handle}`;
    },
    slugVariants: (handle) => {
      const variants = [handle];
      if (handle.endsWith('-filament')) variants.push(handle.replace(/-filament$/, ''));
      if (!handle.endsWith('-filament')) variants.push(`${handle}-filament`);
      if (handle.includes('3d-printer-')) variants.push(handle.replace('3d-printer-', ''));
      if (!handle.includes('3d-printer-')) variants.push(`3d-printer-${handle}`);
      variants.push(handle.replace(/-1kg$/, '').replace(/-1-75mm$/, ''));
      if (handle.includes('-special')) {
        variants.push(handle.replace('-special', '-special-filament'));
        variants.push(handle.replace('-special-filament', '-special'));
      }
      if (handle.includes('color')) variants.push(handle.replace(/color/g, 'colour'));
      if (handle.includes('colour')) variants.push(handle.replace(/colour/g, 'color'));
      return [...new Set(variants)];
    },
  },
  generic_shopify: {
    domain: /\.myshopify\.com|shopify/i,
    extractHandle: (url) => {
      const m = url.match(/\/products\/([^?#/]+)/i);
      return m?.[1] || null;
    },
    buildUrl: (handle) => handle,
    slugVariants: (handle) => {
      const variants = [handle];
      variants.push(handle.replace(/-/g, '_'));
      variants.push(handle.replace(/_/g, '-'));
      return [...new Set(variants)];
    },
  },
};

// ─── URL diagnosis logic ──────────────────────────────────────────────────────

interface DiagnosisResult {
  original_url: string;
  http_status: number | null;
  failure_reason: string;
  diagnosis_details: Record<string, unknown>;
  suggested_url: string | null;
  suggestion_source: string | null;
  suggestion_confidence: number;
  suggestion_validated: boolean;
}

function identifyBrand(url: string): [string, BrandPattern] | null {
  for (const [name, pattern] of Object.entries(BRAND_PATTERNS)) {
    if (pattern.domain.test(url)) return [name, pattern];
  }
  return null;
}

async function checkUrl(url: string, timeout = 8000): Promise<{ status: number | null; redirectUrl: string | null; error: string | null }> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'FilaScope-URLValidator/2.0' },
    });
    clearTimeout(tid);

    if (res.status >= 300 && res.status < 400) {
      return { status: res.status, redirectUrl: res.headers.get('location'), error: null };
    }
    return { status: res.status, redirectUrl: null, error: null };
  } catch (e: any) {
    if (e.name === 'AbortError') return { status: null, redirectUrl: null, error: 'timeout' };
    return { status: null, redirectUrl: null, error: e.message || 'fetch_error' };
  }
}

async function followRedirects(url: string, maxHops = 5): Promise<{ finalUrl: string; statusCode: number | null; hops: string[] }> {
  const hops: string[] = [url];
  let current = url;
  for (let i = 0; i < maxHops; i++) {
    const { status, redirectUrl } = await checkUrl(current);
    if (!redirectUrl || !status || status < 300 || status >= 400) {
      return { finalUrl: current, statusCode: status, hops };
    }
    const next = redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, current).href;
    hops.push(next);
    current = next;
  }
  return { finalUrl: current, statusCode: null, hops };
}

// ─── Step 4b: Intelligent product search helpers ──────────────────────────────

const GENERIC_SUFFIXES = new Set([
  'filament', '3d', 'printer', '1kg', '2kg', '500g', '1-75mm', '2-85mm', 'printing',
  '3d-printer', '3d-printer-filament', 'for', 'the', 'and', 'with',
]);

const MATERIAL_WORDS = new Set([
  'pla', 'abs', 'petg', 'tpu', 'tpe', 'asa', 'nylon', 'pa', 'pc', 'hips', 'pva',
  'polycarbonate', 'silk', 'matte', 'wood', 'marble', 'metallic', 'glow',
]);

function extractSearchTerms(handle: string): { searchTerms: string; broadTerms: string } {
  const words = handle.split('-').filter(Boolean);

  // Determine if the first word is the material (primary identifier)
  const firstWordIsMaterial = words.length > 0 && MATERIAL_WORDS.has(words[0].toLowerCase());

  const filtered: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i].toLowerCase();
    if (GENERIC_SUFFIXES.has(w)) continue;
    // Only remove material words if they appear at the end (not the primary identifier)
    if (MATERIAL_WORDS.has(w) && i > 0 && i >= words.length - 2 && !firstWordIsMaterial) continue;
    filtered.push(w);
  }

  const searchTerms = filtered.join(' ') || words.slice(0, 3).join(' ');

  // Broad terms: material + first key descriptor
  const material = words.find((w) => MATERIAL_WORDS.has(w.toLowerCase()));
  const descriptor = filtered.find((w) => !MATERIAL_WORDS.has(w.toLowerCase()));
  const broadTerms = [material, descriptor].filter(Boolean).join(' ') || searchTerms;

  return { searchTerms, broadTerms };
}

function fuzzyProductMatch(searchTerms: string, productTitle: string, originalHandle: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const searchNorm = normalize(searchTerms);
  const titleNorm = normalize(productTitle);
  const handleNorm = normalize(originalHandle.replace(/-/g, ' '));

  const searchWords = searchNorm.split(/\s+/).filter(Boolean);
  const titleWords = titleNorm.split(/\s+/).filter(Boolean);

  if (searchWords.length === 0 || titleWords.length === 0) return 0;

  // Word overlap score (each shared word = 0.2, capped at 1.0)
  let overlapCount = 0;
  for (const sw of searchWords) {
    if (titleWords.some((tw) => tw === sw || tw.includes(sw) || sw.includes(tw))) {
      overlapCount++;
    }
  }
  const overlapScore = Math.min(overlapCount * 0.2, 1.0);

  // Sequential word match bonus
  let seqBonus = 0;
  if (searchWords.length >= 2) {
    const searchPhrase = searchWords.join(' ');
    if (titleNorm.includes(searchPhrase)) {
      seqBonus = 0.15;
    }
  }

  // Handle substring match bonus
  let handleBonus = 0;
  const handleWords = handleNorm.split(/\s+/).filter(Boolean);
  const handleOverlap = handleWords.filter((hw) =>
    titleWords.some((tw) => tw === hw || tw.includes(hw))
  ).length;
  if (handleOverlap >= 2) handleBonus = 0.1;

  return Math.min(overlapScore + seqBonus + handleBonus, 1.0);
}

interface SearchResult {
  url: string;
  source: 'cross_region_lookup' | 'shopify_catalog' | 'shopify_search' | 'site_search';
  confidence: number;
  validated: boolean;
  searchQuery: string;
  candidatesFound: number;
}

async function searchStoreProducts(
  originalUrl: string,
  handle: string,
  region?: string,
  brandName?: string,
  supabaseClient?: any,
  productId?: string,
): Promise<SearchResult | null> {
  const startTime = Date.now();
  const TOTAL_TIMEOUT = 20_000;
  const FETCH_TIMEOUT = 8_000;
  const FETCH_HEADERS = { 'User-Agent': 'FilaScope URLValidator/2.0' };
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  let baseUrl: string;
  try {
    const parsed = new URL(originalUrl);
    baseUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }

  const { searchTerms, broadTerms } = extractSearchTerms(handle);
  console.log(`[SearchStore] handle="${handle}" searchTerms="${searchTerms}" broadTerms="${broadTerms}" base="${baseUrl}"`);

  const isTimedOut = () => Date.now() - startTime > TOTAL_TIMEOUT;

  // ── Strategy 0: Cross-region handle lookup ──
  if (supabaseClient && productId && region && region !== 'US') {
    try {
      const { data: filament } = await supabaseClient
        .from('filaments')
        .select('product_url')
        .eq('id', productId)
        .single();

      if (filament?.product_url) {
        const usHandleMatch = filament.product_url.match(/\/products\/([^?#/]+)/i);
        if (usHandleMatch?.[1] && usHandleMatch[1] !== handle) {
          const usHandle = usHandleMatch[1];
          // Build regional URL using the brand pattern if available
          const brandMatch = identifyBrand(originalUrl);
          const candidateUrl = brandMatch
            ? brandMatch[1].buildUrl(usHandle, region)
            : `${baseUrl}/products/${usHandle}`;

          const check = await checkUrl(candidateUrl, FETCH_TIMEOUT);
          if (check.status === 200) {
            console.log(`[SearchStore] Strategy 0 match: US handle "${usHandle}" works on ${region}`);
            return {
              url: candidateUrl,
              source: 'cross_region_lookup',
              confidence: 0.95,
              validated: true,
              searchQuery: usHandle,
              candidatesFound: 1,
            };
          }
        }
      }
    } catch (e) {
      console.log(`[SearchStore] Strategy 0 failed: ${e.message}`);
    }

    if (isTimedOut()) return null;
    await delay(300);
  }

  // ── Strategy A: Shopify /products.json ──
  try {
    let bestMatch: { handle: string; score: number; title: string } | null = null;
    let candidatesFound = 0;

    for (let page = 1; page <= 3 && !isTimedOut(); page++) {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const res = await fetch(`${baseUrl}/products.json?limit=250&page=${page}`, {
        signal: controller.signal,
        headers: FETCH_HEADERS,
      });
      clearTimeout(tid);

      if (!res.ok) break;

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('json')) break;

      const data = await res.json();
      const products = data?.products;
      if (!Array.isArray(products) || products.length === 0) break;

      candidatesFound += products.length;

      for (const product of products) {
        const title = product.title || '';
        const pHandle = product.handle || '';
        const score = fuzzyProductMatch(searchTerms, title, handle);

        // Also check exact title match
        const titleLower = title.toLowerCase();
        const termsLower = searchTerms.toLowerCase();
        let finalScore = score;
        if (titleLower === termsLower) finalScore = Math.max(finalScore, 1.0);
        else if (titleLower.includes(termsLower)) finalScore = Math.max(finalScore, 0.85);

        // Handle similarity bonus
        if (pHandle === handle) finalScore = Math.max(finalScore, 0.95);
        else if (pHandle.includes(handle) || handle.includes(pHandle)) {
          finalScore = Math.max(finalScore, 0.7);
        }

        if (finalScore > (bestMatch?.score || 0)) {
          bestMatch = { handle: pHandle, score: finalScore, title };
        }
      }

      if (products.length < 250) break; // Last page
      await delay(300);
    }

    if (bestMatch && bestMatch.score >= 0.6) {
      const candidateUrl = `${baseUrl}/products/${bestMatch.handle}`;
      const check = await checkUrl(candidateUrl, FETCH_TIMEOUT);
      if (check.status === 200) {
        console.log(`[SearchStore] Strategy A match: "${bestMatch.title}" (score=${bestMatch.score})`);
        return {
          url: candidateUrl,
          source: 'shopify_catalog',
          confidence: bestMatch.score,
          validated: true,
          searchQuery: searchTerms,
          candidatesFound,
        };
      }
    }
  } catch (e) {
    console.log(`[SearchStore] Strategy A failed: ${e.message}`);
  }

  if (isTimedOut()) return null;
  await delay(300);

  // ── Strategy B: Shopify search suggest ──
  try {
    const qTerms = encodeURIComponent(searchTerms);
    const suggestUrl = `${baseUrl}/search/suggest.json?q=${qTerms}&resources[type]=product&resources[limit]=10`;

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const res = await fetch(suggestUrl, { signal: controller.signal, headers: FETCH_HEADERS });
    clearTimeout(tid);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('json')) {
        const data = await res.json();
        const products = data?.resources?.results?.products || [];

        for (const product of products) {
          const productUrl = product.url
            ? (product.url.startsWith('http') ? product.url : `${baseUrl}${product.url}`)
            : null;

          if (!productUrl) continue;

          const check = await checkUrl(productUrl, FETCH_TIMEOUT);
          if (check.status === 200) {
            const score = fuzzyProductMatch(searchTerms, product.title || '', handle);
            console.log(`[SearchStore] Strategy B match: "${product.title}" url=${productUrl}`);
            return {
              url: productUrl,
              source: 'shopify_search',
              confidence: Math.max(score, 0.7),
              validated: true,
              searchQuery: searchTerms,
              candidatesFound: products.length,
            };
          }
          await delay(300);
          if (isTimedOut()) return null;
        }
      }
    }
  } catch (e) {
    console.log(`[SearchStore] Strategy B failed: ${e.message}`);
  }

  if (isTimedOut()) return null;
  await delay(300);

  // ── Strategy C: HTML site search ──
  try {
    const qTerms = encodeURIComponent(broadTerms);
    const searchUrl = `${baseUrl}/search?q=${qTerms}&type=product`;

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const res = await fetch(searchUrl, { signal: controller.signal, headers: FETCH_HEADERS });
    clearTimeout(tid);

    if (res.ok) {
      const html = await res.text();
      const productHandles = new Set<string>();
      const regex = /\/products\/([a-z0-9][a-z0-9-]*[a-z0-9])/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        productHandles.add(match[1]);
      }

      // Filter to relevant handles (contain keywords from original handle)
      const keywords = handle.split('-').filter((w) => w.length > 2 && !GENERIC_SUFFIXES.has(w));
      const relevantHandles = [...productHandles].filter((h) =>
        keywords.some((kw) => h.includes(kw))
      );

      let checked = 0;
      for (const candidateHandle of relevantHandles) {
        if (checked >= 5 || isTimedOut()) break;
        const candidateUrl = `${baseUrl}/products/${candidateHandle}`;
        const check = await checkUrl(candidateUrl, FETCH_TIMEOUT);
        checked++;

        if (check.status === 200) {
          const score = fuzzyProductMatch(searchTerms, candidateHandle.replace(/-/g, ' '), handle);
          console.log(`[SearchStore] Strategy C match: ${candidateHandle}`);
          return {
            url: candidateUrl,
            source: 'site_search',
            confidence: Math.max(score, 0.6),
            validated: true,
            searchQuery: broadTerms,
            candidatesFound: relevantHandles.length,
          };
        }
        await delay(300);
      }
    }
  } catch (e) {
    console.log(`[SearchStore] Strategy C failed: ${e.message}`);
  }

  return null;
}

async function diagnoseUrl(url: string, region?: string, supabaseClient?: any, productId?: string): Promise<DiagnosisResult> {
  const result: DiagnosisResult = {
    original_url: url,
    http_status: null,
    failure_reason: 'unknown',
    diagnosis_details: {},
    suggested_url: null,
    suggestion_source: null,
    suggestion_confidence: 0,
    suggestion_validated: false,
  };

  // Step 1: Check the URL
  const { status, redirectUrl, error } = await checkUrl(url);
  result.http_status = status;

  if (error === 'timeout') {
    result.failure_reason = 'store_down';
    result.diagnosis_details = { error: 'Connection timed out', hint: 'Store may be temporarily unavailable' };
    return result;
  }

  if (error) {
    result.failure_reason = 'store_down';
    result.diagnosis_details = { error, hint: 'DNS or connectivity issue' };
    return result;
  }

  // Step 2: Handle redirects
  if (status && status >= 300 && status < 400 && redirectUrl) {
    const { finalUrl, statusCode, hops } = await followRedirects(url);
    result.diagnosis_details = { redirect_chain: hops, final_status: statusCode };

    // Check if redirect leads to homepage (soft 404)
    try {
      const finalParsed = new URL(finalUrl);
      const originalParsed = new URL(url);
      if (finalParsed.pathname === '/' || finalParsed.pathname === '') {
        result.failure_reason = 'discontinued';
        result.http_status = status;
        result.diagnosis_details = { ...result.diagnosis_details, note: 'Redirects to homepage — product likely discontinued' };
      } else if (finalParsed.hostname !== originalParsed.hostname) {
        result.failure_reason = 'domain_changed';
        result.suggested_url = finalUrl;
        result.suggestion_source = 'redirect_follow';
        result.suggestion_confidence = 0.9;
        // Validate the final URL
        if (statusCode === 200) result.suggestion_validated = true;
      } else {
        result.failure_reason = 'slug_changed';
        result.suggested_url = finalUrl;
        result.suggestion_source = 'redirect_follow';
        result.suggestion_confidence = 0.95;
        if (statusCode === 200) result.suggestion_validated = true;
      }
    } catch {
      result.failure_reason = 'redirect_chain';
    }
    return result;
  }

  // Step 3: URL is valid
  if (status === 200 || status === 204) {
    result.failure_reason = 'none';
    result.diagnosis_details = { note: 'URL is valid' };
    return result;
  }

  // Step 4: URL is broken — try to find a fix
  if (status === 404 || status === 410) {
    result.failure_reason = status === 410 ? 'discontinued' : 'slug_changed';
    result.diagnosis_details = { http_status: status };

    const brandMatch = identifyBrand(url);
    if (brandMatch) {
      const [brandName, pattern] = brandMatch;
      const handle = pattern.extractHandle(url);

      if (handle) {
        result.diagnosis_details = {
          ...result.diagnosis_details,
          brand: brandName,
          handle,
          attempted_variants: [],
        };

        // Try slug variants
        const variants = pattern.slugVariants(handle);
        for (const variant of variants) {
          if (variant === handle) continue;
          const candidateUrl = pattern.buildUrl(variant, region);
          const check = await checkUrl(candidateUrl, 5000);

          (result.diagnosis_details.attempted_variants as string[]).push(`${variant} → ${check.status}`);

          if (check.status === 200) {
            result.suggested_url = candidateUrl;
            result.suggestion_source = 'slug_variant';
            result.suggestion_confidence = 0.85;
            result.suggestion_validated = true;
            result.failure_reason = 'slug_changed';
            return result;
          }

          // If variant redirects to a valid page
          if (check.status && check.status >= 300 && check.status < 400 && check.redirectUrl) {
            const { finalUrl, statusCode } = await followRedirects(candidateUrl, 3);
            if (statusCode === 200) {
              result.suggested_url = finalUrl;
              result.suggestion_source = 'slug_variant';
              result.suggestion_confidence = 0.8;
              result.suggestion_validated = true;
              result.failure_reason = 'slug_changed';
              return result;
            }
          }
        }

        // Try brand-specific domain fixes
        if (brandName === 'esun') {
          const fixedUrl = url
            .replace(/www\.esun3d\.com/gi, 'esun3dstore.com')
            .replace(/esun3d\.com/gi, 'esun3dstore.com');
          if (fixedUrl !== url) {
            const check = await checkUrl(fixedUrl, 5000);
            if (check.status === 200) {
              result.suggested_url = fixedUrl;
              result.suggestion_source = 'brand_fix';
              result.suggestion_confidence = 0.95;
              result.suggestion_validated = true;
              result.failure_reason = 'domain_changed';
              return result;
            }
          }
        }
      }

      // Step 4b: Search store product catalog (brand identified)
      if (handle) {
        const searchResult = await searchStoreProducts(url, handle, region, brandName, supabaseClient, productId);
        if (searchResult) {
          result.suggested_url = searchResult.url;
          result.suggestion_source = searchResult.source;
          result.suggestion_confidence = searchResult.confidence;
          result.suggestion_validated = searchResult.validated;
          result.failure_reason = 'slug_changed';
          result.diagnosis_details = {
            ...result.diagnosis_details,
            search_method: searchResult.source,
            search_query: searchResult.searchQuery,
            candidates_found: searchResult.candidatesFound,
            match_score: searchResult.confidence,
          };
          return result;
        }
      }
    }

    // Step 4b: Search for unknown brands with Shopify-like URLs
    if (!brandMatch && url.includes('/products/')) {
      const handleMatch = url.match(/\/products\/([^?#/]+)/i);
      if (handleMatch?.[1]) {
        const unknownHandle = handleMatch[1];
        result.diagnosis_details = {
          ...result.diagnosis_details,
          brand: 'unknown_shopify',
          handle: unknownHandle,
        };

        const searchResult = await searchStoreProducts(url, unknownHandle, region, undefined, supabaseClient, productId);
        if (searchResult) {
          result.suggested_url = searchResult.url;
          result.suggestion_source = searchResult.source;
          result.suggestion_confidence = searchResult.confidence;
          result.suggestion_validated = searchResult.validated;
          result.failure_reason = 'slug_changed';
          result.diagnosis_details = {
            ...result.diagnosis_details,
            search_method: searchResult.source,
            search_query: searchResult.searchQuery,
            candidates_found: searchResult.candidatesFound,
            match_score: searchResult.confidence,
          };
          return result;
        }
      }
    }

    // No fix found
    result.diagnosis_details = {
      ...result.diagnosis_details,
      note: 'Could not auto-discover correct URL',
    };
    return result;
  }

  // Step 5: Other status codes
  if (status && status >= 500) {
    result.failure_reason = 'store_down';
    result.diagnosis_details = { note: 'Server error — likely temporary' };
  }

  return result;
}

// ─── Edge function handler ────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action = 'scan', url, product_id, region, brand_filter, limit = 50 } = body;

    // ── Single URL diagnosis ──
    if (action === 'diagnose' && url) {
      const diagnosis = await diagnoseUrl(url, region, supabase, product_id);
      return new Response(JSON.stringify({ success: true, diagnosis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Scan products for broken URLs ──
    if (action === 'scan') {
      const regionColumns: Record<string, string> = {
        US: 'product_url',
        CA: 'product_url_ca',
        UK: 'product_url_uk',
        EU: 'product_url_eu',
        AU: 'product_url_au',
        JP: 'product_url_jp',
      };

      // Build query
      let query = supabase
        .from('filaments')
        .select('id, product_title, vendor, product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp')
        .not('product_url', 'is', null)
        .limit(limit);

      if (brand_filter) {
        query = query.ilike('vendor', brand_filter);
      }

      const { data: products, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const results: DiagnosisResult[] = [];
      const repairs: any[] = [];

      // Process in batches of 10
      for (let i = 0; i < (products || []).length; i += 10) {
        const batch = products!.slice(i, i + 10);
        const batchPromises = batch.flatMap((product: any) => {
          const checks: Promise<void>[] = [];
          for (const [regionCode, column] of Object.entries(regionColumns)) {
            const productUrl = product[column];
            if (!productUrl || productUrl === 'DISCONTINUED') continue;

            checks.push(
              diagnoseUrl(productUrl, regionCode, supabase, product.id).then((diagnosis) => {
                if (diagnosis.failure_reason !== 'none') {
                  results.push(diagnosis);
                  repairs.push({
                    original_url: productUrl,
                    product_id: product.id,
                    product_name: product.product_title,
                    brand_name: product.vendor,
                    region: regionCode,
                    url_column: column,
                    http_status: diagnosis.http_status,
                    failure_reason: diagnosis.failure_reason,
                    diagnosis_details: diagnosis.diagnosis_details,
                    suggested_url: diagnosis.suggested_url,
                    suggestion_source: diagnosis.suggestion_source,
                    suggestion_confidence: diagnosis.suggestion_confidence,
                    suggestion_validated: diagnosis.suggestion_validated,
                    status: 'pending',
                  });
                }
              })
            );
          }
          return checks;
        });

        await Promise.all(batchPromises);

        // Delay between batches
        if (i + 10 < products!.length) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      // Insert repair suggestions into queue
      if (repairs.length > 0) {
        const { error: insertError } = await supabase
          .from('url_repair_queue')
          .upsert(repairs, { onConflict: 'id' });

        if (insertError) {
          console.error('Error inserting repairs:', insertError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          products_scanned: products?.length || 0,
          issues_found: results.length,
          auto_fixable: repairs.filter((r) => r.suggested_url).length,
          repairs_queued: repairs.length,
          summary: {
            discontinued: repairs.filter((r) => r.failure_reason === 'discontinued').length,
            slug_changed: repairs.filter((r) => r.failure_reason === 'slug_changed').length,
            domain_changed: repairs.filter((r) => r.failure_reason === 'domain_changed').length,
            store_down: repairs.filter((r) => r.failure_reason === 'store_down').length,
            soft_404: repairs.filter((r) => r.failure_reason === 'soft_404').length,
            unknown: repairs.filter((r) => r.failure_reason === 'unknown').length,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Apply approved repairs ──
    if (action === 'apply') {
      const { repair_ids } = body;
      if (!repair_ids?.length) {
        return new Response(JSON.stringify({ error: 'No repair_ids provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: repairs, error: fetchErr } = await supabase
        .from('url_repair_queue')
        .select('*')
        .in('id', repair_ids)
        .eq('status', 'approved');

      if (fetchErr) throw fetchErr;

      let applied = 0;
      for (const repair of repairs || []) {
        if (!repair.suggested_url || !repair.product_id || !repair.url_column) continue;

        const { error: updateErr } = await supabase
          .from('filaments')
          .update({ [repair.url_column]: repair.suggested_url })
          .eq('id', repair.product_id);

        if (!updateErr) {
          await supabase
            .from('url_repair_queue')
            .update({ status: 'applied', applied_at: new Date().toISOString() })
            .eq('id', repair.id);
          applied++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, applied }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Smart URL validator error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
