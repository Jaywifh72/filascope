// AI-powered extraction helpers for intelligent scraping
// Uses OpenAI for real-time extraction assistance

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const AI_GATEWAY_URL = 'https://api.openai.com/v1/chat/completions';

interface BrandProfile {
  brand_slug: string;
  product_structure: string;
  variant_schema: Record<string, string>;
  swatch_type: string;
  title_format_pattern: string | null;
  color_extraction_rules: string[];
  product_line_extraction_rules: string[];
  discovered_product_lines: string[];
  discovered_colors: Array<{ name: string; hex: string }>;
  color_hex_mappings: Record<string, string>;
  material_patterns: Record<string, string[]>;
  special_cases: string[];
}

interface ShopifyVariant {
  id: number;
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  price: string;
  sku: string | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  variants: ShopifyVariant[];
  options: Array<{ name: string; values: string[] }>;
}

interface AIExtractionResult {
  value: string;
  confidence: number;
  reasoning: string;
}

async function callOpenAI(prompt: string, systemPrompt?: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.1, // Low temperature for consistent extraction
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * AI-powered color extraction from variant data
 */
export async function aiExtractColor(
  variant: ShopifyVariant,
  profile: BrandProfile | null
): Promise<AIExtractionResult> {
  const knownColors = profile?.discovered_colors?.map(c => c.name) || [];
  const colorMappings = profile?.color_hex_mappings || {};
  
  const prompt = `Extract the color name from this 3D printer filament variant.

VARIANT DATA:
- Full Title: "${variant.title}"
- Option1: "${variant.option1 || 'N/A'}"
- Option2: "${variant.option2 || 'N/A'}"
- Option3: "${variant.option3 || 'N/A'}"
- SKU: "${variant.sku || 'N/A'}"

${knownColors.length > 0 ? `KNOWN COLORS FOR THIS BRAND: ${knownColors.join(', ')}` : ''}

${profile?.color_extraction_rules?.length ? `EXTRACTION RULES:\n${profile.color_extraction_rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}` : ''}

IMPORTANT:
- Extract ONLY the color name (e.g., "Natural", "Matte Black", "Silky Lagoon")
- Do NOT include material type (PLA, PETG, etc.)
- Do NOT include size/weight (1kg, 1.75mm)
- If color appears in multiple places, prefer the most specific one

Respond with JSON:
{
  "color": "the extracted color name",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation of where you found the color"
}`;

  try {
    const response = await callOpenAI(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        value: parsed.color || 'Unknown',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'AI extraction'
      };
    }
  } catch (error) {
    console.error('AI color extraction failed:', error);
  }

  return { value: 'Unknown', confidence: 0, reasoning: 'AI extraction failed' };
}

/**
 * AI-powered product line extraction from product data
 */
export async function aiExtractProductLine(
  product: ShopifyProduct,
  profile: BrandProfile | null
): Promise<AIExtractionResult> {
  const knownLines = profile?.discovered_product_lines || [];

  const prompt = `Extract the product line from this 3D printer filament product.

PRODUCT DATA:
- Title: "${product.title}"
- Handle: "${product.handle}"
- Product Type: "${product.product_type}"
- Vendor: "${product.vendor}"
- Options: ${JSON.stringify(product.options.map(o => ({ name: o.name, values: o.values.slice(0, 5) })))}

${knownLines.length > 0 ? `KNOWN PRODUCT LINES FOR THIS BRAND: ${knownLines.join(', ')}` : ''}

${profile?.product_line_extraction_rules?.length ? `EXTRACTION RULES:\n${profile.product_line_extraction_rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}` : ''}

IMPORTANT:
- Product line is the base product name (e.g., "Standard PLA+", "Tough Pro PLA+", "Silk PLA")
- Do NOT include color or weight
- Include material type if part of the product name
- Consider the handle pattern for clues

Respond with JSON:
{
  "productLine": "the extracted product line name",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}`;

  try {
    const response = await callOpenAI(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        value: parsed.productLine || 'Unknown',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'AI extraction'
      };
    }
  } catch (error) {
    console.error('AI product line extraction failed:', error);
  }
  
  return { value: 'Unknown', confidence: 0, reasoning: 'AI extraction failed' };
}

/**
 * AI-powered hex color extraction from color name
 */
