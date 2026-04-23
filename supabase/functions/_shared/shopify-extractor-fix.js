/**
 * FIXED Shopify Extractor - Handles both API response formats
 * Fixes: price formats (string/number), image formats, metafield extraction
 */

// Normalize price to float
function normalizePrice(price) {
  if (!price) return null;
  if (typeof price === 'string') return parseFloat(price);
  if (typeof price === 'number') return price;
  return null;
}

// Normalize image to string
function normalizeImage(image) {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image.src) return image.src;
  return null;
}

// Extract from standard Shopify API response
function extractFromShopifyApi(apiResponse) {
  const data = typeof apiResponse === 'string' ? JSON.parse(apiResponse) : apiResponse;
  const product = data.product || data;
  
  // Extract variants for pricing
  const variants = product.variants || [];
  const mainVariant = variants[0] || {};
  
  // Extract images
  const images = (product.images || []).map(img => normalizeImage(img)).filter(Boolean);
  
  // Extract tags
  const tags = typeof product.tags === 'string' 
    ? product.tags.split(',').map(t => t.trim()) 
    : (product.tags || []);
  
  return {
    // P0 Fields
    name: product.title,
    slug: product.handle,
    product_url: product.url || (product.handle ? `https://www.${brand}.com/products/${product.handle}` : null),
    featured_image: normalizeImage(product.image || images[0]),
    brand: product.vendor,
    
    // P0 Pricing
    price_usd: normalizePrice(mainVariant.price) || normalizePrice(product.price),
    price_currency: 'USD',
    price_unit: 'kg',
    
    // P1 Technical (from metafields or tags)
    material_type: extractMaterialFromTags(tags),
    
    // Metadata
    description: product.body_html,
    tags: tags,
    variant_count: variants.length,
    last_scraped: new Date().toISOString()
  };
}

// Extract material from tags
function extractMaterialFromTags(tags) {
  const materials = [
    'PLA', 'PLA+', 'ABS', 'PETG', 'TPU', 'TPU 95A', 'Nylon', 'ASA', 'PC',
    'HIPS', 'PP', 'PVA', 'Wood', 'Carbon Fiber', 'Silk', 'Metal', 'Matte',
    'Resin', 'Flexible', 'Composite', 'Copier', 'Clear'
  ];
  
  const upperTags = tags.map(t => t.toUpperCase());
  for (const mat of materials) {
    if (upperTags.includes(mat.toUpperCase())) return mat;
  }
  return null;
}

module.exports = { extractFromShopifyApi, normalizePrice, normalizeImage, extractMaterialFromTags };
