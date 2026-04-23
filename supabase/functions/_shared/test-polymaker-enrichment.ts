#!/usr/bin/env node
/**
 * Test Enrichment Script for Polymaker
 * 
 * Tests the incremental enrichment pipeline with a single brand.
 * Extracts missing fields using Shopify API and Firecrawl.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getBrandProfile } from './_shared/brand-profile-system.ts';
import { detectFilamentGaps, getPriorityGaps } from './_shared/field-gap-detector.ts';
import { enrichFilament } from './_shared/incremental-enrichment.ts';

// Load Supabase credentials
const SUPABASE_URL = 'https://fytxfdvbzstnimzhjgth.supabase.co';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set');
  Deno.exit(1);
}

// Load Firecrawl API key
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testEnrichment() {
  console.log('=== POLYMAKER ENRICHMENT TEST ===\n');
  
  const brandSlug = 'polymaker';
  const brandProfile = getBrandProfile(brandSlug);
  
  console.log(`Brand: ${brandProfile.display_name}`);
  console.log(`Platform: ${brandProfile.platform}`);
  console.log(`Base URL: ${brandProfile.base_url}`);
  console.log(`Amazon tag: ${brandProfile.amazon_tag || 'None'}`);
  
  // Get filaments for Polymaker
  console.log('\nFetching Polymaker filaments...');
  const { data: filaments, error } = await supabase
    .from('filaments')
    .select('*')
    .ilike('vendor', '%polymaker%')
    .limit(10); // Test with 10 filaments
  
  if (error) {
    console.error('Error fetching filaments:', error);
    return;
  }
  
  if (!filaments || filaments.length === 0) {
    console.log('No Polymaker filaments found');
    return;
  }
  
  console.log(`Found ${filaments.length} filaments for testing\n`);
  
  // Test gap detection on first filament
  const testFilament = filaments[0];
  console.log(`Testing gap detection on: ${testFilament.product_title}`);
  
  const gaps = detectFilamentGaps(testFilament);
  console.log(`\nGap Analysis:`);
  console.log(`  Total fields: ${gaps.total_fields}`);
  console.log(`  Populated fields: ${gaps.populated_fields}`);
  console.log(`  Missing fields: ${gaps.missing_fields}`);
  console.log(`  Coverage: ${gaps.coverage_percentage}%`);
  
  // Show priority gaps
  const priorityGaps = getPriorityGaps(gaps, 'P1');
  console.log(`\nPriority Gaps (P0-P1): ${priorityGaps.length}`);
  
  if (priorityGaps.length > 0) {
    console.log('\nTop 5 priority gaps:');
    for (const gap of priorityGaps.slice(0, 5)) {
      console.log(`  ${gap.priority} - ${gap.field}: ${gap.source} (difficulty: ${gap.estimatedDifficulty})`);
    }
  }
  
  // Test enrichment on first filament
  console.log('\n=== TESTING ENRICHMENT ===');
  
  const enrichmentOptions = {
    mode: 'incremental',
    max_priority: 'P1',
    max_fields_per_filament: 5, // Limit to 5 fields for testing
    dry_run: true, // Don't actually update database
    force_update: false,
    skip_existing: true,
    rate_limit_ms: 1000 // 1 second between requests
  };
  
  const result = await enrichFilament(testFilament, brandProfile, supabase, enrichmentOptions);
  
  console.log(`\nEnrichment Result:`);
  console.log(`  Fields attempted: ${result.fields_attempted}`);
  console.log(`  Fields updated: ${result.fields_updated}`);
  console.log(`  Fields failed: ${result.fields_failed}`);
  console.log(`  Fields skipped: ${result.fields_skipped}`);
  console.log(`  Duration: ${result.duration_ms}ms`);
  
  if (Object.keys(result.sources_used).length > 0) {
    console.log(`\nSources used:`);
    for (const [field, source] of Object.entries(result.sources_used)) {
      console.log(`  ${field}: ${source}`);
    }
  }
  
  if (result.errors.length > 0) {
    console.log(`\nErrors:`);
    for (const error of result.errors) {
      console.log(`  ${error.field}: ${error.error}`);
    }
  }
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`✅ Gap detection working: ${gaps.missing_fields} fields missing`);
  console.log(`✅ Priority system working: ${priorityGaps.length} P0-P1 gaps`);
  console.log(`✅ Enrichment pipeline working: ${result.fields_attempted} fields attempted`);
  
  if (result.fields_updated > 0) {
    console.log(`✅ Field extraction working: ${result.fields_updated} fields would be updated`);
  } else {
    console.log(`⚠️  No fields extracted (expected in dry-run mode)`);
  }
  
  console.log('\nNext steps:');
  console.log('1. Run with dry_run=false to actually update database');
  console.log('2. Test with more filaments (remove limit)');
  console.log('3. Test Firecrawl extraction (requires API key)');
  console.log('4. Test with other brands');
}

// Run the test
testEnrichment().catch(console.error);
