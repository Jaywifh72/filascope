/**
 * Performance Optimizer — Master Scraper v2
 * 
 * Analyzes and optimizes the scraping pipeline for speed and efficiency.
 * Applies batch processing, rate limiting, and caching strategies.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Performance thresholds
const THRESHOLDS = {
  MAX_CONCURRENT_REQUESTS: 5,
  REQUEST_DELAY_MS: 100,
  BATCH_SIZE: 50,
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
}

// Cache for API responses
const responseCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached response if valid
 */
function getCached(key: string): unknown | null {
  const cached = responseCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }
  responseCache.delete(key)
  return null
}

/**
 * Set cache entry
 */
function setCache(key: string, data: unknown): void {
  // Limit cache size
  if (responseCache.size > 1000) {
    const oldest = [...responseCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 100)
    oldest.forEach(([k]) => responseCache.delete(k))
  }
  responseCache.set(key, { data, timestamp: Date.now() })
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Rate-limited fetch with retry
 */
async function rateLimitedFetch(
  url: string,
  options: RequestInit = {},
  retries = THRESHOLDS.MAX_RETRIES
): Promise<Response> {
  // Check cache first
  const cacheKey = `${options.method || 'GET'}:${url}`
  const cached = getCached(cacheKey)
  if (cached && options.method === 'GET') {
    return cached as Response
  }

  await sleep(THRESHOLDS.REQUEST_DELAY_MS)

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), THRESHOLDS.TIMEOUT_MS)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (response.ok) {
        if (options.method === 'GET') {
          setCache(cacheKey, response.clone())
        }
        return response
      }

      if (response.status >= 500 && attempt < retries) {
        await sleep(1000 * (attempt + 1))
        continue
      }

      return response
    } catch (error) {
      if (attempt === retries) throw error
      await sleep(1000 * (attempt + 1))
    }
  }

  throw new Error(`Failed after ${retries} retries`)
}

