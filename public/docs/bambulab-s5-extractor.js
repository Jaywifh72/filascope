#!/usr/bin/env node
/**
 * Bambu Lab S5 Image GUID Extractor
 * 
 * This script automates the extraction of S5 image GUIDs from Bambu Lab product pages
 * by using Puppeteer to click each color swatch and capture the network requests.
 * 
 * Usage:
 *   npm install puppeteer
 *   node scripts/bambulab-s5-extractor.js
 * 
 * Output:
 *   - scripts/output/s5-guids.json (raw extraction data)
 *   - scripts/output/s5-product-images.ts (ready to paste into sync function)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = 'https://us.store.bambulab.com/products/';

// Products to extract, organized by priority
const PRODUCTS_TO_EXTRACT = {
  // HIGH PRIORITY - Most popular product lines
  'pla-basic-filament': { expectedColors: 30, name: 'PLA Basic' },
  'pla-matte': { expectedColors: 24, name: 'PLA Matte' },
  'pla-silk-upgrade': { expectedColors: 13, name: 'PLA Silk+' },
  'pla-translucent': { expectedColors: 10, name: 'PLA Translucent' },
  
  // MEDIUM PRIORITY - Specialty PLA
  'pla-silk-multicolor': { expectedColors: 5, name: 'PLA Silk Multi-Color' },
  'pla-basic-gradient': { expectedColors: 3, name: 'PLA Basic Gradient' },
  'pla-sparkle': { expectedColors: 6, name: 'PLA Sparkle' },
  'pla-metal': { expectedColors: 5, name: 'PLA Metal' },
  'pla-galaxy': { expectedColors: 3, name: 'PLA Galaxy' },
  'pla-wood': { expectedColors: 4, name: 'PLA Wood' },
  'pla-glow': { expectedColors: 5, name: 'PLA Glow' },
  'pla-marble': { expectedColors: 2, name: 'PLA Marble' },
  'pla-cf': { expectedColors: 7, name: 'PLA-CF' },
  
  // LOW PRIORITY - Engineering materials
  'petg-basic': { expectedColors: 10, name: 'PETG Basic' },
  'petg-cf': { expectedColors: 6, name: 'PETG-CF' },
  'abs-gf': { expectedColors: 8, name: 'ABS-GF' },
  'pa6-gf': { expectedColors: 8, name: 'PA6-GF' },
  'asa': { expectedColors: 5, name: 'ASA' },
  'tpu-95a-hf': { expectedColors: 7, name: 'TPU 95A HF' },
  'support-for-pla': { expectedColors: 2, name: 'Support for PLA' },
  'support-w': { expectedColors: 1, name: 'Support W' },
  'paht-cf': { expectedColors: 1, name: 'PAHT-CF' },
  'pa6-cf': { expectedColors: 1, name: 'PA6-CF' },
  'pa-cf': { expectedColors: 1, name: 'PA-CF' },
  'pet-cf': { expectedColors: 2, name: 'PET-CF' },
  'pc': { expectedColors: 3, name: 'PC' },
};

// Timing configuration
const CONFIG = {
  delayBetweenSwatches: 2000,    // ms to wait after clicking swatch
  delayBetweenProducts: 5000,    // ms to wait between products
  pageLoadTimeout: 30000,        // ms to wait for page load
  maxRetries: 3,                 // retries per swatch if no S5 captured
  headless: false,               // set to true for background execution
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract GUID from S5 CDN URL
 * @param {string} url - Full CDN URL like https://store.bblcdn.com/s5/default/abc123.jpg
 * @returns {string|null} - 32-character GUID or null
 */
function extractGuidFromUrl(url) {
  const match = url.match(/\/s5\/default\/([a-f0-9]{32})\./i);
  return match ? match[1] : null;
}

/**
 * Normalize color name for consistent mapping
 * @param {string} color - Raw color name from page
 * @returns {string} - Normalized lowercase color name
 */
function normalizeColorName(color) {
  return color
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[""'']/g, '')
    .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical notes
    .trim();
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

/**
 * Save results to JSON file
 * @param {Object} results - Extraction results
 * @param {string} outputDir - Output directory path
 */
