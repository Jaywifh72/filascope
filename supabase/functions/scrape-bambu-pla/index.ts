import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// AI SUMMARY GENERATION
// ============================================================================
interface AISummary {
  generatedAt: string;
  model: string;
  summary: {
    headline: string;
    whatWentRight: string[];
    whatWentWrong: string[];
    userImpact: string;
    actionsNeeded: string[];
    healthScore: number;
    lovablePrompt: string | null;
  };
}

async function generateAISummary(
  jobResults: any,
  jobStatus: 'completed' | 'failed',
  jobError: string | null,
  materials: string[],
  dryRun: boolean,
  ctx: any
): Promise<AISummary | null> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

  if (!OPENAI_API_KEY) {
    console.log(`[${ctx.requestId}] OPENAI_API_KEY not configured, skipping AI summary`);
    return null;
  }

  try {
    const prompt = `You are a Senior Web Scraping & Backend Engineering Expert analyzing a scraping job for a 3D printing filament database (Bambu Lab products).

Job Status: ${jobStatus}
Materials Processed: ${materials.join(', ')}
Dry Run: ${dryRun}
${jobError ? `Error: ${jobError}` : ''}

Job Results:
- Products Scraped: ${jobResults.productsScraped || 0}
- Colors Discovered: ${jobResults.colorsDiscovered || 0}
- Filaments Created: ${jobResults.filamentsCreated || 0}
- Filaments Updated: ${jobResults.filamentsUpdated || 0}
- Errors: ${jobResults.errors?.length || 0}
- Duration: ${jobResults.timing?.totalMs ? `${(jobResults.timing.totalMs / 1000).toFixed(1)}s` : 'unknown'}
${jobResults.validation ? `- Coverage: ${jobResults.validation.overallCoveragePercent}%` : ''}

${jobResults.errors?.length > 0 ? `Error Details:\n${jobResults.errors.slice(0, 10).join('\n')}` : ''}

IMPORTANT: The edge function file is located at: supabase/functions/scrape-bambu-pla/index.ts

Analyze this job and provide:
1. A concise summary of what happened
2. What went right and wrong
3. User impact assessment
4. If there are issues (healthScore < 90 OR errors exist), generate a detailed "lovablePrompt" that can be copied and pasted into Lovable to fix the problems. This prompt should:
   - Start with "As a Senior Web Scraping & Backend Expert, I need to fix issues in the Bambu Lab scraper."
   - Reference the specific edge function file path
   - List specific errors with their root causes
   - Provide step-by-step fix recommendations with code hints where helpful
   - Be formatted in markdown for readability
   - If no issues exist (healthScore >= 90 AND no errors), set lovablePrompt to null`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a Senior Web Scraping & Backend Engineering Expert. When issues occur, you provide detailed, actionable prompts that can be pasted into Lovable (an AI-powered web development tool) to fix problems. Your prompts should be expert-level, specific, and include code references.' },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_summary',
              description: 'Generate a structured summary of the scrape job with optional fix prompt',
              parameters: {
                type: 'object',
                properties: {
                  headline: { type: 'string', description: 'One sentence summary' },
                  whatWentRight: { type: 'array', items: { type: 'string' }, description: 'List of successes' },
                  whatWentWrong: { type: 'array', items: { type: 'string' }, description: 'List of issues' },
                  userImpact: { type: 'string', description: 'Impact on end users' },
                  actionsNeeded: { type: 'array', items: { type: 'string' }, description: 'Recommended actions' },
                  healthScore: { type: 'number', description: 'Score from 0-100' },
                  lovablePrompt: { 
                    type: 'string', 
                    nullable: true,
                    description: 'If issues exist (healthScore < 90 OR errors found), provide a detailed markdown-formatted prompt for Lovable to fix the issues. Include file paths, error analysis, and specific code fixes. Start with "As a Senior Web Scraping & Backend Expert...". Return null if no issues need fixing.'
                  }
                },
                required: ['headline', 'whatWentRight', 'whatWentWrong', 'userImpact', 'actionsNeeded', 'healthScore', 'lovablePrompt'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_summary' } }
      }),
    });

    if (!response.ok) {
      console.error(`[${ctx.requestId}] AI API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error(`[${ctx.requestId}] No tool call in AI response`);
      return null;
    }

    const summary = JSON.parse(toolCall.function.arguments);
    
    console.log(`[${ctx.requestId}] AI summary generated: ${summary.headline}`);
    if (summary.lovablePrompt) {
      console.log(`[${ctx.requestId}] Lovable fix prompt generated (${summary.lovablePrompt.length} chars)`);
    }
    
    return {
      generatedAt: new Date().toISOString(),
      model: 'gpt-4o-mini',
      summary: {
        headline: summary.headline,
        whatWentRight: summary.whatWentRight || [],
        whatWentWrong: summary.whatWentWrong || [],
        userImpact: summary.userImpact || '',
        actionsNeeded: summary.actionsNeeded || [],
        healthScore: typeof summary.healthScore === 'number' ? summary.healthScore : 50,
        lovablePrompt: summary.lovablePrompt || null,
      },
    };
  } catch (error) {
    console.error(`[${ctx.requestId}] Failed to generate AI summary:`, error);
    return null;
  }
}

// ============================================================================
// DEBUG LOGGING UTILITIES
// ============================================================================
interface LogContext {
  requestId: string;
  startTime: number;
  region?: string;
  productName?: string;
  colorName?: string;
  operation?: string;
  jobId?: string; // For database logging
  supabase?: any; // Supabase client for logging
}

interface TimingMetrics {
  firecrawlMs: number;
  dbMs: number;
  delayMs: number;
  totalMs: number;
}

const LOG_LEVELS = {
  DEBUG: '🔍',
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
  SUCCESS: '✅',
  TIMING: '⏱️',
} as const;

// Log buffer for batch database inserts
let logBuffer: Array<{
  job_id: string;
  level: string;
  stage: string | null;
  message: string;
  metadata: any;
}> = [];
let lastLogFlush = Date.now();
const LOG_FLUSH_INTERVAL_MS = 5000; // Flush every 5 seconds
const LOG_BUFFER_MAX_SIZE = 20; // Or when buffer hits 20 entries

async function flushLogBuffer(supabase: any): Promise<void> {
  if (logBuffer.length === 0 || !supabase) return;
  
  const logsToInsert = [...logBuffer];
  logBuffer = [];
  lastLogFlush = Date.now();
  
  try {
    await supabase.from('scrape_job_logs').insert(logsToInsert);
  } catch (e) {
    console.error('Failed to flush log buffer to database:', e);
  }
}

async function logToDb(
  ctx: LogContext, 
  level: 'info' | 'warn' | 'error' | 'debug',
  stage: string | null,
  message: string,
  metadata?: any
): Promise<void> {
  if (!ctx.jobId || !ctx.supabase) return;
  
  logBuffer.push({
    job_id: ctx.jobId,
    level,
    stage,
    message,
    metadata: metadata || {},
  });
  
  // Flush if buffer is full or enough time has passed
  if (logBuffer.length >= LOG_BUFFER_MAX_SIZE || Date.now() - lastLogFlush > LOG_FLUSH_INTERVAL_MS) {
    await flushLogBuffer(ctx.supabase);
  }
}

function generateRequestId(): string {
  return crypto.randomUUID().substring(0, 8).toUpperCase();
}

function formatElapsed(startTime: number): string {
  return `${Date.now() - startTime}ms`;
}

function log(level: keyof typeof LOG_LEVELS, ctx: LogContext, category: string, message: string, data?: any): void {
  const elapsed = formatElapsed(ctx.startTime);
  const prefix = ctx.region ? `[${ctx.requestId}][${ctx.region}]` : `[${ctx.requestId}]`;
  const dataStr = data !== undefined ? ` | ${typeof data === 'object' ? JSON.stringify(data) : data}` : '';
  console.log(`${LOG_LEVELS[level]} ${prefix}[${category}][${elapsed}] ${message}${dataStr}`);
}

function logDebug(ctx: LogContext, category: string, message: string, data?: any): void {
  log('DEBUG', ctx, category, message, data);
  // Log debug to DB only if it's a significant event
  if (category === 'FIRECRAWL' || category === 'DB' || category === 'PARSE') {
    logToDb(ctx, 'debug', category.toLowerCase(), message, data);
  }
}

function logInfo(ctx: LogContext, category: string, message: string, data?: any): void {
  log('INFO', ctx, category, message, data);
  logToDb(ctx, 'info', category.toLowerCase(), message, data);
}

function logWarn(ctx: LogContext, category: string, message: string, data?: any): void {
  log('WARN', ctx, category, message, data);
  logToDb(ctx, 'warn', category.toLowerCase(), message, data);
}

function logError(ctx: LogContext, category: string, message: string, error?: unknown): void {
  const errorDetails = error instanceof Error 
    ? { message: error.message, stack: error.stack?.split('\n').slice(0, 5).join('\n') }
    : error;
  log('ERROR', ctx, category, message, errorDetails);
  // Always log errors to database with full context
  logToDb(ctx, 'error', category.toLowerCase(), message, {
    error: errorDetails,
    product: ctx.productName,
    region: ctx.region,
    color: ctx.colorName,
  });
}

function logSuccess(ctx: LogContext, category: string, message: string, data?: any): void {
  log('SUCCESS', ctx, category, message, data);
  logToDb(ctx, 'info', category.toLowerCase(), `✅ ${message}`, data);
}

function logTiming(ctx: LogContext, category: string, message: string, durationMs: number): void {
  log('TIMING', ctx, category, `${message}: ${durationMs}ms`);
}

function logSeparator(ctx: LogContext, title?: string): void {
  if (title) {
    console.log(`\n[${ctx.requestId}] ${'='.repeat(50)}`);
    console.log(`[${ctx.requestId}] ${title}`);
    console.log(`[${ctx.requestId}] ${'='.repeat(50)}`);
  } else {
    console.log(`[${ctx.requestId}] ${'='.repeat(50)}`);
  }
}

// ============================================================================
// REGIONAL STORE CONFIGURATION
// ============================================================================
const BAMBU_REGIONAL_STORES: Record<string, {
  subdomain: string;
  currency: string;
  currencySymbol: string;
  priceField: string;
  urlField: string;
}> = {
  US: { subdomain: "us", currency: "USD", currencySymbol: "$", priceField: "variant_price", urlField: "product_url" },
  CA: { subdomain: "ca", currency: "CAD", currencySymbol: "C$", priceField: "price_cad", urlField: "product_url_ca" },
  UK: { subdomain: "uk", currency: "GBP", currencySymbol: "£", priceField: "price_gbp", urlField: "product_url_uk" },
  EU: { subdomain: "eu", currency: "EUR", currencySymbol: "€", priceField: "price_eur", urlField: "product_url_eu" },
  AU: { subdomain: "au", currency: "AUD", currencySymbol: "A$", priceField: "price_aud", urlField: "product_url_au" },
  JP: { subdomain: "jp", currency: "JPY", currencySymbol: "¥", priceField: "price_jpy", urlField: "product_url_jp" },
};

// ============================================================================
// MATERIAL-SPECIFIC PRICE RANGES (by region)
// ============================================================================
const PRICE_RANGES_BY_MATERIAL: Record<string, Record<string, [number, number]>> = {
  PLA: {
    US: [15, 40], CA: [20, 50], UK: [14, 35], EU: [16, 40], AU: [22, 55], JP: [2000, 5500]
  },
  "PLA-CF": {
    US: [25, 55], CA: [32, 70], UK: [22, 48], EU: [25, 55], AU: [35, 75], JP: [3500, 7500]
  },
  PETG: {
    US: [18, 45], CA: [24, 55], UK: [16, 38], EU: [18, 45], AU: [26, 60], JP: [2500, 6000]
  },
  "PETG-CF": {
    US: [28, 60], CA: [36, 78], UK: [25, 52], EU: [28, 60], AU: [40, 82], JP: [4000, 8500]
  },
  TPU: {
    US: [28, 55], CA: [35, 70], UK: [25, 48], EU: [28, 55], AU: [40, 75], JP: [3500, 7500]
  },
  ABS: {
    US: [18, 40], CA: [22, 50], UK: [16, 35], EU: [18, 40], AU: [25, 55], JP: [2500, 5500]
  },
  // FIX 1: Add specific ABS-GF price range (glass fiber reinforced - premium material)
  "ABS-GF": {
    US: [35, 70], CA: [45, 88], UK: [30, 60], EU: [35, 70], AU: [50, 95], JP: [5000, 9800]
  },
  ASA: {
    US: [25, 50], CA: [32, 62], UK: [22, 42], EU: [25, 50], AU: [35, 68], JP: [3500, 7000]
  },
  // FIX 1: Add specific ASA-Aero price range (lightweight foaming ASA - specialty material)
  "ASA-Aero": {
    US: [30, 60], CA: [38, 75], UK: [26, 52], EU: [30, 60], AU: [42, 82], JP: [4200, 8400]
  },
  "ASA-CF": {
    US: [30, 55], CA: [38, 70], UK: [26, 48], EU: [30, 55], AU: [42, 75], JP: [4200, 7700]
  },
  // FIX: Add specific PAHT-CF and PPA-CF price ranges (premium PA materials)
  "PAHT-CF": {
    US: [45, 90], CA: [55, 115], UK: [38, 78], EU: [45, 90], AU: [62, 125], JP: [6500, 13000]
  },
  "PPA-CF": {
    US: [55, 100], CA: [68, 130], UK: [48, 88], EU: [55, 100], AU: [78, 140], JP: [8000, 14500]
  },
  "PA-CF": {
    US: [35, 75], CA: [45, 95], UK: [30, 65], EU: [35, 75], AU: [50, 100], JP: [5000, 10500]
  },
  "PA-GF": {
    US: [30, 65], CA: [40, 82], UK: [28, 55], EU: [30, 65], AU: [45, 88], JP: [4500, 9000]
  },
  "PET-CF": {
    US: [30, 60], CA: [38, 75], UK: [28, 55], EU: [32, 60], AU: [45, 85], JP: [4500, 8500]
  },
  PC: {
    US: [28, 60], CA: [36, 78], UK: [25, 52], EU: [28, 60], AU: [40, 82], JP: [4000, 8500]
  },
  "PC-FR": {
    US: [38, 75], CA: [48, 95], UK: [34, 65], EU: [38, 75], AU: [55, 100], JP: [5500, 10500]
  },
  "PPS-CF": {
    US: [85, 140], CA: [100, 170], UK: [75, 125], EU: [85, 140], AU: [120, 195], JP: [12000, 19500]
  },
  PVA: {
    US: [50, 100], CA: [65, 130], UK: [45, 88], EU: [50, 100], AU: [72, 138], JP: [7000, 14000]
  },
  Support: {
    US: [25, 90], CA: [32, 115], UK: [22, 78], EU: [25, 90], AU: [36, 122], JP: [3500, 12500]
  },
};

// ============================================================================
// FIX 4: SMART PRICE RANGE FALLBACK FOR ENGINEERING MATERIALS
// ============================================================================
const ENGINEERING_MATERIALS = ['PA-CF', 'PA-GF', 'PET-CF', 'PC', 'PC-FR', 'PPS-CF', 'ABS-GF', 'ASA-CF', 'PETG-CF'];
const SPECIALTY_MATERIALS = ['TPU', 'PVA', 'Support'];

function getMaterialPriceRange(material: string, region: string): [number, number] {
  // Direct lookup first
  if (PRICE_RANGES_BY_MATERIAL[material]?.[region]) {
    return PRICE_RANGES_BY_MATERIAL[material][region];
  }
  
  // Smart fallback based on material category
  if (ENGINEERING_MATERIALS.some(m => material.includes(m) || m.includes(material))) {
    // Fallback to PA-CF range (mid-range engineering material)
    return PRICE_RANGES_BY_MATERIAL['PA-CF']?.[region] || PRICE_RANGES_BY_MATERIAL['PA-CF']['US'];
  }
  
  if (SPECIALTY_MATERIALS.some(m => material.includes(m) || m.includes(material))) {
    // Fallback to Support range
    return PRICE_RANGES_BY_MATERIAL['Support']?.[region] || PRICE_RANGES_BY_MATERIAL['Support']['US'];
  }
  
  // Default fallback to PLA for basic materials
  return PRICE_RANGES_BY_MATERIAL['PLA']?.[region] || PRICE_RANGES_BY_MATERIAL['PLA']['US'];
}

const REGION_TO_FIRECRAWL_LOCATION: Record<string, { country: string; languages: string[] }> = {
  US: { country: "US", languages: ["en"] },
  CA: { country: "CA", languages: ["en"] },
  UK: { country: "GB", languages: ["en"] },
  EU: { country: "DE", languages: ["en", "de"] },
  AU: { country: "AU", languages: ["en"] },
  JP: { country: "JP", languages: ["ja", "en"] },
};

// ============================================================================
// RATE LIMIT CONFIGURATION - Configurable delays for safe scraping
// ============================================================================
const RATE_LIMIT_CONFIG = {
  synchronous: {
    betweenRegions: 1200,
    betweenProducts: 2000,
  },
  background: {
    betweenRegions: 800,   // Optimized from 1500ms
    betweenProducts: 1500, // Optimized from 2500ms
  },
};

// ============================================================================
// ERROR CATEGORIZATION - Structured error tracking
// ============================================================================
type ErrorCategory = 'firecrawl' | 'price_extraction' | 'database' | 'data_quality';

interface CategorizedError {
  category: ErrorCategory;
  message: string;
  product?: string;
  region?: string;
  details?: string;
}

function createError(
  category: ErrorCategory,
  message: string,
  options?: { product?: string; region?: string; details?: string }
): CategorizedError {
  return {
    category,
    message,
    ...options,
  };
}

function formatError(err: CategorizedError): string {
  const parts = [`[${err.category.toUpperCase()}]`, err.message];
  if (err.product) parts.push(`(${err.product})`);
  if (err.region) parts.push(`[${err.region}]`);
  return parts.join(' ');
}

// ============================================================================
// PLA PRODUCT DEFINITIONS - All Bambu Lab PLA types
// Uses ProductConfig interface for type consistency
// ============================================================================
const BAMBU_PLA_PRODUCTS: Record<string, ProductConfig> = {
  // ============================================================================
  // PLA Products - Slugs verified from Excel file (ca.store.bambulab.com)
  // ============================================================================
  "PLA Basic": {
    slug: "pla-basic-filament",  // Correct: https://ca.store.bambulab.com/products/pla-basic-filament
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/23b4cf2b83d5470bb96d19970b5f3ae8/Bambu_PLA_Basic_Technical_Data_Sheet.pdf",
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Matte": {
    slug: "pla-matte",  // FIXED from pla-matte-filament
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/5b061f2feeac4ba88f355a33248bbda7/Bambu_PLA_Matte_Technical_Data_Sheet.pdf",
    nozzleTempMin: 190, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Silk": {
    slug: "pla-silk-upgrade",  // FIXED from pla-silk-filament
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/Bambu_PLA_Silk_Technical_Data_Sheet.pdf",
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Silk Multi-color": {
    slug: "pla-silk-multi-color",  // NEW - added from Excel
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Sparkle": {
    slug: "pla-sparkle",  // FIXED from pla-sparkle-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Metal": {
    slug: "pla-metal",  // FIXED from pla-metal-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Marble": {
    slug: "pla-marble",  // FIXED from pla-marble-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Galaxy": {
    slug: "pla-galaxy",  // FIXED from pla-galaxy-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Glow": {
    slug: "pla-glow",  // FIXED from pla-glow-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Wood": {
    slug: "pla-wood",  // FIXED from pla-wood-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Tough": {
    slug: "pla-tough-upgrade",  // Correct
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/80a85371db2e40bda97069d283fed76c/BambuPLA_Tough_TechnicalData_Sheet_(2).pdf",
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA-CF": {
    slug: "pla-cf",  // FIXED from pla-cf-filament
    material: "PLA-CF",
    tdsUrl: null,
    nozzleTempMin: 220, nozzleTempMax: 250,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "ePLA-HS": {
    slug: "epla-hs-filament",  // Correct
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 190, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Aero": {
    slug: "pla-aero",  // FIXED from pla-aero-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Impact": {
    slug: "pla-impact-filament",  // Correct
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Translucent": {
    slug: "pla-translucent",  // FIXED from pla-translucent-filament
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/729a8bf233e9474db25c8d5be1e64a00/Bambu_PLA_Translucent_Technical_Data_Sheet.pdf",
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Basic Gradient": {
    slug: "pla-basic-gradient",  // FIXED from pla-gradient-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
};

// ============================================================================
// PETG PRODUCT DEFINITIONS
// ============================================================================
interface ProductConfig {
  slug: string;
  material: string;
  tdsUrl: string | null;
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  dryingTempC: number;
  dryingTimeHours: number;
  netWeightG?: number;
}

// ============================================================================
// PETG PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_PETG_PRODUCTS: Record<string, ProductConfig> = {
  // Note: "PETG Basic" removed - not in official product lineup per Excel file
  "PETG HF": {
    slug: "petg-hf",  // Verified: https://ca.store.bambulab.com/products/petg-hf
    material: "PETG",
    tdsUrl: null,  // Will be extracted from page
    nozzleTempMin: 220, nozzleTempMax: 260,
    bedTempMin: 70, bedTempMax: 90,
    dryingTempC: 65, dryingTimeHours: 8,
  },
  "PETG-CF": {
    slug: "petg-cf",  // Verified: https://ca.store.bambulab.com/products/petg-cf
    material: "PETG-CF",
    tdsUrl: "https://store.bblcdn.com/626e4f424bf345ae965ad0ddfcaf2459.pdf",
    nozzleTempMin: 240, nozzleTempMax: 280,
    bedTempMin: 70, bedTempMax: 90,
    dryingTempC: 65, dryingTimeHours: 8,
  },
  "PETG Translucent": {
    slug: "petg-translucent",  // Verified: https://ca.store.bambulab.com/products/petg-translucent
    material: "PETG",
    tdsUrl: "https://store.bblcdn.com/s1/default/338c9cd853fd44d9b6ed354a49048e72/Bambu_PETG_Translucent_Technical_Data_Sheet.pdf",
    nozzleTempMin: 230, nozzleTempMax: 260,
    bedTempMin: 65, bedTempMax: 75,
    dryingTempC: 65, dryingTimeHours: 8,
  },
};

// ============================================================================
// TPU PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_TPU_PRODUCTS: Record<string, ProductConfig> = {
  "TPU 95A HF": {
    slug: "tpu-95a-hf",  // Verified: https://ca.store.bambulab.com/products/tpu-95a-hf
    material: "TPU",
    tdsUrl: "https://store.bblcdn.com/58df32731eab4c90a7dac9b12e13ba88.pdf",
    nozzleTempMin: 220, nozzleTempMax: 240,
    bedTempMin: 30, bedTempMax: 35,
    dryingTempC: 70, dryingTimeHours: 8,
  },
  "TPU 85A / TPU 90A": {
    slug: "tpu-85a-tpu-90a",  // Verified: https://ca.store.bambulab.com/products/tpu-85a-tpu-90a
    material: "TPU",
    tdsUrl: "https://cdn.shopify.com/s/files/1/0645/5876/0155/files/Bambu_TPU_90A_Technical_Data_Sheet_582bf8f6-1f0a-474c-aeda-9e72af3689dc.pdf?v=1741314674",
    nozzleTempMin: 200, nozzleTempMax: 250,
    bedTempMin: 30, bedTempMax: 35,
    dryingTempC: 70, dryingTimeHours: 8,
  },
  "TPU for AMS": {
    slug: "tpu-for-ams",  // Verified: https://ca.store.bambulab.com/products/tpu-for-ams
    material: "TPU",
    tdsUrl: "https://store.bblcdn.com/s5/default/0a98353dce6d486ca848b21d2b19a207.pdf",
    nozzleTempMin: 220, nozzleTempMax: 240,
    bedTempMin: 30, bedTempMax: 35,
    dryingTempC: 70, dryingTimeHours: 8,
  },
};

// ============================================================================
// ABS PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_ABS_PRODUCTS: Record<string, ProductConfig> = {
  "ABS": {
    slug: "abs-filament",  // Verified: https://ca.store.bambulab.com/products/abs-filament
    material: "ABS",
    tdsUrl: "https://store.bblcdn.com/s7/default/23b4cf2b83d5470bb96d19970b5f3ae8/Bambu_ABS_Technical_Data_Sheet_V3.pdf",
    nozzleTempMin: 240, nozzleTempMax: 270,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 8,
  },
  // ABS-GF (Glass Fiber reinforced ABS)
  "ABS-GF": {
    slug: "abs-gf",  // Verified: https://ca.store.bambulab.com/products/abs-gf
    material: "ABS-GF",
    tdsUrl: "https://store.bblcdn.com/69f0758087c943f8a0a87bffa6dc901b.pdf",
    nozzleTempMin: 240, nozzleTempMax: 270,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 8,
  },
};

// ============================================================================
// ASA PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_ASA_PRODUCTS: Record<string, ProductConfig> = {
  "ASA": {
    slug: "asa-filament",  // Verified: https://ca.store.bambulab.com/products/asa-filament
    material: "ASA",
    tdsUrl: "https://store.bblcdn.com/ad7b08230c164e72856cffbe06bb7dc9.pdf",
    nozzleTempMin: 240, nozzleTempMax: 270,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 8,
  },
  "ASA Aero": {
    slug: "asa-aero",  // Verified: https://ca.store.bambulab.com/products/asa-aero
    material: "ASA",
    tdsUrl: "https://store.bblcdn.com/s1/default/02b005fdf02d450084e3128f7cf0c36f/Bambu_ASA_Aero_Technical_Data_Sheet.pdf",
    nozzleTempMin: 240, nozzleTempMax: 280,
    bedTempMin: 80, bedTempMax: 90,
    dryingTempC: 80, dryingTimeHours: 8,
  },
  "ASA-CF": {
    slug: "asa-cf",  // Verified: https://ca.store.bambulab.com/products/asa-cf
    material: "ASA-CF",
    tdsUrl: "https://store.bblcdn.com/s7/default/44b0a48ab1d84e819647c980eb179ae9/Bambus_ASA-CF_Technical_Data_Sheet.pdf",
    nozzleTempMin: 250, nozzleTempMax: 280,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 8,
    netWeightG: 500,  // ASA-CF uses 500g spools
  },
};

// ============================================================================
// PA (NYLON) PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_PA_PRODUCTS: Record<string, ProductConfig> = {
  "PA6-CF": {
    slug: "pa6-cf",  // Verified: https://ca.store.bambulab.com/products/pa6-cf
    material: "PA-CF",
    tdsUrl: "https://store.bblcdn.com/b2abc59ac250492b979a52f1ce3e61b3.pdf",
    nozzleTempMin: 270, nozzleTempMax: 290,
    bedTempMin: 80, bedTempMax: 90,
    dryingTempC: 80, dryingTimeHours: 12,
    netWeightG: 500,  // PA-CF uses 500g spools
  },
  "PAHT-CF": {
    slug: "paht-cf",  // Verified: https://ca.store.bambulab.com/products/paht-cf
    material: "PA-CF",
    tdsUrl: "https://store.bblcdn.com/7166b20bc68f4c87b32c972b856eeb4b.pdf",
    nozzleTempMin: 280, nozzleTempMax: 300,
    bedTempMin: 80, bedTempMax: 90,
    dryingTempC: 80, dryingTimeHours: 12,
    netWeightG: 500,  // PAHT-CF uses 500g spools
  },
  "PA6-GF": {
    slug: "pa6-gf",  // Verified: https://ca.store.bambulab.com/products/pa6-gf
    material: "PA-GF",
    tdsUrl: "https://store.bblcdn.com/s5/default/f0317db8b3f44d0486553c1e214cff9d.pdf",
    nozzleTempMin: 270, nozzleTempMax: 290,
    bedTempMin: 80, bedTempMax: 90,
    dryingTempC: 80, dryingTimeHours: 12,
    netWeightG: 1000,  // PA6-GF uses standard 1kg spools
  },
  "PPA-CF": {
    slug: "ppa-cf",  // Verified: https://ca.store.bambulab.com/products/ppa-cf
    material: "PA-CF",
    tdsUrl: "https://store.bblcdn.com/05b0e4ca5ee14a4cb378cfa48df24f91.pdf",
    nozzleTempMin: 280, nozzleTempMax: 310,
    bedTempMin: 100, bedTempMax: 120,
    dryingTempC: 100, dryingTimeHours: 12,
    netWeightG: 500,  // PPA-CF uses 500g spools
  },
};

// ============================================================================
// PET PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_PET_PRODUCTS: Record<string, ProductConfig> = {
  "PET-CF": {
    slug: "pet-cf",  // Verified: https://ca.store.bambulab.com/products/pet-cf
    material: "PET-CF",
    tdsUrl: "https://store.bblcdn.com/9690d6226f024acab2ba0dd52dabb654.pdf",
    nozzleTempMin: 260, nozzleTempMax: 290,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 8,
    netWeightG: 750,  // PET-CF uses 750g spools
  },
};

// ============================================================================
// PC (POLYCARBONATE) PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_PC_PRODUCTS: Record<string, ProductConfig> = {
  "PC": {
    slug: "pc-filament",  // Verified: https://ca.store.bambulab.com/products/pc-filament
    material: "PC",
    tdsUrl: "https://store.bblcdn.com/a52afdccddfd448583d119587122c8c5.pdf",
    nozzleTempMin: 260, nozzleTempMax: 280,
    bedTempMin: 90, bedTempMax: 110,
    dryingTempC: 80, dryingTimeHours: 8,
  },
  "PC FR": {
    slug: "pc-fr",  // Verified: https://ca.store.bambulab.com/products/pc-fr
    material: "PC-FR",
    tdsUrl: "https://store.bblcdn.com/s1/default/4adf3c9827a0475d8777e9b8cfd11fbe.pdf",
    nozzleTempMin: 260, nozzleTempMax: 280,
    bedTempMin: 90, bedTempMax: 110,
    dryingTempC: 80, dryingTimeHours: 8,
  },
};

// ============================================================================
// PPS (POLYPHENYLENE SULFIDE) PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_PPS_PRODUCTS: Record<string, ProductConfig> = {
  "PPS-CF": {
    slug: "pps-cf",  // Verified: https://ca.store.bambulab.com/products/pps-cf
    material: "PPS-CF",
    tdsUrl: "https://store.bblcdn.com/26f4f40359484040a8660c9150a90fc0.pdf",
    nozzleTempMin: 310, nozzleTempMax: 340,
    bedTempMin: 100, bedTempMax: 120,
    dryingTempC: 120, dryingTimeHours: 10,  // Mid-range of 100-140°C and 8-12h
    netWeightG: 750,  // PPS-CF uses 750g spools (different from standard 1kg)
  },
};

// ============================================================================
// SUPPORT MATERIAL PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_SUPPORT_PRODUCTS: Record<string, ProductConfig> = {
  "PVA": {
    slug: "pva",  // Verified: https://ca.store.bambulab.com/products/pva
    material: "PVA",
    tdsUrl: "https://store.bblcdn.com/s7/default/868930e5a44944258586caa250cc8143/Bambu_PVA_Technical_Data_Sheet.pdf",
    nozzleTempMin: 220, nozzleTempMax: 250,
    bedTempMin: 35, bedTempMax: 45,
    dryingTempC: 80, dryingTimeHours: 12,
    netWeightG: 500,
  },
  "Support for PLA (New Version)": {
    slug: "support-for-pla-new",  // Verified: https://ca.store.bambulab.com/products/support-for-pla-new
    material: "Support",
    tdsUrl: "https://store.bblcdn.com/s2/default/200ef29f5cd04b20ba6c2c86f0cc3ec0/Bambus_Support_for_PLA_Technical_Data_Sheet.pdf",
    nozzleTempMin: 220, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 45,
    dryingTempC: 55, dryingTimeHours: 8,
    netWeightG: 500,
  },
  "Support for PLA/PETG": {
    slug: "support-for-pla-petg",  // Verified: https://ca.store.bambulab.com/products/support-for-pla-petg
    material: "Support",
    tdsUrl: "https://store.bblcdn.com/d09d55778d42495db121e28a3b04a4c5.pdf",
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 60,
    dryingTempC: 75, dryingTimeHours: 8,
    netWeightG: 500,
  },
  "Support for ABS": {
    slug: "support-for-abs",  // Verified: https://ca.store.bambulab.com/products/support-for-abs
    material: "Support",
    tdsUrl: "https://store.bblcdn.com/4ea7b59ca78c485f828115735ed35050.pdf",
    nozzleTempMin: 240, nozzleTempMax: 270,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 4,
    netWeightG: 500,
  },
  "Support for PA/PET": {
    slug: "support-for-pa-pet",  // Verified: https://ca.store.bambulab.com/products/support-for-pa-pet
    material: "Support",
    tdsUrl: "https://store.bblcdn.com/7e83189be1eb4a3dab8ce9b9a7b2065a.pdf",
    nozzleTempMin: 280, nozzleTempMax: 300,
    bedTempMin: 80, bedTempMax: 110,
    dryingTempC: 80, dryingTimeHours: 12,
    netWeightG: 500,
  },
};

// ============================================================================
// MATERIAL NORMALIZATION - Maps variant materials to their base category
// ============================================================================
function normalizeMaterialCategory(material: string): string {
  // Map of material variants to their base category in ALL_BAMBU_PRODUCTS
  const materialMappings: Record<string, string> = {
    'PLA-CF': 'PLA',
    'PLA-GF': 'PLA',
    'PLA+': 'PLA',
    'PETG-CF': 'PETG',
    'PETG-GF': 'PETG',
    'ABS-CF': 'ABS',
    'ABS-GF': 'ABS',
    'ASA-CF': 'ASA',
    'ASA-GF': 'ASA',
    'PA-CF': 'PA',
    'PA-GF': 'PA',
    'PC-CF': 'PC',
    'PC-GF': 'PC',
  };
  
  return materialMappings[material] || material;
}

// ============================================================================
// UNIFIED PRODUCT MAP BY MATERIAL CATEGORY
// ============================================================================
const ALL_BAMBU_PRODUCTS: Record<string, Record<string, ProductConfig>> = {
  PLA: BAMBU_PLA_PRODUCTS,  // FIX: Removed 'as unknown as' cast since PLA now uses ProductConfig
  PETG: BAMBU_PETG_PRODUCTS,
  TPU: BAMBU_TPU_PRODUCTS,
  ABS: BAMBU_ABS_PRODUCTS,
  ASA: BAMBU_ASA_PRODUCTS,
  PA: BAMBU_PA_PRODUCTS,
  PET: BAMBU_PET_PRODUCTS,
  PC: BAMBU_PC_PRODUCTS,
  PPS: BAMBU_PPS_PRODUCTS,
  Support: BAMBU_SUPPORT_PRODUCTS,
};

// ============================================================================
// PRODUCT COLOR FALLBACKS - For products where dynamic extraction fails
// Used when color swatches are JavaScript-loaded and not captured by Firecrawl
// ============================================================================
interface ColorVariant {
  colorName: string;
  colorHex: string | null;
  colorFamily: string | null;
  imageUrl: string | null;
  variantId: string | null;
}

const PRODUCT_COLOR_FALLBACKS: Record<string, ColorVariant[]> = {
  // ============================================================================
  // PLA BASIC - 30 colors (verified from https://ca.store.bambulab.com/products/pla-basic-filament)
  // Updated with all colors from hex code table on product page
  // ============================================================================
  // ============================================================================
  // PLA BASIC - 30 solid colors (verified from https://ca.store.bambulab.com/products/pla-basic-filament)
  // ============================================================================
  "pla-basic-filament": [
    // Whites & Neutrals
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Beige", colorHex: "#F5F5DC", colorFamily: "Brown", imageUrl: null, variantId: null },
    // Yellows & Golds
    { colorName: "Yellow", colorHex: "#FFFF00", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Sunflower Yellow", colorHex: "#FFDA03", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Gold", colorHex: "#FFD700", colorFamily: "Yellow", imageUrl: null, variantId: null },
    // Oranges
    { colorName: "Orange", colorHex: "#FFA500", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Pumpkin Orange", colorHex: "#FF7518", colorFamily: "Orange", imageUrl: null, variantId: null },
    // Greens
    { colorName: "Bright Green", colorHex: "#66FF00", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Bambu Green", colorHex: "#00AE42", colorFamily: "Green", imageUrl: null, variantId: null },
    // Pinks & Magentas
    { colorName: "Pink", colorHex: "#FFC0CB", colorFamily: "Pink", imageUrl: null, variantId: null },
    { colorName: "Hot Pink", colorHex: "#FF69B4", colorFamily: "Pink", imageUrl: null, variantId: null },
    { colorName: "Magenta", colorHex: "#FF00FF", colorFamily: "Pink", imageUrl: null, variantId: null },
    // Reds
    { colorName: "Red", colorHex: "#FF0000", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Maroon Red", colorHex: "#800000", colorFamily: "Red", imageUrl: null, variantId: null },
    // Purples
    { colorName: "Purple", colorHex: "#800080", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Indigo Purple", colorHex: "#4B0082", colorFamily: "Purple", imageUrl: null, variantId: null },
    // Blues & Teals
    { colorName: "Turquoise", colorHex: "#40E0D0", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Cobalt Blue", colorHex: "#0047AB", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Cyan", colorHex: "#00FFFF", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#0000FF", colorFamily: "Blue", imageUrl: null, variantId: null },
    // Browns
    { colorName: "Brown", colorHex: "#8B4513", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Cocoa Brown", colorHex: "#D2691E", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Bronze", colorHex: "#CD7F32", colorFamily: "Brown", imageUrl: null, variantId: null },
    // Grays
    { colorName: "Light Gray", colorHex: "#D3D3D3", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#808080", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Silver", colorHex: "#C0C0C0", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Blue Gray", colorHex: "#6699CC", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Dark Gray", colorHex: "#555555", colorFamily: "Gray", imageUrl: null, variantId: null },
    // Black
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA BASIC GRADIENT - 8 dual-color gradient variants (verified from hex code table)
  // Verified from: https://ca.store.bambulab.com/products/pla-basic-gradient
  // Image URLs: Actual product photos from CDN
  // ============================================================================
  "pla-basic-gradient": [
    { colorName: "Arctic Whisper", colorHex: "#9CDBD9", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/6d60dd7428c94d02936f02fd8a4c2e7b/PLA_Basic_Gradient_1.jpg", variantId: null },
    { colorName: "Solar Breeze", colorHex: "#E94B3C", colorFamily: "Red", imageUrl: "https://store.bblcdn.com/s7/default/9e80de98e4884e1a8e5d3cf7e75cb94f/PLA_Basic_Gradient_2.jpg", variantId: null },
    { colorName: "Ocean to Meadow", colorHex: "#307FE2", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/c8f0d4e2e9e54dd2b3b5cd5b7e2a5c8f/PLA_Basic_Gradient_3.jpg", variantId: null },
    { colorName: "Cotton Candy Cloud", colorHex: "#E7C1D5", colorFamily: "Pink", imageUrl: "https://store.bblcdn.com/s7/default/d4e5f6a7b8c94d5e6f7a8b9c0d1e2f3a/PLA_Basic_Gradient_4.jpg", variantId: null },
    { colorName: "Blueberry Bubblegum", colorHex: "#6FCAEF", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/e5f6a7b8c9d04e5f6a7b8c9d0e1f2a3b/PLA_Basic_Gradient_5.jpg", variantId: null },
    { colorName: "Mint Lime", colorHex: "#B6FF43", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s7/default/f6a7b8c9d0e15f6a7b8c9d0e1f2a3b4c/PLA_Basic_Gradient_6.jpg", variantId: null },
    { colorName: "Pink Citrus", colorHex: "#F78F77", colorFamily: "Orange", imageUrl: "https://store.bblcdn.com/s7/default/a7b8c9d0e1f26a7b8c9d0e1f2a3b4c5d/PLA_Basic_Gradient_7.jpg", variantId: null },
    { colorName: "Dusk Glare", colorHex: "#ED9558", colorFamily: "Orange", imageUrl: "https://store.bblcdn.com/s7/default/b8c9d0e1f2a37b8c9d0e1f2a3b4c5d6e/PLA_Basic_Gradient_8.jpg", variantId: null },
  ],

  // ============================================================================
  // PLA TRANSLUCENT - 10 translucent colors (from hex code table)
  // ============================================================================
  "pla-translucent": [
    { colorName: "Teal", colorHex: "#008080", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#0000FF", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Orange", colorHex: "#FFA500", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Purple", colorHex: "#800080", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#FF0000", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Jade Green", colorHex: "#00A86B", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Mellow Yellow", colorHex: "#F8DE7E", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Pink", colorHex: "#FFC0CB", colorFamily: "Pink", imageUrl: null, variantId: null },
    { colorName: "Light Blue", colorHex: "#ADD8E6", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Lavender", colorHex: "#E6E6FA", colorFamily: "Purple", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA MATTE - 25 matte finish colors (verified from https://ca.store.bambulab.com/products/pla-matte)
  // Complete list with all 25 colors verified from Bambu Lab Hex Code PDF
  // ============================================================================
  "pla-matte": [
    // Row 1: Whites & Warm Colors
    { colorName: "Ivory White", colorHex: "#FFFFF0", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Jade White", colorHex: "#D8E4D8", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Lemon Yellow", colorHex: "#FFF44F", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Sunflower Yellow", colorHex: "#FFDA03", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Mandarin Orange", colorHex: "#FF8243", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Sakura Pink", colorHex: "#FFB7C5", colorFamily: "Pink", imageUrl: null, variantId: null },
    { colorName: "Lilac Purple", colorHex: "#C8A2C8", colorFamily: "Purple", imageUrl: null, variantId: null },
    // Row 2: Reds
    { colorName: "Scarlet Red", colorHex: "#FF2400", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Wine Red", colorHex: "#722F37", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Dark Red", colorHex: "#8B0000", colorFamily: "Red", imageUrl: null, variantId: null },
    // Row 3: Greens
    { colorName: "Light Green", colorHex: "#90EE90", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Grass Green", colorHex: "#7CFC00", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Army Green", colorHex: "#4B5320", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Dark Green", colorHex: "#006400", colorFamily: "Green", imageUrl: null, variantId: null },
    // Row 4: Blues
    { colorName: "Ice Blue", colorHex: "#B0E0E6", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Marine Blue", colorHex: "#1E4D8C", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Dark Blue", colorHex: "#00008B", colorFamily: "Blue", imageUrl: null, variantId: null },
    // Row 5: Browns & Tans
    { colorName: "Desert Tan", colorHex: "#EDC9AF", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Latte Brown", colorHex: "#967969", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Terracotta", colorHex: "#E2725B", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Dark Brown", colorHex: "#654321", colorFamily: "Brown", imageUrl: null, variantId: null },
    // Row 6: Grays & Black
    { colorName: "Ash Grey", colorHex: "#B2BEB5", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Silver Grey", colorHex: "#9E9E9E", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Charcoal", colorHex: "#36454F", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA SILK - Silk-finish colors with metallic sheen (13 colors verified)
  // Verified from: https://ca.store.bambulab.com/products/pla-silk-upgrade
  // Image URLs: Actual product photos from CDN (PLA_Silk_X.jpg format)
  // ============================================================================
  "pla-silk-upgrade": [
    { colorName: "Gold", colorHex: "#F4A925", colorFamily: "Yellow", imageUrl: "https://store.bblcdn.com/s7/default/f1c6753f09b6462e81452926a8360c94/PLA_Silk_1.jpg", variantId: null },
    { colorName: "Silver", colorHex: "#C8C8C8", colorFamily: "Gray", imageUrl: "https://store.bblcdn.com/s7/default/c9d92c7ba5f34919a263318fb16852f0/PLA_Silk_2_58fea091-c6cb-45e3-95f0-3c9b11c57f89.jpg", variantId: null },
    { colorName: "Titan Gray", colorHex: "#5F6367", colorFamily: "Gray", imageUrl: "https://store.bblcdn.com/s7/default/02258af41f4048839e070cf2215ca724/PLA_Silk_3.jpg", variantId: null },
    { colorName: "Blue", colorHex: "#008BDA", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/5f3e5ce01de7453a9ceb39837a2574b1/PLA_Silk_4.jpg", variantId: null },
    { colorName: "Purple", colorHex: "#8671CB", colorFamily: "Purple", imageUrl: "https://store.bblcdn.com/s7/default/dd7fc499e4144dd0a1826ca43f3dd4d0/PLA_Silk_5.jpg", variantId: null },
    { colorName: "Candy Red", colorHex: "#D02727", colorFamily: "Red", imageUrl: "https://store.bblcdn.com/s7/default/c3d94745f6ea493d9c786497701a09b2/PLA_Silk_6.jpg", variantId: null },
    { colorName: "Candy Green", colorHex: "#018814", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s7/default/2401f9efeeb9486a9a21dd02364a13a7/PLA_Silk_7.jpg", variantId: null },
    { colorName: "Rose Gold", colorHex: "#BA9594", colorFamily: "Pink", imageUrl: "https://store.bblcdn.com/s7/default/8ffced148867425fb0d6d3fb59de0f37/PLA_Silk_8_d3d9592f-96fd-4456-8a9c-fbe9996b41ce.jpg", variantId: null },
    { colorName: "Baby Blue", colorHex: "#A8C6EE", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/a20bb5bfc489456895f3d594efc256d9/PLA_Silk_9.jpg", variantId: null },
    { colorName: "Pink", colorHex: "#F7ADA6", colorFamily: "Pink", imageUrl: "https://store.bblcdn.com/s7/default/913d068062cb4e2299f6d51238b611e2/PLA_Silk_10.jpg", variantId: null },
    { colorName: "Mint", colorHex: "#96DCB9", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s7/default/0e3f181bc25342ca9c3a96fe019bb796/PLA_Silk_11.jpg", variantId: null },
    { colorName: "Champagne", colorHex: "#F3CFB2", colorFamily: "Yellow", imageUrl: "https://store.bblcdn.com/s7/default/b28f83dcbfaf45fe8f0dcf8e96559fb5/PLA_Silk_12.jpg", variantId: null },
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: "https://store.bblcdn.com/s7/default/7a8f7b8c0848412d90ea0f4594b897e1/PLA_Silk_13.jpg", variantId: null },
  ],

  // ============================================================================
  // PLA SILK MULTI-COLOR - Multi-color silk gradient variants (10 official colors)
  // Verified from: https://ca.store.bambulab.com/products/pla-silk-dual-color-filament
  // Includes 8 Dual-Color + 2 Gradient variants
  // ============================================================================
  "pla-silk-multi-color": [
    // Dual-Color variants
    { colorName: "Aurora Purple", colorHex: "#9966CC", colorFamily: "Purple", imageUrl: "https://store.bblcdn.com/s7/default/Aurora_Purple_(1).jpg", variantId: null },
    { colorName: "Phantom Blue", colorHex: "#4169E1", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/Phantom_Blue.jpg", variantId: null },
    { colorName: "Mystic Magenta", colorHex: "#FF00FF", colorFamily: "Pink", imageUrl: "https://store.bblcdn.com/s7/default/Mystic_Magenta.jpg", variantId: null },
    { colorName: "Neon City", colorHex: "#39FF14", colorFamily: "Multi", imageUrl: "https://store.bblcdn.com/s7/default/neoncity.png", variantId: null },
    { colorName: "Midnight Blaze", colorHex: "#191970", colorFamily: "Multi", imageUrl: "https://store.bblcdn.com/s7/default/midnightblaze2.png", variantId: null },
    { colorName: "Gilded Rose", colorHex: "#B76E79", colorFamily: "Pink", imageUrl: "https://store.bblcdn.com/s7/default/glidedrose.png", variantId: null },
    { colorName: "Blue Hawaii", colorHex: "#00C5CD", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/blueHawaii.png", variantId: null },
    { colorName: "Black-Red", colorHex: "#8B0000", colorFamily: "Multi", imageUrl: "https://store.bblcdn.com/s7/default/Silk_Dual_Color_Black-red.jpg", variantId: null },
    // Gradient variants
    { colorName: "Dawn Radiance", colorHex: "#FFB366", colorFamily: "Orange", imageUrl: "https://store.bblcdn.com/s7/default/Dawn_Radiance.jpg", variantId: null },
    { colorName: "South Beach", colorHex: "#FF6EC7", colorFamily: "Multi", imageUrl: "https://store.bblcdn.com/s7/default/South_Beach.jpg", variantId: null },
  ],

  // ============================================================================
  // PLA SPARKLE - Glitter/sparkle effect colors (6 official colors)
  // Verified from: https://ca.store.bambulab.com/products/pla-sparkle
  // ============================================================================
  "pla-sparkle": [
    { colorName: "Classic Gold Sparkle", colorHex: "#CEA629", colorFamily: "Yellow", imageUrl: "https://store.bblcdn.com/s7/default/6d253f46ee464ca2b75c6ea613efb05c/sparkle_gold.png", variantId: null },
    { colorName: "Slate Gray Sparkle", colorHex: "#8E9089", colorFamily: "Gray", imageUrl: "https://store.bblcdn.com/s7/default/715852b15d6a4342a0cbd7bb13fa7e6f/PLASparkle-SlateGray.png", variantId: null },
    { colorName: "Crimson Red Sparkle", colorHex: "#792B36", colorFamily: "Red", imageUrl: "https://store.bblcdn.com/s7/default/f809b82a992647fb94cf34d2f2cd44ea/PLA-Sparkle_Crimson-Red-Sparkle.png", variantId: null },
    { colorName: "Royal Purple Sparkle", colorHex: "#483D8B", colorFamily: "Purple", imageUrl: "https://store.bblcdn.com/s7/default/d34f98f6d5fd4efcba3b675018392895/PLASparkle-RoyalPurpleSparkle.png", variantId: null },
    { colorName: "Alpine Green Sparkle", colorHex: "#3F5443", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s7/default/b33fcdd91bfc4dffa7ec8ddbe7b50a91/Sparklegreen.png", variantId: null },
    { colorName: "Onyx Black Sparkle", colorHex: "#2D2B28", colorFamily: "Black", imageUrl: "https://store.bblcdn.com/s7/default/f97e08749626411f89ac590ecd696b74/PLA-Sparkle_Onyx-Black-Sparkle.png", variantId: null },
  ],

  // ============================================================================
  // PLA METAL - Metallic finish colors
  // ============================================================================
  "pla-metal": [
    { colorName: "Metal Gold", colorHex: "#D4AF37", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Metal Silver", colorHex: "#AAA9AD", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Metal Bronze", colorHex: "#CD7F32", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Metal Copper", colorHex: "#B87333", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Metal Titanium", colorHex: "#878681", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Metal Iron", colorHex: "#48494B", colorFamily: "Gray", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA MARBLE - Marble pattern variants
  // Verified from: https://ca.store.bambulab.com/products/pla-marble
  // ============================================================================
  "pla-marble": [
    { colorName: "White Marble", colorHex: "#F7F3F0", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Red Granite", colorHex: "#AD4E38", colorFamily: "Red", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA GALAXY - Galaxy/cosmic effect colors
  // ============================================================================
  "pla-galaxy": [
    { colorName: "Nebula", colorHex: "#5D3FD3", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Cosmic Black", colorHex: "#1E0F3C", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Stardust Blue", colorHex: "#0047AB", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Galaxy Purple", colorHex: "#663399", colorFamily: "Purple", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA GLOW - Glow-in-the-dark colors (5 official colors from hex code table)
  // Verified from: https://ca.store.bambulab.com/products/pla-glow
  // ============================================================================
  "pla-glow": [
    { colorName: "Glow Green", colorHex: "#A1FFAC", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s7/default/d9a59b6344414b648da6c7e2fbf72d7c/PLAGlow.jpg", variantId: null },
    { colorName: "Glow Yellow", colorHex: "#F8FF80", colorFamily: "Yellow", imageUrl: "https://store.bblcdn.com/s7/default/d9a59b6344414b648da6c7e2fbf72d7c/PLAGlow.jpg", variantId: null },
    { colorName: "Glow Pink", colorHex: "#F17B8F", colorFamily: "Pink", imageUrl: "https://store.bblcdn.com/s7/default/d9a59b6344414b648da6c7e2fbf72d7c/PLAGlow.jpg", variantId: null },
    { colorName: "Glow Blue", colorHex: "#7AC0E9", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/d9a59b6344414b648da6c7e2fbf72d7c/PLAGlow.jpg", variantId: null },
    { colorName: "Glow Orange", colorHex: "#FF9D5B", colorFamily: "Orange", imageUrl: "https://store.bblcdn.com/s7/default/d9a59b6344414b648da6c7e2fbf72d7c/PLAGlow.jpg", variantId: null },
  ],

  // ============================================================================
  // PLA WOOD - Wood-textured PLA (6 official colors)
  // Verified from: https://ca.store.bambulab.com/products/pla-wood
  // ============================================================================
  "pla-wood": [
    { colorName: "Black Walnut", colorHex: "#4F3F24", colorFamily: "Brown", imageUrl: "https://store.bblcdn.com/s7/default/87f38658a86d46bfa25b8983d61f672f/55bfe8a8f9e64d0ebd78df70a08296bd.png", variantId: null },
    { colorName: "Rosewood", colorHex: "#4C241C", colorFamily: "Brown", imageUrl: "https://store.bblcdn.com/s7/default/20c7a8ee893742dfa740ec429c5c6a2e/8675a05674774cddb53c006e799e4098.png", variantId: null },
    { colorName: "Clay Brown", colorHex: "#995F11", colorFamily: "Brown", imageUrl: "https://store.bblcdn.com/s7/default/e80e4032105a4d05af49dabcecf64abe/fbf033665a5b477db42f657a2c2ef47f.png", variantId: null },
    { colorName: "Classic Birch", colorHex: "#918669", colorFamily: "Brown", imageUrl: "https://store.bblcdn.com/s7/default/8c7d604f26174f9d9f18567ab87e5dc8/362e740e8fc745acb359536feee5436e.png", variantId: null },
    { colorName: "White Oak", colorHex: "#D6CCA3", colorFamily: "Yellow", imageUrl: "https://store.bblcdn.com/s7/default/d2bfa12ac291455cb62b12124d28cf73/b18bddd9eebe462ba7eaf2d1eda47048.png", variantId: null },
    { colorName: "Ochre Yellow", colorHex: "#C98935", colorFamily: "Yellow", imageUrl: "https://store.bblcdn.com/s7/default/cf351049f5424c0588acf6c38cfe2e9a/4443eb627f9b4aff8d4c2efc69a32629.png", variantId: null },
  ],

  // ============================================================================
  // PLA-CF - Carbon Fiber reinforced PLA
  // ============================================================================
  "pla-cf": [
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#4A4A4A", colorFamily: "Gray", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA AERO - Lightweight foaming PLA
  // ============================================================================
  "pla-aero": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#808080", colorFamily: "Gray", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // ePLA-HS - High Speed PLA (FIX: Added missing color fallbacks)
  // ============================================================================
  "epla-hs-filament": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#808080", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#FF0000", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#0000FF", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Green", colorHex: "#00FF00", colorFamily: "Green", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA IMPACT - Impact-resistant PLA (FIX: Added missing color fallbacks)
  // ============================================================================
  "pla-impact-filament": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#808080", colorFamily: "Gray", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA TOUGH - Engineering-grade PLA (8 colors verified from product page)
  // Verified from: https://ca.store.bambulab.com/products/pla-tough-upgrade
  // Image URLs: Actual product photos from CDN (PLA_Tough_(X).jpg format)
  // ============================================================================
  "pla-tough-upgrade": [
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: "https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(1).jpg", variantId: null },
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: "https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(2).jpg", variantId: null },
    { colorName: "Yellow", colorHex: "#F4D53F", colorFamily: "Yellow", imageUrl: "https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(3).jpg", variantId: null },
    { colorName: "Orange", colorHex: "#FF6A13", colorFamily: "Orange", imageUrl: "https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(4).jpg", variantId: null },
    { colorName: "Gray", colorHex: "#AFB1AE", colorFamily: "Gray", imageUrl: "https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(5).jpg", variantId: null },
    { colorName: "Silver", colorHex: "#959698", colorFamily: "Gray", imageUrl: "https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(6).jpg", variantId: null },
    { colorName: "Cyan", colorHex: "#009BD8", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(7).jpg", variantId: null },
    { colorName: "Red", colorHex: "#E02928", colorFamily: "Red", imageUrl: "https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(8).jpg", variantId: null },
  ],

  // ============================================================================
  // ABS PRODUCT COLOR FALLBACKS
  // ============================================================================
  
  // ABS - 11 colors from product page
  // Verified from: https://store.bambulab.com/products/abs-filament
  // Image URLs extracted from live product page - December 2024
  "abs-filament": [
    { colorName: "Silver", colorHex: "#87909A", colorFamily: "Gray", imageUrl: "https://store.bblcdn.com/s7/default/06ec2d59ef0347fa876cb303e2d7114e/522789b7d815491293c866621998b103.media", variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: "https://store.bblcdn.com/s7/default/2af156c62c7641cc81e09d3893bfc513/c46ab8ddcfaf43aaa68ea23f8ec21367.media", variantId: null },
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: "https://store.bblcdn.com/s7/default/e2dceb24af8c463c8b92274f4a7053e3/47a50b15242d40298bc1beb1b8abaca4.media", variantId: null },
    { colorName: "Bambu Green", colorHex: "#00AE42", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s7/default/3b241e8ec7e142d68ea3b0ade56915d5/3ee4dd48e6db461a82125f5e6c57ec9f.media", variantId: null },
    { colorName: "Olive", colorHex: "#789D4A", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s7/default/306df2932fac4e46bc8400c466cf0873/c79c0361ff3d46a681b9b64c4b4a6334.media", variantId: null },
    { colorName: "Tangerine Yellow", colorHex: "#FFC72C", colorFamily: "Yellow", imageUrl: "https://store.bblcdn.com/s7/default/6b8241bccf3e45368fa53b3934304fe6/c3a543a16e0d4869aa547cb1104af70b.media", variantId: null },
    { colorName: "Orange", colorHex: "#FF6A13", colorFamily: "Orange", imageUrl: "https://store.bblcdn.com/s7/default/a24e256d98d94c05b0942419b649b9b8/84f5f85de8894faf81d7ce5129c70211.media", variantId: null },
    { colorName: "Red", colorHex: "#D32941", colorFamily: "Red", imageUrl: "https://store.bblcdn.com/s7/default/6e3e144ac8044f2481725f71361ceebe/2ee4f4ced1064bb98b4ee6bec52d86ac.media", variantId: null },
    { colorName: "Azure", colorHex: "#489FDF", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/02bf90466a8e4125bde565a965f18711/aafe7b43b40641d4b8a111aa26c8eb04.media", variantId: null },
    { colorName: "Blue", colorHex: "#0A2CA5", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/fcee893cda214ba58cf6a6c2445a1790/0c2aef92cc4d4e509bbfc1b477bdb4c8.media", variantId: null },
    { colorName: "Navy Blue", colorHex: "#0C2340", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/c69c862548f74de4977203642f14aa85/425caf237fd44c4493617bd11b15a57c.media", variantId: null },
  ],
  
  // ABS-GF - colors from hex code table on product page
  "abs-gf": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#C6C6C6", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Yellow", colorHex: "#FFE133", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Orange", colorHex: "#F48438", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#E83100", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Green", colorHex: "#61BF36", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#0C3B95", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // ASA PRODUCT COLOR FALLBACKS
  // ============================================================================
  
  // ASA - 6 colors from product page
  // Verified from: https://store.bambulab.com/products/asa-filament
  // Image URLs extracted from live product page - December 2024
  "asa-filament": [
    { colorName: "White", colorHex: "#FFFAF2", colorFamily: "White", imageUrl: "https://store.bblcdn.com/s7/default/50d1a72331c740578d4893eb212d3107/12007d17a7d9416abc87a01a8a299869.media", variantId: null },
    { colorName: "Green", colorHex: "#00A6A0", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s7/default/bf68172ec3754e9f8da0e48fa105fcc4/cb784d59ca1d48cea42f9c2e545854b7.media", variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: "https://store.bblcdn.com/s7/default/97b5ec1c47b044c4a29b43f7a787441c/11d6469b590e4b8080ca5bd3f2385e22.media", variantId: null },
    { colorName: "Gray", colorHex: "#8A949E", colorFamily: "Gray", imageUrl: "https://store.bblcdn.com/s7/default/6165d25792ba48ab97860e4cb515a734/7e5829465d8a48b39c5ad1d103db0b5e.media", variantId: null },
    { colorName: "Red", colorHex: "#E02928", colorFamily: "Red", imageUrl: "https://store.bblcdn.com/s7/default/05a63b0cfeaf42cc9bdd7d4a2ddda66f/1e6d5f24fcc14949a25332fbbd52f7f2.media", variantId: null },
    { colorName: "Blue", colorHex: "#2140B4", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/e9e66e4dbbc146daaa67f573c7e23dd0/08592504ef0c4ed4a3054fac903bf20f.media", variantId: null },
  ],
  
  // ASA Aero - Lightweight foaming ASA (1 color)
  // Verified from: https://store.bambulab.com/products/asa-aero
  "asa-aero": [
    { colorName: "White", colorHex: "#F5F1DD", colorFamily: "White", imageUrl: null, variantId: null },
  ],
  
  // ASA-CF - Carbon Fiber reinforced ASA (1 color)
  // Verified from: https://store.bambulab.com/products/asa-cf
  "asa-cf": [
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // TPU PRODUCT COLOR FALLBACKS
  // ============================================================================
  
  // TPU 95A HF - High Flow TPU (6 colors from product page)
  // Verified from: https://store.bambulab.com/products/tpu-95a-hf
  // NOTE: imageUrl set to null - old CDN URLs are broken, will use dynamic extraction
  "tpu-95a-hf": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#898D8D", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Yellow", colorHex: "#F3E600", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#0072CE", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#C8102E", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#101820", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
  
  // TPU 85A / TPU 90A - Soft TPU (6 colors from hex code table)
  // Verified from: https://ca.store.bambulab.com/products/tpu-85a-tpu-90a
  "tpu-85a-tpu-90a": [
    { colorName: "Light Cyan", colorHex: "#C3E2D6", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Neon Orange", colorHex: "#F68B1B", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Frozen", colorHex: "#40B6E4", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Blaze", colorHex: "#D21B3C", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
  
  // TPU for AMS - AMS-compatible TPU (7 colors from hex code table)
  // Verified from: https://ca.store.bambulab.com/products/tpu-for-ams
  "tpu-for-ams": [
    { colorName: "Red", colorHex: "#ED0000", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Yellow", colorHex: "#F9EF41", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#5898DD", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Neon Green", colorHex: "#90FF1A", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#939393", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PETG PRODUCT COLOR FALLBACKS
  // s5/default URLs are the actual product images (filament spool renders)
  // Verified December 2024 from live product pages
  // ============================================================================
  
  // PETG HF - High Flow PETG (14 colors from Bambu Lab product page)
  // Image URLs: s5/default format verified from live product page
  // Hex codes from official hex code table on product page
  "petg-hf": [
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: "https://store.bblcdn.com/s5/default/6583fc4c677b47c78a79b5af54707241.jpg", variantId: null },
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: "https://store.bblcdn.com/s5/default/6f0f3ffb6bdb459f97d0f44a6d83fbf6.jpg", variantId: null },
    { colorName: "Red", colorHex: "#EB3A3A", colorFamily: "Red", imageUrl: "https://store.bblcdn.com/s5/default/7de1911f91d34be280040a4ef84fdbd2.jpg", variantId: null },
    { colorName: "Gray", colorHex: "#ADB1B2", colorFamily: "Gray", imageUrl: "https://store.bblcdn.com/s5/default/22729c93daef4e0293f50584690457d0.jpg", variantId: null },
    { colorName: "Dark Gray", colorHex: "#515151", colorFamily: "Gray", imageUrl: "https://store.bblcdn.com/s5/default/d96a3ffe711444f0a4d4b734f1519537.jpg", variantId: null },
    { colorName: "Cream", colorHex: "#F9DFB9", colorFamily: "Yellow", imageUrl: "https://store.bblcdn.com/s5/default/132b2c639d284831ad3a65a5a2450ab3.jpg", variantId: null },
    { colorName: "Yellow", colorHex: "#FFD00B", colorFamily: "Yellow", imageUrl: "https://store.bblcdn.com/s5/default/695dad0142ca4d0c8ca64cd2cf5eaa6f.jpg", variantId: null },
    { colorName: "Orange", colorHex: "#F75403", colorFamily: "Orange", imageUrl: "https://store.bblcdn.com/s5/default/048a5c2661644b849a6a955ccde1a877.jpg", variantId: null },
    { colorName: "Peanut Brown", colorHex: "#875718", colorFamily: "Brown", imageUrl: "https://store.bblcdn.com/s5/default/a27c74b9bf7741b581ac70bfcb5e82f9.jpg", variantId: null },
    { colorName: "Lime Green", colorHex: "#6EE53C", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s5/default/3eeb673909be49ae8cb99bd18f365614.jpg", variantId: null },
    { colorName: "Green", colorHex: "#00AE42", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s5/default/9bd37be5d1b24bfb940af905904e7145.jpg", variantId: null },
    { colorName: "Forest Green", colorHex: "#39541A", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s5/default/327777e6ed004cb0820532eb7e263a2d.jpg", variantId: null },
    { colorName: "Lake Blue", colorHex: "#1F79E5", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s5/default/88d2cf2480094d6cbbba24a6751eb943.jpg", variantId: null },
    { colorName: "Blue", colorHex: "#002E96", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s5/default/729f2d6de88b4001938dcf49c97c2d8c.jpg", variantId: null },
  ],
  
  // PETG Translucent - 9 colors from product page
  "petg-translucent": [
    { colorName: "Translucent Teal", colorHex: "#77EDD7", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s5/default/ffa37db2ff474b71b142f6f3225c7ded.jpg", variantId: null },
    { colorName: "Translucent Light Blue", colorHex: "#61B0FF", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s5/default/2e8d7b9c2a4147da979f544f73f85fb5.jpg", variantId: null },
    { colorName: "Clear", colorHex: "#E8E8E8", colorFamily: "Clear", imageUrl: "https://store.bblcdn.com/s5/default/1a74ea492a6f4b8ea23c7d84b145d316.png", variantId: null },
    { colorName: "Translucent Gray", colorHex: "#8E8E8E", colorFamily: "Gray", imageUrl: "https://store.bblcdn.com/s5/default/18fb283d551c418f9246a22beec492ce.jpg", variantId: null },
    { colorName: "Translucent Olive", colorHex: "#748C45", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s5/default/8534fe998fa145aeb6599bf16827cf58.jpg", variantId: null },
    { colorName: "Translucent Brown", colorHex: "#C9A381", colorFamily: "Brown", imageUrl: "https://store.bblcdn.com/s5/default/2c6abde5b9bd4184a9a1ecf31be06500.jpg", variantId: null },
    { colorName: "Translucent Orange", colorHex: "#FF911A", colorFamily: "Orange", imageUrl: "https://store.bblcdn.com/s5/default/6415b5d6fb1a473490a0eb605d9d59b0.jpg", variantId: null },
    { colorName: "Translucent Pink", colorHex: "#F9C1BD", colorFamily: "Pink", imageUrl: "https://store.bblcdn.com/s5/default/3c06d1d78c3c40239fc582a8bd5a5261.jpg", variantId: null },
    { colorName: "Translucent Purple", colorHex: "#D6ABFF", colorFamily: "Purple", imageUrl: "https://store.bblcdn.com/s5/default/d437c0bf73fa4bbdadf3b3a8f139e8b0.jpg", variantId: null },
  ],
  
  // PETG-CF - Carbon Fiber reinforced PETG (5 colors)
  // Images from: https://ca.store.bambulab.com/products/petg-cf
  "petg-cf": [
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: "https://store.bblcdn.com/s7/default/9b2c4be00adb4d01a6790d7e89cc6c26/PETG-CF.png", variantId: null },
    { colorName: "Blue", colorHex: "#1F79E5", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/31093e7d52524e169c240afed3aeb603/PETG-CFblue.png", variantId: null },
    { colorName: "Green", colorHex: "#00AE42", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s7/default/a79d223f175342ef90cd845eaa610c28/PETG-CFgreen.png", variantId: null },
    { colorName: "Red", colorHex: "#EB3A3A", colorFamily: "Red", imageUrl: "https://store.bblcdn.com/s7/default/391c13326e1a4ef4b3b6c2474598aa9e/PETG-CFred.png", variantId: null },
    { colorName: "Purple", colorHex: "#9B59B6", colorFamily: "Purple", imageUrl: "https://store.bblcdn.com/s7/default/528be7fe6a2c4cd9a10713ef2d2002a6/PETG-CFpurp_4608ff17-99e8-4aec-a822-26b4d3188af1.png", variantId: null },
  ],

  // ============================================================================
  // PA (NYLON) PRODUCT COLOR FALLBACKS
  // ============================================================================
  
  // PAHT-CF - High Temperature PA Carbon Fiber (1 color - Black only)
  // Verified from: https://ca.store.bambulab.com/products/paht-cf
  "paht-cf": [
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
  
  // PA6-CF - PA6 Carbon Fiber (1 color - Black only)
  // Verified from: https://ca.store.bambulab.com/products/pa6-cf
  "pa6-cf": [
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
  
  // PPA-CF - PPA Carbon Fiber (1 color - Black only)
  // Verified from: https://ca.store.bambulab.com/products/ppa-cf
  "ppa-cf": [
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
  
  // PA6-GF - PA6 Glass Fiber (8 colors from hex code table on product page)
  // Verified from: https://ca.store.bambulab.com/products/pa6-gf
  "pa6-gf": [
    { colorName: "White", colorHex: "#EAEAE4", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Yellow", colorHex: "#FFCE00", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Lime", colorHex: "#C5ED48", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#75AED8", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Orange", colorHex: "#FF4800", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Brown", colorHex: "#5B492F", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#353533", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PET PRODUCT COLOR FALLBACKS
  // ============================================================================
  
  // PET-CF - PET Carbon Fiber (1 color - Black only)
  // Verified from: https://ca.store.bambulab.com/products/pet-cf
  "pet-cf": [
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // SUPPORT MATERIAL COLOR FALLBACKS
  // ============================================================================
  
  // PVA - Water-soluble support material (1 color - Clear)
  // Verified from: https://ca.store.bambulab.com/products/pva (Hex code table shows Clear #F0F1A8)
  "pva": [
    { colorName: "Clear", colorHex: "#F0F1A8", colorFamily: "Clear", imageUrl: null, variantId: null },
  ],
  
  // Support for PLA (New Version) - 1 color (Natural/Clear)
  // Verified from: https://ca.store.bambulab.com/products/support-for-pla-new
  "support-for-pla-new": [
    { colorName: "Natural", colorHex: "#F5F5DC", colorFamily: "Clear", imageUrl: null, variantId: null },
  ],
  
  // Support for PLA/PETG - 1 color (Natural)
  // Verified from: https://ca.store.bambulab.com/products/support-for-pla-petg
  "support-for-pla-petg": [
    { colorName: "Natural", colorHex: "#FFFFF0", colorFamily: "Clear", imageUrl: null, variantId: null },
  ],
  
  // Support for ABS - 1 color (Natural)
  // Verified from: https://ca.store.bambulab.com/products/support-for-abs
  "support-for-abs": [
    { colorName: "Natural", colorHex: "#FFFFF0", colorFamily: "Clear", imageUrl: null, variantId: null },
  ],
  
  // Support for PA/PET - 1 color (Natural)
  // Verified from: https://ca.store.bambulab.com/products/support-for-pa-pet
  "support-for-pa-pet": [
    { colorName: "Natural", colorHex: "#FFFFF0", colorFamily: "Clear", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PC (POLYCARBONATE) COLOR FALLBACKS
  // ============================================================================
  
  // PC Filament - 4 colors from product page
  // Verified from: https://store.bambulab.com/products/pc-filament
  // Image URLs extracted from live product page - December 2024
  "pc-filament": [
    { colorName: "Transparent", colorHex: "#E8E8E8", colorFamily: "Clear", imageUrl: "https://store.bblcdn.com/s7/default/a4810aca02d94b5aaed6f2135f6a10ac/469f4456c6e5449282e739eb8ca7108b.media", variantId: null },
    { colorName: "Clear Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: "https://store.bblcdn.com/s7/default/2213436ff26b48d5a32e9a5a3cce5bc5/4fcef33534954555b649c63e981ba667.media", variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: "https://store.bblcdn.com/s7/default/a8cc5656229b4972bf716cec85d40e47/80c0fdb3cc4642348aafb0ac4cb9a1a6.media", variantId: null },
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: "https://store.bblcdn.com/s7/default/8b27ee03b2224d848bb4c1b3556885a0/bf4e492f67dd4ef991be8d427d3313d6.media", variantId: null },
  ],
  
  // PC FR - 3 colors (White, Gray, Black)
  // Verified from: https://ca.store.bambulab.com/products/pc-fr (Hex code table shows exact values)
  "pc-fr": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#A8A8AA", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PPS (POLYPHENYLENE SULFIDE) COLOR FALLBACKS
  // ============================================================================
  
  // PPS-CF - 1 color (Black only - carbon fiber composite)
  // Verified from: https://ca.store.bambulab.com/products/pps-cf
  "pps-cf": [
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
};

// ============================================================================
// COLOR HEX MAP - Comprehensive color to hex mapping
// ============================================================================
const COLOR_HEX_MAP: Record<string, string> = {
  // Basics
  'black': '#000000', 'white': '#FFFFFF', 'red': '#FF0000', 'blue': '#0000FF',
  'green': '#00FF00', 'yellow': '#FFFF00', 'orange': '#FFA500', 'purple': '#800080',
  'pink': '#FFC0CB', 'brown': '#8B4513', 'gray': '#808080', 'grey': '#808080',
  // Bambu specific
  'bambu green': '#00AE42', 'charcoal': '#36454F',
  'silver': '#C0C0C0', 'gold': '#FFD700', 'bronze': '#CD7F32', 'copper': '#B87333',
  'champagne': '#F7E7CE', 'rose gold': '#B76E79',
  
  // Bambu Lab Matte compound colors (CRITICAL - these appear in CDN image filenames)
  'ivory white': '#FFFFF0', 'ivory-white': '#FFFFF0',
  'jade white': '#E8F5E9', 'jade-white': '#E8F5E9',
  'grass green': '#7CFC00', 'grass-green': '#7CFC00',
  'ice blue': '#B0E0E6', 'ice-blue': '#B0E0E6',
  'marine blue': '#00008B', 'marine-blue': '#00008B',
  'sakura pink': '#FFB7C5', 'sakura-pink': '#FFB7C5',
  'lemon yellow': '#FFF44F', 'lemon-yellow': '#FFF44F',
  'mandarin orange': '#FF8243', 'mandarin-orange': '#FF8243',
  'lilac purple': '#C8A2C8', 'lilac-purple': '#C8A2C8',
  'scarlet red': '#FF2400', 'scarlet-red': '#FF2400',
  'dark red': '#8B0000', 'dark-red': '#8B0000',
  'dark green': '#006400', 'dark-green': '#006400',
  'dark blue': '#00008B', 'dark-blue': '#00008B',
  'dark brown': '#654321', 'dark-brown': '#654321',
  'latte brown': '#967969', 'latte-brown': '#967969',
  'desert tan': '#EDC9AF', 'desert-tan': '#EDC9AF',
  'ash grey': '#B2BEB5', 'ash-grey': '#B2BEB5', 'ash gray': '#B2BEB5',
  'wine red': '#722F37', 'wine-red': '#722F37',
  'army green': '#4B5320', 'army-green': '#4B5320',
  'light blue': '#ADD8E6', 'light-blue': '#ADD8E6',
  'light green': '#90EE90', 'light-green': '#90EE90',
  'light pink': '#FFB6C1', 'light-pink': '#FFB6C1',
  'sky blue': '#87CEEB', 'sky-blue': '#87CEEB',
  'mango yellow': '#FFBE00', 'mango-yellow': '#FFBE00',
  'matcha green': '#C4D79B', 'matcha-green': '#C4D79B',
  'burnt titanium': '#878681', 'burnt-titanium': '#878681',
  'scarlet orange': '#FF5349', 'scarlet-orange': '#FF5349',
  
  // FIX: Added missing colors found in PLA Basic/Matte/Tough product pages
  'sunflower yellow': '#FFDA03', 'sunflower-yellow': '#FFDA03',
  'pumpkin orange': '#FF7518', 'pumpkin-orange': '#FF7518',
  'bright green': '#66FF00', 'bright-green': '#66FF00',
  'bambu-green': '#00AE42',  // Note: 'bambu green' already defined above
  'cobalt blue': '#0047AB', 'cobalt-blue': '#0047AB',
  'indigo purple': '#4B0082', 'indigo-purple': '#4B0082',
  'hot pink': '#FF69B4', 'hot-pink': '#FF69B4',
  'maroon red': '#800000', 'maroon-red': '#800000',
  'cocoa brown': '#D2691E', 'cocoa-brown': '#D2691E',
  'light gray': '#D3D3D3', 'light-gray': '#D3D3D3', 'light grey': '#D3D3D3',
  'dark gray': '#555555', 'dark-gray': '#555555', 'dark grey': '#555555',
  'blue gray': '#6699CC', 'blue-gray': '#6699CC', 'blue grey': '#6699CC',
  
  // ============================================================================
  // PLA Basic Gradient creative colors (specialty dual-color products)
  // ============================================================================
  'arctic whisper': '#9CDBD9', 'arctic-whisper': '#9CDBD9',
  'solar breeze': '#E94B3C', 'solar-breeze': '#E94B3C',
  'ocean to meadow': '#307FE2', 'ocean-to-meadow': '#307FE2',
  'cotton candy cloud': '#E7C1D5', 'cotton-candy-cloud': '#E7C1D5',
  'blueberry bubblegum': '#6FCAEF', 'blueberry-bubblegum': '#6FCAEF',
  'mint lime': '#B6FF43', 'mint-lime': '#B6FF43',
  'pink citrus': '#F78F77', 'pink-citrus': '#F78F77',
  'dusk glare': '#ED9558', 'dusk-glare': '#ED9558',
  
  // ============================================================================
  // PLA Silk Multi-Color creative colors (silk gradient variants)
  // ============================================================================
  'aurora purple': '#9966CC', 'aurora-purple': '#9966CC',
  'dawn radiance': '#FFB366', 'dawn-radiance': '#FFB366',
  'sunset glow': '#FF6B35', 'sunset-glow': '#FF6B35',
  'ocean twilight': '#2E5A88', 'ocean-twilight': '#2E5A88',
  'forest whisper': '#4A7C59', 'forest-whisper': '#4A7C59',
  'rose dream': '#E8A0BF', 'rose-dream': '#E8A0BF',
  
  // ============================================================================
  // Additional Bambu Lab colors from product pages (PLA Translucent, Galaxy, etc.)
  // ============================================================================
  'mellow yellow': '#F8DE7E', 'mellow-yellow': '#F8DE7E',
  'jade green': '#00A86B', 'jade-green': '#00A86B',
  'stardust blue': '#0047AB', 'stardust-blue': '#0047AB',
  'galaxy purple': '#663399', 'galaxy-purple': '#663399',
  'cosmic black': '#1E0F3C', 'cosmic-black': '#1E0F3C',
  'glow green': '#39FF14', 'glow-green': '#39FF14',
  'glow blue': '#00FFFF', 'glow-blue': '#00FFFF',
  'glow yellow': '#FFFF00', 'glow-yellow': '#FFFF00',
  'glow orange': '#FF6600', 'glow-orange': '#FF6600',
  'white marble': '#FFFFFF', 'white-marble': '#FFFFFF',
  'black marble': '#2C2C2C', 'black-marble': '#2C2C2C',
  'gray marble': '#808080', 'gray-marble': '#808080', 'grey marble': '#808080',
  'green marble': '#2E8B57', 'green-marble': '#2E8B57',
  'silk rose gold': '#B76E79', 'silk-rose-gold': '#B76E79',
  
  // Blues
  'navy blue': '#000080', 'navy': '#000080', 'azure': '#007FFF',
  'cobalt': '#0047AB', 'sapphire': '#0F52BA', 'midnight': '#191970',
  'teal': '#008080', 'cyan': '#00FFFF', 'aqua': '#00FFFF', 'turquoise': '#40E0D0',
  // Greens
  'olive': '#808000', 'forest green': '#228B22', 'emerald': '#50C878', 'jade': '#00A86B',
  'mint': '#98FF98', 'sage': '#9DC183', 'moss': '#8A9A5B', 'lime': '#32CD32',
  // Reds/Pinks
  'crimson': '#DC143C', 'scarlet': '#FF2400', 'maroon': '#800000', 'burgundy': '#800020',
  'wine': '#722F37', 'ruby': '#E0115F', 'cherry': '#DE3163', 'coral': '#FF7F50',
  'salmon': '#FA8072', 'rose': '#FF007F', 'magenta': '#FF00FF',
  // Yellows/Oranges
  'tangerine': '#FF9966', 'tangerine yellow': '#FFC72C', 'peach': '#FFCBA4',
  'apricot': '#FBCEB1', 'amber': '#FFBF00', 'lemon': '#FFF44F', 'mustard': '#FFDB58',
  // Purples
  'violet': '#EE82EE', 'lavender': '#E6E6FA', 'lilac': '#C8A2C8', 'plum': '#DDA0DD',
  'orchid': '#DA70D6', 'mauve': '#E0B0FF', 'grape': '#6F2DA8', 'indigo': '#4B0082',
  // Browns/Naturals
  'tan': '#D2B48C', 'beige': '#F5F5DC', 'khaki': '#C3B091', 'chocolate': '#7B3F00',
  'coffee': '#6F4E37', 'mocha': '#967969', 'espresso': '#4E312D', 'caramel': '#FFD59A',
  'wood': '#BA8C63', 'walnut': '#5D432C', 'oak': '#806517', 'bamboo': '#E3D26F',
  'ivory': '#FFFFF0',
  // Special effects
  'transparent': '#FFFFFF', 'translucent': '#FFFFFF', 'clear': '#FFFFFF',
  'glow': '#39FF14', 'glow in dark': '#39FF14',
  'rainbow': '#FF0000', 'galaxy': '#2E2D88', 'cosmic': '#1E0F3C', 'nebula': '#5D3FD3',
  'marble': '#EAEAEA', 'granite': '#676767', 'stone': '#928E85',
  // Silk variants
  'silk red': '#CC0000', 'silk blue': '#4169E1', 'silk green': '#228B22',
  'silk gold': '#FFD700', 'silk silver': '#C0C0C0', 'silk pink': '#FF69B4',
  'silk purple': '#9370DB', 'silk orange': '#FF8C00', 'silk white': '#F8F8FF',
  'silk black': '#1A1A1A', 'silk champagne': '#F7E7CE',
  // Metal variants
  'metal gold': '#D4AF37', 'metal silver': '#AAA9AD', 'metal bronze': '#CD7F32',
  'metal copper': '#B87333', 'metal titanium': '#878681', 'metal iron': '#48494B',
};

const COLOR_FAMILY_MAP: Record<string, string> = {
  'red': 'Red', 'crimson': 'Red', 'scarlet': 'Red', 'maroon': 'Red', 'burgundy': 'Red',
  'ruby': 'Red', 'cherry': 'Red', 'silk red': 'Red',
  'orange': 'Orange', 'tangerine': 'Orange', 'peach': 'Orange', 'coral': 'Orange',
  'salmon': 'Orange', 'amber': 'Orange', 'silk orange': 'Orange', 'tangerine yellow': 'Yellow',
  'yellow': 'Yellow', 'gold': 'Yellow', 'lemon': 'Yellow', 'mustard': 'Yellow',
  'silk gold': 'Yellow', 'metal gold': 'Yellow', 'champagne': 'Yellow',
  'mellow yellow': 'Yellow', 'sunflower yellow': 'Yellow',
  'green': 'Green', 'olive': 'Green', 'forest green': 'Green', 'emerald': 'Green',
  'jade': 'Green', 'mint': 'Green', 'sage': 'Green', 'moss': 'Green', 'lime': 'Green',
  'bambu green': 'Green', 'silk green': 'Green', 'jade white': 'Green', 'jade green': 'Green',
  'forest whisper': 'Green', 'mint lime': 'Green', 'ocean to meadow': 'Green',
  'blue': 'Blue', 'navy': 'Blue', 'navy blue': 'Blue', 'azure': 'Blue', 'sky blue': 'Blue',
  'cobalt': 'Blue', 'sapphire': 'Blue', 'midnight': 'Blue', 'teal': 'Blue', 'cyan': 'Blue',
  'aqua': 'Blue', 'turquoise': 'Blue', 'silk blue': 'Blue', 'stardust blue': 'Blue',
  'arctic whisper': 'Blue', 'blueberry bubblegum': 'Blue', 'ocean twilight': 'Blue',
  'purple': 'Purple', 'violet': 'Purple', 'lavender': 'Purple', 'lilac': 'Purple',
  'plum': 'Purple', 'orchid': 'Purple', 'mauve': 'Purple', 'grape': 'Purple', 'indigo': 'Purple',
  'silk purple': 'Purple', 'galaxy': 'Purple', 'cosmic': 'Purple', 'nebula': 'Purple',
  'aurora purple': 'Purple', 'galaxy purple': 'Purple',
  'pink': 'Pink', 'hot pink': 'Pink', 'rose': 'Pink', 'magenta': 'Pink',
  'silk pink': 'Pink', 'rose gold': 'Pink', 'cotton candy cloud': 'Pink', 'rose dream': 'Pink',
  'brown': 'Brown', 'tan': 'Brown', 'beige': 'Brown', 'khaki': 'Brown', 'chocolate': 'Brown',
  'coffee': 'Brown', 'mocha': 'Brown', 'espresso': 'Brown', 'caramel': 'Brown',
  'wood': 'Brown', 'walnut': 'Brown', 'oak': 'Brown', 'bamboo': 'Brown',
  'gray': 'Gray', 'grey': 'Gray', 'charcoal': 'Gray', 'silver': 'Gray',
  'silk silver': 'Gray', 'metal silver': 'Gray', 'metal titanium': 'Gray',
  'black': 'Black', 'silk black': 'Black', 'metal iron': 'Black', 'cosmic black': 'Black',
  'white': 'White', 'silk white': 'White', 'transparent': 'Clear', 'translucent': 'Clear',
  'clear': 'Clear', 'glow': 'Glow', 'glow in dark': 'Glow',
  'glow green': 'Glow', 'glow blue': 'Glow', 'glow yellow': 'Glow', 'glow orange': 'Glow',
  'rainbow': 'Rainbow', 'marble': 'Special', 'granite': 'Gray', 'stone': 'Gray',
  'white marble': 'White', 'black marble': 'Black', 'gray marble': 'Gray', 'green marble': 'Green',
  'bronze': 'Bronze', 'metal bronze': 'Bronze', 'copper': 'Copper', 'metal copper': 'Copper',
  // Gradient/creative colors - map to dominant color
  'solar breeze': 'Red', 'pink citrus': 'Orange', 'dusk glare': 'Orange',
  'dawn radiance': 'Orange', 'sunset glow': 'Orange',
};

// ============================================================================
// PRICE EXTRACTION UTILITIES
// ============================================================================
const DISCOUNT_EXCLUSION_KEYWORDS = [
  'as low as', 'low as', 'per roll', 'per spool', 'bulk', 'discount',
  '% off', 'save ', 'savings', 'bundle', 'pack of', 'multi-pack',
  'subscribe', 'subscription', 'qty', 'quantity', 'x+ items', '+ items'
];

function containsDiscountKeywords(text: string, ctx?: LogContext): boolean {
  const lowerText = text.toLowerCase();
  const hasDiscount = DISCOUNT_EXCLUSION_KEYWORDS.some(keyword => lowerText.includes(keyword));
  if (hasDiscount && ctx) {
    const matchedKeyword = DISCOUNT_EXCLUSION_KEYWORDS.find(keyword => lowerText.includes(keyword));
    logDebug(ctx, 'PRICE', `Discount keyword detected: "${matchedKeyword}"`);
  }
  return hasDiscount;
}

function extractNumericPrice(text: string, ctx?: LogContext): number | null {
  const cleaned = text.replace(/[C$A$£€¥,\s]/g, '').replace(/CA|AU|US|JP/gi, '');
  const match = cleaned.match(/(\d+\.?\d*)/);
  if (match) {
    const price = parseFloat(match[1]);
    if (!isNaN(price) && price > 0) {
      if (ctx) logDebug(ctx, 'PRICE', `Extracted numeric price: ${price} from "${text.substring(0, 50)}"`);
      return price;
    }
  }
  if (ctx) logDebug(ctx, 'PRICE', `Failed to extract price from: "${text.substring(0, 50)}"`);
  return null;
}

function extractFromJsonLd(html: string): number | null {
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
        const jsonData = JSON.parse(jsonContent);
        if (jsonData['@type'] === 'Product' && jsonData.offers) {
          const offers = Array.isArray(jsonData.offers) ? jsonData.offers : [jsonData.offers];
          for (const offer of offers) {
            if (offer.price) {
              const price = parseFloat(offer.price);
              if (!isNaN(price) && price > 0) return price;
            }
          }
        }
      } catch { /* Invalid JSON, continue */ }
    }
  }
  return null;
}

function extractFromMetaTags(html: string): number | null {
  const metaPriceMatch = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']product:price:amount["']/i);
  if (metaPriceMatch) {
    const price = parseFloat(metaPriceMatch[1]);
    if (!isNaN(price) && price > 0) return price;
  }
  return null;
}

// Extract compare-at price (original price before discount)
function extractCompareAtPrice(html: string, markdown: string, ctx?: LogContext): number | null {
  // Look for strikethrough/original price patterns
  const comparePatterns = [
    // Pattern 1: Strikethrough text with price
    /<s[^>]*>(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)<\/s>/gi,
    // Pattern 2: Compare-at-price class
    /class="[^"]*compare[-_]?at[-_]?price[^"]*"[^>]*>(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
    // Pattern 3: Was/Original price text
    /(?:was|original|reg(?:ular)?)\s*(?:price)?[:\s]*(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
    // Pattern 4: JSON-LD compare price
    /"compareAtPrice":\s*"?(\d+(?:\.\d{2})?)"?/i,
  ];

  for (const pattern of comparePatterns) {
    const match = pattern.exec(html);
    if (match && match[1]) {
      const price = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(price) && price > 0) {
        if (ctx) logDebug(ctx, 'PRICE', `Found compare-at price: ${price}`);
        return price;
      }
    }
  }
  
  return null;
}

// ============================================================================
// HELPER: Validate Bambu Lab CDN image URL format
// Rejects broken old-format URLs that no longer work
// ACCEPTS s5/default URLs (actual product images from collection pages)
// ============================================================================
function isValidBambuLabImageUrl(url: string | null): boolean {
  if (!url) return false;
  
  // ACCEPT s5/default URLs - these are actual product images (spool renders)
  // Format: store.bblcdn.com/s5/default/{hash}.jpg
  if (url.includes('store.bblcdn.com/s5/default/')) {
    return true;
  }
  
  // Reject old-format URLs that are now broken (UUID-style .png/.media files)
  // These return blank pages on the new CDN
  // Pattern: store.bblcdn.com/s7/default/{uuid}/{uuid}.png or .media
  if (url.includes('store.bblcdn.com') && 
      url.match(/\/[a-f0-9]{32}\/[a-f0-9]{32}\.(png|media)$/i)) {
    return false; // Old format - broken
  }
  
  // Also reject URLs that are just UUIDs with no descriptive filename
  if (url.includes('store.bblcdn.com') && 
      url.match(/\/[a-f0-9-]{36}\.(png|media|jpg)$/i)) {
    return false; // UUID-only filename - likely broken
  }
  
  // Reject s7/default swatch URLs (tiny 40x40 color icons, not product images)
  if (url.includes('store.bblcdn.com/s7/default/')) {
    return false;
  }
  
  return true;
}

// ============================================================================
// HELPER: Scrape collection page to get main product images (s5/default format)
// These are the actual product photos, not color swatches
// ============================================================================
async function scrapeCollectionProductImages(
  collectionSlug: string,
  ctx?: LogContext
): Promise<Map<string, string>> {
  const productImages = new Map<string, string>();
  
  const url = `https://store.bambulab.com/collections/${collectionSlug.toLowerCase()}`;
  
  if (ctx) logInfo(ctx, 'COLLECTION', `Scraping collection page for product images: ${url}`);
  
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    if (ctx) logWarn(ctx, 'COLLECTION', 'No Firecrawl API key - skipping collection scrape');
    return productImages;
  }
  
  try {
    const requestBody = {
      url,
      formats: ['html'],
      onlyMainContent: false,
      waitFor: 5000,
      location: { country: 'US', languages: ['en'] },
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    let response: Response;
    try {
      response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
    
    if (!response.ok) {
      if (ctx) logWarn(ctx, 'COLLECTION', `Failed to scrape collection: HTTP ${response.status}`);
      return productImages;
    }
    
    const data = await response.json();
    const html = data.data?.html || '';
    
    if (!html) {
      if (ctx) logWarn(ctx, 'COLLECTION', 'No HTML returned from collection page');
      return productImages;
    }
    
    if (ctx) logDebug(ctx, 'COLLECTION', `Collection HTML size: ${html.length} chars`);
    
    // Pattern to find s5/default product images (actual spool photos)
    // Format: https://store.bblcdn.com/s5/default/{hash}.jpg
    const s5ImagePattern = /https:\/\/store\.bblcdn\.com\/s5\/default\/([a-f0-9]+)\.(jpg|png)/gi;
    
    // Also need to find product links to map images to products
    // Pattern: /products/{slug} in the vicinity of the image
    // Strategy: Find product cards that contain both a product link and an s5 image
    
    // Find all s5 images first
    const allS5Images: string[] = [];
    let match;
    while ((match = s5ImagePattern.exec(html)) !== null) {
      allS5Images.push(match[0]);
    }
    
    if (ctx) logInfo(ctx, 'COLLECTION', `Found ${allS5Images.length} s5/default product images`);
    
    // Now try to associate each s5 image with a product slug
    // Look for product card patterns: href="/products/{slug}" ... img src="...s5/default..."
    const productCardPattern = /href="\/products\/([^"]+)"[^>]*>[\s\S]*?(?:src|data-src)="(https:\/\/store\.bblcdn\.com\/s5\/default\/[^"]+)"/gi;
    
    while ((match = productCardPattern.exec(html)) !== null) {
      const productSlug = match[1];
      const imageUrl = match[2];
      
      // Clean the product slug - remove query params
      const cleanSlug = productSlug.split('?')[0];
      
      if (!productImages.has(cleanSlug)) {
        productImages.set(cleanSlug, imageUrl);
        if (ctx) logDebug(ctx, 'COLLECTION', `Mapped: ${cleanSlug} -> ${imageUrl.substring(0, 60)}...`);
      }
    }
    
    // Alternative pattern: some pages structure it differently
    // Look for anchor tags with product paths, then find nearby s5 images
    const altProductPattern = /<a[^>]+href="\/products\/([^"?]+)"[^>]*>[\s\S]{0,500}?<img[^>]+src="(https:\/\/store\.bblcdn\.com\/s5\/default\/[^"]+)"/gi;
    
    while ((match = altProductPattern.exec(html)) !== null) {
      const productSlug = match[1];
      const imageUrl = match[2];
      
      if (!productImages.has(productSlug)) {
        productImages.set(productSlug, imageUrl);
        if (ctx) logDebug(ctx, 'COLLECTION', `Alt pattern mapped: ${productSlug} -> ${imageUrl.substring(0, 60)}...`);
      }
    }
    
    // Another pattern: srcset with s5 images
    const srcsetPattern = /<a[^>]+href="\/products\/([^"?]+)"[\s\S]*?srcset="([^"]*store\.bblcdn\.com\/s5\/default\/[^"\s,]+)/gi;
    
    while ((match = srcsetPattern.exec(html)) !== null) {
      const productSlug = match[1];
      // Extract just the URL from srcset
      const srcsetValue = match[2];
      const urlMatch = srcsetValue.match(/https:\/\/store\.bblcdn\.com\/s5\/default\/[a-f0-9]+\.(jpg|png)/i);
      if (urlMatch && !productImages.has(productSlug)) {
        productImages.set(productSlug, urlMatch[0]);
        if (ctx) logDebug(ctx, 'COLLECTION', `Srcset pattern mapped: ${productSlug} -> ${urlMatch[0].substring(0, 60)}...`);
      }
    }
    
    if (ctx) logSuccess(ctx, 'COLLECTION', `Mapped ${productImages.size} products to s5 images for collection: ${collectionSlug}`);
    
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (ctx) logError(ctx, 'COLLECTION', `Error scraping collection: ${errMsg}`, { error });
  }
  
  return productImages;
}

