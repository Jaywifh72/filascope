import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Accessory brand URL mappings - old URLs to new working URLs
const ACCESSORY_URL_MAPPINGS: Record<string, Record<string, string>> = {
  // Creality URL mappings - Hyper series renamed
  "Creality": {
    // Hyper PLA CF renamed
    "hyper-series-pla-carbon-fiber-3d-printing-filament": "hyper-pla-cf",
    "hyper-series-pla-3d-printing-filament": "hyper-pla",
    "hyper-series-petg-3d-printing-filament": "hyper-petg",
    "hyper-series-abs-3d-printing-filament": "hyper-abs",
    // Other Hyper variants
    "hyper-series-pla-high-speed-3d-printing-filament": "hyper-pla",
    "creality-hyper-pla-carbon-fiber": "hyper-pla-cf",
    "creality-hyper-pla-cf": "hyper-pla-cf",
  },
  // Snapmaker URL mappings - products were consolidated or renamed
  "Snapmaker": {
    // PEI sheets - old URLs redirected to new product pages
    "pei-sheet-a250-f250": "textured-and-smooth-pei-steel-plate-for-a250-a350",
    "pei-sheet-a350-f350": "textured-and-smooth-pei-steel-plate-for-a250-a350",
    "pei-glass-plate-for-snapmaker-artisan": "textured-and-smooth-pei-steel-plate-for-snapmaker-artisan",
    // Multi-material module renamed to dual extrusion
    "multi-material-printing-module": "snapmaker-dual-extrusion-3d-printing-module",
    // Hotends
    "u1-hardened-steel-hotend-bundle-02mm": "0-2mm-hardened-steel-hotend-for-snapmaker-u1",
    "u1-hardened-steel-hotend-bundle-04mm": "0-4mm-hardened-steel-hotend-for-snapmaker-u1",
    "u1-hardened-steel-hotend-bundle-06mm": "0-6mm-hardened-steel-hotend-for-snapmaker-u1",
    "u1-hardened-steel-hotend-bundle-08mm": "0-8mm-hardened-steel-hotend-for-snapmaker-u1",
    "extruder-hot-end-kit-snapmaker-original": "3d-printing-module-for-snapmaker-original",
    // J1 printer 
    "snapmaker-j1-independent-dual-extruder-3d-printer": "snapmaker-j1-idex-3d-printer",
  },
  // QIDI URL mappings - products renamed
  "QIDI": {
    // PEI plates renamed to include "dual-sided"
    "max4-pei-plate": "max4-dual-sided-pei-plate",
    "q2-pei-plate": "q2-dual-sided-pei-plate",
    "plus4-pei-plate": "plus4-dual-sided-smooth-pei-plate",
    // X-Smart 3 was discontinued/renamed
    "x-smart-3": "qidi-x-smart-3",
  },
  // Ultimaker accessory URL mappings - new MakerBot integration format
  "Ultimaker": {
    // Factor 4 accessories
    "factor-4-glass-plate": "makerbot-factor-4-glass-plate",
    // Method accessories
    "method-x-build-plate": "build-plate-for-makerbot-method-xl",
    // S-Series accessories
    "print-table-glass-s3": "glass-build-plate-for-ultimaker-s3-s5",
  },
  // Raise3D URL mappings
  "Raise3D": {
    // Pro3 hotends - URL format changed
    "interchangeable-hot-end-assembly-v3h-nozzle-0-6mm-pro3-series-only": "v3h-hot-end-assembly-06mm-pro3",
    "interchangeable-hot-end-assembly-v3h-nozzle-0-8mm-pro3-series-only": "v3h-hot-end-assembly-08mm-pro3",
  },
  // FlashForge
  "FlashForge": {
    "creator-3-glass-plate": "creator-3-pro-glass-plate",
  },
};

// Brand-specific URL patterns (for transforming URLs with patterns rather than explicit mappings)
interface BrandUrlPattern {
  oldDomain?: string;
  newDomain?: string;
  pathTransform?: (path: string) => string;
}

const BRAND_URL_PATTERNS: Record<string, BrandUrlPattern> = {
  // Creality: hyper-series renamed to hyper-
  "Creality": {
    pathTransform: (path: string) => {
      // Creality renamed hyper-series-* to hyper-*
      return path.replace('hyper-series-', 'hyper-');
    }
  },
  // Snapmaker: shop.snapmaker.com → us.snapmaker.com
  "Snapmaker": {
    oldDomain: "shop.snapmaker.com",
    newDomain: "us.snapmaker.com",
  },
  // QIDI: qidi3d.com → us.qidi3d.com for some products
  "QIDI": {
    oldDomain: "qidi3d.com",
    newDomain: "us.qidi3d.com",
  },
  // FLSUN: flsun.com → store.flsun3d.com
  "FLSUN": {
    oldDomain: "www.flsun.com",
    newDomain: "store.flsun3d.com",
  },
  // Elegoo: product URLs sometimes need regional prefix
  "Elegoo": {
    pathTransform: (path: string) => {
      // Elegoo product URLs work on main site
      return path;
    }
  },
};

