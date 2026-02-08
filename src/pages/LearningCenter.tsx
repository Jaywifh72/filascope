import React, { useState, useMemo } from 'react';
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
  ShoppingBag
} from 'lucide-react';

// Guide metadata type
export interface GuideMetadata {
  slug: string;
  title: string;
  description: string;
  category: 'beginner' | 'materials' | 'troubleshooting' | 'advanced' | 'buying-guide';
  readTime: number; // in minutes
  publishedAt: string;
  updatedAt?: string;
  featured?: boolean;
  image?: string;
  /** If set, link goes to /guides/:slug instead of /learn/:slug */
  isBuyingGuide?: boolean;
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
  { id: 'beginner', label: 'Beginner Basics', icon: GraduationCap },
  { id: 'materials', label: 'Material Guides', icon: Flame },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: Wrench },
  { id: 'advanced', label: 'Advanced Techniques', icon: Target },
];

const getCategoryConfig = (category: string) => {
  switch (category) {
    case 'beginner':
      return { label: 'Beginner', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'materials':
      return { label: 'Materials', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    case 'troubleshooting':
      return { label: 'Troubleshooting', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    case 'advanced':
      return { label: 'Advanced', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    case 'buying-guide':
      return { label: 'Buying Guide', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    default:
      return { label: category, color: 'bg-primary/10 text-primary border-primary/20' };
  }
};

function GuideCard({ guide }: { guide: GuideMetadata }) {
  const categoryConfig = getCategoryConfig(guide.category);
  
  const linkTo = guide.isBuyingGuide ? `/guides/${guide.slug}` : `/learn/${guide.slug}`;
  
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
  
  const linkTo = guide.isBuyingGuide ? `/guides/${guide.slug}` : `/learn/${guide.slug}`;
  
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
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
            
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Learn 3D Printing
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              Expert guides, tutorials, and resources to help you master 3D printing.
              From beginner basics to advanced techniques.
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
        
        {/* Featured Guides (only show on 'all' category with no search) */}
        {activeCategory === 'all' && searchTerm === '' && (
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
        )}
        
        {/* All Guides Grid */}
        <section>
          <h2 className="text-xl font-semibold mb-6">
            {activeCategory === 'all' && searchTerm === '' ? 'All Guides' : `${filteredGuides.length} Guide${filteredGuides.length !== 1 ? 's' : ''} Found`}
          </h2>
          
          {filteredGuides.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeCategory === 'all' && searchTerm === '' ? regularGuides : filteredGuides).map((guide) => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 border-dashed">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No guides found matching your search.</p>
                <Button variant="ghost" onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} className="mt-4">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
        
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
  );
}
