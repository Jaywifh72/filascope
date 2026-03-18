import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SyncProgress {
  total: number;
  processed: number;
  pricesUpdated: number;
  errors: number;
  currentBatch: string;
}

export interface RefreshOptions {
  marketplace?: string;
  brandSlug?: string;
  staleOnly?: boolean;
  staleDays?: number;
  batchSize?: number;
  dryRun?: boolean;
}

export interface DiscoveryOptions {
  brandSlug: string;
  marketplace: string;
  method?: 'search' | 'storefront' | 'legacy';
  limit?: number;
}

export interface DiscoveryCandidate {
  asin: string;
  title: string;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  url: string;
  confidence: number;
  confidenceLabel: string;
  matchReasons: string[];
}

export interface DiscoveryResult {
  filamentId: string;
  filamentName: string;
  filamentBrand: string;
  candidates: DiscoveryCandidate[];
}

export interface RefreshResult {
  runId: string;
  status: string;
  totalItems: number;
  processed: number;
  pricesUpdated: number;
  newMappings: number;
  errors: number;
  apiCallsUsed: number;
  durationMs: number;
}

export interface AmazonSearchResult {
  title: string;
  link: string;
  price?: string;
  thumbnail?: string;
}

export interface RegionSearchResults {
  region: string;
  results: AmazonSearchResult[];
  error?: string;
}

// Map marketplace codes to filaments table column names
const MARKETPLACE_LINK_COLUMNS: Record<string, string> = {
  US: 'amazon_link_us',
  UK: 'amazon_link_uk',
  DE: 'amazon_link_de',
  CA: 'amazon_link_ca',
  FR: 'amazon_link_fr',
  IT: 'amazon_link_it',
  ES: 'amazon_link_es',
  AU: 'amazon_link_au',
  JP: 'amazon_link_jp',
  NL: 'amazon_link_nl',
  BE: 'amazon_link_be',
};

const MARKETPLACE_DOMAINS: Record<string, string> = {
  US: 'amazon.com',
  UK: 'amazon.co.uk',
  DE: 'amazon.de',
  CA: 'amazon.ca',
  FR: 'amazon.fr',
  IT: 'amazon.it',
  ES: 'amazon.es',
  AU: 'amazon.com.au',
  JP: 'amazon.co.jp',
  NL: 'amazon.nl',
  BE: 'amazon.com.be',
};

/**
 * Extract ASIN from an Amazon URL.
 * Handles formats like:
 *   https://www.amazon.com/dp/B07PGYHYV8
 *   https://www.amazon.com/gp/product/B07PGYHYV8
 *   https://www.amazon.com/Some-Product-Title/dp/B07PGYHYV8/ref=...
 *   https://amzn.to/shortcode (can't extract ASIN from short URLs)
 */
