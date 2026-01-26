export interface BrandDetectionResult {
  brand: string | null;
  slug: string | null;
  sourceType: 'manufacturer' | 'retailer' | 'amazon' | 'other';
}

const URL_BRAND_PATTERNS: Array<{
  pattern: RegExp;
  brand: string | null;
  slug: string | null;
  sourceType?: 'manufacturer' | 'retailer' | 'amazon' | 'other';
}> = [
  { pattern: /store\.creality\.com/i, brand: 'Creality', slug: 'creality', sourceType: 'manufacturer' },
  { pattern: /bambulab\.com/i, brand: 'Bambu Lab', slug: 'bambu-lab', sourceType: 'manufacturer' },
  { pattern: /us\.polymaker\.com|polymaker\.com/i, brand: 'Polymaker', slug: 'polymaker', sourceType: 'manufacturer' },
  { pattern: /store\.anycubic\.com/i, brand: 'Anycubic', slug: 'anycubic', sourceType: 'manufacturer' },
  { pattern: /elegoo\.com/i, brand: 'Elegoo', slug: 'elegoo', sourceType: 'manufacturer' },
  { pattern: /esun3d\.com/i, brand: 'eSun', slug: 'esun', sourceType: 'manufacturer' },
  { pattern: /prusa3d\.com/i, brand: 'Prusament', slug: 'prusament', sourceType: 'manufacturer' },
  { pattern: /colorfabb\.com/i, brand: 'ColorFabb', slug: 'colorfabb', sourceType: 'manufacturer' },
  { pattern: /ninjatek\.com/i, brand: 'NinjaTek', slug: 'ninjatek', sourceType: 'manufacturer' },
  { pattern: /sunlu\.com/i, brand: 'Sunlu', slug: 'sunlu', sourceType: 'manufacturer' },
  { pattern: /hatchbox3d\.com/i, brand: 'Hatchbox', slug: 'hatchbox', sourceType: 'manufacturer' },
  { pattern: /overture3d\.com/i, brand: 'Overture', slug: 'overture', sourceType: 'manufacturer' },
  { pattern: /matterhackers\.com/i, brand: null, slug: null, sourceType: 'retailer' },
  { pattern: /printedsolid\.com/i, brand: null, slug: null, sourceType: 'retailer' },
  { pattern: /amazon\.(com|co\.uk|de|ca|au|fr|it|es)/i, brand: null, slug: null, sourceType: 'amazon' },
];

export function detectBrandFromUrl(url: string): BrandDetectionResult {
  if (!url) {
    return { brand: null, slug: null, sourceType: 'other' };
  }

  for (const { pattern, brand, slug, sourceType } of URL_BRAND_PATTERNS) {
    if (pattern.test(url)) {
      return {
        brand,
        slug,
        sourceType: sourceType || 'manufacturer',
      };
    }
  }

  return { brand: null, slug: null, sourceType: 'other' };
}

export const MATERIAL_OPTIONS = [
  'PLA',
  'PLA+',
  'ABS',
  'PETG',
  'TPU',
  'ASA',
  'Nylon',
  'PC',
  'PVA',
  'HIPS',
  'CF-PLA',
  'CF-PETG',
  'CF-Nylon',
  'GF-PLA',
  'GF-PETG',
  'Silk PLA',
  'Matte PLA',
  'Wood',
  'Metal',
  'Other',
] as const;

export type MaterialType = typeof MATERIAL_OPTIONS[number];
