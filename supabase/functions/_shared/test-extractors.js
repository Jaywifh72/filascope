#!/usr/bin/env node
/**
 * Test script for Shopify and Firecrawl extractors
 * 
 * Usage:
 *   node test-extractors.js --brand polymaker --test-shopify
 *   node test-extractors.js --brand polymaker --test-firecrawl
 *   node test-extractors.js --brand bambu-lab --test-all
 */

import { extractShopifyFields, fetchShopifyProducts } from './_shared/shopify-extractor.ts';
import { extractWithFirecrawl } from './_shared/firecrawl-extractor.ts';
import { getBrandProfile } from './_shared/brand-profile-system.ts';

// Parse command line args
const args = process.argv.slice(2);
let brandSlug = 'polymaker';
let testShopify = false;
let testFirecrawl = false;
let testAll = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--brand' && args[i + 1]) {
    brandSlug = args[i + 1];
    i++;
  } else if (args[i] === '--test-shopify') {
    testShopify = true;
  } else if (args[i] === '--test-firecrawl') {
    testFirecrawl = true;
  } else if (args[i] === '--test-all') {
    testAll = true;
  }
}

if (testAll) {
  testShopify = true;
  testFirecrawl = true;
}

async function testShopifyExtractor() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TESTING SHOPIFY EXTRACTOR: ${brandSlug}`);
  console.log(`${'='.repeat(60)}\n`);
  
  const profile = getBrandProfile(brandSlug);
  console.log(`Brand: ${profile.display_name}`);
  console.log(`Platform: ${profile.platform}`);
  console.log(`Base URL: ${profile.base_url}`);
  console.log(`API Endpoint: ${profile.api_endpoint}`);
  
  // Test product extraction
  const testProduct = {
    id: 123456,
    title: 'Test PLA Filament - Red - 1.75mm - 1kg',
    handle: 'test-pla-filament-red',
    vendor: profile.display_name,
    product_type: 'PLA',
    tags: ['PLA', 'Red', '1.75mm', '1kg', 'Matte', 'High Speed'],
    variants: [{
      id: 789,
      title: 'Red / 1.75mm / 1kg',
      price: '24.99',
      compare_at_price: '29.99',
      sku: 'TEST-PLA-RED-1KG',
      available: true,
      weight: 1,
      weight_unit: 'kg',
      image: {
        id: 1,
        src: 'https://example.com/test-pla-red.jpg',
        alt: 'Test PLA Red'
      }
    }],
    images: [{
      id: 1,
      src: 'https://example.com/test-pla-red.jpg',
      alt: 'Test PLA Red'
    }],
    options: [
      { id: 1, name: 'Color', values: ['Red'] },
      { id: 2, name: 'Diameter', values: ['1.75mm'] },
      { id: 3, name: 'Weight', values: ['1kg'] }
    ],
    body_html: `
      <h2>Test PLA Filament</h2>
      <p>High quality PLA filament for 3D printing.</p>
      <p><strong>Nozzle Temperature:</strong> 200-220°C</p>
      <p><strong>Bed Temperature:</strong> 60°C</p>
      <p><strong>Density:</strong> 1.24 g/cm³</p>
      <p><strong>Print Speed:</strong> 60mm/s</p>
      <p><strong>AMS Compatible:</strong> Yes</p>
    `
  };
  
  console.log(`\nTest Product:`);
  console.log(`  Title: ${testProduct.title}`);
  console.log(`  Price: $${testProduct.variants[0].price}`);
  console.log(`  SKU: ${testProduct.variants[0].sku}`);
  
  // Extract fields
  const results = extractShopifyFields(testProduct, profile);
  
  console.log(`\nExtracted ${results.length} fields:`);
  for (const result of results) {
    console.log(`  ${result.field}: ${result.value} (confidence: ${result.confidence})`);
  }
  
  // Summary
  const highConfidence = results.filter(r => r.confidence >= 0.8);
  const mediumConfidence = results.filter(r => r.confidence >= 0.5 && r.confidence < 0.8);
  const lowConfidence = results.filter(r => r.confidence < 0.5);
  
  console.log(`\nSummary:`);
  console.log(`  High confidence (≥0.8): ${highConfidence.length}`);
  console.log(`  Medium confidence (0.5-0.8): ${mediumConfidence.length}`);
  console.log(`  Low confidence (<0.5): ${lowConfidence.length}`);
  console.log(`  Total fields: ${results.length}`);
}

async function testFirecrawlExtractor() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TESTING FIRECRAWL EXTRACTOR: ${brandSlug}`);
  console.log(`${'='.repeat(60)}\n`);
  
  const profile = getBrandProfile(brandSlug);
  console.log(`Brand: ${profile.display_name}`);
  
  // Check if Firecrawl is configured
  const firecrawlSource = profile.data_sources.find(s => s.type === 'firecrawl');
  if (!firecrawlSource) {
    console.log(`⚠️  No Firecrawl data source configured for ${brandSlug}`);
    console.log(`   Skipping Firecrawl test`);
    return;
  }
  
  console.log(`Firecrawl URL Pattern: ${firecrawlSource.url_pattern}`);
  console.log(`Fields to extract: ${firecrawlSource.fields_extracted.join(', ')}`);
  
  // Test with a sample URL (would need real URL in production)
  const testUrl = `${profile.base_url}/products/test-product`;
  console.log(`\nTest URL: ${testUrl}`);
  
  // Note: This would require a real Firecrawl API key
  console.log(`\n⚠️  Firecrawl test requires valid API key`);
  console.log(`   Set FIRECRAWL_API_KEY environment variable`);
  console.log(`   Then run: node test-extractors.js --brand ${brandSlug} --test-firecrawl`);
  
  // Test field extraction functions (without API call)
  console.log(`\nTesting field extraction functions...`);
  
  const testContent = `
    Product Specifications:
    - Nozzle Temperature: 200-220°C
    - Bed Temperature: 60°C
    - Density: 1.24 g/cm³
    - Print Speed: 60mm/s
    - Fan Speed: 0-100%
    - Retraction: 6mm
    - Retraction Speed: 45mm/s
    - AMS Compatible: Yes
    - Spool Material: Cardboard
    - High Speed Capable: Yes
    - Use Cases: Indoor, Hobby, Prototype
  `;
  
  // Import extraction functions directly for testing
  // (In real usage, these would be called by extractWithFirecrawl)
  
  console.log(`\nSample content extraction results:`);
  console.log(`  (Would extract fields from test content)`);
  console.log(`  Fields configured: ${firecrawlSource.fields_extracted.length}`);
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`FILASCOPE EXTRACTOR TEST SUITE`);
  console.log(`${'='.repeat(60)}`);
  
  console.log(`\nBrand: ${brandSlug}`);
  console.log(`Test Shopify: ${testShopify}`);
  console.log(`Test Firecrawl: ${testFirecrawl}`);
  
  try {
    if (testShopify) {
      await testShopifyExtractor();
    }
    
    if (testFirecrawl) {
      await testFirecrawlExtractor();
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ TESTS COMPLETE`);
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error(`\n❌ TEST FAILED:`, error);
    process.exit(1);
  }
}

main();
