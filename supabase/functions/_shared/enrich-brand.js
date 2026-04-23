#!/usr/bin/env node
/**
 * FilaScope Brand Enrichment Script v2
 * Incremental enrichment for priority brands
 * Uses correct Supabase schema
 */

const SUPABASE_URL = 'https://fytxfdvbzstnimzhjgth.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const FIRECRAWL_KEY = process.env.FIRECRAWL_KEY || '';

const args = process.argv.slice(2);
let brandSlug = null;
let maxFilaments = 50;
let dryRun = false;

// Parse arguments
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--brand' && args[i + 1]) {
        brandSlug = args[i + 1];
        i++;
    } else if (args[i] === '--max-filaments' && args[i + 1]) {
        maxFilaments = parseInt(args[i + 1], 10);
        i++;
    } else if (args[i] === '--dry-run') {
        dryRun = true;
    }
}

// Known material densities (g/cm³) for common filament types
const MATERIAL_DENSITY = {
    'pla': 1.24,
    'petg': 1.27,
    'abs': 1.04,
    'nylon': 1.14,
    'nylon 6': 1.14,
    'nylon 12': 1.01,
    'tpu': 1.21,
    'tpe': 1.08,
    'pctpe': 1.12,
    'pett': 1.27,
    'pet': 1.38,
    'pc': 1.20,
    'hips': 1.04,
    'asa': 1.07,
    'peek': 1.30,
    'pei': 1.27,
    'pp': 0.90,
    'pva': 1.23,
    'wood': 1.15,
    'carbon fiber': 1.30,
    'glass fiber': 1.40,
};

// Known nozzle and bed temperatures for Taulman3D products (from TDS/supplier data)
const TAULMAN_TEMP_DATA = {
    'tech-g': { nozzleMin: 235, nozzleMax: 242, bedMin: 60, bedMax: 68 },
    't-glase': { nozzleMin: 212, nozzleMax: 224, bedMin: 40, bedMax: 60 },
    'n-vent': { nozzleMin: 235, nozzleMax: 250, bedMin: 60, bedMax: 80 },
    'alloy 910': { nozzleMin: 235, nozzleMax: 245, bedMin: 60, bedMax: 70 },
    'bluprint': { nozzleMin: 250, nozzleMax: 270, bedMin: 60, bedMax: 70 },
    'nylon 645': { nozzleMin: 250, nozzleMax: 255, bedMin: 30, bedMax: 65 },
    'nylon 680': { nozzleMin: 250, nozzleMax: 255, bedMin: 30, bedMax: 65 },
    'nylon 230': { nozzleMin: 230, nozzleMax: 240, bedMin: 60, bedMax: 80 },
    'nylon bridge': { nozzleMin: 245, nozzleMax: 255, bedMin: 60, bedMax: 70 },
    'guidel!ne': { nozzleMin: 220, nozzleMax: 235, bedMin: 40, bedMax: 60 },
    'guideline': { nozzleMin: 220, nozzleMax: 235, bedMin: 40, bedMax: 60 },
    'in-pla': { nozzleMin: 200, nozzleMax: 230, bedMin: 40, bedMax: 60 },
};

// Extract density from material info or body HTML
function extractDensity(bodyHtml, tags) {
    // Try to extract from body HTML
    if (bodyHtml) {
        const body = bodyHtml.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&').replace(/&nbsp;/g, ' ');
        
        // "density: 1.14 g/cm3" or "density: 1.14"
        const densityMatch = body.match(/density[:\s]*(\d+\.?\d*)\s*(?:g\/cm|g\/cc|gcm)/i);
        if (densityMatch) {
            return parseFloat(densityMatch[1]);
        }
    }
    
    // Try to extract from tags (e.g., "Materials_PETG", "Materials_Nylon")
    if (tags && tags.length) {
        for (const tag of tags) {
            const tagLower = tag.toLowerCase();
            for (const [material, density] of Object.entries(MATERIAL_DENSITY)) {
                if (tagLower.includes(material)) {
                    return density;
                }
            }
        }
    }
    
    // Try to infer from product title
    return null;
}

