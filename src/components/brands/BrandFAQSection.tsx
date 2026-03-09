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
  // New comparative props
  tdCount?: number;
  topMaterialCategory?: string | null;
  topMaterialCategoryCount?: number;
  colorCount?: number;
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
  tdCount,
  topMaterialCategory,
  topMaterialCategoryCount,
  colorCount,
}: BrandFAQSectionProps): FAQItem[] {
  const materialList = materials.slice(0, 5).join(', ');
  const primaryMaterial = materials[0] || 'PLA';

  const faqs: FAQItem[] = [];

  // 1. Quality FAQ
  faqs.push({
    question: `Is ${brandName} filament good quality?`,
    answer: isPremium
      ? `According to FilaScope's database of 8,200+ filaments from 48+ brands, ${brandName} is widely recognized as a premium filament brand known for consistent quality, tight diameter tolerances (±0.02 mm or better), and excellent print results. They are a popular choice among both hobbyists and professionals in the 3D printing community.`
      : isBudgetFriendly
      ? `Based on FilaScope's real-time price tracking across 15+ stores in 5 regions, ${brandName} offers good quality filaments at budget-friendly prices. While they may not have all the features of premium brands, they provide reliable performance for most printing needs and are a great option for beginners and hobbyists.`
      : `According to FilaScope's database of 8,200+ filaments from 48+ brands, ${brandName} produces quality 3D printing filaments that are well-regarded in the community. With ${productCount}+ products in their catalog, they offer a diverse range of materials to suit various printing needs.`,
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
      answer: `Based on FilaScope's real-time price tracking across 15+ stores in 5 regions, ${brandName} filaments range from ${minStr} to ${maxStr} per spool (USD). Prices vary by material type, spool weight, and retailer.`,
    });
  } else if (avgPrice) {
    faqs.push({
      question: `How much does ${brandName} filament cost?`,
      answer: `Based on FilaScope's real-time price tracking across 15+ stores in 5 regions, ${brandName} filaments typically range around ${avgPrice} per spool. Prices vary by material type and retailer.`,
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

  // ── NEW comparative FAQs ──

  // 7. Brand comparison FAQ
  {
    const priceTier = isPremium ? 'premium' : isBudgetFriendly ? 'budget' : 'mid-range';
    let answer = `According to FilaScope's database, ${brandName} offers ${productCount} filaments across ${materials.length} material type${materials.length !== 1 ? 's' : ''}`;
    if (priceRange) {
      answer += `, priced from $${priceRange.min.toFixed(2)} to $${priceRange.max.toFixed(2)} per spool`;
    }
    answer += `. Compared to the market average, ${brandName} is positioned as a ${priceTier} brand. FilaScope tracks 48+ filament brands — use the comparison tool to compare specific ${brandName} products against alternatives.`;
    faqs.push({
      question: `How does ${brandName} compare to other filament brands?`,
      answer,
    });
  }

  // 8. Quality detail FAQ (spec-focused)
  {
    // Build unique selling points from available data
    const usps: string[] = [];
    if (colorCount && colorCount > 10) {
      usps.push(`a wide color selection with ${colorCount}+ colors`);
    }
    if (tdCount && tdCount > 0) {
      usps.push(`HueForge TD values available for ${tdCount} products`);
    }
    if (materials.length >= 5) {
      usps.push(`versatility across ${materials.length} material types`);
    }

    const toleranceStr = isPremium ? '±0.02mm' : '±0.03mm (typical)';
    const uspStr = usps.length > 0 ? usps.join(', ') : `${productCount}+ products across multiple material types`;

    faqs.push({
      question: `Is ${brandName} filament good quality?`,
      answer: `Based on FilaScope's specification data, ${brandName} filaments have a diameter tolerance of ${toleranceStr} and offer ${uspStr}. ${brandName} is one of 48+ brands tracked on FilaScope, where you can compare detailed specs, real-time pricing, and user data across their full product line.`,
    });
  }

  // 9. Best filament FAQ
  {
    const topCat = topMaterialCategory || primaryMaterial;
    const topCatCount = topMaterialCategoryCount || 0;
    let answer = `Among ${brandName}'s ${productCount} filaments on FilaScope, their ${topCat} line is the most comprehensive`;
    if (topCatCount > 0) {
      answer += ` with ${topCatCount} options`;
    }
    answer += '.';
    if (priceRange) {
      answer += ` Their most affordable option starts at $${priceRange.min.toFixed(2)}, while their premium products go up to $${priceRange.max.toFixed(2)}.`;
    }
    if (tdCount && tdCount > 0) {
      answer += ` ${brandName} has ${tdCount} filaments with verified HueForge TD values.`;
    }
    answer += ` Browse all ${brandName} filaments on FilaScope to filter by material, price, or color.`;
    faqs.push({
      question: `What is ${brandName}'s best filament?`,
      answer,
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

        <Accordion type="single" collapsible className="w-full space-y-1">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border-border rounded-lg overflow-hidden transition-all duration-200"
            >
              <AccordionTrigger className="text-left text-foreground hover:text-foreground/80 hover:no-underline py-4 px-1">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent forceMount className="data-[state=closed]:hidden pb-4 px-1">
                <div className="border-l-2 border-cyan-500/20 pl-4 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
