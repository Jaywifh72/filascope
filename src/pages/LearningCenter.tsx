import React, { useState, useMemo } from 'react';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { CollectionPageSchema, ItemListSchema } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Search, 
  Clock, 
  ChevronRight,
  Sparkles,
  GraduationCap,
  Wrench,
  Flame,
  Target,
  ArrowRight,
  Calendar,
  ShoppingBag,
  Layers,
  Printer,
  X,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

// Guide metadata type
export interface GuideMetadata {
  slug: string;
  title: string;
  description: string;
  category: 'beginner' | 'materials' | 'troubleshooting' | 'advanced' | 'buying-guide' | 'hueforge' | 'printer-specific';
  readTime: number; // in minutes
  publishedAt: string;
  updatedAt?: string;
  featured?: boolean;
  image?: string;
  /** If set, link goes to /guides/:slug instead of /learn/:slug */
  isBuyingGuide?: boolean;
  /** Override the default link — used for standalone pages not in either /learn or /guides */
  customUrl?: string;
}

// All guides data
export const GUIDES: GuideMetadata[] = [
  // New buying guides
  {
    slug: 'best-pla-filaments',
    title: 'Best PLA Filaments in 2026',
    description: 'Our data-driven ranking of the top 10 PLA filaments. Compare scores, prices, and specs with live regional pricing.',
    category: 'buying-guide',
    readTime: 12,
    publishedAt: '2026-01-15',
    updatedAt: '2026-02-01',
    featured: true,
    isBuyingGuide: true,
  },
  {
    slug: 'pla-vs-petg',
    title: 'PLA vs PETG: Which Should You Choose?',
    description: 'Side-by-side comparison of the two most popular materials with data-backed recommendations for every scenario.',
    category: 'buying-guide',
    readTime: 10,
    publishedAt: '2026-01-18',
    updatedAt: '2026-02-01',
    featured: true,
    isBuyingGuide: true,
  },
  {
    slug: 'best-petg-filaments',
    title: 'Best PETG Filaments in 2026',
    description: 'Data-driven ranking of the top 10 PETG filaments for functional parts that need strength and heat resistance.',
    category: 'buying-guide',
    readTime: 11,
    publishedAt: '2026-01-20',
    isBuyingGuide: true,
  },
  {
    slug: 'best-abs-filaments',
    title: 'Best ABS Filaments in 2026',
    description: 'Top 10 ABS filaments for engineering applications, ranked by FilaScore with regional pricing.',
    category: 'buying-guide',
    readTime: 13,
    publishedAt: '2026-01-25',
    isBuyingGuide: true,
  },
  {
    slug: 'beginners-guide',
    title: "Complete Beginner's Guide to 3D Printing Filaments",
    description: 'Everything a new 3D printer owner needs to know about filament materials, settings, and choosing the right product.',
    category: 'buying-guide',
    readTime: 15,
    publishedAt: '2026-01-10',
    updatedAt: '2026-02-01',
    isBuyingGuide: true,
  },
  {
    slug: 'hueforge-filaments',
    title: 'Best Filaments for HueForge Printing',
    description: 'TD-ranked filament recommendations for HueForge lithophane printing with explanations of transmissivity.',
    category: 'buying-guide',
    readTime: 14,
    publishedAt: '2026-01-22',
    isBuyingGuide: true,
  },
  {
    slug: 'best-filaments-for-hueforge-lithophanes',
    title: 'Best Filaments for HueForge Lithophanes',
    description: 'Top-rated filaments for HueForge lithophane printing, ranked by TD value, print quality and price.',
    category: 'buying-guide',
    readTime: 14,
    publishedAt: '2026-02-14',
    isBuyingGuide: true,
  },
  {
    slug: 'pla-plus-vs-pla-pro',
    title: 'PLA+ vs PLA Pro: Which Should You Choose?',
    description: 'PLA+ and PLA Pro compared — naming confusion explained with specs and brand-by-brand breakdown.',
    category: 'buying-guide',
    readTime: 10,
    publishedAt: '2026-02-14',
    isBuyingGuide: true,
  },
  {
    slug: 'best-filament-for-bambu-lab-p1s',
    title: 'Best Filaments for Bambu Lab P1S',
    description: 'Top filaments tested and ranked for Bambu Lab P1S with AMS compatibility notes and print settings.',
    category: 'buying-guide',
    readTime: 13,
    publishedAt: '2026-02-14',
    isBuyingGuide: true,
  },
  {
    slug: 'silk-pla-comparison',
    title: 'Best Silk PLA Filaments Compared',
    description: 'Compare the best silk PLA filaments for glossy, metallic prints — ranked by quality, color selection and price.',
    category: 'buying-guide',
    readTime: 11,
    publishedAt: '2026-02-14',
    isBuyingGuide: true,
  },
  {
    slug: 'asa-vs-abs-outdoor-printing',
    title: 'ASA vs ABS: Which is Better for Outdoor Printing?',
    description: 'ASA vs ABS compared for outdoor use — UV resistance, heat tolerance, warping and print difficulty.',
    category: 'buying-guide',
    readTime: 12,
    publishedAt: '2026-02-14',
    isBuyingGuide: true,
  },
  // ─── NEW GUIDES (2026-02-20) ──────────────────────────────────────────────
  { slug: 'best-tpu-filaments', title: 'Best TPU Filaments in 2026', description: 'Flexible filament ranked by Shore hardness, print quality, and compatibility with Bambu Lab, Ender 3, and Prusa printers.', category: 'buying-guide', readTime: 11, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'best-asa-filaments', title: 'Best ASA Filaments in 2026', description: 'UV-resistant filament for outdoor applications — ranked by weathering performance, printability, and brand quality.', category: 'buying-guide', readTime: 11, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'best-nylon-filaments', title: 'Best Nylon Filaments in 2026', description: 'PA6, PA12, and carbon-fiber nylon ranked for engineering applications requiring maximum strength and fatigue resistance.', category: 'buying-guide', readTime: 13, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'best-pc-filaments', title: 'Best Polycarbonate (PC) Filaments in 2026', description: 'The strongest common FDM filaments ranked — polycarbonate for high heat resistance and extreme impact performance.', category: 'buying-guide', readTime: 12, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'best-budget-filaments', title: 'Best Budget Filaments Under $15/kg in 2026', description: 'The best cheap 3D printer filaments ranked by quality and consistency — because affordable doesn\'t have to mean bad.', category: 'buying-guide', readTime: 10, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'best-high-speed-pla-filaments', title: 'Best High-Speed PLA Filaments in 2026', description: 'PLA filaments optimized for 150–600mm/s printing on Bambu Lab, Voron, and RatRig printers — ranked by flow rate and quality.', category: 'buying-guide', readTime: 11, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'petg-vs-abs', title: 'PETG vs ABS: Which Should You Choose?', description: 'A data-driven comparison of PETG and ABS for functional parts — strength, heat resistance, ease of printing, and fumes.', category: 'buying-guide', readTime: 10, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'tpu-vs-petg', title: 'TPU vs PETG: Flexible vs Rigid Filament Compared', description: 'When to use flexible TPU vs rigid PETG — key property differences and use-case recommendations.', category: 'buying-guide', readTime: 9, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'best-filaments-for-miniatures', title: 'Best Filaments for Miniatures & Detailed Prints in 2026', description: 'Top PLA filaments for tabletop miniatures ranked by surface finish, detail resolution, and 0.2mm nozzle compatibility.', category: 'buying-guide', readTime: 11, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'best-filaments-for-functional-parts', title: 'Best Filaments for Functional Parts in 2026', description: 'PETG, ABS, ASA, and Nylon ranked for mechanical and structural applications by strength, heat resistance, and printability.', category: 'buying-guide', readTime: 13, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'best-filaments-for-outdoor-use', title: 'Best Filaments for Outdoor Use in 2026', description: 'UV-resistant and weatherproof filament materials ranked for outdoor 3D printing durability — ASA, PETG, and ABS compared.', category: 'buying-guide', readTime: 10, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'hueforge-beginners-guide', title: 'Complete HueForge Guide for Beginners', description: 'Everything you need to start creating HueForge lithophanes — TD values, software setup, filament selection, and first print.', category: 'hueforge', readTime: 16, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'understanding-td-values', title: 'Understanding TD Values: What They Mean and Why They Matter', description: 'A complete explanation of Transmission Distance values — what they measure, how they\'re calibrated, and how to get accurate HueForge prints.', category: 'hueforge', readTime: 12, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'hueforge-color-selection', title: 'HueForge Color Selection: How to Pick the Right Filaments', description: 'How to build a balanced TD stack and match filament colors to your HueForge image tones for stunning results.', category: 'hueforge', readTime: 13, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'best-filament-for-prusa-mk4', title: 'Best Filaments for Prusa MK4 in 2026', description: 'PLA, PETG, ASA, and specialty filament recommendations for Prusa MK4 with MMU3 compatibility notes and PrusaSlicer guidance.', category: 'printer-specific', readTime: 11, publishedAt: '2026-02-20', isBuyingGuide: true },
  { slug: 'best-filament-for-creality-k1', title: 'Best Filaments for Creality K1 & K1 Max in 2026', description: 'High-speed PLA, PETG, and ABS recommendations for Creality K1 and K1 Max with settings for 300–600mm/s printing.', category: 'printer-specific', readTime: 10, publishedAt: '2026-02-20', isBuyingGuide: true },
  // ─── NEW GUIDES (2026-02-28) ──────────────────────────────────────────────
  { slug: 'how-to-choose-filament', title: 'How to Choose 3D Printer Filament — Complete Guide', description: 'Step-by-step guide to choosing the right 3D printer filament for your project based on material, use case, and printer compatibility.', category: 'buying-guide', readTime: 12, publishedAt: '2026-02-28', isBuyingGuide: true },
  { slug: 'strongest-3d-printer-filament', title: 'Strongest 3D Printer Filament — Complete Strength Guide', description: 'Compare the strongest FDM filaments by tensile strength, impact resistance, and layer adhesion with data-driven rankings.', category: 'buying-guide', readTime: 11, publishedAt: '2026-02-28', isBuyingGuide: true },
  { slug: 'how-to-store-filament', title: 'How to Store 3D Printer Filament Properly', description: 'Complete guide to filament storage — vacuum bags, dry boxes, desiccant, and humidity control to keep your filament printing perfectly.', category: 'troubleshooting', readTime: 9, publishedAt: '2026-02-28', isBuyingGuide: true },
  { slug: 'how-to-dry-filament', title: 'How to Dry 3D Printer Filament — Temperature & Time Guide', description: 'Exact drying temperatures and times for PLA, PETG, ABS, TPU, Nylon, and ASA. Oven, dehydrator, and filament dryer methods compared.', category: 'troubleshooting', readTime: 8, publishedAt: '2026-02-28', isBuyingGuide: true },
  { slug: 'food-safe-filament', title: 'What 3D Printer Filament Is Food Safe?', description: 'Compare FDA-approved PETG, PLA, and specialty filaments for food contact. Covers safety certifications, printing tips, and best brands.', category: 'materials', readTime: 10, publishedAt: '2026-02-28', isBuyingGuide: true },
  // Existing editorial guides
  {
    slug: 'pla-vs-petg-vs-abs',
    title: 'PLA vs PETG vs ABS: Which Filament Should You Choose?',
    description: 'A comprehensive comparison of the three most popular 3D printing filaments. Learn when to use each material for optimal results.',
    category: 'materials',
    readTime: 12,
    publishedAt: '2025-01-15',
  },
  {
    slug: 'best-filament-for-beginners-2025',
    title: 'Best Filament for Beginners in 2025',
    description: 'New to 3D printing? Discover the easiest filaments to print with and our top picks for getting started.',
    category: 'beginner',
    readTime: 8,
    publishedAt: '2025-01-10',
  },
  {
    slug: 'how-to-choose-3d-printer-budget',
    title: 'How to Choose a 3D Printer for Your Budget',
    description: 'From $200 to $2000+, learn what features matter at each price point and which printers offer the best value.',
    category: 'beginner',
    readTime: 15,
    publishedAt: '2025-01-08',
  },
  {
    slug: 'understanding-filament-temperature-settings',
    title: 'Understanding Filament Temperature Settings',
    description: 'Master nozzle and bed temperatures for perfect prints. Learn how temperature affects print quality and troubleshoot common issues.',
    category: 'troubleshooting',
    readTime: 10,
    publishedAt: '2025-01-05',
  },
  {
    slug: 'top-10-filaments-functional-parts',
    title: 'Top 10 Filaments for Functional Parts',
    description: 'Need strong, durable prints? These are the best filaments for mechanical parts, tools, and functional prototypes.',
    category: 'advanced',
    readTime: 14,
    publishedAt: '2025-01-01',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Guides', icon: BookOpen },
  { id: 'buying-guide', label: 'Buying Guides', icon: ShoppingBag },
  { id: 'hueforge', label: 'HueForge', icon: Layers },
  { id: 'printer-specific', label: 'Printer Guides', icon: Printer },
  { id: 'beginner', label: 'Beginner Basics', icon: GraduationCap },
  { id: 'materials', label: 'Material Guides', icon: Flame },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: Wrench },
  { id: 'advanced', label: 'Advanced Techniques', icon: Target },
];

