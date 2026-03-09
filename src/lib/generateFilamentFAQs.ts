export interface GenerateDynamicFAQsParams {
  brand?: string | null;
  productName?: string | null;
  material?: string | null;
  nozzleTempMin?: number | null;
  nozzleTempMax?: number | null;
  bedTempMin?: number | null;
  bedTempMax?: number | null;
  transmissionDistance?: number | null;
  price?: number | null;
  color?: string | null;
  spoolWeight?: number | null;
  storeName?: string | null;
}

export interface FAQItem {
  question: string;
  answer: string;
}

// Material difficulty assessments
function getMaterialDifficulty(matUpper: string): { assessment: string; level: string; beginnerFriendly: boolean } {
  if (matUpper.startsWith('PLA')) {
    return { assessment: 'is one of the easiest materials to print with no heated enclosure required', level: 'beginner-friendly', beginnerFriendly: true };
  }
  if (matUpper.includes('PETG')) {
    return { assessment: 'is slightly more advanced than PLA but still accessible, offering better heat and chemical resistance', level: 'beginner-friendly', beginnerFriendly: true };
  }
  if (matUpper.includes('TPU') || matUpper.includes('TPE')) {
    return { assessment: 'is a flexible material requiring a direct-drive extruder and slower print speeds', level: 'intermediate', beginnerFriendly: false };
  }
  if (matUpper.includes('ABS') || matUpper.includes('ASA')) {
    return { assessment: 'requires an enclosed printer and proper ventilation due to fume emissions', level: 'intermediate', beginnerFriendly: false };
  }
  if (matUpper.includes('NYLON') || matUpper.includes('PA')) {
    return { assessment: 'is hygroscopic and requires dry storage, an enclosure, and careful temperature management', level: 'advanced', beginnerFriendly: false };
  }
  if (matUpper.includes('PC')) {
    return { assessment: 'requires high temperatures (260–310°C), an enclosure, and experience with warping management', level: 'advanced', beginnerFriendly: false };
  }
  return { assessment: 'may require specific print settings — check the recommended temperatures and printer requirements', level: 'varies', beginnerFriendly: false };
}

// Estimated TD ranges by material/color for fallback
function getEstimatedTDRange(material: string | null, color: string | null): { low: number; high: number } | null {
  const mat = (material || '').toUpperCase();
  const col = (color || '').toLowerCase();

  if (!mat.includes('PLA') && !mat.includes('PETG')) return null;

  if (col.includes('white') || col.includes('natural')) return { low: 2.0, high: 5.0 };
  if (col.includes('black')) return { low: 0.4, high: 1.2 };
  if (col.includes('red') || col.includes('orange') || col.includes('yellow')) return { low: 1.5, high: 4.0 };
  if (col.includes('blue') || col.includes('green')) return { low: 1.0, high: 3.5 };
  if (col.includes('clear') || col.includes('transparent')) return { low: 5.0, high: 9.0 };
  if (mat.includes('SILK')) return { low: 3.0, high: 7.0 };
  return { low: 1.0, high: 5.0 };
}

// TD rating based on value
function getTDRating(td: number): string {
  if (td <= 1.5) return 'very opaque';
  if (td <= 3.0) return 'moderately opaque';
  if (td <= 5.0) return 'semi-translucent';
  if (td <= 7.0) return 'translucent';
  return 'highly translucent';
}

// Material average prices (approximate, for comparison text)
const MATERIAL_AVG_PRICES: Record<string, number> = {
  PLA: 22, PETG: 25, ABS: 24, ASA: 30, TPU: 32, NYLON: 38, PA: 38, PC: 45,
};

function getMaterialAvgPrice(material: string | null): number | null {
  if (!material) return null;
  const upper = material.toUpperCase();
  for (const [key, val] of Object.entries(MATERIAL_AVG_PRICES)) {
    if (upper.includes(key)) return val;
  }
  return null;
}

