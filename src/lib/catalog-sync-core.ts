/**
 * Catalog Sync Core — Self-contained processing utilities
 *
 * Contains classification, extraction, and diff logic for brand catalog sync.
 * This file has ZERO imports — works in both Deno (edge functions) and browser.
 *
 * IMPORTANT: This is a copy of supabase/functions/_shared/catalog-sync-core.ts
 * for client-side use while the Supabase edge function deployment pipeline is
 * broken (500 internal error on all deploys for project cfqfavmhdbyjzejipiwa).
 * When edge functions are restored, the canonical version is in _shared/.
 *
 * Used by: src/hooks/useCatalogSync.ts (client-side fallback)
 */

// ============================================================
// Types
// ============================================================

export interface ScrapingConfig {
  id: string;
  brand_id: string;
  brand_name: string;
  platform: string;
  base_url: string;
  scrape_method: string;
  adapter_key: string;
  catalog_strategy?: string;
  regional_url_pattern: Record<string, string> | null;
  variant_mapping: Record<string, any>;
  spec_extraction: Record<string, string> | null;
  default_material_type: string | null;
}

export interface ExtractedFilament {
  brand_id: string;
  material: string;
  product_title: string;
  display_name: string;
  color_family: string | null;
  color_hex: string | null;
  featured_image: string | null;
  variant_image: string | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  diameter_nominal_mm: number;
  net_weight_g: number | null;
  product_url: string;
  product_url_us: string | null;
  product_url_eu: string | null;
  product_url_uk: string | null;
  product_url_ca: string | null;
  product_url_au: string | null;
  price_usd: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_cad: number | null;
  price_aud: number | null;
  product_handle: string;
  variant_sku: string | null;
  finish_type: string | null;
  spool_material: string | null;
  spool_outer_d_mm: number | null;
  spool_width_mm: number | null;
  pack_quantity: number;
  print_speed_max_mms: number | null;
  high_speed_capable: boolean | null;
  drying_temp_c: number | null;
  drying_time_hours: number | null;
  variant_available: boolean;
  available_regions: string[];
  weight_source: "body_html" | "variant_title" | "product_title" | null;
}

// ============================================================
// Constants — Compact color maps (core colors only)
// ============================================================

const CHX: Record<string, string> = {
  white:"#FFFFFF",black:"#000000",red:"#E53E3E",blue:"#3B82F6",green:"#22C55E",
  yellow:"#FACC15",orange:"#F97316",pink:"#EC4899",purple:"#8B5CF6",
  grey:"#9CA3AF",gray:"#9CA3AF",brown:"#92400E",beige:"#D2B48C",ivory:"#FFFFF0",
  gold:"#FFD700",silver:"#C0C0C0",bronze:"#CD7F32",copper:"#B87333",
  navy:"#001F3F",teal:"#008080",cyan:"#00BCD4",coral:"#FF7F50",
  salmon:"#FA8072",lavender:"#E6E6FA",turquoise:"#40E0D0",olive:"#808000",
  maroon:"#800000",crimson:"#DC143C",indigo:"#4B0082",lime:"#00FF00",
  mint:"#98FB98",charcoal:"#36454F",cream:"#FFFDD0",rose:"#FF007F",
  transparent:"#FFFFFF",clear:"#FFFFFF",natural:"#F5F5DC",peach:"#FFCBA4",
};

const CFM: Record<string, string> = {
  white:"White",black:"Black",red:"Red",blue:"Blue",green:"Green",
  yellow:"Yellow",orange:"Orange",pink:"Pink",purple:"Purple",
  grey:"Grey",gray:"Grey",brown:"Brown",beige:"Beige",gold:"Gold/Silver",
  silver:"Gold/Silver",navy:"Blue",teal:"Green",cyan:"Blue",coral:"Orange",
  salmon:"Pink",lavender:"Purple",maroon:"Red",crimson:"Red",indigo:"Purple",
  olive:"Green",lime:"Green",mint:"Green",turquoise:"Blue",charcoal:"Black",
  transparent:"Transparent",clear:"Transparent",natural:"Beige",cream:"Beige",
  rose:"Pink",bronze:"Gold/Silver",copper:"Gold/Silver",peach:"Pink",
};