function extractAsinFromUrl(url: string): string | null {
  if (!url) return null;
  // Match /dp/ASIN or /gp/product/ASIN
  const match = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

export function useAmazonSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshProgress, setRefreshProgress] = useState<SyncProgress | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [searchingFilaments, setSearchingFilaments] = useState<Set<string>>(new Set());

  /**
   * Import existing Amazon links from the filaments table into amazon_product_mappings.
   * This is the client-side "refresh" that creates mappings from legacy data.
   */
  const refreshPrices = useCallback(async (options: RefreshOptions): Promise<RefreshResult | null> => {
    setIsRefreshing(true);
    const startTime = Date.now();
    setRefreshProgress({ total: 0, processed: 0, pricesUpdated: 0, errors: 0, currentBatch: 'Fetching filaments with Amazon links...' });

    try {
      // Determine which marketplace columns to scan
      const marketplaces = options.marketplace
        ? [options.marketplace]
        : Object.keys(MARKETPLACE_LINK_COLUMNS);

      // Build select columns
      const linkColumns = marketplaces
        .map(mp => MARKETPLACE_LINK_COLUMNS[mp])
        .filter(Boolean);

      const selectCols = ['id', 'product_title', 'vendor', ...linkColumns].join(',');

      // Fetch filaments that have Amazon links
      let query = supabase
        .from('filaments')
        .select(selectCols)
        .limit(500);

      // If brand specified, filter by vendor
      if (options.brandSlug) {
        query = query.ilike('vendor', `%${options.brandSlug}%`);
      }

      // At least one Amazon link must be non-null
      const orFilters = linkColumns.map(col => `${col}.not.is.null`).join(',');
      if (orFilters) {
        query = query.or(orFilters);
      }

      const { data: filaments, error: fetchError } = await query as { data: any[] | null; error: any };
      if (fetchError) throw fetchError;

      if (!filaments || filaments.length === 0) {
        toast({
          title: 'No Amazon Links Found',
          description: 'No filaments have Amazon links to import.',
        });
        setRefreshProgress(null);
        return null;
      }

      setRefreshProgress({
        total: filaments.length,
        processed: 0,
        pricesUpdated: 0,
        errors: 0,
        currentBatch: `Processing ${filaments.length} filaments...`,
      });

      // Extract ASINs and build mappings
      const mappings: Array<{
        filament_id: string;
        asin: string;
        marketplace: string;
        amazon_title: string | null;
        match_confidence: string;
        match_source: string;
        spool_count: number;
      }> = [];

      let processedCount = 0;
      let errorCount = 0;

      for (const filament of filaments) {
        for (const mp of marketplaces) {
          const col = MARKETPLACE_LINK_COLUMNS[mp];
          const url = (filament as any)[col];
          if (!url) continue;

          const asin = extractAsinFromUrl(url);
          if (!asin) {
            errorCount++;
            continue;
          }

          mappings.push({
            filament_id: filament.id,
            asin,
            marketplace: mp,
            amazon_title: filament.product_title || null,
            match_confidence: 'auto_high',
            match_source: 'legacy_import',
            spool_count: 1,
          });
        }

        processedCount++;
        if (processedCount % 50 === 0) {
          setRefreshProgress({
            total: filaments.length,
            processed: processedCount,
            pricesUpdated: mappings.length,
            errors: errorCount,
            currentBatch: `Processed ${processedCount}/${filaments.length}...`,
          });
        }
      }

      if (mappings.length === 0) {
        toast({
          title: 'No ASINs Extracted',
          description: `Processed ${filaments.length} filaments but could not extract any valid ASINs from the URLs.`,
        });
        setRefreshProgress(null);
        return null;
      }

      // Upsert in batches of 50
      setRefreshProgress({
        total: mappings.length,
        processed: 0,
        pricesUpdated: 0,
        errors: errorCount,
        currentBatch: `Importing ${mappings.length} mappings...`,
      });

      let imported = 0;
      const batchSize = 50;
      for (let i = 0; i < mappings.length; i += batchSize) {
        const batch = mappings.slice(i, i + batchSize);
        const { error: upsertError } = await supabase
          .from('amazon_product_mappings')
          .upsert(batch, { onConflict: 'asin,marketplace', ignoreDuplicates: true })
          .select('id');

        if (upsertError) {
          errorCount++;
          console.error('Upsert batch error:', upsertError);
        } else {
          imported += batch.length;
        }

        setRefreshProgress({
          total: mappings.length,
          processed: Math.min(i + batchSize, mappings.length),
          pricesUpdated: imported,
          errors: errorCount,
          currentBatch: `Imported ${imported}/${mappings.length}...`,
        });
      }

      // Log the sync run
      const durationMs = Date.now() - startTime;
      await supabase.from('amazon_sync_runs').insert({
        run_type: 'legacy_import',
        status: errorCount > 0 ? 'partial' : 'completed',
        marketplace: options.marketplace || null,
        brand_slug: options.brandSlug || null,
        total_items: filaments.length,
        processed: processedCount,
        prices_updated: imported,
        new_mappings: imported,
        errors: errorCount,
        skipped: 0,
        api_calls_used: 0,
        duration_ms: durationMs,
        triggered_by: 'admin_ui',
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
      });

      setRefreshProgress({
        total: mappings.length,
        processed: mappings.length,
        pricesUpdated: imported,
        errors: errorCount,
        currentBatch: 'Complete',
      });

      toast({
        title: 'Amazon Import Complete',
        description: `Imported ${imported} ASIN mappings from ${processedCount} filaments. ${errorCount} errors.`,
      });

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['amazon-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['amazon-mapping-stats'] });
      queryClient.invalidateQueries({ queryKey: ['amazon-sync-runs'] });
      queryClient.invalidateQueries({ queryKey: ['amazon-brand-coverage'] });
      queryClient.invalidateQueries({ queryKey: ['filament-listings'] });

      return {
        runId: '',
        status: errorCount > 0 ? 'partial' : 'completed',
        totalItems: filaments.length,
        processed: processedCount,
        pricesUpdated: imported,
        newMappings: imported,
        errors: errorCount,
        apiCallsUsed: 0,
        durationMs,
      };
    } catch (err: any) {
      toast({
        title: 'Amazon Import Failed',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, toast]);

  /**
   * Discover Amazon product links from the filaments table.
   * Returns ALL filaments for a brand — those with existing Amazon links as auto-matched,
   * and those without as unmapped entries ready for manual URL input.
   */
  const discoverProducts = useCallback(async (options: DiscoveryOptions): Promise<DiscoveryResult[]> => {
    setIsDiscovering(true);

    try {
      const mp = options.marketplace;
      const linkCol = MARKETPLACE_LINK_COLUMNS[mp];
      if (!linkCol) {
        toast({
          title: 'Invalid Marketplace',
          description: `Marketplace "${mp}" is not supported.`,
          variant: 'destructive',
        });
        return [];
      }

      // Query ALL filaments for this brand (not just those with links)
      const { data: filaments, error } = await supabase
        .from('filaments')
        .select(`id, product_title, vendor, featured_image, variant_price, material, color_family, ${linkCol}`)
        .ilike('vendor', `%${options.brandSlug}%`)
        .order('product_title')
        .limit(options.limit || 1000) as { data: any[] | null; error: any };

      if (error) throw error;

      if (!filaments || filaments.length === 0) {
        toast({
          title: 'No Filaments Found',
          description: `No filaments found for "${options.brandSlug}" in the database.`,
        });
        return [];
      }

      // Collect ASINs from filaments that have links
      const allAsins: string[] = [];
      for (const f of filaments) {
        const url = (f as any)[linkCol];
        if (!url) continue;
        const asin = extractAsinFromUrl(url);
        if (asin) allAsins.push(asin);
      }

      // Check existing mappings for filaments that have ASINs
      let existingMappedSet = new Set<string>();
      if (allAsins.length > 0) {
        const { data: existingMappings } = await supabase
          .from('amazon_product_mappings')
          .select('asin, filament_id')
          .in('asin', allAsins)
          .eq('marketplace', mp);

        existingMappedSet = new Set(
          (existingMappings || []).map((m: any) => `${m.asin}-${m.filament_id}`)
        );
      }

      // Also check if filaments are mapped by filament_id (even without amazon_link columns)
      const filamentIds = filaments.map(f => f.id);
      const { data: mappingsByFilament } = await supabase
        .from('amazon_product_mappings')
        .select('asin, filament_id, marketplace')
        .in('filament_id', filamentIds)
        .eq('marketplace', mp);

      const filamentMappingMap = new Map<string, { asin: string; marketplace: string }>();
      for (const m of (mappingsByFilament || [])) {
        filamentMappingMap.set(m.filament_id, { asin: m.asin, marketplace: m.marketplace });
      }

      const domain = MARKETPLACE_DOMAINS[mp] || 'amazon.com';

      // Build discovery results for ALL filaments
      const results: DiscoveryResult[] = [];

      for (const filament of filaments) {
        const url = (filament as any)[linkCol];
        const asin = url ? extractAsinFromUrl(url) : null;
        const existingMapping = filamentMappingMap.get(filament.id);

        const candidates: DiscoveryCandidate[] = [];

        if (asin) {
          // Has an Amazon link in the database
          const alreadyMapped = existingMappedSet.has(`${asin}-${filament.id}`) || !!existingMapping;
          candidates.push({
            asin,
            title: filament.product_title || 'Unknown',
            price: filament.variant_price || null,
            currency: mp === 'US' ? 'USD' : mp === 'UK' ? 'GBP' : mp === 'CA' ? 'CAD' : mp === 'AU' ? 'AUD' : mp === 'JP' ? 'JPY' : 'EUR',
            imageUrl: filament.featured_image || null,
            rating: null,
            reviewCount: null,
            url: `https://www.${domain}/dp/${asin}`,
            confidence: alreadyMapped ? 100 : 90,
            confidenceLabel: alreadyMapped ? 'Already Mapped' : 'High',
            matchReasons: [
              'Existing Amazon link in database',
              ...(alreadyMapped ? ['Already mapped'] : []),
            ],
          });
        } else if (existingMapping) {
          // No amazon_link column but has an existing mapping
          candidates.push({
            asin: existingMapping.asin,
            title: filament.product_title || 'Unknown',
            price: filament.variant_price || null,
            currency: mp === 'US' ? 'USD' : mp === 'UK' ? 'GBP' : mp === 'CA' ? 'CAD' : mp === 'AU' ? 'AUD' : mp === 'JP' ? 'JPY' : 'EUR',
            imageUrl: filament.featured_image || null,
            rating: null,
            reviewCount: null,
            url: `https://www.${domain}/dp/${existingMapping.asin}`,
            confidence: 100,
            confidenceLabel: 'Already Mapped',
            matchReasons: ['Existing ASIN mapping'],
          });
        }
        // If no link and no mapping, candidates stays empty — shown as "unmapped"

        results.push({
          filamentId: filament.id,
          filamentName: filament.product_title || 'Unknown',
          filamentBrand: filament.vendor || options.brandSlug,
          candidates,
        });
      }

      const linked = results.filter(r => r.candidates.length > 0).length;
      const unmapped = results.filter(r => r.candidates.length === 0).length;
      toast({
        title: 'Discovery Complete',
        description: `Found ${results.length} filaments: ${linked} with Amazon links, ${unmapped} unmapped.`,
      });

      return results;
    } catch (err: any) {
      toast({
        title: 'Discovery Failed',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsDiscovering(false);
    }
  }, [toast]);

  /**
   * Search Amazon for a product across multiple regions using the find-amazon-products edge function.
   * Returns candidates per region with ASIN, title, price, and thumbnail.
   */
  const searchAmazon = useCallback(async (
    productName: string,
    countryCodes: string[],
    filamentId?: string,
  ): Promise<RegionSearchResults[]> => {
    if (filamentId) {
      setSearchingFilaments(prev => new Set(prev).add(filamentId));
    }

    try {
      // Get auth session for admin-only edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: 'Not Authenticated',
          description: 'You need to be logged in to search Amazon.',
          variant: 'destructive',
        });
        return [];
      }

      const { data, error } = await supabase.functions.invoke('find-amazon-products', {
        body: {
          product_name: productName,
          country_codes: countryCodes,
        },
      });

      if (error) throw error;

      return (data?.results || []) as RegionSearchResults[];
    } catch (err: any) {
      console.error('Amazon search failed:', err);
      // Don't show toast here — the caller handles fallback UI
      return [];
    } finally {
      if (filamentId) {
        setSearchingFilaments(prev => {
          const next = new Set(prev);
          next.delete(filamentId);
          return next;
        });
      }
    }
  }, [toast]);

  const importDiscoveryResults = useMutation({
    mutationFn: async (selections: Array<{ filamentId: string; candidate: DiscoveryCandidate; marketplace: string }>) => {
      // Deduplicate by asin+marketplace (keep first occurrence)
      const seen = new Set<string>();
      const mappings = selections
        .map(s => ({
          filament_id: s.filamentId,
          asin: s.candidate.asin,
          marketplace: s.marketplace,
          amazon_title: s.candidate.title,
          match_confidence: s.candidate.confidenceLabel === 'High' ? 'auto_high' :
                            s.candidate.confidenceLabel === 'Medium' ? 'auto_medium' : 'auto_low',
          match_source: 'legacy_import',
          spool_count: 1,
        }))
        .filter(m => {
          const key = `${m.asin}-${m.marketplace}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      if (mappings.length === 0) {
        return [];
      }

      // Upsert in batches of 50 to avoid payload limits
      const allResults: any[] = [];
      const batchSize = 50;
      for (let i = 0; i < mappings.length; i += batchSize) {
        const batch = mappings.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('amazon_product_mappings')
          .upsert(batch, { onConflict: 'asin,marketplace' })
          .select();

        if (error) throw error;
        if (data) allResults.push(...data);
      }

      return allResults;
    },
    onSuccess: (data) => {
      toast({
        title: 'Mappings Imported',
        description: `${data?.length || 0} Amazon product mappings created.`,
      });
      queryClient.invalidateQueries({ queryKey: ['amazon-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['amazon-mapping-stats'] });
      queryClient.invalidateQueries({ queryKey: ['amazon-brand-coverage'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Import Failed',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  return {
    // Price refresh / legacy import
    refreshPrices,
    isRefreshing,
    refreshProgress,

    // Discovery
    discoverProducts,
    isDiscovering,

    // Amazon search (via edge function)
    searchAmazon,
    searchingFilaments,

    // Import
    importDiscoveryResults: importDiscoveryResults.mutateAsync,
    isImporting: importDiscoveryResults.isPending,
  };
}
