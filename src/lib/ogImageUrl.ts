const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export interface OgImageParams {
  type: 'product' | 'brand' | 'guide' | 'default';
  title: string;
  subtitle?: string;
  price?: string;
  color?: string;
  image?: string;
}

/**
 * Build a dynamic OG image URL for social media previews.
 * Truncates title to prevent excessively long URLs.
 */
export function buildOgImageUrl(params: OgImageParams): string {
  const url = new URL(`${FUNCTIONS_URL}/og-image`);
  url.searchParams.set('type', params.type);
  url.searchParams.set('title', params.title.slice(0, 60));
  if (params.subtitle) url.searchParams.set('subtitle', params.subtitle.slice(0, 80));
  if (params.price) url.searchParams.set('price', params.price);
  if (params.color) url.searchParams.set('color', params.color);
  if (params.image) url.searchParams.set('image', params.image);
  return url.toString();
}
