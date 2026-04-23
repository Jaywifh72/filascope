#!/usr/bin/env node
/**
 * FILASCOPE ADVANCED MONITORING & ALERTING SYSTEM
 * 
 * Real-time monitoring with configurable alerts for:
 * - Coverage drops
 * - Brand sync failures
 * - Price staleness
 * - API errors
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, appendFileSync } from 'fs';
import { join } from 'path';

// Configuration
const CONFIG = {
  auditDir: process.env.HOME + '/openclaw/reports/scrapemaster-v2',
  logDir: process.env.HOME + '/openclaw/logs',
  alertLog: process.env.HOME + '/openclaw/logs/monitoring-alerts.log',
  stateFile: process.env.HOME + '/openclaw/logs/monitoring-state.json',
  thresholds: {
    coverageDrop: 5,      // Alert if coverage drops >5%
    brandFailure: 3,      // Alert if brand fails 3 consecutive runs
    priceStaleDays: 7,    // Alert if prices older than 7 days
    errorRate: 10,         // Alert if error rate >10%
  }
};

// Ensure directories exist
if (!existsSync(CONFIG.logDir)) {
  mkdirSync(CONFIG.logDir, { recursive: true });
}

// Load previous state
function loadState() {
  try {
    if (existsSync(CONFIG.stateFile)) {
      return JSON.parse(readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading state:', e.message);
  }
  return {
    lastRun: null,
    brandHistory: {},
    alerts: [],
    metrics: []
  };
}

// Save state
function saveState(state) {
  writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
}

// Log alert
function logAlert(severity, message, details = {}) {
  const timestamp = new Date().toISOString();
  const alert = {
    timestamp,
    severity,
    message,
    details
  };
  
  // Console output
  const icon = severity === 'CRITICAL' ? '🚨' : severity === 'WARNING' ? '⚠️' : 'ℹ️';
  console.log(`${icon} [${severity}] ${message}`);
  if (Object.keys(details).length > 0) {
    console.log(`   Details: ${JSON.stringify(details)}`);
  }
  
  // File log
  try {
    appendFileSync(CONFIG.alertLog, JSON.stringify(alert) + '\n');
  } catch (e) {
    console.error('Error writing alert log:', e.message);
  }
  
  return alert;
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

// Check for coverage drops
function checkCoverageDrops(audits, state) {
  const alerts = [];
  
  for (const audit of audits) {
    const brandSlug = audit.brand_slug;
    const currentCoverage = audit.overall_coverage || 0;
    
    // Check previous coverage
    if (state.brandHistory[brandSlug]) {
      const prevCoverage = state.brandHistory[brandSlug].coverage;
      const drop = prevCoverage - currentCoverage;
      
      if (drop > CONFIG.thresholds.coverageDrop) {
        alerts.push(logAlert('WARNING', 
          `Coverage drop detected: ${audit.display_name || brandSlug}`,
          { brand: brandSlug, prev: prevCoverage, current: currentCoverage, drop }
        ));
      }
      
      // Track consecutive failures
      if (currentCoverage < prevCoverage) {
        state.brandHistory[brandSlug].failures = (state.brandHistory[brandSlug].failures || 0) + 1;
        
        if (state.brandHistory[brandSlug].failures >= CONFIG.thresholds.brandFailure) {
          alerts.push(logAlert('CRITICAL',
            `Brand ${audit.display_name || brandSlug} failing consistently`,
            { brand: brandSlug, failures: state.brandHistory[brandSlug].failures, currentCoverage }
          ));
        }
      } else {
        state.brandHistory[brandSlug].failures = 0;
      }
    }
    
    // Update history
    state.brandHistory[brandSlug] = {
      coverage: currentCoverage,
      lastUpdated: new Date().toISOString(),
      failures: state.brandHistory[brandSlug]?.failures || 0
    };
  }
  
  return alerts;
}

// Check price staleness
function checkPriceStaleness(audits, state) {
  const alerts = [];
  
  for (const audit of audits) {
    const brandSlug = audit.brand_slug;
    const priceStats = audit.price_stats || {};
    
    // Check if prices are stale
    if (priceStats.last_updated) {
      const lastUpdate = new Date(priceStats.last_updated);
      const now = new Date();
      const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > CONFIG.thresholds.priceStaleDays) {
        alerts.push(logAlert('WARNING',
          `Stale prices: ${audit.display_name || brandSlug}`,
          { brand: brandSlug, daysSinceUpdate: Math.round(daysSinceUpdate), lastUpdate: priceStats.last_updated }
        ));
      }
    }
    
    // Check price coverage
    if (priceStats.coverage < 50) {
      alerts.push(logAlert('WARNING',
        `Low price coverage: ${audit.display_name || brandSlug}`,
        { brand: brandSlug, priceCoverage: priceStats.coverage }
      ));
    }
  }
  
  return alerts;
}

// Check for data quality issues
function checkDataQuality(audits, state) {
  const alerts = [];
  
  for (const audit of audits) {
    const brandSlug = audit.brand_slug;
    const fieldCoverage = audit.field_coverage || {};
    
    // Check critical fields
    const criticalFields = ['basic', 'technical'];
    for (const field of criticalFields) {
      if (fieldCoverage[field]) {
        const coverage = fieldCoverage[field].percentage || 0;
        if (coverage < 70) {
          alerts.push(logAlert('WARNING',
            `Low ${field} coverage: ${audit.display_name || brandSlug}`,
            { brand: brandSlug, category: field, coverage }
          ));
        }
      }
    }
    
    // Check for error patterns
    if (audit.errors && audit.errors.length > 0) {
      const errorRate = (audit.errors.length / (audit.total_filaments || 1)) * 100;
      if (errorRate > CONFIG.thresholds.errorRate) {
        alerts.push(logAlert('WARNING',
          `High error rate: ${audit.display_name || brandSlug}`,
          { brand: brandSlug, errorRate: Math.round(errorRate * 10) / 10, errors: audit.errors.length }
        ));
      }
    }
  }
  
  return alerts;
}

// Generate monitoring report
function generateReport(audits, alerts, state) {
  const timestamp = new Date().toISOString();
  const totalBrands = audits.length;
  const avgCoverage = audits.reduce((sum, a) => sum + (a.overall_coverage || 0), 0) / totalBrands;
  
  const report = {
    timestamp,
    summary: {
      totalBrands,
      totalFilaments: audits.reduce((sum, a) => sum + (a.total_filaments || 0), 0),
      avgCoverage: Math.round(avgCoverage * 10) / 10,
      alertsGenerated: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
      warningAlerts: alerts.filter(a => a.severity === 'WARNING').length
    },
    alerts,
    brandStatus: audits.map(a => ({
      name: a.display_name || a.brand_slug,
      coverage: a.overall_coverage || 0,
      status: a.status,
      filaments: a.total_filaments || 0,
      failures: state.brandHistory[a.brand_slug]?.failures || 0
    }))
  };
  
  return report;
}

// Main execution
console.log('🔍 Starting FilaScope Monitoring & Alerting System\n');

const state = loadState();
console.log(`Loaded state: ${Object.keys(state.brandHistory).length} brands tracked\n`);

const audits = loadAuditData();
console.log(`Loaded ${audits.length} audit files\n`);

// Run all checks
const allAlerts = [
  ...checkCoverageDrops(audits, state),
  ...checkPriceStaleness(audits, state),
  ...checkDataQuality(audits, state)
];

// Generate report
const report = generateReport(audits, allAlerts, state);

// Save state
state.lastRun = new Date().toISOString();
state.alerts = [...state.alerts, ...allAlerts].slice(-100); // Keep last 100 alerts
state.metrics.push({
  timestamp: new Date().toISOString(),
  totalBrands: report.summary.totalBrands,
  avgCoverage: report.summary.avgCoverage,
  alerts: report.summary.alertsGenerated
});
state.metrics = state.metrics.slice(-50); // Keep last 50 metrics
saveState(state);

// Output summary
console.log('\n📊 MONITORING SUMMARY');
console.log('====================');
console.log(`Total brands: ${report.summary.totalBrands}`);
console.log(`Total filaments: ${report.summary.totalFilaments.toLocaleString()}`);
console.log(`Average coverage: ${report.summary.avgCoverage}%`);
console.log(`Alerts generated: ${report.summary.alertsGenerated}`);
console.log(`  - Critical: ${report.summary.criticalAlerts}`);
console.log(`  - Warning: ${report.summary.warningAlerts}`);

// Save report
const reportPath = join(CONFIG.auditDir, `monitoring-report-${new Date().toISOString().split('T')[0]}.json`);
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Report saved: ${reportPath}`);

// Exit with appropriate code
if (report.summary.criticalAlerts > 0) {
  console.log('\n🚨 CRITICAL ALERTS DETECTED - Review immediately!');
  process.exit(1);
} else if (report.summary.warningAlerts > 0) {
  console.log('\n⚠️ Warnings detected - Review when convenient');
  process.exit(0);
} else {
  console.log('\n✅ All systems healthy');
  process.exit(0);
}