// Brand-specific configurations for finding product URLs
const BRAND_CONFIGS: Record<string, {
  searchUrl?: (query: string) => string;
  collectionsUrl?: string;
  shopifyStore?: string;
  urlPattern?: RegExp;
}> = {
  "3DXTech": {
    shopifyStore: "https://www.3dxtech.com",
    collectionsUrl: "https://www.3dxtech.com/collections/all.json",
  },
  "Polymaker": {
    shopifyStore: "https://us.polymaker.com",
    collectionsUrl: "https://us.polymaker.com/collections/all.json",
  },
  "Prusament": {
    shopifyStore: "https://www.prusa3d.com",
  },
  "eSUN": {
    shopifyStore: "https://www.esun3dstore.com",
    collectionsUrl: "https://www.esun3dstore.com/collections/all.json",
  },
  "Hatchbox": {
    shopifyStore: "https://www.hatchbox3d.com",
    collectionsUrl: "https://www.hatchbox3d.com/collections/all.json",
  },
  "Overture": {
    shopifyStore: "https://overture3d.com",
    collectionsUrl: "https://overture3d.com/collections/all.json",
  },
  "Sunlu": {
    shopifyStore: "https://www.sunlu.com",
  },
  "Amolen": {
    shopifyStore: "https://amolen.com",
    collectionsUrl: "https://amolen.com/collections/all.json",
  },
  "Fillamentum": {
    shopifyStore: "https://fillamentum.com",
    collectionsUrl: "https://fillamentum.com/collections/all.json",
  },
  "ColorFabb": {
    shopifyStore: "https://colorfabb.com",
  },
  "MatterHackers": {
    shopifyStore: "https://www.matterhackers.com",
  },
  "Paramount 3D": {
    shopifyStore: "https://www.paramount-3d.com",
    collectionsUrl: "https://www.paramount-3d.com/collections/all.json",
  },
  "3D-Fuel": {
    shopifyStore: "https://www.3dfuel.com",
    collectionsUrl: "https://www.3dfuel.com/collections/all.json",
  },
  "NinjaTek": {
    shopifyStore: "https://ninjatek.com",
    collectionsUrl: "https://ninjatek.com/collections/all.json",
  },
  "Fiberlogy": {
    shopifyStore: "https://fiberlogy.com",
  },
  "Atomic Filament": {
    shopifyStore: "https://atomicfilament.com",
    collectionsUrl: "https://atomicfilament.com/collections/all.json",
  },
  "Proto-Pasta": {
    shopifyStore: "https://www.proto-pasta.com",
    collectionsUrl: "https://www.proto-pasta.com/collections/all.json",
  },
  "Taulman3D": {
    shopifyStore: "https://taulman3d.com",
  },
  "ZIRO": {
    shopifyStore: "https://ziro3d.com",
    collectionsUrl: "https://ziro3d.com/collections/all.json",
  },
  "VoxelPLA": {
    shopifyStore: "https://voxelpla.com",
    collectionsUrl: "https://voxelpla.com/collections/all.json",
  },
  "Bambu Lab": {
    shopifyStore: "https://us.store.bambulab.com",
    collectionsUrl: "https://us.store.bambulab.com/collections/all.json",
  },
  "Ultimaker": {
    shopifyStore: "https://store.ultimaker.com",
  },
};

