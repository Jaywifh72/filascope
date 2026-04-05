// =====================================================
// SHARED UTILITY: Price Validation Engine
// Purpose: Multi-layer price validation with anomaly detection
// Created: 2026-04-01
// =====================================================

import { createClient } from '@supabase/supabase-js';

interface PriceValidationConfig {
  currency_code: string;
  expected_rate_to_usd: number;
  anomaly_threshold_low: number;  // Reject if < this % of expected
  anomaly_threshold_high: number; // Reject if > this % of expected
}

interface ValidationResult {
  filament_id: number;
  price: number;
  currency: string;
  expected_price: number;
  deviation_percent: number;
  status: 'valid' | 'warning' | 'invalid' | 'anomaly';
  confidence_score: number;
  anomalies: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
}

export class PriceValidationEngine {
  private supabase: any;
  private exchangeRates: Map<string, number> = new Map();

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Load current exchange rates
   */
  async loadExchangeRates(): Promise<void> {
    const { data, error } = await this.supabase
      .from('exchange_rates')
      .select('*')
      .gte('exchange_rate_date', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()); // Last 4 hours

    if (error) throw error;

    this.exchangeRates.clear();
    data.forEach((rate: any) => {
      this.exchangeRates.set(rate.currency_code, rate.rate_to_usd);
    });

    console.log(`Loaded ${this.exchangeRates.size} exchange rates`);
  }

  /**
   * Validate a single price
   */
  async validatePrice(
    filamentId: number,
    price: number,
    currency: string,
    source: 'api' | 'scraped' | 'converted' | 'legacy_migration'
  ): Promise<ValidationResult> {
    // Load exchange rates if not loaded
    if (this.exchangeRates.size === 0) {
      await this.loadExchangeRates();
    }

    const anomalies: ValidationResult['anomalies'] = [];
    let status: ValidationResult['status'] = 'valid';
    let confidenceScore = this.getSourceConfidence(source);

    // Get expected rate for this currency
    const expectedRate = this.exchangeRates.get(currency);
    if (!expectedRate) {
      anomalies.push({
        type: 'missing_exchange_rate',
        severity: 'high',
        description: `No exchange rate found for ${currency}`
      });
      status = 'invalid';
    }

    // Check for negative or zero price
    if (price <= 0) {
      anomalies.push({
        type: price < 0 ? 'negative_price' : 'zero_price',
        severity: 'critical',
        description: `${price < 0 ? 'Negative' : 'Zero'} price detected`
      });
      status = 'anomaly';
    }

    // Get expected price based on USD reference
    let expectedPrice = price;
    let deviationPercent = 0;

    if (expectedRate && currency !== 'USD') {
      // Convert to USD for comparison
      const priceInUSD = price * expectedRate;

      // Get average USD price for this filament
      const { data: avgPriceData } = await this.supabase
        .from('filament_prices')
        .select('price')
        .eq('filament_id', filamentId)
        .eq('currency_code', 'USD')
        .limit(10);

      if (avgPriceData && avgPriceData.length > 0) {
        const avgUSDPrice = avgPriceData.reduce((sum, p) => sum + p.price, 0) / avgPriceData.length;
        expectedPrice = avgUSDPrice / expectedRate; // Convert back to this currency

        deviationPercent = Math.abs((price - expectedPrice) / expectedPrice * 100);

        // Check for extreme conversion errors
        if (deviationPercent > 300) {
          anomalies.push({
            type: 'extreme_conversion',
            severity: 'critical',
            description: `Price deviates ${deviationPercent.toFixed(1)}% from expected (expected: ${expectedPrice.toFixed(2)} ${currency})`
          });
          status = 'anomaly';
        } else if (deviationPercent > 100) {
          anomalies.push({
            type: 'price_outlier',
            severity: 'high',
            description: `Price deviates ${deviationPercent.toFixed(1)}% from expected (expected: ${expectedPrice.toFixed(2)} ${currency})`
          });
          status = 'invalid';
        } else if (deviationPercent > 25) {
          anomalies.push({
            type: 'price_outlier',
            severity: 'medium',
            description: `Price deviates ${deviationPercent.toFixed(1)}% from expected (expected: ${expectedPrice.toFixed(2)} ${currency})`
          });
          status = 'warning';
        }
      }
    }

    // Check for stale prices
    const { data: priceData } = await this.supabase
      .from('filament_prices')
      .select('last_updated, store_id')
      .eq('filament_id', filamentId)
      .eq('currency_code', currency)
      .eq('price', price)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    if (priceData) {
      const hoursSinceUpdate = (Date.now() - new Date(priceData.last_updated).getTime()) / (1000 * 60 * 60);
      
      // Get max age from regional config
      const { data: config } = await this.supabase
        .from('regional_sync_config')
        .select('max_price_age_hours')
        .eq('brand_slug', await this.getBrandSlug(filamentId))
        .eq('region', currency)
        .single();

      const maxAge = config?.max_price_age_hours || 72;

      if (hoursSinceUpdate > maxAge) {
        anomalies.push({
          type: 'stale_price',
          severity: hoursSinceUpdate > maxAge * 2 ? 'high' : 'medium',
          description: `Price is ${Math.floor(hoursSinceUpdate)} hours old (max: ${maxAge}h)`
        });
        status = status === 'valid' ? 'warning' : status;
      }
    }

    // Reduce confidence if there are anomalies
    if (anomalies.length > 0) {
      confidenceScore *= 0.5; // Penalize confidence for anomalies
    }

    return {
      filament_id: filamentId,
      price,
      currency,
      expected_price: expectedPrice,
      deviation_percent: deviationPercent,
      status,
      confidence_score: confidenceScore,
      anomalies
    };
  }

