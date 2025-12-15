export interface BrandConfig {
  vendor: string;
  platform: "shopify" | "woocommerce" | "bigcommerce" | "amazon";
  baseUrl: string;
  apiEndpoint?: string;
  collectionHandle?: string;
  currency: string;
  exchangeRate: number; // To USD
  productsPerPage: number;
  requestDelay: number; // ms between requests
  timeout: number; // request timeout ms
  userAgent: string;
  productCount?: number;
}

const DEFAULT_USER_AGENT = "Mozilla/5.0 (compatible; FilaScope/1.0; +https://filascope.com)";

export const BRAND_CONFIGS: Record<string, BrandConfig> = {
  Hatchbox: {
    vendor: "Hatchbox",
    platform: "amazon",
    baseUrl: "https://www.amazon.com",
    currency: "USD",
    exchangeRate: 1,
    productsPerPage: 20,
    requestDelay: 2000, // Amazon needs slower rate
    timeout: 20000,
    userAgent: DEFAULT_USER_AGENT,
    productCount: 177,
  },
  Prusament: {
    vendor: "Prusament",
    platform: "shopify",
    baseUrl: "https://www.prusa3d.com",
    apiEndpoint: "https://www.prusa3d.com/product/prusament",
    collectionHandle: "prusament",
    currency: "EUR",
    exchangeRate: 1.08, // EUR to USD
    productsPerPage: 50,
    requestDelay: 500,
    timeout: 10000,
    userAgent: DEFAULT_USER_AGENT,
    productCount: 49,
  },
  "Overture 3D": {
    vendor: "Overture 3D",
    platform: "woocommerce",
    baseUrl: "https://overture3d.com",
    apiEndpoint: "https://overture3d.com/wp-json/wc/store/v1/products",
    currency: "USD",
    exchangeRate: 1,
    productsPerPage: 100,
    requestDelay: 1000,
    timeout: 15000,
    userAgent: DEFAULT_USER_AGENT,
    productCount: 135,
  },
  "3D-Fuel": {
    vendor: "3D-Fuel",
    platform: "shopify",
    baseUrl: "https://www.3dfuel.com",
    apiEndpoint: "https://www.3dfuel.com/products.json",
    collectionHandle: "filament",
    currency: "USD",
    exchangeRate: 1,
    productsPerPage: 250,
    requestDelay: 500,
    timeout: 10000,
    userAgent: DEFAULT_USER_AGENT,
    productCount: 78,
  },
  "3DXTech": {
    vendor: "3DXTech",
    platform: "bigcommerce",
    baseUrl: "https://www.3dxtech.com",
    apiEndpoint: "https://www.3dxtech.com/filament/",
    currency: "USD",
    exchangeRate: 1,
    productsPerPage: 36,
    requestDelay: 1000,
    timeout: 15000,
    userAgent: DEFAULT_USER_AGENT,
    productCount: 198,
  },
};

export function getBrandConfig(vendor: string): BrandConfig | null {
  return BRAND_CONFIGS[vendor] || null;
}

export function getAllBrandSlugs(): string[] {
  return Object.keys(BRAND_CONFIGS);
}