// Ultimaker URL mapping - old product URLs to new S-Series URLs
// New URL format: https://store.ultimaker.com/3d-printer-materials/s-series-materials/um-{material}-packaged
// Some materials use direct format: https://store.ultimaker.com/ultimaker-s-series-{material}-material
const ULTIMAKER_URL_MAPPINGS: Record<string, string> = {
  // PPS CF - S-Series packaged format
  "ultimaker-pps-cf-filament-2-85mm": "3d-printer-materials/s-series-materials/um-pps-cf-packaged",
  "ultimaker-pps-cf-3d-printer-filament-2-85mm": "3d-printer-materials/s-series-materials/um-pps-cf-packaged",
  // PEEK - S-Series packaged format
  "ultimaker-peek-filament-2-85mm": "3d-printer-materials/s-series-materials/um-peek-packaged",
  "ultimaker-peek-3d-printer-filament-2-85mm": "3d-printer-materials/s-series-materials/um-peek-packaged",
  // CPE materials
  "ultimaker-cpe-filament-2-85mm": "ultimaker-s-series-cpe-material",
  "ultimaker-cpeplus-filament-2-85mm": "ultimaker-s-series-cpe-plus-material",
  "ultimaker-cpe-plus-filament-2-85mm": "ultimaker-s-series-cpe-plus-material",
  // PLA materials
  "ultimaker-pla-filament-2-85mm": "ultimaker-s-series-pla-material",
  "ultimaker-tough-pla-filament-2-85mm": "ultimaker-s-series-tough-pla-material",
  // ABS materials
  "ultimaker-abs-filament-2-85mm": "ultimaker-s-series-abs-material",
  // PETG materials
  "ultimaker-petg-filament-2-85mm": "ultimaker-s-series-petg-material",
  // PET CF materials (note: no hyphen in petcf)
  "ultimaker-pet-cf-filament-2-85mm": "ultimaker-s-series-petcf-material",
  // Nylon materials
  "ultimaker-nylon-filament-2-85mm": "ultimaker-s-series-nylon-material",
  "ultimaker-nylon-cf-filament-2-85mm": "ultimaker-s-series-nyloncf-material",
  // PC materials
  "ultimaker-pc-filament-2-85mm": "ultimaker-s-series-pc-material",
  "ultimaker-pc-abs-filament-2-85mm": "ultimaker-s-series-pcabs-material",
  // PP materials
  "ultimaker-pp-filament-2-85mm": "ultimaker-s-series-pp-material",
  // TPU materials
  "ultimaker-tpu-95a-filament-2-85mm": "ultimaker-s-series-tpu95a-material",
  // PVA materials
  "ultimaker-pva-filament-2-85mm": "ultimaker-s-series-pva-material",
  // Breakaway materials
  "ultimaker-breakaway-filament-2-85mm": "ultimaker-s-series-breakaway-material",
  // Specialty / Composite materials (note: hyphens removed in new URLs for composites)
  "ultimaker-pla-carbon-fiber-filament-2-85mm": "ultimaker-s-series-placf-material",
  "ultimaker-metal-pla-filament-2-85mm": "ultimaker-s-series-metalpla-material",
  "ultimaker-glass-filled-nylon-filament-2-85mm": "ultimaker-s-series-glassfilled-nylon-material",
  "ultimaker-pei-filament-2-85mm": "ultimaker-s-series-pei-material",
  "ultimaker-abs-cf-filament-2-85mm": "ultimaker-s-series-abscf-material",
  // Color variants - PLA colors
  "ultimaker-pla-black-filament-2-85mm": "ultimaker-s-series-pla-material",
  "ultimaker-pla-white-filament-2-85mm": "ultimaker-s-series-pla-material",
  "ultimaker-pla-red-filament-2-85mm": "ultimaker-s-series-pla-material",
  "ultimaker-pla-blue-filament-2-85mm": "ultimaker-s-series-pla-material",
  "ultimaker-pla-green-filament-2-85mm": "ultimaker-s-series-pla-material",
  "ultimaker-pla-yellow-filament-2-85mm": "ultimaker-s-series-pla-material",
  "ultimaker-pla-orange-filament-2-85mm": "ultimaker-s-series-pla-material",
  "ultimaker-pla-silver-metallic-filament-2-85mm": "ultimaker-s-series-pla-material",
  "ultimaker-pla-pearl-white-filament-2-85mm": "ultimaker-s-series-pla-material",
  // Color variants - Tough PLA colors
  "ultimaker-tough-pla-black-filament-2-85mm": "ultimaker-s-series-tough-pla-material",
  "ultimaker-tough-pla-white-filament-2-85mm": "ultimaker-s-series-tough-pla-material",
  "ultimaker-tough-pla-red-filament-2-85mm": "ultimaker-s-series-tough-pla-material",
  "ultimaker-tough-pla-green-filament-2-85mm": "ultimaker-s-series-tough-pla-material",
  // Color variants - ABS colors
  "ultimaker-abs-black-filament-2-85mm": "ultimaker-s-series-abs-material",
  "ultimaker-abs-white-filament-2-85mm": "ultimaker-s-series-abs-material",
  "ultimaker-abs-red-filament-2-85mm": "ultimaker-s-series-abs-material",
  "ultimaker-abs-blue-filament-2-85mm": "ultimaker-s-series-abs-material",
  "ultimaker-abs-grey-filament-2-85mm": "ultimaker-s-series-abs-material",
  "ultimaker-abs-orange-filament-2-85mm": "ultimaker-s-series-abs-material",
  "ultimaker-abs-yellow-filament-2-85mm": "ultimaker-s-series-abs-material",
  "ultimaker-abs-green-filament-2-85mm": "ultimaker-s-series-abs-material",
  "ultimaker-abs-silver-metallic-filament-2-85mm": "ultimaker-s-series-abs-material",
  // Color variants - CPE colors
  "ultimaker-cpe-black-filament-2-85mm": "ultimaker-s-series-cpe-material",
  "ultimaker-cpe-white-filament-2-85mm": "ultimaker-s-series-cpe-material",
  "ultimaker-cpe-yellow-filament-2-85mm": "ultimaker-s-series-cpe-material",
  "ultimaker-cpe-dark-grey-filament-2-85mm": "ultimaker-s-series-cpe-material",
  "ultimaker-cpe-light-grey-filament-2-85mm": "ultimaker-s-series-cpe-material",
  "ultimaker-cpe-transparent-filament-2-85mm": "ultimaker-s-series-cpe-material",
  // Color variants - Nylon colors
  "ultimaker-nylon-black-filament-2-85mm": "ultimaker-s-series-nylon-material",
  "ultimaker-nylon-natural-filament-2-85mm": "ultimaker-s-series-nylon-material",
  // Color variants - PC colors
  "ultimaker-pc-black-filament-2-85mm": "ultimaker-s-series-pc-material",
  "ultimaker-pc-white-filament-2-85mm": "ultimaker-s-series-pc-material",
  "ultimaker-pc-transparent-filament-2-85mm": "ultimaker-s-series-pc-material",
  // Color variants - TPU colors
  "ultimaker-tpu-95a-black-filament-2-85mm": "ultimaker-s-series-tpu95a-material",
  "ultimaker-tpu-95a-white-filament-2-85mm": "ultimaker-s-series-tpu95a-material",
  "ultimaker-tpu-95a-red-filament-2-85mm": "ultimaker-s-series-tpu95a-material",
  "ultimaker-tpu-95a-blue-filament-2-85mm": "ultimaker-s-series-tpu95a-material",
};

