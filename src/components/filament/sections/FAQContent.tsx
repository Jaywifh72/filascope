import React, { useState } from 'react';
import { generateDynamicFAQs } from '@/lib/generateFilamentFAQs';

interface FAQContentProps {
  material: string | null;
  brand?: string | null;
  productName?: string | null;
  nozzleTempMin?: number | null;
  nozzleTempMax?: number | null;
  bedTempMin?: number | null;
  bedTempMax?: number | null;
  transmissionDistance?: number | null;
  price?: number | null;
}

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQContent({
  material,
  brand,
  productName,
  nozzleTempMin,
  nozzleTempMax,
  bedTempMin,
  bedTempMax,
  transmissionDistance,
  price,
}: FAQContentProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const staticFaqs = getFAQsForMaterial(material);
  const dynamicFaqs = generateDynamicFAQs({
    brand,
    productName,
    material,
    nozzleTempMin,
    nozzleTempMax,
    bedTempMin,
    bedTempMax,
    transmissionDistance,
    price,
  });
  const faqs = [...staticFaqs, ...dynamicFaqs];

  if (faqs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No FAQs available for this material type.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {faqs.map((item, idx) => (
        <div 
          key={idx}
          className={`border rounded-xl overflow-hidden transition-colors ${
            openIndex === idx 
              ? 'border-primary/20 bg-primary/[0.02]' 
              : 'border-white/[0.06]'
          }`}
        >
          <button
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-sm font-semibold text-foreground">
              {item.question}
            </span>
            <span className={`text-lg font-bold flex-shrink-0 ${
              openIndex === idx ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {openIndex === idx ? '−' : '+'}
            </span>
          </button>
          {openIndex === idx && (
            <div className="px-4 pb-4 text-sm font-medium text-slate-400 leading-relaxed">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getFAQsForMaterial(material: string | null): FAQItem[] {
  const baseFAQs: FAQItem[] = [
    {
      question: 'How should I store this filament?',
      answer: 'Store filament in a cool, dry place away from direct sunlight. For best results, use an airtight container with desiccant packets to prevent moisture absorption. Consider using a filament dry box for hygroscopic materials.'
    },
    {
      question: 'What nozzle should I use?',
      answer: 'Standard brass nozzles work well for most non-abrasive filaments like PLA, PETG, and ABS. For abrasive filaments containing carbon fiber, glass fiber, or metal particles, use hardened steel, ruby, or tungsten carbide nozzles to prevent wear.'
    },
  ];
  
  if (!material) return baseFAQs;
  
  const mat = material.toUpperCase();
  
  if (mat.includes('PLA')) {
    return [
      {
        question: 'Why is my PLA warping or curling?',
        answer: 'PLA warping is usually caused by the heated bed being too hot, poor bed adhesion, or drafts. Try reducing bed temp to 50-60°C, use adhesion helpers like glue stick, and ensure no cold air is hitting the print.'
      },
      {
        question: 'Can I leave PLA prints in a hot car?',
        answer: 'No, PLA has a low glass transition temperature (~60°C) and will deform in hot environments like a car in summer. For heat-resistant applications, consider PETG, ABS, or high-temp PLA variants.'
      },
      {
        question: 'Is PLA food safe?',
        answer: 'PLA is generally considered food-safe as a material, but 3D printed objects have layer lines that can harbor bacteria. For food contact, use food-safe coatings or consider the print for single-use only.'
      },
      ...baseFAQs
    ];
  }
  
  if (mat.includes('PETG')) {
    return [
      {
        question: 'Why does my PETG stick to the nozzle?',
        answer: 'PETG is prone to stringing. Increase retraction settings, lower the nozzle temperature slightly, and consider using a higher-quality PETG. Coasting settings in your slicer can also help reduce oozing.'
      },
      {
        question: 'Why is PETG sticking too well to my print bed?',
        answer: 'PETG adheres extremely well to PEI sheets. Use a release agent like glue stick, hairspray, or Windex to create a separation layer. This prevents PETG from bonding too strongly and damaging your bed.'
      },
      ...baseFAQs
    ];
  }
  
  if (mat.includes('ABS') || mat.includes('ASA')) {
    return [
      {
        question: 'Do I need an enclosure for ABS?',
        answer: 'Yes, an enclosure is highly recommended for ABS. It maintains consistent temperatures, prevents warping, and reduces the emission of fumes. Even a simple cardboard enclosure can make a significant difference.'
      },
      {
        question: 'How do I prevent ABS from warping?',
        answer: 'Use an enclosure, increase bed temperature to 100-110°C, use ABS slurry or glue stick for adhesion, and ensure the first layer is well-squished. Brims can also help with small parts.'
      },
      {
        question: 'Is it safe to print ABS at home?',
        answer: 'ABS emits styrene fumes when printing. Always print in a well-ventilated area or with an enclosure that has a HEPA filter. Avoid prolonged exposure to fumes, especially without ventilation.'
      },
      ...baseFAQs
    ];
  }
  
  if (mat.includes('TPU') || mat.includes('TPE')) {
    return [
      {
        question: 'What print speed should I use for TPU?',
        answer: 'Print TPU slowly, typically 15-30 mm/s. Faster speeds can cause the flexible filament to buckle in the extruder. Direct drive extruders handle TPU better than Bowden setups.'
      },
      {
        question: 'Should I use retraction with TPU?',
        answer: 'Minimize or disable retraction for TPU. Flexible filaments can jam when retracted in Bowden systems. If needed, use very short retraction distances (0.5-2mm) at slow speeds.'
      },
      ...baseFAQs
    ];
  }
  
  if (mat.includes('NYLON') || mat.includes('PA')) {
    return [
      {
        question: 'Why is my nylon print coming out weak?',
        answer: 'Nylon is extremely hygroscopic and absorbs moisture from the air. Dry your filament at 70-80°C for 4-6 hours before printing. Wet nylon results in poor layer adhesion and bubbling.'
      },
      {
        question: 'What bed surface works best for nylon?',
        answer: 'Nylon adheres well to Garolite (G10), glue stick on glass, or specialized adhesives like Magigoo PA. Regular PEI may not provide enough adhesion for nylon.'
      },
      ...baseFAQs
    ];
  }
  
  return baseFAQs;
}
