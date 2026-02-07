import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, FolderGit2, Star, Table, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { repoData } from "@/lib/repoData";
import { FilterProvider } from "@/contexts/PlatformFilterContext";
import ReposHeroSection from "@/components/reference/ReposHeroSection";
import StaffPicksSection from "@/components/reference/repos/StaffPicksSection";
import SpecializedSection from "@/components/reference/repos/SpecializedSection";
import { ReposFilterSidebar, ReposMobileFilterSheet } from "@/components/reference/repos/ReposFilterSidebar";
import NoResultsEmpty from "@/components/reference/repos/NoResultsEmpty";
import MobileComparisonView from "@/components/reference/repos/mobile/MobileComparisonView";
import ReposComparisonTable from "@/components/reference/repos/ReposComparisonTable";
import ReposProfileAccordion from "@/components/reference/repos/ReposProfileAccordion";
import { RatingLevel } from "@/lib/platformData";

// Helper to convert numeric ratings (1-5) to semantic labels
const mapNumberToSemantic = (num: number): RatingLevel => {
  if (num >= 5) return 'excellent';
  if (num >= 4) return 'great';
  if (num >= 3) return 'good';
  if (num >= 2) return 'average';
  return 'limited';
};

// Logo mapping for repositories
const repoLogos: Record<string, string> = {
  "MakerWorld": "/images/repos/makerworld.png",
  "Printables": "/images/repos/printables.png",
  "Thingiverse": "/images/repos/thingiverse.png",
  "Cults3D": "/images/repos/cults3d.png",
  "MyMiniFactory": "/images/repos/myminifactory.png",
  "Thangs": "/images/repos/thangs.png",
  "Creality Cloud": "/images/repos/crealitycloud.png",
  "GrabCAD": "/images/repos/grabcad.png",
};

const repoComparison = [
  { name: "MakerWorld", owner: "Bambu Lab", model: "Loss-Leader", free: true, paid: false, quality: 4, community: 3, monetization: 5, search: 4, ux: 5, mobile: true, fileTypes: "3MF/STL", standout: "One-Click Print Profiles" },
  { name: "Printables", owner: "Prusa Research", model: "Hybrid", free: true, paid: true, quality: 5, community: 5, monetization: 4, search: 5, ux: 5, mobile: false, fileTypes: "STL/3MF/G-code", standout: "Prusameters & Clubs" },
  { name: "Thingiverse", owner: "UltiMaker", model: "Ad-Supported", free: true, paid: false, quality: 2, community: 3, monetization: 1, search: 2, ux: 2, mobile: false, fileTypes: "STL/OBJ", standout: "Largest Archive (6.7M+)" },
  { name: "Cults3D", owner: "Independent", model: "Marketplace", free: true, paid: true, quality: 4, community: 3, monetization: 5, search: 4, ux: 4, mobile: false, fileTypes: "STL/OBJ/3MF", standout: "80/20 Commission Split" },
  { name: "MyMiniFactory", owner: "MMF (UK)", model: "Premium", free: false, paid: true, quality: 5, community: 4, monetization: 5, search: 4, ux: 4, mobile: false, fileTypes: "STL/OBJ", standout: "Guaranteed Printable" },
  { name: "Thangs", owner: "Physna", model: "Search + Sub", free: true, paid: true, quality: 4, community: 3, monetization: 4, search: 5, ux: 4, mobile: false, fileTypes: "30+ formats", standout: "Geometric AI Search" },
  { name: "Creality Cloud", owner: "Creality", model: "Mobile Sub", free: true, paid: true, quality: 2, community: 2, monetization: 3, search: 3, ux: 3, mobile: true, fileTypes: "STL/G-code", standout: "Phone-to-Print" },
  { name: "GrabCAD", owner: "Stratasys", model: "Lead Gen", free: true, paid: false, quality: 5, community: 4, monetization: 1, search: 4, ux: 4, mobile: false, fileTypes: "STEP/IGES/CAD", standout: "Engineering CAD Files" },
];

type ReposTab = "recommendations" | "comparison" | "profiles";

