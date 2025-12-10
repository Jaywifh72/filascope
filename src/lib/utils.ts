import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes a color_hex value to always include the # prefix.
 * Handles both formats: with # (e.g., "#FF0000") and without (e.g., "FF0000").
 * Returns a fallback color if the input is null/undefined.
 */
export function normalizeColorHex(colorHex: string | null | undefined, fallback: string = '#888888'): string {
  if (!colorHex) return fallback;
  return colorHex.startsWith('#') ? colorHex : `#${colorHex}`;
}
