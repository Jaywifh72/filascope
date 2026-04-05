// =====================================================
// SHARED UTILITY: Sync Circuit Breaker
// Purpose: Circuit breaker pattern to prevent cascading failures
// Created: 2026-04-01
// =====================================================

import { createClient } from '@supabase/supabase-js';

export interface CircuitBreakerState {
  brand_slug: string;
  is_open: boolean;
  failure_count: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  opened_at: string | null;
  reason: string | null;
  reset_after: number; // seconds
  max_failures: number;
}

export interface CircuitBreakerConfig {
  max_failures: number; // Open after N failures
  reset_after: number; // Reset after N seconds
  threshold: number; // Minimum success rate required
  window_seconds: number; // Time window to calculate success rate
}

export class SyncCircuitBreaker {
  private supabase: any;

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Check if circuit breaker is open for a brand
   * Auto-resets if timer has expired
   */
  async isOpen(brandSlug: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('is_circuit_breaker_open', { p_brand_slug: brandSlug });

    if (error) throw error;
    return data || false;
  }

  /**
   * Record a sync attempt (success or failure)
   */
  async recordAttempt(
    brandSlug: string,
    success: boolean,
    errorMessage?: string
  ): Promise<CircuitBreakerState> {
    if (success) {
      return await this.recordSuccess(brandSlug);
    } else {
      return await this.recordFailure(brandSlug, errorMessage);
    }
  }

  /**
   * Record a successful sync
   */
  private async recordSuccess(brandSlug: string): Promise<CircuitBreakerState> {
    const { data, error } = await this.supabase
      .from('sync_circuit_breaker')
      .update({
        is_open: false,
        failure_count: 0,
        last_success_at: new Date().toISOString(),
        reason: null,
        opened_at: null
      })
      .eq('brand_slug', brandSlug)
      .select()
      .single();

    if (error) {
      // If record doesn't exist, create it
      const { data: newData, error: insertError } = await this.supabase
        .from('sync_circuit_breaker')
        .insert({
          brand_slug: brandSlug,
          is_open: false,
          failure_count: 0,
          last_success_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return newData;
    }

    return data;
  }

  /**
   * Record a failed sync
   */
  private async recordFailure(
    brandSlug: string,
    errorMessage?: string
  ): Promise<CircuitBreakerState> {
    // Get current state
    const { data: current } = await this.supabase
      .from('sync_circuit_breaker')
      .select('*')
      .eq('brand_slug', brandSlug)
      .single();

    const failureCount = (current?.failure_count || 0) + 1;
    const maxFailures = current?.max_failures || 3;
    const shouldOpen = failureCount >= maxFailures;

    const updateData = {
      failure_count: failureCount,
      last_failure_at: new Date().toISOString(),
      reason: errorMessage || 'Sync failure',
      is_open: shouldOpen,
      opened_at: shouldOpen ? new Date().toISOString() : null
    };

    if (current) {
      // Update existing record
      const { data, error } = await this.supabase
        .from('sync_circuit_breaker')
        .update(updateData)
        .eq('brand_slug', brandSlug)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new record
      const { data, error } = await this.supabase
        .from('sync_circuit_breaker')
        .insert({
          brand_slug: brandSlug,
          ...updateData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  /**
   * Manually reset circuit breaker for a brand
   */
  async reset(brandSlug: string, reason?: string): Promise<CircuitBreakerState> {
    const { data, error } = await this.supabase
      .from('sync_circuit_breaker')
      .update({
        is_open: false,
        failure_count: 0,
        reason: reason || 'Manual reset',
        opened_at: null
      })
      .eq('brand_slug', brandSlug)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get circuit breaker state for all brands
   */
  async getAllStates(): Promise<CircuitBreakerState[]> {
    const { data, error } = await this.supabase
      .from('circuit_breaker_status')
      .select('*')
      .order('brand_slug');

    if (error) throw error;
    return data;
  }

  /**
   * Get circuit breaker state for a specific brand
   */
  async getState(brandSlug: string): Promise<CircuitBreakerState> {
    const { data, error } = await this.supabase
      .from('circuit_breaker_status')
      .select('*')
      .eq('brand_slug', brandSlug)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all brands with open circuit breakers
   */
  async getOpenBrands(): Promise<CircuitBreakerState[]> {
    const { data, error } = await this.supabase
      .from('circuit_breaker_status')
      .select('*')
      .eq('is_open', true)
      .order('opened_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Check if sync should proceed for a brand
   */
  async shouldSync(brandSlug: string): Promise<boolean> {
    const isOpen = await this.isOpen(brandSlug);
    
    if (isOpen) {
      // Check if we can auto-reset
      const state = await this.getState(brandSlug);
      if (state) {
        const secondsSinceFailure = Math.floor(
          (Date.now() - new Date(state.last_failure_at!).getTime()) / 1000
        );
        
        // Auto-reset if timer expired
        if (secondsSinceFailure >= state.reset_after) {
          await this.reset(brandSlug, 'Auto-reset after timeout');
          return true;
        }
      }
      return false;
    }
    
    return true;
  }

  /**
   * Get statistics for circuit breaker performance
   */
  async getStatistics(): Promise<{
    total_brands: number;
    open_breakers: number;
    closed_breakers: number;
    high_failure_brands: number; // 2+ failures
  }> {
    const allStates = await this.getAllStates();

    return {
      total_brands: allStates.length,
      open_breakers: allStates.filter(s => s.is_open).length,
      closed_breakers: allStates.filter(s => !s.is_open).length,
      high_failure_brands: allStates.filter(s => s.failure_count >= 2).length
    };
  }
}

export default SyncCircuitBreaker;