// Extract density from product title
function extractDensityFromTitle(title) {
    if (!title) return null;
    const titleLower = title.toLowerCase();
    
    // Check material-specific patterns in title
    if (titleLower.includes('nylon bridge')) return 1.11;
    if (titleLower.includes('nylon 645')) return 1.14;
    if (titleLower.includes('nylon 680')) return 1.14;
    if (titleLower.includes('nylon 230')) return 1.14;
    if (titleLower.includes('alloy 910')) return 1.14;
    if (titleLower.includes('t-glase')) return 1.27;
    if (titleLower.includes('tech-g')) return 1.27;
    if (titleLower.includes('n-vent')) return 1.08;
    if (titleLower.includes('in-pla')) return 1.24;
    if (titleLower.includes('bluprint')) return 1.24;
    if (titleLower.includes('guidel')) return 1.12;
    if (titleLower.includes('pla')) return 1.24;
    if (titleLower.includes('petg')) return 1.27;
    if (titleLower.includes('nylon')) return 1.14;
    if (titleLower.includes('abs')) return 1.04;
    if (titleLower.includes('tpu')) return 1.21;
    
    return null;
}

// Extract temperature from product title (Taulman3D known temps)
function extractTempFromTitle(title) {
    if (!title) return {};
    const titleLower = title.toLowerCase();
    
    for (const [product, temps] of Object.entries(TAULMAN_TEMP_DATA)) {
        if (titleLower.includes(product)) {
            return temps;
        }
    }
    
    return {};
}

// Amazon affiliate tags
const AMAZON_TAGS = {
    us: 'filascope-20',
    ca: 'filascope-21',
    uk: 'filascope-22',
    de: 'filascope-23',
};

// Log helper
function log(message) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log(`[${timestamp}] ${message}`);
}

// HTTP helper with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

// Supabase REST query helper
async function supabaseQuery(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=representation',
        ...options.headers
    };
    
    try {
        const response = await fetchWithTimeout(url, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        }, options.timeout || 30000);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Supabase ${response.status}: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Analyze gaps for a filament — checks ALL enrichment-relevant fields
function analyzeFilamentGaps(filament) {
    const gaps = [];
    
    // Price gaps
    if (!filament.variant_price) {
        gaps.push({ field: 'variant_price', priority: 'high', source: 'shopify' });
    }
    
    // Amazon link gaps — check if ANY Amazon link is missing
    const amazonRegions = ['us', 'ca', 'uk', 'de', 'fr', 'es', 'it', 'au', 'jp', 'nl', 'be'];
    for (const region of amazonRegions) {
        const field = `amazon_link_${region}`;
        if (!filament[field]) {
            gaps.push({ field, priority: 'high', source: 'amazon' });
        }
    }
    
    // Amazon price
    if (!filament.amazon_price_usd) {
        gaps.push({ field: 'amazon_price_usd', priority: 'high', source: 'amazon' });
    }
    
    // Temperature gaps
    if (!filament.nozzle_temp_min_c || !filament.nozzle_temp_max_c) {
        gaps.push({ field: 'nozzle_temp_min_c', priority: 'medium', source: 'shopify' });
        gaps.push({ field: 'nozzle_temp_max_c', priority: 'medium', source: 'shopify' });
    }
    
    if (!filament.bed_temp_min_c || !filament.bed_temp_max_c) {
        gaps.push({ field: 'bed_temp_min_c', priority: 'medium', source: 'shopify' });
        gaps.push({ field: 'bed_temp_max_c', priority: 'medium', source: 'shopify' });
    }
    
    // Weight gaps
    if (!filament.net_weight_g) {
        gaps.push({ field: 'net_weight_g', priority: 'medium', source: 'shopify' });
    }
    
    // Density gaps
    if (!filament.density_g_cm3) {
        gaps.push({ field: 'density_g_cm3', priority: 'low', source: 'shopify' });
    }
    
    // Diameter gaps
    if (!filament.diameter_nominal_mm) {
        gaps.push({ field: 'diameter_nominal_mm', priority: 'low', source: 'shopify' });
    }
    
    // Color gaps
    if (!filament.color_hex) {
        gaps.push({ field: 'color_hex', priority: 'low', source: 'shopify' });
    }
    if (!filament.color_family) {
        gaps.push({ field: 'color_family', priority: 'low', source: 'shopify' });
    }
    
    // Technical spec gaps
    if (!filament.tensile_strength_mpa) {
        gaps.push({ field: 'tensile_strength_mpa', priority: 'low', source: 'tds' });
    }
    if (!filament.flexural_modulus_mpa) {
        gaps.push({ field: 'flexural_modulus_mpa', priority: 'low', source: 'tds' });
    }
    if (!filament.impact_strength_j_m) {
        gaps.push({ field: 'impact_strength_j_m', priority: 'low', source: 'tds' });
    }
    
    // Regional price gaps
    if (!filament.price_eur) {
        gaps.push({ field: 'price_eur', priority: 'medium', source: 'regional' });
    }
    if (!filament.price_gbp) {
        gaps.push({ field: 'price_gbp', priority: 'medium', source: 'regional' });
    }
    if (!filament.price_cad) {
        gaps.push({ field: 'price_cad', priority: 'medium', source: 'regional' });
    }
    if (!filament.price_aud) {
        gaps.push({ field: 'price_aud', priority: 'medium', source: 'regional' });
    }
    
    // Image gaps
    if (!filament.image_url && !filament.featured_image) {
        gaps.push({ field: 'image_url', priority: 'medium', source: 'shopify' });
    }
    
    // Product URL gaps
    if (!filament.product_url) {
        gaps.push({ field: 'product_url', priority: 'medium', source: 'shopify' });
    }
    
    return gaps;
}

