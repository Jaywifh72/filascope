/**
 * Decision Logger Utility for Sync Functions
 * 
 * Logs verbose decision-making information during sync operations
 * to help diagnose issues and power AI-driven fix recommendations.
 */

export type DecisionType = 
  | 'color_extraction'
  | 'product_line'
  | 'hex_lookup'
  | 'filter'
  | 'title_format'
  | 'material'
  | 'finish'
  | 'weight'
  | 'diameter'
  | 'material_separation'
  | 'price_validation'
  | 'deduplication'
  | 'multi_material';

export interface DecisionLog {
  productId: string;
  productTitle: string;
  decisionType: DecisionType;
  input: Record<string, any>;
  output: Record<string, any>;
  reason: string;
  success: boolean;
}

export interface DecisionLoggerOptions {
  brandSlug: string;
  syncLogId?: string;
  maxLogs?: number;
}

/**
 * Decision Logger class for collecting and storing sync decisions
 */
export class DecisionLogger {
  private logs: DecisionLog[] = [];
  private brandSlug: string;
  private syncLogId?: string;
  private maxLogs: number;
  
  constructor(options: DecisionLoggerOptions) {
    this.brandSlug = options.brandSlug;
    this.syncLogId = options.syncLogId;
    this.maxLogs = options.maxLogs || 1000;
  }
  
  /**
   * Log a decision made during sync
   */
  log(log: DecisionLog): void {
    if (this.logs.length >= this.maxLogs) {
      // Keep the most recent logs and some failures
      const failures = this.logs.filter(l => !l.success);
      const recent = this.logs.slice(-500);
      this.logs = [...failures.slice(0, 100), ...recent];
    }
    this.logs.push(log);
  }
  
  /**
   * Log a color extraction decision
   */
  logColorExtraction(
    productId: string,
    productTitle: string,
    input: { variantTitle: string; productHandle?: string; options?: string[] },
    output: { colorName: string; method: string },
    success: boolean = true
  ): void {
    this.log({
      productId,
      productTitle,
      decisionType: 'color_extraction',
      input,
      output,
      reason: success 
        ? `Color "${output.colorName}" extracted via ${output.method}`
        : `Failed to extract color, defaulting to "${output.colorName}"`,
      success,
    });
  }
  
  /**
   * Log a product line ID decision
   */
  logProductLine(
    productId: string,
    productTitle: string,
    input: { title: string; handle?: string; colorName?: string },
    output: { productLineId: string; matchedPattern?: string },
    success: boolean = true
  ): void {
    this.log({
      productId,
      productTitle,
      decisionType: 'product_line',
      input,
      output,
      reason: output.matchedPattern 
        ? `Matched pattern: ${output.matchedPattern}`
        : `Generated from title/handle fallback`,
      success,
    });
  }
  
  /**
   * Log a hex color lookup decision
   */
  logHexLookup(
    productId: string,
    productTitle: string,
    input: { colorName: string; variantTitle?: string },
    output: { colorHex: string | null; source: string },
    success: boolean = true
  ): void {
    this.log({
      productId,
      productTitle,
      decisionType: 'hex_lookup',
      input,
      output,
      reason: output.colorHex 
        ? `Found hex ${output.colorHex} via ${output.source}`
        : `No hex found for "${input.colorName}"`,
      success: output.colorHex !== null,
    });
  }
  
  /**
   * Log a filter decision (include/exclude variant)
   */
  logFilter(
    productId: string,
    productTitle: string,
    input: { weight: number; diameter: number },
    output: { included: boolean; reason: string }
  ): void {
    this.log({
      productId,
      productTitle,
      decisionType: 'filter',
      input,
      output,
      reason: output.reason,
      success: output.included,
    });
  }
  
  /**
   * Log a title formatting decision
   */
  logTitleFormat(
    productId: string,
    input: { originalTitle: string; productLine: string; colorName: string },
    output: { formattedTitle: string }
  ): void {
    this.log({
      productId,
      productTitle: input.originalTitle,
      decisionType: 'title_format',
      input,
      output,
      reason: `Formatted as "${output.formattedTitle}"`,
      success: true,
    });
  }
  
  /**
   * Get all logs
   */
  getLogs(): DecisionLog[] {
    return this.logs;
  }
  
  /**
   * Get failed decisions only
   */
  getFailures(): DecisionLog[] {
    return this.logs.filter(l => !l.success);
  }
  
  /**
   * Get logs by decision type
   */
  getByType(type: DecisionType): DecisionLog[] {
    return this.logs.filter(l => l.decisionType === type);
  }
  
  /**
   * Get summary statistics
   */
  getSummary(): Record<DecisionType, { total: number; failures: number }> {
    const summary: Record<string, { total: number; failures: number }> = {};
    
    for (const log of this.logs) {
      if (!summary[log.decisionType]) {
        summary[log.decisionType] = { total: 0, failures: 0 };
      }
      summary[log.decisionType].total++;
      if (!log.success) {
        summary[log.decisionType].failures++;
      }
    }
    
    return summary as Record<DecisionType, { total: number; failures: number }>;
  }
  
  /**
   * Save logs to database
   */
  async saveToDatabase(supabase: any): Promise<{ saved: number; errors: number }> {
    if (this.logs.length === 0) {
      return { saved: 0, errors: 0 };
    }
    
    const records = this.logs.map(log => ({
      sync_log_id: this.syncLogId || null,
      brand_slug: this.brandSlug,
      product_id: log.productId,
      product_title: log.productTitle,
      decision_type: log.decisionType,
      input_data: log.input,
      output_data: log.output,
      decision_reason: log.reason,
      success: log.success,
    }));
    
    // Insert in batches of 100
    let saved = 0;
    let errors = 0;
    const batchSize = 100;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await supabase
        .from('scrape_decision_logs')
        .insert(batch);
      
      if (error) {
        console.error('[DecisionLogger] Insert error:', error.message);
        errors += batch.length;
      } else {
        saved += batch.length;
      }
    }
    
    console.log(`[DecisionLogger] Saved ${saved} logs, ${errors} errors`);
    return { saved, errors };
  }
  
  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
  }
  
  /**
   * Set sync log ID after sync log is created
   */
  setSyncLogId(id: string): void {
    this.syncLogId = id;
  }
}

/**
 * Create a new decision logger instance
 */
export function createDecisionLogger(options: DecisionLoggerOptions): DecisionLogger {
  return new DecisionLogger(options);
}
