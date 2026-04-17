// Updated: 2026-04-17 07:17 UTC
/**
 * BAMBU LAB SYNC FUNCTION
 * 
 * 5-step architecture matching AzureFilm:
 * Step 0: Create sync log entry
 * Step 1: Discover products from collection page (Firecrawl HTML)
 * Step 2: Scrape each product page for H1 title and details
 * Step 3: Safety validation (minimum product threshold)
 * Step 4: Clean slate deletion
 * Step 5: Insert products with enrichment
 * 
 * Source: https://ca.store.bambulab.com/collections/bambu-lab-3d-printer-filament
 * Note: Bambu Lab uses a custom Next.js platform, NOT standard Shopify JSON API
 * 
 * CRITICAL IMAGE REQUIREMENT:
 * - S5 CDN (store.bblcdn.com/s5/): Full product photos (1920px) - MUST USE THESE
 * - S7 CDN (store.bblcdn.com/s7/): Tiny swatch thumbnails (~50px) - DO NOT USE
 * - S5 images are loaded dynamically via JavaScript, not in static HTML
 * - Must use hardcoded S5_PRODUCT_IMAGES mapping for reliable image extraction
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  BAMBULAB_STORE_INFO,
  BAMBULAB_SAFE_DELETE_THRESHOLD,
  isBambuLabNonFilament,
  generateBambuLabProductLineId,
  getBambuLabProductLineConfig,
  enrichBambuLabProduct,
  getBambuLabColorHex,
  isValidColorName,
} from '../_shared/bambulab-defaults.ts';
import { 
  shouldIncludeVariant, 
  extractWeightFromText,
  is285mmDiameter,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';
import { createDecisionLogger } from '../_shared/decision-logger.ts';
import { getColorHex, getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USD pricing (store shows USD prices on collection)
const USD_RATE = 1.0;

// ========== IMAGE TYPE DOCUMENTATION ==========
// Bambu Lab CDN has two image types:
// - S7 CDN (store.bblcdn.com/s7/): Small color swatch thumbnails (~50x50px) used in color picker UI
// - S5 CDN (store.bblcdn.com/s5/): Full product gallery images (1920px) shown when a color is selected
//
// CRITICAL: We must use S5 gallery images, NOT S7 swatch thumbnails!
// S5 URLs have __op__resize parameters for image processing (e.g., __op__resize,m_lfit,w_1920)
//
// PROBLEM: S5 images are loaded dynamically via JavaScript when a color is clicked.
// Firecrawl captures static HTML which only contains S7 swatch URLs.
// SOLUTION: Use hardcoded S5_PRODUCT_IMAGES mapping for each product line and color.

// Standard S5 image URL suffix for quality/format
const S5_PARAMS = '__op__resize,m_lfit,w_1920__op__format,f_auto__op__quality,q_80';

function s5Url(guid: string): string {
  return `https://store.bblcdn.com/s5/default/${guid}.jpg${S5_PARAMS}`;
}

// ========== COMPLETE S5 PRODUCT IMAGES FROM CSV DATA ==========
// Full image and variant mappings imported from Bambu Lab CSV exports.
// S5 images (1920px gallery photos) are loaded via JavaScript and mapped here.
// Updated: 2026-01-06 with ~252 color variants across all product lines.

const S5_PRODUCT_IMAGES: Record<string, Record<string, string>> = {
  
  // ========== PLA BASIC (30 COLORS) ==========
  'pla-basic-filament': {
    'jade white': 'https://store.bblcdn.com/s5/default/7970a11e9efd4d7bbf844311b4d762d0/White.jpg',
    'beige': 'https://store.bblcdn.com/s5/default/75cdc1ae23ff485d8beaee878fe5008d/Beige.jpg',
    'light gray': 'https://store.bblcdn.com/s5/default/dd8fec641daf48aba395f4381854050b.jpg',
    'yellow': 'https://store.bblcdn.com/s5/default/d0058bf2c9514848bd13e01daaf60cf9/Yellow.jpg',
    'sunflower yellow': 'https://store.bblcdn.com/s5/default/cba0bc5670a54a2ca758f650e0cadef3.jpg',
    'gold': 'https://store.bblcdn.com/s5/default/deaa615cc1ea48abbcaf4a9800ea7296/Gold.jpg',
    'pumpkin orange': 'https://store.bblcdn.com/s5/default/02cd259e90ee478a8ad950ebc532a7bb.jpg',
    'orange': 'https://store.bblcdn.com/s5/default/a921a98134db4e77ba4c082586134ff7/Orange.jpg',
    'bright green': 'https://store.bblcdn.com/s5/default/817e47d8902a42ec9614c107eafcd46c.jpg',
    'bambu green': 'https://store.bblcdn.com/s5/default/7bb5c68af8bf4272a9ac1becb5cd477e/Bambu_Green.jpg',
    'mistletoe green': 'https://store.bblcdn.com/s5/default/66f4e06bad1345619420cbb451f4c29e.png',
    'pink': 'https://store.bblcdn.com/s5/default/f77a12ba2c544176ae9efd79c280ca9d/Pink.jpg',
    'hot pink': 'https://store.bblcdn.com/s5/default/66a39723b543411e977ec8401ed6f12a.jpg',
    'magenta': 'https://store.bblcdn.com/s5/default/50d61704a9d64124883c9735354aa14d/Magenta.jpg',
    'red': 'https://store.bblcdn.com/s5/default/a9c13adb72ec42869bbe50948963cafa/Red.jpg',
    'maroon red': 'https://store.bblcdn.com/s5/default/2b000e0f1d89409f8590708c5b7ac9d7.jpg',
    'purple': 'https://store.bblcdn.com/s5/default/a1d67c7010c14c98ab1cedba3b79a55e.jpg',
    'indigo purple': 'https://store.bblcdn.com/s5/default/dba9abb0c0384470ae2ef48fce12ebd3.jpg',
    'turquoise': 'https://store.bblcdn.com/s5/default/d58beab50fb249329ef1b9c4db157d0a.jpg',
    'cyan': 'https://store.bblcdn.com/s5/default/cea66355392d4cec875fb6a281d1b23a.png',
    'cobalt blue': 'https://store.bblcdn.com/s5/default/3a08b41d25264b4c909f5ab4b049b44c.jpg',
    'blue': 'https://store.bblcdn.com/s5/default/549c42fa49304aa5ae018edc70de4245.jpg',
    'brown': 'https://store.bblcdn.com/s5/default/af252a613983445dad5abe80c5677f61.png',
    'cocoa brown': 'https://store.bblcdn.com/s5/default/c1819cba3bc6474bb8b91556931896b0.jpg',
    'bronze': 'https://store.bblcdn.com/s5/default/4dec5d9b46ec434893d984414bea6785/Bronze.jpg',
    'gray': 'https://store.bblcdn.com/s5/default/309b3d9363564c4e9c4616954e701c84.png',
    'silver': 'https://store.bblcdn.com/s5/default/3c765e0b85f343a5acac4bd479df6d8f/Sliver.jpg',
    'blue grey': 'https://store.bblcdn.com/s5/default/73432425bbbd452eab3c1999c76d6cff.png',
    'dark gray': 'https://store.bblcdn.com/s5/default/31b905e783b34a61a449a1bccd0cde2b/pla_basic_dark_gray.jpg',
    'black': 'https://store.bblcdn.com/s5/default/31f2cbb9d9bc473894322fa464ea63d2.png',
  },
  
  // ========== PLA MATTE (25 COLORS) ==========
  'pla-matte': {
    'matte ivory white': 'https://store.bblcdn.com/s5/default/40dfc4b889e34f97b06e2980104c6c52/Matte-Ivory-White-.png',
    'matte bone white': 'https://store.bblcdn.com/s5/default/17f20253468641e09ed65498310e26b2/7.jpg',
    'matte lemon yellow': 'https://store.bblcdn.com/s5/default/0f33185fa699431d935b5b7dfcaa2915/Matte-Lemon-Yellow.png',
    'matte mandarin orange': 'https://store.bblcdn.com/s5/default/2d60cdd7ff1e419ab45fcb5672e88b06/Matte-Mandarin-Orange.png',
    'matte sakura pink': 'https://store.bblcdn.com/s5/default/4a136256e904463e83d6379496bf770d/Matte-Sakura-Pink.png',
    'matte lilac purple': 'https://store.bblcdn.com/s5/default/7421d5d2a4af459f94b925519f9f9f0d/Matte-Lilac-purple.png',
    'matte plum': 'https://store.bblcdn.com/s5/default/0396ee1531694c7199a973e19ad12a21/6.jpg',
    'matte scarlet red': 'https://store.bblcdn.com/s5/default/b7693e3cc1d34ad4aa381913334ecd2d/Matte-Scarlet-Red.png',
    'matte dark red': 'https://store.bblcdn.com/s5/default/32dd07d0d63a4781b1f757cb10b4c54f/Matte-Dark-Red.png',
    'matte apple green': 'https://store.bblcdn.com/s5/default/5d7a744633fe4f61a133a86030dee9a3/2.jpg',
    'matte grass green': 'https://store.bblcdn.com/s5/default/466a72ae34194f7f91a267770311e78a/Matte-Grass-Green.png',
    'matte dark green': 'https://store.bblcdn.com/s5/default/153bb3ac156f44729df5b9b5c4d200de/Matte-Dark-Green.png',
    'matte ice blue': 'https://store.bblcdn.com/s5/default/6681ea227f9840dc9e4b683df4aa2948/Matte-Ice-Blue.png',
    'matte sky blue': 'https://store.bblcdn.com/s5/default/da2acfb4820042d99bf05b96b1832312/4.jpg',
    'matte marine blue': 'https://store.bblcdn.com/s5/default/61cc94fa86d743bfb20f329fdd2bbd24/Matte-Marine-Blue.png',
    'matte dark blue': 'https://store.bblcdn.com/s5/default/5b6c58d0094c456c9d81ff28908dc4ea/Matte-Dark-Blue.png',
    'matte desert tan': 'https://store.bblcdn.com/s5/default/27e1b0a7d0f44aa0b741ef2b379272ed/Matte-Desert-Tan.png',
    'matte latte brown': 'https://store.bblcdn.com/s5/default/a91809bf094d446981d81f685543a4b8/Matte-Latte-Brown.png',
    'matte caramel': 'https://store.bblcdn.com/s5/default/23575c1bb53f4eb08a499ec1d5bbddda/8.jpg',
    'matte terracotta': 'https://store.bblcdn.com/s5/default/9c5bc08717724172bcc6c9b6f5730559/5.jpg',
    'matte dark brown': 'https://store.bblcdn.com/s5/default/be277b5f414d4dfab7db1080684ddfb5/Matte-Dark-Brown.png',
    'matte dark chocolate': 'https://store.bblcdn.com/s5/default/937243c9769645efa11c1e0c539ebf3d/3.jpg',
    'matte ash gray': 'https://store.bblcdn.com/s5/default/179b30bca747418f9a013cb0a8a17bbc/Matte-Ash-Grey.png',
    'matte nardo gray': 'https://store.bblcdn.com/s5/default/5dd5c23fefdf4dbda7b6dd51dcd1e375/1.jpg',
    'matte charcoal': 'https://store.bblcdn.com/s5/default/a1b596fe17af44feb9b6af51c3b6985d.png',
  },
  
  // ========== PLA SILK+ (14 COLORS) ==========
  'pla-silk-upgrade': {
    'gold': 'https://store.bblcdn.com/s5/default/46aa65c617a8471da4a01cd51f2478ff.jpg',
    'titan gray': 'https://store.bblcdn.com/s5/default/46aa65c617a8471da4a01cd51f2478ff.jpg',
    'silver': 'https://store.bblcdn.com/s5/default/46aa65c617a8471da4a01cd51f2478ff.jpg',
    'white': 'https://store.bblcdn.com/s5/default/46aa65c617a8471da4a01cd51f2478ff.jpg',
    'candy red': 'https://store.bblcdn.com/s5/default/d2008538df9e401e9644bfbfdf1179ac.jpg',
    'candy green': 'https://store.bblcdn.com/s5/default/1865fd2939f745ecb89e2bf1a6e22ef7.jpg',
    'mint': 'https://store.bblcdn.com/s5/default/6d7357a7390f4873b2d12157ee9ddd09.jpg',
    'blue': 'https://store.bblcdn.com/s5/default/d08a4e3e041540cf9589c141a8e79a57.jpg',
    'baby blue': 'https://store.bblcdn.com/s5/default/66beef322ddf42899a5f77f214b044d5.jpg',
    'purple': 'https://store.bblcdn.com/s5/default/7a6ee2f6ea6a4b0193f123ab3a751898.jpg',
    'rose gold': 'https://store.bblcdn.com/s5/default/7e807e841fe144a993b4bd5947d56d8b.jpg',
    'pink': 'https://store.bblcdn.com/s5/default/65f72225705a4475aae0f8ba03625a1d.jpg',
    'champagne': 'https://store.bblcdn.com/s5/default/ce958f3221c342e991a84630752e1c1d.jpg',
  },
  
  // ========== PLA TRANSLUCENT (10 COLORS) ==========
  'pla-translucent': {
    'teal': 'https://store.bblcdn.com/s5/default/de999706468b4dc789eaa824a1620d41/teal.jpg',
    'blue': 'https://store.bblcdn.com/s5/default/0b2e1841d10641febaabd76ca2a49f05/blue.jpg',
    'purple': 'https://store.bblcdn.com/s5/default/caef5b3b1d944237bb2a560d5a3755aa/purple.jpg',
    'orange': 'https://store.bblcdn.com/s5/default/4dd0599950a144148ddb845464fdc523/orange.jpg',
    'red': 'https://store.bblcdn.com/s5/default/b97af19b96de46808b70617ef07f1661/red.jpg',
    'light jade': 'https://store.bblcdn.com/s5/default/bd6e1981756d4390ba3170934f39dd54/Jade_green.jpg',
    'mellow yellow': 'https://store.bblcdn.com/s5/default/8873b26c250842ef95f31ec753706a1b/mellow_yellow.jpg',
    'cherry pink': 'https://store.bblcdn.com/s5/default/58122afc27cd4f138b3b2155f477c033/pink.jpg',
    'ice blue': 'https://store.bblcdn.com/s5/default/c7a17dc886ba43ee99f8e23b9edf67cd/light_blue.jpg',
    'lavender': 'https://store.bblcdn.com/s5/default/3a9edfa64b0a4a3cb1a1c88d71fbf238/lavender.jpg',
  },
  
  // ========== PLA TOUGH+ (7 COLORS) ==========
  'pla-tough-upgrade': {
    'yellow': 'https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(3).jpg',
    'white': 'https://store.bblcdn.com/s5/default/495f8100d89748a0bd78a3edd1571363/PLA_Tough_new.jpg',
    'orange': 'https://store.bblcdn.com/s5/default/6284216b491247c687bbe0ad54438faa/PLA_Tough_(5).jpg',
    'gray': 'https://store.bblcdn.com/s5/default/fbcf9bab4663410d95709ceb729d4832/PLA_Tough_(1).jpg',
    'silver': 'https://store.bblcdn.com/s5/default/020e0eb613d64bb794cfdea8d8b5f8b3/PLA_Tough_(2).jpg',
    'cyan': 'https://store.bblcdn.com/s5/default/5cd2ccae43f2455b93e7df8587236d98/PLA_Tough_(4).jpg',
    'black': 'https://store.bblcdn.com/s5/default/50ca04c59cc0464e8af86ed8293cf2ab/PLA_Tough_(2).jpg',
  },
  
  // ========== PLA BASIC GRADIENT (8 COLORS) ==========
  'pla-basic-gradient': {
    'ocean to meadow': 'https://store.bblcdn.com/s5/default/878d72da5fee4e3296223db1ff2fa4e1.png',
    'solar breeze': 'https://store.bblcdn.com/s5/default/64ab0bb38a4a41e48c79d3b60463e8b5.png',
    'arctic whisper': 'https://store.bblcdn.com/s5/default/140159e159274822b3299cf9cf7bfe1c.png',
    'pink citrus': 'https://store.bblcdn.com/s5/default/8444baddd48343b986c22239d571a22a/pink_gradient.jpg',
    'mint lime': 'https://store.bblcdn.com/s5/default/8c10cd9963b1430591cec5e49d32a042/gradient_green.jpg',
    'dusk glare': 'https://store.bblcdn.com/s5/default/ca4bd4a34b4c46a4860bd6dd75b29f31/sunset_orange.jpg',
    'blueberry bubblegum': 'https://store.bblcdn.com/s5/default/8d9986037d04400098975045192b1034/bluebuble.jpg',
    'cotton candy cloud': 'https://store.bblcdn.com/s5/default/79a2bacb10694741afcb424a3ca4ca3c/pink_blue.jpg',
  },
  
  // ========== PLA WOOD (6 COLORS) ==========
  'pla-wood': {
    'black walnut': 'https://store.bblcdn.com/s5/default/a651dc64a2e14f1c8e85d6149bc7bdb3/4.jpg',
    'rosewood': 'https://store.bblcdn.com/s5/default/6dc2ca14c2624f1bb182986aa6375687.jpg',
    'clay brown': 'https://store.bblcdn.com/s5/default/1375e942e3d04f87a542c520368badff.jpg',
    'classic birch': 'https://store.bblcdn.com/s5/default/864fe622e7974d069131b6629eda7e62.jpg',
    'white oak': 'https://store.bblcdn.com/s5/default/cd1e7de8960046d0a67173cb37407b4e.jpg',
    'ochre yellow': 'https://store.bblcdn.com/s5/default/32535a441fc84096a39671ef7f6eb851.jpg',
  },
  
  // ========== PLA MARBLE (2 COLORS) ==========
  'pla-marble': {
    'red granite': 'https://store.bblcdn.com/s5/default/79b1d2427e4047649c730f2605f45354.jpg',
    'white marble': 'https://store.bblcdn.com/s5/default/ca48e1d56ed042b7920cba9912fe5977.png',
  },
  
  // ========== PLA METAL (5 COLORS) ==========
  'pla-metal': {
    'cobalt blue metallic': 'https://store.bblcdn.com/s5/default/9887878fdd43434489672eac577a07f3.png',
    'oxide green metallic': 'https://store.bblcdn.com/s5/default/14d829a49ad443e59bddde42c8f6563c.png',
    'iridium gold metallic': 'https://store.bblcdn.com/s5/default/a75ba62b433f4e80b419963e05ae0559.png',
    'copper brown metallic': 'https://store.bblcdn.com/s5/default/168313f3cb3542a0984a00379835a607.png',
    'iron gray metallic': 'https://store.bblcdn.com/s5/default/1fdb0b2166d3450ea180a6c83d4acbc6.png',
  },
  
  // ========== PLA SILK MULTI-COLOR (10 COLORS) ==========
  'pla-silk-multi-color': {
    'dawn radiance': 'https://store.bblcdn.com/s5/default/48bb4b91869a4835b05317e88ebae109/Dawn_Radiance.jpg',
    'aurora purple': 'https://store.bblcdn.com/s5/default/43b23563e3aa47fd89b26b74e2add471/Aurora_Purple_(1).jpg',
    'south beach': 'https://store.bblcdn.com/s5/default/f1858c209fc947058c5062c720821f86/South_Beach.jpg',
    'phantom blue': 'https://store.bblcdn.com/s5/default/722ffc6e2d6d4df58e3ce07394d17883/Phantom_Blue.jpg',
    'mystic magenta': 'https://store.bblcdn.com/s5/default/d21fe6ca88104f9e9ff326a54a9defc7/Mystic_Magenta.jpg',
    'velvet eclipse': 'https://store.bblcdn.com/s5/default/1a4e746a1e2b4ac290422b59df762e5f/Silk_Dual_Color_Black-red.jpg',
    'neon city': 'https://store.bblcdn.com/s5/default/ed18d828ff054d8faca76bb37f0d6ba3.png',
    'midnight blaze': 'https://store.bblcdn.com/s5/default/9e1569bbc0c24d188278222724abc277.png',
    'gilded rose': 'https://store.bblcdn.com/s5/default/3fb0e2cef1d9482fa4156720ea7e87a2.png',
    'blue hawaii': 'https://store.bblcdn.com/s5/default/f214dc0e30274035bf68151d284eafc6.png',
  },
  
  // ========== PLA GALAXY (4 COLORS) ==========
  'pla-galaxy': {
    'purple': 'https://store.bblcdn.com/s5/default/6b3d4f9560514b32baf0a5520fcaba03.jpg',
    'green': 'https://store.bblcdn.com/s5/default/c07ade42987e4d12b8d662e9ac7ca2e8.jpg',
    'nebulae': 'https://store.bblcdn.com/s5/default/b9a8183bc6fe466d8237c68c2cd38a04.jpg',
    'brown': 'https://store.bblcdn.com/s5/default/37f0e6e45d3d4f81991230198009dfd1.jpg',
  },
  
  // ========== PLA GLOW (5 COLORS) ==========
  'pla-glow': {
    'glow green': 'https://store.bblcdn.com/s5/default/565869eeaeea4c709e2c5bc999af0a7e.png',
    'glow pink': 'https://store.bblcdn.com/s5/default/fd8da84c11f644aebb543fbf808e4781.png',
    'glow blue': 'https://store.bblcdn.com/s5/default/471fa997fa0543c1b0dffb1ffe0f0918.png',
    'glow orange': 'https://store.bblcdn.com/s5/default/24e492c5a648473d90afeccb6123dd81.png',
    'glow yellow': 'https://store.bblcdn.com/s5/default/dd226454d6204bdc85ae0454d80136a9.png',
  },
  
  // ========== PLA SPARKLE (6 COLORS) ==========
  'pla-sparkle': {
    'alpine green sparkle': 'https://store.bblcdn.com/s5/default/8806b580276b46909df6385cff766b82.png',
    'royal purple sparkle': 'https://store.bblcdn.com/s5/default/c2afb75286da4c9f9c299e24f0672984.png',
    'slate gray sparkle': 'https://store.bblcdn.com/s5/default/c088bfa5936b4a35a3a421b9103c3631.png',
    'crimson red sparkle': 'https://store.bblcdn.com/s5/default/faf72eb685014a1b94f4048c2388fe0a.png',
    'onyx black sparkle': 'https://store.bblcdn.com/s5/default/ab419f89d31f4d9d956bc9d460abf2e0.png',
    'classic gold sparkle': 'https://store.bblcdn.com/s5/default/45ba44449cfe40498a990f840858ae33.png',
  },
  
  // ========== PLA-CF (7 COLORS) ==========
  'pla-cf': {
    'burgundy red': 'https://store.bblcdn.com/s5/default/15b97e3be198436e8ba8f7c7bf6ec910.png',
    'jeans blue': 'https://store.bblcdn.com/s5/default/5f2ba769905f4acb9670e708ed025839.png',
    'black': 'https://store.bblcdn.com/s5/default/d2e469d4f653454c810ac76aca6c4cf6.jpg',
    'matcha green': 'https://store.bblcdn.com/s5/default/1fe4624c3f0a4149a2aaf60ca3642554.png',
    'royal blue': 'https://store.bblcdn.com/s5/default/d279be5472374d4b89a9cbe04be1f397/20250710-180051.jpg',
    'iris purple': 'https://store.bblcdn.com/s5/default/3473d73b325f40c484cee7dd573f6734.png',
    'lava gray': 'https://store.bblcdn.com/s5/default/5b745a9c346e4205842ef99960dec7b2.png',
  },
  
  // ========== PLA AERO (3 COLORS) ==========
  'pla-aero': {
    'white': 'https://store.bblcdn.com/s5/default/3b112ca34ea34dc5a11d7ca0725dcac0.png',
    'black': 'https://store.bblcdn.com/s5/default/e80bdfdf32f34e4094d001a055595efa.png',
    'gray': 'https://store.bblcdn.com/s5/default/6407f12c15cf4debb06de690378be64d.png',
  },
  
  // ========== ABS (12 COLORS) ==========
  'abs-filament': {
    'black': 'https://store.bblcdn.com/s5/default/ef66b79717594fd7a32316968fbf7ac4.png',
    'silver': 'https://store.bblcdn.com/s5/default/9cae91f6f14d4672bad03466e8fc0905.png',
    'white': 'https://store.bblcdn.com/s5/default/dcc84bbb1ebb4feab8e7fa3c6776d603.png',
    'bambu green': 'https://store.bblcdn.com/s5/default/ac47548b54224e6297d49459802405a7.png',
    'olive': 'https://store.bblcdn.com/s5/default/a0d6c3c3f0ce4d94a1b50c3a0c746760.jpg',
    'azure': 'https://store.bblcdn.com/s5/default/24c01cdd00994022b35a676e2241c943.jpg',
    'blue': 'https://store.bblcdn.com/s5/default/ca8b7ba4f03243d1af97c06ec01d5100.png',
    'navy blue': 'https://store.bblcdn.com/s5/default/ffe1ffc6768f49cf958439e67f98409b.jpg',
    'tangerine yellow': 'https://store.bblcdn.com/s5/default/a8fce7027f1f4ba2b9aff377ed99a5bf.jpg',
    'orange': 'https://store.bblcdn.com/s5/default/af10bba0ddcb4d129125f0b1b3f04e59.png',
    'red': 'https://store.bblcdn.com/s5/default/a612a441405449059b5e9215e9b4845d.png',
    'purple': 'https://store.bblcdn.com/s5/default/b0e5f8c3a4d94b8e9f2a1c7d6e8b9a0c.jpg',
  },
  
  // ========== ASA (6 COLORS) ==========
  'asa-filament': {
    'white': 'https://store.bblcdn.com/s5/default/28d11722c1a1469cb1a51f43ddb41eec.png',
    'green': 'https://store.bblcdn.com/s5/default/8a16887420444668817786f11d2fbd52.png',
    'gray': 'https://store.bblcdn.com/s5/default/f46c0c69f82f4e879b2ee646407a27d1.png',
    'red': 'https://store.bblcdn.com/s5/default/9b4054cc41a34801be8ec4a8e7602edc.png',
    'blue': 'https://store.bblcdn.com/s5/default/a97e97298dd0402cbed9a33bcc29b397.jpg',
    'black': 'https://store.bblcdn.com/s5/default/578073ead4ac45f3aededbecd91cc46e.png',
  },
  
  // ========== ASA AERO (1 COLOR) ==========
  'asa-aero': {
    'white': 'https://store.bblcdn.com/s5/default/807083f9279e4ef68649dcbb243eddad.png',
  },
  
  // ========== ABS-GF (8 COLORS) ==========
  'abs-gf': {
    'orange': 'https://store.bblcdn.com/s5/default/3091595109624a5da5d5aac0f4ffc716.png',
    'green': 'https://store.bblcdn.com/s5/default/61deac40ee24437fad189458a3295569.png',
    'red': 'https://store.bblcdn.com/s5/default/cdabf4b8ab65424798c99ac4b007245c.png',
    'yellow': 'https://store.bblcdn.com/s5/default/5fab889759e040d6ba560e788d7531c5.png',
    'blue': 'https://store.bblcdn.com/s5/default/59e0677eca7649aeae8cbc1fb6791c47.png',
    'white': 'https://store.bblcdn.com/s5/default/60c69eb3f4664444ad13f1816c7c74da.png',
    'gray': 'https://store.bblcdn.com/s5/default/2ec79ec301114b26a13811f7a1d54208.png',
    'black': 'https://store.bblcdn.com/s5/default/2408b10ddd994f69982c8506e1d730a8.png',
  },
  
  // ========== ASA-CF (1 COLOR) ==========
  'asa-cf': {
    'black': 'https://store.bblcdn.com/s5/default/390a51b2d4834c34930bc3781a0ed13d.jpg',
  },
  
  // ========== PETG HF (14 COLORS) ==========
  'petg-hf': {
    'red': 'https://store.bblcdn.com/s5/default/7de1911f91d34be280040a4ef84fdbd2.jpg',
    'black': 'https://store.bblcdn.com/s5/default/6583fc4c677b47c78a79b5af54707241.jpg',
    'lake blue': 'https://store.bblcdn.com/s5/default/88d2cf2480094d6cbbba24a6751eb943.jpg',
    'blue': 'https://store.bblcdn.com/s5/default/729f2d6de88b4001938dcf49c97c2d8c.jpg',
    'white': 'https://store.bblcdn.com/s5/default/6f0f3ffb6bdb459f97d0f44a6d83fbf6.jpg',
    'gray': 'https://store.bblcdn.com/s5/default/22729c93daef4e0293f50584690457d0.jpg',
    'dark gray': 'https://store.bblcdn.com/s5/default/d96a3ffe711444f0a4d4b734f1519537.jpg',
    'cream': 'https://store.bblcdn.com/s5/default/132b2c639d284831ad3a65a5a2450ab3.jpg',
    'yellow': 'https://store.bblcdn.com/s5/default/695dad0142ca4d0c8ca64cd2cf5eaa6f.jpg',
    'lime green': 'https://store.bblcdn.com/s5/default/3eeb673909be49ae8cb99bd18f365614.jpg',
    'green': 'https://store.bblcdn.com/s5/default/9bd37be5d1b24bfb940af905904e7145.jpg',
    'forest green': 'https://store.bblcdn.com/s5/default/327777e6ed004cb0820532eb7e263a2d.jpg',
    'orange': 'https://store.bblcdn.com/s5/default/048a5c2661644b849a6a955ccde1a877.jpg',
    'peanut brown': 'https://store.bblcdn.com/s5/default/a27c74b9bf7741b581ac70bfcb5e82f9.jpg',
  },
  
  // ========== PETG TRANSLUCENT (9 COLORS) ==========
  'petg-translucent': {
    'translucent light blue': 'https://store.bblcdn.com/s5/default/2e8d7b9c2a4147da979f544f73f85fb5.jpg',
    'translucent teal': 'https://store.bblcdn.com/s5/default/2e8d7b9c2a4147da979f544f73f85fb5.jpg',
    'clear': 'https://store.bblcdn.com/s5/default/2e8d7b9c2a4147da979f544f73f85fb5.jpg',
    'translucent gray': 'https://store.bblcdn.com/s5/default/18fb283d551c418f9246a22beec492ce.jpg',
    'translucent olive': 'https://store.bblcdn.com/s5/default/8534fe998fa145aeb6599bf16827cf58.jpg',
    'translucent brown': 'https://store.bblcdn.com/s5/default/2c6abde5b9bd4184a9a1ecf31be06500.jpg',
    'translucent orange': 'https://store.bblcdn.com/s5/default/6415b5d6fb1a473490a0eb605d9d59b0.jpg',
    'translucent pink': 'https://store.bblcdn.com/s5/default/3c06d1d78c3c40239fc582a8bd5a5261.jpg',
    'translucent purple': 'https://store.bblcdn.com/s5/default/d437c0bf73fa4bbdadf3b3a8f139e8b0.jpg',
  },
  
  // ========== PETG-CF (6 COLORS) ==========
  'petg-cf': {
    'indigo blue': 'https://store.bblcdn.com/s5/default/dd18987197f54eaca8cd318713c76786.png',
    'brick red': 'https://store.bblcdn.com/s5/default/66bb180e5ad84cb3ad3ebad78c293c7d.png',
    'malachite green': 'https://store.bblcdn.com/s5/default/cefecfa081164b9fb8092bcfa088acfc.png',
    'violet purple': 'https://store.bblcdn.com/s5/default/d4702770b8b24ea796481285ab816c62.png',
    'black': 'https://store.bblcdn.com/s5/default/093c156eacd8427d81bdceae6f9e07cc.png',
    'titan gray': 'https://store.bblcdn.com/s5/default/b385924c792c421f87f277db246f70e8.png',
  },
  
  // ========== PA/PET CARBON FIBER MATERIALS ==========
  'paht-cf': {
    'black': 'https://store.bblcdn.com/s5/default/da8ee1568bb047c8ba323aba59c84bc0.png',
  },
  'pa6-cf': {
    'black': 'https://store.bblcdn.com/s5/default/3f8b8df4ab4f465db6d9b708ef8ecf1d.png',
  },
  'ppa-cf': {
    'black': 'https://store.bblcdn.com/s5/default/3c2707912a164dbf8d26a1d3b62f0cbc.jpg',
  },
  'pet-cf': {
    'black': 'https://store.bblcdn.com/s5/default/9afaf33071dc472e8fa3dfcb1d180207.png',
  },
  
  // ========== PA6-GF (8 COLORS) ==========
  'pa6-gf': {
    'blue': 'https://store.bblcdn.com/s5/default/7251e7b0c57849d6a884668235e2c755.jpg',
    'orange': 'https://store.bblcdn.com/s5/default/943e919667e4432b83ba53c4e3131732.jpg',
    'yellow': 'https://store.bblcdn.com/s5/default/5cdd66fb3220432fbe7afb3c5cb118d3.jpg',
    'lime': 'https://store.bblcdn.com/s5/default/a45ca49d1266499c8b271006e9a0a319.jpg',
    'brown': 'https://store.bblcdn.com/s5/default/b0d043d7e72849f193f1bfbac25ca32e.jpg',
    'white': 'https://store.bblcdn.com/s5/default/b831c50b9af24d0fbfc861440bf2fd11.jpg',
    'gray': 'https://store.bblcdn.com/s5/default/9be99001191043b5a72da2e47ad25b51.jpg',
    'black': 'https://store.bblcdn.com/s5/default/c0ccfcf3506f4422bb447011137b06ea.jpg',
  },
  
  // ========== PC (4 COLORS) ==========
  'pc-filament': {
    'transparent': 'https://store.bblcdn.com/s5/default/6bfeaa5bb9b448d4ba5209f855a1fd45.png',
    'clear black': 'https://store.bblcdn.com/s5/default/3139f2baabf844be82cb72ef4f3615f0.png',
    'black': 'https://store.bblcdn.com/s5/default/1c2f810f750a4a4cb95556c857a12a14.png',
    'white': 'https://store.bblcdn.com/s5/default/0ba5c1ca13d3436db5bc30e1e96b27f2.jpg',
  },
  
  // ========== PC FR (3 COLORS) ==========
  'pc-fr': {
    'black': 'https://store.bblcdn.com/s5/default/22fe535b9d3a49009285c46cff19e8ce/PC-FR.jpg',
    'white': 'https://store.bblcdn.com/s5/default/8ba623955ace4030a2c9fbb9546f9664.jpg',
    'gray': 'https://store.bblcdn.com/s5/default/e4a38f08a41147508f16d7bb0960c0cc.jpg',
  },
  
  // ========== PPS-CF (1 COLOR) ==========
  'pps-cf': {
    'black': 'https://store.bblcdn.com/s5/default/a6da81c992134feebb407601ce257cb6.png',
  },
  
  // ========== SUPPORT MATERIALS ==========
  'pva': {
    'clear': 'https://store.bblcdn.com/s5/default/9e8efe4a411a461eb30248adf214376e.jpg',
  },
  'support-for-pla-petg': {
    'nature': 'https://store.bblcdn.com/s5/default/df26d3f606fc46d4bcef831a68970a62.jpg',
    'black': 'https://store.bblcdn.com/s5/default/44c2b363bdc041d6914a06e8e1b6074f.png',
  },
  'support-for-pla-new': {
    'white': 'https://store.bblcdn.com/s5/default/96eb9ffa49c642bfb10e53f894c371ce/Support_3.png',
  },
  'support-for-pa-pet': {
    'green': 'https://store.bblcdn.com/s5/default/0b3988046cff450d9709fc02db46ae9a.png',
  },
  'support-for-abs': {
    'white': 'https://store.bblcdn.com/s5/default/de2c87dc362a4fbba85e893ef033f64e.png',
  },
  
  // ========== TPU 85A (2 COLORS) ==========
  'tpu-85a-tpu-90a': {
    // Colors scraped from this page go to either 85a or 90a based on TPU_HARDNESS_MAP
    'frozen': 'https://store.bblcdn.com/s5/default/65d73fc03c7c4ef5a5f82ecda434d172/TPU_90_Frozen.jpg',
    'blaze': 'https://store.bblcdn.com/s5/default/a09b4a9822744b92ab48369ef33bd7fd/TPU_90_Blaze.jpg',
    'white': 'https://store.bblcdn.com/s5/default/4ac3c59e99f94ddd829c3e985babf67b/TPU_90_White.jpg',
    'black': 'https://store.bblcdn.com/s5/default/ec10a06daac54460815acbfcfcfcf855/TPU_90_BK.png',
    'grape jelly': 'https://store.bblcdn.com/s5/default/3c6c9faf544b4215957e0f98cc6d0893/grape_jelly.jpg',
    'crystal blue': 'https://store.bblcdn.com/s5/default/04c5c9bc12e1487e8ec46933366c05f6/Crystal_Blue.jpg',
    'cocoa brown': 'https://store.bblcdn.com/s5/default/81d60d015e7244efac0dac1ebc305791/Cocoa_Brown.jpg',
    'neon orange': 'https://store.bblcdn.com/s5/default/216263b0e121477aae18fabdfcee5c1e/TPU_85_Orange.jpg',
    'light cyan': 'https://store.bblcdn.com/s5/default/75540b9c97814cdabfa1b7c3f5c83987/TPU_85_Cyan.jpg',
    'flesh': 'https://store.bblcdn.com/s5/default/52a8b71537484b7699b1fc382f11b86c/flesh.jpg',
    'lime green': 'https://store.bblcdn.com/s5/default/bd0a1f7267764201bd791898682ee269/lime_green_(2).jpg',
  },
  
  // ========== TPU 95A HF (6 COLORS) ==========
  'tpu-95a-hf': {
    'white': 'https://store.bblcdn.com/s5/default/813162934f57427b9f20297951ad8f56.png',
    'black': 'https://store.bblcdn.com/s5/default/5d33093564274d6db3d593a6593dc793.png',
    'gray': 'https://store.bblcdn.com/s5/default/7ed342a8a4d6461fbdb7ef006bb70334.png',
    'yellow': 'https://store.bblcdn.com/s5/default/17328c906d3242ff9c64c2565deabbdd.png',
    'blue': 'https://store.bblcdn.com/s5/default/08947e6f9164421491100cf7518c6596.png',
    'red': 'https://store.bblcdn.com/s5/default/7ce0823b9e214525bd98a6e19b7cf786.png',
  },
  
  // ========== TPU FOR AMS (7 COLORS) ==========
  'tpu-for-ams': {
    'blue': 'https://store.bblcdn.com/s5/default/d4fb1dd751904e1ea09d142c68d7ec36.jpg',
    'gray': 'https://store.bblcdn.com/s5/default/f5462676e1b7452db52b095a08421c65.jpg',
    'black': 'https://store.bblcdn.com/s5/default/f0d51ead90a849b69aff4c607379d8ed.jpg',
    'yellow': 'https://store.bblcdn.com/s5/default/44f427a876f244cfa6fa9379cecb9b92.jpg',
    'red': 'https://store.bblcdn.com/s5/default/a71f20c06c6941359cc1f8cb008b8474.jpg',
    'neon green': 'https://store.bblcdn.com/s5/default/e5506620dbeb4aa7b9e1c81c08d20d64.jpg',
    'white': 'https://store.bblcdn.com/s5/default/2f9b5bd40c774fc0bc6e48885acd7e30.jpg',
  },
};

// ========== VARIANT ID MAPPING FOR BUY NOW URLS ==========
// Maps product slug -> color name -> variant ID for ?id= URL parameter
// Extracted from CSV data - enables direct "Buy Now" links to specific color variants
const BAMBULAB_VARIANT_IDS: Record<string, Record<string, string>> = {
  // ========== PLA BASIC ==========
  'pla-basic-filament': {
    'jade white': '43115681841392',
    'beige': '43115681972464',
    'light gray': '46498490810608',
    'yellow': '43115682038000',
    'sunflower yellow': '46741144043760',
    'gold': '45421234356464',
    'pumpkin orange': '46741154332912',
    'orange': '43115681874160',
    'bright green': '46741147582704',
    'bambu green': '45421183172848',
    'mistletoe green': '45421189890288',
    'pink': '43115682103536',
    'hot pink': '46741151580400',
    'magenta': '45421069598960',
    'red': '43115682201840',
    'maroon red': '46741142012144',
    'purple': '45421228327152',
    'indigo purple': '46741145813232',
    'turquoise': '46741145321712',
    'cyan': '45421220069616',
    'cobalt blue': '46741152792816',
    'blue': '43115681906928',
    'brown': '43115682169072',
    'cocoa brown': '46741149778160',
    'bronze': '45421242122480',
    'gray': '43115681939696',
    'silver': '43115682005232',
    'blue grey': '43115682070768',
    'dark gray': '46498490843376',
    'black': '43766892298480',
  },
  // ========== PLA MATTE ==========
  'pla-matte': {
    'matte lemon yellow': '43135539970288',
    'matte mandarin orange': '43135539904752',
    'matte sakura pink': '43135539937520',
    'matte lilac purple': '43135540166896',
    'matte plum': '563882858931896335',
    'matte scarlet red': '43135540101360',
    'matte dark red': '45421267878128',
    'matte apple green': '563882858931896347',
    'matte grass green': '43135540035824',
    'matte dark green': '45421272989936',
    'matte ice blue': '43135540134128',
    'matte sky blue': '563882858931896341',
    'matte marine blue': '43135540199664',
    'matte dark blue': '45421360218352',
    'matte desert tan': '45869359038704',
    'matte latte brown': '43135540068592',
    'matte caramel': '563882858931896359',
    'matte terracotta': '563882858931896365',
    'matte dark brown': '45421259915504',
    'matte dark chocolate': '563882858931896353',
    'matte ash gray': '43135539871984',
    'matte nardo gray': '563882858931896371',
    'matte charcoal': '43135540003056',
    'matte ivory white': '43197757661424',
    'matte bone white': '46334124245232',
  },
  // ========== PLA SILK+ ==========
  'pla-silk-upgrade': {
    'candy green': '542547831280767018',
    'mint': '542547831280767048',
    'blue': '542547831280767024',
    'baby blue': '542547831280767042',
    'purple': '542547831280767030',
    'rose gold': '542547831280767036',
    'pink': '542547831280767054',
    'champagne': '542547831280767060',
    'gold': '46334133027056',
    'titan gray': '46334134927600',
    'silver': '46334136008944',
    'white': '46334134010096',
    'candy red': '46334130188528',
  },
  // ========== PLA TRANSLUCENT ==========
  'pla-translucent': {
    'teal': '594048155633315855',
    'blue': '594048155633315861',
    'purple': '594048155633315867',
    'orange': '594048155633315873',
    'red': '594048155633315879',
    'light jade': '594048155633315885',
    'mellow yellow': '594048155633315891',
    'cherry pink': '594048155633315897',
    'ice blue': '594048155633315903',
    'lavender': '594048155633315909',
  },
  // ========== PLA TOUGH+ ==========
  'pla-tough-upgrade': {
    'yellow': '624467991622688774',
    'white': '624467991622688768',
    'orange': '624467991622688780',
    'gray': '624467991622688786',
    'silver': '624467991622688792',
    'cyan': '624467991622688798',
    'black': '624467991622688804',
  },
  // ========== PLA BASIC GRADIENT ==========
  'pla-basic-gradient': {
    'ocean to meadow': '44159419875568',
    'solar breeze': '44159419842800',
    'arctic whisper': '44159419810032',
    'pink citrus': '545401327678750737',
    'mint lime': '545401327678750743',
    'dusk glare': '548991610414206978',
    'blueberry bubblegum': '545401327678750725',
    'cotton candy cloud': '545401327678750731',
  },
  // ========== PLA WOOD ==========
  'pla-wood': {
    'black walnut': '46788372824304',
    'rosewood': '46788372857072',
    'clay brown': '46788372889840',
    'classic birch': '46788372922608',
    'white oak': '46788372955376',
    'ochre yellow': '46788372988144',
  },
  // ========== PLA MARBLE ==========
  'pla-marble': {
    'red granite': '44106844307696',
    'white marble': '43867392868592',
  },
  // ========== PLA METAL ==========
  'pla-metal': {
    'cobalt blue metallic': '43809123205360',
    'oxide green metallic': '43809123172592',
    'iridium gold metallic': '44106847617264',
    'copper brown metallic': '43809123238128',
    'iron gray metallic': '44106847584496',
  },
  // ========== PLA SILK MULTI-COLOR ==========
  'pla-silk-multi-color': {
    'dawn radiance': '601307620515315716',
    'aurora purple': '601307620515315722',
    'south beach': '601307620515315728',
    'phantom blue': '665320242336288777',
    'mystic magenta': '665320242336288771',
    'velvet eclipse': '46816416792816',
    'neon city': '44852088242416',
    'midnight blaze': '44852088209648',
    'gilded rose': '44852088176880',
    'blue hawaii': '44852088275184',
  },
  // ========== PLA GALAXY ==========
  'pla-galaxy': {
    'purple': '45164872958192',
    'green': '45164872892656',
    'nebulae': '45164872925424',
    'brown': '45164872859888',
  },
  // ========== PLA GLOW ==========
  'pla-glow': {
    'glow green': '44604961226992',
    'glow pink': '44604961259760',
    'glow blue': '44604961194224',
    'glow orange': '44604961161456',
    'glow yellow': '44604961292528',
  },
  // ========== PLA SPARKLE ==========
  'pla-sparkle': {
    'alpine green sparkle': '43809130086640',
    'royal purple sparkle': '44106863968496',
    'slate gray sparkle': '44106863935728',
    'crimson red sparkle': '43809130119408',
    'onyx black sparkle': '43809130152176',
    'classic gold sparkle': '46130440372464',
  },
  // ========== PLA-CF ==========
  'pla-cf': {
    'jeans blue': '44083777569008',
    'black': '43845906235632',
    'matcha green': '44148855570672',
    'royal blue': '44235357094128',
    'iris purple': '44235357126896',
    'lava gray': '44083777601776',
    'burgundy red': '44148855603440',
  },
  // ========== PLA AERO ==========
  'pla-aero': {
    'white': '44189333061872',
    'black': '44189333094640',
    'gray': '46352156623088',
  },
  // ========== ABS ==========
  'abs-filament': {
    'black': '43115678859504',
    'silver': '46541030883568',
    'white': '43115678892272',
    'bambu green': '46130964955376',
    'olive': '46311956513008',
    'azure': '46311955202288',
    'blue': '43115678990576',
    'navy blue': '46311953203440',
    'tangerine yellow': '46311958282480',
    'orange': '46130970886384',
    'red': '43115678925040',
    'purple': '46541030916336',
  },
  // ========== ASA ==========
  'asa-filament': {
    'white': '44173925744880',
    'green': '44173925646576',
    'gray': '44173925777648',
    'red': '44173925613808',
    'blue': '44173925679344',
    'black': '44173925712112',
  },
  // ========== ASA AERO ==========
  'asa-aero': {
    'white': '45647640101104',
  },
  // ========== ABS-GF ==========
  'abs-gf': {
    'orange': '45758386569456',
    'green': '45758386667760',
    'red': '45758386634992',
    'yellow': '45758386602224',
    'blue': '46010148454640',
    'white': '45758386438384',
    'gray': '45758386536688',
    'black': '45758386503920',
  },
  // ========== ASA-CF ==========
  'asa-cf': {
    'black': '46611883360496',
  },
  // ========== PETG HF ==========
  'petg-hf': {
    'red': '46336540737776',
    'black': '46336540803312',
    'lake blue': '46547460489456',
    'blue': '46336540934384',
    'white': '46336540868848',
    'gray': '46336540999920',
    'dark gray': '46547453608176',
    'cream': '46547456131312',
    'yellow': '46336540541168',
    'lime green': '46547458588912',
    'green': '46336540672240',
    'forest green': '46547440304368',
    'orange': '46336540606704',
    'peanut brown': '46547447644400',
  },
  // ========== PETG TRANSLUCENT ==========
  'petg-translucent': {
    'clear': '46311961984240',
    'translucent gray': '46311963196656',
    'translucent light blue': '46311962508528',
    'translucent teal': '46311962279152',
    'translucent olive': '46334027956464',
    'translucent brown': '46352469885168',
    'translucent orange': '46311964246256',
    'translucent pink': '46311967850736',
    'translucent purple': '46311965098224',
  },
  // ========== PETG-CF ==========
  'petg-cf': {
    'indigo blue': '44180162150640',
    'brick red': '44180162117872',
    'malachite green': '44180162183408',
    'violet purple': '44180162085104',
    'black': '43887125266672',
    'titan gray': '44326019367152',
  },
  // ========== PA6-GF ==========
  'pa6-gf': {
    'blue': '45444547805424',
    'orange': '45444547838192',
    'yellow': '45444547870960',
    'lime': '45444547903728',
    'brown': '45444547936496',
    'white': '45444547969264',
    'gray': '45444548002032',
    'black': '45444548034800',
  },
  // ========== PA6-CF ==========
  'pa6-cf': {
    'black': '45444548067568',
  },
  // ========== PAHT-CF ==========
  'paht-cf': {
    'black': '44142217371888',
  },
  // ========== PET-CF ==========
  'pet-cf': {
    'black': '44142217404656',
  },
  // ========== PPA-CF ==========
  'ppa-cf': {
    'black': '46498167718128',
  },
  // ========== PC ==========
  'pc-filament': {
    'transparent': '44080188621040',
    'clear black': '44080188588272',
    'black': '43584501842160',
    'white': '43584501874928',
  },
  // ========== PC FR ==========
  'pc-fr': {
    'black': '546460344590610440',
    'white': '546460344590610446',
    'gray': '546460344590610452',
  },
  // ========== PPS-CF ==========
  'pps-cf': {
    'black': '46512619127024',
  },
  // ========== SUPPORT MATERIALS ==========
  'pva': {
    'clear': '45303868227824',
  },
  'support-for-pla-petg': {
    'nature': '46214534594800',
    'black': '46840425578736',
  },
  'support-for-pla-new': {
    'white': '579081062845280263',
  },
  'support-for-pa-pet': {
    'green': '43181727580400',
  },
  'support-for-abs': {
    'white': '46333844160752',
  },
  // ========== TPU 85A/90A ==========
  'tpu-85a-tpu-90a': {
    'frozen': '573761482377510924',
    'blaze': '573761482377510930',
    'white': '672317379708768257',
    'black': '573761482377510942',
    'grape jelly': '679919043689914375',
    'crystal blue': '679919043689914381',
    'cocoa brown': '679919043689914387',
    'neon orange': '668354619028484097',
    'light cyan': '573761482377510954',
    'flesh': '679919043689914399',
    'lime green': '679919043689914405',
  },
  // ========== TPU 95A HF ==========
  'tpu-95a-hf': {
    'white': '44405012300016',
    'black': '44405012201712',
    'gray': '44405012332784',
    'yellow': '44405012365552',
    'blue': '44405012398320',
    'red': '44405012431088',
  },
  // ========== TPU FOR AMS ==========
  'tpu-for-ams': {
    'blue': '46779647361264',
    'gray': '46779647459568',
    'black': '46779647492336',
    'orange': '46779647525104',
    'bambu green': '46779647557872',
    'yellow': '46779647328496',
    'red': '46779647295728',
    'neon green': '46779647394032',
    'white': '46779647426800',
  },
};

/**
 * Get variant-specific URL for a Bambu Lab product
 * Uses the BAMBULAB_VARIANT_IDS mapping to append ?id= parameter
 */