  /**
   * Validate all prices for a brand
   */
  async validateBrandPrices(brandSlug: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Get all filaments for this brand
    const { data: filaments } = await this.supabase
      .from('filaments')
      .select('id, brand_id')
      .eq('brand_slug', brandSlug);

    if (!filaments) return results;

    for (const filament of filaments) {
      // Get all prices for this filament
      const { data: prices } = await this.supabase
        .from('filament_prices')
        .select('id, price, currency_code, source')
        .eq('filament_id', filament.id);

      if (!prices) continue;

      for (const price of prices) {
        try {
          const validation = await this.validatePrice(
            filament.id,
            price.price,
            price.currency_code,
            price.source as any
          );

          // Update filament_prices with validation result
          await this.supabase
            .from('filament_prices')
            .update({
              validation_status: validation.status,
              confidence_score: validation.confidence_score,
              last_validated_at: new Date().toISOString()
            })
            .eq('id', price.id);

          // Log anomalies
          for (const anomaly of validation.anomalies) {
            if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
              await this.supabase
                .from('price_anomalies')
                .insert({
                  filament_price_id: price.id,
                  filament_id: filament.id,
                  brand_slug,
                  currency_code: price.currency_code,
                  anomaly_type: anomaly.type,
                  expected_price: validation.expected_price,
                  actual_price: price.price,
                  deviation_percent: validation.deviation_percent,
                  severity: anomaly.severity,
                  description: anomaly.description
                });
            }
          }

          results.push(validation);
        } catch (error) {
          console.error(`Validation failed for filament ${filament.id}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Get brand slug for a filament
   */
  private async getBrandSlug(filamentId: number): Promise<string> {
    const { data } = await this.supabase
      .from('filaments')
      .select('brand_slug')
      .eq('id', filamentId)
      .single();

    return data?.brand_slug || 'unknown';
  }

  /**
   * Get confidence score based on source
   */
  private getSourceConfidence(source: string): number {
    switch (source) {
      case 'api':
        return 1.00;
      case 'scraped':
        return 0.75;
      case 'converted':
        return 0.50;
      case 'legacy_migration':
        return 0.25;
      default:
        return 0.50;
    }
  }

  /**
   * Detect anomalies across all brands
   */
  async detectAllAnomalies(): Promise<number> {
    const { data: brands } = await this.supabase
      .from('automated_brands')
      .select('brand_slug');

    if (!brands) return 0;

    let totalAnomalies = 0;
    for (const brand of brands) {
      const results = await this.validateBrandPrices(brand.brand_slug);
      totalAnomalies += results.filter(r => r.anomalies.length > 0).length;
    }

    return totalAnomalies;
  }
}

export default PriceValidationEngine;
