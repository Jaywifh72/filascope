#!/usr/bin/env node
/**
 * Brand Image & URL Enrichment Script
 * 
 * Handles non-Shopify brands (Fiberlogy, CC3D, Inland, MatterHackers, TECBEARS, TTYT3D)
 * Scrapes product pages directly to extract images and update product URLs.
 */

const SUPABASE_URL = 'https://fytxfdvbzstnimzhjgth.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const args = process.argv.slice(2);
let brandSlug = null;
let dryRun = false;
let maxProducts = 999;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--brand' && args[i + 1]) { brandSlug = args[i + 1]; i++; }
    else if (args[i] === '--dry-run') { dryRun = true; }
    else if (args[i] === '--max-products' && args[i + 1]) { maxProducts = parseInt(args[i + 1]); i++; }
}

function log(msg) {
    const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log(`[${ts}] ${msg}`);
}

async function supabaseQuery(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=representation',
        ...options.headers
    };
    const resp = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (!resp.ok) throw new Error(`Supabase ${resp.status}: ${await resp.text()}`);
    return resp.json();
}

async function fetchPage(url, timeout = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const resp = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; FilaScopeBot/1.0)',
                'Accept': 'text/html',
            }
        });
        clearTimeout(timer);
        if (!resp.ok) return null;
        return await resp.text();
    } catch (e) {
        clearTimeout(timer);
        return null;
    }
}

// ─── FIBERLOGY ENRICHMENT ──────────────────────────────────────────────────

function normalizeColorForMatch(title) {
    if (!title) return '';
    // Extract color from title like "Fiberlogy Easy PLA Filament - 1.75 mm - 0.85 kg - Midnight Sky"
    const parts = title.split(' - ');
    const color = parts[parts.length - 1].trim().toLowerCase();
    return color
        .replace(/\s+/g, '-')
        .replace(/[àáâãä]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u');
}

function extractFiberlogyImages(html, baseUrl) {
    const images = [];
    // Match product image patterns: productGfx_XXXX_750_750/Filename.webp or .jpg
    const imgRegex = /src="(\/environment\/cache\/images\/productGfx_\d+_750_750\/[^"]+\.(webp|jpg|png))"/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
        const path = match[1];
        const filename = path.split('/').pop();
        images.push({
            url: 'https://fiberlogy.com' + path,
            filename: filename.toLowerCase()
        });
    }
    return images;
}

function matchFiberlogyImage(filamentTitle, images) {
    if (!images.length) return null;
    
    const colorNorm = normalizeColorForMatch(filamentTitle);
    if (!colorNorm) return images[0]?.url || null;
    
    // Try exact filename match first
    for (const img of images) {
        const fn = img.filename.toLowerCase().replace(/[-_]/g, '');
        const cn = colorNorm.replace(/[-_]/g, '');
        if (fn.includes(cn)) return img.url;
    }
    
    // Try partial match
    const colorWords = colorNorm.split('-').filter(w => w.length > 2);
    for (const img of images) {
        const fn = img.filename.toLowerCase();
        const matches = colorWords.filter(w => fn.includes(w));
        if (matches.length >= Math.min(2, colorWords.length)) return img.url;
    }
    
    // Fallback: try matching the main color word
    const mainColor = colorWords[colorWords.length - 1]; // last word is usually the color
    if (mainColor && mainColor.length > 3) {
        for (const img of images) {
            if (img.filename.toLowerCase().includes(mainColor)) return img.url;
        }
    }
    
    return null;
}

async function enrichFiberlogy() {
    log('Starting Fiberlogy enrichment...');
    
    // Get all filaments grouped by product_url
    const filaments = await supabaseQuery(
        `filaments?brand_name=ilike.*fiberlogy*&select=id,product_title,product_url,image_url&order=product_url&limit=500`
    );
    log(`Found ${filaments.length} Fiberlogy filaments`);
    
    // Group by URL
    const urlGroups = {};
    for (const f of filaments) {
        const url = f.product_url || 'MISSING';
        if (!urlGroups[url]) urlGroups[url] = [];
        urlGroups[url].push(f);
    }
    
    const uniqueUrls = Object.keys(urlGroups).filter(u => u !== 'MISSING');
    log(`Processing ${uniqueUrls.length} unique product URLs...`);
    
    let enriched = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const url of uniqueUrls) {
        if (enriched + skipped >= maxProducts) break;
        
        log(`Scraping: ${url}`);
        const html = await fetchPage(url);
        if (!html) {
            log(`  Failed to fetch page`);
            failed += urlGroups[url].length;
            continue;
        }
        
        const images = extractFiberlogyImages(html, url);
        log(`  Found ${images.length} images`);
        
        for (const filament of urlGroups[url]) {
            if (enriched + skipped >= maxProducts) break;
            
            // Skip if already has image
            if (filament.image_url) {
                skipped++;
                continue;
            }
            
            const imageUrl = matchFiberlogyImage(filament.product_title, images);
            if (imageUrl) {
                if (!dryRun) {
                    await supabaseQuery(`filaments?id=eq.${filament.id}`, {
                        method: 'PATCH',
                        body: { featured_image: imageUrl }
                    });
                }
                log(`  ✅ ${filament.product_title}: ${imageUrl}`);
                enriched++;
            } else {
                log(`  ⚠️ No image match for: ${filament.product_title}`);
                skipped++;
            }
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 500));
    }
    
    // Handle filaments with no URL
    const noUrlFilaments = urlGroups['MISSING'] || [];
    skipped += noUrlFilaments.length;
    
    return { enriched, skipped, failed };
}

