// Shared brand sync routing configuration
// Used by both useBrandSyncManager and useBrandSyncRouter

// Brands with dedicated high-fidelity sync functions (use exact database slugs)
export const BRAND_SPECIFIC_FUNCTIONS = [
  '3d-fuel', '3dhojor', '3dxtech', 'amolen', 'anycubic', 'atomic-filament', 'azurefilm', 'bambu-lab', 'cc3d',
  'colorfabb', 'creality', 'duramic-3d', 'elegoo', 'eryone', 'esun', 'extrudr',
  'fiberlogy', 'fillamentum', 'flashforge', 'formfutura', 'fusion-filaments',
  'geeetech', 'gizmo-dorks', 'hatchbox', 'ic3d-printers', 'kingroon', 'matter3d',
  'ninjatek', 'numakers', 'overture', 'paramount-3d', 'polymaker',
  'proto-pasta', 'prusament', 'push-plastic', 'recreus', 'siraya-tech',
  'sovol', 'spectrum-filaments', 'sunlu', 'treed-filaments', 'ultimaker', 'voxelpla',
  'yousu', 'ziro'
] as const;

// Mapping from database slugs to edge function names (when they differ)
export const SLUG_TO_FUNCTION_MAP: Record<string, string> = {
  '3d-fuel': '3dfuel',
  'atomic-filament': 'atomic',
  'bambu-lab': 'bambulab',
  'proto-pasta': 'protopasta',
  'push-plastic': 'pushplastic',
  'siraya-tech': 'sirayatech',
  'duramic-3d': 'duramic',
  'paramount-3d': 'paramount',
  'ic3d-printers': 'ic3d',
  'treed-filaments': 'treed',
  'spectrum-filaments': 'spectrum',
  'gizmo-dorks': 'gizmodorks',
  'elegoo': 'elegoo-ca',
};

// Special brands with unique sync mechanisms (have dedicated UI tabs)
// Note: Elegoo moved to BRAND_SPECIFIC_FUNCTIONS with CSV-seeded sync
export const SPECIAL_BRANDS: readonly string[] = [];

// Normalize database slug to edge function name
export function normalizeSlugForFunction(brandSlug: string): string {
  return SLUG_TO_FUNCTION_MAP[brandSlug] || brandSlug;
}

// Get the edge function name for a brand
export function getEdgeFunctionName(brandSlug: string): string {
  const functionSlug = normalizeSlugForFunction(brandSlug);
  return `sync-${functionSlug}-products`;
}

// Check if a brand has a dedicated sync function
export function hasBrandSpecificFunction(brandSlug: string): boolean {
  return BRAND_SPECIFIC_FUNCTIONS.includes(brandSlug as any);
}

// Determine sync type for a brand
export function detectSyncType(brandSlug: string): 'specific' | 'special' | 'generic' {
  if (SPECIAL_BRANDS.includes(brandSlug as any)) return 'special';
  if (hasBrandSpecificFunction(brandSlug)) return 'specific';
  return 'generic';
}
