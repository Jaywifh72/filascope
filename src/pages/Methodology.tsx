import { LegalPageLayout, LegalSection, LegalList } from "@/components/legal/LegalPageLayout";

export default function Methodology() {
  return (
    <LegalPageLayout
      title="Our Methodology"
      lastUpdated="February 6, 2026"
      breadcrumbUrl="/methodology"
      metaDescription="FilaScope Methodology - How we collect data, score products, track prices, and ensure data quality across our 3D printing filament and printer database."
    >
      <LegalSection title="How We Collect Data">
        <p>
          FilaScope aggregates information from multiple sources to build the most complete 
          picture of each product:
        </p>
        <LegalList items={[
          "Manufacturer specifications: We pull technical data directly from brand websites and published technical data sheets (TDS), including temperature ranges, mechanical properties, and recommended print settings.",
          "Retailer pricing: Prices are sourced from official brand stores and major retailers such as Amazon across six supported regions (US, CA, UK, EU, AU, JP).",
          "Community testing: User ratings, reviews, and real-world printing observations supplement manufacturer claims with practical experience.",
          "Automated scraping: Our data pipeline runs regular scans to detect price changes, new products, and stock availability updates."
        ]} />
      </LegalSection>

      <LegalSection title="Scoring System">
        <p>
          Every product on FilaScope receives a <strong className="text-foreground">FilaScope Score</strong> — a 
          composite rating from 0 to 10 (displayed to one decimal place) visible on product 
          cards and detail pages. The score reflects data richness and availability rather than 
          subjective quality judgments:
        </p>
        <LegalList items={[
          "Data Completeness (25%): How many specification fields are filled — dimensions, temperatures, mechanical properties, images, and descriptions.",
          "Price Availability (20%): Whether the product has current pricing in one or more regions.",
          "Color Variety (15%): The number of color options available for the product line.",
          "Technical Data Sheet (15%): Whether the manufacturer provides a published TDS with verified mechanical properties.",
          "Brand Verification (15%): Whether the brand is verified, has a logo, and maintains an active storefront.",
          "Regional Coverage (10%): How many of the six supported regions have pricing data for this product."
        ]} />
        <p>
          Products with fewer than two scored data points are displayed as <strong className="text-foreground">"Unrated"</strong> rather 
          than showing a potentially misleading low score.
        </p>
      </LegalSection>

      <LegalSection title="Price Tracking">
        <p>
          FilaScope monitors prices across manufacturer stores and third-party retailers to 
          help you find the best deal:
        </p>
        <LegalList items={[
          "Prices are scraped at regular intervals — typically every few hours for high-traffic brands and daily for smaller ones.",
          "Historical pricing data is retained so you can see 90-day price trends and identify all-time lows.",
          "Currency conversions use daily exchange rates from reliable financial data sources.",
          "Price drops are automatically flagged and surfaced on the Deals page.",
          "MSRP (manufacturer's suggested retail price) is tracked separately from actual store prices to show true discount depth."
        ]} />
        <p>
          Please note that prices displayed on FilaScope are approximate and may not reflect 
          real-time changes. Always confirm the final price on the retailer's website before 
          purchasing.
        </p>
      </LegalSection>

      <LegalSection title="Transmissivity Data (TD Values)">
        <p>
          Transmissivity Data (TD) measures how much light passes through a filament at a 
          given layer height. This is critical for <strong className="text-foreground">HueForge</strong> and 
          other multi-color lithophane and painting techniques:
        </p>
        <LegalList items={[
          "TD values indicate light transmission — lower values mean more opaque filament, higher values mean more translucent.",
          "Measurements are standardized at specific layer heights (typically 0.12mm or 0.16mm) for consistent comparison.",
          "FilaScope sources TD values from community-submitted measurements, manufacturer data, and curated testing databases.",
          "Products with TD data are marked on their detail pages, and you can filter by TD availability in the filament finder.",
          "Accurate TD values are essential for predicting color blending in multi-layer HueForge prints."
        ]} />
      </LegalSection>

      <LegalSection title="Data Quality">
        <p>
          Each product page displays a <strong className="text-foreground">"Data Quality"</strong> percentage 
          that tells you how complete and reliable the information is:
        </p>
        <LegalList items={[
          "The percentage reflects how many of the expected data fields are populated — specs, pricing, images, descriptions, and technical data.",
          "Higher percentages indicate more complete listings where you can make informed comparisons.",
          "Lower percentages typically mean the product is newly added or the manufacturer provides limited public information.",
          "We continuously work to improve data quality through automated enrichment, brand partnerships, and community contributions.",
          "If you notice missing or incorrect data, please report it — community feedback is one of our most valuable data quality tools."
        ]} />
        <p>
          Have questions about our data or methodology? Reach out anytime:
        </p>
        <p className="mt-2">
          <a 
            href="mailto:hello@filascope.com" 
            className="text-primary hover:underline"
          >
            hello@filascope.com
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
