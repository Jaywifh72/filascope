import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Material data lookup ───

interface MaterialGuide {
  fullName: string;
  summary: string;
  stats: Array<{ label: string; value: string; dot: string }>;
  note?: string;
  /** Slug for the material knowledge base link */
  slug: string;
}

const MATERIAL_GUIDES: Record<string, MaterialGuide> = {
  PLA: {
    fullName: 'PLA (Polylactic Acid)',
    summary: 'The most popular 3D printing material. Biodegradable, easy to print, great for beginners.',
    stats: [
      { label: 'Difficulty', value: 'Easy', dot: 'bg-emerald-500' },
      { label: 'Strength', value: 'Moderate', dot: 'bg-amber-500' },
      { label: 'Heat Resistance', value: 'Low (55°C)', dot: 'bg-red-500' },
      { label: 'Flexibility', value: 'Low', dot: 'bg-muted-foreground' },
    ],
    slug: 'pla',
  },
  PETG: {
    fullName: 'PETG (Polyethylene Terephthalate Glycol)',
    summary: 'A strong, durable material with good chemical resistance. Great balance of ease and performance.',
    stats: [
      { label: 'Difficulty', value: 'Easy–Moderate', dot: 'bg-emerald-500' },
      { label: 'Strength', value: 'High', dot: 'bg-emerald-500' },
      { label: 'Heat Resistance', value: 'Moderate (80°C)', dot: 'bg-amber-500' },
      { label: 'Flexibility', value: 'Low–Moderate', dot: 'bg-muted-foreground' },
    ],
    slug: 'petg',
  },
  ABS: {
    fullName: 'ABS (Acrylonitrile Butadiene Styrene)',
    summary: 'A strong engineering plastic with good heat resistance. Used in automotive and mechanical parts.',
    stats: [
      { label: 'Difficulty', value: 'Moderate', dot: 'bg-amber-500' },
      { label: 'Strength', value: 'High', dot: 'bg-emerald-500' },
      { label: 'Heat Resistance', value: 'High (100°C)', dot: 'bg-emerald-500' },
      { label: 'Flexibility', value: 'Low', dot: 'bg-muted-foreground' },
    ],
    note: 'Requires enclosed printer and ventilation.',
    slug: 'abs',
  },
  TPU: {
    fullName: 'TPU (Thermoplastic Polyurethane)',
    summary: 'A flexible, rubber-like material for parts that need to bend, stretch, or absorb impact.',
    stats: [
      { label: 'Difficulty', value: 'Moderate–Hard', dot: 'bg-red-500' },
      { label: 'Strength', value: 'Moderate', dot: 'bg-amber-500' },
      { label: 'Heat Resistance', value: 'Moderate (80°C)', dot: 'bg-amber-500' },
      { label: 'Flexibility', value: 'High', dot: 'bg-emerald-500' },
    ],
    slug: 'tpu',
  },
  ASA: {
    fullName: 'ASA (Acrylonitrile Styrene Acrylate)',
    summary: 'Similar to ABS but with excellent UV resistance. The go-to material for outdoor applications.',
    stats: [
      { label: 'Difficulty', value: 'Moderate', dot: 'bg-amber-500' },
      { label: 'Strength', value: 'High', dot: 'bg-emerald-500' },
      { label: 'Heat Resistance', value: 'High (95°C)', dot: 'bg-emerald-500' },
      { label: 'Flexibility', value: 'Low', dot: 'bg-muted-foreground' },
    ],
    note: 'UV resistant — good for outdoor use.',
    slug: 'asa',
  },
  // TODO: Add PA/Nylon, PC, HIPS, PVA, etc.
};

function resolveGuide(material: string | null): MaterialGuide | null {
  if (!material) return null;
  const upper = material.toUpperCase().replace(/[- ]/g, '');
  if (upper.startsWith('PLA') && !upper.includes('HT')) return MATERIAL_GUIDES.PLA;
  if (upper.startsWith('PETG') || upper === 'PCTG') return MATERIAL_GUIDES.PETG;
  if (upper === 'ABS') return MATERIAL_GUIDES.ABS;
  if (upper === 'ASA') return MATERIAL_GUIDES.ASA;
  if (upper.startsWith('TPU') || upper === 'TPE') return MATERIAL_GUIDES.TPU;
  return MATERIAL_GUIDES[upper] || null;
}

const LS_KEY = 'filascope_material_guide_collapsed';

interface MaterialQuickGuideProps {
  material: string | null;
  /** Number of filament detail pages viewed this session (from browse history) */
  sessionViewCount: number;
}

export function MaterialQuickGuide({ material, sessionViewCount }: MaterialQuickGuideProps) {
  const guide = useMemo(() => resolveGuide(material), [material]);

  // Don't show for experienced users (5+ views this session)
  const shouldHide = sessionViewCount >= 5;

  // Persist collapse state
  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  // Default to collapsed
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Start collapsed; user must click to expand
  }, []);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (!next) {
      try {
        localStorage.setItem(LS_KEY, 'true');
      } catch {}
    }
  };

  if (shouldHide || !guide) {
    // For unknown materials, show a subtle placeholder
    if (!shouldHide && material && !guide) {
      return (
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/30 text-sm text-muted-foreground cursor-default"
          disabled
        >
          <BookOpen className="w-4 h-4 text-primary/50" />
          <span className="italic text-xs">Material guide coming soon for {material}</span>
        </button>
      );
    }
    return null;
  }

  const materialDisplayName = material?.toUpperCase().replace(/[- ]/g, ' ') || guide.fullName.split(' (')[0];

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden transition-colors">
      {/* Collapsed teaser / toggle */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
      >
        <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-sm font-medium text-foreground/80">
          What is {materialDisplayName}?
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Quick material guide
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground ml-auto transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Expanded content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/30">
          {/* Material name + summary */}
          <div>
            <h4 className="text-base font-semibold text-foreground">{guide.fullName}</h4>
            <p className="text-sm text-muted-foreground mt-0.5">{guide.summary}</p>
          </div>

          {/* Quick stats row */}
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {guide.stats.map((stat, idx) => (
              <React.Fragment key={stat.label}>
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", stat.dot)} />
                  <span className="text-xs text-muted-foreground">{stat.label}:</span>
                  <span className="text-xs font-medium text-foreground/80">{stat.value}</span>
                </div>
                {idx < guide.stats.length - 1 && (
                  <span className="text-border hidden sm:inline">|</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Note if present */}
          {guide.note && (
            <p className="text-xs text-amber-400/80 italic">{guide.note}</p>
          )}

          {/* Learn more link */}
          <Link
            to={`/compare?tab=reference`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Learn more about {materialDisplayName}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
