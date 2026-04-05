/**
 * Social Sharing Utility Functions
 * Generates share URLs and handles clipboard operations
 */

export interface FilamentForSharing {
  brand: string | null;
  material: string | null;
  color_name: string | null;
  hue_forge_td: number | null;
  price_cad: number | null;
  id: string;
  diameter?: string | null;
  compatible_printer_count?: number | null;
}

/**
 * Generate Twitter/X share URL
 */
export function generateTwitterShare(filament: FilamentForSharing, url: string): string {
  const text = `Check out ${filament.brand} ${filament.material} - ${filament.color_name} on FilaScope! TD: ${filament.hue_forge_td}, $${filament.price_cad} CAD, ${filament.compatible_printer_count || 91}+ printer compatible.\n\nPerfect for HueForge! 🎨\n\n#3DPrinting #HueForge #FilaScope`;

  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

/**
 * Generate Mastodon share URL
 * Note: Mastodon requires user's instance, this is a base URL that will be used with instance selection modal
 */
export function generateMastodonShare(filament: FilamentForSharing, url: string): string {
  const text = `${filament.brand} ${filament.material} - ${filament.color_name}\n\nHueForge TD: ${filament.hue_forge_td}\nPrice: $${filament.price_cad} CAD\nCompatible with ${filament.compatible_printer_count || 91}+ printers\n\n${filament.color_hex || ''} • ${filament.diameter || '1.75'}mm\n\n#3DPrinting #Filament #HueForge`;

  return `https://mastodon.social/share?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

/**
 * Generate Mastodon share URL for a specific instance
 */
export function generateMastodonShareForInstance(
  filament: FilamentForSharing,
  url: string,
  instance: string
): string {
  const text = `${filament.brand} ${filament.material} - ${filament.color_name}\n\nHueForge TD: ${filament.hue_forge_td}\nPrice: $${filament.price_cad} CAD\nCompatible with ${filament.compatible_printer_count || 91}+ printers\n\n${filament.color_hex || ''} • ${filament.diameter || '1.75'}mm\n\n#3DPrinting #Filament #HueForge`;

  return `https://${instance}/share?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

/**
 * Generate Reddit share URL
 */
export function generateRedditShare(filament: FilamentForSharing, url: string): string {
  const title = `${filament.brand} ${filament.material} - ${filament.color_name} (TD: ${filament.hue_forge_td}, $${filament.price_cad} CAD)`;

  return `https://www.reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
}

/**
 * Generate embed iframe code for filament
 */
export function generateEmbedCode(
  filamentId: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): string {
  const sizes = {
    small: { width: 300, height: 250 },
    medium: { width: 400, height: 300 },
    large: { width: 500, height: 400 }
  };

  const { width, height } = sizes[size];

  return `<iframe
  src="https://filascope.com/embed/${filamentId}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border: 1px solid #ddd; border-radius: 8px;"
></iframe>`;
}

/**
 * Copy text to clipboard with error handling
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);

    // Fallback: try using document.execCommand (deprecated but works in some cases)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (fallbackError) {
      console.error('Clipboard fallback failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Get clean URL without tracking parameters
 */
export function getCleanUrl(): string {
  const url = new URL(window.location.href);
  // Strip tracking / session params, keep only path + hash
  url.search = '';
  return url.toString();
}

/**
 * Popular Mastodon instances for 3D printing
 */
export const POPULAR_MASTODON_INSTANCES = [
  'mastodon.social',
  'fosstodon.org',
  'hachyderm.io',
  '3dprinting.social',
].sort();
