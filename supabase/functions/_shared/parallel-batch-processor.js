#!/usr/bin/env node
/**
 * FILASCOPE PARALLEL BATCH PROCESSOR
 * 
 * Processes multiple brands in parallel for maximum throughput.
 * Handles rate limiting, error recovery, and progress tracking.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Configuration
const CONFIG = {
  auditDir: process.env.HOME + '/openclaw/reports/scrapemaster-v2',
  logDir: process.env.HOME + '/openclaw/logs',
  maxConcurrent: 3,        // Max parallel brand processes
  timeoutPerBrand: 120,    // Seconds per brand
  retryAttempts: 2,        // Retry failed brands
  retryDelay: 5000,        // Delay between retries (ms)
  priorityBrands: [        // Brands to process first
    'bambu-lab', 'polymaker', 'elegoo', 'creality', 'anycubic',
    'esun', 'prusament', 'overture', 'hatchbox', 'sunlu'
  ]
};

// Ensure directories exist
if (!existsSync(CONFIG.logDir)) {
  mkdirSync(CONFIG.logDir, { recursive: true });
}

// Load brand list
function loadBrands() {
  const brands = [];
  try {
    const files = readdirSync(CONFIG.auditDir);
    for (const file of files) {
      if (file.startsWith('audit-') && file.endsWith('.json') && !file.includes('summary')) {
        try {
          const data = JSON.parse(readFileSync(join(CONFIG.auditDir, file), 'utf8'));
          brands.push({
            slug: data.brand_slug,
            name: data.display_name || data.brand_slug,
            coverage: data.overall_coverage || 0,
            status: data.status,
            priority: CONFIG.priorityBrands.includes(data.brand_slug) ? 1 : 2
          });
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Error loading brands:', e.message);
  }
  
  // Sort by priority, then by coverage (lowest first)
  return brands.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.coverage - b.coverage;
  });
}

// Process a single brand
async function processBrand(brand, attempt = 1) {
  const startTime = Date.now();
  const logFile = join(CONFIG.logDir, `batch-${brand.slug}-${Date.now()}.log`);
  
  console.log(`\n🔄 Processing: ${brand.name} (attempt ${attempt}/${CONFIG.retryAttempts + 1})`);
  console.log(`   Coverage: ${brand.coverage}% | Status: ${brand.status}`);
  
  try {
    // Run the scraper orchestrator for this brand
    const cmd = `timeout ${CONFIG.timeoutPerBrand} bash $HOME/openclaw/scripts/scrapemaster-orchestrator-v2.sh --enrich --brands ${brand.slug} --mode incremental 2>&1 | tee ${logFile}`;
    
    const output = execSync(cmd, {
      stdio: 'pipe',
      timeout: CONFIG.timeoutPerBrand * 1000,
      encoding: 'utf8'
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Check for success indicators
    const success = output.includes('✅') && !output.includes('❌');
    const coverageMatch = output.match(/coverage:\s*(\d+\.?\d*)%/i);
    const newCoverage = coverageMatch ? parseFloat(coverageMatch[1]) : brand.coverage;
    
    console.log(`   ${success ? '✅' : '⚠️'} Completed in ${duration}s | New coverage: ${newCoverage}%`);
    
    return {
      brand: brand.slug,
      name: brand.name,
      success,
      duration: parseFloat(duration),
      oldCoverage: brand.coverage,
      newCoverage,
      coverageChange: newCoverage - brand.coverage,
      attempt,
      logFile
    };
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`   ❌ Failed after ${duration}s: ${error.message}`);
    
    // Retry logic
    if (attempt <= CONFIG.retryAttempts) {
      console.log(`   ⏳ Retrying in ${CONFIG.retryDelay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      return processBrand(brand, attempt + 1);
    }
    
    return {
      brand: brand.slug,
      name: brand.name,
      success: false,
      duration: parseFloat(duration),
      error: error.message,
      attempt,
      logFile
    };
  }
}

// Process brands in batches
async function processBatch(brands) {
  const results = [];
  const batches = [];
  
  // Create batches of MAX_CONCURRENT brands
  for (let i = 0; i < brands.length; i += CONFIG.maxConcurrent) {
    batches.push(brands.slice(i, i + CONFIG.maxConcurrent));
  }
  
  console.log(`\n📊 Processing ${brands.length} brands in ${batches.length} batches (max ${CONFIG.maxConcurrent} concurrent)\n`);
  
  // Process batches sequentially, brands within batch in parallel
  for (let batchNum = 0; batchNum < batches.length; batchNum++) {
    const batch = batches[batchNum];
    console.log(`\n━━━ Batch ${batchNum + 1}/${batches.length} ━━━`);
    
    // Process batch in parallel
    const batchPromises = batch.map(brand => processBrand(brand));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Brief pause between batches
    if (batchNum < batches.length - 1) {
      console.log('\n⏸️  Pausing 3s between batches...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  return results;
}

// Generate batch report
function generateReport(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const avgCoverageChange = successful.reduce((sum, r) => sum + r.coverageChange, 0) / successful.length;
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalBrands: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: Math.round((successful.length / results.length) * 100 * 10) / 10,
      avgDuration: Math.round(avgDuration * 10) / 10,
      avgCoverageChange: Math.round(avgCoverageChange * 10) / 10,
      totalDuration: Math.round(results.reduce((sum, r) => sum + r.duration, 0))
    },
    successfulBrands: successful.map(r => ({
      name: r.name,
      oldCoverage: r.oldCoverage,
      newCoverage: r.newCoverage,
      change: r.coverageChange,
      duration: r.duration
    })),
    failedBrands: failed.map(r => ({
      name: r.name,
      error: r.error,
      attempts: r.attempt
    })),
    topImprovements: successful
      .sort((a, b) => b.coverageChange - a.coverageChange)
      .slice(0, 10)
      .map(r => ({
        name: r.name,
        change: r.coverageChange,
        newCoverage: r.newCoverage
      }))
  };
  
  return report;
}

// Main execution
console.log('🚀 FilaScope Parallel Batch Processor');
console.log('=====================================\n');

const brands = loadBrands();
console.log(`Loaded ${brands.length} brands from audit data`);

if (brands.length === 0) {
  console.error('No brands found. Run audit first.');
  process.exit(1);
}

// Process all brands
const startTime = Date.now();
const results = await processBatch(brands);
const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

// Generate report
const report = generateReport(results);

// Save report
const reportPath = join(CONFIG.auditDir, `batch-processing-${new Date().toISOString().split('T')[0]}.json`);
writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Output summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 BATCH PROCESSING COMPLETE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total brands processed: ${report.summary.totalBrands}`);
console.log(`Successful: ${report.summary.successful} (${report.summary.successRate}%)`);
console.log(`Failed: ${report.summary.failed}`);
console.log(`Average duration: ${report.summary.avgDuration}s per brand`);
console.log(`Total duration: ${totalDuration}s`);
console.log(`Average coverage change: ${report.summary.avgCoverageChange > 0 ? '+' : ''}${report.summary.avgCoverageChange}%`);

if (report.topImprovements.length > 0) {
  console.log('\n🏆 Top Improvements:');
  report.topImprovements.forEach((brand, i) => {
    console.log(`  ${i + 1}. ${brand.name}: ${brand.change > 0 ? '+' : ''}${brand.change}% → ${brand.newCoverage}%`);
  });
}

if (report.failedBrands.length > 0) {
  console.log('\n❌ Failed Brands:');
  report.failedBrands.forEach(brand => {
    console.log(`  - ${brand.name}: ${brand.error || 'Unknown error'}`);
  });
}

console.log(`\n📄 Report saved: ${reportPath}`);
console.log('\n✅ Batch processing complete!');

// Exit with appropriate code
process.exit(report.summary.failed > 0 ? 1 : 0);
