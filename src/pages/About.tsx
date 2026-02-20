import { LegalPageLayout, LegalSection, LegalList } from "@/components/legal/LegalPageLayout";

export default function About() {
  return (
    <LegalPageLayout
      title="About FilaScope"
      lastUpdated="February 6, 2026"
      breadcrumbUrl="/about"
      metaDescription="About FilaScope - Helping 3D printing enthusiasts worldwide find the right materials at the best prices with comprehensive filament and printer data."
    >
      <LegalSection title="Our Mission">
        <p>
          FilaScope exists to help 3D printing enthusiasts worldwide find the right materials 
          at the best prices. Whether you're a hobbyist dialing in your first benchy or a 
          professional running a print farm, we believe everyone deserves access to clear, 
          accurate, and comparable product information.
        </p>
        <p>
          The 3D printing materials market is fragmented — hundreds of brands, thousands of 
          SKUs, and wildly inconsistent specifications. We built FilaScope to cut through that 
          noise and give you a single place to search, compare, and decide.
        </p>
      </LegalSection>

      <LegalSection title="What We Do">
        <p>
          FilaScope maintains a comprehensive database of 3D printing filaments and printers 
          with regional pricing across multiple markets:
        </p>
        <LegalList items={[
          "8,000+ materials indexed across PLA, PETG, ABS, TPU, ASA, Nylon, and specialty filaments.",
          "48 brands tracked with direct pricing from manufacturer stores and major retailers.",
          "6 supported regions — US, CA, UK, EU, AU, and JP — with localized pricing and currency conversion.",
          "Printer database with detailed specifications, regional MSRP, and accessory compatibility.",
          "HueForge transmissivity data (TD values) to help multi-color printing enthusiasts pick the right filament."
        ]} />
      </LegalSection>

      <LegalSection title="How It Works">
        <p>
          Our data pipeline combines multiple sources to keep information fresh and reliable:
        </p>
        <LegalList items={[
          "Manufacturer specifications are sourced directly from brand websites and technical data sheets.",
          "Retailer pricing is monitored across official stores and major marketplaces like Amazon.",
          "Prices are updated regularly through automated scraping and manual verification.",
          "Community contributions help us catch errors, fill gaps, and surface real-world printing insights.",
          "Exchange rates are refreshed daily for accurate cross-region price comparisons."
        ]} />
      </LegalSection>

      <LegalSection title="The Team">
        <p>
          FilaScope is built and maintained by a small team of 3D printing enthusiasts and 
          software engineers who got tired of opening dozens of browser tabs just to compare 
          filament prices. What started as a personal spreadsheet grew into the platform you 
          see today.
        </p>
        <p>
          We're committed to keeping FilaScope free, independent, and community-driven. If 
          you have feedback, spotted an error, or want to contribute, we'd love to hear from you:
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
