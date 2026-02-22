export interface FilamentProperties {
  heat_resistance_c: number | null;
  glass_transition_c: number | null;
  flexibility_score: number | null;
  layer_adhesion_score: number | null;
  uv_resistance_score: number | null;
  warping_risk: 'low' | 'medium' | 'high' | null;
  enclosure_required: boolean;
  food_safe: boolean;
  outdoor_suitable: boolean;
  abrasive: boolean;
  drying_required: boolean;
  translucency: 'opaque' | 'translucent' | 'transparent' | null;
}

export interface FilamentUseCase {
  use_case: string;
  suitability: 'ideal' | 'good' | 'acceptable' | 'not_recommended';
}

export interface FilamentSearchResult {
  id: string;
  name: string;
  slug: string;
  score: number;
  matchReasons: string[];
  brand: { id: string; name: string };
  materialType: { name: string };
  properties: FilamentProperties | null;
  useCases: FilamentUseCase[];
  price: { price: number; currency: string; in_stock: boolean } | null;
}

export interface SearchIntent {
  material_types: string[];
  min_heat_resistance_c: number | null;
  use_cases: string[];
  require_traits: string[];
  avoid_weaknesses: string[];
  printer_constraints: { no_enclosure: boolean; standard_nozzle_only: boolean };
  explanation: string;
  semantic_query: string;
}