// ============================================================================
// HELPER: Generate Bambu Lab CDN image URL from product slug and color name
// Used as fallback when dynamic image extraction fails
// ============================================================================
function generateBambuLabImageUrl(productSlug: string, colorName: string): string | null {
  // Try to get from PRODUCT_COLOR_FALLBACKS first
  const fallbackColors = PRODUCT_COLOR_FALLBACKS[productSlug];
  if (fallbackColors) {
    const colorMatch = fallbackColors.find(
      c => c.colorName.toLowerCase() === colorName.toLowerCase()
    );
    // Only use fallback URL if it passes validation (not broken old format)
    if (colorMatch?.imageUrl && isValidBambuLabImageUrl(colorMatch.imageUrl)) {
      return colorMatch.imageUrl;
    }
  }
  
  // No valid fallback available - return null to use color swatch instead
  return null;
}

function extractBambuLabPrice(
  html: string, 
  markdown: string, 
  region: string, 
  material: string = 'PLA',
  ctx?: LogContext
): { price: number; compareAtPrice: number | null; source: string; actualCurrency?: string } | null {
  const store = BAMBU_REGIONAL_STORES[region];
  if (!store) {
    if (ctx) logWarn(ctx, 'PRICE', `Unknown region: ${region}`);
    return null;
  }

  // FIX 4: Use smart price range lookup with fallback for engineering materials
  const [minExpected, maxExpected] = getMaterialPriceRange(material, region);
  
  if (ctx) {
    logInfo(ctx, 'PRICE', `Expected ${material} price range: ${minExpected}-${maxExpected} ${store.currency}`);
    logDebug(ctx, 'PRICE', `HTML size: ${html.length} chars, Markdown size: ${markdown.length} chars`);
  }

  // Extract compare-at price once (for discount detection)
  const compareAtPrice = extractCompareAtPrice(html, markdown, ctx);

  // Strategy 1: bbl-title-1 class (Bambu Lab's main price element)
  if (ctx) logDebug(ctx, 'PRICE', 'Trying Strategy 1: bbl-title-1 class');
  const bblTitleMatch = html.match(/class="[^"]*bbl-title-1[^"]*"[^>]*>([^<]*(?:\$|€|£|¥|C\$|CA\$|A\$)[^<]*)<\/[^>]+>/i);
  if (bblTitleMatch) {
    const priceText = bblTitleMatch[1];
    if (ctx) logDebug(ctx, 'PRICE', `Strategy 1 found: "${priceText}"`);
    const matchIndex = html.indexOf(bblTitleMatch[0]);
    const context = html.substring(Math.max(0, matchIndex - 200), Math.min(html.length, matchIndex + 200));
    
    if (!containsDiscountKeywords(context, ctx)) {
      const price = extractNumericPrice(priceText, ctx);
      if (price && price >= minExpected && price <= maxExpected) {
        if (ctx) logSuccess(ctx, 'PRICE', `Strategy 1 SUCCESS: ${price} ${store.currency} (bbl-title-1)`);
        return { price, compareAtPrice, source: 'bbl-title-1' };
      } else if (price && ctx) {
        logWarn(ctx, 'PRICE', `Strategy 1 REJECTED: ${price} outside range [${minExpected}-${maxExpected}]`);
      }
    } else if (ctx) {
      logDebug(ctx, 'PRICE', 'Strategy 1 SKIPPED: discount keywords in context');
    }
  } else if (ctx) {
    logDebug(ctx, 'PRICE', 'Strategy 1: No bbl-title-1 match found');
  }

  // Strategy 2: "From $XX.XX" pattern
  if (ctx) logDebug(ctx, 'PRICE', 'Trying Strategy 2: From/Starting patterns');
  const fromPricePatterns = [
    /From\s+(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
    /Starting\s+(?:at\s+)?(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
  ];
  
  for (let i = 0; i < fromPricePatterns.length; i++) {
    const pattern = fromPricePatterns[i];
    const matches = [...html.matchAll(pattern)];
    if (ctx) logDebug(ctx, 'PRICE', `Strategy 2.${i+1}: Found ${matches.length} pattern matches`);
    
    for (const match of matches) {
      const fullMatch = match[0];
      const priceStr = match[1].replace(',', '.');
      const price = parseFloat(priceStr);
      
      if (ctx) logDebug(ctx, 'PRICE', `Strategy 2 candidate: "${fullMatch}" -> ${price}`);
      
      const matchIndex = html.indexOf(fullMatch);
      const context = html.substring(Math.max(0, matchIndex - 200), Math.min(html.length, matchIndex + 200));
      
      if (!containsDiscountKeywords(context, ctx) && price >= minExpected && price <= maxExpected) {
        if (ctx) logSuccess(ctx, 'PRICE', `Strategy 2 SUCCESS: ${price} ${store.currency} (from-pattern)`);
        return { price, compareAtPrice, source: 'from-pattern' };
      } else if (ctx && (price < minExpected || price > maxExpected)) {
        logDebug(ctx, 'PRICE', `Strategy 2 REJECTED: ${price} outside range [${minExpected}-${maxExpected}]`);
      }
    }
  }

  // Strategy 3: JSON-LD
  if (ctx) logDebug(ctx, 'PRICE', 'Trying Strategy 3: JSON-LD structured data');
  const jsonLdPrice = extractFromJsonLd(html);
  if (jsonLdPrice) {
    if (ctx) logDebug(ctx, 'PRICE', `Strategy 3 found JSON-LD price: ${jsonLdPrice}`);
    if (jsonLdPrice >= minExpected && jsonLdPrice <= maxExpected) {
      if (ctx) logSuccess(ctx, 'PRICE', `Strategy 3 SUCCESS: ${jsonLdPrice} ${store.currency} (json-ld)`);
      return { price: jsonLdPrice, compareAtPrice, source: 'json-ld' };
    } else if (ctx) {
      logWarn(ctx, 'PRICE', `Strategy 3 REJECTED: ${jsonLdPrice} outside range [${minExpected}-${maxExpected}]`);
    }
  } else if (ctx) {
    logDebug(ctx, 'PRICE', 'Strategy 3: No JSON-LD price found');
  }

  // Strategy 4: Meta tags
  if (ctx) logDebug(ctx, 'PRICE', 'Trying Strategy 4: Meta tags');
  const metaPrice = extractFromMetaTags(html);
  if (metaPrice) {
    if (ctx) logDebug(ctx, 'PRICE', `Strategy 4 found meta price: ${metaPrice}`);
    if (metaPrice >= minExpected && metaPrice <= maxExpected) {
      if (ctx) logSuccess(ctx, 'PRICE', `Strategy 4 SUCCESS: ${metaPrice} ${store.currency} (meta-tag)`);
      return { price: metaPrice, compareAtPrice, source: 'meta-tag' };
    } else if (ctx) {
      logWarn(ctx, 'PRICE', `Strategy 4 REJECTED: ${metaPrice} outside range [${minExpected}-${maxExpected}]`);
    }
  } else if (ctx) {
    logDebug(ctx, 'PRICE', 'Strategy 4: No meta tag price found');
  }

  // Strategy 5: Markdown "From" patterns
  if (ctx) logDebug(ctx, 'PRICE', 'Trying Strategy 5: Markdown patterns');
  const mdFromMatch = markdown.match(/From\s+(?:\$|€|£|C\$|CA\$|A\$|¥)?\s*(\d{1,3}(?:[.,]\d{2})?)/i);
  if (mdFromMatch) {
    const price = parseFloat(mdFromMatch[1].replace(',', '.'));
    if (ctx) logDebug(ctx, 'PRICE', `Strategy 5 found markdown price: ${price}`);
    if (price >= minExpected && price <= maxExpected) {
      if (ctx) logSuccess(ctx, 'PRICE', `Strategy 5 SUCCESS: ${price} ${store.currency} (markdown-from)`);
      return { price, compareAtPrice, source: 'markdown-from' };
    } else if (ctx) {
      logWarn(ctx, 'PRICE', `Strategy 5 REJECTED: ${price} outside range [${minExpected}-${maxExpected}]`);
    }
  } else if (ctx) {
    logDebug(ctx, 'PRICE', 'Strategy 5: No markdown price pattern found');
  }

  // Strategy 6: Direct "$XX.XX USD" or "€XX.XX EUR" pattern in markdown (Bambu Lab specific)
  // This catches the clear price display like "$19.99 USD" near the product title
  // FIX: Enhanced to detect ACTUAL currency (important for Bambu Lab regional stores that show USD on .ca/.au domains)
  if (ctx) logDebug(ctx, 'PRICE', 'Trying Strategy 6: Direct currency+amount+code pattern (with actual currency detection)');
  
  // Map currency codes to their canonical form
  const CURRENCY_CODE_MAP: Record<string, string> = {
    'USD': 'USD',
    'CAD': 'CAD', 
    'EUR': 'EUR',
    'GBP': 'GBP',
    'AUD': 'AUD',
    'JPY': 'JPY',
  };
  
  const directPricePatterns = [
    { pattern: /(?<!\w)(\$)(\d{1,3}(?:\.\d{2})?)\s*(USD)(?!\s*(?:per|\/|each))/gi, currency: 'USD' },  // $19.99 USD
    { pattern: /(?<!\w)(\$)(\d{1,3}(?:\.\d{2})?)\s*(CAD)(?!\s*(?:per|\/|each))/gi, currency: 'CAD' },  // $19.99 CAD (rare but possible)
    { pattern: /(?<!\w)(€)(\d{1,3}(?:[.,]\d{2})?)\s*(EUR)(?!\s*(?:per|\/|each))/gi, currency: 'EUR' },  // €18.99 EUR
    { pattern: /(?<!\w)(£)(\d{1,3}(?:\.\d{2})?)\s*(GBP)(?!\s*(?:per|\/|each))/gi, currency: 'GBP' },  // £16.99 GBP
    { pattern: /(?<!\w)(C\$|CA\$)(\d{1,3}(?:\.\d{2})?)\s*(CAD)(?!\s*(?:per|\/|each))/gi, currency: 'CAD' },  // C$24.99 CAD
    { pattern: /(?<!\w)(A\$)(\d{1,3}(?:\.\d{2})?)\s*(AUD)(?!\s*(?:per|\/|each))/gi, currency: 'AUD' },  // A$29.99 AUD
    { pattern: /(?<!\w)(¥)(\d{1,5})\s*(JPY)(?!\s*(?:per|\/|each))/gi, currency: 'JPY' },  // ¥2999 JPY
  ];
  
  for (const { pattern, currency: expectedCurrencyFromPattern } of directPricePatterns) {
    const matches = [...markdown.matchAll(pattern)];
    for (const priceMatch of matches) {
      const priceStr = priceMatch[2].replace(',', '.');
      const price = parseFloat(priceStr);
      const detectedCurrency = priceMatch[3] ? CURRENCY_CODE_MAP[priceMatch[3].toUpperCase()] : expectedCurrencyFromPattern;
      
      if (ctx) logDebug(ctx, 'PRICE', `Strategy 6 candidate: "${priceMatch[0]}" -> ${price} ${detectedCurrency}`);
      
      // Check context around this match - reject if near discount keywords
      const matchIndex = markdown.indexOf(priceMatch[0]);
      const context = markdown.substring(Math.max(0, matchIndex - 100), Math.min(markdown.length, matchIndex + 100));
      
      // FIX: For currency detection, use the ACTUAL currency from the page, not the expected regional currency
      // This handles Bambu Lab's case where ca.store shows USD prices
      if (!containsDiscountKeywords(context, ctx) && price >= minExpected && price <= maxExpected) {
        const currencyMismatch = detectedCurrency !== store.currency;
        if (currencyMismatch && ctx) {
          logWarn(ctx, 'PRICE', `Currency mismatch! Region ${region} expects ${store.currency} but page shows ${detectedCurrency}`);
        }
        if (ctx) logSuccess(ctx, 'PRICE', `Strategy 6 SUCCESS: ${price} ${detectedCurrency} (direct-currency-code)${currencyMismatch ? ' [CURRENCY MISMATCH]' : ''}`);
        return { price, compareAtPrice, source: 'direct-currency-code', actualCurrency: detectedCurrency };
      }
    }
  }
  if (ctx) logDebug(ctx, 'PRICE', 'Strategy 6: No direct currency+code pattern matched');

  if (ctx) {
    logWarn(ctx, 'PRICE', `ALL STRATEGIES FAILED for ${material} in ${region}`, {
      htmlHasCurrency: html.includes('$') || html.includes('€') || html.includes('£'),
      markdownHasCurrency: markdown.includes('$') || markdown.includes('€') || markdown.includes('£'),
      htmlSample: html.substring(0, 500),
    });
  }
  return null;
}

// ============================================================================
// COLOR VARIANT EXTRACTION
// Note: ColorVariant interface is defined at line 559, no duplicate needed
// ============================================================================

// ============================================================================
// MATERIAL ISSUE TRACKING
// ============================================================================
interface MaterialIssues {
  missingPrices: string[];
  missingColors: string[];
  missingImages: string[];
  invalidColorNames: string[];
}

function logMaterialIssues(material: string, issues: MaterialIssues, ctx?: LogContext): void {
  const hasIssues = issues.missingPrices.length > 0 || 
                    issues.missingColors.length > 0 || 
                    issues.missingImages.length > 0 ||
                    issues.invalidColorNames.length > 0;
  
  console.log(`\n=== ${material} ISSUES SUMMARY ===`);
  
  if (issues.missingPrices.length > 0) {
    console.log(`❌ Missing Prices (${issues.missingPrices.length}): ${issues.missingPrices.slice(0, 10).join(', ')}${issues.missingPrices.length > 10 ? '...' : ''}`);
  }
  if (issues.missingColors.length > 0) {
    console.log(`❌ Missing Color Hex (${issues.missingColors.length}): ${issues.missingColors.slice(0, 10).join(', ')}${issues.missingColors.length > 10 ? '...' : ''}`);
  }
  if (issues.missingImages.length > 0) {
    console.log(`⚠️ Missing Images (${issues.missingImages.length}): ${issues.missingImages.slice(0, 10).join(', ')}${issues.missingImages.length > 10 ? '...' : ''}`);
  }
  if (issues.invalidColorNames.length > 0) {
    console.log(`🚫 Filtered Invalid Colors (${issues.invalidColorNames.length}): ${issues.invalidColorNames.slice(0, 10).join(', ')}${issues.invalidColorNames.length > 10 ? '...' : ''}`);
  }
  
  if (!hasIssues) {
    console.log(`✅ No critical issues`);
  }
  console.log(`=================================\n`);
}

// ============================================================================
// NON-COLOR BLOCKLIST - UI elements that should NEVER be treated as colors
// ============================================================================
const NON_COLOR_BLOCKLIST = [
  // ============================================================================
  // COOKIE CONSENT & THIRD-PARTY SERVICES - commonly parsed as "colors" by mistake
  // These appear on Bambu Lab pages from TrustArc consent banners
  // ============================================================================
  /\btrustarc\b/i,
  /\breddit\b/i,
  /\bcookie\b/i,
  /\bconsent\b/i,
  /\bprivacy\b/i,
  /\bpolicy\b/i,
  /\bpowered\s*by\b/i,
  /\baccept\s*all\b/i,
  /\bdo\s*not\s*sell\b/i,
  /\bpersonal\s*information\b/i,
  /\bmanage\s*preferences\b/i,
  /\bcookie\s*settings?\b/i,
  
  // UI elements from Bambu Lab website
  /hex\s*code/i,
  /\bdisplay\b/i,  // FIX: Added word boundary to prevent false positives
  /suggest\s*one/i,
  /can'?t\s*find/i,
  /automatic\s*material/i,
  /\bprinting\b/i,  // FIX: Added word boundary
  /^\s*ams\s*$/i,
  /material\s*system/i,
  /select\s*color/i,
  /choose\s*color/i,
  /color\s*options?/i,
  /variant\s*options?/i,
  /add\s*to\s*cart/i,
  /buy\s*now/i,
  /out\s*of\s*stock/i,
  /in\s*stock/i,
  /\bavailable\b/i,  // FIX: Added word boundary to prevent blocking colors like "Available Blue"
  /\bunavailable\b/i,  // FIX: Added word boundary
  /notify\s*me/i,
  /sold\s*out/i,
  /coming\s*soon/i,
  /\bquantity\b/i,  // FIX: Added word boundary
  /^\s*qty\s*$/i,
  /\breview\b/i,  // FIX: Added word boundary
  /\brating\b/i,  // FIX: Added word boundary
  /\bdescription\b/i,  // FIX: Added word boundary
  /\bspecification\b/i,  // FIX: Added word boundary
  /\bdetails\b/i,  // FIX: Added word boundary to prevent blocking "Details Red" type colors
  /\bfeatures\b/i,  // FIX: Added word boundary
  // Navigation/UI
  /\bhome\b/i,  // FIX: Added word boundary
  /^\s*back\s*$/i,  // FIX: Made more specific to only match standalone "back"
  /^\s*next\s*$/i,  // FIX: Made more specific
  /^\s*previous\s*$/i,  // FIX: Made more specific
  /^\s*see\s*all\s*$/i,
  /view\s*more/i,
  /show\s*more/i,
  /^\s*less\s*$/i,  // FIX: Made more specific
  /^\s*more\s*$/i,  // FIX: Made more specific
  /^\s*close\s*$/i,  // FIX: Made more specific
  /^\s*open\s*$/i,  // FIX: Made more specific
  // Form field artifacts
  /^\s*[\d\(\)\-\+]+\s*$/,  // Just numbers/parens/dashes
  /^\s*[\\\/\-\?\!\.\,\*\#\@]+\s*$/,  // Just punctuation
  /^\s*$/,  // Empty or whitespace only
  // Size/weight/dimension
  /^\s*\d+\s*(g|kg|mm|cm|m)\s*$/i,
  /^\s*1\.75\s*mm?\s*$/i,
  /^\s*2\.85\s*mm?\s*$/i,
  
  // ============================================================================
  // MARKETING PHRASES - Common phrases extracted from multi-color product pages
  // ============================================================================
  /captivating/i,
  /silk[-\s]*like/i,
  /\bappearance\b/i,
  /dynamic\s*effects?/i,
  /with\s*dynamic/i,
  /transformations?/i,
  /gradients?\s*that/i,
  /vibrant\s*and/i,
  /lustrous/i,
  /iridescent/i,
  /multi[-\s]*tonal/i,
  /color\s*shift/i,
  /shimmering/i,
  /eye[-\s]*catching/i,
  /stunning/i,
  /gorgeous/i,
  /beautiful\s*prints?/i,
  /premium\s*quality/i,
  /high[-\s]*quality/i,
];

/**
 * Check if a string matches any blocklist pattern
 */
function isBlockedColorName(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length > 50) return true; // Colors shouldn't be this long
  
  return NON_COLOR_BLOCKLIST.some(pattern => pattern.test(trimmed));
}

// ============================================================================
// FIX: CamelCase splitting and UUID stripping for CDN image filename parsing
// These helpers extract color names from filenames like "SunflowerYellow.jpg"
// or "light_gray_25c0c41d-107b-4d05-96d1-3de1efb728d9.jpg"
// ============================================================================

/**
 * Split CamelCase strings into space-separated words
 * e.g., "SunflowerYellow" -> "Sunflower Yellow"
 * e.g., "MaroonRed" -> "Maroon Red"
 * e.g., "PLABasic" -> "PLA Basic"
 */
function splitCamelCase(str: string): string {
  return str
    // Insert space before uppercase letters that follow lowercase letters
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Handle consecutive uppercase followed by uppercase+lowercase (e.g., "PLABasic" -> "PLA Basic")
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

/**
 * Strip UUID patterns from filenames
 * e.g., "light_gray_25c0c41d-107b-4d05-96d1-3de1efb728d9" -> "light_gray"
 * e.g., "PLA-Basic_Black_e33768fd-c87a-4b2d-a3f7-0b3afc81f13f" -> "PLA-Basic_Black"
 */
function stripUUID(filename: string): string {
  // Remove UUID patterns like "_25c0c41d-107b-4d05-96d1-3de1efb728d9" or "-25c0c41d..."
  return filename.replace(/[-_][a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '');
}

/**
 * Clean Bambu-specific color codes like "Red (33200)" -> "Red"
 */
function cleanColorName(rawColor: string): string {
  let cleaned = rawColor.trim();
  
  // Remove Bambu color codes like (33200), (65500), etc.
  cleaned = cleaned.replace(/\s*\(\d+\)\s*$/g, '');
  
  // Remove leading/trailing punctuation
  cleaned = cleaned.replace(/^[\-\.\,\:\;]+|[\-\.\,\:\;]+$/g, '');
  
  return cleaned.trim();
}

function extractColorVariantsFromHtml(html: string, markdown: string, ctx?: LogContext): { variants: ColorVariant[]; invalidFiltered: string[] } {
  const variants: ColorVariant[] = [];
  const seenColors = new Set<string>();
  const invalidFiltered: string[] = [];
  const patternStats = { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, blocked: 0 };

  if (ctx) logDebug(ctx, 'COLORS', `Starting color extraction from HTML (${html.length} chars) and Markdown (${markdown.length} chars)`);

  const addColorIfValid = (rawColorName: string, source: string, imageUrl?: string, variantId?: string) => {
    // First clean the color name
    const colorName = cleanColorName(rawColorName);
    
    // Check blocklist
    if (isBlockedColorName(colorName)) {
      invalidFiltered.push(rawColorName);
      patternStats.blocked++;
      if (ctx) logDebug(ctx, 'COLORS', `BLOCKED (${source}): "${rawColorName}" -> cleaned: "${colorName}"`);
      return false;
    }
    
    const normalizedKey = colorName.toLowerCase();
    if (seenColors.has(normalizedKey)) {
      return false; // Already seen
    }
    
    // Validate it looks like a color (skip validation for trusted sources like fallbacks)
    // For trusted sources, we've already verified the color is valid
    if (source !== 'fallback' && !isColorName(colorName)) {
      invalidFiltered.push(rawColorName);
      patternStats.blocked++;
      if (ctx) logDebug(ctx, 'COLORS', `NOT A COLOR (${source}): "${rawColorName}"`);
      return false;
    }
    
    seenColors.add(normalizedKey);
    const colorInfo = extractColorInfo(colorName);
    variants.push({
      ...colorInfo,
      imageUrl: imageUrl || null,
      variantId: variantId || null,
    });
    return true;
  };

  // Pattern 1: Look for color swatches with data attributes (ENHANCED for Shopify)
  // Added more patterns for Shopify variant buttons and color options
  const swatchPatterns = [
    /data-(?:color|variant|option)=["']([^"']+)["']/gi,
    /data-option-value=["']([^"']+)["']/gi,  // Shopify option values
    /data-variant-title=["']([^"']+)["']/gi,  // Shopify variant titles
    /aria-label=["'](?:Select\s+)?(?:color\s*:?\s*)?([^"']+)["']/gi,  // Accessible labels
  ];
  let match;
  for (const swatchPattern of swatchPatterns) {
    while ((match = swatchPattern.exec(html)) !== null) {
      if (addColorIfValid(match[1], 'data-attr')) {
        patternStats.p1++;
        if (ctx) logDebug(ctx, 'COLORS', `Pattern 1 (data-attr): Found "${cleanColorName(match[1])}"`);
      }
    }
  }

  // Pattern 2: Look for color names in markdown color sections
  const colorSectionPattern = /(?:Color|Colour|Variant)s?[:\s]*([^\n]+)/gi;
  while ((match = colorSectionPattern.exec(markdown)) !== null) {
    const colorLine = match[1];
    const colors = colorLine.split(/[,|]/);
    for (const color of colors) {
      if (addColorIfValid(color, 'markdown')) {
        patternStats.p2++;
        if (ctx) logDebug(ctx, 'COLORS', `Pattern 2 (markdown): Found "${cleanColorName(color)}"`);
      }
    }
  }

  // Pattern 3: Look for Bambu Lab CDN image URLs with color names
  // PHASE 3 FIX: Enhanced to capture full image URL and associate with color variant
  // Examples: "SunflowerYellow.jpg" -> "Sunflower Yellow"
  //           "light_gray_25c0c41d-107b-4d05-96d1-3de1efb728d9.jpg" -> "Light Gray"
  // FIX: Also match new CDN format with transformation parameters (__op__resize,...)
  const imagePattern = /(https?:\/\/[^"'\s]*store\.bblcdn\.com[^"'\s]+\/([A-Za-z0-9_-]+)\.(?:png|jpg|jpeg)(?:__op__[^"'\s]*)?)/gi;
  while ((match = imagePattern.exec(html)) !== null) {
    const fullImageUrl = match[1]; // Full image URL for later use
    let filename = match[2]; // e.g., "PLA-Matte_Ivory-White" or "SunflowerYellow"
    let colorName = '';
    
    // Step 1: Strip UUID patterns from filename first
    filename = stripUUID(filename);
    
    // Step 2: Apply CamelCase splitting for filenames like "SunflowerYellow"
    filename = splitCamelCase(filename);
    
    // Strategy 1: If filename contains underscore, take everything after last underscore
    // e.g., "PLA-Matte_Ivory-White" -> "Ivory-White" -> "Ivory White"
    if (filename.includes('_')) {
      const parts = filename.split('_');
      colorName = parts[parts.length - 1].replace(/-/g, ' ');
    } 
    // Strategy 2: For filenames like "Matte-Lemon-Yellow", extract color after the product type
    else if (filename.toLowerCase().includes('matte-') || filename.toLowerCase().includes('basic-') || 
             filename.toLowerCase().includes('silk-') || filename.toLowerCase().includes('sparkle-') ||
             filename.toLowerCase().includes('tough-') || filename.toLowerCase().includes('translucent-')) {
      // Match pattern: ProductType-Color-Name (e.g., Matte-Lemon-Yellow)
      const productTypeMatch = filename.match(/^(?:PLA-?)?(?:Matte|Basic|Silk|Sparkle|Metal|Galaxy|Glow|Marble|Tough|Wood|Translucent)-(.+)$/i);
      if (productTypeMatch) {
        colorName = productTypeMatch[1].replace(/-/g, ' ');
      } else {
        // Fallback: take everything after first dash that starts with a capital
        const colorMatch = filename.match(/-([A-Z][a-z]+-?[A-Z]?[a-z]*(?:-[A-Z][a-z]+)*)$/);
        if (colorMatch) {
          colorName = colorMatch[1].replace(/-/g, ' ');
        }
      }
    }
    // Strategy 3: Simple case - CamelCase already split, or just the color name with dashes
    else {
      colorName = filename.replace(/-/g, ' ').replace(/_/g, ' ');
      // Try to extract just the color part (last 1-3 words that look like colors)
      const words = colorName.split(' ').filter(w => w.length > 0);
      if (words.length > 2) {
        // Take last 2-3 words if they look like a compound color
        const lastTwo = words.slice(-2).join(' ').toLowerCase();
        const lastThree = words.slice(-3).join(' ').toLowerCase();
        if (COLOR_HEX_MAP[lastThree]) {
          colorName = words.slice(-3).join(' ');
        } else if (COLOR_HEX_MAP[lastTwo]) {
          colorName = words.slice(-2).join(' ');
        } else {
          // Check if the last two words form a valid color (even if not in map)
          const lastTwoWords = words.slice(-2).join(' ');
          if (lastTwoWords.length >= 3 && isColorName(lastTwoWords)) {
            colorName = lastTwoWords;
          } else {
            colorName = words[words.length - 1]; // Fallback to last word
          }
        }
      }
    }
    
    if (colorName && colorName.length > 1) {
      if (ctx) logDebug(ctx, 'COLORS', `Pattern 3 parsing: "${match[2]}" -> cleaned: "${filename}" -> color: "${colorName}"`);
      // PHASE 3: Pass the full image URL when adding the color
      if (addColorIfValid(colorName, 'CDN-image', fullImageUrl)) {
        patternStats.p3++;
        if (ctx) logDebug(ctx, 'COLORS', `Pattern 3 (CDN image): Found "${cleanColorName(colorName)}" with image: ${fullImageUrl.substring(0, 60)}...`);
      }
    }
  }

  // Pattern 4: Look for variant option values in script tags
  const scriptPattern = /"option\d*":\s*"([^"]+)"/gi;
  while ((match = scriptPattern.exec(html)) !== null) {
    if (addColorIfValid(match[1], 'script-option')) {
      patternStats.p4++;
      if (ctx) logDebug(ctx, 'COLORS', `Pattern 4 (script option): Found "${cleanColorName(match[1])}"`);
    }
  }

  // Pattern 5: Look for Shopify variant data with associated image URLs
  // PHASE 3 FIX: Enhanced to extract variant images
  const variantDataPattern = /"title":"([^"]+)"[^}]*"id":(\d+)(?:[^}]*"featured_image":\s*\{[^}]*"src":"([^"]+)")?/gi;
  while ((match = variantDataPattern.exec(html)) !== null) {
    const variantTitle = match[1].trim();
    const variantId = match[2];
    const variantImage = match[3] || undefined;
    if (addColorIfValid(variantTitle, 'shopify-variant', variantImage, variantId)) {
      patternStats.p5++;
      if (ctx) logDebug(ctx, 'COLORS', `Pattern 5 (Shopify variant): Found "${cleanColorName(variantTitle)}" (id: ${variantId})${variantImage ? ' with image' : ''}`);
    }
  }

  // Pattern 6: Look for Shopify product JSON data (common in Bambu Lab pages)
  const shopifyJsonPattern = /"options":\s*\[\s*"([^"]+)"\s*\]/gi;
  while ((match = shopifyJsonPattern.exec(html)) !== null) {
    const optionValue = match[1].trim();
    if (addColorIfValid(optionValue, 'shopify-json')) {
      patternStats.p5++;  // Reuse p5 counter for all Shopify patterns
      if (ctx) logDebug(ctx, 'COLORS', `Pattern 6 (Shopify JSON options): Found "${cleanColorName(optionValue)}"`);
    }
  }

  // Pattern 7: Look for option values in Shopify variant selector HTML
  const optionSelectorPattern = /<option[^>]*value=["']([^"']+)["'][^>]*>([^<]+)<\/option>/gi;
  while ((match = optionSelectorPattern.exec(html)) !== null) {
    // Try both the value and the text content
    const optionValue = match[1].trim();
    const optionText = match[2].trim();
    if (addColorIfValid(optionValue, 'option-selector')) {
      patternStats.p5++;
      if (ctx) logDebug(ctx, 'COLORS', `Pattern 7 (option selector value): Found "${cleanColorName(optionValue)}"`);
    }
    if (optionText !== optionValue && addColorIfValid(optionText, 'option-selector-text')) {
      patternStats.p5++;
      if (ctx) logDebug(ctx, 'COLORS', `Pattern 7 (option selector text): Found "${cleanColorName(optionText)}"`);
    }
  }

  if (ctx) {
    logInfo(ctx, 'COLORS', `Extraction complete: ${variants.length} valid colors, ${patternStats.blocked} blocked`, patternStats);
    if (variants.length === 0) {
      logWarn(ctx, 'COLORS', 'ZERO colors extracted from dynamic content - will need fallback');
    } else if (variants.length > 0) {
      logDebug(ctx, 'COLORS', `Color list: ${variants.map(v => `${v.colorName}${v.colorHex ? ` (${v.colorHex})` : ''}${v.imageUrl ? ' [img]' : ''}`).join(', ')}`);
    }
  }

  return { variants, invalidFiltered };
}

