import { LegalPageLayout, LegalSection, LegalList } from "@/components/legal/LegalPageLayout";

export default function TermsOfService() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="February 7, 2026"
      metaDescription="FilaScope Terms of Service - Read the terms and conditions for using our 3D printing filament comparison and price tracking service."
    >
      <LegalSection title="Agreement to Terms">
        <p>
          By accessing or using FilaScope, you agree to be bound by these Terms of Service. 
          If you do not agree to these terms, please do not use our service. We reserve the 
          right to update these terms at any time, and your continued use of the service 
          constitutes acceptance of any changes.
        </p>
      </LegalSection>

      <LegalSection title="Description of Service">
        <p>
          FilaScope is a 3D printing filament comparison platform that provides:
        </p>
        <LegalList items={[
          "A comprehensive database of 3D printing filaments from various manufacturers.",
          "Price comparison across multiple retailers and regions.",
          "Technical specifications, ratings, and user reviews.",
          "Tools to help users find and compare filaments for their specific needs.",
          "Links to purchase filaments from third-party retailers."
        ]} />
      </LegalSection>

      <LegalSection title="Pricing and Accuracy Disclaimer">
        <p>
          <strong className="text-foreground">Important:</strong> FilaScope aggregates pricing 
          information from third-party retailers. Please be aware that:
        </p>
        <LegalList items={[
          "Prices displayed on FilaScope are scraped periodically and may not reflect real-time prices.",
          "Actual prices, availability, and shipping costs may vary when you visit the retailer's website.",
          "We recommend verifying all pricing and product details on the retailer's site before making a purchase.",
          "FilaScope is not responsible for price discrepancies or changes between our displayed prices and actual retailer prices.",
          "Currency conversions are approximate and based on exchange rates that may not be current."
        ]} />
      </LegalSection>

      <LegalSection title="Affiliate Disclosure">
        <p>
          FilaScope participates in affiliate programs with various retailers. When you click 
          on product links and make a purchase, we may earn a commission at no additional cost 
          to you. This helps support the operation and development of our service. For more 
          details, please see our{" "}
          <a href="/affiliate-disclosure" className="text-primary hover:underline">
            Affiliate Disclosure
          </a>.
        </p>
      </LegalSection>

      <LegalSection title="User Conduct">
        <p>When using FilaScope, you agree not to:</p>
        <LegalList items={[
          "Use automated tools, bots, or scrapers to access our service without permission.",
          "Attempt to interfere with or disrupt the service or servers.",
          "Use the service for any unlawful purpose or in violation of any applicable laws.",
          "Misrepresent your identity or affiliation with any person or organization.",
          "Submit false, misleading, or fraudulent reviews or information."
        ]} />
      </LegalSection>

      <LegalSection title="Intellectual Property">
        <p>
          All content on FilaScope, including but not limited to text, graphics, logos, icons, 
          images, and software, is the property of FilaScope or its content suppliers and is 
          protected by intellectual property laws.
        </p>
        <LegalList items={[
          "You may not reproduce, distribute, or create derivative works without our express written permission.",
          "Product images and descriptions may be the property of their respective manufacturers.",
          "User-submitted content remains the property of the user but grants FilaScope a license to display and use it."
        ]} />
      </LegalSection>

      <LegalSection title="Limitation of Liability">
        <p>
          To the fullest extent permitted by law:
        </p>
        <LegalList items={[
          "FilaScope is provided \"as is\" without warranties of any kind, express or implied.",
          "We do not guarantee the accuracy, completeness, or timeliness of any information on our site.",
          "We are not liable for any damages arising from your use of or inability to use our service.",
          "We are not responsible for the products, services, or policies of third-party retailers.",
          "Our total liability shall not exceed the amount you paid us (if any) in the past 12 months."
        ]} />
      </LegalSection>

      <LegalSection title="Indemnification">
        <p>
          You agree to indemnify and hold harmless FilaScope, its operators, and affiliates from 
          any claims, damages, losses, or expenses arising from your use of the service or 
          violation of these terms.
        </p>
      </LegalSection>

      <LegalSection title="Third-Party Links">
        <p>
          FilaScope contains links to third-party websites and retailers. We are not responsible 
          for the content, privacy policies, or practices of these external sites. Accessing 
          these links is at your own risk.
        </p>
      </LegalSection>

      <LegalSection title="Governing Law">
        <p>
          These Terms of Service shall be governed by and construed in accordance with applicable 
          laws. Any disputes arising from these terms or your use of FilaScope shall be resolved 
          through appropriate legal channels.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For questions about these Terms of Service, please contact us at:
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
