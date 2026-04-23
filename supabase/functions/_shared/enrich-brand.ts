#!/usr/bin/env node
/**
 * Brand Enrichment Script
 * 
 * Enriches filaments for a specific brand using all available extractors.
 * Called by scrapemaster orchestrator.
 * 
 * Usage:
 *   node enrich-brand.js --brand polymaker --max-filaments 50
 *   node enrich-brand.js --brand 3dhojor --max-filaments 100
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getBrandProfile } from './_shared/brand-profile-system.ts';
import { detectFilamentGaps, getPriorityGaps } from './_shared/field-gap-detector.ts';
import { enrichFilament } from './_shared/incremental-enrichment.ts';

// Parse command line args
const args = process.argv.slice(2);
let brandSlug = '';
let maxFilaments = 50;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--brand' && args[i + 1]) {
    brandSlug = args[i + 1];
    i++;
  } else if (args[i] === '--max-filaments' && args[i + 1]) {
    maxFilaments = parseInt(args[i + 1], 10);
    i++;
  }
}

if (!brandSlug) {
  console.error('ERROR: --brand is required');
  Deno.exit(1);
}

// Load Supabase credentials
const SUPABASE_URL = 'https://fytxfdvbzstnimzhjgth.supabase.co';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function enrichBrand() {
  console.log(`=== BRAND ENRICHMENT: ${brandSlug.toUpperCase()} ===\n`);
  
  const brandProfile = getBrandProfile(brandSlug);
  
  console.log(`Brand: ${brandProfile.display_name}`);
  console.log(`Platform: ${brandProfile.platform}`);
  console.log(`Base URL: ${brandProfile.base_url}`);
  console.log(`Amazon tag: ${brandProfile.amazon_tag || 'None'}`);
  
  // Get filaments for brand
  console.log(`\nFetching filaments (limit: ${maxFilaments})...`);
  const { data: filaments, error } = await supabase
    .from('filaments')
    .select('*')
    .ilike('vendor', `%${brandProfile.display_name}%`)
    .limit(maxFilaments);
  
  if (error) {
    console.error('Error fetching filaments:', error);
    return;
  }
  
  if (!filaments || filaments.length === 0) {
    console.log('No filaments found');
    return;
  }
  
  console.log(`Found ${filaments.length} filaments\n`);
  
  // Process each filament
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let totalFieldsUpdated = 0;
  
  for (let i = 0; i < filaments.length; i++) {
    const filament = filaments[i];
    console.log(`[${i + 1}/${filaments.length}] Processing: ${filament.product_title?.slice(0, 40)}...`);
    
    // Detect gaps
    const gaps = detectFilamentGaps(filament);
    
    if (gaps.missing_fields === 0) {
      console.log('  ✅ All fields populated, skipping');
      skippedCount++;
      continue;
    }
    
    console.log(`  Missing: ${gaps.missing_fields} fields`);
    
    // Get priority gaps
    const priorityGaps = getPriorityGaps(gaps, 'P1');
    
    if (priorityGaps.length === 0) {
      console.log('  ⚠️  No priority gaps, skipping');
      skippedCount++;
      continue;
    }
    
    console.log(`  Priority gaps: ${priorityGaps.length}`);
    
    // Enrich filament
    try {
      const result = await enrichFilament(filament, brandProfile, supabase, {
        mode: 'incremental',
        max_priority: 'P1',
        max_fields_per_filament: 5,
        dry_run: false,
        force_update: false,
        skip_existing: true,
        rate_limit_ms: 500
      });
      
      if (result.fields_updated > 0) {
        console.log(`  ✅ Updated ${result.fields_updated} fields`);
        updatedCount++;
        totalFieldsUpdated += result.fields_updated;
      } else {
        console.log(`  ⚠️  No fields updated`);
        skippedCount++;
      }
      
      if (result.fields_failed > 0) {
        console.log(`  ❌ Failed to update ${result.fields_failed} fields`);
        errorCount++;
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n=== ENRICHMENT SUMMARY ===');
  console.log(`Total filaments: ${filaments.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total fields updated: ${totalFieldsUpdated}`);
  console.log(`Success rate: ${((updatedCount / filaments.length) * 100).toFixed(1)}%`);
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    brand: brandSlug,
    display_name: brandProfile.display_name,
    total_filaments: filaments.length,
    updated: updatedCount,
    skipped: skippedCount,
    errors: errorCount,
    total_fields_updated: totalFieldsUpdated,
    success_rate: `${((updatedCount / filaments.length) * 100).toFixed(1)}%`
  };
  
  const fs = require('fs');
  const reportPath = `/home/jay/openclaw/reports/scrapemaster-v2/enrichment-${brandSlug}-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n✅ Report saved to: ${reportPath}`);
}

// Run enrichment
enrichBrand().catch(console.error);