// Extract Shopify product data
async function extractShopifyData(productUrl, filament = {}) {
    if (!productUrl) return null;
    
    try {
        const jsonUrl = productUrl.replace(/\/$/, '') + '.json';
        const response = await fetchWithTimeout(jsonUrl, {}, 10000);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        const product = data.product;
        const variant = product?.variants?.[0];
        
        if (!product) return null;
        
        // Extract temperature data from tags, metafields, or body
        let nozzleMin = null, nozzleMax = null;
        let bedMin = null, bedMax = null;
        
        // Check tags
        if (product.tags) {
            for (const tag of product.tags) {
                const nozzleMatch = tag.match(/nozzle[:\s]*(\d+)[-–](\d+)/i);
                const bedMatch = tag.match(/bed[:\s]*(\d+)[-–](\d+)/i);
                
                if (nozzleMatch) {
                    nozzleMin = parseInt(nozzleMatch[1]);
                    nozzleMax = parseInt(nozzleMatch[2]);
                }
                if (bedMatch) {
                    bedMin = parseInt(bedMatch[1]);
                    bedMax = parseInt(bedMatch[2]);
                }
            }
        }
        
        // Check metafields
        if (product.metafields) {
            for (const mf of product.metafields) {
                if (mf.key === 'nozzle_temp' || mf.key === 'extruder_temp') {
                    const match = mf.value.match(/(\d+)[-–](\d+)/);
                    if (match) {
                        nozzleMin = parseInt(match[1]);
                        nozzleMax = parseInt(match[2]);
                    }
                }
                if (mf.key === 'bed_temp' || mf.key === 'heated_bed') {
                    const match = mf.value.match(/(\d+)[-–](\d+)/);
                    if (match) {
                        bedMin = parseInt(match[1]);
                        bedMax = parseInt(match[2]);
                    }
                }
            }
        }
        
        // Check body HTML for temperature patterns
        if (product.body_html) {
            const body = product.body_html.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&').replace(/&nbsp;/g, ' ');
            
            // Pattern 1: "nozzle: xxx-xxx" or "extruder: xxx-xxx"
            let nozzleMatch = body.match(/nozzle[:\s]*(\d+)[-–](\d+)/i);
            let bedMatch = body.match(/bed[:\s]*(\d+)[-–](\d+)/i);
            
            // Pattern 2: "Print Temperature: xxxC - xxxC" or "Printing temperature: xxxC - xxxC" (Taulman3D style)
            if (!nozzleMatch) {
                const printTempMatch = body.match(/print(?:ing)?\s*temperature[:\s]*(\d+)\s*[°cC]*\s*[-–to]+\s*(\d+)/i);
                if (printTempMatch) {
                    nozzleMatch = printTempMatch;
                }
            }
            
            // Pattern 3: "Print Temperature: xxxC" or "print temp of only xxxC" (single value, set both min/max)
            if (!nozzleMatch) {
                const singlePrintTemp = body.match(/print(?:ing)?\s*(?:temp(?:erature)?)[:\s]*(?:of\s*(?:only\s*)?)?(\d+)\s*[°cC]/i);
                if (singlePrintTemp) {
                    nozzleMatch = [null, singlePrintTemp[1], singlePrintTemp[1]];
                }
            }
            
            // Pattern 4: "nozzle: xxxC" or "extruder: xxxC" (single value)
            if (!nozzleMatch) {
                const singleNozzle = body.match(/(?:nozzle|extruder)[:\s]*(\d+)\s*[°cC]/i);
                if (singleNozzle) {
                    nozzleMatch = [null, singleNozzle[1], singleNozzle[1]];
                }
            }
            
            // Bed temp patterns
            if (!bedMatch) {
                const printBedMatch = body.match(/print\s*bed\s*temperature[:\s]*(\d+)\s*[°cC]*\s*[-–to]+\s*(\d+)/i);
                if (printBedMatch) {
                    bedMatch = printBedMatch;
                }
            }
            
            // Single bed temp: "Print Bed Temperature: 68C max" or "Print bed temperature: 30 - 65C"
            if (!bedMatch) {
                const singleBed = body.match(/print\s*bed\s*temp(?:erature)?[:\s]*(\d+)\s*[°cC]/i);
                if (singleBed) {
                    bedMatch = [null, singleBed[1], singleBed[1]];
                }
            }
            
            if (nozzleMatch && !nozzleMin) {
                nozzleMin = parseInt(nozzleMatch[1]);
                nozzleMax = parseInt(nozzleMatch[2]);
            }
            if (bedMatch && !bedMin) {
                bedMin = parseInt(bedMatch[1]);
                bedMax = parseInt(bedMatch[2]);
            }
        }
        
        // Extract density from body HTML, tags, or product title
        const densityFromHtml = extractDensity(product.body_html, product.tags);
        const densityFromTitle = extractDensityFromTitle(product.title || filament.product_title);
        const density = densityFromHtml || densityFromTitle;
        
        // If no temp data found in body, try title-based lookup
        if (!nozzleMin && !bedMin) {
            const titleTemps = extractTempFromTitle(product.title || filament.product_title);
            if (titleTemps.nozzleMin) {
                nozzleMin = titleTemps.nozzleMin;
                nozzleMax = titleTemps.nozzleMax;
            }
            if (titleTemps.bedMin) {
                bedMin = titleTemps.bedMin;
                bedMax = titleTemps.bedMax;
            }
        }
        
        return {
            variant_price: variant?.price ? parseFloat(variant.price) : null,
            net_weight_g: variant?.weight ? parseInt(variant.weight) : null,
            variant_available: variant?.available || false,
            variant_sku: variant?.sku || null,
            nozzle_temp_min_c: nozzleMin,
            nozzle_temp_max_c: nozzleMax,
            bed_temp_min_c: bedMin,
            bed_temp_max_c: bedMax,
            diameter_nominal_mm: variant?.title?.includes('3.00') ? 3.00 : 1.75,
            density_g_cm3: density,
        };
    } catch (error) {
        log(`  Shopify extraction failed: ${error.message}`);
        return null;
    }
}

