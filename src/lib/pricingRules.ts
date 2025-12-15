// Shipping rules by brand
export interface ShippingRule {
  freeThreshold: number;
  flatRate: number;
  currency: string;
}

export const BRAND_SHIPPING_RULES: Record<string, ShippingRule> = {
  'Bambu Lab': { freeThreshold: 49, flatRate: 0, currency: 'USD' },
  'Prusa Research': { freeThreshold: 75, flatRate: 5.99, currency: 'USD' },
  'Prusament': { freeThreshold: 75, flatRate: 5.99, currency: 'USD' },
  'Polymaker': { freeThreshold: 49, flatRate: 4.99, currency: 'USD' },
  'eSUN': { freeThreshold: 39, flatRate: 4.99, currency: 'USD' },
  'Hatchbox': { freeThreshold: 25, flatRate: 0, currency: 'USD' },
  'Overture': { freeThreshold: 25, flatRate: 0, currency: 'USD' },
  'ColorFabb': { freeThreshold: 50, flatRate: 7.99, currency: 'USD' },
  'Fillamentum': { freeThreshold: 100, flatRate: 9.99, currency: 'USD' },
  '3DXTech': { freeThreshold: 100, flatRate: 8.99, currency: 'USD' },
  'MatterHackers': { freeThreshold: 35, flatRate: 5.99, currency: 'USD' },
  'default': { freeThreshold: 50, flatRate: 5.99, currency: 'USD' }
};

// Volume discount tiers by brand
export interface VolumeTier {
  minQty: number;
  discountPercent: number;
  label?: string;
}

export const VOLUME_DISCOUNT_TIERS: Record<string, VolumeTier[]> = {
  'Bambu Lab': [
    { minQty: 1, discountPercent: 0 },
    { minQty: 4, discountPercent: 5, label: '4-pack' },
    { minQty: 8, discountPercent: 10, label: '8-pack' },
  ],
  'Polymaker': [
    { minQty: 1, discountPercent: 0 },
    { minQty: 3, discountPercent: 10, label: '3+ spools' },
    { minQty: 6, discountPercent: 15, label: '6+ spools' },
  ],
  'Prusament': [
    { minQty: 1, discountPercent: 0 },
    { minQty: 5, discountPercent: 5, label: '5+ spools' },
    { minQty: 10, discountPercent: 10, label: '10+ spools' },
  ],
  'eSUN': [
    { minQty: 1, discountPercent: 0 },
    { minQty: 3, discountPercent: 8, label: '3+ spools' },
    { minQty: 5, discountPercent: 12, label: '5+ spools' },
    { minQty: 10, discountPercent: 18, label: '10+ spools' },
  ],
  'default': [
    { minQty: 1, discountPercent: 0 },
    { minQty: 3, discountPercent: 5, label: '3+ spools' },
    { minQty: 5, discountPercent: 10, label: '5+ spools' },
    { minQty: 10, discountPercent: 15, label: '10+ spools' },
  ]
};

export function getShippingRule(vendor: string): ShippingRule {
  return BRAND_SHIPPING_RULES[vendor] || BRAND_SHIPPING_RULES.default;
}

export function getVolumeTiers(vendor: string): VolumeTier[] {
  return VOLUME_DISCOUNT_TIERS[vendor] || VOLUME_DISCOUNT_TIERS.default;
}

export function getCurrentDiscount(vendor: string, quantity: number): VolumeTier {
  const tiers = getVolumeTiers(vendor);
  let currentTier = tiers[0];
  
  for (const tier of tiers) {
    if (quantity >= tier.minQty) {
      currentTier = tier;
    }
  }
  
  return currentTier;
}

export function getNextVolumeTier(vendor: string, quantity: number): VolumeTier | null {
  const tiers = getVolumeTiers(vendor);
  
  for (const tier of tiers) {
    if (tier.minQty > quantity) {
      return tier;
    }
  }
  
  return null;
}

export function calculateShipping(vendor: string, subtotal: number): number {
  const rule = getShippingRule(vendor);
  return subtotal >= rule.freeThreshold ? 0 : rule.flatRate;
}

export function calculateDiscountedPrice(basePrice: number, vendor: string, quantity: number): number {
  const tier = getCurrentDiscount(vendor, quantity);
  return basePrice * (1 - tier.discountPercent / 100);
}

export interface PricingTip {
  type: 'shipping' | 'volume' | 'price_drop' | 'bundle' | 'best_price';
  message: string;
  icon: string;
  priority: number;
}

export function generatePricingTips(params: {
  quantity: number;
  price: number;
  vendor: string;
  trendPercent: number | null;
  isBestIn30Days: boolean;
  isBestIn6Months: boolean;
}): PricingTip[] {
  const { quantity, price, vendor, trendPercent, isBestIn30Days, isBestIn6Months } = params;
  const tips: PricingTip[] = [];
  
  const shippingRule = getShippingRule(vendor);
  const total = quantity * price;
  
  // Free shipping tip
  if (total < shippingRule.freeThreshold && shippingRule.flatRate > 0) {
    const amountNeeded = shippingRule.freeThreshold - total;
    const spoolsNeeded = Math.ceil(amountNeeded / price);
    tips.push({
      type: 'shipping',
      message: `Buy ${spoolsNeeded} more for free shipping`,
      icon: '🚚',
      priority: 1
    });
  }
  
  // Volume discount tip
  const nextTier = getNextVolumeTier(vendor, quantity);
  if (nextTier) {
    const spoolsNeeded = nextTier.minQty - quantity;
    const savings = price * nextTier.minQty * (nextTier.discountPercent / 100);
    tips.push({
      type: 'volume',
      message: `Buy ${spoolsNeeded} more for ${nextTier.discountPercent}% off (save $${savings.toFixed(2)})`,
      icon: '💰',
      priority: 2
    });
  }
  
  // Price trend tips
  if (isBestIn6Months) {
    tips.push({
      type: 'best_price',
      message: 'Lowest price in 6 months!',
      icon: '🏆',
      priority: 0
    });
  } else if (isBestIn30Days) {
    tips.push({
      type: 'best_price',
      message: 'Best price in 30 days',
      icon: '✨',
      priority: 0
    });
  }
  
  if (trendPercent !== null && trendPercent < -10) {
    tips.push({
      type: 'price_drop',
      message: `Price dropped ${Math.abs(trendPercent)}% recently`,
      icon: '📉',
      priority: 1
    });
  } else if (trendPercent !== null && trendPercent > 5) {
    tips.push({
      type: 'price_drop',
      message: 'Price trending up - buy soon',
      icon: '📈',
      priority: 1
    });
  }
  
  return tips.sort((a, b) => a.priority - b.priority).slice(0, 2);
}