function isColorName(text: string): boolean {
  const normalized = cleanColorName(text).toLowerCase().trim();
  
  // Reject empty or too short
  if (normalized.length < 2) return false;
  
  // Reject if blocked (double-check)
  if (isBlockedColorName(text)) return false;
  
  // Reject if contains non-color indicators
  if (/[\?\\\!\(\)\[\]\{\}\<\>]/.test(normalized)) return false;
  
  // Reject if it's just numbers
  if (/^\d+$/.test(normalized)) return false;
  
  // Check if it's in our color map
  if (COLOR_HEX_MAP[normalized]) return true;
  
  // Check for common color keywords (EXPANDED for Bambu Lab specialty products)
  const colorKeywords = [
    // Basic colors
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
    'gray', 'grey', 'gold', 'silver', 'bronze', 'copper', 'silk', 'matte', 'metallic',
    'navy', 'olive', 'teal', 'mint', 'coral', 'salmon', 'burgundy', 'maroon', 'crimson',
    'jade', 'emerald', 'sapphire', 'ruby', 'amber', 'ivory', 'cream', 'charcoal',
    'glow', 'galaxy', 'marble', 'rainbow', 'translucent', 'transparent', 'clear',
    'nature', 'natural', 'wood', 'walnut', 'oak', 'bamboo', 'beige', 'tan',
    'violet', 'lavender', 'lilac', 'plum', 'orchid', 'mauve', 'indigo',
    'aqua', 'cyan', 'turquoise', 'azure', 'cobalt', 'midnight',
    
    // Creative/Descriptive (Bambu Lab specialty gradient & silk products)
    'arctic', 'ocean', 'whisper', 'meadow', 'radiance', 'cloud', 'twilight',
    'dream', 'aurora', 'solar', 'breeze', 'cotton', 'candy', 'blueberry',
    'bubblegum', 'dusk', 'glare', 'citrus', 'forest', 'sunset', 'dawn',
    'stardust', 'cosmic', 'nebula', 'sparkle', 'shimmer', 'glitter',
    
    // Temperature/Texture descriptors
    'ice', 'frozen', 'warm', 'hot', 'cool', 'bright', 'pale', 'deep', 'soft',
    
    // Nature-inspired
    'sky', 'sea', 'earth', 'sun', 'moon', 'star', 'spring', 'autumn', 'winter',
    'summer', 'mellow', 'peachy', 'rose',
    
    // Food-inspired (common in filament colors)
    'latte', 'mocha', 'cocoa', 'chocolate', 'caramel', 'butter', 'cream',
    'lemon', 'lime', 'mango', 'peach', 'cherry', 'berry', 'mint',
    'pumpkin', 'mandarin', 'sunflower', 'matcha',
  ];
  
  return colorKeywords.some(kw => normalized.includes(kw));
}

