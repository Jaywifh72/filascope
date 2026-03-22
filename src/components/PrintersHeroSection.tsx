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
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 pt-3 pb-2 sm:pt-4 sm:pb-2">
        {/* Row 1: H1 + trust stats */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3 mb-2">
          <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold tracking-tight leading-[1.15] text-white">
            3D Printer Database
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0 whitespace-nowrap">
            <span className="text-primary">{printerCount > 0 ? printerCount.toLocaleString() : '155'}</span> printers · <span className="text-primary">{brandCount > 0 ? `${brandCount}+` : '17+'}</span> brands
          </p>
        </div>

        {/* Row 2: Search + Quiz inline */}
        <div className="flex gap-3 items-center">
          <SearchBarGated>
            <div className="w-full max-w-lg">
              <SearchInputWithHistory
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search printers by name, brand..."
                context="printers"
                className="h-10 sm:h-11"
              />
            </div>
          </SearchBarGated>
          <Button
            size="sm"
            onClick={onOpenQuiz}
            className="h-10 sm:h-11 px-4 bg-gradient-to-r from-primary to-[hsl(195_100%_50%)] text-background hover:from-[hsl(180_100%_55%)] hover:to-[hsl(195_100%_55%)] font-semibold text-xs rounded-lg shrink-0 hidden sm:flex"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Hardware Quiz
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PrintersHeroSection;
