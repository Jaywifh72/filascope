import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates if a string is a valid hex color code.
 * Accepts 3 or 6 character hex codes with or without # prefix.
 */
export function isValidHexColor(colorHex: string | null | undefined): boolean {
  if (!colorHex) return false;
  const hex = colorHex.startsWith('#') ? colorHex.slice(1) : colorHex;
  return /^[0-9A-Fa-f]{6}$/.test(hex) || /^[0-9A-Fa-f]{3}$/.test(hex);
}

/**
 * Normalizes a color_hex value to always include the # prefix and be uppercase.
 * Handles both formats: with # (e.g., "#FF0000") and without (e.g., "FF0000").
 * Expands 3-character shorthand to 6 characters (e.g., "F00" -> "#FF0000").
 * Returns a fallback color if the input is null/undefined or invalid.
 */
export function normalizeColorHex(colorHex: string | null | undefined, fallback: string = '#888888'): string {
  if (!colorHex) return fallback;
  
  // Remove # if present
  let hex = colorHex.startsWith('#') ? colorHex.slice(1) : colorHex;
  hex = hex.toUpperCase();
  
  // Validate and normalize
  if (/^[0-9A-F]{6}$/.test(hex)) {
    return `#${hex}`;
  } else if (/^[0-9A-F]{3}$/.test(hex)) {
    // Expand shorthand (e.g., "F00" -> "FF0000")
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }
  
  return fallback;
}