const FILAMENT_KEYWORDS = [
  "filament","pla","petg","abs","tpu","asa","nylon","pa",
  "silk","hspla","pva","hips","pc ","pla+","pla plus",
  "carbon fiber","wood fill","marble","glow","matte pla",
];

const NON_FILAMENT_KEYWORDS = [
  "dryer","printer","resin","enclosure","nozzle","tool",
  "upgrade","accessories","board","protection","warranty",
  "worry-free","wash","cure","lcd","screen","plate",
  "extruder","hotend","hot end","bed leveling","spool holder",
];

const MATERIAL_KEYWORDS_ORDERED = [
  "Silk PLA","Matte PLA","PLA Meta","PLA Galaxy","High Speed PLA",
  "PLA Transparent Series","PLA Neon Series","Wood PLA",
  "PLA+","PLA Plus","PETG-CF","PETG CF","PLA-CF","PLA CF",
  "ABS-GF","PA-CF","PA-GF",
  "PETG","ABS","TPU","ASA","Nylon","PA","PC","PVA","HIPS",
  "HSPLA","HS-PLA","HS PLA","PLA",
];

const MATERIAL_NORMALIZE: Record<string, string> = {
  "pla neon series":"PLA","pla transparent series":"PLA","high speed pla":"HSPLA",
  "hs-pla":"HSPLA","hs pla":"HSPLA","pla plus":"PLA+","pla+":"PLA+",
  "silk pla":"Silk PLA","matte pla":"Matte PLA","pla meta":"PLA Meta",
  "pla galaxy":"PLA Galaxy","wood pla":"Wood PLA","petg-cf":"PETG-CF",
  "petg cf":"PETG-CF","pla-cf":"PLA-CF","pla cf":"PLA-CF",
  "abs-gf":"ABS-GF","pa-cf":"PA-CF","pa-gf":"PA-GF",
};

const KNOWN_COLOR_WORDS = [
  "black","white","red","blue","green","yellow","orange","purple",
  "pink","brown","grey","gray","silver","gold","cyan","magenta",
  "transparent","clear","natural","ivory","beige","tan","olive",
  "teal","navy","maroon","coral","salmon","lavender","turquoise",
  "crimson","charcoal","mint","lime","aqua","indigo","violet",
  "rose","peach","cream","chocolate","bronze","copper","platinum",
];

const REGION_KEYWORDS = ["ship","shipment","country","region","destination"];
const MATERIAL_OPT_KEYWORDS = ["material","type","types","category"];
const COLOR_OPT_KEYWORDS = ["color","colour"];

// ============================================================
// Helpers
// ============================================================

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

export function mapRegionToCode(rv: string | null, rm: Record<string, string>): string | null {
  if (!rv) return null;
  for (const [k, c] of Object.entries(rm)) { if (rv.includes(k)) return c; }
  const l = rv.toLowerCase();
  if (l.includes("usa") || l.includes("united states")) return "US";
  if (l.includes("europe") || l.includes("eu")) return "EU";
  if (l.includes("canada")) return "CA";
  if (l.includes("australia")) return "AU";
  if (l.includes("uk") || l.includes("united kingdom")) return "UK";
  if (/\bus\b/.test(l)) return "US";
  return null;
}

function cleanMaterialAggressive(raw: string): string {
  let s = raw;
  if (s.includes("|")) s = s.split("|")[0];
  s = s.replace(/\(.*?\)/g, "").replace(/\d+(\.\d+)?\s*[kK][gG]/g, "")
    .replace(/\d+[gG]\b/g, "").replace(/\d+\*[A-Z0-9]+/gi, "");
  for (const cw of KNOWN_COLOR_WORDS) s = s.replace(new RegExp(`\\b${cw}\\b`, "gi"), "");
  s = s.replace(/\s+/g, " ").trim();
  const lower = s.toLowerCase();
  if (MATERIAL_NORMALIZE[lower]) return MATERIAL_NORMALIZE[lower];
  if (s.length >= 2 && s.length <= 30) return s.toUpperCase();
  return "";
}

