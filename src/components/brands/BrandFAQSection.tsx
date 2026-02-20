import { HelpCircle } from 'lucide-react';
import { FAQSchema } from '@/components/seo/FAQSchema';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface BrandFAQSectionProps {
  brandName: string;
  productCount: number;
  materials: string[];
  // Legacy / optional: kept for backwards-compat
  avgPrice?: string;
  // New richer data props (from BrandDetail)
  priceRange?: { min: number; max: number } | null;
  topRetailers?: string[];
  regionsCovered?: string[];
  isVerified?: boolean;
  isPremium?: boolean;
  isBudgetFriendly?: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
}

function generateBrandFAQs({
  brandName,
  productCount,
  materials,
  avgPrice,
  priceRange,
  topRetailers,
  regionsCovered,
  isVerified,
  isPremium,
  isBudgetFriendly,
}: BrandFAQSectionProps): FAQItem[] {
  const materialList = materials.slice(0, 5).join(', ');
  const primaryMaterial = materials[0] || 'PLA';

  const faqs: FAQItem[] = [];

  // 1. Quality FAQ
  faqs.push({
    question: `Is ${brandName} filament good quality?`,
    answer: isPremium
      ? `Yes, ${brandName} is widely recognized as a premium filament brand known for consistent quality, tight diameter tolerances (±0.02 mm or better), and excellent print results. They are a popular choice among both hobbyists and professionals in the 3D printing community.`
      : isBudgetFriendly
      ? `${brandName} offers good quality filaments at budget-friendly prices. While they may not have all the features of premium brands, they provide reliable performance for most printing needs and are a great option for beginners and hobbyists.`
      : `${brandName} produces quality 3D printing filaments that are well-regarded in the community. With ${productCount}+ products in their catalog, they offer a diverse range of materials to suit various printing needs.`,
  });

  // 2. Where to buy FAQ
  const retailerAnswer = (() => {
    if (topRetailers && topRetailers.length > 0) {
      const retailerList = topRetailers.join(', ');
      return isVerified
        ? `You can purchase ${brandName} filament through ${retailerList}. FilaScope tracks live prices from all authorized retailers to help you find the best deal on authentic products.`
        : `${brandName} filaments are available through ${retailerList}. FilaScope compares prices across multiple stores so you always see the current best price.`;
    }
    return isVerified
      ? `You can purchase ${brandName} filament through FilaScope's verified partner links for the best prices. We track prices from official stores and authorized retailers including Amazon, ensuring you get authentic products at competitive prices.`
      : `${brandName} filaments are available through various retailers. On FilaScope, we compare prices across multiple stores including the official ${brandName} website, Amazon, and other authorized sellers to help you find the best deals.`;
  })();

  faqs.push({
    question: `Where can I buy ${brandName} filament?`,
    answer: retailerAnswer,
  });

  // 3. Materials FAQ
  faqs.push({
    question: `What materials does ${brandName} offer?`,
    answer: `${brandName} offers filaments in ${materials.length} different material${materials.length !== 1 ? 's' : ''} including ${materialList}. ${productCount > 20 ? 'Their extensive catalog' : 'Their product line'} covers a wide range of applications from basic prototyping to specialized functional parts.`,
  });

  // 4. Most popular filament
  faqs.push({
    question: `What is ${brandName}'s most popular filament?`,
    answer: `${brandName}'s ${primaryMaterial} filament is among their most popular products. ${primaryMaterial} is known for its ease of printing and versatility. Browse our catalog to see all ${productCount}+ ${brandName} products with detailed specs and pricing.`,
  });

  // 5. Price FAQ — prefer live priceRange, fall back to avgPrice string
  if (priceRange) {
    const minStr = `$${priceRange.min.toFixed(2)}`;
    const maxStr = `$${priceRange.max.toFixed(2)}`;
    faqs.push({
      question: `How much does ${brandName} filament cost?`,
      answer: `${brandName} filaments range from ${minStr} to ${maxStr} per spool (USD). Prices vary by material type, spool weight, and retailer. FilaScope tracks live prices across multiple stores to help you find the best deals on ${brandName} filaments.`,
    });
  } else if (avgPrice) {
    faqs.push({
      question: `How much does ${brandName} filament cost?`,
      answer: `${brandName} filaments typically range around ${avgPrice} per spool. Prices vary by material type and retailer. FilaScope tracks live prices across multiple stores to help you find the best deals on ${brandName} filaments.`,
    });
  }

  // 6. Regional availability FAQ — only add if brand has multi-region pricing
  if (regionsCovered && regionsCovered.length > 1) {
    const regionLabels: Record<string, string> = {
      US: 'United States', CA: 'Canada', EU: 'Europe', UK: 'United Kingdom',
      AU: 'Australia', JP: 'Japan',
    };
    const regionNames = regionsCovered.map(r => regionLabels[r] || r).join(', ');
    faqs.push({
      question: `Does ${brandName} ship internationally?`,
      answer: `Yes, ${brandName} products are available in multiple regions including ${regionNames}. FilaScope tracks regional pricing and availability so you can compare costs in your local currency.`,
    });
  }

  return faqs;
}

export function BrandFAQSection(props: BrandFAQSectionProps) {
  const faqs = generateBrandFAQs(props);

  return (
    <section className="mt-12">
      {/* SEO Schema */}
      <FAQSchema faqs={faqs} />

      {/* Visual FAQ Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-white">
            Frequently Asked Questions About {props.brandName}
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border-border"
            >
              <AccordionTrigger className="text-left text-foreground hover:text-foreground/80 hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