// Prusa URL mappings - old /product/ format to new /e-shop/ format
const PRUSA_URL_MAPPINGS: Record<string, string> = {
  // Prusament PLA
  "prusament-pla-prusa-galaxy-black-1kg": "prusament-pla-galaxy-black-1kg",
  "prusament-pla-prusa-orange-1kg": "prusament-pla-prusa-orange-1kg",
  // Prusament PETG
  "prusament-petg-prusa-orange-1kg": "prusament-petg-prusa-orange-1kg",
  "prusament-petg-jet-black-1kg": "prusament-petg-jet-black-1kg",
};

// ColorFabb URL mappings
const COLORFABB_URL_MAPPINGS: Record<string, string> = {
  // Economy PLA to standard collections
  "economy-pla-black": "pla-economy-black",
  "economy-pla-white": "pla-economy-white",
};

// Bambu Lab URL mappings - regional store changes
const BAMBU_URL_MAPPINGS: Record<string, string> = {
  // Old global store to US store format
  "bambu-pla-basic-filament": "pla-basic-filament",
  "bambu-pla-matte-filament": "pla-matte-filament",
  "bambu-abs-filament": "abs-filament",
  "bambu-tpu-95a-filament": "tpu-95a-filament",
  "bambu-pla-silk-filament": "pla-silk-filament",
  "bambu-pla-sparkle-filament": "pla-sparkle-filament",
  "bambu-pla-metal-filament": "pla-metal-filament",
  "bambu-pla-marble-filament": "pla-marble-filament",
  "bambu-pla-glow-filament": "pla-glow-filament",
  "bambu-pla-galaxy-filament": "pla-galaxy-filament",
  "bambu-support-for-pla": "support-for-pla",
  "bambu-support-for-pa-pet": "support-for-pa-pet",
  "bambu-pa6-cf-filament": "pa6-cf-filament",
  "bambu-paht-cf-filament": "paht-cf-filament",
  "bambu-ppa-cf-filament": "ppa-cf-filament",
  "bambu-pc-filament": "pc-filament",
  "bambu-asa-filament": "asa-filament",
  "bambu-petg-cf-filament": "petg-cf-filament",
};

// Brand-specific URL fixing functions
type UrlFixer = (currentUrl: string, productTitle?: string) => string | null;

