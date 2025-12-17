import React, { useState, useRef } from 'react';
import { 
  GraduationCap, Wrench, Palette, Settings,
  Building2, Sparkles, BookOpen, Tablet,
  ArrowLeft, ArrowRight, ChevronDown, Check,
  Trophy, Plus, HelpCircle, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SoftwareBadges } from './CADBadges';

// ============= Types =============

interface UserProfile {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  recommendations: string[];
  isPrimary: boolean;
}

interface ProfileRecommendation {
  softwareId: string;
  rank: 1 | 2 | 3;
  whyRecommended: string[];
  bestFor: string;
  consideration: string;
}

interface SoftwareInfo {
  name: string;
  logo?: string;
  priceType: 'free' | 'freemium' | 'paid';
  overallScore: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

// ============= Profile Data =============

const userProfiles: UserProfile[] = [
  {
    id: 'beginner',
    icon: <GraduationCap className="w-7 h-7" />,
    title: 'Beginner / Hobbyist',
    subtitle: 'New to 3D? Start here',
    description: 'Learning 3D design for fun, home projects, or exploring the field',
    color: '#22C55E',
    recommendations: ['tinkercad', 'fusion360', 'blender'],
    isPrimary: true
  },
  {
    id: 'maker',
    icon: <Wrench className="w-7 h-7" />,
    title: 'Maker / DIY Enthusiast',
    subtitle: 'Functional prints & projects',
    description: 'Creating practical parts, enclosures, and functional prototypes',
    color: '#00D9D9',
    recommendations: ['fusion360', 'freecad', 'openscad'],
    isPrimary: true
  },
  {
    id: 'artist',
    icon: <Palette className="w-7 h-7" />,
    title: 'Artist / Sculptor',
    subtitle: 'Organic shapes & characters',
    description: 'Creating figurines, characters, organic sculptures, and artistic pieces',
    color: '#A855F7',
    recommendations: ['zbrush', 'blender', 'nomad'],
    isPrimary: true
  },
  {
    id: 'engineer',
    icon: <Settings className="w-7 h-7" />,
    title: 'Professional Engineer',
    subtitle: 'Precision & manufacturing',
    description: 'Mechanical design, CAD/CAM, manufacturing, and industrial applications',
    color: '#3B82F6',
    recommendations: ['solidworks', 'fusion360', 'freecad'],
    isPrimary: true
  },
  {
    id: 'architect',
    icon: <Building2 className="w-7 h-7" />,
    title: 'Architect / Designer',
    subtitle: 'Buildings & spaces',
    description: 'Architectural visualization, interior design, and spatial planning',
    color: '#F59E0B',
    recommendations: ['rhino', 'sketchup', 'blender'],
    isPrimary: false
  },
  {
    id: 'concept',
    icon: <Sparkles className="w-7 h-7" />,
    title: 'Concept Artist',
    subtitle: 'Quick ideation & visualization',
    description: 'Fast concept work, product design, and visual development',
    color: '#EC4899',
    recommendations: ['plasticity', 'blender', 'rhino'],
    isPrimary: false
  },
  {
    id: 'educator',
    icon: <BookOpen className="w-7 h-7" />,
    title: 'Educator / Student',
    subtitle: 'Teaching & learning',
    description: 'STEAM education, classroom use, or structured learning path',
    color: '#14B8A6',
    recommendations: ['tinkercad', 'fusion360', 'onshape'],
    isPrimary: false
  },
  {
    id: 'mobile',
    icon: <Tablet className="w-7 h-7" />,
    title: 'Mobile / Tablet User',
    subtitle: 'Design on the go',
    description: 'Creating on iPad, Android tablet, or primarily mobile workflow',
    color: '#6366F1',
    recommendations: ['shapr3d', 'nomad', 'onshape'],
    isPrimary: false
  }
];

// ============= Software Data =============

const softwareData: Record<string, SoftwareInfo> = {
  tinkercad: { name: 'Tinkercad', priceType: 'free', overallScore: 7.5, skillLevel: 'beginner' },
  fusion360: { name: 'Fusion 360', priceType: 'freemium', overallScore: 9.2, skillLevel: 'intermediate' },
  blender: { name: 'Blender', priceType: 'free', overallScore: 9.0, skillLevel: 'intermediate' },
  freecad: { name: 'FreeCAD', priceType: 'free', overallScore: 7.8, skillLevel: 'intermediate' },
  openscad: { name: 'OpenSCAD', priceType: 'free', overallScore: 7.2, skillLevel: 'advanced' },
  zbrush: { name: 'ZBrush', priceType: 'paid', overallScore: 9.5, skillLevel: 'advanced' },
  nomad: { name: 'Nomad Sculpt', priceType: 'paid', overallScore: 8.5, skillLevel: 'intermediate' },
  solidworks: { name: 'SolidWorks', priceType: 'paid', overallScore: 9.4, skillLevel: 'advanced' },
  rhino: { name: 'Rhino 3D', priceType: 'paid', overallScore: 9.0, skillLevel: 'intermediate' },
  sketchup: { name: 'SketchUp', priceType: 'freemium', overallScore: 8.0, skillLevel: 'beginner' },
  plasticity: { name: 'Plasticity', priceType: 'paid', overallScore: 8.2, skillLevel: 'intermediate' },
  onshape: { name: 'Onshape', priceType: 'freemium', overallScore: 8.8, skillLevel: 'intermediate' },
  shapr3d: { name: 'Shapr3D', priceType: 'freemium', overallScore: 8.5, skillLevel: 'beginner' }
};

// ============= Recommendation Data =============

const profileRecommendations: Record<string, ProfileRecommendation[]> = {
  beginner: [
    {
      softwareId: 'tinkercad',
      rank: 1,
      whyRecommended: [
        'Browser-based, no installation required',
        'Intuitive drag-and-drop interface designed for beginners',
        'Built-in interactive tutorials walk you through basics',
        'Free forever with no feature limitations',
        'Perfect stepping stone to more advanced tools'
      ],
      bestFor: 'Your first 3D design project, learning fundamental concepts',
      consideration: 'Limited features for complex mechanical designs'
    },
    {
      softwareId: 'fusion360',
      rank: 2,
      whyRecommended: [
        'Industry-standard tool with free hobbyist license',
        'Comprehensive tutorials and learning resources',
        'Parametric design grows with your skills'
      ],
      bestFor: 'Growing beyond basics into serious design',
      consideration: 'Steeper learning curve than Tinkercad'
    },
    {
      softwareId: 'blender',
      rank: 3,
      whyRecommended: [
        'Completely free and open source forever',
        'Massive community with endless tutorials',
        'Handles both artistic and technical work'
      ],
      bestFor: 'Artists wanting unlimited creative freedom',
      consideration: 'Complex interface takes time to master'
    }
  ],
  maker: [
    {
      softwareId: 'fusion360',
      rank: 1,
      whyRecommended: [
        'Parametric design perfect for functional parts',
        'Built-in CAM for CNC if you expand your shop',
        'Direct export to 3D printer formats',
        'Free for hobbyists and small businesses',
        'Large community of makers sharing tips'
      ],
      bestFor: 'Enclosures, brackets, mechanical assemblies',
      consideration: 'Requires Autodesk account, cloud-dependent'
    },
    {
      softwareId: 'freecad',
      rank: 2,
      whyRecommended: [
        'Fully open source and privacy-respecting',
        'Powerful parametric modeling capabilities',
        'No cloud dependency, works offline'
      ],
      bestFor: 'Privacy-conscious makers, Linux users',
      consideration: 'Steeper learning curve, less polished UI'
    },
    {
      softwareId: 'openscad',
      rank: 3,
      whyRecommended: [
        'Code-based design for programmers',
        'Perfect for parametric/configurable models',
        'Excellent for generating variations'
      ],
      bestFor: 'Programmers, customizable designs',
      consideration: 'No visual sculpting, code-only workflow'
    }
  ],
  artist: [
    {
      softwareId: 'zbrush',
      rank: 1,
      whyRecommended: [
        'Industry standard for digital sculpting',
        'Handles millions of polygons effortlessly',
        'Unmatched brush and detail tools',
        'Used by Weta, ILM, and top studios worldwide',
        'Extensive material and render libraries'
      ],
      bestFor: 'Characters, creatures, organic sculptures',
      consideration: 'Significant investment at ~$900 perpetual'
    },
    {
      softwareId: 'blender',
      rank: 2,
      whyRecommended: [
        'Professional sculpting tools completely free',
        'Integrated rendering and animation',
        'Huge community and tutorial library'
      ],
      bestFor: 'Budget-conscious artists, all-in-one workflow',
      consideration: 'Sculpting tools good but not ZBrush-level'
    },
    {
      softwareId: 'nomad',
      rank: 3,
      whyRecommended: [
        'Sculpt anywhere on iPad or Android',
        'Intuitive touch-based interface',
        'One-time purchase, no subscription'
      ],
      bestFor: 'Mobile sculpting, concept sketches',
      consideration: 'Less powerful than desktop alternatives'
    }
  ],
  engineer: [
    {
      softwareId: 'solidworks',
      rank: 1,
      whyRecommended: [
        'Industry gold standard for mechanical engineering',
        'Comprehensive simulation and analysis tools',
        'Extensive library of standard components',
        'Excellent for manufacturing documentation',
        'Strong industry recognition on resumes'
      ],
      bestFor: 'Professional mechanical design, job market value',
      consideration: 'Expensive licensing, Windows only'
    },
    {
      softwareId: 'fusion360',
      rank: 2,
      whyRecommended: [
        'Modern cloud-based workflow',
        'Integrated CAM and simulation',
        'More affordable than SolidWorks'
      ],
      bestFor: 'Startups, freelancers, product designers',
      consideration: 'Cloud dependency, subscription model'
    },
    {
      softwareId: 'freecad',
      rank: 3,
      whyRecommended: [
        'Free alternative for budget-constrained work',
        'Active development with growing features',
        'No vendor lock-in'
      ],
      bestFor: 'Open source advocates, learning CAD concepts',
      consideration: 'Not as polished as commercial options'
    }
  ],
  architect: [
    {
      softwareId: 'rhino',
      rank: 1,
      whyRecommended: [
        'Industry standard for complex architectural forms',
        'Powerful Grasshopper visual programming',
        'Excellent NURBS modeling capabilities',
        'Strong BIM and documentation workflows',
        'Perpetual license option available'
      ],
      bestFor: 'Complex geometry, computational design',
      consideration: 'Learning curve for Grasshopper'
    },
    {
      softwareId: 'sketchup',
      rank: 2,
      whyRecommended: [
        'Intuitive push-pull modeling',
        'Huge 3D Warehouse model library',
        'Easy client presentations'
      ],
      bestFor: 'Quick concept models, client communication',
      consideration: 'Limited for complex curved surfaces'
    },
    {
      softwareId: 'blender',
      rank: 3,
      whyRecommended: [
        'Excellent architectural visualization',
        'Free with professional render quality',
        'Growing arch-viz community'
      ],
      bestFor: 'Rendering and visualization on a budget',
      consideration: 'Not purpose-built for architecture'
    }
  ],
  concept: [
    {
      softwareId: 'plasticity',
      rank: 1,
      whyRecommended: [
        'Built specifically for fast concept iteration',
        'Clean, distraction-free interface',
        'Modern SubD and NURBS hybrid workflow',
        'Quick export to other tools',
        'Growing rapidly with frequent updates'
      ],
      bestFor: 'Industrial design concepts, hard-surface work',
      consideration: 'Newer software, still maturing'
    },
    {
      softwareId: 'blender',
      rank: 2,
      whyRecommended: [
        'Versatile for any concept style',
        'Grease Pencil for 2D/3D hybrid work',
        'Integrated rendering for presentations'
      ],
      bestFor: 'Mixed media concepts, animation tests',
      consideration: 'Feature-rich can be overwhelming'
    },
    {
      softwareId: 'rhino',
      rank: 3,
      whyRecommended: [
        'Precise curves for product design',
        'Grasshopper for generative exploration',
        'Industry-accepted file formats'
      ],
      bestFor: 'Product design, jewelry, automotive',
      consideration: 'Higher price point'
    }
  ],
  educator: [
    {
      softwareId: 'tinkercad',
      rank: 1,
      whyRecommended: [
        'Designed for classroom use',
        'Student account management built-in',
        'Lesson plans and curriculum available',
        'Zero setup, runs in browser',
        'Safe, moderated environment'
      ],
      bestFor: 'K-12 education, introduction to CAD',
      consideration: 'Students may outgrow it quickly'
    },
    {
      softwareId: 'fusion360',
      rank: 2,
      whyRecommended: [
        'Free for educators and students',
        'Industry-relevant skills',
        'Comprehensive learning resources'
      ],
      bestFor: 'High school to college, career prep',
      consideration: 'Requires more instruction time'
    },
    {
      softwareId: 'onshape',
      rank: 3,
      whyRecommended: [
        'Browser-based, no IT installation needed',
        'Real-time collaboration features',
        'Free educational accounts'
      ],
      bestFor: 'Team projects, remote learning',
      consideration: 'Requires stable internet connection'
    }
  ],
  mobile: [
    {
      softwareId: 'shapr3d',
      rank: 1,
      whyRecommended: [
        'Best-in-class iPad CAD experience',
        'Apple Pencil precision controls',
        'Parasolid kernel for professional accuracy',
        'Syncs across devices seamlessly',
        'Export to all major CAD formats'
      ],
      bestFor: 'Serious CAD work on iPad',
      consideration: 'Subscription model, iPad-focused'
    },
    {
      softwareId: 'nomad',
      rank: 2,
      whyRecommended: [
        'Best mobile sculpting app',
        'Works on iPad and Android',
        'One-time purchase model'
      ],
      bestFor: 'Organic sculpting on mobile',
      consideration: 'Sculpting only, not CAD'
    },
    {
      softwareId: 'onshape',
      rank: 3,
      whyRecommended: [
        'Full CAD in any browser',
        'Tablet and phone support',
        'Cloud collaboration built-in'
      ],
      bestFor: 'Cross-platform accessibility',
      consideration: 'Touch interface can be limiting'
    }
  ]
};

// ============= ID Mapping =============

const softwareIdToCadDataId: Record<string, string> = {
  tinkercad: 'tinkercad',
  fusion360: 'fusion-360',
  blender: 'blender',
  freecad: 'freecad',
  openscad: 'openscad',
  zbrush: 'zbrush',
  nomad: 'nomad-sculpt',
  solidworks: 'solidworks',
  rhino: 'rhino-3d',
  sketchup: 'sketchup',
  plasticity: 'plasticity',
  onshape: 'onshape',
  shapr3d: 'shapr3d'
};

// ============= Component =============

interface CADProfileSelectorProps {
  onScrollToComparison?: () => void;
  onLearnMore?: (cadDataId: string) => void;
}

const CADProfileSelector: React.FC<CADProfileSelectorProps> = ({ onScrollToComparison, onLearnMore }) => {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isSecondaryExpanded, setIsSecondaryExpanded] = useState(false);
  
