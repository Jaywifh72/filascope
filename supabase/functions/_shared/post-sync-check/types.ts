// Post Sync Check Types

export interface CheckResult {
  checkName: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  count: number;
  details?: string;
  products?: Array<{ id: string; title: string; issue: string; url?: string }>;
}

export interface PostSyncCheckReport {
  generatedAt: string;
  brand: string;
  brandSlug: string;
  totalProducts: number;
  checks: CheckResult[];
  overallStatus: 'pass' | 'warning' | 'fail';
  scrapedProducts: number;
  scrapeErrors: string[];
  aiFixPrompt: string | null;
  profileUpdated?: boolean;
}

export interface ScrapedProductInfo {
  pageTitle: string;
  colorSwatches: Array<{ name: string; hex?: string; productUrl?: string }>;
  statusCode: number;
}

export interface AIWebsiteAnalysis {
  swatchType: string;
  extractionPattern: string;
  missingReason: string;
  fixCode: string;
  colorMappings: Record<string, string>;
  rootCause?: string;
  wrongDecisions?: string[];
  correctBehavior?: string;
}

export interface DecisionLogEntry {
  id: string;
  product_id: string;
  product_title: string;
  decision_type: string;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  decision_reason: string;
  success: boolean;
}

export interface AIRole {
  title: string;
  triggers: string[];
  capabilities: string[];
  lessons?: string[];
}

export interface BrandCheckContext {
  brandSlug: string;
  brandName: string;
  totalProducts: number;
  checks: CheckResult[];
  failingChecks: CheckResult[];
  products: Array<{
    id: string;
    product_title: string;
    product_line_id: string | null;
    color_hex: string | null;
    color_family: string | null;
    material: string | null;
    variant_price: number | null;
    featured_image: string | null;
    product_url: string | null;
  }>;
}
