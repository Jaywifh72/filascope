export const DEFAULT_USER_AGENT = "Mozilla/5.0 (compatible; FilaScope/1.0; +https://filascope.com)";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Attempt ${attempt + 1}/${maxRetries} failed: ${lastError.message}`);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("All retries failed");
}

export function extractPrice(text: string): number | null {
  if (!text) return null;

  // Common price patterns
  const patterns = [
    /\$\s*([\d,]+\.?\d*)/,        // $29.99
    /USD\s*([\d,]+\.?\d*)/i,      // USD 29.99
    /([\d,]+\.?\d*)\s*USD/i,      // 29.99 USD
    /€\s*([\d,]+\.?\d*)/,         // €29.99
    /EUR\s*([\d,]+\.?\d*)/i,      // EUR 29.99
    /([\d,]+\.?\d*)\s*€/,         // 29.99€
    /£\s*([\d,]+\.?\d*)/,         // £29.99
    /price["\s:]+\s*([\d,]+\.?\d*)/i, // price: 29.99
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(price) && price > 0 && price < 10000) {
        return price;
      }
    }
  }

  return null;
}

export function extractAvailability(html: string): boolean {
  const outOfStockPatterns = [
    /out\s*of\s*stock/i,
    /sold\s*out/i,
    /unavailable/i,
    /currently\s*unavailable/i,
    /"availability":\s*"OutOfStock"/i,
    /"inStock":\s*false/i,
  ];

  const inStockPatterns = [
    /in\s*stock/i,
    /add\s*to\s*cart/i,
    /"availability":\s*"InStock"/i,
    /"inStock":\s*true/i,
  ];

  for (const pattern of outOfStockPatterns) {
    if (pattern.test(html)) {
      return false;
    }
  }

  for (const pattern of inStockPatterns) {
    if (pattern.test(html)) {
      return true;
    }
  }

  return true; // Default to available
}

export function convertCurrency(price: number, exchangeRate: number): number {
  return Math.round(price * exchangeRate * 100) / 100;
}

export function calculateHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function cleanProductTitle(title: string): string {
  return title
    .replace(/\s+/g, " ")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .trim();
}

export function extractSku(text: string): string | null {
  const patterns = [
    /sku[:\s]+([A-Z0-9-]+)/i,
    /item[:\s#]+([A-Z0-9-]+)/i,
    /model[:\s#]+([A-Z0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}