export async function aiExtractHexColor(
  colorName: string,
  profile: BrandProfile | null
): Promise<AIExtractionResult> {
  // First check known mappings
  if (profile?.color_hex_mappings?.[colorName.toLowerCase()]) {
    return {
      value: profile.color_hex_mappings[colorName.toLowerCase()],
      confidence: 1.0,
      reasoning: 'Found in brand color mappings'
    };
  }
  
  const prompt = `Determine the hex color code for this 3D printer filament color name.

COLOR NAME: "${colorName}"

BRAND CONTEXT: This is a 3D printer filament. The color name may be creative/marketing (like "Silky Lagoon" = teal/turquoise).

${profile?.discovered_colors?.length ? `KNOWN COLORS FOR REFERENCE:\n${profile.discovered_colors.map(c => `- ${c.name}: ${c.hex}`).join('\n')}` : ''}

IMPORTANT:
- Return a valid hex color code (e.g., "#FF5733")
- Consider common filament color naming conventions
- For metallics/silks, use the base color they represent
- For multi-color names (e.g., "Blue Orange Theory"), pick the dominant or first color

Respond with JSON:
{
  "hex": "#XXXXXX",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation of the color interpretation"
}`;

  try {
    const response = await callOpenAI(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const hex = parsed.hex?.toUpperCase();
      if (hex && /^#[0-9A-F]{6}$/i.test(hex)) {
        return {
          value: hex,
          confidence: parsed.confidence || 0.7,
          reasoning: parsed.reasoning || 'AI color interpretation'
        };
      }
    }
  } catch (error) {
    console.error('AI hex extraction failed:', error);
  }
  
  return { value: '#808080', confidence: 0.1, reasoning: 'AI extraction failed, using gray fallback' };
}

/**
 * AI-powered material type extraction
 */
export async function aiExtractMaterial(
  product: ShopifyProduct,
  variant: ShopifyVariant,
  profile: BrandProfile | null
): Promise<AIExtractionResult> {
  const prompt = `Extract the material type from this 3D printer filament.

PRODUCT DATA:
- Title: "${product.title}"
- Handle: "${product.handle}"
- Product Type: "${product.product_type}"

VARIANT DATA:
- Title: "${variant.title}"
- Option1: "${variant.option1 || 'N/A'}"

KNOWN MATERIAL TYPES: PLA, PLA+, PETG, ABS, ASA, TPU, Nylon, PC, PCTG, etc.

${profile?.material_patterns ? `BRAND-SPECIFIC PATTERNS: ${JSON.stringify(profile.material_patterns)}` : ''}

Respond with JSON:
{
  "material": "the extracted material type (standardized)",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}`;

  try {
    const response = await callOpenAI(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        value: parsed.material || 'PLA',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'AI extraction'
      };
    }
  } catch (error) {
    console.error('AI material extraction failed:', error);
  }
  
  return { value: 'PLA', confidence: 0.1, reasoning: 'AI extraction failed, defaulting to PLA' };
}

/**
 * Batch extraction for efficiency - processes multiple variants at once
 */
export async function aiBatchExtractColors(
  variants: ShopifyVariant[],
  profile: BrandProfile | null
): Promise<Map<number, AIExtractionResult>> {
  const results = new Map<number, AIExtractionResult>();
  
  // For efficiency, process in batches of 10
  const batchSize = 10;
  for (let i = 0; i < variants.length; i += batchSize) {
    const batch = variants.slice(i, i + batchSize);
    
    const prompt = `Extract color names from these 3D printer filament variants.

VARIANTS:
${batch.map((v, idx) => `${idx + 1}. ID:${v.id} | Title:"${v.title}" | O1:"${v.option1 || ''}" | O2:"${v.option2 || ''}" | O3:"${v.option3 || ''}"`).join('\n')}

${profile?.discovered_colors?.length ? `KNOWN COLORS: ${profile.discovered_colors.map(c => c.name).join(', ')}` : ''}

For each variant, extract ONLY the color name (not material, size, etc.).

Respond with JSON array:
[
  { "id": variant_id, "color": "color name", "confidence": 0.0-1.0 },
  ...
]`;

    try {
      const response = await callOpenAI(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        for (const item of parsed) {
          results.set(item.id, {
            value: item.color || 'Unknown',
            confidence: item.confidence || 0.5,
            reasoning: 'Batch AI extraction'
          });
        }
      }
    } catch (error) {
      console.error('AI batch extraction failed:', error);
      // Fall back to individual extraction for this batch
      for (const variant of batch) {
        const result = await aiExtractColor(variant, profile);
        results.set(variant.id, result);
      }
    }
  }
  
  return results;
}

export type { BrandProfile, ShopifyVariant, ShopifyProduct, AIExtractionResult };
