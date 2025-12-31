/**
 * FUSION FILAMENTS SYNC FUNCTION
 * 
 * 5-Step Firecrawl HTML Sync Pipeline for Odoo platform
 * Science-themed colors, AMS compatibility, cardboard spools
 * CRITICAL: Fixes HT-PET+ miscategorization as TPE -> PETG
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichFusionProduct,
  cleanFusionTitle,
  extractColorFromTitle,
  getFusionColorHex,
} from '../_shared/fusion-filaments-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  materialFixes: number;
}

interface ProductData {
  productId: string;
  title: string;
  cleanTitle: string;
  url: string;
  imageUrl: string | null;
  price: number | null;
  sku: string | null;
  material: string | null;
  colorName: string | null;
  colorHex: string | null;
  appearance: string | null;
  sparkleLevel: string | null;
  amsCompatible: string | null;
  nozzleTemp: string | null;
  bedTemp: string | null;
  diameter: number;
  spoolWeight: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = { discovered: 0, created: 0, updated: 0, skipped: 0, failed: 0, materialFixes: 0 };

  try {
    const { cleanSlate = false, limit, skipExisting = false } = await req.json().catch(() => ({}));

    console.log('🧪 Starting Fusion Filaments sync...', { cleanSlate, limit, skipExisting });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id, brand_name')
      .eq('brand_slug', 'fusion-filaments')
      .single();

    const brandId = brand?.id || null;
    const vendorName = 'Fusion Filaments';

    // =========================================================================
    // STEP 1: Optional Clean Slate
    // =========================================================================
    if (cleanSlate) {
      console.log('🧹 Clean slate: Deleting existing Fusion Filaments products...');
      const { data: deleted } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', '%fusion%filament%')
        .select('id');
      const count = deleted?.length || 0;
      console.log(`   Deleted ${count || 0} existing products`);
    }

    // =========================================================================
    // STEP 2: Discover Product URLs
    // =========================================================================
    console.log('🔍 Step 2: Discovering product URLs...');
    
    const productUrls = new Set<string>();
    const baseUrl = 'https://www.fusionfilaments.com';
    
    // Category pages to scrape
    const categoryPages = [
      '/shop',
      '/shop/page/2',
      '/shop/page/3',
      '/shop/page/4',
      '/shop/category/ht-pla-21',
      '/shop/category/pla-22',
      '/shop/category/ht-pet-23',
      '/shop/category/pctg-24',
      '/shop/category/asa-25',
      '/shop/category/abs-matte-26',
      '/shop/category/abs-gloss-27',
      '/shop/category/ht-abs-matte-31',
      '/shop/category/hspla-32',
      '/shop/category/easyasa-34',
    ];
    
    for (const page of categoryPages) {
      try {
        console.log(`   Scraping ${page}...`);
        
        const mapResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}${page}`,
            formats: ['links'],
            waitFor: 2000,
          }),
        });

        if (mapResponse.ok) {
          const mapData = await mapResponse.json();
          const links = mapData.data?.links || [];
          
          for (const link of links) {
            // Match product URLs: /shop/{sku}-{slug}-{id}
            if (link.match(/\/shop\/[a-z0-9]+-.*-\d+$/i) && 
                !link.includes('/category/') && 
                !link.includes('/page/') &&
                !link.includes('gift-card')) {
              productUrls.add(link);
            }
          }
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.warn(`   Warning: Failed to scrape ${page}:`, err);
      }
    }

    console.log(`   Found ${productUrls.size} unique product URLs`);
    stats.discovered = productUrls.size;

    if (productUrls.size === 0) {
      throw new Error('No product URLs discovered');
    }

    // =========================================================================
    // STEP 3: Scrape Individual Product Pages
    // =========================================================================
    console.log('📄 Step 3: Scraping individual product pages...');
    
    const products: ProductData[] = [];
    let urlArray = Array.from(productUrls);
    
    if (limit && limit > 0) {
      urlArray = urlArray.slice(0, limit);
    }

    for (const url of urlArray) {
      try {
        console.log(`   Scraping: ${url}`);
        
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown', 'html'],
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          console.warn(`   Failed to scrape ${url}: ${scrapeResponse.status}`);
          stats.failed++;
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || '';
        const metadata = scrapeData.data?.metadata || {};

        // Extract title
        const titleMatch = markdown.match(/^#\s+(.+)$/m) || 
                          markdown.match(/\[([^\]]+)\]\s*\d+KG\s+/i);
        let title = titleMatch?.[1] || metadata.title || '';
        
        // Extract SKU from title pattern [SKU]
        const skuMatch = title.match(/\[([A-Z0-9]+)\]/i) || 
                        url.match(/\/shop\/([a-z0-9]+)-/i);
        const sku = skuMatch?.[1]?.toUpperCase() || null;

        // Extract price
        const priceMatch = markdown.match(/\$\s*(\d+(?:\.\d{2})?)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : null;

        // Extract image
        const imageUrl = metadata.ogImage || null;

        // Extract structured attributes from markdown
        let material: string | null = null;
        let appearance: string | null = null;
        let sparkleLevel: string | null = null;
        let amsCompatible: string | null = null;
        let nozzleTemp: string | null = null;
        let colorName: string | null = null;

        // Parse attribute table patterns
        const materialMatch = markdown.match(/MATERIAL\s*TYPE[:\s]*([^\n|]+)/i);
        if (materialMatch) material = materialMatch[1].trim();

        const appearanceMatch = markdown.match(/APPEARANCE[:\s]*([^\n|]+)/i);
        if (appearanceMatch) appearance = appearanceMatch[1].trim();

        const sparkleMatch = markdown.match(/SPARKLE\s*LEVEL[:\s]*([^\n|]+)/i);
        if (sparkleMatch) sparkleLevel = sparkleMatch[1].trim();

        const amsMatch = markdown.match(/AMS\s*COMPATIBLE[:\s]*([^\n|]+)/i);
        if (amsMatch) amsCompatible = amsMatch[1].trim();

        const tempMatch = markdown.match(/PRINT\s*TEMP[:\s]*([^\n|]+)/i);
        if (tempMatch) nozzleTemp = tempMatch[1].trim();

        const colorMatch = markdown.match(/COLOR[:\s]*([^\n|]+)/i);
        if (colorMatch) colorName = colorMatch[1].trim();

        // Fallback: extract color from title
        if (!colorName) {
          colorName = extractColorFromTitle(title);
        }

        // Get color hex
        const colorHex = colorName ? getFusionColorHex(colorName) : null;

        // Clean title
        const cleanTitle = cleanFusionTitle(title);

        // Generate product ID from SKU or URL slug
        const productId = sku?.toLowerCase() || 
                         url.split('/').pop()?.replace(/-\d+$/, '').toLowerCase() || 
                         `fusion-${Date.now()}`;

        if (cleanTitle || title) {
          products.push({
            productId,
            title,
            cleanTitle: cleanTitle || title,
            url,
            imageUrl,
            price,
            sku,
            material,
            colorName,
            colorHex,
            appearance,
            sparkleLevel,
            amsCompatible,
            nozzleTemp,
            bedTemp: null,
            diameter: 1.75, // All Fusion Filaments are 1.75mm
            spoolWeight: 1000, // All are 1kg
          });
        }

        // Rate limiting for Odoo
        await new Promise(r => setTimeout(r, 2000));
        
      } catch (err) {
        console.warn(`   Error scraping ${url}:`, err);
        stats.failed++;
      }
    }

    console.log(`   Scraped ${products.length} products successfully`);

    // =========================================================================
    // STEP 4: Enrich and Upsert Products
    // =========================================================================
    console.log('✨ Step 4: Enriching and upserting products...');

    for (const product of products) {
      try {
        // Apply brand-specific enrichments
        const enrichment = enrichFusionProduct(
          product.title,
          product.material,
          product.appearance || undefined,
          product.sparkleLevel || undefined,
          product.amsCompatible || undefined,
          product.colorName || undefined
        );

        // Check if we fixed a material miscategorization
        if (product.material?.toUpperCase() === 'TPE' && enrichment.material === 'PETG') {
          stats.materialFixes++;
          console.log(`   🔧 Fixed material: TPE -> PETG for ${product.cleanTitle}`);
        }

        // Check for existing product
        const { data: existing } = await supabase
          .from('filaments')
          .select('id, material')
          .eq('product_id', product.productId)
          .ilike('vendor', '%fusion%filament%')
          .maybeSingle();

        if (existing && skipExisting) {
          stats.skipped++;
          continue;
        }

        // Build filament record
        const filamentRecord: Record<string, unknown> = {
          product_id: product.productId,
          product_title: product.cleanTitle,
          vendor: vendorName,
          brand_id: brandId,
          product_url: product.url,
          featured_image: product.imageUrl,
          variant_price: product.price,
          variant_sku: product.sku,
          mpn: product.sku,
          material: enrichment.material,
          finish_type: enrichment.finishType,
          product_line_id: enrichment.productLineId,
          color_hex: product.colorHex || enrichment.colorHex,
          nozzle_temp_min_c: enrichment.nozzleTempMin,
          nozzle_temp_max_c: enrichment.nozzleTempMax,
          bed_temp_min_c: enrichment.bedTempMin,
          bed_temp_max_c: enrichment.bedTempMax,
          print_speed_max_mms: enrichment.printSpeedMax,
          diameter_nominal_mm: product.diameter,
          net_weight_g: product.spoolWeight,
          spool_material: enrichment.spoolMaterial,
          spool_ams_fit: enrichment.isAmsCompatible,
          high_speed_capable: enrichment.highSpeedCapable,
          tds_url: enrichment.tdsUrl,
          auto_created: !existing,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };

        // Remove null values
        for (const key of Object.keys(filamentRecord)) {
          if (filamentRecord[key] === null || filamentRecord[key] === undefined) {
            delete filamentRecord[key];
          }
        }

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('filaments')
            .update(filamentRecord)
            .eq('id', existing.id);

          if (error) {
            console.error(`   Failed to update ${product.productId}:`, error);
            stats.failed++;
          } else {
            stats.updated++;
          }
        } else {
          // Insert new
          const { error } = await supabase
            .from('filaments')
            .insert(filamentRecord);

          if (error) {
            console.error(`   Failed to insert ${product.productId}:`, error);
            stats.failed++;
          } else {
            stats.created++;
          }
        }
        
      } catch (err) {
        console.error(`   Error processing ${product.productId}:`, err);
        stats.failed++;
      }
    }

    // =========================================================================
    // STEP 5: Finalize
    // =========================================================================
    console.log('🏁 Step 5: Finalizing sync...');

    // Update brand product counts
    if (brandId) {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'fusion-filaments' });
      
      // Mark brand as not actively scraping
      await supabase
        .from('automated_brands')
        .update({ 
          scraping_active: false,
          last_scrape_at: new Date().toISOString(),
        })
        .eq('id', brandId);
    }

    // Check for duplicate hex codes
    try {
      await supabase.rpc('find_duplicate_hexes', { p_vendor: vendorName });
    } catch (err) {
      console.warn('   Warning: Could not check for duplicate hex codes:', err);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('✅ Fusion Filaments sync complete!');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Discovered: ${stats.discovered}`);
    console.log(`   Created: ${stats.created}`);
    console.log(`   Updated: ${stats.updated}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Material Fixes (TPE->PETG): ${stats.materialFixes}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration: `${duration}s`,
        message: `Synced ${stats.created + stats.updated} products, fixed ${stats.materialFixes} material miscategorizations`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fusion Filaments sync failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stats,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
