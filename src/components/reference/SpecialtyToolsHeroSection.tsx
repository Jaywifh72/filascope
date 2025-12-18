import React from 'react';
import { Search, BarChart3, ChevronRight, Wrench, FolderOpen, Gift, Star } from 'lucide-react';

interface QuickPick {
  id: string;
  icon: string;
  badge: string;
  badgeColor: string;
  name: string;
  tagline: string;
  description: string;
  pricing: { type: 'free' | 'one-time' | 'freemium' | 'subscription'; price?: string };
  targetId: string;
}

const quickPicks: QuickPick[] = [
  {
    id: 'ellis-guide',
    icon: '🎯',
    badge: 'Calibration Bible',
    badgeColor: '#22C55E',
    name: "Ellis' Guide",
    tagline: 'Master print calibration',
    description: 'The definitive guide for Pressure Advance, flow tuning, and perfect first layers',
    pricing: { type: 'free' },
    targetId: 'tool-ellis-guide'
  },
  {
    id: 'hueforge',
    icon: '🎨',
    badge: 'Filament Art',
    badgeColor: '#EC4899',
    name: 'HueForge',
    tagline: 'Photo to 3D masterpiece',
    description: 'Transform any image into stunning multi-color lithophane prints',
    pricing: { type: 'one-time', price: '$12-18' },
    targetId: 'tool-hueforge'
  },
  {
    id: 'octoeverywhere',
    icon: '📡',
    badge: 'Remote Control',
    badgeColor: '#F59E0B',
    name: 'OctoEverywhere',
    tagline: 'Print from anywhere',
    description: 'Monitor, control, and get AI failure detection for any printer remotely',
    pricing: { type: 'freemium' },
    targetId: 'tool-octoeverywhere'
  },
  {
    id: 'meshy',
    icon: '🤖',
    badge: 'AI Generation',
    badgeColor: '#8B5CF6',
    name: 'Meshy.ai',
    tagline: 'Text-to-3D magic',
    description: 'Create 3D models from text prompts or images using generative AI',
    pricing: { type: 'freemium' },
    targetId: 'tool-meshy'
  }
];

const heroStats = [
  { icon: Wrench, value: '10', label: 'Tools Reviewed' },
  { icon: FolderOpen, value: '7', label: 'Categories' },
  { icon: Gift, value: '4', label: 'Free Options' },
  { icon: Star, value: '100%', label: 'Personally Tested' }
];

interface SpecialtyToolsHeroSectionProps {
  onScrollToComparison: () => void;
}

const SpecialtyToolsHeroSection: React.FC<SpecialtyToolsHeroSectionProps> = ({ onScrollToComparison }) => {
  const getPricingDisplay = (pricing: QuickPick['pricing']) => {
    switch (pricing.type) {
      case 'free':
        return { label: 'Free', color: 'text-green-400', bg: 'bg-green-500/15' };
      case 'one-time':
        return { label: pricing.price || 'Paid', color: 'text-blue-400', bg: 'bg-blue-500/15' };
      case 'freemium':
        return { label: 'Freemium', color: 'text-amber-400', bg: 'bg-amber-500/15' };
      case 'subscription':
        return { label: 'Subscription', color: 'text-purple-400', bg: 'bg-purple-500/15' };
      default:
        return { label: 'Paid', color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  const scrollToTool = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Trigger accordion open if closed
      const trigger = element.querySelector('[data-state="closed"]');
      if (trigger instanceof HTMLElement) {
        trigger.click();
      }
    }
  };

  return (
    <section className="relative py-12 md:py-16 px-4 md:px-6 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-[400px] h-[300px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Headline */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl md:text-5xl animate-bounce" style={{ animationDuration: '3s' }}>🛠️</span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
              The 3D Printing Utility Belt
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            10 essential tools we actually use—from calibration wizards to remote monitoring magic.
          </p>
        </div>

        {/* Staff Picks Section */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-2xl">⭐</span>
            <h2 className="text-lg font-semibold text-foreground">Staff Picks</h2>
            <span className="text-sm text-muted-foreground hidden sm:inline">— Our favorites to get you started</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickPicks.map((pick) => {
              const pricing = getPricingDisplay(pick.pricing);
              return (
                <button
                  key={pick.id}
                  onClick={() => scrollToTool(pick.targetId)}
                  className="group relative text-left p-5 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{pick.icon}</span>
                    <span 
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                      style={{ 
                        backgroundColor: `${pick.badgeColor}15`,
                        color: pick.badgeColor
                      }}
                    >
                      {pick.badge}
                    </span>
                  </div>

                  {/* Card Content */}
                  <h3 className="text-base font-semibold text-foreground mb-1">{pick.name}</h3>
                  <p className="text-sm font-medium text-primary mb-2">{pick.tagline}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{pick.description}</p>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${pricing.bg} ${pricing.color}`}>
                      {pricing.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      View Details
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>

                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10 p-5 rounded-xl bg-card/30 border border-border/30">
          {heroStats.map((stat, index) => (
            <div key={index} className="flex items-center gap-3">
              <stat.icon className="h-6 w-6 text-primary" />
              <div>
                <div className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onScrollToComparison}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            <Search className="h-5 w-5" />
            Browse All Tools
          </button>
          <button
            onClick={onScrollToComparison}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted/50 transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            Compare Side-by-Side
          </button>
        </div>
      </div>
    </section>
  );
};

export default SpecialtyToolsHeroSection;
