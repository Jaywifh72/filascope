import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/csvExport';
import { invalidatePriceCache } from '@/hooks/useCurrentPrice';
import { getPriceEndpoint } from '@/utils/priceEndpointRouter';
import type { ProductType, ProductGroup, StoreRow, TestResult, SyncResult, DiagnosisResult } from '../types';
import { PRODUCT_TYPE_CONFIGS } from '../types';
import { REGION_URL_COLUMN_MAP, BRAND_REGIONAL_CONFIGS } from '../constants';

export function usePricingActions(
  productType: ProductType,
  productGroups: ProductGroup[],
  filtered: ProductGroup[],
) {
  const config = PRODUCT_TYPE_CONFIGS[productType];
  const queryClient = useQueryClient();

  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map());
  const [syncResults, setSyncResults] = useState<Map<string, SyncResult>>(new Map());
  const [bulkTesting, setBulkTesting] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; variants?: number } | null>(null);
  const [bulkSyncProgress, setBulkSyncProgress] = useState<{ done: number; total: number; variants?: number } | null>(null);
  const [isPopulatingUrls, setIsPopulatingUrls] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [searchResults, setSearchResults] = useState<Record<string, { loading: boolean; url?: string; confidence?: number; method?: string; query?: string; error?: boolean }>>({});
  const [bulkSearchProgress, setBulkSearchProgress] = useState<{ running: boolean; done: number; total: number; found: number } | null>(null);
  const [isClearingInactiveCache, setIsClearingInactiveCache] = useState(false);
  const [syncBatchCompleteCount, setSyncBatchCompleteCount] = useState(0);
  const abortRef = useRef(false);
  const abortSyncRef = useRef(false);
  const diagnoseRef = useRef<() => void>(() => {});

  // Store key maps
  const storeKeyMap = useMemo(() => {
    const map = new Map<string, { store: StoreRow; group: ProductGroup }>();
    for (const g of productGroups) {
      for (const s of g.stores) {
        map.set(s.storeKey, { store: s, group: g });
      }
    }
    return map;
  }, [productGroups]);

  const storeKeyByRepresentativeRegion = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of productGroups) {
      for (const s of g.stores) {
        map.set(`${s.representativeId}::${s.region}`, s.storeKey);
      }
    }
    return map;
  }, [productGroups]);

  // Load persisted diagnosis
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`filascope_last_diagnosis_${productType}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.result) setDiagnosisResult(parsed.result);
      }
    } catch { /* ignore */ }
  }, [productType]);

  // =============================================
  // Search Store
  // =============================================

  const handleSearchStore = useCallback(async (url: string, region: string) => {
    setSearchResults(prev => ({ ...prev, [url]: { loading: true } }));
    try {
      const { data, error } = await supabase.functions.invoke('smart-url-validator', {
        body: { action: 'diagnose', url, region },
      });
      if (error) throw error;
      const diag = data?.diagnosis;
      if (diag?.suggested_url) {
        setSearchResults(prev => ({
          ...prev,
          [url]: {
            loading: false,
            url: diag.suggested_url,
            confidence: diag.suggestion_confidence,
            method: diag.suggestion_source || 'unknown',
            query: diag.search_query,
          },
        }));
      } else {
        setSearchResults(prev => ({ ...prev, [url]: { loading: false, error: true } }));
      }
    } catch {
      setSearchResults(prev => ({ ...prev, [url]: { loading: false, error: true } }));
      toast.error('Search failed for ' + url.slice(0, 40));
    }
  }, []);

  const handleSearchAllBroken = useCallback(async (failureDetails: Array<{ product: string; region: string; url: string; error: string; statusCode?: number; latencyMs?: number; brand: string }>) => {
    if (!failureDetails?.length) return;
    setBulkSearchProgress({ running: true, done: 0, total: failureDetails.length, found: 0 });
    let found = 0;
    for (let i = 0; i < failureDetails.length; i++) {
      const f = failureDetails[i];
      setBulkSearchProgress(prev => prev ? { ...prev, done: i + 1 } : null);
      try {
        const { data, error } = await supabase.functions.invoke('smart-url-validator', {
          body: { action: 'diagnose', url: f.url, region: f.region },
        });
        if (!error && data?.diagnosis?.suggested_url) {
          found++;
          setSearchResults(prev => ({
            ...prev,
            [f.url]: {
              loading: false,
              url: data.diagnosis.suggested_url,
              confidence: data.diagnosis.suggestion_confidence,
              method: data.diagnosis.suggestion_source || 'unknown',
              query: data.diagnosis.search_query,
            },
          }));
        } else {
          setSearchResults(prev => ({ ...prev, [f.url]: { loading: false, error: true } }));
        }
      } catch {
        setSearchResults(prev => ({ ...prev, [f.url]: { loading: false, error: true } }));
      }
      if (i < failureDetails.length - 1) await new Promise(r => setTimeout(r, 1000));
    }
    setBulkSearchProgress({ running: false, done: failureDetails.length, total: failureDetails.length, found });
    toast.success(`Search complete: found fixes for ${found}/${failureDetails.length} products`);
  }, []);

  const handleApplyAllFixes = useCallback(async (failureDetails: Array<{ product: string; region: string; url: string; error: string; brand: string }>) => {
    if (!failureDetails) return;
    const fixes = failureDetails.filter(f => searchResults[f.url]?.url);
    if (!fixes.length) { toast.info('No fixes to apply'); return; }
    let applied = 0;
    for (const f of fixes) {
      const sr = searchResults[f.url];
      if (!sr?.url) continue;
      const col = REGION_URL_COLUMN_MAP[f.region?.toUpperCase()] || 'product_url';
      const { data: product } = await (supabase
        .from(config.tableName as any)
        .select('id') as any)
        .eq(col, f.url)
        .limit(1)
        .maybeSingle();
      if (product) {
        await supabase.from(config.tableName as any).update({ [col]: sr.url } as any).eq('id', product.id);
        applied++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ['admin-pricing-data', productType] });
    toast.success(`Applied ${applied}/${fixes.length} URL fixes`);
  }, [searchResults, queryClient, config.tableName, productType]);

  // =============================================
  // Link testing
  // =============================================

  const testSingleUrl = useCallback(async (storeKey: string, url: string, showToast = true, region?: string): Promise<TestResult> => {
    const startTime = Date.now();
    setTestResults(prev => new Map(prev).set(storeKey, { status: 'testing' }));

    const baseUrl = (url.includes('?sku=') || url.includes('?id='))
      ? url.replace(/#.*$/, '')
      : url.replace(/[?#].*$/, '');

    try {
      const { data, error } = await supabase.functions.invoke('test-url', { body: { url: baseUrl, region } });
      const latencyMs = Date.now() - startTime;
      if (error) throw error;

      let result: TestResult;
      const fetchMethod = data.fetchMethod as TestResult['fetchMethod'];
      const isGeoRedirected = !!data.isGeoRedirected;
      const isKnownGeoRedirect = !!data.isKnownGeoRedirect;
      if (data.ok) {
        result = { status: 'ok', statusCode: data.statusCode, latencyMs, fetchMethod, isGeoRedirected: data.isKnownGeoRedirect ? false : isGeoRedirected, isKnownGeoRedirect };
      } else if (data.isRedirect) {
        result = { status: 'redirect', statusCode: data.statusCode, latencyMs, redirectUrl: data.redirectLocation, fetchMethod, isGeoRedirected };
      } else {
        result = { status: 'broken', statusCode: data.statusCode, latencyMs, error: data.error, fetchMethod };
      }

      setTestResults(prev => new Map(prev).set(storeKey, result));

      const cacheStatus = result.status === 'ok' || result.status === 'geo_restricted' ? 'valid' : result.status === 'redirect' ? 'redirect' : 'invalid';
      await supabase.from('url_validation_cache').upsert({
        url: baseUrl,
        status: cacheStatus,
        status_code: result.statusCode ?? null,
        redirect_url: result.redirectUrl ?? null,
        last_checked: new Date().toISOString(),
        check_count: 1,
      }, { onConflict: 'url' });

      const entry = storeKeyMap.get(storeKey);
      if (entry && showToast) {
        const variantCount = entry.store.allProductIds.length;
        const methodNote = result.fetchMethod && result.fetchMethod !== 'direct' ? ` (${result.fetchMethod})` : '';
        if (result.status === 'ok' && result.isKnownGeoRedirect) toast.success(`✅ Link valid (geo-redirect expected) — ${latencyMs}ms${variantCount > 1 ? ` · covers ${variantCount} variants` : ''}`);
        else if (result.status === 'ok') toast.success(`✅ Link active (${result.statusCode}) — ${latencyMs}ms${methodNote}${variantCount > 1 ? ` · covers ${variantCount} variants` : ''}`);
        else if (result.status === 'geo_restricted') toast.warning(`🌐 Geo-restricted${methodNote}`);
        else if (result.status === 'redirect') toast.warning(`⚠️ Redirect (${result.statusCode})${result.isGeoRedirected ? ' — geo-redirect' : ''}`);
        else toast.error(`❌ Link broken (${result.statusCode || result.error})`);
      }
      return result;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = latencyMs >= 4900 || err?.name === 'AbortError';
      const result: TestResult = {
        status: isTimeout ? 'timeout' : 'broken',
        latencyMs,
        error: isTimeout ? 'Request timeout (5s)' : (err?.message || 'Unknown error'),
      };
      setTestResults(prev => new Map(prev).set(storeKey, result));

      const baseUrl2 = (url.includes('?sku=') || url.includes('?id=')) ? url.replace(/#.*$/, '') : url.replace(/[?#].*$/, '');
      await supabase.from('url_validation_cache').upsert({
        url: baseUrl2,
        status: 'invalid',
        status_code: null,
        redirect_url: null,
        last_checked: new Date().toISOString(),
        consecutive_failures: 1,
      }, { onConflict: 'url' });

      if (showToast) toast.error(`❌ ${isTimeout ? 'Timeout (5s)' : 'Network error'}`);
      return result;
    }
  }, [storeKeyMap]);

  const testBatch = useCallback(async (storesToTest: StoreRow[]) => {
    const seen = new Set<string>();
    const deduped: StoreRow[] = [];
    let totalVariants = 0;
    let skippedCount = 0;
    for (const s of storesToTest) {
      if (!s.productUrl) { skippedCount++; continue; }
      const dedupKey = `${s.productUrl}::${s.region}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      deduped.push(s);
      totalVariants += s.allProductIds.length;
    }

    if (skippedCount > 0) toast.warning(`${skippedCount} store${skippedCount > 1 ? 's' : ''} skipped (no URL available)`);
    if (deduped.length === 0) { toast.info('No testable URLs'); return; }

    setBulkTesting(true);
    setBulkProgress({ done: 0, total: deduped.length, variants: totalVariants });
    abortRef.current = false;
    const startTime = Date.now();
    let done = 0, ok = 0, broken = 0, warnings = 0;

    for (let i = 0; i < deduped.length; i += 3) {
      if (abortRef.current) break;
      const batch = deduped.slice(i, i + 3);
      const results = await Promise.all(batch.map(s => testSingleUrl(s.storeKey, s.productUrl!, false, s.region)));
      results.forEach(r => { done++; if (r.status === 'ok') ok++; else if (r.status === 'broken' || r.status === 'timeout') broken++; else warnings++; });
      setBulkProgress({ done, total: deduped.length, variants: totalVariants });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    setBulkTesting(false);
    setBulkProgress(null);
    toast.success(`Tested ${done} products in ${elapsed}s (covering ${totalVariants} variants) — ${ok} active, ${broken} broken, ${warnings} warnings`);

    if (broken > 0) {
      setTimeout(() => { diagnoseRef.current(); }, 500);
    }
  }, [testSingleUrl]);

  // =============================================
  // Price sync
  // =============================================

  const syncSinglePrice = useCallback(async (store: StoreRow, showToast = true): Promise<SyncResult> => {
    if (!store.productUrl) return { status: 'failed', error: 'No product URL' };
    if (store.linkStatus === 'broken') return { status: 'failed', error: 'Link is broken' };

    try {
      const urlObj = new URL(store.productUrl);
      const hasProductPath = urlObj.pathname.length > 1;
      const hasProductQuery = urlObj.search.length > 0;
      if (!hasProductPath && !hasProductQuery) {
        return { status: 'failed', error: 'No product_url_pattern configured and no existing product_url' };
      }
      const normalizedPath = urlObj.pathname.toLowerCase().replace(/\/+$/, '');
      const isTemplatePathWithoutSlug = normalizedPath === '/product' || normalizedPath === '/products';
      if (isTemplatePathWithoutSlug && !hasProductQuery) {
        return { status: 'failed', error: 'Incomplete product URL — slug/SKU substitution likely failed' };
      }
    } catch { /* proceed */ }

    const oldPrice = store.price;
    setSyncResults(prev => new Map(prev).set(store.storeKey, { status: 'syncing' }));

    try {
      // For printers, use the dedicated sync-printer-prices engine (JSON-LD based)
      // instead of get-current-price (Firecrawl/filament scraper)
      if (productType === 'printer') {
        const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-printer-prices', {
          body: { printer_id: store.representativeId },
        });

        if (syncError) {
          const errorMsg = syncData?.error || syncError.message || 'Printer sync failed';
          const result: SyncResult = { status: 'failed', error: errorMsg };
          setSyncResults(prev => new Map(prev).set(store.storeKey, result));
          if (showToast) toast.error(`✗ ${errorMsg}`);
          return result;
        }

        if (!syncData?.success) {
          const errorMsg = syncData?.error || 'Printer sync returned no data';
          const result: SyncResult = { status: 'failed', error: errorMsg };
          setSyncResults(prev => new Map(prev).set(store.storeKey, result));
          if (showToast) toast.error(`✗ ${errorMsg}`);
          return result;
        }

        // Extract all regional results returned by backend and mirror them into UI state
        const printerResult = syncData.results?.[0];

        // Handle manual_only / skipped / discontinued printers gracefully (not a failure)
        if (printerResult?.skipped) {
          const reason = printerResult.reason || 'skipped';
          const isDiscontinued = reason === 'discontinued';
          const mappedStatus: SyncResult['status'] = isDiscontinued ? 'discontinued' : 'unchanged';
          const errorMsg = isDiscontinued
            ? `Discontinued${printerResult.msrp ? ` (MSRP: $${printerResult.msrp})` : ''}`
            : reason === 'manual_only' ? 'Manual-only brand (prices managed manually)' : reason;
          const result: SyncResult = { status: mappedStatus, error: errorMsg };

          // Apply skip/discontinued status to all visible regional rows for this printer
          setSyncResults(prev => {
            const next = new Map(prev);
            let applied = false;
            for (const [key, entry] of storeKeyMap) {
              if (entry.store.representativeId === store.representativeId) {
                next.set(key, result);
                applied = true;
              }
            }
            if (!applied) next.set(store.storeKey, result);
            return next;
          });

          if (showToast && !isDiscontinued) toast.info(`ℹ️ ${errorMsg}`);
          return result;
        }

        const regionalPayload = (printerResult?.regions || {}) as Record<string, any>;
        const regionalUpdates = new Map<string, SyncResult>();
        let anySuccessfulRegion = false;

        for (const [regionCode, data] of Object.entries(regionalPayload)) {
          const targetStoreKey = storeKeyByRepresentativeRegion.get(`${store.representativeId}::${regionCode}`);
          if (!targetStoreKey) continue;

          const targetStore = storeKeyMap.get(targetStoreKey)?.store;
          if (!targetStore) continue;

          const targetOldPrice = targetStore.price;
          const targetNewPrice = typeof data?.newPrice === 'number' ? data.newPrice : null;

          if (targetNewPrice != null && targetNewPrice > 0) {
            const priceChanged = targetOldPrice != null && Math.abs(targetNewPrice - targetOldPrice) > 0.01;
            const pctChange = targetOldPrice && targetOldPrice > 0
              ? ((targetNewPrice - targetOldPrice) / targetOldPrice) * 100
              : 0;

            regionalUpdates.set(targetStoreKey, {
              status: priceChanged ? 'success' : 'unchanged',
              oldPrice: targetOldPrice ?? undefined,
              newPrice: targetNewPrice,
              percentChange: pctChange,
            });
            anySuccessfulRegion = true;
          } else {
            const status = data?.status || 'not_found';
            const errorMsg = data?.error || `No price found for ${regionCode}`;
            const isGeoBlocked = status === 'geo_blocked';
            const isSkipped = status === 'skipped';
            const isNotInRegion = status === 'not_in_region';
            const mappedStatus: SyncResult['status'] = (isGeoBlocked || isSkipped || isNotInRegion) ? 'not_in_region' : 'failed';

            regionalUpdates.set(targetStoreKey, {
              status: mappedStatus,
              error: isNotInRegion ? 'Not sold in this region' : errorMsg,
            });
          }
        }

        if (regionalUpdates.size > 0) {
          setSyncResults(prev => {
            const next = new Map(prev);
            regionalUpdates.forEach((value, key) => next.set(key, value));
            return next;
          });
        }

        const requestedRegionResult = regionalUpdates.get(store.storeKey);
        if (requestedRegionResult) {
          if (anySuccessfulRegion && store.productUrl) invalidatePriceCache(store.productUrl);

          if (showToast) {
            if (requestedRegionResult.status === 'unchanged' && requestedRegionResult.newPrice != null) {
              toast.success(`✓ Price confirmed: ${store.currencySymbol}${requestedRegionResult.newPrice.toFixed(2)}`);
            } else if (requestedRegionResult.status === 'success' && requestedRegionResult.newPrice != null) {
              const pct = requestedRegionResult.percentChange ?? 0;
              const oldVal = requestedRegionResult.oldPrice;
              if (pct > 0) {
                toast.warning(`⚠️ Price increased: ${store.currencySymbol}${oldVal?.toFixed(2)} → ${store.currencySymbol}${requestedRegionResult.newPrice.toFixed(2)} (+${pct.toFixed(1)}%)`);
              } else {
                toast.success(`✓ Price decreased: ${store.currencySymbol}${oldVal?.toFixed(2)} → ${store.currencySymbol}${requestedRegionResult.newPrice.toFixed(2)} (${pct.toFixed(1)}%)`);
              }
            } else if (requestedRegionResult.status === 'failed' && requestedRegionResult.error) {
              toast.error(`✗ ${requestedRegionResult.error}`);
            }
          }

          return requestedRegionResult;
        }

        // Fallback: keep previous behavior if backend omitted requested region from payload
        const fallbackRegionData = printerResult?.regions?.[store.region];
        const fallbackNewPrice = fallbackRegionData?.newPrice;
        if (fallbackNewPrice && fallbackNewPrice > 0) {
          const priceChanged = oldPrice != null && Math.abs(fallbackNewPrice - oldPrice) > 0.01;
          const pctChange = oldPrice && oldPrice > 0 ? ((fallbackNewPrice - oldPrice) / oldPrice) * 100 : 0;
          const result: SyncResult = {
            status: priceChanged ? 'success' : 'unchanged',
            oldPrice: oldPrice ?? undefined,
            newPrice: fallbackNewPrice,
            percentChange: pctChange,
          };
          setSyncResults(prev => new Map(prev).set(store.storeKey, result));
          if (showToast) {
            if (!priceChanged) toast.success(`✓ Price confirmed: ${store.currencySymbol}${fallbackNewPrice.toFixed(2)}`);
            else if (pctChange > 0) toast.warning(`⚠️ Price increased: ${store.currencySymbol}${oldPrice?.toFixed(2)} → ${store.currencySymbol}${fallbackNewPrice.toFixed(2)} (+${pctChange.toFixed(1)}%)`);
            else toast.success(`✓ Price decreased: ${store.currencySymbol}${oldPrice?.toFixed(2)} → ${store.currencySymbol}${fallbackNewPrice.toFixed(2)} (${pctChange.toFixed(1)}%)`);
          }
          return result;
        }

        const fallbackError = fallbackRegionData?.error || `No sync result returned for ${store.region}`;
        const fallbackResult: SyncResult = { status: 'failed', error: fallbackError };
        setSyncResults(prev => new Map(prev).set(store.storeKey, fallbackResult));
        if (showToast) toast.error(`✗ ${fallbackError}`);
        return fallbackResult;
      }

      const fnName = getPriceEndpoint(store.productUrl);
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: {
          productUrl: store.productUrl,
          currency: store.currency,
          forceRefresh: false,
          targetWeightGrams: store.netWeightG,
          filamentId: store.representativeId,
          productType,
        },
      });

      if (error) {
        const errorMsg = data?.error || error.message || 'Failed to fetch price';
        const result: SyncResult = { status: 'failed', error: errorMsg };
        setSyncResults(prev => new Map(prev).set(store.storeKey, result));
        if (showToast) toast.error(`✗ Failed to sync — ${errorMsg}`);
        if (store.productUrl) {
          try {
            await supabase.from('url_validation_cache').upsert({
              url: store.productUrl.replace(/\?.*$/, ''),
              status: 'sync_failed',
              last_checked: new Date().toISOString(),
              consecutive_failures: 1,
            }, { onConflict: 'url' });
          } catch {}
        }
        return result;
      }

      if (!data?.success || data.price == null) {
        if (data?.notAvailableInRegion) {
          const result: SyncResult = { status: 'unavailable', error: data.error || 'Product not available in this region' };
          setSyncResults(prev => new Map(prev).set(store.storeKey, result));
          if (showToast) toast.warning(`⚪ Not available in this region`);
          return result;
        }
        const errorMsg = data?.error || 'Invalid price data';
        const result: SyncResult = { status: 'failed', error: errorMsg };
        setSyncResults(prev => new Map(prev).set(store.storeKey, result));
        if (showToast) toast.error(`✗ ${errorMsg}`);
        if (store.productUrl) {
          try {
            await supabase.from('url_validation_cache').upsert({
              url: store.productUrl.replace(/\?.*$/, ''),
              status: 'sync_failed',
              last_checked: new Date().toISOString(),
              consecutive_failures: 1,
            }, { onConflict: 'url' });
          } catch {}
        }
        return result;
      }

      const { price, compareAtPrice, currency = store.currency } = data;

      // For filaments, use the RPC. For printers/accessories, do direct update + price_history insert.
      if (productType === 'filament') {
        const { error: rpcError } = await supabase.rpc('update_filament_price_after_refresh', {
          p_filament_id: store.representativeId,
          p_new_price: price,
          p_compare_at_price: compareAtPrice || null,
          p_currency: currency,
          p_source: 'manual',
        });
        if (rpcError) {
          const errorMsg = rpcError.message?.includes('Unauthorized') ? 'Admin access required' : `Save failed: ${rpcError.message || 'Unknown error'}`;
          const result: SyncResult = { status: 'failed', error: errorMsg };
          setSyncResults(prev => new Map(prev).set(store.storeKey, result));
          if (showToast) toast.error(`✗ ${errorMsg}`);
          return result;
        }

        // Fan out to all variants
        const regionFieldMap: Record<string, { priceField: string }> = {
          US: { priceField: 'variant_price' },
          CA: { priceField: 'price_cad' },
          UK: { priceField: 'price_gbp' },
          EU: { priceField: 'price_eur' },
          AU: { priceField: 'price_aud' },
          JP: { priceField: 'price_jpy' },
        };
        const regionMapping = regionFieldMap[store.region];
        if (regionMapping && store.allProductIds.length > 1) {
          const updatePayload: Record<string, any> = {
            [regionMapping.priceField]: price,
            last_scraped_at: new Date().toISOString(),
          };
          const otherIds = store.allProductIds.filter(id => id !== store.representativeId);
          if (otherIds.length > 0) {
            await supabase.from('filaments').update(updatePayload).in('id', otherIds);
          }
        }
      } else {
        // Direct update for accessories (printers use sync-printer-prices and return early above)
        const priceColumn = 'variant_price';

        const updatePayload: Record<string, any> = {
          [priceColumn]: price,
          updated_at: new Date().toISOString(),
        };
        // Only set compare_at_price for US/default price
        if (currency === 'USD' || priceColumn === 'variant_price') {
          updatePayload.variant_compare_at_price = compareAtPrice || null;
        }
        await supabase.from(config.tableName as any).update(updatePayload).eq('id', store.representativeId);

        // Insert price history
        const regionMap: Record<string, string> = { USD: 'US', CAD: 'CA', GBP: 'UK', EUR: 'EU', AUD: 'AU', JPY: 'JP' };
        const productIdField = 'accessory_id';
        await supabase.from('price_history').insert({
          [productIdField]: store.representativeId,
          price,
          compare_at_price: compareAtPrice || null,
          currency,
          source: 'admin_refresh',
          region: regionMap[currency] || 'US',
          product_type: productType,
          recorded_at: new Date().toISOString(),
        } as any);

        // Fan out to other variants — use the same regional price column
        if (store.allProductIds.length > 1) {
          const otherIds = store.allProductIds.filter(id => id !== store.representativeId);
          if (otherIds.length > 0) {
            await supabase.from(config.tableName as any).update({ [priceColumn]: price, updated_at: new Date().toISOString() } as any).in('id', otherIds);
          }
        }
      }

      invalidatePriceCache(store.productUrl);

      const priceChanged = oldPrice != null && Math.abs(price - oldPrice) > 0.01;
      const pctChange = oldPrice && oldPrice > 0 ? ((price - oldPrice) / oldPrice) * 100 : 0;

      const result: SyncResult = {
        status: priceChanged ? 'success' : 'unchanged',
        oldPrice: oldPrice ?? undefined,
        newPrice: price,
        percentChange: pctChange,
        source: data.source || undefined,
        location: data.location || undefined,
        currencyMismatch: data.currencyMismatch || false,
        detectedCurrency: data.detectedCurrency || undefined,
        requestedCurrency: data.requestedCurrency || undefined,
      };
      setSyncResults(prev => new Map(prev).set(store.storeKey, result));

      if (store.productUrl) {
        const baseUrl = store.productUrl.replace(/\?.*$/, '');
        await supabase.from('url_validation_cache').upsert({
          url: baseUrl,
          status: 'valid',
          status_code: 200,
          redirect_url: null,
          last_checked: new Date().toISOString(),
          consecutive_failures: 0,
        }, { onConflict: 'url' });
      }

      if (showToast) {
        const variantNote = store.allProductIds.length > 1 ? ` · updated ${store.allProductIds.length} variants` : '';
        if (!priceChanged) toast.success(`✓ Price confirmed: ${store.currencySymbol}${price.toFixed(2)}${variantNote}`);
        else if (pctChange > 0) toast.warning(`⚠️ Price increased: ${store.currencySymbol}${oldPrice?.toFixed(2)} → ${store.currencySymbol}${price.toFixed(2)} (+${pctChange.toFixed(1)}%)${variantNote}`);
        else toast.success(`✓ Price decreased: ${store.currencySymbol}${oldPrice?.toFixed(2)} → ${store.currencySymbol}${price.toFixed(2)} (${pctChange.toFixed(1)}%)${variantNote}`);
      }
      return result;
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : 'Unexpected error';
      const result: SyncResult = { status: 'failed', error: errorMsg };
      setSyncResults(prev => new Map(prev).set(store.storeKey, result));
      if (showToast) toast.error(`✗ ${errorMsg}`);
      return result;
    }
  }, [storeKeyMap, storeKeyByRepresentativeRegion, productType, config.tableName]);

  const syncBatch = useCallback(async (storesToSync: StoreRow[]) => {
    const seen = new Set<string>();
    const deduped: StoreRow[] = [];
    let totalVariants = 0;
    for (const s of storesToSync) {
      if (!s.productUrl || s.linkStatus === 'broken') continue;
      const dedupKey = `${s.productUrl}::${s.region}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      deduped.push(s);
      totalVariants += s.allProductIds.length;
    }

    if (deduped.length === 0) { toast.info('No syncable stores'); return; }

    setBulkSyncing(true);
    setBulkSyncProgress({ done: 0, total: deduped.length, variants: totalVariants });
    abortSyncRef.current = false;
    const startTime = Date.now();
    let done = 0, updated = 0, unchanged = 0, failed = 0, priceUp = 0, priceDown = 0;

    for (let i = 0; i < deduped.length; i += 2) {
      if (abortSyncRef.current) break;
      const batch = deduped.slice(i, i + 2);
      const results = await Promise.all(batch.map(async (s) => {
        try { return await syncSinglePrice(s, false); }
        catch (error: any) { return { status: 'failed' as const, error: error?.message || 'Unexpected error' }; }
      }));
      results.forEach(r => {
        done++;
        if (r.status === 'success') { updated++; if (r.percentChange && r.percentChange > 0) priceUp++; else if (r.percentChange && r.percentChange < 0) priceDown++; }
        else if (r.status === 'unchanged') unchanged++;
        else failed++;
      });
      setBulkSyncProgress({ done, total: deduped.length, variants: totalVariants });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    setBulkSyncing(false);
    setBulkSyncProgress(null);
    queryClient.invalidateQueries({ queryKey: ['admin-pricing-data', productType] });
    queryClient.invalidateQueries({ queryKey: ['admin-recent-price-changes', productType] });

    const updatedDetail = updated > 0 ? ` (↑${priceUp} ↓${priceDown})` : '';
    if (abortSyncRef.current) {
      toast.info(`⚠️ Sync cancelled — ${done}/${deduped.length} stores: ${updated} updated${updatedDetail}, ${unchanged} unchanged, ${failed} failed`);
    } else {
      toast.success(`Synced ${done} stores: ${updated} updated${updatedDetail}, ${unchanged} unchanged, ${failed} failed`);
    }
    setSyncBatchCompleteCount(c => c + 1);
  }, [syncSinglePrice, queryClient, productType]);

  // =============================================
  // Diagnosis
  // =============================================

  const failedSyncCount = useMemo(() => {
    let count = 0;
    syncResults.forEach(r => { if (r.status === 'failed') count++; });
    return count;
  }, [syncResults]);

  const failedTestCount = useMemo(() => {
    let count = 0;
    testResults.forEach(r => { if (r.status === 'broken' || r.status === 'timeout') count++; });
    return count;
  }, [testResults]);

  const totalFailureCount = failedSyncCount + failedTestCount;

  const handleDiagnoseFailures = useCallback(async () => {
    const failures: any[] = [];

    syncResults.forEach((result, storeKey) => {
      if (result.status !== 'failed') return;
      const entry = storeKeyMap.get(storeKey);
      if (!entry) return;
      const testResult = testResults.get(storeKey);
      failures.push({
        product: entry.group.cleanName,
        region: entry.store.region,
        currency: entry.store.currency,
        url: entry.store.productUrl || '',
        error: result.error || 'Unknown error',
        brand: entry.group.brand,
        extractedPrice: result.newPrice,
        source: result.source,
        statusCode: testResult?.statusCode,
        latencyMs: testResult?.latencyMs,
        storeKey: entry.store.storeKey,
      });
    });

    testResults.forEach((result, storeKey) => {
      if (result.status !== 'broken' && result.status !== 'timeout') return;
      const syncResult = syncResults.get(storeKey);
      if (syncResult?.status === 'failed') return;
      const entry = storeKeyMap.get(storeKey);
      if (!entry) return;
      failures.push({
        product: entry.group.cleanName,
        region: entry.store.region,
        currency: entry.store.currency,
        url: entry.store.productUrl || '',
        error: `[LINK_TEST] ${result.error || `HTTP ${result.statusCode} - Link ${result.status}`}`,
        brand: entry.group.brand,
        extractedPrice: 0,
        source: 'link_test',
        statusCode: result.statusCode,
        latencyMs: result.latencyMs,
        storeKey: entry.store.storeKey,
      });
    });

    if (failures.length === 0) { toast.info('No failures to diagnose'); return; }

    setIsDiagnosing(true);
    try {
      const { data, error } = await supabase.functions.invoke('diagnose-sync-failures', {
        body: { failures },
      });
      if (error) throw error;
      setDiagnosisResult(data as DiagnosisResult);
      setShowDiagnosisModal(true);
      localStorage.setItem(`filascope_last_diagnosis_${productType}`, JSON.stringify({ result: data, timestamp: new Date().toISOString() }));
    } catch (err: any) {
      toast.error(`Diagnosis failed: ${err.message}`);
    } finally {
      setIsDiagnosing(false);
    }
  }, [syncResults, storeKeyMap, testResults, productType]);

  diagnoseRef.current = handleDiagnoseFailures;

  const handleRetryTransient = useCallback(async () => {
    if (!diagnosisResult) return;
    const transientPatterns = diagnosisResult.diagnoses.filter(d => d.isTransient);
    const transientProducts = new Set(transientPatterns.flatMap(d => d.affectedProducts));

    const storesToRetry: StoreRow[] = [];
    syncResults.forEach((result, storeKey) => {
      if (result.status !== 'failed') return;
      const entry = storeKeyMap.get(storeKey);
      if (!entry) return;
      const label = `${entry.group.cleanName} ${entry.store.region}`;
      if (transientProducts.has(label)) storesToRetry.push(entry.store);
    });

    if (storesToRetry.length === 0) { toast.info('No transient failures to retry'); return; }
    setShowDiagnosisModal(false);
    syncBatch(storesToRetry);
  }, [diagnosisResult, syncResults, storeKeyMap, syncBatch]);

  // =============================================
  // CSV Export
  // =============================================

  const handleExportPricing = useCallback(() => {
    const exportData: Record<string, string>[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        exportData.push({
          Product: g.cleanName,
          Brand: g.brand,
          Type: g.productSubtype || '',
          Variants: String(g.variantCount),
          Store: s.storeName,
          Region: s.region,
          Price: s.price?.toFixed(2) || '',
          Currency: s.currency,
          Status: s.linkStatus,
          'Change %': s.priceChange?.percent?.toFixed(1) || '0',
          'Last Sync': s.lastScrapedAt || '',
          URL: s.productUrl || '',
        });
      }
    }
    downloadCSV(exportData, `${productType}-pricing-report`);
    toast.success('Exported pricing report');
  }, [filtered, productType]);

  const handleExportChanges = useCallback(() => {
    const exportData: Record<string, string>[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        if (s.priceChange && s.priceChange.direction !== 'unchanged') {
          exportData.push({
            Product: g.cleanName,
            Brand: g.brand,
            Variants: String(g.variantCount),
            Store: s.storeName,
            'Old Price': s.priceChange.oldPrice?.toFixed(2) || '',
            'New Price': s.priceChange.newPrice?.toFixed(2) || '',
            'Change %': s.priceChange.percent?.toFixed(1) || '',
            Currency: s.currency,
          });
        }
      }
    }
    if (exportData.length === 0) { toast.info('No price changes to export'); return; }
    downloadCSV(exportData, `${productType}-price-changes`);
    toast.success(`Exported ${exportData.length} price changes`);
  }, [filtered, productType]);

  // =============================================
  // Populate regional URLs
  // =============================================

  const canPopulateUrls = useMemo(() => {
    // For any product type, check if the current vendor filter matches a brand with regional configs
    return filtered.length > 0; // simplified — actual check done in handler
  }, [filtered.length]);

  const handlePopulateRegionalUrls = useCallback(async (vendorFilter: string) => {
    if (vendorFilter === 'all' || !(vendorFilter in BRAND_REGIONAL_CONFIGS)) return;
    const vendor = vendorFilter;
    const productCount = filtered.length;
    const brandSlug = vendor.toLowerCase().replace(/\s+/g, '-');

    const confirmed = window.confirm(
      `Generate regional URLs for ${productCount} ${vendor} ${config.pluralLabel.toLowerCase()}?\n\nThis will fill in missing CA/UK/EU/AU/JP URLs by transforming the US URL using known store patterns.\n\nProducts without a US URL will be skipped.`
    );
    if (!confirmed) return;

    setIsPopulatingUrls(true);
    const toastId = toast.loading(`Generating regional URLs for ${vendor}...`);

    try {
      const { data, error } = await supabase.functions.invoke('populate-regional-urls', {
        body: {
          brandSlug,
          productType,
          regions: ['CA', 'UK', 'EU', 'AU', 'JP'],
          validateUrls: false,
          dryRun: false,
        },
      });

      if (error) throw error;

      const updatedCount = data?.updated ?? data?.results?.updated ?? 0;
      const skipped = data?.skipped ?? data?.results?.skipped ?? 0;
      const total = data?.total ?? data?.results?.total ?? 0;

      toast.success(`Generated ${updatedCount} regional URLs for ${total} products. ${skipped} skipped (no US URL).`, { id: toastId });
      queryClient.invalidateQueries({ queryKey: ['admin-pricing-data', productType] });
    } catch (err: any) {
      toast.error(`Failed to populate URLs: ${err.message}`, { id: toastId });
    } finally {
      setIsPopulatingUrls(false);
    }
  }, [filtered.length, queryClient, productType, config.pluralLabel]);

  // =============================================
  // Clear inactive store cache
  // =============================================

  const handleClearInactiveStoreCache = useCallback(async () => {
    const confirmed = window.confirm(
      'Clear URL validation cache entries for inactive stores?\n\nThis removes stale "Failed" status entries for stores that have been deactivated.'
    );
    if (!confirmed) return;

    setIsClearingInactiveCache(true);
    const toastId = toast.loading('Finding inactive store URLs…');

    try {
      const { data: inactiveStores, error: storeError } = await supabase
        .from('brand_regional_stores')
        .select('base_url')
        .eq('is_active', false);

      if (storeError) throw storeError;

      const domains = (inactiveStores || [])
        .map(s => { try { return new URL(s.base_url).hostname; } catch { return null; } })
        .filter(Boolean) as string[];

      if (domains.length === 0) {
        toast.dismiss(toastId);
        toast.info('No inactive stores found');
        return;
      }

      let totalDeleted = 0;
      for (const domain of domains) {
        const { error: delError } = await supabase
          .from('url_validation_cache')
          .delete()
          .ilike('url', `%${domain}%`);
        if (!delError) totalDeleted++;
      }

      toast.dismiss(toastId);
      toast.success(`Cleared cache for ${totalDeleted} inactive store domain(s)`);
      queryClient.invalidateQueries({ queryKey: ['admin-url-validation-cache'] });
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Failed to clear cache: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsClearingInactiveCache(false);
    }
  }, [queryClient]);

  // =============================================
  // Abort
  // =============================================

  const handleCancel = useCallback(() => {
    abortRef.current = true;
    abortSyncRef.current = true;
  }, []);

  const isBusy = bulkTesting || bulkSyncing;

  return {
    testResults,
    syncResults,
    bulkTesting,
    bulkSyncing,
    bulkProgress,
    bulkSyncProgress,
    isPopulatingUrls,
    diagnosisResult,
    isDiagnosing,
    showDiagnosisModal,
    setShowDiagnosisModal,
    searchResults,
    bulkSearchProgress,
    isClearingInactiveCache,
    syncBatchCompleteCount,
    isBusy,
    totalFailureCount,
    storeKeyMap,
    testSingleUrl,
    testBatch,
    syncSinglePrice,
    syncBatch,
    handleDiagnoseFailures,
    handleRetryTransient,
    handleExportPricing,
    handleExportChanges,
    handlePopulateRegionalUrls,
    handleClearInactiveStoreCache,
    handleSearchStore,
    handleSearchAllBroken,
    handleApplyAllFixes,
    handleCancel,
    canPopulateUrls,
  };
}