function getVariantUrl(productSlug: string, colorName: string): string {
  const normalizedColor = colorName.toLowerCase().trim();
  const variantId = BAMBULAB_VARIANT_IDS[productSlug]?.[normalizedColor];
  const baseUrl = `https://us.store.bambulab.com/products/${productSlug}`;
  return variantId ? `${baseUrl}?id=${variantId}` : baseUrl;
}

// Legacy fallback - keeping for backwards compatibility
const ABS_COLOR_IMAGES = S5_PRODUCT_IMAGES['abs-filament'] || {};

// ========== CSV-BASED PRODUCT WHITELIST ==========
// Only products with S5 images and variant IDs from CSV data will be synced.
// This ensures high-quality images and complete variant coverage.
// Products discovered from collection page are filtered against this whitelist.
const CSV_PRODUCT_SLUGS = Object.keys(S5_PRODUCT_IMAGES);

/**
 * Check if a product URL is in the CSV whitelist
 * Only products with S5_PRODUCT_IMAGES entries will be synced
 */
function isProductInCSVWhitelist(productUrl: string): boolean {
  const slug = extractProductSlug(productUrl);
  return CSV_PRODUCT_SLUGS.includes(slug);
}

/**
 * Get whitelisted colors for a product slug from CSV data
 * Returns union of colors from S5_PRODUCT_IMAGES and BAMBULAB_VARIANT_IDS
 */
