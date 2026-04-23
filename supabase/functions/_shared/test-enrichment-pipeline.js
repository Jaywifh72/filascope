#!/usr/bin/env node
// Test updated enrichment pipeline with new extractors

import { getBrandProfile } from './brand-profile-system.ts';
import { detectFilamentGaps } from './field-gap-detector.ts';
import { enrichFilament } from './incremental-enrichment.ts';

// Test filament
const testFilament = {
  id: 'test-123',
  product_title: 'Polymaker PLA Pro - Black',
  vendor: 'Polymaker',
  material: 'PLA',
  variant_price: 24.99,
  featured_image: 'https://example.com/image.jpg',
  nozzle_temp_min_c: 190,
  nozzle_temp_max_c: 230,
  bed_temp_min_c: 50,
  bed_temp_max_c: 60,
  density_g_cm3: 1.24,
  product_url: 'https://us.polymaker.com/products/polymaker-pla-pro',
  amazon_link_us: 'https://www.amazon.com/dp/B08XYZ1234?tag=filascope-20'
};

async function testEnrichment() {
  console.log('Testing updated enrichment pipeline...');
  
  const brandProfile = getBrandProfile('polymaker');
  console.log(`Brand: ${brandProfile.display_name}`);
  
  // Test gap detection
  const gaps = detectFilamentGaps(testFilament);
  console.log(`\nGap Analysis:`);
  console.log(`  Total fields: ${gaps.total_fields}`);
  console.log(`  Populated: ${gaps.populated_fields}`);
  console.log(`  Missing: ${gaps.missing_fields}`);
  console.log(`  Coverage: ${gaps.coverage_percentage}%`);
  
  // Test enrichment (dry run)
  const result = await enrichFilament(testFilament, brandProfile, null, {
    mode: 'incremental',
    max_priority: 'P1',
    max_fields_per_filament: 5,
    dry_run: true,
    force_update: false,
    skip_existing: true,
    rate_limit_ms: 500
  });
  
  console.log(`\nEnrichment Result:`);
  console.log(`  Fields attempted: ${result.fields_attempted}`);
  console.log(`  Fields updated: ${result.fields_updated}`);
  console.log(`  Fields failed: ${result.fields_failed}`);
  console.log(`  Duration: ${result.duration_ms}ms`);
  
  if (Object.keys(result.sources_used).length > 0) {
    console.log(`\nSources used:`);
    for (const [field, source] of Object.entries(result.sources_used)) {
      console.log(`  ${field}: ${source}`);
    }
  }
  
  console.log('\n✅ Enrichment pipeline test complete');
}

testEnrichment().catch(console.error);
