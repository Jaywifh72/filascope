#!/usr/bin/env node
/**
 * FILASCOPE COVERAGE DASHBOARD
 * 
 * Real-time dashboard showing coverage metrics across all brands.
 * Generates HTML dashboard with charts and metrics.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

// Configuration
const AUDIT_DIR = process.env.HOME + '/openclaw/reports/scrapemaster-v2';
const DASHBOARD_DIR = process.env.HOME + '/openclaw/dashboard';
const OUTPUT_FILE = join(DASHBOARD_DIR, 'index.html');

// Ensure dashboard directory exists
if (!existsSync(DASHBOARD_DIR)) {
  mkdirSync(DASHBOARD_DIR, { recursive: true });
}

// Load audit data — deduplicate by brand_slug, keep latest timestamp
function loadAuditData() {
  const auditsBySlug = {};
  try {
    const files = readdirSync(AUDIT_DIR);
    for (const file of files) {
      if (file.startsWith('audit-') && file.endsWith('.json') && !file.includes('summary')) {
        try {
          const data = JSON.parse(readFileSync(join(AUDIT_DIR, file), 'utf8'));
          const slug = (data.brand_slug || file.replace('audit-', '').replace(/-\d{4}-\d{2}-\d{2}\.json$/, '')).toLowerCase();
          const existing = auditsBySlug[slug];
          const newTs = new Date(data.timestamp || 0).getTime();
          const existingTs = existing ? new Date(existing.timestamp || 0).getTime() : 0;
          if (!existing || newTs > existingTs) {
            auditsBySlug[slug] = data;
          }
        } catch (e) {
          console.error(`Error reading ${file}:`, e.message);
        }
      }
    }
  } catch (e) {
    console.error('Error reading audit directory:', e.message);
  }
  return Object.values(auditsBySlug);
}

// Calculate metrics
function calculateMetrics(audits) {
  if (audits.length === 0) return null;
  
  const totalFilaments = audits.reduce((sum, a) => sum + (a.total_filaments || 0), 0);
  const avgCoverage = audits.reduce((sum, a) => sum + (a.overall_coverage || 0), 0) / audits.length;
  
  // Field coverage by category
  const categoryCoverage = {
    basic: { total: 0, populated: 0, percentage: 0 },
    technical: { total: 0, populated: 0, percentage: 0 },
    regional: { total: 0, populated: 0, percentage: 0 },
    scoring: { total: 0, populated: 0, percentage: 0 },
    metadata: { total: 0, populated: 0, percentage: 0 }
  };
  
  for (const audit of audits) {
    const fc = audit.field_coverage || {};
    for (const [category, data] of Object.entries(fc)) {
      if (categoryCoverage[category]) {
        categoryCoverage[category].total += data.total || 0;
        categoryCoverage[category].populated += data.populated || 0;
      }
    }
  }
  
  // Calculate percentages
  for (const category of Object.keys(categoryCoverage)) {
    const { total, populated } = categoryCoverage[category];
    categoryCoverage[category].percentage = total > 0 ? Math.round((populated / total) * 100 * 10) / 10 : 0;
  }
  
  // Status distribution
  const statusCounts = { HEALTHY: 0, WARNING: 0, CRITICAL: 0 };
  for (const audit of audits) {
    const status = audit.status || 'UNKNOWN';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }
  
  // Top brands
  const sortedByCoverage = [...audits].sort((a, b) => (b.overall_coverage || 0) - (a.overall_coverage || 0));
  const topBrands = sortedByCoverage.slice(0, 10).map(a => ({
    name: a.display_name || a.brand_slug,
    coverage: a.overall_coverage || 0,
    status: a.status,
    filaments: a.total_filaments || 0
  }));
  
  const bottomBrands = sortedByCoverage.slice(-10).reverse().map(a => ({
    name: a.display_name || a.brand_slug,
    coverage: a.overall_coverage || 0,
    status: a.status,
    filaments: a.total_filaments || 0
  }));
  
  return {
    totalBrands: audits.length,
    totalFilaments,
    avgCoverage: Math.round(avgCoverage * 10) / 10,
    categoryCoverage,
    statusCounts,
    topBrands,
    bottomBrands,
    timestamp: new Date().toISOString()
  };
}

// Generate HTML dashboard
function generateDashboard(metrics) {
  const { totalBrands, totalFilaments, avgCoverage, categoryCoverage, statusCounts, topBrands, bottomBrands, timestamp } = metrics;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FilaScope Coverage Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { 
      font-size: 2rem;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { color: #94a3b8; margin-bottom: 30px; }
    .grid { 
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: #1e293b;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #334155;
    }
    .card h2 {
      font-size: 1.2rem;
      margin-bottom: 15px;
      color: #f1f5f9;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #334155;
    }
    .metric:last-child { border-bottom: none; }
    .metric-label { color: #94a3b8; }
    .metric-value { 
      font-size: 1.5rem;
      font-weight: 700;
    }
    .metric-value.healthy { color: #4ade80; }
    .metric-value.warning { color: #fbbf24; }
    .metric-value.critical { color: #f87171; }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #334155;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 5px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #06b6d4);
      border-radius: 4px;
    }
    .brand-list {
      max-height: 400px;
      overflow-y: auto;
    }
    .brand-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #334155;
    }
    .brand-item:last-child { border-bottom: none; }
    .chart-container {
      height: 300px;
      margin-top: 15px;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-healthy { background: #065f46; color: #4ade80; }
    .status-warning { background: #78350f; color: #fbbf24; }
    .status-critical { background: #7f1d1d; color: #f87171; }
    .timestamp {
      text-align: center;
      color: #64748b;
      font-size: 0.875rem;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧵 FilaScope Coverage Dashboard</h1>
    <p class="subtitle">Master Scraper v2 — Real-time coverage metrics across ${totalBrands} brands</p>
    
    <!-- Key Metrics -->
    <div class="grid">
      <div class="card">
        <h2>📊 Overall Coverage</h2>
        <div class="metric">
          <span class="metric-label">Average Coverage</span>
          <span class="metric-value ${avgCoverage >= 80 ? 'healthy' : avgCoverage >= 60 ? 'warning' : 'critical'}">${avgCoverage}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${avgCoverage}%"></div>
        </div>
        <div class="metric">
          <span class="metric-label">Total Brands</span>
          <span class="metric-value">${totalBrands}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total Filaments</span>
          <span class="metric-value">${totalFilaments.toLocaleString()}</span>
        </div>
      </div>
      
      <div class="card">
        <h2>🎯 Status Distribution</h2>
        <div class="metric">
          <span class="metric-label">✅ Healthy</span>
          <span class="metric-value healthy">${statusCounts.HEALTHY || 0}</span>
        </div>
        <div class="metric">
          <span class="metric-label">⚠️ Warning</span>
          <span class="metric-value warning">${statusCounts.WARNING || 0}</span>
        </div>
        <div class="metric">
          <span class="metric-label">❌ Critical</span>
          <span class="metric-value critical">${statusCounts.CRITICAL || 0}</span>
        </div>
      </div>
      
      <div class="card">
        <h2>📈 Field Categories</h2>
        ${Object.entries(categoryCoverage).map(([cat, data]) => `
        <div class="metric">
          <span class="metric-label">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
          <span class="metric-value ${data.percentage >= 80 ? 'healthy' : data.percentage >= 60 ? 'warning' : 'critical'}">${data.percentage}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${data.percentage}%"></div>
        </div>
        `).join('')}
      </div>
    </div>
    
    <!-- Charts -->
    <div class="grid">
      <div class="card">
        <h2>📊 Coverage Distribution</h2>
        <div class="chart-container">
          <canvas id="coverageChart"></canvas>
        </div>
      </div>
      
      <div class="card">
        <h2>🎯 Status Breakdown</h2>
        <div class="chart-container">
          <canvas id="statusChart"></canvas>
        </div>
      </div>
    </div>
    
    <!-- Brand Lists -->
    <div class="grid">
      <div class="card">
        <h2>🏆 Top 10 Brands (Highest Coverage)</h2>
        <div class="brand-list">
          ${topBrands.map((brand, i) => `
          <div class="brand-item">
            <span>${i + 1}. ${brand.name}</span>
            <span>
              <span class="status-badge status-${brand.status.toLowerCase()}">${brand.coverage}%</span>
              <span style="color: #64748b; font-size: 0.875rem; margin-left: 8px;">${brand.filaments.toLocaleString()} filaments</span>
            </span>
          </div>
          `).join('')}
        </div>
      </div>
      
      <div class="card">
        <h2>⚠️ Bottom 10 Brands (Needs Attention)</h2>
        <div class="brand-list">
          ${bottomBrands.map((brand, i) => `
          <div class="brand-item">
            <span>${i + 1}. ${brand.name}</span>
            <span>
              <span class="status-badge status-${brand.status.toLowerCase()}">${brand.coverage}%</span>
              <span style="color: #64748b; font-size: 0.875rem; margin-left: 8px;">${brand.filaments.toLocaleString()} filaments</span>
            </span>
          </div>
          `).join('')}
        </div>
      </div>
    </div>
    
    <div class="timestamp">
      Last updated: ${timestamp}
    </div>
  </div>
  
  <script>
    // Coverage Distribution Chart
    const coverageCtx = document.getElementById('coverageChart').getContext('2d');
    new Chart(coverageCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(topBrands.concat(bottomBrands).map(b => b.name.slice(0, 15)))},
        datasets: [{
          label: 'Coverage %',
          data: ${JSON.stringify(topBrands.concat(bottomBrands).map(b => b.coverage))},
          backgroundColor: ${JSON.stringify(topBrands.concat(bottomBrands).map(b => 
            b.coverage >= 80 ? '#4ade80' : b.coverage >= 60 ? '#fbbf24' : '#f87171'
          ))},
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45 } }
        }
      }
    });
    
    // Status Breakdown Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Healthy', 'Warning', 'Critical'],
        datasets: [{
          data: [${statusCounts.HEALTHY || 0}, ${statusCounts.WARNING || 0}, ${statusCounts.CRITICAL || 0}],
          backgroundColor: ['#4ade80', '#fbbf24', '#f87171'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
      }
    });
  </script>
</body>
</html>`;
}

// Main execution
console.log('Building FilaScope Coverage Dashboard...\n');

const audits = loadAuditData();
console.log(`Loaded ${audits.length} audit files`);

if (audits.length === 0) {
  console.error('No audit data found. Run audit first.');
  process.exit(1);
}

const metrics = calculateMetrics(audits);
console.log('\nMetrics calculated:');
console.log(`  Total brands: ${metrics.totalBrands}`);
console.log(`  Total filaments: ${metrics.totalFilaments}`);
console.log(`  Average coverage: ${metrics.avgCoverage}%`);
console.log(`  Status: ${metrics.statusCounts.HEALTHY} healthy, ${metrics.statusCounts.WARNING} warning, ${metrics.statusCounts.CRITICAL} critical`);

const dashboard = generateDashboard(metrics);
writeFileSync(OUTPUT_FILE, dashboard);

console.log(`\n✅ Dashboard generated: ${OUTPUT_FILE}`);
console.log(`   File size: ${(dashboard.length / 1024).toFixed(1)} KB`);
console.log(`   Open in browser to view`);