function getCSVWhitelistedColors(productSlug: string): string[] {
  const s5Colors = Object.keys(S5_PRODUCT_IMAGES[productSlug] || {});
  const variantColors = Object.keys(BAMBULAB_VARIANT_IDS[productSlug] || {});
  // Union of both sets (normalize to lowercase)
  const allColors = new Set([
    ...s5Colors.map(c => c.toLowerCase().trim()),
    ...variantColors.map(c => c.toLowerCase().trim()),
  ]);
  return [...allColors];
}

// ========== TPU HARDNESS GRADE MAPPING ==========
// Bambu Lab sells TPU 85A and 90A on the same product page, but they are different
// hardness grades that should be displayed as separate product cards.
// This mapping determines which product line each color belongs to.
const TPU_HARDNESS_MAP: Record<string, '85a' | '90a'> = {
  // TPU 85A colors (softer, more flexible)
  'neon orange': '85a',
  'light cyan': '85a',
  // TPU 90A colors (standard flexibility)
  'frozen': '90a',
  'blaze': '90a',
  'white': '90a',
  'black': '90a',
  'grape jelly': '90a',
  'crystal blue': '90a',
  'cocoa brown': '90a',
  'flesh': '90a',
  'lime green': '90a',
};

interface DiscoveredProduct {
  url: string;
  collectionTitle: string;
}