// ─── AMAZON-BASED BRAND ENRICHMENT ─────────────────────────────────────────

// Known Amazon product URLs for smaller brands
const BRAND_AMAZON_URLS = {
    cc3d: [
        { title_contains: 'silk', url: 'https://www.amazon.com/dp/B07KXHBLLZ' },
        { title_contains: 'pla', url: 'https://www.amazon.com/dp/B07KBVH5WB' },
        { title_contains: 'petg', url: 'https://www.amazon.com/dp/B081DR62HZ' },
    ],
    inland: [
        { title_contains: 'silk', url: 'https://www.amazon.com/dp/B085BYJMMN' },
        { title_contains: 'petg', url: 'https://www.amazon.com/dp/B07PKFMCPR' },
        { title_contains: 'pla basic', url: 'https://www.amazon.com/dp/B07JGBQGMZ' },
        { title_contains: 'pla+', url: 'https://www.amazon.com/dp/B07PKFMCPR' },
        { title_contains: 'abs', url: 'https://www.amazon.com/dp/B07PKKLNNR' },
    ],
    matterhackers: [
        { title_contains: 'pro', url: 'https://www.amazon.com/dp/B06ZZ1GMRN' },
        { title_contains: 'build series', url: 'https://www.amazon.com/dp/B07B8FCXJL' },
    ],
    tecbears: [
        { title_contains: 'abs', url: 'https://www.amazon.com/dp/B09VBMVF6C' },
        { title_contains: 'petg', url: 'https://www.amazon.com/dp/B09VDMKBWR' },
        { title_contains: 'pla', url: 'https://www.amazon.com/dp/B09VDJVGT9' },
    ],
    ttyt3d: [
        { title_contains: 'petg', url: 'https://www.amazon.com/dp/B0BTYCDJZK' },
        { title_contains: 'tpu', url: 'https://www.amazon.com/dp/B0C53XJXKN' },
        { title_contains: 'pla', url: 'https://www.amazon.com/dp/B0BTYDP3WB' },
    ],
};

function extractAsin(url) {
    const match = url.match(/\/dp\/([A-Z0-9]{10})/i);
    return match ? match[1] : null;
}

function matchAmazonUrl(filamentTitle, brandUrls) {
    const titleLower = (filamentTitle || '').toLowerCase();
    for (const entry of brandUrls) {
        if (titleLower.includes(entry.title_contains.toLowerCase())) {
            return entry.url;
        }
    }
    return null;
}

async function extractAmazonImage(asin) {
    try {
        const url = `https://www.amazon.com/dp/${asin}`;
        const html = await fetchPage(url, 15000);
        if (!html) return null;
        
        // Try to find product image from og:image or landingImage
        const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
        if (ogMatch) return ogMatch[1];
        
        const landingMatch = html.match(/id="landingImage"[^>]+src="([^"]+)"/);
        if (landingMatch) return landingMatch[1];
        
        const imgMatch = html.match(/data-old-hires="([^"]+)"/);
        if (imgMatch) return imgMatch[1];
        
        const dynamicMatch = html.match(/data-a-dynamic-image="[^"]*?(https:\/\/[^"]+?)"/);
        if (dynamicMatch) return dynamicMatch[1];
        
        return null;
    } catch (e) {
        return null;
    }
}