/**
 * Process items in batches
 */
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize = THRESHOLDS.BATCH_SIZE
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(item => processor(item).catch(err => ({ error: err.message })))
    )
    results.push(...batchResults)
    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`)
  }

  return results
}

/**
 * Analyze brand performance
 */
async function analyzeBrandPerformance(
  supabase: ReturnType<typeof createClient>,
  brandSlug: string
): Promise<{
  totalFilaments: number
  avgCoverage: number
  missingFields: Record<string, number>
  processingTime: number
}> {
  const startTime = Date.now()

  const { data: filaments } = await supabase
    .from('filaments')
    .select('*')
    .eq('vendor', brandSlug)

  if (!filaments) {
    return {
      totalFilaments: 0,
      avgCoverage: 0,
      missingFields: {},
      processingTime: Date.now() - startTime,
    }
  }

  // Count missing fields
  const missingFields: Record<string, number> = {}
  const fieldsToCheck = [
    'variant_price', 'material', 'featured_image', 'description',
    'nozzle_temp_min_c', 'nozzle_temp_max_c', 'bed_temp_min_c', 'bed_temp_max_c',
    'density_g_cm3', 'filament_diameter_mm', 'filament_weight_g',
    'amazon_link_us', 'amazon_price_usd',
    'filascope_score', 'ease_of_printing_score',
  ]

  for (const field of fieldsToCheck) {
    missingFields[field] = filaments.filter(f => !f[field]).length
  }

  // Calculate average coverage
  const coveredFields = fieldsToCheck.filter(f => missingFields[f] === 0).length
  const avgCoverage = (coveredFields / fieldsToCheck.length) * 100

  return {
    totalFilaments: filaments.length,
    avgCoverage,
    missingFields,
    processingTime: Date.now() - startTime,
  }
}

/**
 * Optimize extraction order by impact
 */
function calculateExtractionImpact(
  missingCount: number,
  totalFilaments: number,
  affiliatePotential: number
): number {
  // Higher impact = more valuable to extract
  const coverageGap = (missingCount / totalFilaments) * 100
  const affiliateMultiplier = affiliatePotential > 0 ? 2 : 1
  return coverageGap * affiliateMultiplier
}

/**
 * Main optimization function
 */
export async function runPerformanceOptimization(
  supabaseUrl: string,
  supabaseKey: string
): Promise<{
  recommendations: string[]
  statistics: Record<string, unknown>
  optimizedOrder: Array<{ brand: string; impact: number }>
}> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('Starting performance optimization...')

  // Get all brands
  const { data: brands } = await supabase.from('brands').select('*')

  if (!brands) {
    throw new Error('Failed to fetch brands')
  }

  // Analyze each brand
  const brandAnalysis = await Promise.all(
    brands.map(async brand => {
      const analysis = await analyzeBrandPerformance(supabase, brand.brand_slug)
      return {
        brand: brand.brand_slug,
        displayName: brand.display_name,
        ...analysis,
      }
    })
  )

  // Calculate extraction impact and sort
  const optimizedOrder = brandAnalysis
    .map(b => ({
      brand: b.brand,
      displayName: b.displayName,
      impact: calculateExtractionImpact(
        Object.values(b.missingFields).reduce((a, c) => a + c, 0),
        b.totalFilaments,
        b.avgCoverage < 50 ? 1 : 0 // Affiliate potential
      ),
    }))
    .sort((a, b) => b.impact - a.impact)

  // Generate recommendations
  const recommendations: string[] = []

  // Batch processing recommendation
  const avgFilamentsPerBrand = brandAnalysis.reduce((a, b) => a + b.totalFilaments, 0) / brandAnalysis.length
  if (avgFilamentsPerBrand > 100) {
    recommendations.push(
      `Consider increasing batch size from ${THRESHOLDS.BATCH_SIZE} to ${Math.min(100, Math.ceil(avgFilamentsPerBrand * 0.1))}`
    )
  }

  // Cache recommendation
  if (responseCache.size > 500) {
    recommendations.push('Cache hit rate is low. Consider increasing cache TTL or reducing cache size.')
  }

  // Rate limiting recommendation
  const totalMissingFields = brandAnalysis.reduce(
    (sum, b) => sum + Object.values(b.missingFields).reduce((a, c) => a + c, 0),
    0
  )
  if (totalMissingFields > 10000) {
    recommendations.push(
      `High number of missing fields (${totalMissingFields}). Prioritize high-impact brands for extraction.`
    )
  }

  // Statistics
  const statistics = {
    totalBrands: brandAnalysis.length,
    totalFilaments: brandAnalysis.reduce((a, b) => a + b.totalFilaments, 0),
    avgCoverage: brandAnalysis.reduce((a, b) => a + b.avgCoverage, 0) / brandAnalysis.length,
    totalMissingFields,
    cacheSize: responseCache.size,
    recommendations: recommendations.length,
  }

  return {
    recommendations,
    statistics,
    optimizedOrder: optimizedOrder.slice(0, 20), // Top 20
  }
}

// CLI entry point
if (typeof Deno !== 'undefined') {
  const supabaseUrl = Deno.args[0] || Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.args[1] || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  runPerformanceOptimization(supabaseUrl, supabaseKey)
    .then(result => {
      console.log('\n=== PERFORMANCE OPTIMIZATION RESULTS ===\n')
      console.log('Statistics:', JSON.stringify(result.statistics, null, 2))
      console.log('\nRecommendations:')
      result.recommendations.forEach(r => console.log(`  - ${r}`))
      console.log('\nTop 20 High-Impact Brands:')
      result.optimizedOrder.forEach((b, i) => console.log(`  ${i + 1}. ${b.brand} (impact: ${b.impact.toFixed(2)})`))
    })
    .catch(err => {
      console.error('Optimization failed:', err)
      Deno.exit(1)
    })
}
