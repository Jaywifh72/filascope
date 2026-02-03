import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  ScrapedProduct,
  ParsedFile,
  ImportResult,
  ImportProgress,
  ImportError,
  ValidationResult,
  VALID_CURRENCIES,
  VALID_REGIONS,
} from '@/types/priceImport';

// =============================================
// Constants
// =============================================

const BATCH_SIZE = 50;
const VALID_CURRENCY_SET = new Set(['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'JPY', 'CNY', 'CHF', 'SEK', 'KRW', 'INR', 'PLN', 'MXN', 'CZK']);
const VALID_REGION_SET = new Set(['US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN']);

// =============================================
// Validation Functions
// =============================================

function validateProduct(product: unknown): string | null {
  if (!product || typeof product !== 'object') {
    return 'Invalid product object';
  }

  const p = product as Record<string, unknown>;
  
  if (!p.brand || typeof p.brand !== 'string') {
    return 'Missing or invalid brand';
  }
  if (!p.region || typeof p.region !== 'string') {
    return 'Missing or invalid region';
  }
  if (!p.currency || typeof p.currency !== 'string') {
    return 'Missing or invalid currency';
  }
  if (!p.product_title || typeof p.product_title !== 'string') {
    return 'Missing or invalid product_title';
  }
  if (!p.full_title || typeof p.full_title !== 'string') {
    return 'Missing or invalid full_title';
  }
  if (typeof p.price !== 'number' || p.price < 0) {
    return 'Missing or invalid price';
  }
  if (typeof p.available !== 'boolean') {
    return 'Missing or invalid available status';
  }
  if (!p.product_url || typeof p.product_url !== 'string') {
    return 'Missing or invalid product_url';
  }
  if (!VALID_CURRENCY_SET.has(p.currency as string)) {
    return `Invalid currency: ${p.currency}`;
  }
  if (!VALID_REGION_SET.has(p.region as string)) {
    return `Invalid region: ${p.region}`;
  }

  return null;
}

function validateProducts(products: ScrapedProduct[]): ValidationResult {
  const errors: string[] = [];
  
  products.slice(0, 10).forEach((product, index) => {
    const error = validateProduct(product);
    if (error) {
      errors.push(`Row ${index + 1}: ${error}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =============================================
// File Parsing
// =============================================

async function parseFile(file: File): Promise<ParsedFile> {
  const result: ParsedFile = {
    filename: file.name,
    fileSize: file.size,
    products: [],
    brands: [],
    regions: [],
    currencies: [],
    isValid: false,
  };

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      result.parseError = 'JSON must be an array of products';
      return result;
    }

    result.products = parsed as ScrapedProduct[];
    
    // Validate first few products
    const validation = validateProducts(result.products);
    if (!validation.isValid) {
      result.parseError = validation.errors.join('; ');
      return result;
    }

    // Extract unique values
    result.brands = [...new Set(result.products.map(p => p.brand))];
    result.regions = [...new Set(result.products.map(p => p.region))];
    result.currencies = [...new Set(result.products.map(p => p.currency))];
    result.isValid = true;

  } catch (e) {
    result.parseError = e instanceof Error ? e.message : 'Failed to parse JSON';
  }

  return result;
}

// =============================================
// Store Matching
// =============================================

async function findStore(brand: string, region: string): Promise<string | null> {
  // 1. Try exact match: brand-slug + region
  const brandSlug = brand.toLowerCase().replace(/\s+/g, '-');
  const exactSlug = `${brandSlug}-${region.toLowerCase()}`;
  
  const { data: exactMatch } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', exactSlug)
    .eq('is_active', true)
    .maybeSingle();
  
  if (exactMatch) return exactMatch.id;
  
  // 2. Try brand store without region suffix
  const { data: brandMatch } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', brandSlug)
    .eq('region', region)
    .eq('is_active', true)
    .maybeSingle();
  
  if (brandMatch) return brandMatch.id;
  
  // 3. Try region's Amazon store as fallback
  const amazonSlug = `amazon-${region.toLowerCase()}`;
  const { data: amazonMatch } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', amazonSlug)
    .eq('is_active', true)
    .maybeSingle();
  
  return amazonMatch?.id || null;
}

// =============================================
// Filament Matching
// =============================================

async function matchFilament(
  brand: string, 
  title: string, 
  sku?: string
): Promise<string | null> {
  // 1. Try SKU match first (most reliable)
  if (sku) {
    const { data: skuMatch } = await supabase
      .from('filaments')
      .select('id')
      .or(`variant_sku.eq.${sku},mpn.eq.${sku}`)
      .maybeSingle();
    
    if (skuMatch) return skuMatch.id;
  }
  
  // 2. Try vendor + title match
  // Use first 30 chars of title for fuzzy matching
  const searchTitle = title.substring(0, 30).replace(/[%_]/g, '');
  const { data: titleMatch } = await supabase
    .from('filaments')
    .select('id')
    .eq('vendor', brand)
    .ilike('product_title', `%${searchTitle}%`)
    .limit(1)
    .maybeSingle();
  
  return titleMatch?.id || null;
}

// =============================================
// Import Logic
// =============================================

interface ImportOptions {
  dryRun: boolean;
  onProgress?: (progress: ImportProgress) => void;
}

async function importPrices(
  products: ScrapedProduct[],
  filename: string,
  options: ImportOptions
): Promise<ImportResult> {
  const { dryRun, onProgress } = options;
  
  const result: ImportResult = {
    total: products.length,
    created: 0,
    updated: 0,
    matched: 0,
    skipped: 0,
    errors: [],
  };

  // Cache store lookups
  const storeCache = new Map<string, string | null>();
  
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    
    // Update progress
    onProgress?.({
      current: i,
      total: products.length,
      status: 'processing',
      message: `Processing ${i + 1} to ${Math.min(i + BATCH_SIZE, products.length)}...`,
    });

    // Process batch in parallel
    await Promise.all(batch.map(async (product) => {
      try {
        // Find store (with caching)
        const storeCacheKey = `${product.brand}:${product.region}`;
        let storeId = storeCache.get(storeCacheKey);
        
        if (storeId === undefined) {
          storeId = await findStore(product.brand, product.region);
          storeCache.set(storeCacheKey, storeId);
        }

        if (!storeId) {
          result.errors.push({
            product: product.full_title,
            reason: `Store not found for ${product.brand} in ${product.region}`,
          });
          return;
        }

        // Match filament
        const filamentId = await matchFilament(
          product.brand,
          product.product_title,
          product.sku
        );

        if (!filamentId) {
          result.skipped++;
          return;
        }

        result.matched++;

        // Skip actual database write in dry run
        if (dryRun) {
          result.updated++; // Count as would-be-updated for dry run
          return;
        }

        // Check if price exists
        const { data: existing } = await supabase
          .from('filament_prices')
          .select('id')
          .eq('filament_id', filamentId)
          .eq('store_id', storeId)
          .maybeSingle();

        // Upsert to filament_prices
        const priceData = {
          filament_id: filamentId,
          store_id: storeId,
          price_cents: Math.round(product.price * 100),
          currency_code: product.currency,
          product_url: product.product_url,
          in_stock: product.available,
          last_verified_at: product.scraped_at || new Date().toISOString(),
        };

        if (existing) {
          const { error } = await supabase
            .from('filament_prices')
            .update(priceData)
            .eq('id', existing.id);
          
          if (error) throw error;
          result.updated++;
        } else {
          const { error } = await supabase
            .from('filament_prices')
            .insert(priceData);
          
          if (error) throw error;
          result.created++;
        }

      } catch (error) {
        result.errors.push({
          product: product.full_title,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }));
  }

  // Log import to sync_logs (skip for dry run)
  if (!dryRun) {
    const logEntry = {
      brand_slug: 'price-import',
      sync_type: 'price_import',
      status: result.errors.length > 0 ? 'partial' : 'completed',
      products_updated: result.updated + result.created,
      products_failed: result.errors.length,
      success_details: {
        filename,
        brands: [...new Set(products.map(p => p.brand))],
        regions: [...new Set(products.map(p => p.region))],
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
      },
      error_details: result.errors.length > 0 ? {
        errors: result.errors.slice(0, 50),
      } : null,
    };
    await supabase.from('brand_sync_logs').insert(logEntry as any);
  }

  onProgress?.({
    current: products.length,
    total: products.length,
    status: 'completed',
    message: dryRun ? 'Dry run completed' : 'Import completed',
  });

  return result;
}

// =============================================
// Hook
// =============================================

export function usePriceImport() {
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    status: 'idle',
  });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    setResult(null);
    setProgress({ current: 0, total: 0, status: 'idle' });
    
    const parsed = await parseFile(file);
    setParsedFile(parsed);

    if (!parsed.isValid) {
      toast.error('Invalid file format', {
        description: parsed.parseError,
      });
    } else {
      toast.success(`Loaded ${parsed.products.length} products`, {
        description: `${parsed.brands.length} brands, ${parsed.regions.length} regions`,
      });
    }
  }, []);

  const runImport = useCallback(async (dryRun: boolean) => {
    if (!parsedFile?.isValid) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const importResult = await importPrices(
        parsedFile.products,
        parsedFile.filename,
        {
          dryRun,
          onProgress: setProgress,
        }
      );

      setResult(importResult);

      if (dryRun) {
        toast.info('Dry run completed', {
          description: `Would update ${importResult.updated} prices, skip ${importResult.skipped}`,
        });
      } else {
        toast.success('Import completed', {
          description: `Created ${importResult.created}, updated ${importResult.updated}, skipped ${importResult.skipped}`,
        });
      }

    } catch (error) {
      toast.error('Import failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      setProgress(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsProcessing(false);
    }
  }, [parsedFile]);

  const clearFile = useCallback(() => {
    setParsedFile(null);
    setResult(null);
    setProgress({ current: 0, total: 0, status: 'idle' });
  }, []);

  return {
    parsedFile,
    progress,
    result,
    isProcessing,
    handleFileSelect,
    runImport,
    clearFile,
  };
}