// Extract Amazon data from ASIN
async function extractAmazonData(filament) {
    const results = {};
    
    // If we have an ASIN, generate affiliate links
    if (filament.amazon_match_asin) {
        results.amazon_link_us = `https://amazon.com/dp/${filament.amazon_match_asin}?tag=${AMAZON_TAGS.us}`;
        results.amazon_link_ca = `https://amazon.ca/dp/${filament.amazon_match_asin}?tag=${AMAZON_TAGS.ca}`;
        results.amazon_link_uk = `https://amazon.co.uk/dp/${filament.amazon_match_asin}?tag=${AMAZON_TAGS.uk}`;
    }
    
    return results;
}

// Main enrichment function
async function enrichBrand(brandSlug, maxFilaments) {
    log(`Starting enrichment for brand: ${brandSlug}`);
    
    // Get brand info
    const brands = await supabaseQuery(`automated_brands?brand_slug=eq.${brandSlug}&select=*`);
    if (!brands || brands.length === 0) {
        log(`Brand not found: ${brandSlug}`);
        return { success: false, error: 'Brand not found' };
    }
    
    const brand = brands[0];
    log(`Brand: ${brand.display_name} (${brand.brand_slug})`);
    
    // Get filaments
    const filaments = await supabaseQuery(
        `filaments?brand_name=ilike.*${brand.display_name}*&select=*&limit=${maxFilaments}`
    );
    
    log(`Found ${filaments.length} filaments to analyze`);
    
    if (filaments.length === 0) {
        return { success: true, enriched: 0, skipped: 0, failed: 0 };
    }
    
    let enrichedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    for (const filament of filaments) {
        try {
            const name = filament.product_title || filament.id;
            const gaps = analyzeFilamentGaps(filament);
            
            if (gaps.length === 0) {
                log(`  Skipping ${name} - no gaps found`);
                skippedCount++;
                continue;
            }
            
            log(`Processing: ${name} (${gaps.length} gaps)`);
            
            const updates = {};
            const needShopify = gaps.some(g => g.source === 'shopify');
            const needAmazon = gaps.some(g => g.source === 'amazon');
            
            if (needShopify && filament.product_url) {
                const shopifyData = await extractShopifyData(filament.product_url, filament);
                if (shopifyData) {
                    // Only add non-null values
                    for (const [key, value] of Object.entries(shopifyData)) {
                        if (value !== null && filament[key] === null) {
                            updates[key] = value;
                        }
                    }
                }
            }
            
            // Apply title-based temperature lookup if Shopify didn't find temps
            if (!updates.nozzle_temp_min_c && !filament.nozzle_temp_min_c) {
                const titleTemps = extractTempFromTitle(filament.product_title);
                if (titleTemps.nozzleMin) {
                    updates.nozzle_temp_min_c = titleTemps.nozzleMin;
                    updates.nozzle_temp_max_c = titleTemps.nozzleMax;
                }
                if (titleTemps.bedMin) {
                    updates.bed_temp_min_c = titleTemps.bedMin;
                    updates.bed_temp_max_c = titleTemps.bedMax;
                }
            }
            
            // Apply title-based density lookup if Shopify didn't find density
            if (!updates.density_g_cm3 && !filament.density_g_cm3) {
                const densityFromTitle = extractDensityFromTitle(filament.product_title);
                if (densityFromTitle) {
                    updates.density_g_cm3 = densityFromTitle;
                }
            }
            
            if (needAmazon) {
                const amazonData = await extractAmazonData(filament);
                for (const [key, value] of Object.entries(amazonData)) {
                    if (value !== null && !filament[key]) {
                        updates[key] = value;
                    }
                }
            }
            
            // Only update if we have new data
            if (Object.keys(updates).length > 0) {
                if (dryRun) {
                    log(`  DRY RUN: Would update ${name} with: ${JSON.stringify(updates)}`);
                } else {
                    await supabaseQuery(
                        `filaments?id=eq.${filament.id}`,
                        { method: 'PATCH', body: updates }
                    );
                    log(`  ✅ Updated: ${Object.keys(updates).join(', ')}`);
                }
                enrichedCount++;
            } else {
                log(`  No new data found for ${name}`);
                skippedCount++;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            log(`  ❌ Failed: ${error.message}`);
            failedCount++;
        }
    }
    
    return { success: true, enriched: enrichedCount, skipped: skippedCount, failed: failedCount };
}

// Main execution
async function main() {
    log("═══════════════════════════════════════════════════════════════");
    log("  FilaScope Brand Enrichment v2");
    log("═══════════════════════════════════════════════════════════════");
    
    if (!SUPABASE_KEY) {
        log("❌ SUPABASE_KEY not set");
        process.exit(1);
    }
    
    if (!brandSlug) {
        log("❌ --brand argument required");
        process.exit(1);
    }
    
    try {
        const result = await enrichBrand(brandSlug, maxFilaments);
        
        log("");
        log("═══════════════════════════════════════════════════════════════");
        log("  ENRICHMENT RESULTS");
        log("═══════════════════════════════════════════════════════════════");
        log(`  Enriched: ${result.enriched}`);
        log(`  Skipped:  ${result.skipped}`);
        log(`  Failed:   ${result.failed}`);
        log("═══════════════════════════════════════════════════════════════");
        
        process.exit(result.success ? 0 : 1);
    } catch (error) {
        log(`❌ Enrichment failed: ${error.message}`);
        process.exit(1);
    }
}

main();
