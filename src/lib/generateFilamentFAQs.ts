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
}

export interface FAQItem {
  question: string;
  answer: string;
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
}: GenerateDynamicFAQsParams): FAQItem[] {
  const brandStr = brand || '';
  const nameStr = productName || '';
  const fullName = [brandStr, nameStr].filter(Boolean).join(' ');
  const mat = material || 'filament';
  const faqs: FAQItem[] = [];

  // 1. Temperature question — only if both nozzle temps exist
  if (nozzleTempMin != null && nozzleTempMax != null) {
    let answer = `The recommended nozzle temperature for ${fullName} is ${nozzleTempMin}–${nozzleTempMax}°C`;
    if (bedTempMin != null && bedTempMax != null) {
      answer += ` with a bed temperature of ${bedTempMin}–${bedTempMax}°C`;
    }
    answer += '. Start at the lower end of the range and increase if you experience poor layer adhesion.';
    faqs.push({
      question: `What temperature should I print ${fullName} at?`,
      answer,
    });
  }

  // 2. TD question — always generated
  const td = transmissionDistance;
  if (td != null) {
    let tdDesc: string;
    if (td <= 2) {
      tdDesc = 'This makes it very opaque, ideal for dark/base layers in HueForge prints.';
    } else if (td <= 4) {
      tdDesc = 'This provides balanced opacity, good for mid-tone layers in HueForge prints.';
    } else if (td <= 6) {
      tdDesc = 'This is moderately translucent, suitable for highlight layers in HueForge and lithophane printing.';
    } else {
      tdDesc = 'This is highly translucent, excellent for light-transmitting layers in lithophanes and HueForge projects.';
    }
    faqs.push({
      question: `What is the TD value of ${fullName}?`,
      answer: `Based on FilaScope's HueForge TD database, which tracks transmission distance values for 500+ filaments, ${fullName} has a TD of ${td}. ${tdDesc}`,
    });
  } else {
    faqs.push({
      question: `What is the TD value of ${fullName}?`,
      answer: `TD data for ${fullName} has not yet been verified. Check FilaScope's HueForge TD Database for filaments with confirmed transmissivity values.`,
    });
  }

  // 3. Beginner question — always generated, varies by material
  const matUpper = (material || '').toUpperCase();
  let beginnerAnswer: string;
  if (matUpper.startsWith('PLA')) {
    beginnerAnswer = `${fullName} uses ${mat}, which is one of the easiest materials to print. It works well with most consumer 3D printers and requires no heated enclosure.`;
  } else if (matUpper.includes('PETG')) {
    beginnerAnswer = `${fullName} uses PETG, which is slightly more advanced than PLA but still beginner-friendly. It offers better heat and chemical resistance.`;
  } else if (
    matUpper.includes('ABS') ||
    matUpper.includes('ASA') ||
    matUpper.includes('NYLON') ||
    matUpper.includes('PA') ||
    matUpper.includes('PC')
  ) {
    beginnerAnswer = `${fullName} uses ${mat}, which requires more experience. An enclosed printer and proper ventilation are recommended.`;
  } else if (matUpper.includes('TPU') || matUpper.includes('TPE')) {
    beginnerAnswer = `${fullName} uses TPU flexible filament, which requires a direct-drive extruder and slower print speeds. It's moderately challenging for beginners.`;
  } else {
    beginnerAnswer = `${fullName} uses ${mat}. Check the recommended print settings and consider starting with a more common material like PLA if you're new to 3D printing.`;
  }
  faqs.push({
    question: `Is ${fullName} good for beginners?`,
    answer: beginnerAnswer,
  });

  // 4. Price question — only if price > 0
  if (price != null && price > 0) {
    faqs.push({
      question: `How much does ${fullName} cost?`,
      answer: `Based on FilaScope's real-time price tracking across 15+ stores in 5 regions, ${fullName} is currently available from $${price.toFixed(2)}/kg. Check FilaScope for pricing across multiple retailers in your region.`,
    });
  } else if (price === null || price === undefined) {
    faqs.push({
      question: `How much does ${fullName} cost?`,
      answer: `Pricing for ${fullName} varies by retailer and region. Visit FilaScope for up-to-date pricing and availability.`,
    });
  }

  return faqs;
}
