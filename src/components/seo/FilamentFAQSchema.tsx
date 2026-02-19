import { useJsonLd } from './useJsonLd';

interface FilamentFAQSchemaProps {
  brand: string | null;
  productName: string;
  color: string | null;
  material: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  transmissionDistance: number | null;
  price: number | null;
  regionName: string;
  filaScopeScore: number | null;
  compatiblePrinterCount: number | null;
}

export function FilamentFAQSchema({
  brand,
  productName,
  color,
  material,
  nozzleTempMin,
  nozzleTempMax,
  bedTempMin,
  bedTempMax,
  transmissionDistance,
  price,
  regionName,
  filaScopeScore,
  compatiblePrinterCount,
}: FilamentFAQSchemaProps) {
  const brandStr = brand || '';
  const colorPart = color ? ` ${color}` : '';
  const fullName = `${brandStr} ${productName}${colorPart}`.trim();
  const mat = material || 'filament';

  const faqs: { question: string; answer: string }[] = [];

  // Nozzle temp FAQ
  if (nozzleTempMin && nozzleTempMax) {
    const mid = Math.round((nozzleTempMin + nozzleTempMax) / 2);
    faqs.push({
      question: `What nozzle temperature should I use for ${fullName}?`,
      answer: `The recommended nozzle temperature range for ${fullName} is ${nozzleTempMin}–${nozzleTempMax}°C. Start at ${mid}°C and adjust based on your results.`,
    });
  }

  // Bed temp FAQ
  if (bedTempMin && bedTempMax) {
    faqs.push({
      question: `What bed temperature is best for ${fullName}?`,
      answer: `The recommended bed temperature for ${fullName} is ${bedTempMin}–${bedTempMax}°C.`,
    });
  }

  // Price FAQ
  if (price && price > 0) {
    faqs.push({
      question: `How much does ${fullName} cost?`,
      answer: `${fullName} is available from $${price.toFixed(2)}/kg in ${regionName}. FilaScope compares prices from multiple retailers to help you find the best deal.`,
    });
  }

  // Compatible printers FAQ
  if (compatiblePrinterCount && compatiblePrinterCount > 0) {
    faqs.push({
      question: `What printers are compatible with ${brandStr} ${productName}?`,
      answer: `${brandStr} ${productName} is compatible with ${compatiblePrinterCount} 3D printers. View the full compatibility list on FilaScope.`,
    });
  }

  // Beginner FAQ
  const easyMaterials = ['PLA', 'PLA+', 'PETG'];
  const isEasy = easyMaterials.some(m => material?.toUpperCase().startsWith(m));
  faqs.push({
    question: `Is ${fullName} good for beginners?`,
    answer: isEasy
      ? `Yes, ${mat} is one of the easiest materials to print with, making ${fullName} a great choice for beginners.`
      : `${mat} requires more experience to print reliably. Beginners may want to start with PLA before attempting ${fullName}.`,
  });

  // TD value FAQ
  if (transmissionDistance != null) {
    const td = transmissionDistance;
    const tdInterp = td < 2
      ? 'highly opaque, ideal for dark base layers'
      : td < 4
        ? 'semi-opaque, versatile for most HueForge projects'
        : 'translucent, ideal for light-passing highlight layers';
    faqs.push({
      question: `What is the TD (Transmission Distance) value for ${fullName}?`,
      answer: `The TD value for ${fullName} is ${td}. This measures how light passes through the filament, which is essential for HueForge color mixing and lithophane printing. A TD of ${td} means it is ${tdInterp}.`,
    });
    faqs.push({
      question: `Is ${fullName} good for HueForge?`,
      answer: `Yes, ${fullName} has a verified TD value of ${td}, making it a suitable choice for HueForge lithophane printing. TD values between 1.0–4.0 are most commonly used for base and highlight layers.`,
    });
  } else {
    faqs.push({
      question: `Is ${fullName} good for HueForge?`,
      answer: `TD data has not yet been measured for ${fullName}. Check back on FilaScope as we continuously add new TD measurements to our HueForge database.`,
    });
  }

  // FilaScore FAQ
  if (filaScopeScore != null) {
    faqs.push({
      question: `What is the FilaScore rating for ${brandStr} ${productName}?`,
      answer: `The FilaScore for ${brandStr} ${productName} is ${filaScopeScore.toFixed(1)}/10. This score is calculated by FilaScope based on data completeness, regional availability, technical specs, and brand reputation.`,
    });
  }

  const schema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  useJsonLd(schema as any);
  return null;
}
