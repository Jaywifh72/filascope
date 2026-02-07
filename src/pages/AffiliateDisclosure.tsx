import { LegalPageLayout, LegalSection, LegalList } from "@/components/legal/LegalPageLayout";

export default function AffiliateDisclosure() {
  return (
    <LegalPageLayout
      title="Affiliate Disclosure"
      lastUpdated="February 7, 2026"
      metaDescription="FilaScope Affiliate Disclosure - Transparency about how we earn commissions from affiliate links while maintaining editorial independence."
    >
      <LegalSection title="Transparency Statement">
        <p>
          At FilaScope, we believe in complete transparency with our users. This page explains 
          how we earn revenue through affiliate partnerships and how this relates to the content 
          and recommendations you see on our site.
        </p>
        <p>
          <strong className="text-foreground">In short:</strong> When you click on certain links 
          to retailers on FilaScope and make a purchase, we may earn a commission at no additional 
          cost to you. This revenue helps us maintain and improve our filament comparison service.
        </p>
      </LegalSection>

      <LegalSection title="How Affiliate Links Work">
        <p>
          Many of the product links on FilaScope are affiliate links. This means:
        </p>
        <LegalList items={[
          "When you click a link to a retailer, a small tracking code identifies that you came from FilaScope.",
          "If you make a purchase (usually within a certain time window), we receive a small commission.",
          "This commission comes from the retailer, not from you—you pay the same price regardless.",
          "Not all links on our site are affiliate links; we link to useful resources without affiliate relationships too."
        ]} />
      </LegalSection>

      <LegalSection title="Editorial Independence">
        <p>
          <strong className="text-foreground">Our affiliate relationships do not influence our 
          content, rankings, or recommendations.</strong>
        </p>
        <LegalList items={[
          "Filament scores and rankings are based on objective criteria: specifications, user ratings, and data quality.",
          "We do not accept payment from brands to improve their ranking or visibility.",
          "Products from retailers without affiliate programs are displayed alongside those with affiliate links.",
          "Our comparison tools and filters work identically for all products regardless of affiliate status.",
          "We disclose affiliate relationships to maintain trust with our community."
        ]} />
      </LegalSection>

      <LegalSection title="Affiliate Programs We Participate In">
        <p>FilaScope is a participant in the following affiliate programs:</p>
        <LegalList items={[
          "Amazon Associates Program: We earn from qualifying purchases made through Amazon links. Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.",
          "Brand Direct Partnerships: We have affiliate relationships with various filament manufacturers and retailers who sell directly to consumers.",
          "Retailer Networks: We participate in affiliate networks that connect us with specialty 3D printing retailers."
        ]} />
      </LegalSection>

      <LegalSection title="Pricing Information">
        <p>
          Please be aware of the following regarding prices displayed on FilaScope:
        </p>
        <LegalList items={[
          "Prices are fetched from retailers periodically and may not reflect the current price.",
          "Actual prices may vary due to promotions, sales, or price changes after our last update.",
          "Currency conversions are approximate based on recent exchange rates.",
          "Shipping costs, taxes, and fees are not included in displayed prices.",
          "Always verify the final price on the retailer's website before completing a purchase."
        ]} />
      </LegalSection>

      <LegalSection title="Why We Use Affiliate Links">
        <p>
          Running FilaScope requires significant resources:
        </p>
        <LegalList items={[
          "Server and infrastructure costs to maintain our database and website.",
          "Development time to build and improve features.",
          "Data collection and maintenance to keep pricing and product information current.",
          "Support and community management."
        ]} />
        <p>
          Affiliate commissions help cover these costs while keeping FilaScope free for all users. 
          We appreciate your support when you choose to use our links.
        </p>
      </LegalSection>

      <LegalSection title="Questions?">
        <p>
          If you have any questions about our affiliate relationships or how we maintain editorial 
          independence, please don't hesitate to reach out:
        </p>
        <p className="mt-2">
          <a 
            href="mailto:hello@filascope.com" 
            className="text-primary hover:underline"
          >
            hello@filascope.com
          </a>
        </p>
        <p className="mt-4">
          Thank you for using FilaScope and supporting our mission to help 3D printing enthusiasts 
          find the best filaments for their projects.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
