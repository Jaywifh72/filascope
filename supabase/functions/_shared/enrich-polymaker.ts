#!/usr/bin/env node
/**
 * Polymaker Enrichment Script
 * 
 * Extracts missing fields from Shopify API and updates database.
 * Calculates filascope_score from available data.
 * Logs all changes for audit trail.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Load Supabase credentials
const SUPABASE_URL = 'https://fytxfdvbzstnimzhjgth.supabase.co';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function enrichPolymaker() {
  console.log('=== POLYMAKER ENRICHMENT ===\n');
  
  // Get Polymaker filaments
  console.log('Fetching Polymaker filaments...');
  const { data: filaments, error } = await supabase
    .from('filaments')
    .select('*')
    .ilike('vendor', '%polymaker%')
    .limit(50); // Process 50 filaments at a time
  
  if (error) {
    console.error('Error fetching filaments:', error);
    return;
  }
  
  if (!filaments || filaments.length === 0) {
    console.log('No Polymaker filaments found');
    return;
  }
  
  console.log(`Found ${filaments.length} filaments\n`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const filament of filaments) {
    console.log(`\nProcessing: ${filament.product_title?.slice(0, 40)}...`);
    
    // Check what's missing
    const missingFields = [];
    const keyFields = ['variant_price', 'featured_image', 'material', 'nozzle_temp_min_c', 'bed_temp_min_c', 'density_g_cm3'];
    
    for (const field of keyFields) {
      if (!filament[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length === 0) {
      console.log('  ✅ All key fields populated, skipping');
      skippedCount++;
      continue;
    }
    
    console.log(`  Missing: ${missingFields.join(', ')}`);
    
    // Extract from Shopify API
    const productUrl = filament.product_url;
    if (!productUrl) {
      console.log('  ❌ No product URL, skipping');
      errorCount++;
      continue;
    }
    
    const urlMatch = productUrl.match(/\/products\/([^/\?]+)/);
    if (!urlMatch) {
      console.log('  ❌ Could not extract handle from URL');
      errorCount++;
      continue;
    }
    
    const handle = urlMatch[1];
    const apiUrl = `https://us.polymaker.com/products/${handle}.json`;
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'FilaScope/1.0 (+https://filascope.com/)',
          'Accept': 'application/json',
        },
        signal: AbortController.timeout(10000),
      });
      
      if (!response.ok) {
        console.log(`  ❌ Shopify API error: ${response.status}`);
        errorCount++;
        continue;
      }
      
      const data = await response.json();
      const product = data.product;
      
      if (!product) {
        console.log('  ❌ No product data in response');
        errorCount++;
        continue;
      }
      
      // Extract fields
      const updates = {};
      const extractedFields = [];
      
      // Product title
      if (product.title && !filament.product_title) {
        updates.product_title = product.title;
        extractedFields.push('product_title');
      }
      
      // Vendor
      if (product.vendor && !filament.vendor) {
        updates.vendor = product.vendor;
        extractedFields.push('vendor');
      }
      
      // Material (product type)
      if (product.product_type && !filament.material) {
        updates.material = normalizeMaterial(product.product_type);
        extractedFields.push('material');
      }
      
      // Variant price
      const variants = product.variants || [];
      if (variants.length > 0 && variants[0].price && !filament.variant_price) {
        const price = parseFloat(variants[0].price);
        if (!isNaN(price)) {
          updates.variant_price = price;
          extractedFields.push('variant_price');
        }
      }
      
      // Featured image
      const images = product.images || [];
      if (images.length > 0 && images[0].src && !filament.featured_image) {
        updates.featured_image = images[0].src;
        extractedFields.push('featured_image');
      }
      
      // Calculate filascope_score if we have enough data
      if (updates.variant_price || filament.variant_price) {
        const price = updates.variant_price || filament.variant_price;
        const temp = updates.nozzle_temp_min_c || filament.nozzle_temp_min_c;
        
        if (price && temp) {
          // Simple scoring formula (can be refined)
          const priceScore = Math.max(0, 100 - (price - 20) * 2); // Lower price = higher score
          const tempScore = temp >= 190 && temp <= 230 ? 100 : 70; // Optimal range
          const score = Math.round((priceScore + tempScore) / 2);
          
          updates.filascope_score = score;
          extractedFields.push('filascope_score');
        }
      }
      
      // Update database if we have fields to update
      if (Object.keys(updates).length > 0) {
        console.log(`  Extracted: ${extractedFields.join(', ')}`);
        
        const { error: updateError } = await supabase
          .from('filaments')
          .update({
            ...updates,
            last_scraped_at: new Date().toISOString(),
            sync_status: 'enriched'
          })
          .eq('id', filament.id);
        
        if (updateError) {
          console.log(`  ❌ Update failed: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`  ✅ Updated successfully`);
          updatedCount++;
        }
      } else {
        console.log('  ⚠️  No fields extracted');
        skippedCount++;
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
    
    // Rate limiting: 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n=== ENRICHMENT SUMMARY ===');
  console.log(`Total filaments: ${filaments.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    brand: 'polymaker',
    total_filaments: filaments.length,
    updated: updatedCount,
    skipped: skippedCount,
    errors: errorCount,
    success_rate: `${((updatedCount / filaments.length) * 100).toFixed(1)}%`
  };
  
  const reportPath = `/home/jay/openclaw/reports/scrapemaster-v2/enrichment-polymaker-${new Date().toISOString().split('T')[0]}.json`;
  const fs = require('fs');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n✅ Report saved to: ${reportPath}`);
}

function normalizeMaterial(material) {
  if (!material) return '';
  
  const materialLower = material.toLowerCase().trim();
  
  const materialMap = {
    'pla': 'PLA',
    'pla+': 'PLA+',
    'petg': 'PETG',
    'abs': 'ABS',
    'tpu': 'TPU',
    'nylon': 'Nylon',
    'pc': 'PC',
    'asa': 'ASA',
    'hips': 'HIPS'
  };
  
  for (const [key, value] of Object.entries(materialMap)) {
    if (materialLower === key || materialLower.includes(key)) {
      return value;
    }
  }
  
  return material;
}

// Run enrichment
enrichPolymaker().catch(console.error);