function parseMaterialFromTitle(title: string): string | null {
  const l = title.toLowerCase();
  for (const kw of MATERIAL_KEYWORDS_ORDERED) {
    if (l.includes(kw.toLowerCase())) return MATERIAL_NORMALIZE[kw.toLowerCase()] || kw.toUpperCase();
  }
  return null;
}

function stripMaterialPrefix(colorName: string, material: string): string {
  const prefixes = [material, material.toUpperCase(), material.toLowerCase()];
  let c = colorName.trim();
  for (const p of prefixes) { if (c.startsWith(p + " ")) { c = c.slice(p.length + 1).trim(); break; } }
  return c.replace(/\s*\d+\s*(?:kg|g)\s*$/i, "").trim() || colorName;
}

function cleanColorName(raw: string, material: string): string {
  let s = stripMaterialPrefix(raw, material);
  if (s.includes("|")) {
    const parts = s.split("|").map((p) => p.trim());
    const colorPart = parts.find((p) => KNOWN_COLOR_WORDS.some((cw) => p.toLowerCase().includes(cw)));
    s = colorPart || parts.reduce((a, b) => (a.length <= b.length ? a : b));
  }
  s = s.replace(/\d+(\.\d+)?\s*[kK][gG]/g, "").replace(/\d+[gG]\b/g, "")
    .replace(/\((AU|EU|US|UK|CA)\s*PLUG\)/gi, "").replace(/\(.*?PLUG.*?\)/gi, "")
    .replace(/\d+\*[A-Z0-9]+/gi, "").replace(/DLZ-\w+/gi, "").replace(/\(.*?\)/g, "")
    .replace(/\s*\+\s*/g, " ").replace(/\s+/g, " ").trim()
    .replace(/^[-–—]+|[-–—]+$/g, "").trim();
  return s.length > 0 ? titleCase(s) : "Default";
}

function makeDisplayName(material: string, color: string): string {
  return !color || color === "Default" ? material : `${material} - ${color}`;
}

function guessColorHex(name: string): string | null {
  const l = name.toLowerCase().trim();
  if (CHX[l]) return CHX[l];
  let best = "";
  for (const k of Object.keys(CHX)) { if (l.includes(k) && k.length > best.length) best = k; }
  return best ? CHX[best] : null;
}

function guessColorFamily(name: string): string | null {
  const l = name.toLowerCase().trim();
  for (const [k, f] of Object.entries(CFM)) { if (l.includes(k)) return f; }
  return null;
}

function guessFinishType(material: string, title: string): string {
  const c = `${material} ${title}`.toLowerCase();
  if (c.includes("silk")) return "Silk";
  if (c.includes("matte")) return "Matte";
  if (c.includes("marble")) return "Marble";
  if (c.includes("galaxy")) return "Galaxy";
  if (c.includes("sparkle") || c.includes("glitter")) return "Sparkle";
  if (c.includes("glow") || c.includes("luminous")) return "Glow-in-the-Dark";
  if (c.includes("transparent") || c.includes("translucent")) return "Transparent";
  if (c.includes("neon")) return "Neon";
  if (c.includes("wood")) return "Wood Fill";
  if (c.includes("carbon")) return "Carbon Fiber";
  if (c.includes("rainbow")) return "Rainbow";
  return "Standard";
}

function extractWeightFromText(text: string): number | null {
  if (!text) return null;
  const kg = text.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kg?.[1]) { const w = parseFloat(kg[1]) * 1000; if (w > 0 && w <= 50000) return Math.round(w); }
  const g = text.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  if (g?.[1]) { const w = parseFloat(g[1]); if (w > 0 && w <= 50000) return Math.round(w); }
  const lb = text.match(/(\d+(?:\.\d+)?)\s*lb/i);
  if (lb?.[1]) { const w = parseFloat(lb[1]) * 453.592; if (w > 0 && w <= 50000) return Math.round(w); }
  return null;
}