async function enrichAmazonBrand(brandSlug) {
    const brandUrls = BRAND_AMAZON_URLS[brandSlug];
    if (!brandUrls) {
        log(`No known Amazon URLs for brand: ${brandSlug}`);
        return { enriched: 0, skipped: 0, failed: 0 };
    }
    
    log(`Starting ${brandSlug} enrichment...`);
    
    const filaments = await supabaseQuery(
        `filaments?brand_name=ilike.*${brandSlug}*&select=id,product_title,product_url,image_url&limit=50`
    );
    log(`Found ${filaments.length} ${brandSlug} filaments`);
    
    let enriched = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const filament of filaments) {
        const updates = {};
        
        // Try to set product URL
        if (!filament.product_url) {
            const amazonUrl = matchAmazonUrl(filament.product_title, brandUrls);
            if (amazonUrl) {
                updates.product_url = amazonUrl;
            }
        }
        
        // Try to get image
        if (!filament.image_url) {
            const url = updates.product_url || filament.product_url;
            if (url) {
                    const asin = extractAsin(url);
                    if (asin) {
                        const imageUrl = await extractAmazonImage(asin);
                        if (imageUrl) {
                            updates.featured_image = imageUrl;
                        }
                    }
            }
        }
        
        if (Object.keys(updates).length > 0) {
            if (!dryRun) {
                await supabaseQuery(`filaments?id=eq.${filament.id}`, {
                    method: 'PATCH',
                    body: updates
                });
            }
            log(`  ✅ ${filament.product_title}: ${JSON.stringify(updates)}`);
            enriched++;
            await new Promise(r => setTimeout(r, 1000));
        } else {
            log(`  ⏭️ ${filament.product_title}: no updates`);
            skipped++;
        }
    }
    
    return { enriched, skipped, failed };
}

// ─── MATTERHACKERS ENRICHMENT ──────────────────────────────────────────────

async function enrichMatterHackers() {
    log('Starting MatterHackers enrichment...');
    
    const filaments = await supabaseQuery(
        `filaments?brand_name=ilike.*matterhackers*&select=id,product_title,product_url,image_url&limit=50`
    );
    log(`Found ${filaments.length} MatterHackers filaments`);
    
    const urlMap = {
        'pro series pla': 'https://www.matterhackers.com/store/l/pro-series-pla-filament-175mm/sk/MQRU4FDL',
        'mh build series abs': 'https://www.matterhackers.com/store/l/mh-build-series-abs-filament-175mm/sk/M5RF6C8H',
        'mh build series pla': 'https://www.matterhackers.com/store/l/mh-build-series-pla-filament-175mm/sk/MGU9QFTT',
        'mh build series petg': 'https://www.matterhackers.com/store/l/mh-build-series-petg-filament-175mm/sk/MVBW9PQ2',
    };
    
    let enriched = 0;
    let skipped = 0;
    
    for (const filament of filaments) {
        const updates = {};
        const titleLower = (filament.product_title || '').toLowerCase();
        
        if (!filament.product_url) {
            for (const [key, url] of Object.entries(urlMap)) {
                if (titleLower.includes(key)) {
                    updates.product_url = url;
                    break;
                }
            }
        }
        
        // Try to scrape image from MatterHackers page
        const pageUrl = updates.product_url || filament.product_url;
        if (pageUrl && !filament.image_url) {
            const html = await fetchPage(pageUrl);
            if (html) {
                const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
                if (ogMatch) updates.featured_image = ogMatch[1];
            }
            await new Promise(r => setTimeout(r, 500));
        }
        
        if (Object.keys(updates).length > 0) {
            if (!dryRun) {
                await supabaseQuery(`filaments?id=eq.${filament.id}`, {
                    method: 'PATCH',
                    body: updates
                });
            }
            log(`  ✅ ${filament.product_title}: ${JSON.stringify(updates)}`);
            enriched++;
        } else {
            skipped++;
        }
    }
    
    return { enriched, skipped, failed: 0 };
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
    log('═══════════════════════════════════════════════════════════════');
    log('  Brand Image & URL Enrichment v1');
    log('═══════════════════════════════════════════════════════════════');
    
    if (!SUPABASE_KEY) { log('❌ SUPABASE_KEY not set'); process.exit(1); }
    if (!brandSlug) { log('❌ --brand argument required'); process.exit(1); }
    
    let result;
    if (brandSlug === 'fiberlogy') {
        result = await enrichFiberlogy();
    } else if (brandSlug === 'matterhackers') {
        result = await enrichMatterHackers();
    } else {
        result = await enrichAmazonBrand(brandSlug);
    }
    
    log('');
    log('═══════════════════════════════════════════════════════════════');
    log('  RESULTS');
    log('═══════════════════════════════════════════════════════════════');
    log(`  Enriched: ${result.enriched}`);
    log(`  Skipped:  ${result.skipped}`);
    log(`  Failed:   ${result.failed}`);
    log('═══════════════════════════════════════════════════════════════');
}

main().catch(e => { log(`❌ Failed: ${e.message}`); process.exit(1); });
