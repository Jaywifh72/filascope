import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuickCompareCard from './QuickCompareCard';

interface Platform {
  id: string;
  name: string;
  owner: string;
  logo: string;
  overallScore: number;
  modelType: string;
  features: {
    free: boolean;
  };
}

interface QuickCompareCarouselProps {
  platforms: Platform[];
  onPlatformSelect: (platformId: string) => void;
}

const QuickCompareCarousel = ({ platforms, onPlatformSelect }: QuickCompareCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate active index
    const cardWidth = 252; // Card width (240) + gap (12)
    const newIndex = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(newIndex, platforms.length - 1));
  };

  const scrollToCard = (index: number) => {
    if (!scrollRef.current) return;

    const cardWidth = 252;
    scrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
  };

  const handleScrollLeft = () => scrollToCard(Math.max(0, activeIndex - 1));
  const handleScrollRight = () => scrollToCard(Math.min(platforms.length - 1, activeIndex + 1));

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', updateScrollState);
      updateScrollState();
      return () => scrollEl.removeEventListener('scroll', updateScrollState);
    }
  }, [platforms.length]);

  if (platforms.length === 0) return null;

  return (
    <section className="py-5 mb-6 bg-white/[0.02] border-y border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-base font-bold text-foreground">Quick Compare</h2>
        <span className="text-xs font-medium text-muted-foreground">← Swipe to browse →</span>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={handleScrollLeft}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-background/90 border border-white/15 rounded-full text-foreground hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all"
            aria-label="Previous platform"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-4 pb-4 pt-2 scrollbar-none"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {platforms.map((platform, index) => (
            <QuickCompareCard
              key={platform.id}
              platform={platform}
              rank={index + 1}
              isActive={index === activeIndex}
              onClick={() => onPlatformSelect(platform.id)}
            />
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={handleScrollRight}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-background/90 border border-white/15 rounded-full text-foreground hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all"
            aria-label="Next platform"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 px-4 pt-2">
        {platforms.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToCard(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === activeIndex
                ? "w-6 bg-cyan-400"
                : "w-2 bg-white/20 hover:bg-white/40"
            )}
            aria-label={`Go to platform ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default QuickCompareCarousel;