const tabs = [
  { id: "recommendations" as ReposTab, label: "Recommendations", icon: Star },
  { id: "comparison" as ReposTab, label: "Full Comparison", icon: Table },
  { id: "profiles" as ReposTab, label: "Platform Profiles", icon: FileText, count: repoData.length },
];

const ReferenceRepos = () => {
  const [activeTab, setActiveTab] = useState<ReposTab>("recommendations");
  const [isScrolled, setIsScrolled] = useState(false);

  const tabsRef = useRef<HTMLDivElement>(null);
  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Scroll listener for sticky shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update underline indicator position
  useEffect(() => {
    const activeButton = tabButtonRefs.current.get(activeTab);
    const indicator = tabIndicatorRef.current;
    if (activeButton && indicator) {
      const { offsetLeft, offsetWidth } = activeButton;
      indicator.style.left = `${offsetLeft}px`;
      indicator.style.width = `${offsetWidth}px`;
    }
  }, [activeTab]);

  const handleTabChange = (tabId: ReposTab) => {
    setActiveTab(tabId);
    // Smooth scroll to content
    const contentSection = document.getElementById('repos-content-section');
    if (contentSection) {
      const offsetTop = contentSection.offsetTop - 80;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  // Prepare mobile platforms data
  const mobilePlatforms = useMemo(() => {
    return repoData.map((repo) => {
      const comparison = repoComparison.find(r => r.name === repo.name);
      return {
        id: repo.id,
        name: repo.name,
        owner: repo.owner,
        logo: repoLogos[repo.name] || '',
        overallScore: comparison ? parseFloat(((comparison.quality + comparison.community + comparison.monetization + comparison.search + comparison.ux) / 5 * 2).toFixed(1)) : 0,
        modelType: comparison?.model || 'Unknown',
        ratings: {
          quality: mapNumberToSemantic(comparison?.quality || 0),
          community: mapNumberToSemantic(comparison?.community || 0),
          search: mapNumberToSemantic(comparison?.search || 0),
          ux: mapNumberToSemantic(comparison?.ux || 0),
          monetization: mapNumberToSemantic(comparison?.monetization || 0),
        },
        features: {
          free: comparison?.free || false,
          mobile: comparison?.mobile || false,
        },
        fileTypes: comparison?.fileTypes?.split('/') || [],
        bestFor: repo.bestFor?.join('. ') || '',
        websiteUrl: repo.links?.website || '#',
      };
    });
  }, []);

  // Prepare comparison data for accordion
  const comparisonDataMap = useMemo(() => {
    const map: Record<string, {
      quality: number;
      community: number;
      search: number;
      ux: number;
      monetization: number;
      mobile: boolean;
      model: string;
    }> = {};
    repoComparison.forEach(repo => {
      map[repo.name] = {
        quality: repo.quality,
        community: repo.community,
        search: repo.search,
        ux: repo.ux,
        monetization: repo.monetization,
        mobile: repo.mobile,
        model: repo.model,
      };
    });
    return map;
  }, []);

  const scrollToComparison = useCallback(() => {
    setActiveTab("comparison");
    setTimeout(() => {
      const contentSection = document.getElementById('repos-content-section');
      if (contentSection) {
        const offsetTop = contentSection.offsetTop - 80;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    }, 100);
  }, []);

  return (
    <FilterProvider>
      <Helmet>
        <title>3D Model Repositories — Find Printable Models | FilaScope</title>
        <meta name="description" content="Discover the best 3D model repositories. Compare platforms for free printable models, community features, and file quality." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/20 border border-primary/30">
                <FolderGit2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">3D Model Repositories</h1>
                <p className="text-muted-foreground">Complete reference guide to 3D print file platforms & marketplaces</p>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <ReposHeroSection 
            platformCount={repoData.length} 
            onScrollToComparison={scrollToComparison} 
          />

          {/* Sticky Tab Navigation */}
          <div
            ref={tabsRef}
            className={cn(
              "sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border transition-shadow duration-300",
              isScrolled && "shadow-md shadow-black/10"
            )}
          >
            <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
              {/* Desktop Tabs */}
              <nav className="hidden sm:flex relative" role="tablist">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    ref={(el) => el && tabButtonRefs.current.set(tab.id, el)}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-4 text-sm font-medium relative z-10",
                      "transition-colors duration-200",
                      activeTab === tab.id
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.label.split(' ')[0]}</span>
                    {tab.count && (
                      <span className={cn(
                        "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors duration-300",
                        activeTab === tab.id
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
                {/* Sliding underline indicator */}
                <div
                  ref={tabIndicatorRef}
                  className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-out"
                  style={{ left: 0, width: 0 }}
                />
              </nav>

              {/* Mobile Dropdown */}
              <div className="sm:hidden py-3">
                <div className="relative">
                  <select
                    value={activeTab}
                    onChange={(e) => handleTabChange(e.target.value as ReposTab)}
                    className="w-full appearance-none bg-card border border-border rounded-lg px-4 py-3 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {tabs.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.label} {tab.count ? `(${tab.count})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div id="repos-content-section" className="py-8">
            {/* Recommendations Tab */}
            {activeTab === "recommendations" && (
              <div key="recommendations" className="animate-fade-in">
                {/* Mobile Filter Button */}
                <div className="lg:hidden mb-6">
                  <ReposMobileFilterSheet />
                </div>

                {/* Desktop: Sidebar + Content Layout */}
                <div className="hidden lg:flex gap-8">
                  {/* Left Sidebar */}
                  <ReposFilterSidebar />

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Staff Picks */}
                    <StaffPicksSection />

                    {/* Specialized Options */}
                    <SpecializedSection />

                    {/* Empty State */}
                    <NoResultsEmpty />
                  </div>
                </div>

                {/* Mobile View - Full Width */}
                <div className="lg:hidden">
                  <StaffPicksSection />
                  <SpecializedSection />
                  <NoResultsEmpty />
                </div>
              </div>
            )}

            {/* Full Comparison Tab */}
            {activeTab === "comparison" && (
              <div key="comparison" className="animate-fade-in">
                {/* Mobile Filter Button */}
                <div className="lg:hidden mb-6">
                  <ReposMobileFilterSheet />
                </div>

                {/* Desktop: Sidebar + Content Layout */}
                <div className="hidden lg:flex gap-8">
                  {/* Left Sidebar */}
                  <ReposFilterSidebar />

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <ReposComparisonTable data={repoComparison} logos={repoLogos} />
                  </div>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden">
                  <div className="hidden md:block">
                    <ReposComparisonTable data={repoComparison} logos={repoLogos} />
                  </div>
                  <div className="md:hidden">
                    <MobileComparisonView platforms={mobilePlatforms} />
                  </div>
                </div>
              </div>
            )}

            {/* Platform Profiles Tab */}
            {activeTab === "profiles" && (
              <div key="profiles" className="animate-fade-in">
                {/* Mobile Filter Button */}
                <div className="lg:hidden mb-6">
                  <ReposMobileFilterSheet />
                </div>

                {/* Desktop: Sidebar + Content Layout */}
                <div className="hidden lg:flex gap-8">
                  {/* Left Sidebar */}
                  <ReposFilterSidebar />

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-foreground mb-2">Detailed Platform Profiles</h2>
                      <p className="text-sm text-muted-foreground">
                        In-depth analysis of each platform's strengths, weaknesses, and best use cases
                      </p>
                    </div>

                    <ReposProfileAccordion
                      platforms={repoData}
                      logos={repoLogos}
                      comparisonData={comparisonDataMap}
                    />
                  </div>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-foreground mb-2">Detailed Platform Profiles</h2>
                    <p className="text-sm text-muted-foreground">
                      In-depth analysis of each platform's strengths, weaknesses, and best use cases
                    </p>
                  </div>

                  <ReposProfileAccordion
                    platforms={repoData}
                    logos={repoLogos}
                    comparisonData={comparisonDataMap}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </FilterProvider>
  );
};

export default ReferenceRepos;