function saveJsonResults(results, outputDir) {
  const jsonPath = path.join(outputDir, 's5-guids.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 JSON results saved to: ${jsonPath}`);
}

/**
 * Generate TypeScript code for S5_PRODUCT_IMAGES constant
 * @param {Object} results - Extraction results by product slug
 * @returns {string} - TypeScript code ready to paste
 */
function generateTypeScriptCode(results) {
  let code = `// Generated S5_PRODUCT_IMAGES additions
// Generated at: ${new Date().toISOString()}
// Paste this into sync-bambulab-products/index.ts S5_PRODUCT_IMAGES constant

`;
  
  for (const [slug, data] of Object.entries(results)) {
    if (!data.colors || Object.keys(data.colors).length === 0) continue;
    
    code += `  '${slug}': {\n`;
    
    // Sort colors alphabetically for consistency
    const sortedColors = Object.entries(data.colors).sort((a, b) => a[0].localeCompare(b[0]));
    
    for (const [color, guid] of sortedColors) {
      code += `    '${color}': s5Url('${guid}'),\n`;
    }
    
    code += `  },\n\n`;
  }
  
  return code;
}

/**
 * Save TypeScript code to file
 * @param {Object} results - Extraction results
 * @param {string} outputDir - Output directory path
 */
function saveTypeScriptCode(results, outputDir) {
  const tsCode = generateTypeScriptCode(results);
  const tsPath = path.join(outputDir, 's5-product-images.ts');
  fs.writeFileSync(tsPath, tsCode);
  console.log(`📁 TypeScript code saved to: ${tsPath}`);
}

// ============================================================================
// MAIN EXTRACTION LOGIC
// ============================================================================

/**
 * Extract S5 GUIDs from a single product page
 * @param {Object} page - Puppeteer page instance
 * @param {string} slug - Product slug
 * @param {Object} productInfo - Product configuration
 * @returns {Object} - Extracted color -> GUID mapping
 */
async function extractProductS5Images(page, slug, productInfo) {
  const url = `${BASE_URL}${slug}`;
  const colors = {};
  let capturedGuid = null;
  
  console.log(`\n🔍 Extracting: ${productInfo.name} (${slug})`);
  console.log(`   URL: ${url}`);
  console.log(`   Expected colors: ${productInfo.expectedColors}`);
  
  // Setup network listener for S5 image requests
  const responseHandler = async (response) => {
    const responseUrl = response.url();
    if (responseUrl.includes('store.bblcdn.com/s5/default/')) {
      const guid = extractGuidFromUrl(responseUrl);
      if (guid) {
        capturedGuid = guid;
      }
    }
  };
  
  page.on('response', responseHandler);
  
  try {
    // Navigate to product page
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: CONFIG.pageLoadTimeout 
    });
    
    // Wait for swatches to load
    await sleep(2000);
    
    // Find all color swatches - try multiple selectors
    const swatchSelectors = [
      '[data-testid="color-swatch"]',
      '[class*="color-swatch"]',
      '[class*="variant-swatch"]',
      '[class*="ColorSelector"] button',
      '[class*="colorSelector"] button',
      'button[aria-label*="color"]',
      '[class*="swatch"]',
    ];
    
    let swatches = [];
    for (const selector of swatchSelectors) {
      swatches = await page.$$(selector);
      if (swatches.length > 0) {
        console.log(`   Found ${swatches.length} swatches using: ${selector}`);
        break;
      }
    }
    
    if (swatches.length === 0) {
      console.log(`   ⚠️  No swatches found! Trying alternative approach...`);
      
      // Try to find any clickable color elements
      swatches = await page.$$('img[alt*="color"], img[alt*="Color"], [title*="color"], [title*="Color"]');
      if (swatches.length > 0) {
        console.log(`   Found ${swatches.length} alternative color elements`);
      }
    }
    
    // Extract current color from page title or selected state
    const getColorName = async () => {
      // Try multiple methods to get current color name
      const colorName = await page.evaluate(() => {
        // Method 1: Look for selected swatch aria-label
        const selected = document.querySelector('[aria-selected="true"], [class*="selected"], [class*="active"]');
        if (selected) {
          const label = selected.getAttribute('aria-label') || selected.getAttribute('title');
          if (label) return label;
        }
        
        // Method 2: Look for color name in page
        const colorEl = document.querySelector('[class*="colorName"], [class*="color-name"], [class*="variant-name"]');
        if (colorEl) return colorEl.textContent;
        
        // Method 3: Parse from H1 or product title
        const h1 = document.querySelector('h1');
        if (h1) {
          const text = h1.textContent;
          // Extract color from title like "PLA Basic - Jade White"
          const match = text.match(/[-–—]\s*(.+?)(?:\s*-|\s*$)/);
          if (match) return match[1];
        }
        
        return null;
      });
      
      return colorName;
    };
    
    // Click each swatch and capture S5 image
    for (let i = 0; i < swatches.length; i++) {
      const swatch = swatches[i];
      capturedGuid = null;
      
      // Get swatch label before clicking
      let colorName = await swatch.evaluate(el => {
        return el.getAttribute('aria-label') || 
               el.getAttribute('title') || 
               el.getAttribute('alt') ||
               el.textContent?.trim();
      });
      
      // Click the swatch
      try {
        await swatch.click();
      } catch (e) {
        console.log(`   ⚠️  Could not click swatch ${i + 1}: ${e.message}`);
        continue;
      }
      
      // Wait for S5 image to load
      await sleep(CONFIG.delayBetweenSwatches);
      
      // If we didn't get color name from swatch, try from page
      if (!colorName) {
        colorName = await getColorName();
      }
      
      // Retry if no GUID captured
      let retries = 0;
      while (!capturedGuid && retries < CONFIG.maxRetries) {
        retries++;
        console.log(`   ⏳ Retry ${retries}/${CONFIG.maxRetries} for swatch ${i + 1}...`);
        await swatch.click();
        await sleep(CONFIG.delayBetweenSwatches);
      }
      
      if (capturedGuid && colorName) {
        const normalizedColor = normalizeColorName(colorName);
        colors[normalizedColor] = capturedGuid;
        console.log(`   ✅ ${normalizedColor}: ${capturedGuid.substring(0, 8)}...`);
      } else if (capturedGuid) {
        // Use index as fallback color name
        const fallbackColor = `color_${i + 1}`;
        colors[fallbackColor] = capturedGuid;
        console.log(`   ⚠️  ${fallbackColor}: ${capturedGuid.substring(0, 8)}... (no color name found)`);
      } else {
        console.log(`   ❌ Swatch ${i + 1}: No S5 image captured`);
      }
    }
    
  } catch (error) {
    console.error(`   ❌ Error extracting ${slug}: ${error.message}`);
  } finally {
    page.off('response', responseHandler);
  }
  
  const extractedCount = Object.keys(colors).length;
  console.log(`   📊 Extracted: ${extractedCount}/${productInfo.expectedColors} colors`);
  
  return colors;
}

