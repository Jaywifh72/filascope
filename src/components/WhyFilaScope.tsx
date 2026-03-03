import { Tag, SlidersHorizontal, Palette, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const columns = [
  {
    icon: Tag,
    heading: "Real Prices, Real Stores",
    description:
      "Live pricing from 15+ retailers worldwide. See prices in your currency, from stores that ship to you. Updated daily.",
    ctaLabel: "Browse Deals",
    ctaTo: "/deals",
  },
  {
    icon: SlidersHorizontal,
    heading: "Filtered For Your Printer",
    description:
      "Select your 3D printer and instantly see only compatible filaments. No more guessing about temperatures or materials.",
    ctaLabel: "Set My Printer",
    ctaAction: "focus-printer-selector",
  },
  {
    icon: Palette,
    heading: "Find by Color & TD Value",
    description:
      "The world's largest HueForge TD database. Match any color, find filaments by transmission distance, and shop across brands.",
    ctaLabel: "Find by Color",
    ctaTo: "/colors",
  },
];

const WhyFilaScope = () => {
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrinterFocus = () => {
    // Try to open the printer selector in the sidebar
    const printerBtn = document.querySelector('[data-testid="printer-selector"]') as HTMLButtonElement
      || document.querySelector('[aria-label*="printer" i]') as HTMLButtonElement
      || document.querySelector('.printer-selector-trigger') as HTMLButtonElement;
    if (printerBtn) {
      printerBtn.click();
    } else {
      // Scroll to top where the sidebar is
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full border-t border-b py-10" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {columns.map(({ icon: Icon, heading, description, ctaLabel, ctaTo, ctaAction }) => (
            <div key={heading} className="flex flex-col items-center text-center md:items-start md:text-left">
              <Icon size={28} className="text-cyan-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">{heading}</h3>
              <p className="text-sm text-slate-400 mb-4">{description}</p>
              {ctaTo ? (
                <Link
                  to={ctaTo}
                  className="inline-flex items-center gap-1.5 text-[13px] text-white px-3.5 py-1.5 rounded-md border transition-colors hover:bg-white/10"
                  style={{ borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  {ctaLabel} <ArrowRight size={13} />
                </Link>
              ) : ctaAction === "focus-printer-selector" ? (
                <button
                  onClick={handlePrinterFocus}
                  className="inline-flex items-center gap-1.5 text-[13px] text-white px-3.5 py-1.5 rounded-md border transition-colors hover:bg-white/10"
                  style={{ borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  {ctaLabel} <ArrowRight size={13} />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={handleBackToTop}
            className="bg-cyan-500 hover:bg-cyan-400 text-white px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
          >
            Back to Top
            <ArrowRight size={16} className="rotate-[-90deg]" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default WhyFilaScope;