// Color variant with associated image and variant ID for URL
interface ColorVariantData {
  colorName: string;
  colorHex: string | null;
  imageUrl: string | null;
  variantId: string | null;  // Shopify/Bambu variant ID for ?id= URL parameter
}

interface ScrapedProduct {
  url: string;
  h1Title: string;
  price: number | null;
  imageUrl: string | null;  // Fallback/default image
  colorVariants: ColorVariantData[];  // Color-specific data with images
  weightGrams: number;
  available: boolean;
}

interface SyncResult {
  success: boolean;
  summary: {
    totalDiscovered: number;
    totalScraped: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  duration: string;
  duration_ms: number;
}

// ============================================================================
// STEP 1: DISCOVER PRODUCTS FROM COLLECTION PAGE (FIRECRAWL)
// ============================================================================

async function discoverProductsFromCollection(firecrawlKey: string): Promise<DiscoveredProduct[]> {
  const allProducts: DiscoveredProduct[] = [];
  const seenUrls = new Set<string>();
  
  const collectionUrl = BAMBULAB_STORE_INFO.productsUrl;
  console.log(`[BambuLab] Discovering products from collection: ${collectionUrl}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: collectionUrl,
        formats: ['links', 'markdown'],
        onlyMainContent: false,
        waitFor: 5000, // Wait for JS content to load
      }),
    });
    
    if (!response.ok) {
      console.error(`[BambuLab] Failed to scrape collection: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const links = data.data?.links || [];
    
    console.log(`[BambuLab] Found ${links.length} total links on page`);
    
    // Filter for product links - Bambu Lab uses both ca. and us. subdomains
    // Collection shows us. links but we can use ca. for CAD pricing
    const productLinks = links.filter((link: string) => {
      // Match patterns like:
      // https://us.store.bambulab.com/products/pla-basic-filament
      // https://ca.store.bambulab.com/products/pla-matte
      const isProductLink = /https:\/\/(us|ca|eu|uk|au)\.store\.bambulab\.com\/products\//.test(link);
      
      // Exclude non-product pages
      const isNotCollection = !link.includes('/collections/');
      const isNotCart = !link.includes('/cart');
      const isNotAccount = !link.includes('/account');
      
      return isProductLink && isNotCollection && isNotCart && isNotAccount;
    });
    
    console.log(`[BambuLab] Found ${productLinks.length} product links`);
    
    for (const link of productLinks) {
      // Normalize to CA store for consistent pricing
      const normalizedUrl = link.replace(
        /https:\/\/(us|eu|uk|au)\.store\.bambulab\.com/,
        'https://us.store.bambulab.com'
      );
      
      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        allProducts.push({
          url: normalizedUrl,
          collectionTitle: 'Filament',
        });
      }
    }
    
  } catch (error) {
    console.error(`[BambuLab] Error scraping collection:`, error);
  }
  