const BRAND_URL_FIXERS: Record<string, UrlFixer> = {
  "Ultimaker": (currentUrl: string) => {
    if (!currentUrl || !currentUrl.includes('store.ultimaker.com')) return null;
    
    try {
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      const productSlug = pathParts[pathParts.length - 1];
      
      // New URL format: https://store.ultimaker.com/{product-slug} (direct at root)
      const newBaseUrl = "https://store.ultimaker.com";
      
      // Check direct mapping first
      if (ULTIMAKER_URL_MAPPINGS[productSlug]) {
        return `${newBaseUrl}/${ULTIMAKER_URL_MAPPINGS[productSlug]}`;
      }
      
      // Pattern matching for old /products/ URLs
      // ultimaker-{material}-filament-2-85mm -> ultimaker-s-series-{material}-material
      const materialMatch = productSlug.match(/^ultimaker-(.+?)-filament/i);
      if (materialMatch) {
        let material = materialMatch[1];
        // Clean up material name - remove color suffixes, diameter suffix, and standardize
        material = material
          .replace(/-2-85mm$/, '')
          .replace(/-(black|white|red|blue|green|yellow|orange|grey|silver|natural|transparent|dark-grey|light-grey|pearl-white|silver-metallic)$/i, '');
        
        // For composite materials (containing -cf, -gf, etc.), remove the hyphen
        // e.g., pet-cf -> petcf, nylon-cf -> nyloncf, abs-cf -> abscf
        const compositeMatch = material.match(/^(.+?)-(cf|gf|plus)$/i);
        if (compositeMatch) {
          material = compositeMatch[1] + compositeMatch[2].toLowerCase();
        }
        
        // Also handle special cases like tpu-95a -> tpu95a, pc-abs -> pcabs
        material = material
          .replace(/-95a$/i, '95a')
          .replace(/^pc-abs$/i, 'pcabs')
          .replace(/^tough-pla$/i, 'tough-pla'); // keep tough-pla as is
        
        return `${newBaseUrl}/ultimaker-s-series-${material}-material`;
      }
      
      // If URL is in old /products/ format, try to convert
      if (url.pathname.includes('/products/')) {
        // Extract product slug and try direct conversion
        let slug = productSlug
          .replace(/-filament-2-85mm$/, '')
          .replace(/-filament$/, '')
          .replace(/-2-85mm$/, '');
        
        // Remove hyphens for composite materials
        slug = slug
          .replace(/-cf$/i, 'cf')
          .replace(/-gf$/i, 'gf')
          .replace(/-95a$/i, '95a')
          .replace(/^ultimaker-pc-abs$/i, 'ultimaker-pcabs')
          .replace(/^ultimaker-/, 'ultimaker-s-series-');
        
        return `${newBaseUrl}/${slug}-material`;
      }
      
      return null;
    } catch {
      return null;
    }
  },
  
  "Prusament": (currentUrl: string) => {
    if (!currentUrl || !currentUrl.includes('prusa3d.com')) return null;
    
    try {
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      const productSlug = pathParts[pathParts.length - 1];
      
      // Check direct mapping
      if (PRUSA_URL_MAPPINGS[productSlug]) {
        return `https://www.prusa3d.com/product/${PRUSA_URL_MAPPINGS[productSlug]}`;
      }
      
      // If URL contains /product/ but returns 404, try /e-shop/ path
      if (currentUrl.includes('/product/')) {
        return currentUrl.replace('/product/', '/e-shop/');
      }
      
      return null;
    } catch {
      return null;
    }
  },
  
  "ColorFabb": (currentUrl: string) => {
    if (!currentUrl || !currentUrl.includes('colorfabb.com')) return null;
    
    try {
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      const productSlug = pathParts[pathParts.length - 1];
      
      if (COLORFABB_URL_MAPPINGS[productSlug]) {
        return `https://colorfabb.com/collections/all/products/${COLORFABB_URL_MAPPINGS[productSlug]}`;
      }
      
      // Try alternative path structure
      if (currentUrl.includes('/shop/') && !currentUrl.includes('/products/')) {
        const newUrl = currentUrl.replace('/shop/', '/collections/all/products/');
        return newUrl;
      }
      
      return null;
    } catch {
      return null;
    }
  },
  
  "Bambu Lab": (currentUrl: string) => {
    if (!currentUrl || !currentUrl.includes('bambulab.com')) return null;
    
    try {
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      const productSlug = pathParts[pathParts.length - 1];
      
      // Check direct mapping
      if (BAMBU_URL_MAPPINGS[productSlug]) {
        return `https://us.store.bambulab.com/products/${BAMBU_URL_MAPPINGS[productSlug]}`;
      }
      
      // Handle regional store changes (store.bambulab.com -> us.store.bambulab.com)
      if (url.hostname === 'store.bambulab.com') {
        return currentUrl.replace('store.bambulab.com', 'us.store.bambulab.com');
      }
      
      // Handle EU/UK/other regional stores
      if (url.hostname.match(/^(eu|uk|au|ca)\.store\.bambulab\.com/)) {
        // Try US store as fallback
        return currentUrl.replace(url.hostname, 'us.store.bambulab.com');
      }
      
      return null;
    } catch {
      return null;
    }
  },
  
  "MatterHackers": (currentUrl: string) => {
    if (!currentUrl || !currentUrl.includes('matterhackers.com')) return null;
    
    try {
      // MatterHackers sometimes changes /store/ to /products/ paths
      if (currentUrl.includes('/store/') && !currentUrl.includes('/products/')) {
        return currentUrl.replace('/store/', '/products/');
      }
      
      return null;
    } catch {
      return null;
    }
  },
  
  "Snapmaker": (currentUrl: string) => {
    if (!currentUrl) return null;
    if (!currentUrl.includes('snapmaker.com')) return null;
    
    try {
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      const productSlug = pathParts[pathParts.length - 1];
      
      // Check accessory URL mappings first
      const accessoryMappings = ACCESSORY_URL_MAPPINGS["Snapmaker"];
      if (accessoryMappings && accessoryMappings[productSlug]) {
        return `https://us.snapmaker.com/products/${accessoryMappings[productSlug]}`;
      }
      
      // Transform shop.snapmaker.com → us.snapmaker.com
      if (url.hostname === 'shop.snapmaker.com') {
        return currentUrl.replace('shop.snapmaker.com', 'us.snapmaker.com');
      }
      
      return null;
    } catch {
      return null;
    }
  },
  
  "QIDI": (currentUrl: string) => {
    if (!currentUrl) return null;
    if (!currentUrl.includes('qidi3d.com')) return null;
    
    try {
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      const productSlug = pathParts[pathParts.length - 1];
      
      // Check accessory URL mappings first
      const accessoryMappings = ACCESSORY_URL_MAPPINGS["QIDI"];
      if (accessoryMappings && accessoryMappings[productSlug]) {
        // QIDI products work on both qidi3d.com and us.qidi3d.com
        return `https://qidi3d.com/products/${accessoryMappings[productSlug]}`;
      }
      
      // Try switching between regional variants
      if (url.hostname === 'us.qidi3d.com') {
        // Try main domain
        return currentUrl.replace('us.qidi3d.com', 'qidi3d.com');
      } else if (url.hostname === 'qidi3d.com') {
        // Try US domain
        return currentUrl.replace('qidi3d.com', 'us.qidi3d.com');
      }
      
      return null;
    } catch {
      return null;
    }
  },
  
  "Raise3D": (currentUrl: string) => {
    if (!currentUrl) return null;
    if (!currentUrl.includes('raise3d.com')) return null;
    
    try {
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      const productSlug = pathParts[pathParts.length - 1];
      
      // Check accessory URL mappings
      const accessoryMappings = ACCESSORY_URL_MAPPINGS["Raise3D"];
      if (accessoryMappings && accessoryMappings[productSlug]) {
        return `https://www.raise3d.com/products/${accessoryMappings[productSlug]}/`;
      }
      
      // Remove trailing slash issues
      if (currentUrl.endsWith('//')) {
        return currentUrl.slice(0, -1);
      }
      
      return null;
    } catch {
      return null;
    }
  },
  
  "FlashForge": (currentUrl: string) => {
    if (!currentUrl) return null;
    if (!currentUrl.includes('flashforge.com')) return null;
    
    try {
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      const productSlug = pathParts[pathParts.length - 1];
      
      // Check accessory URL mappings
      const accessoryMappings = ACCESSORY_URL_MAPPINGS["FlashForge"];
      if (accessoryMappings && accessoryMappings[productSlug]) {
        return `https://www.flashforge.com/products/${accessoryMappings[productSlug]}`;
      }
      
      return null;
    } catch {
      return null;
    }
  },
  
  "FLSUN": (currentUrl: string) => {
    if (!currentUrl) return null;
    if (!currentUrl.includes('flsun')) return null;
    
    try {
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      const productSlug = pathParts[pathParts.length - 1];
      
      // Transform www.flsun.com → store.flsun3d.com
      if (url.hostname === 'www.flsun.com') {
        return currentUrl.replace('www.flsun.com', 'store.flsun3d.com');
      }
      
      return null;
    } catch {
      return null;
    }
  },
  
  "Elegoo": (currentUrl: string) => {
    if (!currentUrl) return null;
    if (!currentUrl.includes('elegoo.com')) return null;
    
    try {
      // Elegoo product URLs sometimes get region prefixes
      // Try different variants
      const url = new URL(currentUrl);
      
      // If URL doesn't have regional prefix, try adding one
      if (url.hostname === 'www.elegoo.com') {
        // The main site should work, but could try regional
        return null;
      }
      
      return null;
    } catch {
      return null;
    }
  },
  
  "Creality": (currentUrl: string) => {
    if (!currentUrl) return null;
    if (!currentUrl.includes('creality.com') && !currentUrl.includes('store.creality.com')) return null;
    
    try {
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      const productSlug = pathParts[pathParts.length - 1];
      
      // Check accessory URL mappings first
      const accessoryMappings = ACCESSORY_URL_MAPPINGS["Creality"];
      if (accessoryMappings && accessoryMappings[productSlug]) {
        return `https://store.creality.com/products/${accessoryMappings[productSlug]}`;
      }
      
      // Try applying the hyper-series- to hyper- transformation
      const pattern = BRAND_URL_PATTERNS["Creality"];
      if (pattern?.pathTransform) {
        const transformedSlug = pattern.pathTransform(productSlug);
        if (transformedSlug !== productSlug) {
          return `https://store.creality.com/products/${transformedSlug}`;
        }
      }
      
      // Try generic path transformations
      if (productSlug.includes('hyper-series-')) {
        const newSlug = productSlug.replace('hyper-series-', 'hyper-');
        return `https://store.creality.com/products/${newSlug}`;
      }
      
      return null;
    } catch {
      return null;
    }
  },
};