  const recommendationsRef = useRef<HTMLDivElement>(null);
  
  const primaryProfiles = userProfiles.filter(p => p.isPrimary);
  const secondaryProfiles = userProfiles.filter(p => !p.isPrimary);
  
  const handleProfileSelect = (profileId: string) => {
    setSelectedProfile(profileId);
    setShowRecommendations(true);
    
    setTimeout(() => {
      recommendationsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };
  
  const handleBackToProfiles = () => {
    setShowRecommendations(false);
    setSelectedProfile(null);
  };

  const getSelectedProfileData = () => {
    return userProfiles.find(p => p.id === selectedProfile);
  };
  
  const getRecommendations = () => {
    if (!selectedProfile) return [];
    return profileRecommendations[selectedProfile] || [];
  };

  // ============= Profile Selector View =============
  if (!showRecommendations) {
    return (
      <section 
        id="profile-selector" 
        className="mb-8 border border-border rounded-lg bg-card p-6"
        aria-labelledby="profile-selector-title"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Target className="w-6 h-6 text-cyan-400" />
            <h2 id="profile-selector-title" className="text-xl font-bold font-mono text-foreground">
              Which best describes you?
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Select your profile for personalized recommendations
          </p>
        </div>
        
        {/* Primary Profiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {primaryProfiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onClick={handleProfileSelect}
            />
          ))}
        </div>
        
        {/* Expandable Secondary Profiles */}
        <div className="mb-6">
          <button
            className={cn(
              "w-full py-4 px-4",
              "bg-muted/20 hover:bg-muted/40",
              "border border-dashed border-border/50 hover:border-border",
              "rounded-lg",
              "text-sm font-medium text-muted-foreground hover:text-foreground",
              "flex items-center justify-center gap-2",
              "transition-all duration-200"
            )}
            onClick={() => setIsSecondaryExpanded(!isSecondaryExpanded)}
            aria-expanded={isSecondaryExpanded}
            aria-controls="secondary-profiles"
          >
            <span>{isSecondaryExpanded ? 'Show fewer profiles' : 'See 4 more profiles'}</span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              isSecondaryExpanded && "rotate-180"
            )} />
          </button>
          
          <div
            id="secondary-profiles"
            className={cn(
              "overflow-hidden transition-all duration-300",
              isSecondaryExpanded ? "max-h-[600px] opacity-100 mt-4" : "max-h-0 opacity-0"
            )}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {secondaryProfiles.map(profile => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onClick={handleProfileSelect}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Quiz Fallback */}
        <div className="flex justify-center pt-4 border-t border-border/50">
          <button
            className={cn(
              "inline-flex items-center gap-2",
              "px-5 py-3",
              "bg-transparent hover:bg-cyan-500/10",
              "border border-cyan-500/30 hover:border-cyan-500/50",
              "rounded-lg",
              "text-sm font-medium text-cyan-400",
              "transition-all duration-200"
            )}
            onClick={() => {
              // Could open a quiz modal or redirect
              alert('Quiz feature coming soon! For now, select the profile that best matches your needs.');
            }}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Not sure? Take our 90-second quiz</span>
          </button>
        </div>
      </section>
    );
  }

  // ============= Recommendations View =============
  const selectedProfileData = getSelectedProfileData();
  const recommendations = getRecommendations();
  
  if (!selectedProfileData || recommendations.length === 0) {
    return null;
  }
  
  const topPick = recommendations.find(r => r.rank === 1);
  const alternatives = recommendations.filter(r => r.rank !== 1);

  return (
    <section
      ref={recommendationsRef}
      className={cn(
        "mb-8 border border-border rounded-lg bg-card p-6",
        "animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
      )}
      aria-labelledby="recommendations-title"
    >
      {/* Back Button */}
      <button
        onClick={handleBackToProfiles}
        className={cn(
          "inline-flex items-center gap-2",
          "px-3 py-2 mb-6",
          "bg-transparent hover:bg-muted/50",
          "border border-border/50 hover:border-border",
          "rounded-lg",
          "text-sm font-medium text-muted-foreground hover:text-foreground",
          "transition-all duration-200"
        )}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to profiles</span>
      </button>
      
      {/* Header */}
      <div className="mb-6">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-lg text-xs font-bold uppercase tracking-wide"
          style={{ 
            backgroundColor: `${selectedProfileData.color}20`,
            border: `1px solid ${selectedProfileData.color}40`,
            color: selectedProfileData.color
          }}
        >
          {selectedProfileData.icon}
          <span>{selectedProfileData.title}</span>
        </div>
        
        <h2 id="recommendations-title" className="text-2xl font-bold text-foreground mb-2">
          Our Top Recommendations
        </h2>
        <p className="text-muted-foreground">
          Based on your profile, here are our top picks
        </p>
      </div>
      
      {/* Top Pick Card */}
      {topPick && (
        <TopPickCard
          software={softwareData[topPick.softwareId]}
          recommendation={topPick}
          onLearnMore={onLearnMore}
        />
      )}
      
      {/* Alternative Picks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {alternatives.map(rec => (
          <AlternativeCard
            key={rec.softwareId}
            software={softwareData[rec.softwareId]}
            recommendation={rec}
            onLearnMore={onLearnMore}
          />
        ))}
      </div>
      
      {/* View Full Comparison */}
      <button
        onClick={onScrollToComparison}
        className={cn(
          "w-full py-4",
          "bg-transparent hover:bg-muted/30",
          "border border-dashed border-border/50 hover:border-border",
          "rounded-lg",
          "text-sm font-medium text-muted-foreground hover:text-foreground",
          "flex items-center justify-center gap-2",
          "transition-all duration-200"
        )}
      >
        <span>View Full Comparison Table</span>
        <ChevronDown className="w-4 h-4" />
      </button>
    </section>
  );
};

// ============= Profile Card Component =============

const ProfileCard: React.FC<{
  profile: UserProfile;
  onClick: (id: string) => void;
}> = ({ profile, onClick }) => {
  return (
    <button
      onClick={() => onClick(profile.id)}
      className={cn(
        "w-full min-h-[180px] p-5",
        "bg-muted/20 hover:bg-muted/40",
        "border-2 border-border/50 hover:border-current",
        "rounded-xl",
        "flex flex-col items-start text-left",
        "cursor-pointer",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg"
      )}
      style={{ 
        '--tw-shadow-color': `${profile.color}20`,
      } as React.CSSProperties}
      aria-label={`Select ${profile.title} profile`}
    >
      {/* Icon */}
      <div
        className="w-14 h-14 mb-4 rounded-xl flex items-center justify-center"
        style={{ 
          backgroundColor: `${profile.color}20`,
          border: `1px solid ${profile.color}40`
        }}
      >
        <div style={{ color: profile.color }}>
          {profile.icon}
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-bold text-foreground mb-1">
        {profile.title}
      </h3>
      
      {/* Subtitle */}
      <p className="text-sm font-semibold text-cyan-400 mb-2">
        {profile.subtitle}
      </p>
      
      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 flex-1">
        {profile.description}
      </p>
      
      {/* Select Action */}
      <span
        className="inline-flex items-center gap-1.5 text-sm font-semibold group"
        style={{ color: profile.color }}
      >
        <span>Select</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  );
};

// ============= Top Pick Card Component =============

const TopPickCard: React.FC<{
  software: SoftwareInfo;
  recommendation: ProfileRecommendation;
  onLearnMore?: (cadDataId: string) => void;
}> = ({ software, recommendation, onLearnMore }) => {
  const handleLearnMore = () => {
    const cadDataId = softwareIdToCadDataId[recommendation.softwareId];
    if (cadDataId && onLearnMore) {
      onLearnMore(cadDataId);
    }
  };
  return (
    <div className="relative w-full p-6 mb-6 bg-muted/20 border-2 border-cyan-500/30 rounded-xl overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400" />
      
      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-5 bg-cyan-500/15 border border-cyan-500/30 rounded-md text-xs font-bold text-cyan-400 uppercase tracking-wide">
        <Trophy className="w-3.5 h-3.5" />
        <span>#1 Top Pick</span>
      </div>
      
      {/* Header */}
      <div className="flex items-start gap-5 mb-6">
        <div className="w-16 h-16 bg-muted/30 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-foreground">
            {software.name.charAt(0)}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-foreground mb-2">
            {software.name}
          </h3>
          <SoftwareBadges
            priceType={software.priceType}
            overallScore={software.overallScore}
            skillLevel={software.skillLevel}
          />
        </div>
      </div>
      
      {/* Why We Recommend */}
      <div className="mb-5">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
          Why We Recommend
        </h4>
        <ul className="space-y-2.5">
          {recommendation.whyRecommended.map((reason, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{reason}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Context Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-border/50">
        <div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
            Best For
          </div>
          <div className="text-sm text-foreground/80">
            {recommendation.bestFor}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
            Consider
          </div>
          <div className="text-sm text-foreground/80">
            {recommendation.consideration}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button 
          onClick={handleLearnMore}
          className="flex-1 h-12 px-6 bg-cyan-500 hover:bg-cyan-400 rounded-lg text-sm font-semibold text-background inline-flex items-center justify-center gap-2 transition-colors"
        >
          <span>Learn More</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button className="flex-1 h-12 px-6 bg-transparent hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-sm font-semibold text-cyan-400 inline-flex items-center justify-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add to Compare</span>
        </button>
      </div>
    </div>
  );
};

// ============= Alternative Card Component =============

const AlternativeCard: React.FC<{
  software: SoftwareInfo;
  recommendation: ProfileRecommendation;
  onLearnMore?: (cadDataId: string) => void;
}> = ({ software, recommendation, onLearnMore }) => {
  const badgeText = recommendation.rank === 2 ? '#2 Great Alternative' : '#3 Also Consider';
  
  const handleLearnMore = () => {
    const cadDataId = softwareIdToCadDataId[recommendation.softwareId];
    if (cadDataId && onLearnMore) {
      onLearnMore(cadDataId);
    }
  };
  
  return (
    <div className="p-5 bg-muted/10 border border-border/50 hover:border-border rounded-xl transition-colors">
      {/* Badge */}
      <div className="inline-block px-2.5 py-1 mb-4 bg-muted/30 rounded text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
        {badgeText}
      </div>
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-muted/30 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-foreground">
            {software.name.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-foreground mb-1.5">
            {software.name}
          </h4>
          <SoftwareBadges
            priceType={software.priceType}
            overallScore={software.overallScore}
            skillLevel={software.skillLevel}
            compact
          />
        </div>
      </div>
      
      {/* Reasons */}
      <ul className="space-y-2 mb-4">
        {recommendation.whyRecommended.slice(0, 3).map((reason, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-xs text-foreground/80">{reason}</span>
          </li>
        ))}
      </ul>
      
      {/* Action */}
      <button 
        onClick={handleLearnMore}
        className="w-full h-10 bg-transparent hover:bg-muted/30 border border-border/50 hover:border-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 transition-colors"
      >
        <span>Learn More</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default CADProfileSelector;
