import { useJsonLd, JsonLd } from './useJsonLd';
import { generateDynamicFAQs } from '@/lib/generateFilamentFAQs';

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
  spoolWeight?: number | null;
  storeName?: string | null;
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
  spoolWeight,
  storeName,
}: FilamentFAQSchemaProps) {
  const brandStr = brand || '';
  const colorPart = color ? ` ${color}` : '';
  const fullName = `${brandStr} ${productName}${colorPart}`.trim();

  // Use shared utility for the 4 dynamic Q&As
  const dynamicFaqs = generateDynamicFAQs({
    brand,
    productName: `${productName}${colorPart}`,
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
  });

  // Schema-only Q&As (not shown in the visible accordion)
  const schemaOnlyFaqs: { question: string; answer: string }[] = [];

  if (compatiblePrinterCount && compatiblePrinterCount > 0) {
    schemaOnlyFaqs.push({
      question: `What printers are compatible with ${brandStr} ${productName}?`,
      answer: `${brandStr} ${productName} is compatible with ${compatiblePrinterCount} 3D printers. View the full compatibility list on FilaScope.`,
    });
  }

  if (filaScopeScore != null) {
    schemaOnlyFaqs.push({
      question: `What is the FilaScore rating for ${brandStr} ${productName}?`,
      answer: `The FilaScore for ${brandStr} ${productName} is ${filaScopeScore.toFixed(1)}/10. This score is calculated by FilaScope based on data completeness, regional availability, technical specs, and brand reputation.`,
    });
  }

  const faqs = [...dynamicFaqs, ...schemaOnlyFaqs];

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
  return <JsonLd jsonLd={schema as any} />;
}