// Try to fix URL using brand-specific logic (also checks accessory mappings)
function fixBrandUrl(vendor: string, currentUrl: string, productTitle?: string): string | null {
  // First try filament-specific brand fixers
  const fixer = BRAND_URL_FIXERS[vendor];
  if (fixer) {
    const result = fixer(currentUrl, productTitle);
    if (result) return result;
  }
  
  // Also try generic accessory URL mappings for any brand
  if (currentUrl) {
    try {
      const url = new URL(currentUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      const productSlug = pathParts[pathParts.length - 1];
      
      // Check all accessory mappings
      for (const [brand, mappings] of Object.entries(ACCESSORY_URL_MAPPINGS)) {
        if (mappings[productSlug]) {
          // Determine correct base URL for the brand
          const brandPattern = BRAND_URL_PATTERNS[brand];
          const newDomain = brandPattern?.newDomain || url.hostname;
          return `https://${newDomain}/products/${mappings[productSlug]}`;
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }
  
  return null;
}

// Normalize text for matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Calculate similarity score between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(normalizeText(str1).split(" ").filter(w => w.length > 2));
  const words2 = new Set(normalizeText(str2).split(" ").filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let matches = 0;
  words1.forEach(word => {
    if (words2.has(word)) matches++;
  });
  
  return matches / Math.max(words1.size, words2.size);
}

// Try to find product by searching parent directory of broken URL
async function findInParentDirectory(
  currentUrl: string,
  productTitle: string,
  firecrawlApiKey: string
): Promise<string | null> {
  try {
    if (!currentUrl) return null;
    
    const url = new URL(currentUrl);
    const pathParts = url.pathname.split('/').filter(p => p);
    
    // Go up one level - e.g., /products/thermax-peek-1-75mm -> /products/
    if (pathParts.length < 2) return null;
    
    const parentPath = '/' + pathParts.slice(0, -1).join('/') + '/';
    const parentUrl = `${url.origin}${parentPath}`;
    const brokenSlug = pathParts[pathParts.length - 1];
    
    console.log(`Searching parent directory: ${parentUrl}`);
    console.log(`Looking for products similar to slug: ${brokenSlug}`);
    
    // Try to fetch and scrape the parent directory page
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: parentUrl,
        formats: ["links"],
        onlyMainContent: false,
      }),
    });
    
    if (!response.ok) {
      console.log(`Parent directory scrape failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const links: string[] = data.data?.links || [];
    
    console.log(`Found ${links.length} links in parent directory`);
    
    // Extract slug parts for matching (e.g., "thermax-peek-1-75mm" -> ["thermax", "peek"])
    const slugParts = brokenSlug.toLowerCase()
      .replace(/[0-9-]+mm$/i, '') // Remove size suffix like "1-75mm"
      .split('-')
      .filter(p => p.length > 2);
    
    console.log(`Slug parts to match: ${slugParts.join(', ')}`);
    
    // Also extract key terms from product title
    const titleParts = normalizeText(productTitle)
      .split(' ')
      .filter(w => w.length > 2 && !['175mm', '285mm', '1kg', '750g'].includes(w));
    
    let bestMatch: { url: string; score: number } | null = null;
    
    for (const link of links) {
      if (!link.includes('/products/') && !link.includes('/product/')) continue;
      
      try {
        const linkUrl = new URL(link);
        // Must be same origin
        if (linkUrl.origin !== url.origin) continue;
        
        const linkSlug = linkUrl.pathname.split('/').pop() || '';
        const linkSlugLower = linkSlug.toLowerCase();
        
        // Skip the broken URL itself
        if (linkSlugLower === brokenSlug.toLowerCase()) continue;
        
        // Calculate match score based on shared slug parts
        let score = 0;
        for (const part of slugParts) {
          if (linkSlugLower.includes(part)) {
            score += 2; // Higher weight for slug matches
          }
        }
        
        // Also check title parts
        for (const part of titleParts) {
          if (linkSlugLower.includes(part)) {
            score += 1;
          }
        }
        
        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { url: link, score };
          console.log(`Potential match: ${link} (score: ${score})`);
        }
      } catch {
        continue;
      }
    }
    
    if (bestMatch) {
      console.log(`Best parent directory match: ${bestMatch.url} (score: ${bestMatch.score})`);
      return bestMatch.url;
    }
    
    return null;
  } catch (error) {
    console.error("Error searching parent directory:", error);
    return null;
  }
}

// Try to find product in Shopify collections
async function findInShopifyCollections(
  collectionsUrl: string,
  productTitle: string,
  baseUrl: string
): Promise<string | null> {
  try {
    console.log(`Searching Shopify collections: ${collectionsUrl}`);
    
    const response = await fetch(collectionsUrl, {
      headers: { "Accept": "application/json" },
    });
    
    if (!response.ok) {
      console.log(`Collections fetch failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    console.log(`Found ${products.length} products in collection`);
    
    let bestMatch: { url: string; score: number } | null = null;
    
    for (const product of products) {
      const score = calculateSimilarity(productTitle, product.title);
      
      if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          url: `${baseUrl}/products/${product.handle}`,
          score,
        };
      }
    }
    
    if (bestMatch) {
      console.log(`Best match found: ${bestMatch.url} (score: ${bestMatch.score})`);
      return bestMatch.url;
    }
    
    return null;
  } catch (error) {
    console.error("Error searching Shopify collections:", error);
    return null;
  }
}

