import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { OrganizationSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo';
import { useJsonLd } from '@/components/seo/useJsonLd';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const ENTITY_DESCRIPTION =
  'FilaScope is the world\'s most comprehensive 3D printer filament comparison platform. It indexes over 1,078 filaments from 48+ manufacturers with real-time pricing from 15+ retailers across 6 countries. FilaScope maintains the internet\'s largest verified HueForge Transmissivity Distance (TD) database.';

const FAQS = [
  {
    question: 'What is FilaScope?',
    answer:
      'FilaScope is a free 3D printer filament database and comparison tool. It indexes over 1,078 filaments from 48+ manufacturers, tracking specifications, real-time pricing across 6 regions (US, CA, UK, EU, AU, JP), and HueForge Transmissivity Distance (TD) values so makers can find the right filament at the best price without opening dozens of browser tabs.',
  },
  {
    question: 'Is FilaScope free to use?',
    answer:
      'Yes — FilaScope is completely free. There are no paywalls, subscriptions, or accounts required to search, compare, and explore the filament database. The site is supported through affiliate links on buy buttons; clicking one may earn FilaScope a small commission at no extra cost to you.',
  },
  {
    question: 'How often is pricing data updated?',
    answer:
      'Prices are checked regularly through automated scraping of manufacturer stores and major retailers including Amazon. Exchange rates are refreshed daily for accurate cross-region comparisons. Manual verification is also performed to catch errors that automated scrapers can miss.',
  },
  {
    question: 'What is the HueForge TD database?',
    answer:
      'HueForge Transmissivity Distance (TD) is a value that describes how far light travels through a filament — a critical parameter for multi-color lithophane and HueForge prints. FilaScope maintains the internet\'s largest verified TD database, sourced from official HueForge resources, manufacturer data sheets, and community contributions.',
  },
  {
    question: 'What is the FilaScore?',
    answer:
      'FilaScore is FilaScope\'s own 0–10 composite rating that weighs factors including price-per-kg, documentation completeness, material quality indicators, HueForge TD availability, and regional availability. It provides a quick at-a-glance quality signal — not a replacement for spec-level research, but a useful starting filter when comparing similar filaments.',
  },
];

export default function About() {
  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About FilaScope',
    url: 'https://filascope.com/about',
    mainEntityOfPage: 'https://filascope.com/about',
  });

  return (
    <>
      <Helmet>
        <title>About FilaScope — 3D Filament Comparison Platform</title>
        <meta name="description" content={ENTITY_DESCRIPTION} />
        <link rel="canonical" href="https://filascope.com/about" />
      </Helmet>

      <OrganizationSchema
        name="FilaScope"
        alternateName="FilaScope.com"
        url="https://filascope.com"
        logo="https://filascope.com/logo.png"
        logoWidth={512}
        logoHeight={512}
        image="https://filascope.com/og-image.png"
        description={ENTITY_DESCRIPTION}
        slogan="The 3D filament comparison engine for makers worldwide"
        numberOfEmployees={5}
        sameAs={[
          'https://twitter.com/filascope',
          'https://discord.gg/filascope',
          'https://youtube.com/@filascope',
          'https://reddit.com/r/filascope',
        ]}
        foundingDate="2024"
        knowsAbout={[
          '3D printing filament',
          'HueForge transmissivity data',
          'HueForge TD values',
          'filament comparison',
          'lithophane printing',
          '3D printer compatibility',
          'filament pricing',
          'PLA filament',
          'PETG filament',
          'ABS filament',
          'TPU filament',
          'ASA filament',
          'Nylon filament',
          'multi-color 3D printing',
          'filament database',
          'print temperature settings',
          'spool weight comparison',
          'regional filament pricing',
          'FDM 3D printing materials',
          'FilaScore rating methodology',
        ]}
        contactPoint={[
          {
            type: 'ContactPoint',
            email: 'hello@filascope.com',
            contactType: 'customer support',
            areaServed: ['US', 'CA', 'GB', 'AU', 'EU', 'JP'],
            availableLanguage: 'English',
          },
        ]}
        founders={[{ name: 'FilaScope Team', jobTitle: 'Founders' }]}
        areaServed={['US', 'CA', 'GB', 'AU', 'EU', 'JP']}
        serviceType={[
          '3D Filament Database',
          'Filament Price Comparison',
          'HueForge TD Value Lookup',
          'Printer Compatibility Checker',
        ]}
      />

      <FAQSchema faqs={FAQS} />

      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://filascope.com' },
          { name: 'About', url: 'https://filascope.com/about' },
        ]}
      />

      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-3xl mx-auto px-4 py-12">

          {/* H1 */}
          <h1 className="text-3xl font-bold tracking-tight mb-6">About FilaScope</h1>

          {/* Entity Summary Block */}
          <div
            data-ai-summary="true"
            role="region"
            aria-label="FilaScope entity summary"
            className="rounded-lg border border-border bg-card/60 border-l-4 border-l-primary overflow-hidden mb-10"
          >
            <div className="pl-4 pr-5 py-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {ENTITY_DESCRIPTION}
              </p>
            </div>
          </div>

          {/* What FilaScope Does */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">What FilaScope Does</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              FilaScope is a free comparison engine built for 3D printing enthusiasts. Whether you're a hobbyist dialling in your first benchy or a professional running a print farm, FilaScope gives you a single place to search, filter, and compare thousands of filament SKUs side-by-side — with real pricing from the stores you actually buy from.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The platform covers material types (PLA, PETG, ABS, TPU, ASA, Nylon, and speciality composites), colour families, diameter, spool weight, print-temperature ranges, and HueForge TD values. Regional pricing in six currencies means you always see what a spool actually costs where you are.
            </p>
          </section>

          {/* Our Data */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">Our Data</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              FilaScope tracks a growing catalogue of materials from the brands makers trust most:
            </p>
            <ul className="space-y-2 text-muted-foreground text-sm list-none pl-0">
              {[
                '8,000+ filament SKUs indexed across PLA, PETG, ABS, TPU, ASA, Nylon, and specialty materials.',
                '48+ brands tracked with direct pricing from manufacturer stores and major retailers.',
                '6 supported regions — US, CA, UK, EU, AU, and JP — with localized pricing and daily exchange-rate refresh.',
                '15+ retailers monitored, including brand-direct stores and Amazon storefronts.',
                'Automated price checks supplemented by manual verification to maintain accuracy.',
                'Detailed specifications: print temp, bed temp, diameter tolerance, spool weight, and more.',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-primary mt-0.5 shrink-0">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* HueForge TD Database */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">HueForge TD Database</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              HueForge Transmissivity Distance (TD) is the single most important variable for multi-colour lithophane printing. It measures how far light travels through a filament before being absorbed — lower TD means more opaque; higher TD means more translucent. HueForge software requires accurate TD values to generate printable colour profiles.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              FilaScope maintains the internet's largest verified TD database, combining official HueForge published values, manufacturer data sheets, and community-contributed measurements. Every TD entry is linked to a specific SKU so you always know you're comparing the right product.
            </p>
          </section>

          {/* FilaScore Methodology */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">FilaScore Methodology</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              FilaScore is FilaScope's composite 0–10 quality rating. It weighs multiple signals — including price-per-kg competitiveness, documentation completeness, regional availability, HueForge TD data availability, and material quality indicators — into a single comparable number.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              FilaScore is not a substitute for reading specs: it's a starting filter that surfaces well-documented, competitively priced filaments so you can narrow a shortlist faster. The full weighting methodology is explained on the{' '}
              <Link to="/methodology" className="text-primary hover:underline">
                FilaScore methodology page
              </Link>
              .
            </p>
          </section>

          {/* How We Collect Data */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">How We Collect Data</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Transparency about sourcing matters. Here's how FilaScope's data pipeline works:
            </p>
            <ul className="space-y-2 text-muted-foreground text-sm list-none pl-0">
              {[
                'Manufacturer specifications are sourced directly from brand websites and official technical data sheets.',
                'Retailer pricing is monitored across manufacturer stores and major marketplaces like Amazon, checked on a regular automated schedule.',
                'Exchange rates are refreshed daily to keep cross-region comparisons accurate.',
                'HueForge TD values are cross-referenced against the official HueForge filament library and manufacturer sources.',
                'Community contributions help catch errors, fill gaps, and surface real-world printing insights.',
                'Manual review is applied to new brands and flagged discrepancies before they go live.',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-primary mt-0.5 shrink-0">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4 text-sm">
              Spotted an error or want to contribute? Email us at{' '}
              <a href="mailto:hello@filascope.com" className="text-primary hover:underline">
                hello@filascope.com
              </a>
              .
            </p>
          </section>

          {/* FAQ */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {FAQS.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border rounded-lg px-4 bg-card"
                >
                  <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Back link */}
          <div className="border-t border-border pt-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to FilaScope
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