/**
 * Main extraction function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Bambu Lab S5 Image GUID Extractor');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Products to extract: ${Object.keys(PRODUCTS_TO_EXTRACT).length}`);
  console.log(`  Total expected colors: ~145`);
  console.log(`  Headless mode: ${CONFIG.headless}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const outputDir = ensureOutputDir();
  const results = {};
  
  // Check for existing partial results
  const jsonPath = path.join(outputDir, 's5-guids.json');
  if (fs.existsSync(jsonPath)) {
    const existingResults = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`📂 Found existing results with ${Object.keys(existingResults).length} products`);
    console.log('   Skipping already-extracted products...\n');
    Object.assign(results, existingResults);
  }
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 },
  });
  
  const page = await browser.newPage();
  
  // Set user agent to avoid bot detection
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  
  let processedCount = 0;
  const totalProducts = Object.keys(PRODUCTS_TO_EXTRACT).length;
  
  try {
    for (const [slug, productInfo] of Object.entries(PRODUCTS_TO_EXTRACT)) {
      processedCount++;
      
      // Skip if already extracted
      if (results[slug] && Object.keys(results[slug].colors || {}).length > 0) {
        console.log(`\n⏭️  Skipping ${productInfo.name} (already extracted)`);
        continue;
      }
      
      console.log(`\n[${ processedCount}/${totalProducts}] Processing...`);
      
      const colors = await extractProductS5Images(page, slug, productInfo);
      
      results[slug] = {
        name: productInfo.name,
        expectedColors: productInfo.expectedColors,
        extractedColors: Object.keys(colors).length,
        colors: colors,
        extractedAt: new Date().toISOString(),
      };
      
      // Save partial results after each product
      saveJsonResults(results, outputDir);
      
      // Delay before next product
      if (processedCount < totalProducts) {
        console.log(`   ⏳ Waiting ${CONFIG.delayBetweenProducts / 1000}s before next product...`);
        await sleep(CONFIG.delayBetweenProducts);
      }
    }
    
  } finally {
    await browser.close();
  }
  
  // Generate final output
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  EXTRACTION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Summary
  let totalExtracted = 0;
  let totalExpected = 0;
  
  for (const [slug, data] of Object.entries(results)) {
    totalExtracted += data.extractedColors || 0;
    totalExpected += data.expectedColors || 0;
    
    const status = data.extractedColors >= data.expectedColors ? '✅' : 
                   data.extractedColors > 0 ? '⚠️' : '❌';
    console.log(`  ${status} ${data.name}: ${data.extractedColors}/${data.expectedColors}`);
  }
  
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Total: ${totalExtracted}/${totalExpected} colors extracted`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Save final outputs
  saveJsonResults(results, outputDir);
  saveTypeScriptCode(results, outputDir);
  
  console.log('\n✨ Done! Copy the TypeScript code from the output file into');
  console.log('   supabase/functions/sync-bambulab-products/index.ts');
  console.log('   (S5_PRODUCT_IMAGES constant)\n');
}

// Run the script
main().catch(console.error);