function detectOptionPositions(product: any, config: ScrapingConfig): {
  regionKey: string | null; materialKey: string | null; colorKey: string | null;
} {
  const fb = {
    regionKey: config.variant_mapping?.region_option || "option1",
    materialKey: config.variant_mapping?.material_option || "option2",
    colorKey: config.variant_mapping?.color_option || "option3",
  };
  if (!product?.options?.length) return fb;

  let regionKey: string | null = null;
  let materialKey: string | null = null;
  let colorKey: string | null = null;

  for (const opt of product.options) {
    const name = (opt.name || "").toLowerCase().trim();
    const key = `option${opt.position}`;

    if (name.includes("material") && name.includes("color")) { colorKey = key; continue; }
    if (!regionKey && REGION_KEYWORDS.some((kw) => name.includes(kw))) regionKey = key;
    else if (!colorKey && COLOR_OPT_KEYWORDS.some((kw) => name.includes(kw))) colorKey = key;
    else if (!materialKey && MATERIAL_OPT_KEYWORDS.some((kw) => name.includes(kw))) materialKey = key;
  }

  return {
    regionKey: regionKey || fb.regionKey,
    materialKey: materialKey || fb.materialKey,
    colorKey: colorKey || fb.colorKey,
  };
}

// ── Simplified spec extraction from body_html ──

function parseSpecsFromHtml(bodyHtml: string, specConfig: Record<string, string> | null): {
  nozzleTempMin: number | null; nozzleTempMax: number | null;
  bedTempMin: number | null; bedTempMax: number | null;
  netWeight: number | null; diameter: number | null;
  printSpeedMax: number | null; weightSource: "body_html" | null;
} {
  const r = {
    nozzleTempMin: null as number | null, nozzleTempMax: null as number | null,
    bedTempMin: null as number | null, bedTempMax: null as number | null,
    netWeight: null as number | null, diameter: null as number | null,
    printSpeedMax: null as number | null, weightSource: null as "body_html" | null,
  };
  if (!bodyHtml) return r;

  const text = bodyHtml.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
  const tryRe = (p: string) => { try { return text.match(new RegExp(p, "i")); } catch { return null; } };

  const dRe = specConfig?.diameter_regex || "(?:Diameter|Filament\\s+Diameter)[:\\s]*([\\d.]+)";
  const dm = tryRe(dRe);
  if (dm?.[1]) r.diameter = parseFloat(dm[1]);

  const nRe = specConfig?.nozzle_temp_regex || "(?:Printing|Nozzle|Extruder)\\s*(?:Temp(?:erature)?)[:\\s]*([\\d]+)\\s*[°℃]?\\s*[–\\-~to]+\\s*([\\d]+)";
  const nm = tryRe(nRe);
  if (nm?.[1] && nm?.[2]) { r.nozzleTempMin = parseInt(nm[1]); r.nozzleTempMax = parseInt(nm[2]); }

  const bRe = specConfig?.bed_temp_regex || "(?:Bed|Platform|Heated\\s*Bed)\\s*(?:Temp(?:erature)?)[:\\s]*([\\d]+)\\s*[°℃]?\\s*[–\\-~to]+\\s*([\\d]+)";
  const bm = tryRe(bRe);
  if (bm?.[1] && bm?.[2]) { r.bedTempMin = parseInt(bm[1]); r.bedTempMax = parseInt(bm[2]); }

  const wRe = specConfig?.weight_regex || "(?:Net\\s+Weight|Weight)[:\\s]*([\\d.]+)\\s*(?:kg|g)";
  const wm = tryRe(wRe);
  if (wm?.[1]) {
    const w = parseFloat(wm[1]);
    r.netWeight = w < 50 ? Math.round(w * 1000) : Math.round(w);
    r.weightSource = "body_html";
  }

  const sRe = specConfig?.speed_regex || "(?:Print(?:ing)?\\s+Speed)[:\\s]*(?:up\\s+to\\s+)?([\\d]+)\\s*(?:mm/s|mm\\/s)";
  const sm = tryRe(sRe);
  if (sm?.[1]) r.printSpeedMax = parseInt(sm[1]);

  return r;
}

// ============================================================
// Classification
// ============================================================

export interface ClassifyResult { isFilament: boolean; reason: string; }

