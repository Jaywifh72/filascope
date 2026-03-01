import { useRef, useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const TIPS = [
  { text: "Looking for outdoor parts? ASA resists UV better than ABS.", material: "ASA" },
  { text: "PETG is food-safe when printed correctly — great for kitchen tools.", material: "PETG" },
  { text: "TPU is flexible — perfect for phone cases and gaskets.", material: "TPU" },
  { text: "Nylon is one of the strongest filaments, ideal for mechanical parts.", material: "Nylon" },
  { text: "PLA+ offers improved toughness over standard PLA.", material: "PLA" },
];

interface GridBreakCardProps {
  type: "tip" | "compare" | "printer" | "deal" | "hueforge";
  tipIndex?: number;
  onAction?: () => void;
  dealData?: { name: string; discount: number; pricePerKg: string; slug: string };
  onDismiss?: (type: string) => void;
}

const CARD_CONFIG = {
  tip: {
    gradient: "from-cyan-950 to-gray-900",
    border: "border-cyan-800/30",
    icon: "💡",
    titleColor: "text-cyan-400",
    title: "Quick Tip",
  },
  compare: {
    gradient: "from-amber-950 to-gray-900",
    border: "border-amber-800/30",
    icon: "⚖️",
    titleColor: "text-amber-400",
    title: "Compare Challenge",
  },
  printer: {
    gradient: "from-emerald-950 to-gray-900",
    border: "border-emerald-800/30",
    icon: "🖨️",
    titleColor: "text-emerald-400",
    title: "Set Your Printer",
  },
  deal: {
    gradient: "from-red-950 to-gray-900",
    border: "border-red-800/30",
    icon: "🏷️",
    titleColor: "text-red-400",
    title: "Deal Spotlight",
  },
  hueforge: {
    gradient: "from-purple-950 to-gray-900",
    border: "border-purple-800/30",
    icon: "🎨",
    titleColor: "text-purple-400",
    title: "HueForge Artists",
  },
};

export function GridBreakCard({ type, tipIndex = 0, onAction, dealData, onDismiss }: GridBreakCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const config = CARD_CONFIG[type];
  const tip = TIPS[tipIndex % TIPS.length];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(`dismissed-break-${type}`, "1");
    onDismiss?.(type);
  }, [type, onDismiss]);

  const handleCTA = useCallback(() => {
    if (onAction) { onAction(); return; }
    switch (type) {
      case "compare": navigate("/compare"); break;
      case "hueforge": navigate("/hueforge"); break;
      case "deal": if (dealData?.slug) navigate(`/filament/${dealData.slug}`); break;
    }
  }, [type, onAction, navigate, dealData]);

  const bodyText = (() => {
    switch (type) {
      case "tip": return tip.text;
      case "compare": return "Which is stronger — PETG or ABS? Compare them side by side to find out!";
      case "printer": return "Select your printer to see only compatible filaments. No more temperature guesswork.";
      case "deal":
        return dealData
          ? `${dealData.name} is ${dealData.discount}% off right now — ${dealData.pricePerKg}/kg`
          : "Check out today's best filament deals and save on your next spool.";
      case "hueforge": return "Need a specific TD value? Our database has 500+ verified transmission distance measurements.";
    }
  })();

  const ctaText = (() => {
    switch (type) {
      case "tip": return `Browse ${tip.material} Filaments →`;
      case "compare": return "Start Comparing →";
      case "printer": return "Set My Printer →";
      case "deal": return "View Deal →";
      case "hueforge": return "Search TD Values →";
    }
  })();

  return (
    <div
      ref={ref}
      className={cn(
        "col-span-1 sm:col-span-1 rounded-xl border p-5 flex flex-col justify-between relative",
        "bg-gradient-to-br", config.gradient, config.border,
        "transition-all duration-400",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        // Mobile: full width in 2-col grid
        "max-sm:col-span-2 max-sm:flex-row max-sm:gap-4 max-sm:p-4"
      )}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="max-sm:flex-1">
        <div className="text-3xl mb-3 max-sm:text-2xl max-sm:mb-2">{config.icon}</div>
        <p className={cn("text-xs font-medium uppercase tracking-wide mb-1", config.titleColor)}>
          {config.title}
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">{bodyText}</p>
      </div>

      <button
        onClick={handleCTA}
        className={cn(
          "text-sm font-medium mt-4 text-left transition-colors max-sm:mt-0 max-sm:self-center max-sm:whitespace-nowrap",
          config.titleColor,
          `hover:brightness-125`
        )}
      >
        {ctaText}
      </button>
    </div>
  );
}

// Helper to determine break card type based on position
export function getBreakType(
  index: number,
  hasPrinter: boolean
): "tip" | "compare" | "printer" | "deal" | "hueforge" {
  const position = Math.floor(index / 8);
  switch (position) {
    case 1: return hasPrinter ? "tip" : "printer";
    case 2: return "compare";
    case 3: return "deal";
    case 4: return "hueforge";
    default: return "tip";
  }
}

export function isDismissed(type: string): boolean {
  try { return localStorage.getItem(`dismissed-break-${type}`) === "1"; } catch { return false; }
}
