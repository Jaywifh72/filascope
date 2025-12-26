import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getColorHex, getColorFamily } from "../_shared/color-mapping.ts";
import { validateScrapedProduct, type ScrapedProduct } from "../_shared/scraper-validation.ts";
import { buildAvailableRegions } from "../_shared/filament-schema.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHOPIFY_BASE_URL = 'https://www.3dxtech.com';

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[] | string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  option1: string | null; // Color
  option2: string | null; // Diameter
  option3: string | null; // Weight
  barcode: string | null;
}

interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  variant_ids: number[];
}

// Extract TDS URL from product HTML
function extractTdsUrl(bodyHtml: string): string | null {
  const tdsPatterns = [
    /href="([^"]*TDS[^"]*\.pdf[^"]*)"/i,
    /href="([^"]*technical[^"]*data[^"]*sheet[^"]*\.pdf[^"]*)"/i,
    /href="([^"]*_TDS_[^"]*\.pdf[^"]*)"/i,
  ];
  
  for (const pattern of tdsPatterns) {
    const match = bodyHtml.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Extract material type from product title and tags
// Using local function optimized for 3DXTech's specialized materials
function extract3DXTechMaterial(title: string, tags: string[] | string): string {
  const combined = `${title} ${Array.isArray(tags) ? tags.join(' ') : tags || ''}`;
  
  // Check for specific materials in order of specificity (3DXTech specialty materials)
  const materialPatterns: [RegExp, string][] = [
    [/esd[- ]?pei[- ]?1010/i, 'ESD PEI 1010'],
    [/esd[- ]?pei[- ]?9085/i, 'ESD PEI 9085'],
    [/esd[- ]?peek/i, 'ESD PEEK'],
    [/esd[- ]?pekk/i, 'ESD PEKK'],
    [/esd[- ]?petg/i, 'ESD PETG'],
    [/esd[- ]?pla/i, 'ESD PLA'],
    [/esd[- ]?abs/i, 'ESD ABS'],
    [/esd[- ]?pc/i, 'ESD PC'],
    [/carbonx.*nylon.*cf/i, 'Nylon CF'],
    [/carbonx.*abs.*cf/i, 'ABS CF'],
    [/carbonx.*asa.*cf/i, 'ASA CF'],
    [/carbonx.*petg.*cf/i, 'PETG CF'],
    [/carbonx.*pc.*cf/i, 'PC CF'],
    [/carbonx.*pei.*cf/i, 'PEI CF'],
    [/carbonx.*peek.*cf/i, 'PEEK CF'],
    [/carbonx.*pekk.*cf/i, 'PEKK CF'],
    [/firewire.*abs/i, 'FR ABS'],
    [/firewire.*pc/i, 'FR PC'],
    [/3dxmax.*asa/i, 'ASA'],
    [/3dxmax.*abs/i, 'ABS'],
    [/3dxmax.*pc[- ]?abs/i, 'PC-ABS'],
    [/3dxmax.*pc/i, 'PC'],
    [/3dxmax.*pei/i, 'PEI'],
    [/3dxmax.*peek/i, 'PEEK'],
    [/3dxmax.*pekk/i, 'PEKK'],
    [/max[- ]?g.*petg/i, 'PETG'],
    [/aquatek.*pva/i, 'PVA'],
    [/aquatek.*hips/i, 'HIPS'],
    [/thermax.*pei/i, 'PEI'],
    [/thermax.*peek/i, 'PEEK'],
    [/thermax.*pekk/i, 'PEKK'],
    [/peek/i, 'PEEK'],
    [/pekk/i, 'PEKK'],
    [/pei.*1010/i, 'PEI 1010'],
    [/pei.*9085/i, 'PEI 9085'],
    [/ultem/i, 'PEI'],
    [/nylon/i, 'Nylon'],
    [/pa[- ]?12/i, 'PA12'],
    [/pa[- ]?6/i, 'PA6'],
    [/pc[- ]?abs/i, 'PC-ABS'],
    [/polycarbonate/i, 'PC'],
    [/\bpc\b/i, 'PC'],
    [/\basa\b/i, 'ASA'],
    [/\babs\b/i, 'ABS'],
    [/\bpetg\b/i, 'PETG'],
    [/\bpla\b/i, 'PLA'],
    [/\btpu\b/i, 'TPU'],
    [/\bpva\b/i, 'PVA'],
    [/\bhips\b/i, 'HIPS'],
  ];
  
  for (const [pattern, material] of materialPatterns) {
    if (pattern.test(combined)) {
      return material;
    }
  }
  
  return 'Unknown';
}

// Get color-specific image from product images
function getColorImage(images: ShopifyImage[], variantId: number, color: string): string | null {
  // First try to find image specifically assigned to this variant
  const variantImage = images.find(img => img.variant_ids.includes(variantId));
  if (variantImage) {
    return variantImage.src;
  }
  
  // Try to match by color in image URL or alt text
  const colorLower = color.toLowerCase().replace(/\s+/g, '');
  for (const img of images) {
    const srcLower = img.src.toLowerCase();
    const altLower = (img.alt || '').toLowerCase();
    
    if (srcLower.includes(colorLower) || altLower.includes(colorLower)) {
      return img.src;
    }
  }
  
  // Return first image as fallback
  return images.length > 0 ? images[0].src : null;
}

// Parse weight from variant option (e.g., "1kg" -> 1000)
function parseWeightGrams(weightStr: string | null): number | null {
  if (!weightStr) return null;
  
  const kgMatch = weightStr.match(/([\d.]+)\s*kg/i);
  if (kgMatch) {
    return Math.round(parseFloat(kgMatch[1]) * 1000);
  }
  
  const gMatch = weightStr.match(/([\d.]+)\s*g(?!k)/i);
  if (gMatch) {
    return Math.round(parseFloat(gMatch[1]));
  }
  
  return null;
}

// Parse diameter from variant option (e.g., "1.75mm" -> 1.75)
function parseDiameter(diameterStr: string | null): number | null {
  if (!diameterStr) return null;
  
  const match = diameterStr.match(/([\d.]+)\s*mm/i);
  if (match) {
    return parseFloat(match[1]);
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Admin authorization check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin } = await authClient.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting 3DXTech product sync...');

    // Fetch all products from Shopify JSON API
    let allProducts: ShopifyProduct[] = [];
    let page = 1;
    const limit = 250;

    while (true) {
      const url = `${SHOPIFY_BASE_URL}/products.json?limit=${limit}&page=${page}`;
      console.log(`Fetching page ${page}: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch page ${page}: ${response.status}`);
        break;
      }

      const data = await response.json();
      const products = data.products || [];
      
      if (products.length === 0) {
        break;
      }

      allProducts = [...allProducts, ...products];
      console.log(`Fetched ${products.length} products from page ${page}`);
      
      if (products.length < limit) {
        break;
      }
      
      page++;
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Total products fetched: ${allProducts.length}`);

    // Filter for filament products only
    const filamentProducts = allProducts.filter(p => {
      const typeMatch = p.product_type?.toLowerCase().includes('reel') || 
                        p.product_type?.toLowerCase().includes('filament');
      const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : (p.tags || '').toLowerCase();
      const tagMatch = tagsStr.includes('filament');
      const titleExclude = p.title?.toLowerCase().includes('nozzle') ||
                          p.title?.toLowerCase().includes('adhesive') ||
                          p.title?.toLowerCase().includes('build sheet');
      return (typeMatch || tagMatch) && !titleExclude;
    });

    console.log(`Filament products to process: ${filamentProducts.length}`);

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      validationWarnings: 0,
      errors: [] as string[],
      products: [] as { title: string; color: string; sku: string; image: string; tds: string }[],
    };

    for (const product of filamentProducts) {
      try {
        // Extract TDS URL
        const tdsUrl = extractTdsUrl(product.body_html || '');
        const material = extract3DXTechMaterial(product.title, product.tags);
        const productUrl = `${SHOPIFY_BASE_URL}/products/${product.handle}`;

        // Get unique colors from variants (filter for 1.75mm only for now)
        const colorVariants = product.variants.filter(v => {
          const diameter = v.option2?.toLowerCase();
          return diameter?.includes('1.75') || !v.option2;
        });

        // Group by color to get best variant per color
        const colorGroups = new Map<string, ShopifyVariant>();
        for (const variant of colorVariants) {
          const color = variant.option1 || 'Default';
          if (!colorGroups.has(color)) {
            colorGroups.set(color, variant);
          } else {
            // Prefer 1kg variant
            const existing = colorGroups.get(color)!;
            const existingWeight = parseWeightGrams(existing.option3);
            const newWeight = parseWeightGrams(variant.option3);
            if (newWeight === 1000 && existingWeight !== 1000) {
              colorGroups.set(color, variant);
            }
          }
        }

        for (const [color, variant] of colorGroups) {
          const colorImage = getColorImage(product.images, variant.id, color);
          const weight = parseWeightGrams(variant.option3);
          const diameter = parseDiameter(variant.option2);
          
          // Build product title with color
          const productTitle = color !== 'Default' && color !== 'Natural' && !product.title.includes(color)
            ? `3DXTech ${product.title} - ${color}`
            : `3DXTech ${product.title}`;
          
          // Create scraped product for validation
          const scrapedProduct: ScrapedProduct = {
            productId: `3dxtech-${product.id}-${variant.id}`,
            title: productTitle,
            price: parseFloat(variant.price) || null,
            url: productUrl,
            imageUrl: colorImage,
            tdsUrl: tdsUrl,
            material: material,
            colorHex: getColorHex(color),
            colorFamily: getColorFamily(color),
            netWeightG: weight || 1000,
            diameterMm: diameter || 1.75,
            sku: variant.sku || null,
            barcode: variant.barcode,
            available: true,
            currency: 'USD',
            region: 'US',
          };
          
          // Validate scraped product using shared validation
          const validation = validateScrapedProduct(scrapedProduct);
          if (!validation.valid) {
            console.warn(`Validation errors for ${productTitle}:`, validation.errors);
            results.validationWarnings++;
          }
          if (validation.warnings.length > 0) {
            console.log(`Validation warnings for ${productTitle}:`, validation.warnings);
          }
          
          // Check if this product already exists
          const { data: existing } = await supabase
            .from('filaments')
            .select('id, featured_image, tds_url')
            .eq('vendor', '3DXTech')
            .ilike('product_title', `%${product.title}%`)
            .ilike('product_title', `%${color}%`)
            .maybeSingle();

          const filamentData = {
            product_title: productTitle,
            product_handle: product.handle,
            product_url: productUrl,
            vendor: '3DXTech',
            material: material,
            variant_sku: variant.sku || null,
            upc: variant.barcode || null,
            variant_price: parseFloat(variant.price) || null,
            featured_image: colorImage,
            tds_url: tdsUrl,
            color_hex: getColorHex(color),
            color_family: getColorFamily(color),
            net_weight_g: weight || 1000,
            diameter_nominal_mm: diameter || 1.75,
            variant_available: true,
            available_regions: ['US'], // 3DXTech is US-only
          };

          if (existing) {
            // Update existing
            const { error } = await supabase
              .from('filaments')
              .update({
                ...filamentData,
                // Don't overwrite image if already set and new is null
                featured_image: colorImage || existing.featured_image,
                // Don't overwrite TDS if already set and new is null
                tds_url: tdsUrl || existing.tds_url,
              })
              .eq('id', existing.id);

            if (error) {
              console.error(`Error updating ${productTitle}:`, error);
              results.errors.push(`Update error: ${productTitle}`);
            } else {
              results.updated++;
              console.log(`Updated: ${productTitle}`);
            }
          } else {
            // Create new
            const { error } = await supabase
              .from('filaments')
              .insert(filamentData);

            if (error) {
              console.error(`Error creating ${productTitle}:`, error);
              results.errors.push(`Create error: ${productTitle}`);
            } else {
              results.created++;
              console.log(`Created: ${productTitle}`);
            }
          }

          results.products.push({
            title: productTitle,
            color: color,
            sku: variant.sku,
            image: colorImage ? 'Yes' : 'No',
            tds: tdsUrl ? 'Yes' : 'No',
          });
        }
      } catch (error) {
        console.error(`Error processing ${product.title}:`, error);
        results.errors.push(`Process error: ${product.title}`);
      }
    }

    console.log('Sync complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `3DXTech sync complete: ${results.created} created, ${results.updated} updated`,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in sync-3dxtech-products:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