// Try to find product using web search via Firecrawl
async function findViaWebSearch(
  vendor: string,
  productTitle: string,
  firecrawlApiKey: string
): Promise<string | null> {
  try {
    // Remove vendor name from product title if already present to avoid duplication
    const vendorPattern = new RegExp(`^${vendor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
    const cleanedTitle = productTitle.replace(vendorPattern, '').trim();
    const searchQuery = `${vendor} ${cleanedTitle} buy`;
    console.log(`Web search query: ${searchQuery}`);
    
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
      }),
    });
    
    if (!response.ok) {
      console.log(`Web search failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const results = data.data || [];
    
    console.log(`Web search returned ${results.length} results`);
    
    // Look for official store URLs
    const brandConfig = BRAND_CONFIGS[vendor];
    const storeHost = brandConfig?.shopifyStore 
      ? new URL(brandConfig.shopifyStore).hostname 
      : null;
    
    for (const result of results) {
      const url = result.url;
      if (!url) continue;
      
      try {
        const urlHost = new URL(url).hostname;
        
        // Prefer official store URLs
        if (storeHost && urlHost.includes(storeHost.replace("www.", ""))) {
          // Check if it's a product page, not a collection
          if (url.includes("/products/") || url.includes("/product/")) {
            console.log(`Found official store product URL: ${url}`);
            return url;
          }
        }
      } catch {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in web search:", error);
    return null;
  }
}

// Validate that a URL returns 200
async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });
    return response.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication and admin role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: isAdmin } = await authClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { filamentId, productTitle, vendor, currentUrl, entityType, entityId, urlField } = await req.json();

    // Support both legacy (filamentId) and new (entityId + entityType) params
    const actualEntityId = entityId || filamentId;
    const actualEntityType = entityType || 'filament';
    const actualUrlField = urlField || 'product_url';

    if (!actualEntityId || !productTitle) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields (entityId, productTitle)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract brand from vendor or from URL
    let brand = vendor || '';
    if (!brand && currentUrl) {
      // Try to detect brand from URL
      if (currentUrl.includes('snapmaker')) brand = 'Snapmaker';
      else if (currentUrl.includes('qidi')) brand = 'QIDI';
      else if (currentUrl.includes('ultimaker')) brand = 'Ultimaker';
      else if (currentUrl.includes('raise3d')) brand = 'Raise3D';
      else if (currentUrl.includes('flashforge')) brand = 'FlashForge';
      else if (currentUrl.includes('flsun')) brand = 'FLSUN';
      else if (currentUrl.includes('elegoo')) brand = 'Elegoo';
      else if (currentUrl.includes('bambulab')) brand = 'Bambu Lab';
      else if (currentUrl.includes('prusa')) brand = 'Prusament';
      else if (currentUrl.includes('colorfabb')) brand = 'ColorFabb';
      else if (currentUrl.includes('matterhackers')) brand = 'MatterHackers';
    }

    console.log(`\n=== Fixing URL for: ${productTitle} (${brand || 'Unknown brand'}) ===`);
    console.log(`Entity type: ${actualEntityType}, Entity ID: ${actualEntityId}`);
    console.log(`Current URL: ${currentUrl}`);

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    let newUrl: string | null = null;

    // Strategy 0: Brand-specific URL transformations (for known URL pattern changes)
    if (!newUrl && currentUrl && brand) {
      console.log("Strategy 0: Trying brand-specific URL transformation...");
      newUrl = fixBrandUrl(brand, currentUrl, productTitle);
      if (newUrl) {
        const isValid = await validateUrl(newUrl);
        if (isValid) {
          console.log(`Brand URL transformation successful: ${newUrl}`);
        } else {
          console.log(`Brand transformed URL failed validation: ${newUrl}`);
          newUrl = null;
        }
      }
    }

    // Strategy 1: Search parent directory of broken URL (most reliable for minor path changes)
    if (!newUrl && currentUrl && firecrawlApiKey) {
      console.log("Strategy 1: Searching parent directory...");
      newUrl = await findInParentDirectory(currentUrl, productTitle, firecrawlApiKey);
      if (newUrl) {
        const isValid = await validateUrl(newUrl);
        if (!isValid) {
          console.log(`Parent directory URL failed validation: ${newUrl}`);
          newUrl = null;
        }
      }
    }

    // Strategy 2: Try Shopify collections if available
    const brandConfig = brand ? BRAND_CONFIGS[brand] : null;
    if (!newUrl && brandConfig?.collectionsUrl && brandConfig?.shopifyStore) {
      console.log("Strategy 2: Searching Shopify collections...");
      newUrl = await findInShopifyCollections(
        brandConfig.collectionsUrl,
        productTitle,
        brandConfig.shopifyStore
      );
      if (newUrl) {
        const isValid = await validateUrl(newUrl);
        if (!isValid) {
          console.log(`Shopify collections URL failed validation: ${newUrl}`);
          newUrl = null;
        }
      }
    }

    // Strategy 3: Try web search via Firecrawl
    if (!newUrl && firecrawlApiKey && brand) {
      console.log("Strategy 3: Web search...");
      newUrl = await findViaWebSearch(brand, productTitle, firecrawlApiKey);
      if (newUrl) {
        const isValid = await validateUrl(newUrl);
        if (!isValid) {
          console.log(`Web search URL failed validation: ${newUrl}`);
          newUrl = null;
        }
      }
    }

    // If we found a valid URL, update the database
    if (newUrl) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Determine which table to update based on entity type
      let updateError = null;
      if (actualEntityType === 'filament') {
        const result = await supabase
          .from("filaments")
          .update({ product_url: newUrl })
          .eq("id", actualEntityId);
        updateError = result.error;
      } else if (actualEntityType === 'printer') {
        // For printers, update the specific URL field
        const updateData: Record<string, string> = {};
        updateData[actualUrlField] = newUrl;
        const result = await supabase
          .from("printers")
          .update(updateData)
          .eq("id", actualEntityId);
        updateError = result.error;
      } else if (actualEntityType === 'accessory') {
        const result = await supabase
          .from("printer_accessories")
          .update({ product_url: newUrl })
          .eq("id", actualEntityId);
        updateError = result.error;
      }

      if (updateError) {
        console.error("Database update error:", updateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Found URL but failed to update database",
            foundUrl: newUrl 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Successfully updated URL to: ${newUrl}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          newUrl,
          message: "URL fixed successfully" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Could not find a replacement URL
    console.log("Could not find a replacement URL");
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Could not find a valid replacement URL",
        searchedStrategies: [
          brandConfig?.collectionsUrl ? "Shopify Collections" : null,
          firecrawlApiKey ? "Web Search" : null,
        ].filter(Boolean)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error fixing URL:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