export function classifyProduct(product: any): ClassifyResult {
  const rawTitle = product.title || "";
  const title = rawTitle.toLowerCase();
  const productType = (product.product_type || "").toLowerCase();
  // tags can be an array (Shopify /products.json) or comma-separated string (/products/{handle}.json)
  const rawTags = product.tags || [];
  const tagsArray = typeof rawTags === 'string' ? rawTags.split(',').map((s: string) => s.trim()) : rawTags;
  const tags = tagsArray.map((t: string) => t.toLowerCase());
  const optionNames = (product.options || []).map((o: any) => (o.name || "").toLowerCase());

  if (/^\[.+only\]/i.test(rawTitle)) return { isFilament: false, reason: "regional_clearance" };
  if (title.includes("clearance")) return { isFilament: false, reason: "clearance" };
  if (title.includes("combo") && (title.includes("mix") || title.includes("sampler")))
    return { isFilament: false, reason: "combo_sampler" };
  if (title.includes("bundle") && (/\d+g\s*\*\s*\d+/i.test(title) || title.includes("pack")))
    return { isFilament: false, reason: "bundle" };
  if (optionNames.some((n: string) => n === "price" || n === "note"))
    return { isFilament: false, reason: "service_product" };

  const HARD_EXCLUSIONS = [
    "dryer","filadryer","printer","enclosure","resin","nozzle","extruder",
    "hotend","hot end","build plate","pei","bed leveling","spool holder",
    "filament holder","filament connector","splicer","warranty","worry-free",
    "wash","cure","lcd","screen","upgrade","accessories","board","protection",
  ];
  for (const kw of HARD_EXCLUSIONS) { if (title.includes(kw)) return { isFilament: false, reason: "non_filament" }; }
  if (title.includes("resin") && !title.includes("filament")) return { isFilament: false, reason: "non_filament" };

  const hasRelevantOpt = optionNames.some((n: string) =>
    n.includes("color") || n.includes("material") || n.includes("ship") ||
    n.includes("region") || n.includes("type") || n.includes("variant")
  );
  const hasFKW = FILAMENT_KEYWORDS.some((fk) => title.includes(fk));
  if (!hasRelevantOpt && !hasFKW) return { isFilament: false, reason: "no_relevant_options" };
  if (["3d printers","resin","printer","accessories"].includes(productType) && !hasFKW)
    return { isFilament: false, reason: "non_filament" };
  if (hasFKW) return { isFilament: true, reason: "title_keyword" };
  if (optionNames.some((n: string) => n.includes("material") || n.includes("color"))) {
    if (product.variants?.some((v: any) => v.grams > 500)) return { isFilament: true, reason: "option_heuristic" };
  }
  for (const tag of tags) {
    if (FILAMENT_KEYWORDS.some((kw) => tag.includes(kw))) return { isFilament: true, reason: "tag_keyword" };
  }
  return { isFilament: false, reason: "non_filament" };
}

// ============================================================
// Extraction
// ============================================================

