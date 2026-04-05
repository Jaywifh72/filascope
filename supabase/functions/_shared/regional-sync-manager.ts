// =====================================================
// SHARED UTILITY: Regional Sync Manager
// Purpose: Orchestrate multi-region syncs for brands
// Created: 2026-04-01
// =====================================================

import { createClient } from '@supabase/supabase-js';

interface RegionalSyncConfig {
  brand_slug: string;
  region: string;
  store_id: number;
  is_enabled: boolean;
  sync_priority: number;
  requires_native_currency: boolean;
  max_price_age_hours: number;
}

interface RegionalSyncResult {
  region: string;
  status: 'success' | 'failed' | 'skipped';
  products_fetched: number;
  prices_updated: number;
  error_message?: string;
}

export class RegionalSyncManager {
  private supabase: any;
  
  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Get regional sync configuration for a brand
   */
  async getRegionalConfigs(brandSlug: string): Promise<RegionalSyncConfig[]> {
    const { data, error } = await this.supabase
      .from('regional_sync_config')
      .select('*')
      .eq('brand_slug', brandSlug)
      .eq('is_enabled', true)
      .order('sync_priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if circuit breaker is open for a brand
   */
  async isCircuitBreakerOpen(brandSlug: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('is_circuit_breaker_open', { p_brand_slug: brandSlug });

    if (error) throw error;
    return data || false;
  }

  /**
   * Execute regional sync for a brand
   */
  async executeRegionalSync(
    brandSlug: string,
    syncLogId: number,
    platformType: string
  ): Promise<RegionalSyncResult[]> {
    const results: RegionalSyncResult[] = [];

    // Get regional configs
    const configs = await this.getRegionalConfigs(brandSlug);
    
    if (configs.length === 0) {
      // No regional configs, just sync default region
      return [{
        region: 'USD',
        status: 'skipped',
        products_fetched: 0,
        prices_updated: 0,
        error_message: 'No regional configs configured'
      }];
    }

    // Check circuit breaker
    const isOpen = await this.isCircuitBreakerOpen(brandSlug);
    if (isOpen) {
      return configs.map(config => ({
        region: config.region,
        status: 'failed' as const,
        products_fetched: 0,
        prices_updated: 0,
        error_message: 'Circuit breaker is open'
      }));
    }

    // Sync each region
    for (const config of configs) {
      try {
        // Log regional sync start
        const { data: logEntry } = await this.supabase
          .from('regional_sync_log')
          .insert({
            sync_log_id: syncLogId,
            brand_slug: brandSlug,
            region: config.region,
            store_id: config.store_id,
            status: 'pending',
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!logEntry) throw new Error('Failed to create regional sync log');

        // Execute the actual sync (delegated to brand-specific sync function)
        const syncResult = await this.executeRegionSync(
          brandSlug,
          config.region,
          config.store_id,
          platformType,
          config.requires_native_currency
        );

        // Update log entry
        await this.supabase
          .from('regional_sync_log')
          .update({
            status: syncResult.status,
            products_fetched: syncResult.products_fetched,
            prices_updated: syncResult.prices_updated,
            finished_at: new Date().toISOString(),
            error_message: syncResult.error_message
          })
          .eq('id', logEntry.id);

        results.push({
          region: config.region,
          status: syncResult.status,
          products_fetched: syncResult.products_fetched,
          prices_updated: syncResult.prices_updated,
          error_message: syncResult.error_message
        });

      } catch (error: any) {
        console.error(`Regional sync failed for ${brandSlug}/${config.region}:`, error);
        
        results.push({
          region: config.region,
          status: 'failed',
          products_fetched: 0,
          prices_updated: 0,
          error_message: error.message
        });
      }
    }

    return results;
  }

  /**
   * Execute sync for a specific region
   * This is a placeholder - actual implementation depends on platform type
   */
  private async executeRegionSync(
    brandSlug: string,
    region: string,
    storeId: number,
    platformType: string,
    requiresNativeCurrency: boolean
  ): Promise<RegionalSyncResult> {
    // This method would call the appropriate platform-specific sync function
    // For now, return a placeholder result
    console.log(`Executing ${brandSlug} sync for region ${region} (${platformType})`);
    
    // TODO: Implement actual sync logic based on platform_type
    // - Shopify: Use GraphQL/REST API
    // - Amazon: Use PA-API
    // - Firecrawl: Use web scraping
    // - WooCommerce: Use REST API
    
    return {
      region,
      status: 'success',
      products_fetched: 0,
      prices_updated: 0
    };
  }

  /**
   * Complete sync and update circuit breaker
   */
  async completeSync(
    brandSlug: string,
    syncLogId: number,
    status: 'success' | 'failed' | 'partial_failure',
    metrics: {
      products_updated: number;
      prices_updated: number;
      images_updated: number;
      errors_updated: number;
    }
  ): Promise<any> {
    const { data, error } = await this.supabase
      .rpc('sync_completion_trigger', {
        p_brand_slug: brandSlug,
        p_sync_log_id: syncLogId,
        p_status: status,
        p_products_updated: metrics.products_updated,
        p_prices_updated: metrics.prices_updated,
        p_images_updated: metrics.images_updated,
        p_errors_updated: metrics.errors_updated
      });

    if (error) throw error;
    return data;
  }

  /**
   * Get circuit breaker status for all brands
   */
  async getCircuitBreakerStatus() {
    const { data, error } = await this.supabase
      .from('circuit_breaker_status')
      .select('*')
      .order('brand_slug');

    if (error) throw error;
    return data;
  }
}

export default RegionalSyncManager;