const getCategoryConfig = (category: string) => {
  switch (category) {
    case 'beginner':
      return { label: 'Beginner', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    case 'materials':
      return { label: 'Materials', color: 'bg-primary/10 text-primary border-primary/20' };
    case 'troubleshooting':
      return { label: 'Troubleshooting', color: 'bg-destructive/10 text-destructive border-destructive/20' };
    case 'advanced':
      return { label: 'Advanced', color: 'bg-secondary text-secondary-foreground border-border' };
    case 'buying-guide':
      return { label: 'Buying Guide', color: 'bg-primary/10 text-primary border-primary/20' };
    case 'hueforge':
      return { label: 'HueForge', color: 'bg-accent text-accent-foreground border-border' };
    case 'printer-specific':
      return { label: 'Printer Guide', color: 'bg-muted text-muted-foreground border-border' };
    default:
      return { label: category, color: 'bg-primary/10 text-primary border-primary/20' };
  }
};

function GuideCard({ guide }: { guide: GuideMetadata }) {
  const categoryConfig = getCategoryConfig(guide.category);
  
  const linkTo = guide.isBuyingGuide ? `/guides/${guide.slug}` : `/guides/${guide.slug}`;

  return (
    <Link to={linkTo}>
      <Card className="bg-card/50 border-border hover:border-primary/50 hover:bg-card/80 transition-all group h-full">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className={categoryConfig.color}>
              {categoryConfig.label}
            </Badge>
            {guide.featured && (
              <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                <Sparkles className="w-3 h-3" />
                Featured
              </Badge>
            )}
          </div>

          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {guide.title}
          </h3>

          <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">
            {guide.description}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {guide.readTime} min read
            </div>
            <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Read Guide
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function FeaturedGuideCard({ guide }: { guide: GuideMetadata }) {
  const categoryConfig = getCategoryConfig(guide.category);

  const linkTo = guide.isBuyingGuide ? `/guides/${guide.slug}` : `/guides/${guide.slug}`;
  
  return (
    <Link to={linkTo}>
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50 transition-all group overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className={categoryConfig.color}>
              {categoryConfig.label}
            </Badge>
            <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
              <Sparkles className="w-3 h-3" />
              Featured Guide
            </Badge>
          </div>
          
          <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
            {guide.title}
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-2xl">
            {guide.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {guide.readTime} min read
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(guide.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            
            <Button className="gap-2 group-hover:gap-3 transition-all">
              Read Guide
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function LearningCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  const filteredGuides = useMemo(() => {
    return GUIDES.filter(guide => {
      const matchesSearch = searchTerm === '' || 
        guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guide.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = activeCategory === 'all' || guide.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);
  
  const featuredGuides = GUIDES.filter(g => g.featured).slice(0, 2);
  const regularGuides = filteredGuides.filter(g => !g.featured || activeCategory !== 'all' || searchTerm !== '');

  const guideCount = GUIDES.length;
  const categoryCount = CATEGORIES.length - 1; // exclude "All"
  const lcMetaDesc = `Explore ${guideCount}+ 3D printing guides across ${categoryCount} categories — material comparisons, print settings, troubleshooting, and buying recommendations.`;

  return (
    <>
    <DocumentHead
      title="3D Printing Guides, Tutorials & Buying Advice | FilaScope"
      description="Free 3D printing guides: filament buying advice, material comparisons, HueForge tutorials, and troubleshooting — backed by data from 16,000+ filaments across 49+ brands."
      ogTitle="3D Printing Guides, Tutorials & Buying Advice | FilaScope"
      ogDescription="Free 3D printing guides: filament buying advice, material comparisons, HueForge tutorials, and troubleshooting — backed by data from 16,000+ filaments across 49+ brands."
    />
    <CollectionPageSchema
      name="3D Printing Guides, Tutorials & Buying Advice"
      description={lcMetaDesc}
      url="https://filascope.com/guides"
      numberOfItems={GUIDES.length}
    />
    <ItemListSchema
      name="3D Printing Guides"
      items={[...GUIDES].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 30).map((g, i) => ({
        position: i + 1,
        name: g.title,
        url: `https://filascope.com/guides/${g.slug}`,
        description: g.description,
      }))}
    />
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Visible breadcrumb trail */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Breadcrumbs items={[{ name: "Guides", url: "/guides" }]} />
      </div>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-primary/10 to-transparent opacity-50" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              LEARNING CENTER
            </Badge>
            
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              3D Printing Guides, Tutorials & Buying Advice
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              FilaScope's library of <strong className="text-foreground">3D printing guides</strong> covers everything from material comparisons and <strong className="text-foreground">filament buying guide</strong> content to <strong className="text-foreground">HueForge tutorial</strong> walkthroughs and troubleshooting tips. Every recommendation is backed by real data from our database of 8,200+ filaments across 48+ brands. Whether you need a quick <strong className="text-foreground">filament comparison</strong> between PLA and PETG, a deep-dive into TD values for lithophane printing, or curated picks for a specific printer, you'll find actionable, data-driven advice here — always free, always up to date.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search guides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base bg-background/80 border-border/50"
              />
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-8 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">{GUIDES.length}</span>
                <span className="text-muted-foreground">Guides</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">4</span>
                <span className="text-muted-foreground">Categories</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">Free</span>
                <span className="text-muted-foreground">Forever</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className="gap-2"
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </Button>
          ))}
        </div>
        
        {/* Categorized H2 sections (only show on 'all' category with no search) */}
        {activeCategory === 'all' && searchTerm === '' ? (
          <>
            {/* Featured Guides */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Featured Guides
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {featuredGuides.map((guide) => (
                  <FeaturedGuideCard key={guide.slug} guide={guide} />
                ))}
              </div>
            </section>

            {/* Buying Guides */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Buying Guides</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {GUIDES.filter(g => g.category === 'buying-guide' && !g.category.includes('hueforge')).filter(g => 
                  ['best-pla-filaments', 'best-petg-filaments', 'best-abs-filaments', 'beginners-guide', 'best-budget-filaments', 'best-tpu-filaments', 'best-asa-filaments', 'best-nylon-filaments', 'best-pc-filaments', 'best-high-speed-pla-filaments', 'best-filaments-for-functional-parts', 'best-filaments-for-miniatures'].includes(g.slug)
                ).map(guide => (
                  <GuideCard key={guide.slug} guide={guide} />
                ))}
              </div>
            </section>

            {/* Material Comparisons */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Material Comparisons</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {GUIDES.filter(g => 
                  ['pla-vs-petg', 'petg-vs-abs', 'asa-vs-abs-outdoor-printing', 'silk-pla-comparison', 'pla-plus-vs-pla-pro', 'tpu-vs-petg', 'pla-vs-petg-vs-abs'].includes(g.slug)
                ).map(guide => (
                  <GuideCard key={guide.slug} guide={guide} />
                ))}
              </div>
            </section>

            {/* HueForge & Lithophane Guides */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">HueForge & Lithophane Guides</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Master HueForge filament painting and lithophane printing with TD value data from our database.
                Start with the{' '}
                <Link to="/hueforge-td-database" className="text-primary hover:underline font-medium">HueForge TD Value Database</Link>
                {' '}or find compatible filaments with the{' '}
                <Link to="/hueforge-filaments" className="text-primary hover:underline font-medium">HueForge Filament Finder</Link>.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {GUIDES.filter(g => 
                  ['hueforge-beginners-guide', 'understanding-td-values', 'hueforge-color-selection', 'hueforge-filaments', 'best-filaments-for-hueforge-lithophanes'].includes(g.slug)
                ).map(guide => (
                  <GuideCard key={guide.slug} guide={guide} />
                ))}
                {/* Extra link cards for tools not in GUIDES */}
                <Link to="/guides/what-is-hueforge-td">
                  <Card className="bg-card/50 border-border hover:border-primary/50 hover:bg-card/80 transition-all group h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <Badge variant="outline" className="bg-accent text-accent-foreground border-border w-fit mb-3">HueForge</Badge>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">What is HueForge TD?</h3>
                      <p className="text-sm text-muted-foreground flex-1">Understand Transmission Distance values and how they affect your HueForge prints.</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/guides/best-white-filaments-for-hueforge">
                  <Card className="bg-card/50 border-border hover:border-primary/50 hover:bg-card/80 transition-all group h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <Badge variant="outline" className="bg-accent text-accent-foreground border-border w-fit mb-3">HueForge</Badge>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">Best White Filaments for HueForge</h3>
                      <p className="text-sm text-muted-foreground flex-1">Top-rated white filaments ranked by TD value for HueForge base layers.</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/guides/how-to-measure-filament-td">
                  <Card className="bg-card/50 border-border hover:border-primary/50 hover:bg-card/80 transition-all group h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <Badge variant="outline" className="bg-accent text-accent-foreground border-border w-fit mb-3">HueForge</Badge>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">How to Measure Filament TD</h3>
                      <p className="text-sm text-muted-foreground flex-1">Step-by-step guide to measuring your own filament TD values accurately.</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/guides/best-filaments-for-hueforge">
                  <Card className="bg-card/50 border-border hover:border-primary/50 hover:bg-card/80 transition-all group h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <Badge variant="outline" className="bg-accent text-accent-foreground border-border w-fit mb-3">HueForge</Badge>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">Best Filaments for HueForge</h3>
                      <p className="text-sm text-muted-foreground flex-1">TD-ranked filament recommendations for HueForge projects and lithophanes.</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/guides/best-filaments-for-lithophanes">
                  <Card className="bg-card/50 border-border hover:border-primary/50 hover:bg-card/80 transition-all group h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <Badge variant="outline" className="bg-accent text-accent-foreground border-border w-fit mb-3">HueForge</Badge>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">Best Filaments for Lithophanes</h3>
                      <p className="text-sm text-muted-foreground flex-1">Top filament picks optimized for lithophane printing with light transmission data.</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </section>

            {/* Specialty & Use-Case Guides */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Specialty & Use-Case Guides</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {GUIDES.filter(g => 
                  ['best-filaments-for-outdoor-use', 'best-filament-for-bambu-lab-p1s', 'best-filament-for-prusa-mk4', 'best-filament-for-creality-k1', 'best-filament-for-beginners-2025', 'how-to-choose-3d-printer-budget', 'understanding-filament-temperature-settings', 'top-10-filaments-functional-parts'].includes(g.slug)
                ).map(guide => (
                  <GuideCard key={guide.slug} guide={guide} />
                ))}
              </div>
            </section>
          </>
        ) : (
          /* Filtered/searched view */
          <section>
            <h2 className="text-xl font-semibold mb-6">
              {`${filteredGuides.length} Guide${filteredGuides.length !== 1 ? 's' : ''} Found`}
            </h2>
            
            {filteredGuides.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGuides.map((guide) => (
                  <GuideCard key={guide.slug} guide={guide} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No guides found"
                message="Try a different search term or browse all categories."
                action={{ label: 'Clear Filters', icon: X, onClick: () => { setSearchTerm(''); setActiveCategory('all'); } }}
              />
            )}
          </section>
        )}
        
        {/* CTA Section */}
        <section className="mt-16">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-3">Can't Find What You're Looking For?</h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Use our Material Wizard to get personalized filament recommendations based on your specific needs.
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link to="/wizard">
                  <Sparkles className="w-4 h-4" />
                  Try Material Wizard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
    </>
  );
}