export function generateDynamicFAQs({
  brand,
  productName,
  material,
  nozzleTempMin,
  nozzleTempMax,
  bedTempMin,
  bedTempMax,
  transmissionDistance,
  price,
  color,
  spoolWeight,
  storeName,
}: GenerateDynamicFAQsParams): FAQItem[] {
  const brandStr = brand || '';
  const nameStr = productName || '';
  const fullName = [brandStr, nameStr].filter(Boolean).join(' ');
  const mat = material || 'filament';
  const matUpper = (material || '').toUpperCase();
  const faqs: FAQItem[] = [];

  // 1. Temperature question — only if both nozzle temps exist
  if (nozzleTempMin != null && nozzleTempMax != null) {
    let answer = `According to FilaScope's specification data, ${fullName} prints best at a nozzle temperature of ${nozzleTempMin}–${nozzleTempMax}°C`;
    if (bedTempMin != null && bedTempMax != null) {
      answer += ` with a bed temperature of ${bedTempMin}–${bedTempMax}°C`;
    }
    answer += `. Start at ${nozzleTempMin}°C and increase by 5°C increments if you see poor layer adhesion.`;
    // Add enclosure note for materials that need it
    if (matUpper.includes('ABS') || matUpper.includes('ASA') || matUpper.includes('PC') || matUpper.includes('NYLON') || matUpper.includes('PA')) {
      answer += ' An enclosure is recommended for consistent results.';
    }
    answer += ` Compare temperature settings across similar ${mat} filaments on FilaScope.`;
    faqs.push({
      question: `What temperature should I print ${fullName} at?`,
      answer,
    });
  }

  // 2. TD question — always generated
  const td = transmissionDistance;
  if (td != null) {
    const rating = getTDRating(td);
    let tdContext: string;
    if (td <= 2) {
      tdContext = 'This makes it ideal for dark or base layers in HueForge prints where opacity is needed.';
    } else if (td <= 4) {
      tdContext = 'This provides balanced opacity, good for mid-tone layers in HueForge prints.';
    } else if (td <= 6) {
      tdContext = 'This is suitable for highlight layers in HueForge and lithophane printing where light transmission is desired.';
    } else {
      tdContext = 'This is excellent for light-transmitting layers in lithophanes and HueForge projects.';
    }
    faqs.push({
      question: `What is the TD value of ${fullName}?`,
      answer: `According to FilaScope's HueForge TD database, ${fullName} has a transmission distance of ${td}mm, making it ${rating} for lithophane and HueForge projects. ${tdContext} Compare TD values across all ${mat} filaments in FilaScope's HueForge TD Database.`,
    });
  } else {
    const estimated = getEstimatedTDRange(material, color);
    const colorStr = color ? ` in ${color}` : '';
    if (estimated) {
      faqs.push({
        question: `What is the TD value of ${fullName}?`,
        answer: `${fullName}'s TD value has not yet been measured. Based on FilaScope's data for similar ${mat} filaments${colorStr}, typical TD values range from ${estimated.low.toFixed(1)}–${estimated.high.toFixed(1)}mm. Check FilaScope's HueForge TD Database for filaments with confirmed measurements.`,
      });
    } else {
      faqs.push({
        question: `What is the TD value of ${fullName}?`,
        answer: `${fullName}'s TD value has not yet been measured. Check FilaScope's HueForge TD Database for ${mat} filaments with confirmed transmission distance measurements.`,
      });
    }
  }

  // 3. Beginner question — varies by material
  const difficulty = getMaterialDifficulty(matUpper);
  let beginnerAnswer = `${fullName} uses ${mat}, which ${difficulty.assessment}.`;
  if (difficulty.beginnerFriendly && nozzleTempMin != null && nozzleTempMax != null) {
    const bedReq = (bedTempMin != null && bedTempMax != null)
      ? `${bedTempMin}–${bedTempMax}°C bed temperature`
      : 'minimal bed heating';
    beginnerAnswer += ` Its print temperature of ${nozzleTempMin}–${nozzleTempMax}°C and ${bedReq} make it accessible for beginners.`;
  } else if (!difficulty.beginnerFriendly) {
    beginnerAnswer += ` For beginners, consider starting with a standard PLA filament — browse FilaScope's PLA catalog for beginner-friendly options.`;
  }
  beginnerAnswer += ` FilaScope rates this as a ${difficulty.level} material.`;
  faqs.push({
    question: `Is ${fullName} good for beginners?`,
    answer: beginnerAnswer,
  });

  // 4. Price question
  if (price != null && price > 0) {
    const weightStr = spoolWeight ? `${spoolWeight >= 1000 ? `${(spoolWeight / 1000).toFixed(1)}kg` : `${spoolWeight}g`} spool` : 'spool';
    const pricePerGram = spoolWeight && spoolWeight > 0 ? (price / (spoolWeight >= 1000 ? spoolWeight : spoolWeight)).toFixed(3) : null;
    const storeStr = storeName ? ` (${storeName})` : '';
    let answer = `Based on FilaScope's real-time price tracking, ${fullName} is currently available from $${price.toFixed(2)}/kg${storeStr} for a ${weightStr}`;
    if (pricePerGram && spoolWeight) {
      const ppg = (price / 1000).toFixed(3);
      answer += `, which works out to $${ppg}/g`;
    }
    answer += '.';

    const avgPrice = getMaterialAvgPrice(material);
    if (avgPrice) {
      const diff = price - avgPrice;
      const comparison = Math.abs(diff) < 3 ? 'near' : diff > 0 ? 'above' : 'below';
      answer += ` This is ${comparison} the average price of $${avgPrice}/kg for ${mat} filaments.`;
    }
    answer += ` Check FilaScope's Deals page for the latest discounts.`;

    faqs.push({
      question: `How much does ${fullName} cost?`,
      answer,
    });
  } else {
    faqs.push({
      question: `How much does ${fullName} cost?`,
      answer: `Pricing for ${fullName} varies by retailer and region. Based on FilaScope's real-time price tracking across 15+ stores in 5 regions, check FilaScope for up-to-date pricing and availability.`,
    });
  }

  // 5. NEW: Comparison question
  {
    const avgPrice = getMaterialAvgPrice(material);
    let answer = `According to FilaScope's database, it tracks hundreds of ${mat} filaments from dozens of brands.`;
    if (price != null && price > 0 && avgPrice) {
      answer += ` ${fullName} is priced at $${price.toFixed(2)}/kg compared to the ${mat} average of $${avgPrice}/kg.`;
    }
    if (td != null) {
      const rating = getTDRating(td);
      answer += ` Its TD value of ${td}mm makes it ${rating} among ${mat} filaments for HueForge projects.`;
    }
    answer += ` Use FilaScope's comparison tool to see how it stacks up against specific alternatives.`;
    faqs.push({
      question: `How does ${fullName} compare to other ${mat} filaments?`,
      answer,
    });
  }

  return faqs;
}
