/**
 * Sanitize user input for use in PostgreSQL ILIKE patterns.
 * Escapes the ILIKE wildcard characters % and _ to prevent
 * unexpected pattern matching or query manipulation.
 *
 * @param input - Raw user-supplied string
 * @param maxLength - Maximum allowed length (default 200)
 * @returns Sanitized string safe for ILIKE usage
 */
export function sanitizeIlikeInput(input: string, maxLength = 200): string {
  if (!input || typeof input !== 'string') return '';
  // Truncate to max length
  const trimmed = input.trim().slice(0, maxLength);
  // Escape ILIKE special characters: % and _
  return trimmed.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}
