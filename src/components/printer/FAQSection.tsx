import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJsonLd, JsonLd } from '@/components/seo/useJsonLd';
import DOMPurify from 'dompurify';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface FAQSectionProps {
  printerModel: string;
  printerBrand?: string;
  buildVolume?: string;
  maxSpeed?: number;
  maxNozzleTemp?: number;
  maxColors?: number;
  hasEnclosure?: boolean;
  supportedMaterials?: string | null;
}

// Generate dynamic FAQs based on printer specs
function generateFAQs(props: FAQSectionProps): FAQ[] {
  const { printerModel, printerBrand, buildVolume, maxSpeed, maxNozzleTemp, maxColors, hasEnclosure, supportedMaterials } = props;
  
  // Parse materials list
  const materialsArr = supportedMaterials
    ? supportedMaterials.split(',').map((m: string) => m.trim()).filter(Boolean)
    : [];
  const materialCount = materialsArr.length;
  const materialListStr = materialsArr.join(', ') || 'PLA, PETG, ABS, and TPU';
  const primaryMaterials = materialsArr.slice(0, 4).join(', ') || 'PLA, PETG, and ABS';
  const highestTempMaterial = maxNozzleTemp && maxNozzleTemp >= 300 ? 'Polycarbonate and Nylon' : maxNozzleTemp && maxNozzleTemp >= 260 ? 'ABS and ASA' : 'PETG and TPU';
  const nozzleTempRange = maxNozzleTemp ? `up to ${maxNozzleTemp}°C` : 'standard range';
  
  return [
    // Getting Started
    {
      id: '1',
      category: 'Getting Started',
      question: `How difficult is it to set up the ${printerModel}?`,
      answer: `The ${printerModel} is designed for easy setup. Most users have it printing within <strong>15-30 minutes</strong> of unboxing. The printer comes largely pre-assembled - you'll only need to attach the filament spool holder, connect the power cable, load filament, and run the auto-bed leveling (automatic). The included quick-start guide walks you through each step with photos. No special tools or technical knowledge required.`
    },
    {
      id: '2',
      category: 'Getting Started',
      question: 'Do I need prior 3D printing experience?',
      answer: `<strong>No experience necessary.</strong> The ${printerModel} includes features specifically designed for beginners:<ul><li>Automatic bed leveling (eliminates most common beginner frustration)</li><li>Pre-configured print profiles (no manual calibration needed)</li><li>Intuitive touchscreen interface</li><li>Step-by-step setup wizard</li><li>Sample pre-sliced files to start immediately</li></ul>That said, experienced users will appreciate the advanced features like custom profiles and open firmware.`
    },
    {
      id: '3',
      category: 'Getting Started',
      question: 'What software do I need?',
      answer: `The printer works with multiple free slicing software options:<ul><li><strong>${printerBrand || 'Brand'} Studio</strong> (recommended) - Optimized for this printer</li><li><strong>PrusaSlicer</strong> - Popular open-source option</li><li><strong>Cura</strong> - Another excellent free alternative</li><li><strong>OrcaSlicer</strong> - Community favorite with advanced features</li></ul>All are free to download and include pre-configured settings for this printer. No paid software required.`
    },
    {
      id: '4',
      category: 'Getting Started',
      question: `How loud is the ${printerModel} during operation?`,
      answer: `Operating noise is approximately <strong>50-55 dB</strong> during normal printing - similar to a quiet conversation or background music.<ul><li><strong>Quieter than most FDM printers</strong> thanks to silent stepper drivers</li><li>${hasEnclosure ? '<strong>Enclosed design</strong> further dampens noise' : 'Consider adding an enclosure for quieter operation'}</li><li>Suitable for home offices and bedrooms</li><li>Fans and motors audible but not disruptive</li></ul>For reference: Normal conversation is 60 dB, a whisper is 30 dB.`
    },
    {
      id: '5',
      category: 'Getting Started',
      question: 'How long does the first print take?',
      answer: `Sample prints included range from <strong>30 minutes to 2 hours</strong>. Here's what to expect:<ul><li><strong>Benchy test boat</strong>: ~1 hour (popular first print)</li><li><strong>Calibration cube</strong>: 30 minutes</li><li><strong>Small figure</strong>: 1-2 hours</li><li><strong>Large vase</strong>: 4-6 hours</li></ul>Print time depends on size, detail level, and speed settings.${maxSpeed ? ` The ${printerModel}'s high speed (up to ${maxSpeed}mm/s) significantly reduces times compared to standard printers.` : ''}`
    },
    // Materials & Printing
    {
      id: '6',
      category: 'Materials & Printing',
      question: 'What materials can this printer use?',
      answer: `The ${printerModel} supports a <strong>wide range of materials</strong>:<br/><br/><strong>Standard Materials</strong> (most common):<ul><li>PLA (easiest, great for beginners)</li><li>PETG (stronger, more durable)</li><li>ABS (heat-resistant, engineering-grade)</li><li>TPU/TPE (flexible materials)</li></ul><strong>Advanced Materials</strong>${maxNozzleTemp && maxNozzleTemp >= 300 ? ' (higher temperature capability)' : ''}:<ul><li>Nylon (very strong, functional parts)</li><li>ASA (UV-resistant, outdoor use)</li><li>Carbon fiber composites</li>${maxNozzleTemp && maxNozzleTemp >= 300 ? '<li>Polycarbonate (with hardened nozzle)</li>' : ''}</ul>${maxNozzleTemp ? `The <strong>${maxNozzleTemp}°C nozzle</strong> enables printing almost any consumer 3D printing material.` : ''}`
    },
    {
      id: '7',
      category: 'Materials & Printing',
      question: 'Does filament come included?',
      answer: `Yes, the printer typically includes a <strong>sample spool</strong> (usually 500g) to get you started. After that, filament costs approximately:<ul><li><strong>PLA</strong>: $15-25 per kg</li><li><strong>PETG</strong>: $20-30 per kg</li><li><strong>ABS</strong>: $20-30 per kg</li><li><strong>Specialty materials</strong>: $30-60 per kg</li></ul>One kilogram produces roughly 30-40 small prints or 5-10 large prints, depending on infill settings.`
    },
    {
      id: '8',
      category: 'Materials & Printing',
      question: maxColors && maxColors > 1 ? `How does the ${maxColors}-color system work?` : 'Can I print in multiple colors?',
      answer: maxColors && maxColors > 1 
        ? `The <strong>AMS (Automatic Material System)</strong> manages up to ${maxColors} filaments simultaneously:<ol><li>Load up to ${maxColors} different colors or materials</li><li>Design your multi-color model in the slicer</li><li>Printer automatically switches between filaments during printing</li><li>No manual intervention needed</li></ol><strong>Key benefits</strong>:<ul><li>Print multi-color models without pausing</li><li>Mix materials in single print (rigid + flexible)</li><li>Automatic purging between color changes</li><li>No manual filament swaps</li></ul>`
        : `Multi-color printing is possible through manual filament changes or by adding an AMS (Automatic Material System) accessory. This allows you to pause prints at specific layers to swap colors, or upgrade to automated color changing.`
    },
    {
      id: '9',
      category: 'Materials & Printing',
      question: 'What is the maximum size I can print?',
      answer: `Build volume is <strong>${buildVolume || 'generous'}</strong>. Real-world examples:<ul><li><strong>Full-size cosplay helmet</strong>: ${buildVolume ? 'Yes ✓' : 'Check dimensions'}</li><li><strong>D&D miniatures</strong>: Yes (can print many at once) ✓</li><li><strong>Phone case</strong>: Yes ✓</li><li><strong>Large vase (12" tall)</strong>: Yes ✓</li><li><strong>Furniture piece</strong>: May need to print in multiple pieces</li></ul>For larger projects, you can print in multiple pieces and assemble. Many users create props and cosplay pieces this way.`
    },
    {
      id: '10',
      category: 'Materials & Printing',
      question: 'Can I print existing models from the internet?',
      answer: `<strong>Absolutely!</strong> You can download free models from:<ul><li><strong>MakerWorld</strong> - Integrated with many printers</li><li><strong>Printables</strong> - High-quality curated designs</li><li><strong>Thingiverse</strong> - Largest repository (millions of free models)</li><li><strong>MyMiniFactory</strong> - Focus on quality and printability</li><li><strong>Cults3D</strong> - Mix of free and paid premium models</li></ul>Files are typically in STL or 3MF format. Simply download, import to slicing software, and print. No design skills required to print existing models.`
    },
    // Maintenance & Support
    {
      id: '11',
      category: 'Maintenance & Support',
      question: 'What regular maintenance is required?',
      answer: `Maintenance is <strong>minimal</strong> but important:<br/><br/><strong>Weekly</strong> (if printing regularly):<ul><li>Check bed for debris/damage</li><li>Wipe nozzle clean</li><li>Inspect belts for tension</li></ul><strong>Monthly</strong>:<ul><li>Lubricate linear rails and lead screws</li><li>Clean build plate with isopropyl alcohol</li><li>Check for loose screws/connections</li></ul><strong>As Needed</strong>:<ul><li>Replace nozzle when worn (every 500-1000 hours)</li><li>Replace build surface when adhesion degrades</li><li>Update firmware (automatic notifications)</li></ul>Total maintenance time: <strong>~15 minutes per month</strong> for regular users.`
    },
    {
      id: '12',
      category: 'Maintenance & Support',
      question: 'What warranty and support is included?',
      answer: `<strong>Comprehensive coverage</strong>:<ul><li><strong>1-year manufacturer warranty</strong> (hardware defects)</li><li><strong>Free firmware updates</strong> (lifetime)</li><li><strong>Email support</strong> (response within 24-48 hours)</li><li><strong>Community forum</strong> (active user community)</li><li><strong>Video tutorials</strong> and documentation</li><li><strong>Replacement parts</strong> readily available</li></ul>Extended warranty options may be available at checkout. Most brands offer a <strong>30-day return policy</strong> if not satisfied.`
    },
    {
      id: '13',
      category: 'Maintenance & Support',
      question: 'How often do things break or need replacement?',
      answer: `The ${printerModel} is built for reliability, but some wear is normal:<br/><br/><strong>Rarely Need Replacement</strong> (years):<ul><li>Motors and electronics</li><li>Frame and structure</li><li>Heating elements</li></ul><strong>Occasional Replacement</strong> (500-1000 hours):<ul><li><strong>Nozzle</strong> ($10-20) - Wears from abrasive materials</li><li><strong>Build surface</strong> ($20-40) - Loses adhesion over time</li><li><strong>PTFE tube</strong> ($5-10) - Can degrade with heat</li></ul>Most users report <strong>trouble-free operation</strong> for the first year+. Replacement parts are inexpensive and easy to install.`
    },
    {
      id: '14',
      category: 'Maintenance & Support',
      question: 'Is technical support available if I have problems?',
      answer: `<strong>Multiple support channels</strong>:<br/><br/><strong>Official Support</strong>:<ul><li>Email support (typical 24-48 hour response)</li><li>Live chat during business hours</li><li>Comprehensive knowledge base</li><li>Video tutorials and guides</li></ul><strong>Community Resources</strong>:<ul><li>Active subreddits (r/3Dprinting, brand-specific)</li><li>Facebook groups (thousands of users)</li><li>Discord servers (real-time help)</li><li>YouTube tutorials (setup, troubleshooting, tips)</li></ul>Most common issues have existing solutions in community forums with step-by-step fixes.`
    },
    {
      id: '15',
      category: 'Maintenance & Support',
      question: 'Can I upgrade or modify the printer later?',
      answer: `<strong>Yes, extensively!</strong> Popular upgrades:<br/><br/><strong>Performance</strong>:<ul><li>Hardened nozzle (for abrasive materials)</li><li>Larger nozzles (0.6mm, 0.8mm for faster prints)</li><li>All-metal hotend upgrade</li><li>Enhanced cooling fans</li></ul><strong>Convenience</strong>:<ul><li>Camera mount for monitoring</li><li>LED lighting strip</li><li>Filament dry box</li><li>Enclosure enhancements</li></ul><strong>Advanced</strong>:<ul><li>Custom firmware options</li><li>Raspberry Pi integration</li><li>Additional sensors</li></ul>The active community means extensive modification possibilities and guides.`
    },
    // Comparison & Value
    {
      id: '16',
      category: 'Comparison & Value',
      question: 'How does this compare to cheaper printers?',
      answer: `Key differences from budget printers ($200-500):<br/><br/><strong>${printerModel} Advantages</strong>:<ul><li>${maxSpeed ? `<strong>${maxSpeed >= 300 ? '2-3x faster' : 'Faster'}</strong> print speeds` : '<strong>Faster</strong> print speeds'}</li><li>${buildVolume ? '<strong>Larger build volume</strong>' : 'Potentially larger build volume'}</li><li><strong>Auto bed leveling</strong> (most budget require manual)</li>${maxColors && maxColors > 1 ? `<li><strong>${maxColors}-color capability</strong> (budget are single-color)</li>` : ''}<li>${hasEnclosure ? '<strong>Enclosed</strong> (better temperature control, safety)' : 'Better components and reliability'}</li><li><strong>Higher quality components</strong> (fewer failures, longer life)</li></ul><strong>Budget Printer Advantages</strong>:<ul><li>Lower initial cost</li><li>Good for learning/experimentation</li></ul>If you're serious about 3D printing or need reliability, investing more saves time and frustration long-term.`
    },
    {
      id: '17',
      category: 'Comparison & Value',
      question: 'Is this printer worth the price?',
      answer: `<strong>Value breakdown</strong>:<br/><br/><strong>What you get</strong>:<ul><li><strong>Professional-grade printer</strong> (comparable industrial printers cost 2-3x more)</li>${maxColors && maxColors > 1 ? `<li><strong>${maxColors}-color system</strong> ($300-400 value separately)</li>` : ''}<li><strong>Auto-leveling sensor</strong> ($60-100 value)</li>${hasEnclosure ? '<li><strong>Enclosed design</strong> (DIY enclosures cost $100-200)</li>' : ''}<li><strong>Quality components</strong> that last</li></ul><strong>Cost per print</strong>:<ul><li>Materials: $0.50-3.00 per typical print</li><li>Electricity: ~$0.10-0.30 per print</li><li><strong>Total</strong>: Under $5 for most projects</li></ul>Most active users report the printer "pays for itself" within 6-12 months through replaced purchased items and hobby savings.`
    },
    {
      id: '18',
      category: 'Comparison & Value',
      question: 'Can this printer be used for business/commercial purposes?',
      answer: `<strong>Yes, absolutely.</strong> Common commercial uses:<br/><br/><strong>Product Applications</strong>:<ul><li><strong>Prototyping</strong> (test designs before mass production)</li><li><strong>Custom products</strong> (personalized items, one-offs)</li><li><strong>Replacement parts</strong> (on-demand manufacturing)</li><li><strong>Jigs and fixtures</strong> (manufacturing aids)</li><li><strong>Molds and patterns</strong> (for casting)</li></ul><strong>Service Applications</strong>:<ul><li>Repair services (print replacement parts)</li><li>Design services (bring digital to physical)</li><li>Educational (schools, makerspaces)</li></ul>Many users run profitable 3D printing businesses with similar printers.`
    },
    // Technical
    {
      id: '19',
      category: 'Technical',
      question: 'What are the power requirements?',
      answer: `<strong>Electrical specifications</strong>:<ul><li><strong>Input voltage</strong>: 100-240V AC, 50/60Hz (universal)</li><li><strong>Power consumption</strong>: 350-500W (average during printing)</li><li><strong>Peak power</strong>: 600W (during heat-up)</li></ul><strong>Practical details</strong>:<ul><li>Works with <strong>standard outlets</strong> (no special wiring needed)</li><li><strong>Similar power draw</strong> to laptop or desktop computer</li><li>Estimated electricity cost: <strong>$0.05-0.15 per hour</strong> of printing</li></ul>No voltage converter needed for US use. International users should verify local voltage compatibility.`
    },
    {
      id: '20',
      category: 'Technical',
      question: 'Where can I find troubleshooting help?',
      answer: `<strong>Troubleshooting resources</strong> (ranked by usefulness):<ol><li><strong>User Manual</strong> - Common issues and error codes</li><li><strong>Manufacturer Website</strong> - Knowledge base, video tutorials, firmware</li><li><strong>Community Forums</strong> - Reddit, brand-specific forums (search first!)</li><li><strong>YouTube</strong> - Setup videos, common fixes, upgrade guides</li><li><strong>Direct Support</strong> - Email support for complex issues</li></ol><strong>Pro tip</strong>: Search error messages or symptoms first - 90% of issues have documented solutions in the community.`
    },
    // Filament Recommendations
    {
      id: '21',
      category: 'Materials & Printing',
      question: `What is the best filament for the ${printerBrand ? `${printerBrand} ` : ''}${printerModel}?`,
      answer: `According to FilaScope's database of 8,200+ filaments from 48+ brands, the ${printerModel} works best with ${primaryMaterials} based on its temperature range of ${nozzleTempRange}. For everyday printing, PLA from brands like Bambu Lab, Polymaker, or Hatchbox offers consistent results. For stronger functional parts, PETG is recommended. Check FilaScope's filament database to compare options filtered by compatibility with the ${printerModel}.`
    },
    {
      id: '22',
      category: 'Materials & Printing',
      question: `What materials can the ${printerBrand ? `${printerBrand} ` : ''}${printerModel} print?`,
      answer: `FilaScope's specification data shows that the ${printerModel} can print ${materialCount > 0 ? `${materialCount} material types: ${materialListStr}` : 'a wide range of materials including PLA, PETG, ABS, and TPU'}. ${maxNozzleTemp ? `Its maximum nozzle temperature of ${maxNozzleTemp}°C supports everything from PLA (190°C) to ${highestTempMaterial}.` : ''} ${hasEnclosure ? 'The enclosed build chamber enables high-temperature materials like ABS and ASA without warping.' : ''} According to FilaScope's database of 8,200+ filaments from 48+ brands, thousands of filaments are compatible with this printer.`
    }
  ];
}

