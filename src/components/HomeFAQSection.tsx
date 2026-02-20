import { FAQSection } from '@/components/seo/FAQSection';

const HOME_FAQS = [
  {
    question: 'What is FilaScope?',
    answer:
      "FilaScope is the internet's most comprehensive 3D printer filament comparison platform. It indexes over 1,080 filaments from 48+ manufacturers across 15+ retailers worldwide, with live pricing, technical specifications, and the world's largest HueForge Transmissivity Distance (TD) database.",
  },
  {
    question: 'What is HueForge Transmissivity Distance (TD)?',
    answer:
      'Transmissivity Distance (TD) measures how far light travels through a 3D-printed filament wall before it\'s fully blocked, expressed in millimeters. HueForge software uses TD values to calculate how colors blend when stacked layer-by-layer for lithophane and multicolor prints. FilaScope maintains the world\'s largest verified TD database.',
  },
  {
    question: 'How does FilaScope track filament prices?',
    answer:
      'FilaScope monitors live pricing from 15+ retailers worldwide, updated daily. Prices are displayed in your local currency (USD, CAD, EUR, GBP, AUD) from stores that ship to your region.',
  },
  {
    question: 'What filament types does FilaScope cover?',
    answer:
      'FilaScope covers all major 3D printing filament types including PLA, PETG, ABS, ASA, TPU/Flex, Nylon/PA, Polycarbonate, Copolyester, and specialty high-performance materials from 48+ brands.',
  },
  {
    question: 'How do I find the best filament for my 3D printer?',
    answer:
      "Use FilaScope's printer compatibility filter to select your exact printer model — the platform will show only filaments your printer can handle, with temperature and material compatibility verified automatically. You can also try Quick Match to get personalized recommendations in 60 seconds.",
  },
  {
    question: 'What makes FilaScope different from other filament databases?',
    answer:
      'FilaScope uniquely combines live multi-retailer pricing, comprehensive technical specs, the world\'s largest HueForge TD database, and printer-specific compatibility filtering in one platform. No other resource offers all of these together.',
  },
  {
    question: 'Is FilaScope free to use?',
    answer:
      'Yes, FilaScope is completely free. The platform is supported through affiliate partnerships with retailers — when you purchase filament through FilaScope links, we earn a small commission at no extra cost to you.',
  },
  {
    question: 'How often is FilaScope data updated?',
    answer:
      'Filament prices and availability are updated daily from 15+ retailers. New filaments and brands are added regularly as manufacturers release new products.',
  },
];

export function HomeFAQSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <FAQSection faqs={HOME_FAQS} className="border-border/50" />
    </div>
  );
}
