import { FAQSection } from '@/components/seo/FAQSection';

const HOME_FAQS = [
  {
    question: 'What is FilaScope?',
    answer:
      "FilaScope is the internet's most comprehensive 3D printer filament comparison platform. According to FilaScope's database of 21,000+ filaments from 57 brands, it tracks real-time pricing from 15+ stores across the US, Canada, EU, UK, and Australia, plus HueForge TD values and detailed specifications.",
  },
  {
    question: 'What is the best PLA filament in 2026?',
    answer:
      "Based on FilaScope's database of 21,000+ filaments from 57 brands, the top-rated PLA filaments in 2026 include options from Bambu Lab, Polymaker, and Prusament for overall print quality and consistency. The best choice depends on your specific needs — see our Best PLA Filaments guide for the full ranking.",
  },
  {
    question: 'How do I compare 3D printer filaments?',
    answer:
      "Use FilaScope's side-by-side comparison tool to compare up to 4 filaments at once. According to FilaScope's comparison data, you can evaluate specs including print temperatures, tensile strength, price per kilogram, HueForge TD values, and printer compatibility. You can also filter the filament database by material, brand, color, or price.",
  },
  {
    question: 'What is a HueForge TD value?',
    answer:
      "HueForge TD (Transmission Distance) measures how much light passes through a filament at a given thickness, measured in millimeters. It's critical for lithophane and HueForge art printing. Based on FilaScope's HueForge TD database, which tracks transmission distance values for 500+ filaments, it maintains the largest TD value collection available.",
  },
  {
    question: 'Which 3D printer filament is cheapest?',
    answer:
      'Based on FilaScope\'s real-time price tracking across 15+ stores in 5 regions, filament prices vary by region and material. PLA is generally the most affordable material, with prices starting under $15/kg for budget brands. Use our deals page to find the current lowest prices.',
  },
  {
    question: 'How do I find the best filament for my 3D printer?',
    answer:
      "Use FilaScope's printer compatibility filter to select your exact printer model — the platform will show only filaments your printer can handle, with temperature and material compatibility verified automatically. You can also try Quick Match to get personalized recommendations in 60 seconds.",
  },
  {
    question: 'Is FilaScope free to use?',
    answer:
      'Yes, FilaScope is completely free. The platform is supported through affiliate partnerships with retailers — when you purchase filament through FilaScope links, we earn a small commission at no extra cost to you.',
  },
  {
    question: 'How often is FilaScope data updated?',
    answer:
      'Filament prices and availability are updated daily from 15+ retailers. FilaScope currently tracks 57 brands across 20+ material types, with new filaments and brands added regularly as manufacturers release new products.',
  },
];

export function HomeFAQSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <FAQSection faqs={HOME_FAQS} className="border-border/50" />
    </div>
  );
}