  console.log(`[BambuLab] Total unique products discovered: ${allProducts.length}`);
  return allProducts;
}

// ============================================================================
// STEP 2: SCRAPE PRODUCT PAGES FOR DETAILS
// ============================================================================

/**
 * Extract colors from both HTML and markdown content
 * Bambu Lab uses button elements and JSON-LD for color options
 */
function extractColorsFromPageContent(markdown: string, html: string = ''): string[] {
  const colors: string[] = [];
  
  // ============ HTML PATTERNS (PRIORITY) ============
  
  // Pattern H1: Button/option elements with color in aria-label or data-* attributes
  // <button aria-label="Color: White">
  const ariaMatches = html.matchAll(/aria-label="(?:Color|Colour|Select):\s*([^"]+)"/gi);
  for (const match of ariaMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H2: Option/variant buttons with title attribute
  // <button title="White">
  const titleMatches = html.matchAll(/<(?:button|div|span)[^>]*title="([A-Z][a-z]+(?:\s+[A-Za-z]+){0,2})"[^>]*(?:class="[^"]*(?:variant|swatch|option|color)[^"]*")/gi);
  for (const match of titleMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H3: JSON-LD structured data (Shopify/Next.js stores)
  const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const jsonLdMatch of jsonLdMatches) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      // Check for color options in product offers
      if (jsonData['@type'] === 'Product' && jsonData.offers) {
        const offers = Array.isArray(jsonData.offers) ? jsonData.offers : [jsonData.offers];
        for (const offer of offers) {
          if (offer.name && isValidColorName(offer.name)) {
            const colorName = offer.name.trim();
            if (!colors.includes(colorName)) {
              colors.push(colorName);
            }
          }
        }
      }
      // Check for variant options
      if (jsonData.hasVariant) {
        for (const variant of jsonData.hasVariant) {
          if (variant.name && isValidColorName(variant.name)) {
            const colorName = variant.name.trim();
            if (!colors.includes(colorName)) {
              colors.push(colorName);
            }
          }
        }
      }
    } catch (e) {
      // JSON parse failed, continue
    }
  }
  
  // Pattern H4: Variant swatch images with alt text containing color
  // <img alt="White" class="swatch-image">
  const imgSwatchMatches = html.matchAll(/<img[^>]*alt="([A-Z][a-z]+(?:\s+[A-Za-z]+){0,2})"[^>]*class="[^"]*(?:swatch|variant|option)[^"]*"/gi);
  for (const match of imgSwatchMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H5: Bambu Lab variant picker options (Next.js)
  // <span class="variant-option">White</span>
  const variantSpanMatches = html.matchAll(/<span[^>]*class="[^"]*(?:variant|option|color|swatch)[^"]*"[^>]*>([A-Z][a-z]+(?:\s+[A-Za-z]+){0,2})<\/span>/gi);
  for (const match of variantSpanMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H6: Data attributes with color values
  // <div data-color="White">
  const dataColorMatches = html.matchAll(/data-(?:color|variant|option)="([A-Z][a-z]+(?:\s+[A-Za-z]+){0,2})"/gi);
  for (const match of dataColorMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H7 (BAMBU LAB SPECIFIC): Variant selector <li value="ColorName (SKU)">
  // Example: <li value="Jade White (10100)" class="w-[42px] h-[42px] ... rounded-full">
  const liValueMatches = html.matchAll(/<li[^>]*value="([^"]+)"[^>]*class="[^"]*rounded-full[^"]*"/gi);
  for (const match of liValueMatches) {
    const fullValue = match[1];
    // Strip SKU from "Jade White (10100)" -> "Jade White"
    const colorName = fullValue.replace(/\s*\(\d+\)$/, '').trim();
    if (colorName && isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H8 (FALLBACK): Any <li value="ColorName"> or <li value="ColorName (SKU)">
  // More lenient pattern for edge cases
  const liValueFallback = html.matchAll(/<li[^>]*value="([A-Z][a-zA-Z\s]+)(?:\s*\([^)]+\))?"/gi);
  for (const match of liValueFallback) {
    const colorName = match[1].trim();
    if (colorName && isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H9: Button elements with value or data-value attribute (for ABS and other products)
  // Example: <button value="Black" class="...">
  const buttonValueMatches = html.matchAll(/<button[^>]*(?:value|data-value)="([A-Z][a-zA-Z\s]+)"[^>]*>/gi);
  for (const match of buttonValueMatches) {
    const colorName = match[1].trim();
    if (colorName && isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H10: Dropdown/select option elements
  // Example: <option value="Black">Black</option>
  const optionMatches = html.matchAll(/<option[^>]*value="([A-Z][a-zA-Z\s]+)"[^>]*>/gi);
  for (const match of optionMatches) {
    const colorName = match[1].trim();
    if (colorName && isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // ============ MARKDOWN PATTERNS (FALLBACK) ============
  
  // Pattern M1: "Color : ColorName (SKU)" - primary pattern
  const colorLabelMatches = markdown.matchAll(/Color\s*:\s*([^(]+?)\s*\(/gi);
  for (const match of colorLabelMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern M2: "Selected: ColorName" - backup pattern
  const selectedMatches = markdown.matchAll(/Selected\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g);
  for (const match of selectedMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern M3: Color options list (e.g., "- White\n- Black\n- Red")
  const colorListMatches = markdown.matchAll(/^[\s-]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/gm);
  for (const match of colorListMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // ============ JSON DATA PATTERN (for JS-rendered color pickers) ============
  // Pattern J1: Extract from __NEXT_DATA__ or similar embedded JSON
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i);
  if (nextDataMatch && colors.length === 0) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      // Navigate to product variants in Next.js page props
      const variants = nextData?.props?.pageProps?.product?.variants || 
                       nextData?.props?.pageProps?.data?.product?.variants || [];
      for (const variant of variants) {
        const colorName = variant?.option1 || variant?.selectedOptions?.[0]?.value || variant?.title;
        if (colorName && isValidColorName(colorName) && !colors.includes(colorName)) {
          colors.push(colorName);
        }
      }
    } catch (e) {
      // JSON parse failed, continue with other methods
    }
  }
  
  return colors;
}

/**
 * Find the best image match for a color name using flexible matching.
 * Handles compound color names like "Matte Apple Green" by trying:
 * 1. Exact match: "matte apple green"
 * 2. Stripped prefix match: "apple green" (without Matte/Silk/etc.)
 * 3. Last word match: "green"
 * 4. First significant word match: "apple"
 */
function findBestImageForColor(colorKey: string, colorImageMap: Map<string, string>): string | null {
  // Normalize the color key
  const normalized = colorKey.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // 1. Exact match
  if (colorImageMap.has(normalized)) {
    return colorImageMap.get(normalized) || null;
  }
  
  // 2. Strip common prefixes (Matte, Silk, Translucent, etc.) and try again
  const strippedPrefixes = normalized
    .replace(/^(matte|silk|translucent|basic|tough|galaxy)\s+/i, '')
    .trim();
  if (strippedPrefixes !== normalized && colorImageMap.has(strippedPrefixes)) {
    return colorImageMap.get(strippedPrefixes) || null;
  }
  
  // 3. Try partial matching - look for keys that contain significant parts of the color
  const words = normalized.split(' ').filter(w => w.length >= 3);
  
  // Try compound matches first (e.g., "ivory white" for "matte ivory white")
  for (let i = 0; i < words.length - 1; i++) {
    const compound = `${words[i]} ${words[i + 1]}`;
    if (colorImageMap.has(compound)) {
      return colorImageMap.get(compound) || null;
    }
  }
  
  // 4. Try individual significant words (prioritize later words which are usually the actual color)
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    // Skip common prefixes/modifiers
    if (['matte', 'silk', 'basic', 'dark', 'light', 'translucent', 'tough', 'galaxy'].includes(word)) {
      continue;
    }
    if (colorImageMap.has(word)) {
      return colorImageMap.get(word) || null;
    }
  }
  
  // 5. Last resort: check if any map key is contained in the color name
  for (const [key, url] of colorImageMap.entries()) {
    if (normalized.includes(key) && key.length >= 4) {
      return url;
    }
  }
  
  return null;
}

/**
 * Helper to extract color name from a CDN image filename
 * e.g., "PLA_Matte_Black.png" -> "black" or "matte black"
 */
function extractColorFromFilename(filename: string): string | null {
  // Remove extension and query params
  const clean = filename
    .replace(/\.(png|jpg|jpeg|webp).*$/i, '')
    .replace(/^(pla|petg|abs|tpu|pa|pc|asa|pva)[-_]?/i, '')
    .replace(/^(matte|silk|basic|tough|hf|translucent|cf|gf)[-_]?/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .toLowerCase();
  
  // Skip GUIDs and generic names
  if (!clean || clean.length < 3 || /^\d+$/.test(clean) || /^[a-f0-9]{8,}$/i.test(clean)) {
    return null;
  }
  if (/spool|web|product|filament|original|v\d|_\d/i.test(clean)) {
    return null;
  }
  
  return clean;
}

/**
 * Get S5 gallery image from hardcoded mapping
 * S5 images are loaded via JavaScript and cannot be scraped - we must use hardcoded mappings.
 * 
 * @param productSlug - Product slug from URL (e.g., 'pla-basic-filament')
 * @param colorName - Color name (e.g., 'Jade White')
 * @returns S5 gallery URL or null if not found
 */
function getHardcodedS5Image(productSlug: string, colorName: string): string | null {
  const normalizedSlug = productSlug.toLowerCase();
  const normalizedColor = colorName.toLowerCase().trim();
  
  const productImages = S5_PRODUCT_IMAGES[normalizedSlug];
  if (!productImages) {
    return null;
  }
  
  // Try exact match first
  if (productImages[normalizedColor]) {
    return productImages[normalizedColor];
  }
  
  // Try partial matches (for compound color names like "Matte Charcoal" -> "charcoal")
  for (const [colorKey, url] of Object.entries(productImages)) {
    // Check if the color name contains the key or vice versa
    if (normalizedColor.includes(colorKey) || colorKey.includes(normalizedColor)) {
      return url;
    }
    // Check for last word match (e.g., "jade white" matches "white")
    const lastWord = normalizedColor.split(' ').pop() || '';
    if (lastWord && colorKey === lastWord) {
      return url;
    }
  }
  
  return null;
}

/**
 * Extract product slug from URL
 * e.g., 'https://us.store.bambulab.com/products/pla-basic-filament' -> 'pla-basic-filament'
 */
function extractProductSlug(productUrl: string): string {
  const match = productUrl.match(/\/products\/([^/?#]+)/i);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Extract color variants with their associated S5 GALLERY images from HTML and __NEXT_DATA__
 * 
 * CRITICAL: We must use S5 CDN images (product gallery photos), NOT S7 swatch thumbnails!
 * - S5 CDN (store.bblcdn.com/s5/): Full product photos shown when color is selected (1920px)
 * - S7 CDN (store.bblcdn.com/s7/): Tiny swatch thumbnails in color picker UI (~50x50px)
 * 
 * Strategy:
 * 1. FIRST check hardcoded S5_PRODUCT_IMAGES mapping (most reliable)
 * 2. Try to find S5 images in HTML (rarely works - they're JS-loaded)
 * 3. Extract color names from color selector elements
 * 4. Fall back to S7 swatch only if NO S5 image found (with warning)
 */
function extractColorVariantsWithImages(html: string, markdown: string, productUrl: string): ColorVariantData[] {
  const variants: ColorVariantData[] = [];
  const seenColors = new Set<string>();
  
  // Get product slug for hardcoded S5 lookup
  const productSlug = extractProductSlug(productUrl);
  const hasHardcodedImages = productSlug && S5_PRODUCT_IMAGES[productSlug];
  
  if (hasHardcodedImages) {
    console.log(`[BambuLab] Using hardcoded S5 images for: ${productSlug}`);
  }
  
  // Build separate maps for S5 (gallery) and S7 (swatch) images
  const s5GalleryImages = new Map<string, string>(); // color -> S5 gallery URL
  const s7SwatchImages = new Map<string, string>();  // color -> S7 swatch URL (fallback only)
  const guidToS5Image = new Map<string, string>();   // GUID -> S5 URL (for matching)
  const colorImageMap = new Map<string, string>();   // Combined map for fallback matching
  
  // ========== STEP 1: Extract ALL S5 gallery images from HTML (if any) ==========
  // Note: S5 images are usually JS-loaded, so this often finds 0 images
  const s5ImageMatches = html.matchAll(/https:\/\/store\.bblcdn\.com\/s5\/[^"'\s<>]+\.(?:jpg|png|jpeg|webp)(?:__op__[^"'\s<>]*)?/gi);
  const allS5Images = [...new Set([...s5ImageMatches].map(m => m[0]))];
  
  console.log(`[BambuLab] Found ${allS5Images.length} S5 gallery images in HTML`);
  
  // Build GUID -> S5 URL map (GUIDs are 32-char hex strings)
  for (const s5Url of allS5Images) {
    // Exclude non-product images
    if (s5Url.toLowerCase().includes('logo') || s5Url.toLowerCase().includes('icon')) continue;
    
    // Extract GUID from URL like /s5/default/GUID.jpg
    const guidMatch = s5Url.match(/\/s5\/default\/([a-f0-9]{32})/i);
    if (guidMatch) {
      const guid = guidMatch[1].toLowerCase();
      guidToS5Image.set(guid, s5Url);
    }
    
    // Also try to extract color from filename patterns
    const filenameMatch = s5Url.match(/\/([^/]+)\.(jpg|png|jpeg|webp)/i);
    if (filenameMatch) {
      const colorFromFile = extractColorFromFilename(filenameMatch[1]);
      if (colorFromFile) {
        s5GalleryImages.set(colorFromFile, s5Url);
        colorImageMap.set(colorFromFile, s5Url);
      }
    }
  }
  
  // ========== STEP 2: Extract S7 swatch images and map via GUID ==========
  // Parse color selector elements: <li value="ColorName (SKU)"> followed by <img src="s7/...">
  const colorSelectorRegex = /<li[^>]*value="([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="(https:\/\/store\.bblcdn\.com\/s7[^"]+)"[^>]*>/gi;
  let s7ColorMatches = 0;
  
  for (const match of html.matchAll(colorSelectorRegex)) {
    const rawValue = match[1].trim(); // e.g., "Gold (13405)" or "Titan Gray"
    const s7SwatchUrl = match[2];
    
    // Extract clean color name - remove SKU in parentheses if present
    const colorName = rawValue.replace(/\s*\([^)]+\)$/, '').trim();
    
    // Validate color name
    if (!colorName || colorName.length < 2) continue;
    if (/^[0-9]+$/.test(colorName)) continue;
    if (/^[a-f0-9]{8,}$/i.test(colorName)) continue;
    if (!isValidColorName(colorName)) continue;
    
    const colorKey = colorName.toLowerCase().replace(/\s+/g, ' ').trim();
    s7ColorMatches++;
    
    // Store S7 swatch as fallback (but we'll try to find S5 first)
    s7SwatchImages.set(colorKey, s7SwatchUrl);
    
    // Try to find corresponding S5 gallery image via GUID
    // S7 URL format: /s7/default/GUID/filename.png
    const s7GuidMatch = s7SwatchUrl.match(/\/s7\/default\/([a-f0-9]{32})/i);
    if (s7GuidMatch) {
      const guid = s7GuidMatch[1].toLowerCase();
      
      // Check if we have an S5 image with same GUID
      if (guidToS5Image.has(guid)) {
        const s5Url = guidToS5Image.get(guid)!;
        s5GalleryImages.set(colorKey, s5Url);
        colorImageMap.set(colorKey, s5Url);
        console.log(`[BambuLab] Matched color "${colorKey}" to S5 gallery via GUID`);
      }
    }
    
    // If no S5 match found, still add S7 to colorImageMap as fallback
    if (!colorImageMap.has(colorKey)) {
      colorImageMap.set(colorKey, s7SwatchUrl);
    }
  }
  
  console.log(`[BambuLab] Found ${s7ColorMatches} colors from selector, ${s5GalleryImages.size} matched to S5 images`);
  
  // ========== STEP 3: Enhanced CDN filename matching ==========
  // For colors not matched by GUID, try filename pattern matching with S5 images
  const allCdnImages = [...allS5Images]; // Start with S5 images
  
  // Color indicators for filename matching
  const colorIndicators = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
    'grey', 'gray', 'brown', 'tan', 'gold', 'silver', 'jade', 'ivory', 'charcoal',
    'coral', 'cyan', 'navy', 'olive', 'maroon', 'salmon', 'lime', 'clear', 'natural',
    'magenta', 'teal', 'cream', 'bronze', 'copper', 'beige', 'slate', 'scarlet',
    'lemon', 'grass', 'sakura', 'marine', 'midnight', 'mandarin', 'caramel', 'plum',
    'nardo', 'desert', 'terracotta', 'latte', 'bone', 'ash', 'apple', 'chocolate',
    'ice', 'sky', 'dark', 'cold', 'warm', 'candy', 'titan'
  ];
  
  for (const imageUrl of allCdnImages) {
    const filename = (imageUrl.split('/').pop() || '').toLowerCase();
    const cleanFilename = filename
      .replace(/\.(png|jpg|jpeg|webp).*$/, '')
      .replace(/^(pla|petg|abs|tpu|pa|pc|asa|pva)[-_]?/i, '')
      .replace(/^(matte|silk|basic|tough|hf|translucent|cf|gf)[-_]?/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    
    if (!cleanFilename || cleanFilename.length < 3) continue;
    if (/^\d+$/.test(cleanFilename) || /^[a-f0-9]{8,}$/i.test(cleanFilename)) continue;
    
    const colorKey = cleanFilename.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Only add if it looks like a color and we don't have it yet
    const hasColorIndicator = colorIndicators.some(c => colorKey.includes(c));
    if (hasColorIndicator && !colorImageMap.has(colorKey)) {
      colorImageMap.set(colorKey, imageUrl);
    }
    
    // Also store individual words for partial matching
    const colorWords = colorKey.split(' ').filter(w => w.length >= 3 && colorIndicators.includes(w));
    for (const word of colorWords) {
      if (!colorImageMap.has(word)) {
        colorImageMap.set(word, imageUrl);
      }
    }
  }
  
  console.log(`[BambuLab] Total color-image mappings: ${colorImageMap.size}`);
  
  // ========== STEP 4: Extract images from __NEXT_DATA__ ==========
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const productVariants = nextData?.props?.pageProps?.product?.variants || 
                              nextData?.props?.pageProps?.data?.product?.variants ||
                              nextData?.props?.pageProps?.initialData?.product?.variants || [];
      
      const productImagesFromJson = nextData?.props?.pageProps?.product?.images ||
                                    nextData?.props?.pageProps?.data?.product?.images || [];
      
      // Add alt text mappings from product images
      for (const img of productImagesFromJson) {
        if (img.alt && img.src && isValidColorName(img.alt)) {
          const imgUrl = img.src.replace(/^\/\//, 'https://');
          // Prefer S5 images
          if (imgUrl.includes('/s5/') || !colorImageMap.has(img.alt.toLowerCase())) {
            colorImageMap.set(img.alt.toLowerCase(), imgUrl);
          }
        }
      }
      
      for (const v of productVariants) {
        const colorName = v?.option1 || v?.selectedOptions?.[0]?.value || v?.title;
        if (!colorName || !isValidColorName(colorName)) continue;
        
        const colorKey = colorName.toLowerCase();
        if (seenColors.has(colorKey)) continue;
        seenColors.add(colorKey);
        
        // Extract variant ID for URL parameter (e.g., ?id=624467991622688780)
        const variantId = v?.id?.toString() || null;
        
        // Get image URL - PRIORITY ORDER:
        // 1. Variant's featured_image from __NEXT_DATA__ (S5 gallery image)
        // 2. Hardcoded S5_PRODUCT_IMAGES fallback
        // 3. S5 from HTML
        // 4. S7 swatch as last resort
        
        let imageUrl: string | null = null;
        let imageSource = 'none';
        
        // PRIORITY 1: Variant's own featured_image from __NEXT_DATA__ (most accurate - S5 gallery)
        const variantFeaturedImg = v?.featured_image?.src || v?.featured_image;
        if (variantFeaturedImg && typeof variantFeaturedImg === 'string') {
          const variantImgUrl = variantFeaturedImg.replace(/^\/\//, 'https://');
          if (variantImgUrl.includes('/s5/')) {
            imageUrl = variantImgUrl;
            imageSource = 'variant_featured_s5';
          }
        }
        
        // PRIORITY 2: Check hardcoded S5 mapping
        if (!imageUrl && productSlug) {
          const hardcodedS5 = getHardcodedS5Image(productSlug, colorName);
          if (hardcodedS5) {
            imageUrl = hardcodedS5;
            imageSource = 'hardcoded_s5';
          }
        }
        
        // PRIORITY 3: S5 from HTML
        if (!imageUrl) {
          imageUrl = s5GalleryImages.get(colorKey) || null;
          if (imageUrl) imageSource = 'html_s5';
        }
        
        // PRIORITY 4: Try variant's image.src (may be S5)
        if (!imageUrl) {
          const variantImg = v?.image?.src;
          if (variantImg && typeof variantImg === 'string') {
            const variantImgUrl = variantImg.replace(/^\/\//, 'https://');
            if (variantImgUrl.includes('/s5/')) {
              imageUrl = variantImgUrl;
              imageSource = 'variant_image_s5';
            }
          }
        }
        
        // PRIORITY 5: Try flexible matching from colorImageMap (may include S5)
        if (!imageUrl) {
          const matched = findBestImageForColor(colorKey, colorImageMap);
          if (matched && matched.includes('/s5/')) {
            imageUrl = matched;
            imageSource = 'colormap_s5';
          }
        }
        
        // LAST RESORT: S7 swatch (not ideal - tiny thumbnails)
        if (!imageUrl && s7SwatchImages.has(colorKey)) {
          imageUrl = s7SwatchImages.get(colorKey) || null;
          if (imageUrl) {
            imageSource = 's7_swatch';
            console.log(`[BambuLab] WARNING: Using S7 swatch for "${colorKey}" - S5 extraction failed`);
          }
        }
        
        variants.push({
          colorName: colorName.trim(),
          colorHex: getBambuLabColorHex(colorName) || getColorHex(colorName) || null,
          imageUrl,
          variantId,
        });
      }
      
      if (variants.length > 0) {
        console.log(`[BambuLab] Extracted ${variants.length} color variants from __NEXT_DATA__`);
        const withS5 = variants.filter(v => v.imageUrl?.includes('/s5/')).length;
        const withS7 = variants.filter(v => v.imageUrl?.includes('/s7/')).length;
        const withHardcoded = variants.filter(v => {
          if (!v.imageUrl || !productSlug) return false;
          const hardcoded = getHardcodedS5Image(productSlug, v.colorName);
          return hardcoded && v.imageUrl === hardcoded;
        }).length;
        console.log(`[BambuLab] Images: ${withHardcoded} hardcoded S5, ${withS5 - withHardcoded} other S5, ${withS7} S7 swatch, ${variants.length - withS5 - withS7} other`);
        return variants;
      }
    } catch (e) {
      console.log(`[BambuLab] __NEXT_DATA__ parse failed, using HTML fallback`);
    }
  }
  
  // ========== STEP 5: Fallback to HTML color extraction ==========
  const colorNames = extractColorsFromPageContent(markdown, html);
  for (const colorName of colorNames) {
    const colorKey = colorName.toLowerCase();
    if (seenColors.has(colorKey)) continue;
    seenColors.add(colorKey);
    
    // PRIORITY ORDER for image assignment (same as __NEXT_DATA__ path)
    let imageUrl: string | null = null;
    
    // 1. Check hardcoded S5 mapping FIRST (most reliable)
    if (productSlug) {
      const hardcodedS5 = getHardcodedS5Image(productSlug, colorName);
      if (hardcodedS5) {
        imageUrl = hardcodedS5;
      }
    }
    
    // 2. Try S5 from HTML
    if (!imageUrl) {
      imageUrl = s5GalleryImages.get(colorKey) || null;
    }
    
    // 3. Try flexible matching (prefer S5)
    if (!imageUrl) {
      const matched = findBestImageForColor(colorKey, colorImageMap);
      if (matched && matched.includes('/s5/')) {
        imageUrl = matched;
      }
    }
    
    // 4. Last resort: S7 swatch
    if (!imageUrl && s7SwatchImages.has(colorKey)) {
      imageUrl = s7SwatchImages.get(colorKey) || null;
      if (imageUrl) {
        console.log(`[BambuLab] WARNING: Using S7 swatch for "${colorKey}" - add to S5_PRODUCT_IMAGES['${productSlug}']`);
      }
    }
    
    variants.push({
      colorName,
      colorHex: getBambuLabColorHex(colorName) || getColorHex(colorName) || null,
      imageUrl,
      variantId: null,  // No variant ID available from HTML fallback
    });
  }
  
  return variants;
}

// Helper to get default color for single-color products (e.g., CF, GF, PVA)
function getDefaultColorForProduct(title: string): string | null {
  const t = title.toLowerCase();
  
  // Carbon fiber products are typically black
  if (/-cf\b|carbon\s*fiber/i.test(t)) return 'Black';
  
  // Glass fiber products are typically natural/tan
  if (/-gf\b|glass\s*fiber/i.test(t)) return 'Natural';
  
  // PC is typically clear
  if (/\bpc\b/.test(t) && !/pc-cf|pc-gf/i.test(t)) return 'Clear';
  
  // PVA support is white
  if (/\bpva\b/i.test(t)) return 'White';
  
  // Generic support materials are white
  if (/\bsupport\b/i.test(t)) return 'White';
  
  // PPS-CF is black
  if (/pps-cf/i.test(t)) return 'Black';
  
  return null;
}

async function scrapeProductPage(url: string, firecrawlKey: string): Promise<ScrapedProduct | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: false, // Need full page for __NEXT_DATA__
        waitFor: 5000,
      }),
    });
    
    if (!response.ok) {
      console.error(`[BambuLab] Failed to scrape ${url}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const markdown = data.data?.markdown || '';
    const html = data.data?.html || '';
    
    // Extract H1 title (priority for product_title)
    let h1Title = '';
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                    markdown.match(/^#\s+(.+)$/m);
    if (h1Match) {
      h1Title = h1Match[1].trim();
    }
    
    // If no H1, try to extract from markdown headers
    if (!h1Title) {
      const mdHeaderMatch = markdown.match(/^##?\s+(.+)$/m);
      if (mdHeaderMatch) {
        h1Title = mdHeaderMatch[1].trim();
      }
    }
    
    // Extract price (USD)
    let price: number | null = null;
    const priceMatch = markdown.match(/\$(\d+(?:\.\d{2})?)\s*USD/i) ||
                       markdown.match(/From\s+\$(\d+(?:\.\d{2})?)/i) ||
                       markdown.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
    }
    
    // Extract fallback/default image URL
    let imageUrl: string | null = null;
    
    // Pattern 1: og:image meta tag (most reliable for product images)
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                         html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
    if (ogImageMatch && !ogImageMatch[1].includes('logo')) {
      imageUrl = ogImageMatch[1];
    }
    
    // Pattern 2: Product gallery images from HTML
    if (!imageUrl) {
      const galleryMatch = html.match(/data-(?:zoom-image|large-image|src)="(https:\/\/[^"]*(?:product|filament)[^"]+\.(?:jpg|jpeg|png|webp))"/i);
      if (galleryMatch) {
        imageUrl = galleryMatch[1];
      }
    }
    
    // Pattern 3: Main product image from img tags
    if (!imageUrl) {
      const mainImgMatch = html.match(/<img[^>]*class="[^"]*(?:product|main|featured|hero)[^"]*"[^>]*src="([^"]+)"/i) ||
                           html.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*(?:product|main|featured|hero)[^"]*"/i);
      if (mainImgMatch && !mainImgMatch[1].includes('logo')) {
        imageUrl = mainImgMatch[1];
      }
    }
    
    // Pattern 4: Bambu Lab CDN images from markdown (fallback)
    if (!imageUrl) {
      const imgMatch = markdown.match(/!\[.*?\]\((https:\/\/store\.bblcdn\.com[^)]+)\)/);
      if (imgMatch && !imgMatch[1].includes('logo')) {
        imageUrl = imgMatch[1];
      }
    }
    
    // Extract color variants with their associated images
    let colorVariants = extractColorVariantsWithImages(html, markdown, url);
    
    // ABS fallback: If scraping returns 0 colors for ABS, use hardcoded known colors WITH images
    if (colorVariants.length === 0 && /\babs-filament\b/i.test(url)) {
      const absColors = ['Black', 'White', 'Silver', 'Red', 'Orange', 'Tangerine Yellow', 
                         'Bambu Green', 'Olive', 'Blue', 'Azure', 'Navy Blue', 'Purple'];
      colorVariants = absColors.map(colorName => ({
        colorName,
        colorHex: getBambuLabColorHex(colorName) || getColorHex(colorName) || null,
        imageUrl: ABS_COLOR_IMAGES[colorName.toLowerCase()] || null,
        variantId: null,  // No variant ID in fallback
      }));
      console.log(`[BambuLab] Using fallback colors WITH IMAGES for ABS: ${absColors.join(', ')}`);
    }
    
    console.log(`[BambuLab] Extracted ${colorVariants.length} color variants from ${url}: ${colorVariants.slice(0, 5).map(v => v.colorName).join(', ')}${colorVariants.length > 5 ? '...' : ''}`);
    
    // Extract weight (default 1000g for Bambu Lab spools)
    const weightGrams = extractWeightFromText(markdown) || 1000;
    
    // Check availability - default to true for Bambu Lab products
    // Only mark unavailable if explicitly "Sold Out" (with exact casing pattern)
    // Avoid false positives from general text containing "sold out"
    const soldOutIndicator = /(?:^|\s|>)Sold\s*Out(?:\s|<|$)/i.test(markdown) || 
                              /class="[^"]*sold-out[^"]*"/i.test(html) ||
                              /data-availability="sold-out"/i.test(html);
    const available = !soldOutIndicator;
    
    return {
      url,
      h1Title,
      price,
      imageUrl,
      colorVariants,
      weightGrams,
      available,
    };
    
  } catch (error) {
    console.error(`[BambuLab] Error scraping ${url}:`, error);
    return null;
  }
}

async function scrapeProductPages(
  products: DiscoveredProduct[], 
  firecrawlKey: string
): Promise<ScrapedProduct[]> {
  const scraped: ScrapedProduct[] = [];
  
  console.log(`[BambuLab] Scraping ${products.length} product pages...`);
  
  // Process in batches of 5 for parallel efficiency
  const batchSize = 5;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(p => scrapeProductPage(p.url, firecrawlKey))
    );
    
    for (const result of batchResults) {
      if (result && result.h1Title) {
        scraped.push(result);
      }
    }
    
    // Progress logging
    console.log(`[BambuLab] Scraped ${Math.min(i + batchSize, products.length)}/${products.length} pages`);
    
    // Rate limit: 500ms between batches
    if (i + batchSize < products.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`[BambuLab] Successfully scraped ${scraped.length} products`);
  return scraped;
}

// ============================================================================
// STEP 3: FILTER AND PROCESS PRODUCTS
// ============================================================================

interface ProcessedProduct {
  productTitle: string;  // Full title with color (e.g., "PLA Tough+ Black")
  baseTitle: string;     // Base H1 title without color (e.g., "PLA Tough+")
  colorName: string | null;
  colorHex: string | null;
  price: number | null;
  imageUrl: string | null;
  productUrl: string;
  variantId: string | null;  // Shopify variant ID for ?id= URL parameter
  weightGrams: number;
  available: boolean;
}

function processScrapedProducts(products: ScrapedProduct[], decisionLogger: ReturnType<typeof createDecisionLogger>): ProcessedProduct[] {
  const processed: ProcessedProduct[] = [];
  const filterStats = createFilterStats();
  
  for (const product of products) {
    // Skip non-filament products
    if (isBambuLabNonFilament(product.h1Title)) {
      decisionLogger.logFilter(product.url, product.h1Title, { weight: 0, diameter: 1.75 }, { included: false, reason: 'non-filament detected' });
      console.log(`[BambuLab] Skipping non-filament: ${product.h1Title}`);
      continue;
    }
    
    // Skip 2.85mm diameter products (Bambu Lab only sells 1.75mm but check title anyway)
    if (is285mmDiameter(product.h1Title)) {
      decisionLogger.logFilter(product.url, product.h1Title, { weight: 0, diameter: 2.85 }, { included: false, reason: '2.85mm diameter detected' });
      console.log(`[BambuLab] Skipping 2.85mm product: ${product.h1Title}`);
      continue;
    }
    
    // Determine weight with sample/pack detection
    let weightGrams = extractWeightFromText(product.h1Title) || product.weightGrams;
    
    // If no weight found and "Sample" in title, assume sample weight
    if (!weightGrams && /\bsample\b/i.test(product.h1Title)) {
      weightGrams = 50;
      decisionLogger.logFilter(product.url, product.h1Title, { weight: 50, diameter: 1.75 }, { included: false, reason: 'sample product detected (50g)' });
      console.log(`[BambuLab] Detected sample product (50g): ${product.h1Title}`);
      continue; // Skip samples
    }
    
    // Check for pack count (N-pack = N x 1kg)
    if (!weightGrams) {
      const packMatch = product.h1Title.match(/(\d+)[\s-]*pack/i);
      if (packMatch) {
        weightGrams = parseInt(packMatch[1], 10) * 1000;
        console.log(`[BambuLab] Detected ${packMatch[1]}-pack (${weightGrams}g): ${product.h1Title}`);
      }
    }
    
    // Default to 1kg only for non-sample, non-pack products
    if (!weightGrams) {
      weightGrams = 1000;
    }
    
    // Get product slug for CSV filtering
    const productSlug = extractProductSlug(product.url);
    const csvWhitelistedColors = getCSVWhitelistedColors(productSlug);
    const hasCSVColors = csvWhitelistedColors.length > 0;
    
    // Use color variants from scraping (which now include color-specific images)
    // If no colors found, try to assign a default color for single-color products
    let colorVariantsToProcess: ColorVariantData[] = product.colorVariants.length > 0 
      ? product.colorVariants 
      : [{
          colorName: getDefaultColorForProduct(product.h1Title) || '',
          colorHex: null,
          imageUrl: null,
          variantId: null,
        }].filter(v => v.colorName);  // Remove if no default color
    
    // If still no variants, create one without a color name
    if (colorVariantsToProcess.length === 0) {
      colorVariantsToProcess = [{
        colorName: '',
        colorHex: null,
        imageUrl: null,
        variantId: null,
      }];
    }
    
    // ========== CSV COLOR WHITELIST FILTER ==========
    // Only sync colors that exist in S5_PRODUCT_IMAGES or BAMBULAB_VARIANT_IDS
    if (hasCSVColors) {
      const originalCount = colorVariantsToProcess.length;
      colorVariantsToProcess = colorVariantsToProcess.filter(variant => {
        const normalizedColor = variant.colorName.toLowerCase().trim();
        const isInCSV = csvWhitelistedColors.some(c => 
          c === normalizedColor || 
          normalizedColor.includes(c) || 
          c.includes(normalizedColor)
        );
        if (!isInCSV && variant.colorName) {
          console.log(`[BambuLab] Skipping non-CSV color "${variant.colorName}" for ${productSlug}`);
          decisionLogger.logFilter(product.url, product.h1Title, { weight: weightGrams, diameter: 1.75 }, { 
            included: false, 
            reason: `color "${variant.colorName}" not in CSV whitelist` 
          });
        }
        return isInCSV || !variant.colorName; // Allow empty color names through
      });
      
      if (originalCount > colorVariantsToProcess.length) {
        console.log(`[BambuLab] CSV color filter: ${colorVariantsToProcess.length}/${originalCount} colors for ${productSlug}`);
      }
    }
    
    for (const colorVariant of colorVariantsToProcess) {
      // Apply variant filters
      const filterResult = shouldIncludeVariant(weightGrams, 1.75, product.h1Title);
      updateFilterStats(filterStats, filterResult);
      
      if (!filterResult.include) {
        decisionLogger.logFilter(product.url, product.h1Title, { weight: weightGrams, diameter: 1.75 }, { included: false, reason: filterResult.reason || 'filter failed' });
        console.log(`[BambuLab] Filtering: ${product.h1Title} (${filterResult.reason})`);
        continue;
      }
      
      decisionLogger.logFilter(product.url, product.h1Title, { weight: weightGrams, diameter: 1.75 }, { included: true, reason: 'passed all filters' });
      
      // Build full product title with color appended
      // e.g., "PLA Tough+" + "Black" -> "PLA Tough+ Black"
      const colorName = colorVariant.colorName || null;
      const productTitle = colorName 
        ? `${product.h1Title} ${colorName}`.trim()
        : product.h1Title;
      
      // Use color-specific image if available, otherwise fall back to product default
      const imageUrl = colorVariant.imageUrl || product.imageUrl;
      
      processed.push({
        productTitle,
        baseTitle: product.h1Title,
        colorName,
        colorHex: colorVariant.colorHex,
        price: product.price,
        imageUrl,
        productUrl: product.url,
        variantId: colorVariant.variantId,  // Pass through variant ID for URL
        weightGrams,
        available: product.available,
      });
    }
  }
  
  logFilterStats('Bambu Lab', filterStats);
  console.log(`[BambuLab] Processed ${processed.length} valid variants`);
  return processed;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    
    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    const dryRun = body.dryRun === true;
    
    console.log(`[BambuLab] Starting sync (cleanSlate: ${cleanSlate}, dryRun: ${dryRun})`);
    
    // ========================================================================
    // STEP 0: Create sync log entry
    // ========================================================================
    let syncLogId: string | null = null;
    
    if (!dryRun) {
      const { data: syncLog, error: syncLogError } = await supabase
        .from('brand_sync_logs')
        .insert({
          brand_slug: 'bambu-lab',
          sync_type: cleanSlate ? 'clean_slate' : 'incremental',
          status: 'running',
          started_at: new Date().toISOString(),
          triggered_by: 'manual',
        })
        .select('id')
        .single();
      
      if (syncLogError) {
        console.error('[BambuLab] Failed to create sync log:', syncLogError);
      }
      syncLogId = syncLog?.id;
    }
    
    // ========================================================================
    // STEP 1: Discover products from collection page
    // ========================================================================
    const discoveredProducts = await discoverProductsFromCollection(firecrawlKey);
    
    if (discoveredProducts.length === 0) {
      throw new Error('No product links discovered from collection page');
    }
    
    // ========================================================================
    // STEP 1.5: Filter discovered products against CSV whitelist
    // Only products with S5_PRODUCT_IMAGES entries will be synced
    // ========================================================================
    const whitelistedProducts = discoveredProducts.filter(product => {
      const slug = extractProductSlug(product.url);
      const isWhitelisted = CSV_PRODUCT_SLUGS.includes(slug);
      if (!isWhitelisted) {
        console.log(`[BambuLab] Skipping non-CSV product: ${slug}`);
      }
      return isWhitelisted;
    });
    
    console.log(`[BambuLab] CSV whitelist filter: ${whitelistedProducts.length}/${discoveredProducts.length} products accepted`);
    
    if (whitelistedProducts.length === 0) {
      throw new Error('No CSV-whitelisted products found - check S5_PRODUCT_IMAGES slugs match collection page');
    }
    
    // ========================================================================
    // STEP 2: Scrape each product page (only whitelisted products)
    // ========================================================================
    const scrapedProducts = await scrapeProductPages(whitelistedProducts, firecrawlKey);
    
    if (scrapedProducts.length === 0) {
      throw new Error('No products successfully scraped');
    }
    
    // ========================================================================
    // STEP 3: Process and filter products (with decision logging)
    // ========================================================================
    const decisionLogger = createDecisionLogger({ brandSlug: 'bambu-lab', syncLogId: syncLogId || undefined });
    const processedProducts = processScrapedProducts(scrapedProducts, decisionLogger);
    
    // ========================================================================
    // STEP 4: Safety validation (STRICT - throw error if below threshold)
    // ========================================================================
    if (processedProducts.length < BAMBULAB_SAFE_DELETE_THRESHOLD) {
      throw new Error(
        `Safety check failed: Only ${processedProducts.length} products processed, ` +
        `minimum ${BAMBULAB_SAFE_DELETE_THRESHOLD} required for clean slate sync`
      );
    }
    
    console.log(`[BambuLab] Products ready for insertion: ${processedProducts.length}`);
    
    // Dry run - return early with discovery results
    if (dryRun) {
      const duration = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          summary: {
            totalDiscovered: discoveredProducts.length,
            totalScraped: scrapedProducts.length,
            totalVariants: processedProducts.length,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
          },
          sampleProducts: processedProducts.slice(0, 10).map(p => ({
            title: p.productTitle,
            color: p.colorName,
            price: p.price,
            weight: p.weightGrams,
          })),
          duration: `${(duration / 1000).toFixed(1)}s`,
          duration_ms: duration,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ========================================================================
    // STEP 5: Clean slate deletion (if enabled)
    // ========================================================================
    if (cleanSlate) {
      console.log('[BambuLab] Performing clean slate deletion...');
      
      const { error: deleteError, count: deleteCount } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'bambu lab');
      
      if (deleteError) {
        console.error('[BambuLab] Delete error:', deleteError);
        throw new Error(`Failed to delete existing products: ${deleteError.message}`);
      }
      
      console.log(`[BambuLab] Deleted ${deleteCount || 0} existing products`);
    }
    
    // ========================================================================
    // STEP 6: Insert products with enrichment
    // ========================================================================
    const productsToInsert: any[] = [];
    let skipped = 0;
    let errors = 0;
    
    for (const product of processedProducts) {
      try {
        // Enrich product with material info, finish type, etc.
        // Use baseTitle for enrichment (material detection) but productTitle for display
        const config = getBambuLabProductLineConfig(product.baseTitle);
        const enrichment = enrichBambuLabProduct(product.baseTitle);
        
        // Use color hex from processing (already resolved), or fallback
        let colorHex = product.colorHex;
        if (!colorHex && product.colorName) {
          colorHex = getBambuLabColorHex(product.colorName) || getColorHex(product.colorName);
        }
        const colorFamily = product.colorName ? getColorFamily(product.colorName) : null;
        
        // Determine material from product line ID
        let material = 'PLA';
        const plId = enrichment.productLineId.toLowerCase();
        if (plId.includes('tpu')) material = 'TPU';
        else if (plId.includes('abs')) material = 'ABS';
        else if (plId.includes('asa')) material = 'ASA';
        else if (plId.includes('petg')) material = 'PETG';
        else if (plId.includes('pc-')) material = 'PC';
        else if (plId.includes('pa-') || plId.includes('pa6')) material = 'PA';
        else if (plId.includes('pet-cf')) material = 'PET-CF';
        else if (plId.includes('pps')) material = 'PPS';
        else if (plId.includes('pva')) material = 'PVA';
        else if (plId.includes('support')) material = 'Support';
        
        // Build variant-specific product URL with ?id= parameter
        // This ensures "Buy Now" links go directly to the selected color variant
        // PRIORITY ORDER:
        // 1. Use scraped variantId from __NEXT_DATA__ (if available)
        // 2. Look up from BAMBULAB_VARIANT_IDS hardcoded mapping
        // 3. Fall back to base product URL without variant ID
        
        // Extract product slug from URL for variant ID lookup
        const productSlugMatch = product.productUrl.match(/\/products\/([^\/\?]+)/);
        const productSlug = productSlugMatch ? productSlugMatch[1] : null;
        
        let variantUrl = product.productUrl;
        
        if (product.variantId) {
          // Use scraped variant ID
          variantUrl = `${product.productUrl}?id=${product.variantId}`;
        } else if (productSlug && product.colorName) {
          // Look up from hardcoded BAMBULAB_VARIANT_IDS mapping
          const normalizedColor = product.colorName.toLowerCase().trim();
          const mappedVariantId = BAMBULAB_VARIANT_IDS[productSlug]?.[normalizedColor];
          if (mappedVariantId) {
            variantUrl = `https://us.store.bambulab.com/products/${productSlug}?id=${mappedVariantId}`;
          }
        }
        
        // ========== TPU 85A/90A SPLITTING ==========
        // The product page "TPU 85A / TPU 90A" contains both hardness grades.
        // We need to assign each color to the correct product line based on TPU_HARDNESS_MAP.
        let finalProductLineId = enrichment.productLineId;
        let finalProductTitle = product.baseTitle;
        let finalMaterial = material;
        
        // Check if this is the combined TPU 85A/90A product page
        if (productSlug === 'tpu-85a-tpu-90a' && product.colorName) {
          const normalizedColor = product.colorName.toLowerCase().trim();
          const hardnessGrade = TPU_HARDNESS_MAP[normalizedColor];
          
          if (hardnessGrade === '85a') {
            finalProductLineId = 'bambulab__tpu__85a';
            finalProductTitle = 'TPU 85A';
            finalMaterial = 'TPU-85A';
            console.log(`[BambuLab] TPU split: ${product.colorName} → TPU 85A`);
          } else if (hardnessGrade === '90a') {
            finalProductLineId = 'bambulab__tpu__90a';
            finalProductTitle = 'TPU 90A';
            finalMaterial = 'TPU-90A';
            console.log(`[BambuLab] TPU split: ${product.colorName} → TPU 90A`);
          } else {
            // Default unmapped colors to 90A (more common)
            finalProductLineId = 'bambulab__tpu__90a';
            finalProductTitle = 'TPU 90A';
            finalMaterial = 'TPU-90A';
            console.log(`[BambuLab] TPU split: ${product.colorName} → TPU 90A (default)`);
          }
        }
        
        // Build product record - use baseTitle for product_title (matches page H1)
        // Color is stored separately in color_family field
        const productRecord = {
          product_title: finalProductTitle,  // H1 title without color (e.g., "PLA Tough+")
          vendor: BAMBULAB_STORE_INFO.vendor,
          material: finalMaterial,
          finish_type: enrichment.finishType,
          product_line_id: finalProductLineId,
          color_family: product.colorName || colorFamily,
          color_hex: colorHex,
          variant_price: product.price,
          variant_compare_at_price: null,
          variant_available: product.available,
          featured_image: product.imageUrl,
          product_url: variantUrl,  // Variant-specific URL with ?id= parameter
          net_weight_g: product.weightGrams,
          diameter_nominal_mm: 1.75,
          is_nozzle_abrasive: config.isAbrasive,
          high_speed_capable: config.highSpeedCapable,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
        };
        
        productsToInsert.push(productRecord);
        
      } catch (error) {
        console.error(`[BambuLab] Error processing ${product.productTitle}:`, error);
        errors++;
      }
    }
    
    // Batch insert
    let created = 0;
    let updated = 0; // Clean-slate sync only creates; updated tracked for completeness
    const batchSize = 50;
    
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      
      const { error: insertError, data: insertedData } = await supabase
        .from('filaments')
        .insert(batch)
        .select('id');
      
      if (insertError) {
        console.error(`[BambuLab] Batch insert error (${i}-${i + batch.length}):`, insertError);
        errors += batch.length;
      } else {
        created += insertedData?.length || batch.length;
      }
      
      // Progress logging
      if ((i + batchSize) % 100 === 0 || i + batchSize >= productsToInsert.length) {
        console.log(`[BambuLab] Inserted ${Math.min(i + batchSize, productsToInsert.length)}/${productsToInsert.length} products`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Update sync log
    if (syncLogId) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: errors > 0 && created === 0 ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round(duration / 1000),
          products_discovered: discoveredProducts.length,
          products_created: created,
          products_updated: updated,
          products_failed: errors,
          regions_synced: ['US'],
          regional_breakdown: {
            US: {
              updated: updated,
              created: created,
              skipped: skipped,
              errors: errors,
              products_found: discoveredProducts.length,
              duration_ms: duration,
            }
          },
        })
        .eq('id', syncLogId);
    }
    
    // Update brand product counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'bambu-lab' });
    
    console.log(`[BambuLab] Sync complete: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`);
    
    const result = {
      success: errors === 0 || (created + updated) > 0,
      summary: {
        totalDiscovered: discoveredProducts.length,
        totalScraped: scrapedProducts.length,
        created,
        updated,
        skipped,
        errors,
      },
      duration: `${(duration / 1000).toFixed(1)}s`,
      duration_ms: duration,
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[BambuLab] Sync failed:', error);
    const duration = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${(duration / 1000).toFixed(1)}s`,
        duration_ms: duration,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
