import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchInputWithHistory from "@/components/search/SearchInputWithHistory";
import { SearchBarGated } from "@/components/search/SearchBarGated";

interface PrintersHeroSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  printerCount: number;
  brandCount: number;
  activeQuickFilters: string[];
  onQuickFilterToggle: (filterId: string) => void;
  onOpenQuiz?: () => void;
}

const PrintersHeroSection = ({
  searchTerm,
  onSearchChange,
  printerCount,
  brandCount,
  onOpenQuiz
}: PrintersHeroSectionProps) => {

  return (
    <section className="relative overflow-hidden">
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 pt-4 pb-1 sm:pt-6 sm:pb-2 md:pt-6 md:pb-3">
        <div className="flex flex-col items-start max-w-3xl">
          {/* Compact H1 */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-white mb-2">
            3D Printer Database
          </h1>

          {/* Stats line */}
          <p className="text-sm sm:text-base text-gray-400 mb-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="text-primary font-semibold">{printerCount > 0 ? printerCount.toLocaleString() : '119'}</span> printers from{' '}
            <span className="text-primary font-semibold">{brandCount > 0 ? `${brandCount}+` : '17+'}</span> brands
            <span className="text-white/20 mx-2">·</span>
            Compare specs, prices & compatibility
          </p>

          {/* Search + Quiz row */}
          <div
            className="flex flex-col w-full gap-3 sm:flex-row sm:items-center sm:gap-4 sm:w-auto animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <Button
              size="lg"
              onClick={onOpenQuiz}
              className="h-12 px-6 bg-gradient-to-r from-primary via-[hsl(185_100%_45%)] to-[hsl(195_100%_50%)] text-background hover:from-[hsl(180_100%_55%)] hover:via-[hsl(185_100%_50%)] hover:to-[hsl(195_100%_55%)] hover:-translate-y-0.5 transition-all duration-200 font-bold text-sm rounded-xl shadow-[0_6px_20px_rgba(0,207,232,0.3)] w-full sm:w-auto"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Hardware Quiz
            </Button>

            <SearchBarGated>
              <div className="w-full sm:w-[280px] md:w-[320px] relative">
                <SearchInputWithHistory
                  value={searchTerm}
                  onChange={onSearchChange}
                  placeholder="Search printers by name, brand..."
                  context="printers"
                  className="h-12 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:border-cyan-500/40 transition-all duration-200 rounded-md"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 pointer-events-none">
                  /
                </kbd>
              </div>
            </SearchBarGated>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrintersHeroSection;