// Strip HTML tags for clean schema text
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const CATEGORIES = ['Getting Started', 'Materials & Printing', 'Maintenance & Support', 'Comparison & Value', 'Technical'];
const INITIAL_VISIBLE = 5;

export function FAQSection(props: FAQSectionProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  
  const faqs = generateFAQs(props);

  // FAQPage JSON-LD — inject ALL 20 questions for rich results eligibility
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripHtml(faq.answer),
      },
    })),
  };
  useJsonLd(faqJsonLd);
  
  const filteredFAQs = activeCategory === 'All'
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setShowAll(false);
  };

  const toggleFAQ = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <>
      <JsonLd jsonLd={faqJsonLd} />
      <section className="max-w-[1000px] mx-auto px-5 md:px-10 py-16 md:py-20">
      <h2 className="text-xl md:text-2xl font-bold text-foreground text-center mb-4">
        Frequently Asked Questions
      </h2>
      <p className="text-[15px] font-medium text-muted-foreground text-center max-w-[600px] mx-auto mb-10">
        Find answers to common questions about the {props.printerModel}
      </p>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto whitespace-nowrap gap-2 pb-2 justify-start md:justify-center mb-8 scrollbar-none">
        <button
          onClick={() => handleCategoryChange('All')}
          className={cn(
            "flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
            activeCategory === 'All'
              ? "bg-primary/15 border border-primary/50 text-primary"
              : "bg-card/50 border border-border text-muted-foreground hover:bg-card hover:border-primary/30"
          )}
        >
          All Questions
        </button>
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
              activeCategory === category
                ? "bg-primary/15 border border-primary/50 text-primary"
                : "bg-card/50 border border-border text-muted-foreground hover:bg-card hover:border-primary/30"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ List — ALL items in DOM, extras visually hidden for crawlability */}
      <div className="flex flex-col gap-3">
        {filteredFAQs.map((faq, index) => {
          const isExpanded = expandedItems.has(faq.id);
          const isVisuallyHidden = !showAll && index >= INITIAL_VISIBLE;
          
          return (
            <div
              key={faq.id}
              className={cn(
                "rounded-[10px] overflow-hidden",
                // Always in DOM, but visually collapsed extras via max-h + overflow
                isVisuallyHidden && "max-h-0 overflow-hidden pointer-events-none"
              )}
              aria-hidden={isVisuallyHidden}
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                aria-expanded={isExpanded}
                aria-controls={`faq-answer-${faq.id}`}
                className={cn(
                  "w-full min-h-[56px] md:min-h-[60px] px-4 md:px-5 py-3 flex items-center justify-between gap-4 text-left transition-all",
                  isExpanded
                    ? "bg-primary/8 border border-primary/30 rounded-t-[10px]"
                    : "bg-card/50 border border-border rounded-[10px] hover:bg-card hover:border-primary/30"
                )}
              >
                <span className="text-[15px] md:text-base font-semibold text-foreground leading-snug">
                  {faq.question}
                </span>
                <ChevronDown 
                  className={cn(
                    "w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>
              
              {/* Answer — always in DOM (even collapsed), crawlable by Googlebot */}
              <div
                id={`faq-answer-${faq.id}`}
                aria-hidden={!isExpanded}
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-out",
                  isExpanded 
                    ? "max-h-[2000px] opacity-100" 
                    : "max-h-0 opacity-0"
                )}
              >
                <div className="px-4 md:px-5 py-3 md:py-4 bg-primary/5 border border-t-0 border-primary/30 rounded-b-[10px]">
                  <div 
                    className="text-[15px] font-medium text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_li]:my-1.5 [&_a]:text-primary [&_a:hover]:underline"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.answer, {
                      ALLOWED_TAGS: ['strong', 'ul', 'ol', 'li', 'br', 'a'],
                      ALLOWED_ATTR: ['href', 'target', 'rel']
                    }) }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFAQs.length > INITIAL_VISIBLE && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 mx-auto mt-4 text-sm text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer py-2 transition-colors"
        >
          {showAll ? 'Show fewer' : `Show all ${filteredFAQs.length} questions`}
          {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}

      {/* Support CTA removed — FilaScope is a comparison platform, not the manufacturer */}
    </section>
    </>
  );
}
