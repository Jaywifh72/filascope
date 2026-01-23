import React from 'react';
import { Trophy, Gift, Printer, DollarSign, Wrench, ChevronDown, Lightbulb, Box } from 'lucide-react';

interface QuickPick {
  id: string;
  badge: string;
  badgeIcon: React.ReactNode;
  badgeColor: string;
  platformName: string;
  platformLogo: string;
  tagline: string;
  description: string;
  targetId: string;
}

const quickPicks: QuickPick[] = [
  {
    id: 'printables',
    badge: 'Best Overall',
    badgeIcon: <Trophy className="w-3.5 h-3.5" />,
    badgeColor: '#FFD700',
    platformName: 'Printables',
    platformLogo: '/images/repos/printables.png',
    tagline: 'The Community Benchmark',
    description: 'Highest quality community-curated models with Prusameter integration',
    targetId: 'platform-printables'
  },
  {
    id: 'thingiverse',
    badge: 'Best Free',
    badgeIcon: <Gift className="w-3.5 h-3.5" />,
    badgeColor: '#22C55E',
    platformName: 'Thingiverse',
    platformLogo: '/images/repos/thingiverse.png',
    tagline: 'The Legacy Archive',
    description: 'Largest archive of free models with 6M+ community designs',
    targetId: 'platform-thingiverse'
  },
  {
    id: 'makerworld',
    badge: 'Best for Bambu',
    badgeIcon: <Printer className="w-3.5 h-3.5" />,
    badgeColor: '#00D9D9',
    platformName: 'MakerWorld',
    platformLogo: '/images/repos/makerworld.png',
    tagline: 'The Ecosystem Disruptor',
    description: 'One-click print profiles with seamless Bambu Studio integration',
    targetId: 'platform-makerworld'
  },
  {
    id: 'cults3d',
    badge: 'Best for Sellers',
    badgeIcon: <DollarSign className="w-3.5 h-3.5" />,
    badgeColor: '#F59E0B',
    platformName: 'Cults3D',
    platformLogo: '/images/repos/cults3d.png',
    tagline: 'The Independent Marketplace',
    description: '80/20 commission split with strong independent marketplace features',
    targetId: 'platform-cults3d'
  },
  {
    id: 'grabcad',
    badge: 'Best for Engineers',
    badgeIcon: <Wrench className="w-3.5 h-3.5" />,
    badgeColor: '#8B5CF6',
    platformName: 'GrabCAD',
    platformLogo: '/images/repos/grabcad.png',
    tagline: "The Engineer's Vault",
    description: 'Professional STEP/IGES/CAD files for engineering applications',
    targetId: 'platform-grabcad'
  }
];

interface ReposHeroSectionProps {
  platformCount: number;
  onScrollToComparison: () => void;
}

