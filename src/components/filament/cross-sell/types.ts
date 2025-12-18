// Cross-sell product interface
export interface CrossSellProduct {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  type: 'filament' | 'accessory' | 'tool';
  color?: string;
  colorHex?: string;
}

// Quantity pricing tier
export interface QuantityTier {
  quantity: number;
  pricePerUnit: number;
  discountPercent: number;
  totalPrice: number;
  savingsAmount: number;
  label?: string;
  isBestValue: boolean;
}

// Bundle product with quantity
export interface BundleProduct {
  id: string;
  name: string;
  image: string;
  quantity: number;
}

// Pre-configured bundle
export interface Bundle {
  id: string;
  name: string;
  description: string;
  products: BundleProduct[];
  originalPrice: number;
  bundlePrice: number;
  savingsPercent: number;
  savingsAmount: number;
  badge?: string;
}

// Frequently bought together data
export interface FrequentlyBoughtData {
  products: CrossSellProduct[];
  bundleDiscount: number;
}

// Color variant for quick-add
export interface ColorVariant {
  id: string;
  color: string;
  colorHex: string;
  image: string;
  price: number;
  inStock: boolean;
  isCurrentProduct: boolean;
}

// Accessory with category and relevance
export interface AccessoryProduct extends CrossSellProduct {
  category: 'storage' | 'tools' | 'upgrades' | 'maintenance';
  relevanceReason?: string;
}

// Complete cross-sell data structure
export interface CrossSellData {
  frequentlyBoughtTogether: FrequentlyBoughtData;
  quantityDiscounts: QuantityTier[];
  bundles: Bundle[];
  accessories: AccessoryProduct[];
  colorVariants: ColorVariant[];
}

// Cart state for cross-sells
export interface CrossSellCartState {
  selectedBundleProducts: string[];
  selectedQuantityTier: number;
  selectedColorVariants: string[];
  selectedAccessories: string[];
}