export function extractFilamentsFromProduct(
  product: any, config: ScrapingConfig
): { filaments: ExtractedFilament[]; warnings: string[] } {
  const warnings: string[] = [];
  const filaments: ExtractedFilament[] = [];
  const handle = product.handle || "unknown";

  if (!product.variants?.length) { warnings.push(`'${handle}': no variants`); return { filaments, warnings }; }

  const det = detectOptionPositions(product, config);
  warnings.push(`'${handle}': R=${det.regionKey}, M=${det.materialKey}, C=${det.colorKey}`);

  const regionMap: Record<string, string> = config.variant_mapping?.region_map || {};
  const regionalUrls = config.regional_url_pattern || {};
  const buildUrl = (r: string): string | null => {
    const base = regionalUrls[r]; return base ? `${base.replace(/\/$/, "")}/products/${handle}` : null;
  };

  // Spec extraction from body_html
  const specs = parseSpecsFromHtml(product.body_html || "", config.spec_extraction || null);

  // Weight fallback from variant/product title
  let netWeight = specs.netWeight;
  let weightSource: ExtractedFilament["weight_source"] = specs.weightSource;
  if (netWeight == null) {
    const vw = extractWeightFromText(product.variants?.[0]?.title || "");
    if (vw != null) { netWeight = vw; weightSource = "variant_title"; }
    else {
      const tw = extractWeightFromText(product.title || "");
      if (tw != null) { netWeight = tw; weightSource = "product_title"; }
    }
  }

  function getMaterial(variant: any): string {
    if (det.materialKey) {
      const raw = variant[det.materialKey!];
      if (raw) { const c = cleanMaterialAggressive(raw); if (c && c.length >= 2) return c; }
    }
    return parseMaterialFromTitle(product.title || "") || (config.default_material_type || "PLA").toUpperCase();
  }

  // Group variants by material + color
  const groups: Record<string, any[]> = {};
  for (const v of product.variants) {
    const mat = getMaterial(v);
    let rawColor = det.colorKey ? (v[det.colorKey] || v.title || "Default") : (v.title || "Default");
    const color = cleanColorName(rawColor, mat);
    const key = `${mat}|${color}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(v);
  }

  for (const [groupKey, variants] of Object.entries(groups)) {
    const [material, colorName] = groupKey.split("|");
    let priceUsd: number | null = null, priceEur: number | null = null;
    let priceCad: number | null = null, priceAud: number | null = null, priceGbp: number | null = null;
    const availableRegions: string[] = [];
    let anyAvailable = false;

    if (det.regionKey) {
      for (const v of variants) {
        const rl = v[det.regionKey!] || "";
        const rc = mapRegionToCode(rl, regionMap);
        const price = parseFloat(v.price);
        if (rc && !isNaN(price) && price > 0) {
          if (rc === "US") priceUsd = price; else if (rc === "EU") priceEur = price;
          else if (rc === "CA") priceCad = price; else if (rc === "AU") priceAud = price;
          else if (rc === "UK") priceGbp = price;
          if (v.available && !availableRegions.includes(rc)) { availableRegions.push(rc); anyAvailable = true; }
        }
      }
    } else {
      const price = parseFloat(variants[0].price);
      if (!isNaN(price) && price > 0) {
        priceUsd = price;
        if (variants[0].available) { availableRegions.push("US"); anyAvailable = true; }
      }
    }

    // Images
    const variantIds = variants.map((v: any) => v.id);
    let variantImage: string | null = null;
    for (const v of variants) { if (v.featured_image?.src) { variantImage = v.featured_image.src; break; } }
    if (!variantImage && product.images?.length) {
      const mi = product.images.find((img: any) => img.variant_ids?.some((vid: number) => variantIds.includes(vid)));
      if (mi) variantImage = mi.src;
    }
    const featuredImage = product.images?.[0]?.src || variantImage || null;
    if (!variantImage) variantImage = featuredImage;

    // SKU — prefer US variant
    const usV = det.regionKey
      ? variants.find((v: any) => mapRegionToCode(v[det.regionKey!] || "", regionMap) === "US")
      : null;
    const variantSku = usV?.sku || variants[0]?.sku || null;

    const displayName = makeDisplayName(material, colorName);

    filaments.push({
      brand_id: config.brand_id,
      material,
      product_title: `${config.brand_name} ${displayName}`,
      display_name: displayName,
      color_family: guessColorFamily(colorName),
      color_hex: guessColorHex(colorName),
      featured_image: featuredImage,
      variant_image: variantImage,
      nozzle_temp_min_c: specs.nozzleTempMin,
      nozzle_temp_max_c: specs.nozzleTempMax,
      bed_temp_min_c: specs.bedTempMin,
      bed_temp_max_c: specs.bedTempMax,
      diameter_nominal_mm: specs.diameter || 1.75,
      net_weight_g: netWeight,
      weight_source: weightSource,
      product_url: buildUrl("US") || `${config.base_url}/products/${handle}`,
      product_url_us: buildUrl("US"),
      product_url_eu: buildUrl("EU"),
      product_url_uk: buildUrl("UK"),
      product_url_ca: buildUrl("CA"),
      product_url_au: buildUrl("AU"),
      price_usd: priceUsd, price_eur: priceEur, price_gbp: priceGbp,
      price_cad: priceCad, price_aud: priceAud,
      product_handle: handle,
      variant_sku: variantSku,
      finish_type: guessFinishType(material, colorName),
      spool_material: null,
      spool_outer_d_mm: null,
      spool_width_mm: null,
      print_speed_max_mms: specs.printSpeedMax,
      high_speed_capable: material.includes("HSPLA") || material.includes("HS") ||
        (specs.printSpeedMax !== null && specs.printSpeedMax >= 300),
      drying_temp_c: null,
      drying_time_hours: null,
      pack_quantity: 1,
      variant_available: anyAvailable,
      available_regions: availableRegions,
    });
  }

  return { filaments, warnings };
}

// ============================================================
// Diff
// ============================================================

export interface DiffResult {
  filament: ExtractedFilament;
  status: "new" | "matched" | "price_changed" | "error";
  existingId: string | null;
  priceDiff: { field: string; old: number | null; new: number | null }[] | null;
}

export async function diffAgainstDatabase(
  supabase: any, filaments: ExtractedFilament[], brandId: string, brandName?: string
): Promise<DiffResult[]> {
  const results: DiffResult[] = [];

  const selectFields = "id, variant_sku, material, display_name, product_title, color_family, product_handle, variant_price, price_eur, price_gbp, price_cad, price_aud";

  // Primary: match by brand_id (automated_brands FK)
  const { data: existingById } = await supabase
    .from("filaments")
    .select(selectFields)
    .eq("brand_id", brandId).limit(1000);

  let existing = existingById || [];

  // Fallback: if no matches by brand_id, try matching by vendor name
  // (existing filaments may have been imported with a different brand_id)
  if (existing.length === 0 && brandName) {
    const { data: existingByVendor } = await supabase
      .from("filaments")
      .select(selectFields)
      .eq("vendor", brandName).limit(1000);
    existing = existingByVendor || [];
    if (existing.length > 0) {
      console.log(`[diff] Found ${existing.length} existing filaments by vendor="${brandName}" (brand_id had 0 matches)`);
    }
  }

  // Track which existing IDs have already been matched (avoid N:1 matching)
  const matchedIds = new Set<string>();

  for (const filament of filaments) {
    let match: any = null;

    // Strategy 1: exact variant_sku match
    if (filament.variant_sku) {
      match = existing.find((e: any) => e.variant_sku && e.variant_sku === filament.variant_sku && !matchedIds.has(e.id));
    }

    // Strategy 2: material + color in display_name/product_title
    if (!match) {
      const cp = (filament.display_name.split(" - ").pop() || "").toLowerCase();
      if (cp) {
        match = existing.find((e: any) =>
          !matchedIds.has(e.id) &&
          e.material?.toLowerCase() === filament.material.toLowerCase() &&
          (e.display_name?.toLowerCase().includes(cp) || e.product_title?.toLowerCase().includes(cp))
        );
      }
    }

    // Strategy 3: product_handle + color_family match
    // (handles cases where existing data has null display_name/variant_sku but has handle+color)
    if (!match && filament.product_handle) {
      const colorPart = (filament.display_name.split(" - ").pop() || "").toLowerCase();
      if (colorPart) {
        match = existing.find((e: any) =>
          !matchedIds.has(e.id) &&
          e.product_handle === filament.product_handle &&
          e.color_family?.toLowerCase() === colorPart
        );
      }
    }

    if (match) matchedIds.add(match.id);

    if (match) {
      const diffs: { field: string; old: number | null; new: number | null }[] = [];
      const cmp: [string, number | null, number | null][] = [
        ["price_usd", match.variant_price, filament.price_usd],
        ["price_eur", match.price_eur, filament.price_eur],
        ["price_gbp", match.price_gbp, filament.price_gbp],
        ["price_cad", match.price_cad, filament.price_cad],
        ["price_aud", match.price_aud, filament.price_aud],
      ];
      for (const [f, o, n] of cmp) {
        if (n !== null && o !== null && o > 0 && Math.abs(o - n) > 0.01)
          diffs.push({ field: f, old: o, new: n });
      }
      results.push({ filament, status: diffs.length > 0 ? "price_changed" : "matched", existingId: match.id, priceDiff: diffs.length > 0 ? diffs : null });
    } else {
      results.push({ filament, status: "new", existingId: null, priceDiff: null });
    }
  }

  return results;
}
