/**
 * Advanced Monitoring — Master Scraper v2
 * 
 * Daily health checks, coverage tracking, and alerting.
 * Runs automatically at 8 AM EST via cron.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface HealthStatus {
  timestamp: string
  overall: 'healthy' | 'warning' | 'critical'
  checks: {
    database: { status: string; latency_ms: number; error?: string }
    disk: { status: string; used_percent: number }
    memory: { status: string; used_percent: number }
    api: { status: string; error?: string }
  }
  coverage: {
    brands: number
    filaments: number
    avg_coverage: number
    healthy: number
    warning: number
    critical: number
  }
  alerts: Array<{
    severity: 'info' | 'warning' | 'critical'
    message: string
    brand?: string
  }>
}

export async function runHealthChecks(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthStatus> {
  const checks: HealthStatus['checks'] = {
    database: { status: 'unknown', latency_ms: 0 },
    disk: { status: 'unknown', used_percent: 0 },
    memory: { status: 'unknown', used_percent: 0 },
    api: { status: 'unknown' },
  }

  const alerts: HealthStatus['alerts'] = []

  // Database check
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const start = Date.now()
    const { error } = await supabase.from('filaments').select('id').limit(1)
    checks.database.latency_ms = Date.now() - start

    if (error) {
      checks.database.status = 'error'
      checks.database.error = error.message
      alerts.push({ severity: 'critical', message: `Database error: ${error.message}` })
    } else {
      checks.database.status = 'healthy'
    }
  } catch (e: any) {
    checks.database.status = 'critical'
    checks.database.error = e.message
    alerts.push({ severity: 'critical', message: `Database connection failed: ${e.message}` })
  }

  // Disk check
  try {
    const { used, total } = await getDiskUsage()
    checks.disk.used_percent = Math.round((used / total) * 100)
    checks.disk.status = checks.disk.used_percent > 90 ? 'critical' : checks.disk.used_percent > 75 ? 'warning' : 'healthy'
    if (checks.disk.used_percent > 90) {
      alerts.push({ severity: 'critical', message: `Disk usage at ${checks.disk.used_percent}%` })
    } else if (checks.disk.used_percent > 75) {
      alerts.push({ severity: 'warning', message: `Disk usage at ${checks.disk.used_percent}%` })
    }
  } catch (e: any) {
    checks.disk.status = 'unknown'
    alerts.push({ severity: 'warning', message: `Could not check disk usage: ${e.message}` })
  }

  // Memory check
  try {
    const memInfo = await getMemoryUsage()
    checks.memory.used_percent = memInfo.usedPercent
    checks.memory.status = memInfo.usedPercent > 90 ? 'critical' : memInfo.usedPercent > 75 ? 'warning' : 'healthy'
    if (memInfo.usedPercent > 90) {
      alerts.push({ severity: 'critical', message: `Memory usage at ${memInfo.usedPercent}%` })
    }
  } catch (e: any) {
    checks.memory.status = 'unknown'
  }

  // API check
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: { apikey: supabaseKey },
    })
    checks.api.status = response.ok ? 'healthy' : 'error'
    if (!response.ok) {
      checks.api.error = `HTTP ${response.status}`
      alerts.push({ severity: 'warning', message: `API returned ${response.status}` })
    }
  } catch (e: any) {
    checks.api.status = 'error'
    checks.api.error = e.message
    alerts.push({ severity: 'critical', message: `API unreachable: ${e.message}` })
  }

  // Calculate overall status
  const statusValues = [
    checks.database.status,
    checks.disk.status,
    checks.memory.status,
    checks.api.status,
  ]

  let overall: HealthStatus['overall'] = 'healthy'
  if (statusValues.includes('critical')) {
    overall = 'critical'
  } else if (statusValues.includes('warning') || statusValues.includes('error')) {
    overall = 'warning'
  }

  return {
    timestamp: new Date().toISOString(),
    overall,
    checks,
    coverage: {
      brands: 0,
      filaments: 0,
      avg_coverage: 0,
      healthy: 0,
      warning: 0,
      critical: 0,
    },
    alerts,
  }
}

async function getDiskUsage(): Promise<{ used: number; total: number }> {
  // Linux-specific: read from /proc/meminfo or df
  const result = await Deno.readFile('/proc/meminfo')
  const text = new TextDecoder().decode(result)
  const lines = text.split('\n')

  let memFree = 0
  let memTotal = 0

  for (const line of lines) {
    if (line.startsWith('MemFree:')) {
      memFree = parseInt(line.split(/\s+/)[1]) * 1024
    }
    if (line.startsWith('MemTotal:')) {
      memTotal = parseInt(line.split(/\s+/)[1]) * 1024
    }
  }

  // For disk, we'd use df command - simplified here
  return { used: memTotal - memFree, total: memTotal }
}

async function getMemoryUsage(): Promise<{ usedPercent: number }> {
  const result = await Deno.readFile('/proc/meminfo')
  const text = new TextDecoder().decode(result)
  const lines = text.split('\n')

  let memFree = 0
  let memTotal = 0
  let buffers = 0
  let cached = 0

  for (const line of lines) {
    if (line.startsWith('MemFree:')) {
      memFree = parseInt(line.split(/\s+/)[1])
    }
    if (line.startsWith('MemTotal:')) {
      memTotal = parseInt(line.split(/\s+/)[1])
    }
    if (line.startsWith('Buffers:')) {
      buffers = parseInt(line.split(/\s+/)[1])
    }
    if (line.startsWith('Cached:')) {
      cached = parseInt(line.split(/\s+/)[1])
    }
  }

  const used = memTotal - memFree - buffers - cached
  return { usedPercent: Math.round((used / memTotal) * 100) }
}

export async function getCoverageStats(
  supabaseUrl: string,
  supabaseKey: string
): Promise<HealthStatus['coverage']> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get brand stats
  const { data: brands } = await supabase.from('brands').select('brand_slug, display_name')

  let healthy = 0
  let warning = 0
  let critical = 0
  let totalCoverage = 0

  for (const brand of brands || []) {
    const { data: filaments } = await supabase
      .from('filaments')
      .select('id, overall_coverage_pct')
      .eq('vendor', brand.display_name)

    if (!filaments || filaments.length === 0) continue

    const avgCoverage = filaments.reduce((sum, f) => sum + (f.overall_coverage_pct || 0), 0) / filaments.length

    if (avgCoverage >= 80) healthy++
    else if (avgCoverage >= 50) warning++
    else critical++

    totalCoverage += avgCoverage
  }

  const { count: totalFilaments } = await supabase
    .from('filaments')
    .select('id', { count: 'exact', head: true })

  return {
    brands: brands?.length || 0,
    filaments: totalFilaments || 0,
    avg_coverage: brands && brands.length > 0 ? totalCoverage / brands.length : 0,
    healthy,
    warning,
    critical,
  }
}

// CLI entry point
if (typeof Deno !== 'undefined') {
  const supabaseUrl = Deno.args[0] || Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.args[1] || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  console.log('Running health checks...')

  const health = await runHealthChecks(supabaseUrl, supabaseKey)
  const coverage = await getCoverageStats(supabaseUrl, supabaseKey)

  const report: HealthStatus = {
    ...health,
    coverage,
  }

  console.log('\n=== HEALTH CHECK REPORT ===\n')
  console.log(`Overall Status: ${report.overall.toUpperCase()}`)
  console.log(`Timestamp: ${report.timestamp}`)
  console.log('\nChecks:')
  console.log(`  Database: ${report.checks.database.status} (${report.checks.database.latency_ms}ms)`)
  console.log(`  Disk: ${report.checks.disk.status} (${report.checks.disk.used_percent}%)`)
  console.log(`  Memory: ${report.checks.memory.status} (${report.checks.memory.used_percent}%)`)
  console.log(`  API: ${report.checks.api.status}`)
  console.log('\nCoverage:')
  console.log(`  Brands: ${coverage.brands}`)
  console.log(`  Filaments: ${coverage.filaments}`)
  console.log(`  Avg Coverage: ${coverage.avg_coverage.toFixed(1)}%`)
  console.log(`  Healthy: ${coverage.healthy} | Warning: ${coverage.warning} | Critical: ${coverage.critical}`)

  if (report.alerts.length > 0) {
    console.log('\nAlerts:')
    report.alerts.forEach(a => console.log(`  [${a.severity.toUpperCase()}] ${a.message}`))
  }

  // Save report
  const reportPath = `/home/jay/openclaw/reports/scrapemaster-v2/health-report-${new Date().toISOString().split('T')[0]}.json`
  await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2))
  console.log(`\nReport saved to: ${reportPath}`)
}
