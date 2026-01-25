import { RegionCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';

/**
 * Get region from URL search params
 * Returns null if no valid region is found
 */
export function getRegionFromUrl(): RegionCode | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const region = params.get('region');
    
    if (region && REGIONS[region as RegionCode]) {
      return region as RegionCode;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Set region in URL without triggering navigation
 * Uses history.replaceState to avoid adding history entries
 */
export function setRegionInUrl(region: RegionCode): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('region', region);
    window.history.replaceState({}, '', url.toString());
  } catch (e) {
    // Ignore errors in environments without history API
    console.warn('Could not update URL with region:', e);
  }
}

/**
 * Remove region from URL
 */
export function removeRegionFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('region');
    window.history.replaceState({}, '', url.toString());
  } catch (e) {
    // Ignore errors
  }
}

/**
 * Build a shareable URL with region parameter
 */
export function buildRegionalUrl(path: string, region: RegionCode): string {
  try {
    const baseUrl = window.location.origin;
    const url = new URL(path, baseUrl);
    url.searchParams.set('region', region);
    return url.toString();
  } catch (e) {
    return path;
  }
}