const ReposHeroSection: React.FC<ReposHeroSectionProps> = ({ platformCount, onScrollToComparison }) => {
  const scrollToElement = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Set focus for accessibility
      element.setAttribute('tabindex', '-1');
      element.focus();
    }
  };

  return (
    <section 
      className="w-full py-12 md:py-16 mb-8 border-b border-border/50 relative overflow-hidden"
      role="region"
      aria-labelledby="repos-hero-headline"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] via-transparent to-transparent pointer-events-none" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-5xl mx-auto px-4 relative">
        {/* Headline Area */}
        <div className="text-center mb-10">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-sm font-medium mb-4">
            <Box className="w-4 h-4" />
            MODEL LIBRARY
          </span>
          
          <h2 
            id="repos-hero-headline"
            className="text-3xl md:text-4xl lg:text-[42px] font-extrabold text-foreground mb-4 tracking-tight"
          >
            Find Your Perfect 3D Model Repository
          </h2>
          <p className="text-base md:text-lg font-medium text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Where you download models matters. We analyzed {platformCount} platforms across 
            quality, community, search, and monetization so you don't have to guess.
          </p>
          
          {/* Stats Row */}
          <div className="flex items-center justify-center gap-4 md:gap-8 text-sm md:text-base text-muted-foreground">
            <span>
              <span className="text-teal-400 font-semibold">{platformCount}</span> Platforms Compared
            </span>
            <span className="text-border">•</span>
            <span>
              <span className="text-teal-400 font-semibold">10</span> Metrics Analyzed
            </span>
            <span className="text-border hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              <span className="text-teal-400 font-semibold">100+</span> Hours Research
            </span>
          </div>
        </div>

        {/* Quick Picks Section */}
        <div className="mb-10" role="navigation" aria-label="Quick platform recommendations">
          <div className="text-center mb-6">
            <h3 className="text-lg md:text-xl font-bold text-foreground flex items-center justify-center gap-2.5 mb-1.5">
              <span className="text-2xl">🎯</span> Quick Picks
            </h3>
            <p className="text-sm font-medium text-muted-foreground">
              Skip the research, start downloading
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickPicks.slice(0, 3).map((pick) => (
              <QuickPickCard key={pick.id} pick={pick} onSelect={scrollToElement} isPrimary />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-w-2xl mx-auto lg:max-w-none lg:grid-cols-2 lg:px-[16.67%]">
            {quickPicks.slice(3).map((pick) => (
              <QuickPickCard key={pick.id} pick={pick} onSelect={scrollToElement} />
            ))}
          </div>
        </div>

        {/* Beginner Explainer */}
        <div 
          className="flex items-start gap-3.5 max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-primary/5 border border-primary/15"
          role="note"
          aria-label="Explanation for beginners"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed">
            <strong className="text-foreground/90">New to 3D model repositories?</strong>{' '}
            These are websites where designers share (free or paid) ready-to-print 3D models. 
            Download, slice, and print—no CAD skills required.
          </p>
        </div>

        {/* Scroll CTA */}
        <button
          onClick={onScrollToComparison}
          className="flex items-center justify-center gap-2 w-full py-4 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors group"
          aria-label="Scroll to comparison matrix"
        >
          <ChevronDown className="w-5 h-5 animate-bounce" />
          <span>View Full Comparison Below</span>
        </button>
      </div>
    </section>
  );
};

interface QuickPickCardProps {
  pick: QuickPick;
  onSelect: (targetId: string) => void;
  isPrimary?: boolean;
}

const QuickPickCard: React.FC<QuickPickCardProps> = ({ pick, onSelect, isPrimary }) => {
  return (
    <button
      onClick={() => onSelect(pick.targetId)}
      className={`flex flex-col items-start p-5 rounded-2xl border transition-all duration-200 text-left group
        ${isPrimary ? 'bg-card/60' : 'bg-card/40'}
        border-border/50 hover:border-primary/40 hover:bg-card/80 hover:-translate-y-0.5
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
      `}
      aria-label={`${pick.badge}: ${pick.platformName} - ${pick.description}`}
    >
      {/* Badge */}
      <div 
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide mb-4"
        style={{ 
          backgroundColor: `${pick.badgeColor}15`,
          borderColor: `${pick.badgeColor}40`,
          color: pick.badgeColor,
          border: '1px solid'
        }}
      >
        {pick.badgeIcon}
        <span>{pick.badge}</span>
      </div>

      {/* Platform Info */}
      <div className="flex items-center gap-3 mb-3 w-full">
        <div className="w-11 h-11 rounded-xl bg-muted/50 p-1.5 flex-shrink-0">
          <img 
            src={pick.platformLogo} 
            alt={`${pick.platformName} logo`}
            className="w-full h-full object-contain rounded-lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold text-foreground">{pick.platformName}</div>
          <div className="text-xs font-medium text-primary">{pick.tagline}</div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-4 flex-1">
        {pick.description}
      </p>

      {/* CTA */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
        <span>Jump to Details</span>
        <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
      </div>
    </button>
  );
};

export default ReposHeroSection;