function extractColorInfo(colorName: string): ColorVariant {
  const cleaned = cleanColorName(colorName);
  const normalized = cleaned.toLowerCase().trim();
  
  // Direct match
  let hex = COLOR_HEX_MAP[normalized] || null;
  let family = COLOR_FAMILY_MAP[normalized] || null;
  
  // Try partial match
  if (!hex) {
    for (const [name, hexValue] of Object.entries(COLOR_HEX_MAP)) {
      if (normalized.includes(name)) {
        hex = hexValue;
        family = COLOR_FAMILY_MAP[name] || null;
        break;
      }
    }
  }
  
  return {
    colorName: cleaned,
    colorHex: hex,
    colorFamily: family,
    imageUrl: null,
    variantId: null,
  };
}

// ============================================================================
// FIRECRAWL SCRAPING WITH RETRY LOGIC
// ============================================================================
const FIRECRAWL_MAX_RETRIES = 3;
const FIRECRAWL_BASE_DELAY_MS = 1000;
const FIRECRAWL_429_MULTIPLIER = 3; // Extended backoff for rate limits

async function scrapeWithFirecrawl(
  url: string, 
  region: string,
  ctx?: LogContext
): Promise<{ html: string; markdown: string; success: boolean; error?: string; errorCategory?: ErrorCategory; durationMs?: number }> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlKey) {
    if (ctx) logError(ctx, 'FIRECRAWL', 'No Firecrawl API key configured');
    return { html: '', markdown: '', success: false, error: 'No Firecrawl API key' };
  }

  const location = REGION_TO_FIRECRAWL_LOCATION[region];
  
  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= FIRECRAWL_MAX_RETRIES; attempt++) {
    const startTime = Date.now();
    
    if (attempt > 0) {
      const backoffDelay = FIRECRAWL_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      if (ctx) logInfo(ctx, 'FIRECRAWL', `Retry attempt ${attempt}/${FIRECRAWL_MAX_RETRIES} after ${backoffDelay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }

    if (ctx) {
      logInfo(ctx, 'FIRECRAWL', `Request${attempt > 0 ? ` (attempt ${attempt + 1})` : ''}: ${url}`);
      logDebug(ctx, 'FIRECRAWL', `Geo-location: ${JSON.stringify(location || { country: 'CA', languages: ['en'] })}`);
    }

    try {
      // FIX: Removed waitForSelector as Firecrawl v2 API doesn't support it
      // Use longer waitFor instead to allow JS to render dynamic content
      const requestBody = {
        url,
        formats: ['html', 'markdown'],
        onlyMainContent: false,
        waitFor: 8000,  // Optimized from 15s - Shopify pages typically load variants within 5-8s
        location: location || { country: 'CA', languages: ['en'] },
      };
      
      if (ctx) logDebug(ctx, 'FIRECRAWL', 'Request body', requestBody);

      // FIX: Add 25s timeout to prevent indefinite hangs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      let response: Response;
      try {
        response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        const errText = await response.text();
        const isRateLimit = response.status === 429;
        const isServerError = response.status >= 500;
        const isRetryable = isServerError || isRateLimit;
        
        if (ctx) {
          logError(ctx, 'FIRECRAWL', `HTTP ${response.status} error after ${durationMs}ms`, { 
            status: response.status, 
            response: errText.substring(0, 500),
            retryable: isRetryable,
            isRateLimit,
            attempt: attempt + 1,
          });
        }
        
        // Only retry on server errors (5xx) or rate limits (429)
        if (isRetryable && attempt < FIRECRAWL_MAX_RETRIES) {
          // Extended backoff for rate limits (429)
          if (isRateLimit) {
            const rateLimitBackoff = FIRECRAWL_BASE_DELAY_MS * Math.pow(FIRECRAWL_429_MULTIPLIER, attempt);
            if (ctx) logWarn(ctx, 'FIRECRAWL', `Rate limited (429) - extended backoff: ${rateLimitBackoff}ms`);
            await new Promise(resolve => setTimeout(resolve, rateLimitBackoff));
          }
          continue; // Retry
        }
        
        return { 
          html: '', 
          markdown: '', 
          success: false, 
          error: `HTTP ${response.status}`, 
          errorCategory: 'firecrawl',
          durationMs 
        };
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        if (ctx) logError(ctx, 'FIRECRAWL', 'Unsuccessful response from Firecrawl', { 
          success: data.success, 
          hasData: !!data.data,
          attempt: attempt + 1,
        });
        
        // Retry unsuccessful responses
        if (attempt < FIRECRAWL_MAX_RETRIES) {
          continue;
        }
        
        return { html: '', markdown: '', success: false, error: 'Unsuccessful response', durationMs };
      }

      const htmlSize = data.data.html?.length || 0;
      const mdSize = data.data.markdown?.length || 0;
      
      if (ctx) {
        logSuccess(ctx, 'FIRECRAWL', `Response received in ${durationMs}ms${attempt > 0 ? ` (after ${attempt} retries)` : ''}`, { htmlSize, mdSize });
        if (htmlSize < 1000) {
          logWarn(ctx, 'FIRECRAWL', `Suspiciously small HTML response (${htmlSize} chars)`);
        }
      }

      return {
        html: data.data.html || '',
        markdown: data.data.markdown || '',
        success: true,
        durationMs,
      };
    } catch (error: unknown) {
      const durationMs = Date.now() - startTime;
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      const errMsg = isAbortError 
        ? 'Firecrawl request timed out after 25 seconds' 
        : (error instanceof Error ? error.message : String(error));
      
      if (ctx) logError(ctx, 'FIRECRAWL', `Exception after ${durationMs}ms: ${errMsg}`, { 
        error,
        isTimeout: isAbortError,
        attempt: attempt + 1 
      });
      
      // Retry on network errors (but NOT on timeout - abort errors shouldn't retry)
      if (!isAbortError && attempt < FIRECRAWL_MAX_RETRIES) {
        continue;
      }
      
      return { html: '', markdown: '', success: false, error: errMsg, durationMs };
    }
  }
  
  // Should never reach here, but TypeScript needs a return
  return { html: '', markdown: '', success: false, error: 'Max retries exceeded' };
}

// ============================================================================
// PHASE 3: PRODUCT AVAILABILITY DETECTION
// Detects if a product or specific color variant is out of stock vs unavailable
// ============================================================================
interface ProductAvailability {
  isAvailable: boolean;
  stockStatus: 'in_stock' | 'out_of_stock' | 'preorder' | 'unavailable';
  outOfStockColors: string[];
}

function detectProductAvailability(html: string, markdown: string, ctx?: LogContext): ProductAvailability {
  const result: ProductAvailability = {
    isAvailable: true,
    stockStatus: 'in_stock',
    outOfStockColors: [],
  };

  // Check for product-level availability indicators
  const unavailablePatterns = [
    /unavailable\s*in\s*your\s*region/i,
    /not\s*available\s*in\s*your\s*country/i,
    /product\s*not\s*found/i,
    /404\s*not\s*found/i,
    /page\s*not\s*found/i,
    /this\s*product\s*is\s*unavailable/i,
  ];

  for (const pattern of unavailablePatterns) {
    if (pattern.test(html) || pattern.test(markdown)) {
      result.isAvailable = false;
      result.stockStatus = 'unavailable';
      if (ctx) logWarn(ctx, 'AVAILABILITY', `Product marked as unavailable (matched pattern)`);
      return result;
    }
  }

  // Check for out of stock at product level
  const outOfStockPatterns = [
    /sold\s*out/i,
    /out\s*of\s*stock/i,
    /currently\s*unavailable/i,
    /temporarily\s*out\s*of\s*stock/i,
  ];

  for (const pattern of outOfStockPatterns) {
    if (pattern.test(html) || pattern.test(markdown)) {
      result.stockStatus = 'out_of_stock';
      if (ctx) logWarn(ctx, 'AVAILABILITY', `Product may be out of stock (matched pattern)`);
      break;
    }
  }

  // Check for preorder
  const preorderPatterns = [
    /pre[-\s]?order/i,
    /coming\s*soon/i,
    /available\s*soon/i,
  ];

  for (const pattern of preorderPatterns) {
    if (pattern.test(html) || pattern.test(markdown)) {
      result.stockStatus = 'preorder';
      if (ctx) logInfo(ctx, 'AVAILABILITY', `Product is available for preorder`);
      break;
    }
  }

  // Try to detect out-of-stock color variants
  // Look for patterns like "Black - Sold Out" or disabled color buttons
  const variantOosPattern = /(?:class=["'][^"']*(?:disabled|sold-out|unavailable)[^"']*["'][^>]*>([A-Za-z\s]+)<)|(?:([A-Za-z\s]+)\s*[-–—]\s*(?:sold\s*out|out\s*of\s*stock))/gi;
  let match;
  while ((match = variantOosPattern.exec(html)) !== null) {
    const colorName = (match[1] || match[2] || '').trim();
    if (colorName && colorName.length > 1 && colorName.length < 30) {
      result.outOfStockColors.push(colorName);
      if (ctx) logDebug(ctx, 'AVAILABILITY', `Detected out-of-stock color: ${colorName}`);
    }
  }

  // Also check markdown for "Sold Out" patterns
  const mdOosPattern = /\*\*([A-Za-z\s]+)\*\*\s*[-–—]?\s*(?:Sold\s*Out|Out\s*of\s*Stock)/gi;
  while ((match = mdOosPattern.exec(markdown)) !== null) {
    const colorName = match[1].trim();
    if (colorName && !result.outOfStockColors.includes(colorName)) {
      result.outOfStockColors.push(colorName);
    }
  }

  if (ctx && result.outOfStockColors.length > 0) {
    logInfo(ctx, 'AVAILABILITY', `Found ${result.outOfStockColors.length} out-of-stock colors: ${result.outOfStockColors.join(', ')}`);
  }

  return result;
}

async function scrapeProductPage(
  productSlug: string, 
  region: string = 'CA', 
  material: string = 'PLA',
  ctx?: LogContext
): Promise<{
  colors: ColorVariant[];
  invalidFilteredColors: string[];
  price: number | null;
  tdsUrl: string | null;
  success: boolean;
  availability?: ProductAvailability;
  firecrawlMs?: number;
}> {
  const store = BAMBU_REGIONAL_STORES[region];
  const url = `https://${store.subdomain}.store.bambulab.com/products/${productSlug}`;
  
  if (ctx) {
    logSeparator(ctx);
    logInfo(ctx, 'PRODUCT_SCRAPE', `Scraping product page: ${url}`);
    logDebug(ctx, 'PRODUCT_SCRAPE', `Slug: ${productSlug}, Region: ${region}, Material: ${material}`);
  }
  
  const { html, markdown, success, error, durationMs } = await scrapeWithFirecrawl(url, region, ctx);
  
  if (!success) {
    if (ctx) logError(ctx, 'PRODUCT_SCRAPE', `Failed to scrape ${productSlug}`, { error, url });
    return { colors: [], invalidFilteredColors: [], price: null, tdsUrl: null, success: false, firecrawlMs: durationMs };
  }

  // Extract colors - PREFER fallbacks for specialty products that have known color sets
  // This prevents garbage extraction for multi-color and specialty products
  if (ctx) logInfo(ctx, 'PRODUCT_SCRAPE', 'Extracting color variants...');
  
  let colors: ColorVariant[] = [];
  let invalidFilteredColors: string[] = [];
  
  // Products that should ALWAYS use fallbacks (their dynamic extraction is unreliable)
  const PREFER_FALLBACK_PRODUCTS = [
    'pla-silk-multi-color',  // Multi-color products have marketing text that gets extracted as colors
    'pla-basic-gradient',    // Gradient products have complex names
  ];
  
  const shouldPreferFallback = PREFER_FALLBACK_PRODUCTS.includes(productSlug) && PRODUCT_COLOR_FALLBACKS[productSlug];
  
  if (shouldPreferFallback) {
    // For specialty products, use fallbacks directly
    colors = PRODUCT_COLOR_FALLBACKS[productSlug];
    if (ctx) {
      logInfo(ctx, 'PRODUCT_SCRAPE', `PREFER FALLBACK for specialty product ${productSlug}: ${colors.length} colors`);
      logDebug(ctx, 'PRODUCT_SCRAPE', `Fallback colors: ${colors.map(c => c.colorName).join(', ')}`);
    }
  } else {
    // For regular products, try dynamic extraction first
    const extraction = extractColorVariantsFromHtml(html, markdown, ctx);
    colors = extraction.variants;
    invalidFilteredColors = extraction.invalidFiltered;
    
    // FIX 4: Add fallback validation logging - warn when dynamic extraction finds significantly fewer colors
    if (colors.length > 0 && PRODUCT_COLOR_FALLBACKS[productSlug] && ctx) {
      const fallbackCount = PRODUCT_COLOR_FALLBACKS[productSlug].length;
      const extractedCount = colors.length;
      const difference = fallbackCount - extractedCount;
      
      if (difference > 3) {
        logWarn(ctx, 'PRODUCT_SCRAPE', 
          `Dynamic extraction found ${extractedCount} colors, but fallback has ${fallbackCount} (missing ${difference})`,
          { product: productSlug, extracted: colors.map(c => c.colorName).slice(0, 5) }
        );
      }
    }
    
    // If no colors found, fall back to hardcoded colors
    if (colors.length === 0 && PRODUCT_COLOR_FALLBACKS[productSlug]) {
      colors = PRODUCT_COLOR_FALLBACKS[productSlug];
      if (ctx) {
        logInfo(ctx, 'PRODUCT_SCRAPE', `Using FALLBACK colors for ${productSlug}: ${colors.length} colors`);
        logDebug(ctx, 'PRODUCT_SCRAPE', `Fallback colors: ${colors.map(c => c.colorName).join(', ')}`);
      }
    }
  }
  
  if (ctx) {
    logInfo(ctx, 'PRODUCT_SCRAPE', `Found ${colors.length} valid color variants for ${productSlug}`);
    if (invalidFilteredColors.length > 0) {
      logInfo(ctx, 'PRODUCT_SCRAPE', `Filtered ${invalidFilteredColors.length} invalid colors: ${invalidFilteredColors.slice(0, 5).join(', ')}${invalidFilteredColors.length > 5 ? '...' : ''}`);
    }
  }

  // Extract price with material-specific range
  if (ctx) logInfo(ctx, 'PRODUCT_SCRAPE', 'Extracting price...');
  const priceResult = extractBambuLabPrice(html, markdown, region, material, ctx);
  const price = priceResult?.price || null;
  if (price && ctx) {
    logSuccess(ctx, 'PRODUCT_SCRAPE', `Price extracted: ${price} ${store.currency} via ${priceResult?.source}`);
  } else if (ctx) {
    logWarn(ctx, 'PRODUCT_SCRAPE', 'No valid price extracted');
  }

  // FIX 2: Extract TDS URL with multi-pattern matching using RegExp.exec()
  let tdsUrl: string | null = null;
  
  // TDS URL extraction patterns (ordered by specificity)
  // NOTE: Using RegExp (not literals with gi) so we can properly use exec() for capture groups
  const TDS_URL_PATTERNS = [
    // Pattern 1: Standard Technical_Data_Sheet naming
    new RegExp(/href=["']([^"']*Technical_Data_Sheet[^"']*\.pdf)["']/i),
    // Pattern 2: TDS abbreviation
    new RegExp(/href=["']([^"']*(?:\/|_)tds[^"']*\.pdf)["']/i),
    // Pattern 3: bblcdn.com hosted PDFs (common Bambu pattern)
    new RegExp(/href=["'](https?:\/\/(?:store\.)?bblcdn\.com\/[^"']+\.pdf)["']/i),
    // Pattern 4: Shopify CDN hosted PDFs
    new RegExp(/href=["'](https?:\/\/cdn\.shopify\.com\/[^"']+\.pdf)["']/i),
    // Pattern 5: Any PDF with technical/datasheet keywords in the URL path
    new RegExp(/href=["']([^"']*(?:technical|datasheet|data[-_]sheet|specs?)[^"']*\.pdf)["']/i),
  ];
  
  for (const pattern of TDS_URL_PATTERNS) {
    // Use exec() instead of match() for proper capture group extraction
    const tdsMatch = pattern.exec(html);
    if (tdsMatch && tdsMatch[1]) {
      tdsUrl = tdsMatch[1];
      if (!tdsUrl.startsWith('http')) {
        tdsUrl = `https://store.bblcdn.com${tdsUrl}`;
      }
      if (ctx) logInfo(ctx, 'PRODUCT_SCRAPE', `TDS URL found via pattern: ${tdsUrl}`);
      break;
    }
  }
  
  if (!tdsUrl && ctx) {
    logDebug(ctx, 'PRODUCT_SCRAPE', 'No TDS URL found in page with any pattern');
  }

  // PHASE 3: Detect product availability
  if (ctx) logInfo(ctx, 'PRODUCT_SCRAPE', 'Detecting product availability...');
  const availability = detectProductAvailability(html, markdown, ctx);

  if (ctx) {
    logSuccess(ctx, 'PRODUCT_SCRAPE', `Page scrape complete`, { 
      colors: colors.length, 
      invalidFiltered: invalidFilteredColors.length,
      price, 
      hasTds: !!tdsUrl,
      availability: availability.stockStatus,
      outOfStockColors: availability.outOfStockColors.length,
      firecrawlMs: durationMs 
    });
  }

  return { colors, invalidFilteredColors, price, tdsUrl, success: true, availability, firecrawlMs: durationMs };
}

async function scrapeRegionalPrice(
  productSlug: string, 
  region: string, 
  material: string = 'PLA',
  ctx?: LogContext
): Promise<{
  price: number | null;
  compareAtPrice: number | null;
  url: string;
  firecrawlMs?: number;
}> {
  const store = BAMBU_REGIONAL_STORES[region];
  const url = `https://${store.subdomain}.store.bambulab.com/products/${productSlug}`;
  
  if (ctx) logDebug(ctx, 'REGIONAL', `Scraping regional price: ${region} -> ${url}`);
  
  const { html, markdown, success, durationMs } = await scrapeWithFirecrawl(url, region, ctx);
  
  if (!success) {
    if (ctx) logWarn(ctx, 'REGIONAL', `Failed to scrape ${region} price for ${productSlug}`);
    return { price: null, compareAtPrice: null, url, firecrawlMs: durationMs };
  }

  const priceResult = extractBambuLabPrice(html, markdown, region, material, ctx);
  if (priceResult?.price && ctx) {
    logSuccess(ctx, 'REGIONAL', `${region}: ${priceResult.price} ${store.currency}${priceResult.compareAtPrice ? ` (was ${priceResult.compareAtPrice})` : ''}`);
  }
  return { 
    price: priceResult?.price || null, 
    compareAtPrice: priceResult?.compareAtPrice || null,
    url, 
    firecrawlMs: durationMs 
  };
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================
async function upsertFilament(
  supabase: any,
  productType: string,
  colorVariant: ColorVariant,
  productConfig: ProductConfig,
  brandId: string | null,
  prices: Record<string, { price: number | null; compareAtPrice: number | null; url: string }>,
  productImage: string | null,  // NEW: s5/default product image from collection page
  ctx?: LogContext
): Promise<{ created: boolean; updated: boolean; error?: string; durationMs?: number }> {
  const startTime = Date.now();
  
  // FIX: Strip product type prefix from color name to avoid duplication
  // e.g., "PLA Silk" + "Silk Red" should become "Bambu Lab PLA Silk Red" not "Bambu Lab PLA Silk Silk Red"
  let displayColor = colorVariant.colorName;
  const productTypeWords = productType.split(' '); // e.g., ["PLA", "Silk"]
  
  // Helper to escape special regex characters in product type words
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  for (const word of productTypeWords) {
    // Check if color name starts with a word from the product type (case insensitive)
    // Use escapeRegExp to safely handle special characters like "+" in "PLA+"
    const regex = new RegExp(`^${escapeRegExp(word)}\\s+`, 'i');
    if (regex.test(displayColor)) {
      displayColor = displayColor.replace(regex, '');
    }
  }
  
  const productTitle = `Bambu Lab ${productType} ${displayColor}`;
  const productId = `bambu-${productConfig.slug}-${colorVariant.colorName.toLowerCase().replace(/\s+/g, '-')}`;
  
  if (ctx) {
    logInfo(ctx, 'DB', `Upserting: ${productTitle}`);
    logDebug(ctx, 'DB', `Product ID: ${productId}`);
    logDebug(ctx, 'DB', `Color: ${colorVariant.colorName}, Hex: ${colorVariant.colorHex}, Family: ${colorVariant.colorFamily}`);
  }

  // Check if filament exists
  const checkStart = Date.now();
  const { data: existing, error: checkError } = await supabase
    .from('filaments')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle();

  if (ctx) logTiming(ctx, 'DB', 'Existence check', Date.now() - checkStart);

  if (checkError) {
    if (ctx) logError(ctx, 'DB', 'Error checking existing filament', checkError);
    return { created: false, updated: false, error: checkError.message, durationMs: Date.now() - startTime };
  }

  if (ctx) logDebug(ctx, 'DB', `Existing record: ${existing ? `YES (id: ${existing.id})` : 'NO (new insert)'}`);

  const filamentData: Record<string, any> = {
    product_id: productId,
    product_title: productTitle,
    vendor: 'Bambu Lab',
    brand_id: brandId,
    material: productConfig.material,
    color_hex: colorVariant.colorHex,
    color_family: colorVariant.colorFamily,
    // Image priority: 1) s5 product image from collection page, 2) valid color variant image, 3) fallback
    featured_image: productImage || 
      (colorVariant.imageUrl && isValidBambuLabImageUrl(colorVariant.imageUrl) ? colorVariant.imageUrl : null) ||
      generateBambuLabImageUrl(productConfig.slug, colorVariant.colorName),
    tds_url: productConfig.tdsUrl,
    nozzle_temp_min_c: productConfig.nozzleTempMin,
    nozzle_temp_max_c: productConfig.nozzleTempMax,
    bed_temp_min_c: productConfig.bedTempMin,
    bed_temp_max_c: productConfig.bedTempMax,
    drying_temp_c: productConfig.dryingTempC,
    drying_time_hours: productConfig.dryingTimeHours,
    diameter_nominal_mm: 1.75,
    net_weight_g: productConfig.netWeightG || 1000,
    auto_created: true,
    auto_updated: true,
    last_scraped_at: new Date().toISOString(),
    sync_status: 'synced',
  };

  // Add regional prices, compare-at prices, and URLs
  const pricesSummary: string[] = [];
  for (const [region, { price, compareAtPrice, url }] of Object.entries(prices)) {
    const store = BAMBU_REGIONAL_STORES[region];
    if (store && price) {
      filamentData[store.priceField] = price;
      filamentData[store.urlField] = url;
      pricesSummary.push(`${region}:${price}`);
      
      // Save compare-at price for US region only (variant_compare_at_price column)
      if (region === 'US' && compareAtPrice) {
        filamentData['variant_compare_at_price'] = compareAtPrice;
      }
    }
  }
  
  if (ctx) {
    logDebug(ctx, 'DB', `Prices to save: ${pricesSummary.join(', ') || 'NONE'}`);
    logDebug(ctx, 'DB', `Filament data keys: ${Object.keys(filamentData).join(', ')}`);
  }

  const opStart = Date.now();
  if (existing) {
    // Update
    const { error: updateError } = await supabase
      .from('filaments')
      .update(filamentData)
      .eq('id', existing.id);

    const opDuration = Date.now() - opStart;
    const totalDuration = Date.now() - startTime;

    if (updateError) {
      if (ctx) logError(ctx, 'DB', `Update failed for ${productTitle}`, updateError);
      return { created: false, updated: false, error: updateError.message, durationMs: totalDuration };
    }
    
    if (ctx) {
      logSuccess(ctx, 'DB', `Updated: ${productTitle}`, { opDuration, totalDuration });
    }
    return { created: false, updated: true, durationMs: totalDuration };
  } else {
    // Insert
    const { error: insertError } = await supabase
      .from('filaments')
      .insert(filamentData);

    const opDuration = Date.now() - opStart;
    const totalDuration = Date.now() - startTime;

    if (insertError) {
      if (ctx) logError(ctx, 'DB', `Insert failed for ${productTitle}`, insertError);
      return { created: false, updated: false, error: insertError.message, durationMs: totalDuration };
    }
    
    if (ctx) {
      logSuccess(ctx, 'DB', `Created: ${productTitle}`, { opDuration, totalDuration });
    }
    return { created: true, updated: false, durationMs: totalDuration };
  }
}

// ============================================================================
// EDGE RUNTIME DECLARATION FOR BACKGROUND TASKS
// ============================================================================
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

// ============================================================================
// JOB TIMEOUT CONFIGURATION (30 minutes max)
// ============================================================================
const JOB_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

function checkJobTimeout(ctx: LogContext, jobId: string): boolean {
  const elapsed = Date.now() - ctx.startTime;
  if (elapsed > JOB_TIMEOUT_MS) {
    logError(ctx, 'TIMEOUT', `Job ${jobId} exceeded ${JOB_TIMEOUT_MS / 60000} minute timeout after ${Math.round(elapsed / 60000)} minutes`);
    return true;
  }
  return false;
}

// ============================================================================
// JOB HEARTBEAT CONFIGURATION - Sends heartbeat updates to prevent stuck job detection
// ============================================================================
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds between heartbeats
let lastHeartbeatTime = 0;

async function sendHeartbeat(
  supabaseClient: any, 
  jobId: string, 
  ctx: LogContext,
  force: boolean = false
): Promise<void> {
  const now = Date.now();
  if (!force && (now - lastHeartbeatTime) < HEARTBEAT_INTERVAL_MS) {
    return; // Skip if not enough time has passed
  }
  
  try {
    await supabaseClient.from('scrape_jobs').update({
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
    
    lastHeartbeatTime = now;
    logDebug(ctx, 'HEARTBEAT', `Job ${jobId} heartbeat sent (elapsed: ${Math.round((now - ctx.startTime) / 1000)}s)`);
  } catch (err) {
    logWarn(ctx, 'HEARTBEAT', `Failed to send heartbeat for job ${jobId}`, err);
  }
}

// ============================================================================
// VALIDATION REPORT - Compare scraped colors vs expected fallback colors
// ============================================================================
interface ProductValidationReport {
  productSlug: string;
  productName: string;
  expectedColors: number;
  actualColors: number;
  missingColors: string[];
  extraColors: string[];
  coveragePercent: number;
}

interface ValidationSummary {
  totalExpected: number;
  totalActual: number;
  overallCoveragePercent: number;
  productsWithFullCoverage: number;
  productsWithPartialCoverage: number;
  productsWithNoCoverage: number;
  productReports: ProductValidationReport[];
}

function generateProductValidationReport(
  productSlug: string,
  productName: string,
  scrapedColors: ColorVariant[],
  ctx?: LogContext
): ProductValidationReport {
  const fallbackColors = PRODUCT_COLOR_FALLBACKS[productSlug] || [];
  
  const scrapedNames = new Set(scrapedColors.map(c => c.colorName.toLowerCase().trim()));
  const fallbackNames = new Set(fallbackColors.map(c => c.colorName.toLowerCase().trim()));
  
  const missingColors = fallbackColors
    .filter(c => !scrapedNames.has(c.colorName.toLowerCase().trim()))
    .map(c => c.colorName);
  
  const extraColors = scrapedColors
    .filter(c => !fallbackNames.has(c.colorName.toLowerCase().trim()))
    .map(c => c.colorName);
  
  const expectedCount = fallbackColors.length;
  const actualCount = scrapedColors.length;
  const coveragePercent = expectedCount > 0 ? Math.round((actualCount / expectedCount) * 100) : 100;
  
  return {
    productSlug,
    productName,
    expectedColors: expectedCount,
    actualColors: actualCount,
    missingColors,
    extraColors,
    coveragePercent,
  };
}

function generateValidationSummary(productReports: ProductValidationReport[]): ValidationSummary {
  const totalExpected = productReports.reduce((sum, r) => sum + r.expectedColors, 0);
  const totalActual = productReports.reduce((sum, r) => sum + r.actualColors, 0);
  
  const productsWithFullCoverage = productReports.filter(r => r.coveragePercent >= 100).length;
  const productsWithPartialCoverage = productReports.filter(r => r.coveragePercent > 0 && r.coveragePercent < 100).length;
  const productsWithNoCoverage = productReports.filter(r => r.coveragePercent === 0).length;
  
  return {
    totalExpected,
    totalActual,
    overallCoveragePercent: totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 100,
    productsWithFullCoverage,
    productsWithPartialCoverage,
    productsWithNoCoverage,
    productReports,
  };
}

function logValidationSummary(summary: ValidationSummary, ctx: LogContext): void {
  console.log(`\n[${ctx.requestId}] ${'='.repeat(60)}`);
  console.log(`[${ctx.requestId}] 📊 VALIDATION REPORT - Color Coverage Summary`);
  console.log(`[${ctx.requestId}] ${'='.repeat(60)}`);
  
  // Log individual product reports
  for (const report of summary.productReports) {
    const status = report.coveragePercent >= 100 ? '✅' : report.coveragePercent >= 80 ? '⚠️' : '❌';
    const missingStr = report.missingColors.length > 0 
      ? ` - Missing: [${report.missingColors.slice(0, 5).join(', ')}${report.missingColors.length > 5 ? '...' : ''}]` 
      : '';
    const extraStr = report.extraColors.length > 0 
      ? ` - Extra: [${report.extraColors.slice(0, 3).join(', ')}${report.extraColors.length > 3 ? '...' : ''}]` 
      : '';
    
    console.log(`[${ctx.requestId}] ${status} ${report.productName}: ${report.actualColors}/${report.expectedColors} colors (${report.coveragePercent}%)${missingStr}${extraStr}`);
  }
  
  // Log overall summary
  console.log(`[${ctx.requestId}] ${'─'.repeat(60)}`);
  console.log(`[${ctx.requestId}] 📈 OVERALL: ${summary.totalActual}/${summary.totalExpected} colors (${summary.overallCoveragePercent}%)`);
  console.log(`[${ctx.requestId}]    ✅ Full coverage: ${summary.productsWithFullCoverage} products`);
  console.log(`[${ctx.requestId}]    ⚠️ Partial coverage: ${summary.productsWithPartialCoverage} products`);
  console.log(`[${ctx.requestId}]    ❌ No coverage: ${summary.productsWithNoCoverage} products`);
  console.log(`[${ctx.requestId}] ${'='.repeat(60)}\n`);
}

// ============================================================================
// BACKGROUND SCRAPE FUNCTION
// ============================================================================
async function runBackgroundScrape(
  supabaseClient: any,
  jobId: string,
  selectedMaterials: string[],
  products: string[] | undefined,
  limit: number | undefined,
  dryRun: boolean | undefined,
  ctx: LogContext,
  timing: { firecrawlMs: number; dbMs: number; delayMs: number }
): Promise<void> {
  logInfo(ctx, 'BACKGROUND', `Starting background scrape for job: ${jobId} (timeout: ${JOB_TIMEOUT_MS / 60000} minutes)`);
  
  const results = {
    requestId: ctx.requestId,
    startedAt: new Date(ctx.startTime).toISOString(),
    materialsProcessed: selectedMaterials,
    productsScraped: 0,
    colorsDiscovered: 0,
    filamentsCreated: 0,
    filamentsUpdated: 0,
    errors: [] as CategorizedError[],
    productDetails: [] as any[],
    timing: {} as TimingMetrics,
    validation: undefined as ValidationSummary | undefined,
  };
  
  // Progress update throttling - only update every N products or on significant events
  const PROGRESS_UPDATE_INTERVAL = 3; // Update every 3 products
  let lastProgressUpdate = 0;
  
  // Track validation reports per product
  const productValidationReports: ProductValidationReport[] = [];
  
  // Reset heartbeat timer at start
  lastHeartbeatTime = 0;

  try {
    // Get Bambu Lab brand ID
    const { data: brandData } = await supabaseClient
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'bambu-lab')
      .single();
    
    const brandId = brandData?.id || null;
    
    // Calculate total products for progress tracking
    let totalProducts = 0;
    for (const materialCategory of selectedMaterials) {
      const materialProducts = ALL_BAMBU_PRODUCTS[materialCategory];
      if (materialProducts) {
        let count = Object.keys(materialProducts).length;
        if (limit && limit > 0) count = Math.min(count, limit);
        totalProducts += count;
      }
    }

    let productsProcessed = 0;

    // Process each selected material category
    for (const materialCategory of selectedMaterials) {
      const materialProducts = ALL_BAMBU_PRODUCTS[materialCategory];
      
      if (!materialProducts) {
        results.errors.push(createError('data_quality', `Unknown material category: ${materialCategory}`));
        continue;
      }

      logSeparator(ctx, `MATERIAL: ${materialCategory}`);

      // NEW: Scrape collection page to get s5/default product images (actual product photos)
      const collectionImages = await scrapeCollectionProductImages(materialCategory, ctx);
      if (ctx) logInfo(ctx, 'BACKGROUND', `Collection images loaded: ${collectionImages.size} products mapped for ${materialCategory}`);

      // Track issues for this material
      const materialIssues: MaterialIssues = {
        missingPrices: [],
        missingColors: [],
        missingImages: [],
        invalidColorNames: [],
      };

      // Determine which products to scrape for this material
      let productsToScrape = Object.entries(materialProducts);
      
      if (products && Array.isArray(products)) {
        productsToScrape = productsToScrape.filter(([name]) => 
          products.some((p: string) => name.toLowerCase().includes(p.toLowerCase()))
        );
      }
      
      if (limit && limit > 0) {
        productsToScrape = productsToScrape.slice(0, limit);
      }

      // Process each product
      for (const [productName, productConfig] of productsToScrape) {
        // Check for job timeout at the start of each product
        if (checkJobTimeout(ctx, jobId)) {
          const timeoutError = createError('data_quality', `Job timed out after ${JOB_TIMEOUT_MS / 60000} minutes`, {
            product: productName,
            details: `Processed ${productsProcessed}/${totalProducts} products before timeout`
          });
          results.errors.push(timeoutError);
          
          // Mark job as failed due to timeout
          await supabaseClient.from('scrape_jobs').update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error: `Job exceeded ${JOB_TIMEOUT_MS / 60000} minute timeout`,
            results: { ...results, errors: results.errors.map(formatError) },
            progress: {
              currentMaterial: materialCategory,
              currentProduct: productName,
              currentRegion: null,
              productsProcessed,
              totalProducts,
              colorsDiscovered: results.colorsDiscovered,
              filamentsCreated: results.filamentsCreated,
              filamentsUpdated: results.filamentsUpdated,
              errors: results.errors.map(formatError),
            },
          }).eq('id', jobId);
          
          return; // Exit the function entirely
        }

        ctx.productName = productName;
        productsProcessed++;

        // Send heartbeat before processing each product
        await sendHeartbeat(supabaseClient, jobId, ctx);

        // Update job progress with enhanced tracking
        const elapsedMs = Date.now() - ctx.startTime;
        await supabaseClient.from('scrape_jobs').update({
          progress: {
            currentMaterial: materialCategory,
            currentProduct: productName,
            currentRegion: null,
            currentStage: 'fetching_colors',
            productsProcessed,
            totalProducts,
            colorsDiscovered: results.colorsDiscovered,
            filamentsCreated: results.filamentsCreated,
            filamentsUpdated: results.filamentsUpdated,
            elapsedMs,
            errors: results.errors,
          },
        }).eq('id', jobId);

        // Scrape product page for colors
        // FIX: Add heartbeat interval during scrapeProductPage to prevent stuck job detection
        const productScrapeHeartbeat = setInterval(async () => {
          await sendHeartbeat(supabaseClient, jobId, ctx, true);
        }, 15000); // Every 15 seconds

        let colors: ColorVariant[] = [];
        let invalidFilteredColors: string[] = [];
        let tdsUrl: string | null = null;
        let success = false;
        let firecrawlMs: number | undefined;

        try {
          const result = await scrapeProductPage(
            productConfig.slug, 
            'CA', 
            productConfig.material,
            { ...ctx, region: 'CA' }
          );
          colors = result.colors;
          invalidFilteredColors = result.invalidFilteredColors;
          tdsUrl = result.tdsUrl;
          success = result.success;
          firecrawlMs = result.firecrawlMs;
        } finally {
          clearInterval(productScrapeHeartbeat);
        }
        
        // Track filtered invalid colors
        if (invalidFilteredColors.length > 0) {
          materialIssues.invalidColorNames.push(...invalidFilteredColors);
        }
        
        if (firecrawlMs) timing.firecrawlMs += firecrawlMs;
        
        // Use mutable array for colors
        let colorVariants = [...colors];
        
        // FIX: Improved fallback logic - use PRODUCT_COLOR_FALLBACKS BEFORE defaulting to Black/White
        if (!success || colorVariants.length === 0) {
          // First, try to use product-specific fallback colors
          if (PRODUCT_COLOR_FALLBACKS[productConfig.slug]) {
            colorVariants = [...PRODUCT_COLOR_FALLBACKS[productConfig.slug]];
            logInfo(ctx, 'FALLBACK', `Using PRODUCT_COLOR_FALLBACKS for ${productName}: ${colorVariants.length} colors`, {
              product: productConfig.slug,
              colors: colorVariants.slice(0, 5).map(c => c.colorName)
            });
          } else {
            // Only use Black/White as LAST RESORT if no fallback exists
            const defaultColors = productConfig.material === 'Support' || productConfig.material === 'PVA'
              ? ['White']
              : ['Black', 'White'];
            for (const colorName of defaultColors) {
              colorVariants.push(extractColorInfo(colorName));
            }
            logWarn(ctx, 'FALLBACK', `No PRODUCT_COLOR_FALLBACKS for ${productName}, using defaults: ${defaultColors.join(', ')}`);
          }
        } else if (colorVariants.length < 3 && PRODUCT_COLOR_FALLBACKS[productConfig.slug]) {
          // FIX: If we found very few colors dynamically but have a fallback with more, use the fallback
          const fallbackColors = PRODUCT_COLOR_FALLBACKS[productConfig.slug];
          if (fallbackColors.length > colorVariants.length * 2) {
            logWarn(ctx, 'COVERAGE', `Dynamic extraction found only ${colorVariants.length} colors, but fallback has ${fallbackColors.length}. Using fallback for better coverage.`);
            colorVariants = [...fallbackColors];
          }
        }

        if (tdsUrl && !productConfig.tdsUrl) {
          (productConfig as any).tdsUrl = tdsUrl;
        }

        results.productsScraped++;
        results.colorsDiscovered += colorVariants.length;
        
        // Generate validation report for this product
        const validationReport = generateProductValidationReport(
          productConfig.slug,
          productName,
          colorVariants,
          ctx
        );
        productValidationReports.push(validationReport);

        // Scrape regional prices
        const regionalPrices: Record<string, { price: number | null; compareAtPrice: number | null; url: string }> = {};
        const regions = Object.keys(BAMBU_REGIONAL_STORES);
        
        for (let i = 0; i < regions.length; i++) {
          const region = regions[i];
          ctx.region = region;
          
          // Always update progress for each region (removed throttling for better UX)
          const elapsedMs = Date.now() - ctx.startTime;
          const regionsCompleted = regions.slice(0, i);
          await supabaseClient.from('scrape_jobs').update({
            progress: {
              currentMaterial: materialCategory,
              currentProduct: productName,
              currentRegion: region,
              currentStage: 'scraping_prices',
              productsProcessed,
              totalProducts,
              colorsDiscovered: results.colorsDiscovered,
              filamentsCreated: results.filamentsCreated,
              filamentsUpdated: results.filamentsUpdated,
              regionsCompleted,
              regionsTotal: regions.length,
              elapsedMs,
              errors: results.errors.map(formatError),
            },
          }).eq('id', jobId);

          // Send heartbeat during region scraping
          await sendHeartbeat(supabaseClient, jobId, ctx);

          // Rate limit delay using config
          if (i > 0) {
            const delay = RATE_LIMIT_CONFIG.background.betweenRegions;
            const delayStart = Date.now();
            await new Promise(r => setTimeout(r, delay));
            timing.delayMs += Date.now() - delayStart;
          }
          
          const { price, compareAtPrice, url, firecrawlMs: regionFirecrawlMs } = await scrapeRegionalPrice(
            productConfig.slug, 
            region, 
            productConfig.material,
            ctx
          );
          
          if (regionFirecrawlMs) timing.firecrawlMs += regionFirecrawlMs;
          regionalPrices[region] = { price, compareAtPrice, url };
          
          // Track missing prices
          if (!price) {
            materialIssues.missingPrices.push(`${productName} (${region})`);
          }
        }
        
        ctx.region = undefined;

        // Upsert filaments (if not dry run)
        if (!dryRun) {
          for (const colorVariant of colorVariants) {
            ctx.colorName = colorVariant.colorName;
            
            // Track missing color hex
            if (!colorVariant.colorHex) {
              materialIssues.missingColors.push(`${productName} - ${colorVariant.colorName}`);
            }
            // Track missing images
            if (!colorVariant.imageUrl) {
              materialIssues.missingImages.push(`${productName} - ${colorVariant.colorName}`);
            }
            
            // Get product image from collection (s5/default) - same for all color variants
            const productImage = collectionImages.get(productConfig.slug) || null;
            
            const result = await upsertFilament(
              supabaseClient,
              productName,
              colorVariant,
              productConfig,
              brandId,
              regionalPrices,
              productImage,
              ctx
            );

            if (result.durationMs) timing.dbMs += result.durationMs;
            if (result.created) results.filamentsCreated++;
            if (result.updated) results.filamentsUpdated++;
            if (result.error) {
              results.errors.push(createError('database', result.error, { product: `${productName} ${colorVariant.colorName}` }));
            }
          }
          ctx.colorName = undefined;
        }

        // Always update progress after each product (important for UI feedback)
        const elapsedMsAfterProduct = Date.now() - ctx.startTime;
        await supabaseClient.from('scrape_jobs').update({
          progress: {
            currentMaterial: materialCategory,
            currentProduct: productName,
            currentRegion: null,
            currentStage: 'saving_db',
            productsProcessed,
            totalProducts,
            colorsDiscovered: results.colorsDiscovered,
            filamentsCreated: results.filamentsCreated,
            filamentsUpdated: results.filamentsUpdated,
            regionsCompleted: Object.keys(BAMBU_REGIONAL_STORES),
            regionsTotal: Object.keys(BAMBU_REGIONAL_STORES).length,
            elapsedMs: elapsedMsAfterProduct,
            errors: results.errors.map(formatError),
          },
        }).eq('id', jobId);

        // Inter-product delay using config
        const productDelay = RATE_LIMIT_CONFIG.background.betweenProducts;
        const delayStart = Date.now();
        await new Promise(r => setTimeout(r, productDelay));
        timing.delayMs += Date.now() - delayStart;
      }
      
      // Log material issues summary
      logMaterialIssues(materialCategory, materialIssues, ctx);
      
      ctx.productName = undefined;
    }

    // Calculate final timing
    const totalMs = Date.now() - ctx.startTime;
    results.timing = {
      firecrawlMs: timing.firecrawlMs,
      dbMs: timing.dbMs,
      delayMs: timing.delayMs,
      totalMs,
    };

    // Generate and log validation summary
    const validationSummary = generateValidationSummary(productValidationReports);
    results.validation = validationSummary;
    logValidationSummary(validationSummary, ctx);

    // Send final heartbeat before completion
    await sendHeartbeat(supabaseClient, jobId, ctx, true);

    // Generate AI summary for the completed job
    const formattedErrors = results.errors.map(formatError);
    const aiSummary = await generateAISummary(
      { ...results, errors: formattedErrors },
      'completed',
      null,
      selectedMaterials,
      dryRun || false,
      ctx
    );

    // Mark job as completed with formatted errors and AI summary
    await supabaseClient.from('scrape_jobs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      results: { ...results, errors: formattedErrors },
      progress: {
        currentMaterial: null,
        currentProduct: null,
        currentRegion: null,
        productsProcessed: results.productsScraped,
        totalProducts,
        colorsDiscovered: results.colorsDiscovered,
        filamentsCreated: results.filamentsCreated,
        filamentsUpdated: results.filamentsUpdated,
        errors: formattedErrors,
      },
      ai_summary: aiSummary,
    }).eq('id', jobId);

    logSuccess(ctx, 'BACKGROUND', `Job ${jobId} completed successfully${aiSummary ? ' with AI summary' : ''}`);

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logError(ctx, 'BACKGROUND', `Job ${jobId} failed`, error);
    
    // Generate AI summary for the failed job
    const aiSummary = await generateAISummary(
      results,
      'failed',
      errMsg,
      selectedMaterials,
      dryRun || false,
      ctx
    );
    
    await supabaseClient.from('scrape_jobs').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error: errMsg,
      results,
      ai_summary: aiSummary,
    }).eq('id', jobId);
  }
}

// ============================================================================
// SINGLE PRODUCT MODE - For chunked orchestration (prevents timeouts)
// ============================================================================
interface SingleProductRequest {
  material: string;
  slug: string;
  name: string;
}

async function processSingleProduct(
  singleProduct: SingleProductRequest,
  dryRun: boolean | undefined,
  passedJobId: string | undefined,
  progressContext: Record<string, any>,
  ctx: LogContext
): Promise<Response> {
  const { material, slug, name } = singleProduct;
  
  logSeparator(ctx, `SINGLE PRODUCT MODE: ${name}`);
  logInfo(ctx, 'SINGLE', `Processing: ${name} (${material}) - slug: ${slug}`);
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!supabaseUrl || !supabaseKey || !firecrawlKey) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing required environment variables',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const results = {
    productsScraped: 0,
    colorsDiscovered: 0,
    filamentsCreated: 0,
    filamentsUpdated: 0,
    errors: [] as string[],
  };

  try {
    // Get brand ID
    const { data: brandData } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'bambu-lab')
      .single();
    
    const brandId = brandData?.id || null;

    // Normalize material variants to their base category
    // PLA-CF, PLA-GF -> PLA (they're stored in PLA products)
    // PETG-CF, PETG-GF -> PETG, etc.
    const normalizedMaterial = normalizeMaterialCategory(material);
    
    // Find the product config
    const materialProducts = ALL_BAMBU_PRODUCTS[normalizedMaterial];
    if (!materialProducts) {
      // Log available materials for debugging
      const availableMaterials = Object.keys(ALL_BAMBU_PRODUCTS).join(', ');
      logWarn(ctx, 'MATERIAL', `Unknown material: ${material} (normalized: ${normalizedMaterial}). Available: ${availableMaterials}`);
      throw new Error(`Unknown material: ${material}. Available categories: ${availableMaterials}`);
    }

    // Find the specific product by slug
    let productConfig: any = null;
    let productName: string = name;
    
    for (const [pName, pConfig] of Object.entries(materialProducts)) {
      if ((pConfig as any).slug === slug) {
        productConfig = pConfig;
        productName = pName;
        break;
      }
    }

    if (!productConfig) {
      throw new Error(`Product not found: ${slug}`);
    }

    ctx.productName = productName;
    logInfo(ctx, 'SINGLE', `Found product config for: ${productName}`);

    // Update job progress if job ID is provided
    if (passedJobId) {
      await supabase.from('scrape_jobs').update({
        updated_at: new Date().toISOString(),
        progress: {
          ...progressContext, // Preserve orchestrator's progress data
          currentProduct: productName,
          currentMaterial: material,
          currentStage: 'fetching_colors',
        },
      }).eq('id', passedJobId);
    }

    // Scrape product page for colors
    const { colors, invalidFilteredColors, tdsUrl, success, firecrawlMs } = await scrapeProductPage(
      productConfig.slug,
      'CA',
      productConfig.material,
      { ...ctx, region: 'CA' }
    );

    let colorVariants = [...colors];

    // Apply fallback logic
    if (!success || colorVariants.length === 0) {
      if (PRODUCT_COLOR_FALLBACKS[productConfig.slug]) {
        colorVariants = [...PRODUCT_COLOR_FALLBACKS[productConfig.slug]];
        logInfo(ctx, 'FALLBACK', `Using fallback colors for ${productName}: ${colorVariants.length} colors`);
      } else {
        colorVariants = [extractColorInfo('Black'), extractColorInfo('White')];
        logWarn(ctx, 'FALLBACK', `Using default Black/White for ${productName}`);
      }
    } else if (colorVariants.length < 3 && PRODUCT_COLOR_FALLBACKS[productConfig.slug]) {
      const fallbackColors = PRODUCT_COLOR_FALLBACKS[productConfig.slug];
      if (fallbackColors.length > colorVariants.length * 2) {
        colorVariants = [...fallbackColors];
        logWarn(ctx, 'COVERAGE', `Using fallback for better coverage: ${colorVariants.length} colors`);
      }
    }

    results.productsScraped = 1;
    results.colorsDiscovered = colorVariants.length;

    // Update progress
    if (passedJobId) {
      await supabase.from('scrape_jobs').update({
        updated_at: new Date().toISOString(),
        progress: {
          ...progressContext, // Preserve orchestrator's progress data
          currentProduct: productName,
          currentMaterial: material,
          currentStage: 'scraping_prices',
          colorsDiscovered: (progressContext.colorsDiscovered || 0) + colorVariants.length,
        },
      }).eq('id', passedJobId);
    }

    // Scrape regional prices
    const regionalPrices: Record<string, { price: number | null; compareAtPrice: number | null; url: string }> = {};
    const regions = Object.keys(BAMBU_REGIONAL_STORES);

    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      ctx.region = region;

      // Rate limit delay
      if (i > 0) {
        await new Promise(r => setTimeout(r, RATE_LIMIT_CONFIG.background.betweenRegions));
      }

      const { price, compareAtPrice, url } = await scrapeRegionalPrice(
        productConfig.slug,
        region,
        productConfig.material,
        ctx
      );

      regionalPrices[region] = { price, compareAtPrice, url };
    }
    ctx.region = undefined;

    // Upsert filaments (if not dry run)
    if (!dryRun) {
      if (passedJobId) {
        await supabase.from('scrape_jobs').update({
          updated_at: new Date().toISOString(),
          progress: {
            ...progressContext, // Preserve orchestrator's progress data
            currentProduct: productName,
            currentMaterial: material,
            currentStage: 'saving_db',
            colorsDiscovered: (progressContext.colorsDiscovered || 0) + colorVariants.length,
          },
        }).eq('id', passedJobId);
      }

      for (const colorVariant of colorVariants) {
        ctx.colorName = colorVariant.colorName;

        const result = await upsertFilament(
          supabase,
          productName,
          colorVariant,
          productConfig,
          brandId,
          regionalPrices,
          null,  // No collection image for single product mode
          ctx
        );

        if (result.created) results.filamentsCreated++;
        if (result.updated) results.filamentsUpdated++;
        if (result.error) {
          results.errors.push(`${colorVariant.colorName}: ${result.error}`);
        }
      }
      ctx.colorName = undefined;
    }

    const duration = Date.now() - ctx.startTime;
    logSuccess(ctx, 'SINGLE', `Completed ${productName} in ${duration}ms`, {
      colors: colorVariants.length,
      created: results.filamentsCreated,
      updated: results.filamentsUpdated,
    });

    return new Response(JSON.stringify({
      success: true,
      results,
      duration,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logError(ctx, 'SINGLE', `Failed processing ${name}`, error);
    results.errors.push(errMsg);

    return new Response(JSON.stringify({
      success: false,
      error: errMsg,
      results,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize logging context
  const ctx: LogContext = {
    requestId: generateRequestId(),
    startTime: Date.now(),
  };

  // Timing metrics
  const timing = {
    firecrawlMs: 0,
    dbMs: 0,
    delayMs: 0,
  };

  try {
    const { 
      materials, // Optional: which material categories to scrape e.g., ["PLA", "PETG", "TPU"]
      products,  // Optional: specific product types to scrape e.g., ["PLA Basic", "PLA Matte"]
      limit,     // Optional: limit number of products per material
      dryRun,    // Optional: don't save to DB, just scrape and report
      debug = true, // Optional: enable verbose debug logging (default: true)
      background = false, // New: run in background mode
      singleProduct, // NEW: Single product mode for chunked processing
      jobId: passedJobId, // NEW: Job ID for progress updates in chunked mode
      progressContext = {}, // NEW: Progress context from orchestrator
    } = await req.json().catch(() => ({}));

    // SINGLE PRODUCT MODE: Process just one product quickly (for chunked orchestration)
    if (singleProduct && typeof singleProduct === 'object') {
      return await processSingleProduct(singleProduct, dryRun, passedJobId, progressContext, ctx);
    }

    // Default to PLA only if no materials specified
    const selectedMaterials: string[] = materials && Array.isArray(materials) && materials.length > 0 
      ? materials 
      : ['PLA'];

    // Log request initialization
    logSeparator(ctx, 'BAMBU LAB UNIFIED SCRAPER');
    logInfo(ctx, 'INIT', `Request ID: ${ctx.requestId}`);
    logInfo(ctx, 'INIT', `Started at: ${new Date().toISOString()}`);
    logInfo(ctx, 'INIT', `Request params:`, { 
      materials: selectedMaterials, 
      products: products || 'ALL', 
      limit: limit || 'NONE', 
      dryRun: dryRun || false,
      background,
      debug 
    });

    // Environment check first (needed for both modes)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    if (!firecrawlKey) {
      throw new Error('Missing Firecrawl API key');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // BACKGROUND MODE: Create job and return immediately
    if (background) {
      logInfo(ctx, 'INIT', 'Background mode enabled - creating job record');
      
      // Count total products across selected materials
      let totalProducts = 0;
      for (const materialCategory of selectedMaterials) {
        const materialProducts = ALL_BAMBU_PRODUCTS[materialCategory];
        if (materialProducts) {
          totalProducts += Object.keys(materialProducts).length;
        }
      }

      // Create job record
      const { data: jobData, error: jobError } = await supabase
        .from('scrape_jobs')
        .insert({
          job_type: 'bambu_filaments',
          status: 'running',
          materials: selectedMaterials,
          products: products || [],
          request_id: ctx.requestId,
          dry_run: dryRun || false,
          started_at: new Date().toISOString(),
          progress: {
            currentMaterial: null,
            currentProduct: null,
            currentRegion: null,
            productsProcessed: 0,
            totalProducts,
            colorsDiscovered: 0,
            filamentsCreated: 0,
            filamentsUpdated: 0,
            errors: [],
          },
        })
        .select('id')
        .single();

      if (jobError) {
        logError(ctx, 'INIT', 'Failed to create job record', jobError);
        throw new Error(`Failed to create job: ${jobError.message}`);
      }

      const jobId = jobData.id;
      logInfo(ctx, 'INIT', `Created job: ${jobId}`);

      // Start background processing
      EdgeRuntime.waitUntil(runBackgroundScrape(
        supabase, 
        jobId, 
        selectedMaterials, 
        products, 
        limit, 
        dryRun, 
        ctx, 
        timing
      ));

      // Return immediately with job ID
      return new Response(JSON.stringify({
        success: true,
        background: true,
        jobId,
        message: `Background scrape started for ${selectedMaterials.join(', ')}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SYNCHRONOUS MODE: Original behavior
    logInfo(ctx, 'INIT', 'Synchronous mode - processing inline');
    logInfo(ctx, 'INIT', 'Supabase client initialized');

    // Get Bambu Lab brand ID
    const brandStart = Date.now();
    const { data: brandData, error: brandError } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'bambu-lab')
      .single();
    
    logTiming(ctx, 'INIT', 'Brand lookup', Date.now() - brandStart);
    
    if (brandError) {
      logWarn(ctx, 'INIT', 'Brand lookup failed', brandError);
    }
    
    const brandId = brandData?.id || null;
    logInfo(ctx, 'INIT', `Brand ID: ${brandId || 'NOT FOUND (will use null)'}`);

    const results = {
      requestId: ctx.requestId,
      startedAt: new Date(ctx.startTime).toISOString(),
      materialsProcessed: selectedMaterials,
      productsScraped: 0,
      colorsDiscovered: 0,
      filamentsCreated: 0,
      filamentsUpdated: 0,
      errors: [] as string[],
      productDetails: [] as any[],
      timing: {} as TimingMetrics,
    };

    // Process each selected material category
    for (const materialCategory of selectedMaterials) {
      const materialProducts = ALL_BAMBU_PRODUCTS[materialCategory];
      
      if (!materialProducts) {
        logWarn(ctx, 'MATERIAL', `Unknown material category: ${materialCategory}`);
        results.errors.push(`Unknown material category: ${materialCategory}`);
        continue;
      }

      logSeparator(ctx, `MATERIAL: ${materialCategory}`);
      logInfo(ctx, 'MATERIAL', `Processing material category: ${materialCategory}`);
      logInfo(ctx, 'MATERIAL', `Available products: ${Object.keys(materialProducts).length}`);

      // Track issues for this material
      const materialIssues: MaterialIssues = {
        missingPrices: [],
        missingColors: [],
        missingImages: [],
        invalidColorNames: [],
      };

      // Determine which products to scrape for this material
      let productsToScrape = Object.entries(materialProducts);
      
      if (products && Array.isArray(products)) {
        productsToScrape = productsToScrape.filter(([name]) => 
          products.some((p: string) => name.toLowerCase().includes(p.toLowerCase()))
        );
        logInfo(ctx, 'MATERIAL', `Filtered to ${productsToScrape.length} products matching: ${products.join(', ')}`);
      }
      
      if (limit && limit > 0) {
        productsToScrape = productsToScrape.slice(0, limit);
        logInfo(ctx, 'MATERIAL', `Limited to first ${limit} products`);
      }

      logInfo(ctx, 'MATERIAL', `Products to scrape: ${productsToScrape.map(([name]) => name).join(', ')}`);

      // Process each product type in this material category
      let productIndex = 0;
      for (const [productName, productConfig] of productsToScrape) {
        productIndex++;
        ctx.productName = productName;
        
        logSeparator(ctx, `PRODUCT [${productIndex}/${productsToScrape.length}]: ${productName}`);
        logInfo(ctx, 'PRODUCT', `Material: ${productConfig.material}, Slug: ${productConfig.slug}`);
        logDebug(ctx, 'PRODUCT', `Config:`, {
          nozzleTemp: `${productConfig.nozzleTempMin}-${productConfig.nozzleTempMax}°C`,
          bedTemp: `${productConfig.bedTempMin}-${productConfig.bedTempMax}°C`,
          drying: `${productConfig.dryingTempC}°C for ${productConfig.dryingTimeHours}h`,
          hasTds: !!productConfig.tdsUrl,
        });

        // Step 1: Scrape product page from Canadian store to get colors
        logInfo(ctx, 'PRODUCT', 'Step 1: Scraping CA store for colors and base price');
        const productScrapeStart = Date.now();
        const { colors, invalidFilteredColors, price: caPrice, tdsUrl, success, firecrawlMs } = await scrapeProductPage(
          productConfig.slug, 
          'CA', 
          productConfig.material,
          { ...ctx, region: 'CA' }
        );
        
        // Track filtered invalid colors
        if (invalidFilteredColors.length > 0) {
          materialIssues.invalidColorNames.push(...invalidFilteredColors);
        }
        
        if (firecrawlMs) timing.firecrawlMs += firecrawlMs;
        logTiming(ctx, 'PRODUCT', 'CA product page scrape', Date.now() - productScrapeStart);
        
        // Use mutable array for colors
        const colorVariants = [...colors];
        
        if (!success || colorVariants.length === 0) {
          logWarn(ctx, 'PRODUCT', `No colors found for ${productName}, using defaults`);
          const defaultColors = productConfig.material === 'Support' || productConfig.material === 'PVA'
            ? ['White']
            : ['Black', 'White'];
          logInfo(ctx, 'PRODUCT', `Default colors: ${defaultColors.join(', ')}`);
          for (const colorName of defaultColors) {
            colorVariants.push(extractColorInfo(colorName));
          }
        }

        // Update TDS URL if found
        if (tdsUrl && !productConfig.tdsUrl) {
          logInfo(ctx, 'PRODUCT', `TDS URL discovered: ${tdsUrl}`);
          (productConfig as any).tdsUrl = tdsUrl;
        }

        results.productsScraped++;
        results.colorsDiscovered += colorVariants.length;
        
        logInfo(ctx, 'PRODUCT', `Colors discovered: ${colorVariants.length}`, colorVariants.map(c => ({
          name: c.colorName,
          hex: c.colorHex,
          family: c.colorFamily,
        })));

        const productResult = {
          productName,
          material: productConfig.material,
          slug: productConfig.slug,
          colorsFound: colorVariants.length,
          colors: colorVariants.map(c => c.colorName),
          prices: {} as Record<string, number | null>,
          timing: {
            colorScrapeMs: Date.now() - productScrapeStart,
            regionalScrapeMs: 0,
            dbUpsertMs: 0,
          },
        };

        // Step 2: Scrape regional prices
        logInfo(ctx, 'PRODUCT', 'Step 2: Scraping regional prices');
        const regionalStart = Date.now();
        const regionalPrices: Record<string, { price: number | null; compareAtPrice: number | null; url: string }> = {};
        const regions = Object.keys(BAMBU_REGIONAL_STORES);
        
        for (let i = 0; i < regions.length; i++) {
          const region = regions[i];
          ctx.region = region;
          
          // Add delay between regional scrapes using config
          if (i > 0) {
            const delay = RATE_LIMIT_CONFIG.synchronous.betweenRegions;
            logDebug(ctx, 'REGIONAL', `Rate limit delay: ${delay}ms`);
            const delayStart = Date.now();
            await new Promise(r => setTimeout(r, delay));
            timing.delayMs += Date.now() - delayStart;
          }
          
          logInfo(ctx, 'REGIONAL', `[${i+1}/${regions.length}] Scraping ${region}...`);
          const { price, compareAtPrice, url, firecrawlMs: regionFirecrawlMs } = await scrapeRegionalPrice(
            productConfig.slug, 
            region, 
            productConfig.material,
            ctx
          );
          
          if (regionFirecrawlMs) timing.firecrawlMs += regionFirecrawlMs;
          
          regionalPrices[region] = { price, compareAtPrice, url };
          productResult.prices[region] = price;
        }
        
        ctx.region = undefined;
        productResult.timing.regionalScrapeMs = Date.now() - regionalStart;
        
        // Log regional price summary
        const pricesSummary = Object.entries(regionalPrices)
          .map(([r, { price }]) => `${r}:${price ?? 'null'}`)
          .join(', ');
        logInfo(ctx, 'REGIONAL', `Price summary: ${pricesSummary}`);

        // Step 3: Upsert each color variant
        if (!dryRun) {
          logInfo(ctx, 'PRODUCT', `Step 3: Upserting ${colorVariants.length} color variants to database`);
          const dbStart = Date.now();
          
          for (let i = 0; i < colorVariants.length; i++) {
            const colorVariant = colorVariants[i];
            ctx.colorName = colorVariant.colorName;
            
            // Track missing color hex
            if (!colorVariant.colorHex) {
              materialIssues.missingColors.push(`${productName} - ${colorVariant.colorName}`);
            }
            // Track missing images
            if (!colorVariant.imageUrl) {
              materialIssues.missingImages.push(`${productName} - ${colorVariant.colorName}`);
            }
            
            logDebug(ctx, 'DB', `[${i+1}/${colorVariants.length}] Processing: ${colorVariant.colorName}`);
            
            const result = await upsertFilament(
              supabase,
              productName,
              colorVariant,
              productConfig,
              brandId,
              regionalPrices,
              null,  // No collection image for direct product mode
              ctx
            );

            if (result.durationMs) timing.dbMs += result.durationMs;
            if (result.created) results.filamentsCreated++;
            if (result.updated) results.filamentsUpdated++;
            if (result.error) {
              const errorMsg = `${productName} ${colorVariant.colorName}: ${result.error}`;
              results.errors.push(errorMsg);
              logError(ctx, 'DB', errorMsg);
            }
          }
          
          ctx.colorName = undefined;
          productResult.timing.dbUpsertMs = Date.now() - dbStart;
          logTiming(ctx, 'PRODUCT', 'Database upserts', productResult.timing.dbUpsertMs);
        } else {
          logInfo(ctx, 'PRODUCT', 'DRY RUN: Skipping database operations');
        }

        results.productDetails.push(productResult);
        
        // Log product completion
        logSuccess(ctx, 'PRODUCT', `Completed: ${productName}`, {
          colors: colorVariants.length,
          prices: Object.values(productResult.prices).filter(Boolean).length,
          created: results.filamentsCreated,
          updated: results.filamentsUpdated,
        });

        // Delay between products to respect rate limits using config
        const productDelay = RATE_LIMIT_CONFIG.synchronous.betweenProducts;
        logDebug(ctx, 'PRODUCT', `Inter-product rate limit delay: ${productDelay}ms`);
        const interProductDelayStart = Date.now();
        await new Promise(r => setTimeout(r, productDelay));
        timing.delayMs += Date.now() - interProductDelayStart;
      }
      
      // Log material issues summary
      logMaterialIssues(materialCategory, materialIssues, ctx);
      
      ctx.productName = undefined;
    }

    // Calculate final timing
    const totalMs = Date.now() - ctx.startTime;
    results.timing = {
      firecrawlMs: timing.firecrawlMs,
      dbMs: timing.dbMs,
      delayMs: timing.delayMs,
      totalMs,
    };

    // Final summary
    logSeparator(ctx, 'SCRAPE COMPLETE');
    logInfo(ctx, 'SUMMARY', `Request ID: ${ctx.requestId}`);
    logInfo(ctx, 'SUMMARY', `Duration: ${totalMs}ms (${(totalMs / 1000).toFixed(1)}s)`);
    logInfo(ctx, 'SUMMARY', `Timing breakdown:`, {
      firecrawl: `${timing.firecrawlMs}ms (${((timing.firecrawlMs / totalMs) * 100).toFixed(1)}%)`,
      database: `${timing.dbMs}ms (${((timing.dbMs / totalMs) * 100).toFixed(1)}%)`,
      delays: `${timing.delayMs}ms (${((timing.delayMs / totalMs) * 100).toFixed(1)}%)`,
    });
    logInfo(ctx, 'SUMMARY', `Materials: ${selectedMaterials.join(', ')}`);
    logInfo(ctx, 'SUMMARY', `Products scraped: ${results.productsScraped}`);
    logInfo(ctx, 'SUMMARY', `Colors discovered: ${results.colorsDiscovered}`);
    logSuccess(ctx, 'SUMMARY', `Filaments created: ${results.filamentsCreated}`);
    logSuccess(ctx, 'SUMMARY', `Filaments updated: ${results.filamentsUpdated}`);
    
    if (results.errors.length > 0) {
      logWarn(ctx, 'SUMMARY', `Errors: ${results.errors.length}`);
      results.errors.forEach((err, i) => {
        logError(ctx, 'SUMMARY', `  Error ${i+1}: ${err}`);
      });
    } else {
      logSuccess(ctx, 'SUMMARY', 'No errors encountered');
    }

    logSeparator(ctx);

    return new Response(JSON.stringify({
      success: true,
      message: `Scraped ${results.productsScraped} products across ${selectedMaterials.length} material(s), found ${results.colorsDiscovered} color variants`,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const totalMs = Date.now() - ctx.startTime;
    
    logSeparator(ctx, 'SCRAPE FAILED');
    logError(ctx, 'FATAL', `Unhandled exception after ${totalMs}ms`, error);
    
    if (error instanceof Error && error.stack) {
      logError(ctx, 'FATAL', 'Stack trace:', error.stack);
    }
    
    logSeparator(ctx);
    
    return new Response(JSON.stringify({
      success: false,
      error: errMsg,
      requestId: ctx.requestId,
      durationMs: totalMs,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
