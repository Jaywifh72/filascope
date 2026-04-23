#!/usr/bin/env node
/**
 * FILASCOPE PERFORMANCE OPTIMIZER
 * 
 * Analyzes scraper performance and provides optimization recommendations.
 * Identifies bottlenecks, slow brands, and suggests improvements.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

// Configuration
const CONFIG = {
  auditDir: process.env.HOME + '/openclaw/reports/scrapemaster-v2',
  logDir: process.env.HOME + '/openclaw/logs',
  thresholds: {
    slowBrand: 60,          // Seconds
    verySlowBrand: 120,     // Seconds
    lowCoverage: 50,        // Percentage
    highErrorRate: 10,      // Percentage
  }
};

// Load batch processing results
function loadBatchResults() {
  const results = [];
  try {
    const files = readdirSync(CONFIG.auditDir);
    for (const file of files) {
      if (file.startsWith('batch-processing-') && file.endsWith('.json')) {
        try {
          results.push(JSON.parse(readFileSync(join(CONFIG.auditDir, file), 'utf8')));
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Error loading batch results:', e.message);
  }
  return results;
}

// Load audit data
function loadAuditData() {
  const audits = [];
  try {
    const files = readdirSync(CONFIG.auditDir);
    for (const file of files) {
      if (file.startsWith('audit-') && file.endsWith('.json') && !file.includes('summary')) {
        try {
          audits.push(JSON.parse(readFileSync(join(CONFIG.auditDir, file), 'utf8')));
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Error reading audit directory:', e.message);
  }
  return audits;
}

// Analyze performance
function analyzePerformance(batchResults, audits) {
  const analysis = {
    bottlenecks: [],
    slowBrands: [],
    lowCoverageBrands: [],
    recommendations: [],
    metrics: {}
  };
  
  // Analyze batch results
  if (batchResults.length > 0) {
    const latestBatch = batchResults[batchResults.length - 1];
    
    // Find slow brands
    if (latestBatch.successfulBrands) {
      const slowBrands = latestBatch.successfulBrands.filter(b => b.duration > CONFIG.thresholds.slowBrand);
      analysis.slowBrands = slowBrands.map(b => ({
        name: b.name,
        duration: b.duration,
        coverage: b.newCoverage
      }));
      
      // Calculate metrics
      const durations = latestBatch.successfulBrands.map(b => b.duration);
      analysis.metrics.avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10;
      analysis.metrics.maxDuration = Math.max(...durations);
      analysis.metrics.minDuration = Math.min(...durations);
    }
    
    // Analyze failures
    if (latestBatch.failedBrands && latestBatch.failedBrands.length > 0) {
      analysis.bottlenecks.push({
        type: 'FAILURE',
        message: `${latestBatch.failedBrands.length} brands failed processing`,
        brands: latestBatch.failedBrands.map(b => b.name),
        impact: 'HIGH'
      });
    }
  }
  
  // Analyze audit data
  if (audits.length > 0) {
    // Find low coverage brands
    const lowCoverage = audits.filter(a => (a.overall_coverage || 0) < CONFIG.thresholds.lowCoverage);
    analysis.lowCoverageBrands = lowCoverage.map(a => ({
      name: a.display_name || a.brand_slug,
      coverage: a.overall_coverage || 0,
      status: a.status
    }));
    
    // Calculate overall metrics
    const coverages = audits.map(a => a.overall_coverage || 0);
    analysis.metrics.avgCoverage = Math.round(coverages.reduce((a, b) => a + b, 0) / coverages.length * 10) / 10;
    analysis.metrics.minCoverage = Math.min(...coverages);
    analysis.metrics.maxCoverage = Math.max(...coverages);
    
    // Check for data quality issues
    audits.forEach(audit => {
      const fieldCoverage = audit.field_coverage || {};
      if (fieldCoverage.technical && fieldCoverage.technical.percentage < 50) {
        analysis.bottlenecks.push({
          type: 'DATA_QUALITY',
          message: `Low technical coverage: ${audit.display_name || audit.brand_slug}`,
          brand: audit.brand_slug,
          coverage: fieldCoverage.technical.percentage,
          impact: 'MEDIUM'
        });
      }
    });
  }
  
  // Generate recommendations
  if (analysis.slowBrands.length > 0) {
    analysis.recommendations.push({
      priority: 'HIGH',
      title: 'Optimize Slow Brands',
      description: `${analysis.slowBrands.length} brands taking >${CONFIG.thresholds.slowBrand}s to process`,
      action: 'Review scraper logic for these brands. Consider caching, parallel requests, or simplified extraction.',
      brands: analysis.slowBrands.map(b => b.name)
    });
  }
  
  if (analysis.lowCoverageBrands.length > 0) {
    analysis.recommendations.push({
      priority: 'MEDIUM',
      title: 'Improve Low Coverage Brands',
      description: `${analysis.lowCoverageBrands.length} brands below ${CONFIG.thresholds.lowCoverage}% coverage`,
      action: 'Add missing product URLs, fix Shopify API endpoints, or implement alternative scraping methods.',
      brands: analysis.lowCoverageBrands.map(b => b.name)
    });
  }
  
  if (analysis.bottlenecks.length > 0) {
    const highImpact = analysis.bottlenecks.filter(b => b.impact === 'HIGH');
    if (highImpact.length > 0) {
      analysis.recommendations.push({
        priority: 'CRITICAL',
        title: 'Fix High Impact Bottlenecks',
        description: `${highImpact.length} high-impact issues detected`,
        action: 'Address these issues immediately to prevent data quality degradation.',
        issues: highImpact.map(b => b.message)
      });
    }
  }
  
  // Performance optimization recommendations
  if (analysis.metrics.avgDuration > 30) {
    analysis.recommendations.push({
      priority: 'MEDIUM',
      title: 'Reduce Processing Time',
      description: `Average processing time is ${analysis.metrics.avgDuration}s per brand`,
      action: 'Consider implementing request caching, connection pooling, or parallel API calls within each brand.'
    });
  }
  
  return analysis;
}

// Generate optimization report
function generateReport(analysis) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalBrands: analysis.lowCoverageBrands.length + (analysis.slowBrands.length || 0),
      slowBrands: analysis.slowBrands.length,
      lowCoverageBrands: analysis.lowCoverageBrands.length,
      bottlenecks: analysis.bottlenecks.length,
      recommendations: analysis.recommendations.length
    },
    metrics: analysis.metrics,
    bottlenecks: analysis.bottlenecks,
    slowBrands: analysis.slowBrands,
    lowCoverageBrands: analysis.lowCoverageBrands,
    recommendations: analysis.recommendations
  };
  
  return report;
}

// Main execution
console.log('⚡ FilaScope Performance Optimizer');
console.log('==================================\n');

const batchResults = loadBatchResults();
const audits = loadAuditData();

console.log(`Loaded ${batchResults.length} batch processing results`);
console.log(`Loaded ${audits.length} audit files\n`);

const analysis = analyzePerformance(batchResults, audits);
const report = generateReport(analysis);

// Save report
const reportPath = join(CONFIG.auditDir, `performance-analysis-${new Date().toISOString().split('T')[0]}.json`);
writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Output summary
console.log('\n📊 PERFORMANCE ANALYSIS');
console.log('=======================\n');

if (report.summary.bottlenecks > 0) {
  console.log('🚨 BOTTLENECKS DETECTED:');
  report.bottlenecks.forEach((b, i) => {
    console.log(`  ${i + 1}. [${b.impact}] ${b.type}: ${b.message}`);
  });
  console.log('');
}

if (report.summary.slowBrands > 0) {
  console.log('🐌 SLOW BRANDS:');
  report.slowBrands.forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.name}: ${b.duration}s (${b.coverage}% coverage)`);
  });
  console.log('');
}

if (report.summary.lowCoverageBrands > 0) {
  console.log('📉 LOW COVERAGE BRANDS:');
  report.lowCoverageBrands.slice(0, 10).forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.name}: ${b.coverage}% (${b.status})`);
  });
  if (report.lowCoverageBrands.length > 10) {
    console.log(`  ... and ${report.lowCoverageBrands.length - 10} more`);
  }
  console.log('');
}

if (report.recommendations.length > 0) {
  console.log('💡 RECOMMENDATIONS:');
  report.recommendations.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.priority}] ${r.title}`);
    console.log(`     ${r.description}`);
    console.log(`     Action: ${r.action}`);
    if (r.brands) {
      console.log(`     Brands: ${r.brands.join(', ')}`);
    }
    console.log('');
  });
}

console.log('\n📈 METRICS:');
console.log(`  Average duration: ${report.metrics.avgDuration || 'N/A'}s`);
console.log(`  Max duration: ${report.metrics.maxDuration || 'N/A'}s`);
console.log(`  Min duration: ${report.metrics.minDuration || 'N/A'}s`);
console.log(`  Average coverage: ${report.metrics.avgCoverage || 'N/A'}%`);
console.log(`  Coverage range: ${report.metrics.minCoverage || 'N/A'}% - ${report.metrics.maxCoverage || 'N/A'}%`);

console.log(`\n📄 Report saved: ${reportPath}`);

// Exit with appropriate code
if (report.summary.bottlenecks > 0 && report.bottlenecks.some(b => b.impact === 'HIGH')) {
  console.log('\n🚨 CRITICAL ISSUES DETECTED - Review immediately!');
  process.exit(1);
} else if (report.summary.bottlenecks > 0 || report.summary.slowBrands > 5) {
  console.log('\n⚠️ Performance issues detected - Review when convenient');
  process.exit(0);
} else {
  console.log('\n✅ Performance is optimal');
  process.exit(0);
}
