import { Tag, SlidersHorizontal, Palette, ArrowRight } from "lucide-react";

const columns = [
  {
    icon: Tag,
    heading: "Real Prices, Real Stores",
    description:
      "Live pricing from 15+ retailers worldwide. See prices in your currency, from stores that ship to you. Updated daily.",
  },
  {
    icon: SlidersHorizontal,
    heading: "Filtered For Your Printer",
    description:
      "Select your 3D printer and instantly see only compatible filaments. No more guessing about temperatures or materials.",
  },
  {
    icon: Palette,
    heading: "Find by Color & TD Value",
    description:
      "The world's largest HueForge TD database. Match any color, find filaments by transmission distance, and shop across brands.",
  },
];

const WhyFilaScope = () => {
  const handleScroll = () => {
    document
      .getElementById("filament-catalog")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="w-full border-t border-b border-slate-800 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {columns.map(({ icon: Icon, heading, description }) => (
            <div key={heading} className="flex flex-col items-center text-center md:items-start md:text-left">
              <Icon size={28} className="text-cyan-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">{heading}</h3>
              <p className="text-sm text-slate-400">{description}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={handleScroll}
            className="bg-cyan-500 hover:bg-cyan-400 text-white px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
          >
            Start Exploring
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default WhyFilaScope;
