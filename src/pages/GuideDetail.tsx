import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Clock, 
  Calendar,
  Share2,
  BookOpen,
  ChevronUp,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GUIDES, type GuideMetadata } from './LearningCenter';
import { GuideRelatedProducts, GuideReadNext } from '@/components/guides/GuideComponents';

// Guide content components - will be imported dynamically
import GuidePLAvsPETGvsABS from '@/components/guides/content/GuidePLAvsPETGvsABS';
import GuideBestFilamentBeginners from '@/components/guides/content/GuideBestFilamentBeginners';
import GuideChoosePrinterBudget from '@/components/guides/content/GuideChoosePrinterBudget';
import GuideTemperatureSettings from '@/components/guides/content/GuideTemperatureSettings';
import GuideFunctionalParts from '@/components/guides/content/GuideFunctionalParts';

const GUIDE_CONTENT_MAP: Record<string, React.ComponentType> = {
  'pla-vs-petg-vs-abs': GuidePLAvsPETGvsABS,
  'best-filament-for-beginners-2025': GuideBestFilamentBeginners,
  'how-to-choose-3d-printer-budget': GuideChoosePrinterBudget,
  'understanding-filament-temperature-settings': GuideTemperatureSettings,
  'top-10-filaments-functional-parts': GuideFunctionalParts,
};

// Table of contents item type
interface TOCItem {
  id: string;
  title: string;
  level: number;
}

function TableOfContents({ items, activeId }: { items: TOCItem[]; activeId: string }) {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <nav className="space-y-1">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
        <List className="w-4 h-4" />
        Table of Contents
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => scrollToSection(item.id)}
          className={cn(
            "block w-full text-left text-sm py-1.5 px-3 rounded-lg transition-colors",
            item.level === 2 ? "pl-3" : "pl-6",
            activeId === item.id
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {item.title}
        </button>
      ))}
    </nav>
  );
}

function getCategoryConfig(category: string) {
  switch (category) {
    case 'beginner':
      return { label: 'Beginner Basics', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'materials':
      return { label: 'Material Guide', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    case 'troubleshooting':
      return { label: 'Troubleshooting', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    case 'advanced':
      return { label: 'Advanced', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    default:
      return { label: category, color: 'bg-primary/10 text-primary border-primary/20' };
  }
}

export default function GuideDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeSection, setActiveSection] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Find guide metadata
  const guide = GUIDES.find(g => g.slug === slug);
  const GuideContent = slug ? GUIDE_CONTENT_MAP[slug] : null;

  // Get related guides
  const relatedGuides = GUIDES
    .filter(g => g.slug !== slug)
    .filter(g => g.category === guide?.category || Math.random() > 0.5)
    .slice(0, 3);

  // Build TOC from headings
  useEffect(() => {
    if (!GuideContent) return;

    const timer = setTimeout(() => {
      const headings = document.querySelectorAll('.guide-content h2, .guide-content h3');
      const items: TOCItem[] = [];
      
      headings.forEach((heading) => {
        const id = heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';
        if (!heading.id) heading.id = id;
        
        items.push({
          id,
          title: heading.textContent || '',
          level: heading.tagName === 'H2' ? 2 : 3,
        });
      });
      
      setTocItems(items);
    }, 100);

    return () => clearTimeout(timer);
  }, [GuideContent, slug]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      const headings = document.querySelectorAll('.guide-content h2, .guide-content h3');
      let currentActive = '';
      
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 150) {
          currentActive = heading.id;
        }
      });
      
      setActiveSection(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: guide?.title,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  if (!guide || !GuideContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Guide Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The guide you're looking for doesn't exist or has been moved.
            </p>
            <Button asChild>
              <Link to="/learn">Browse All Guides</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryConfig = getCategoryConfig(guide.category);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/learn')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              All Guides
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <article className="flex-1 min-w-0 max-w-3xl">
            {/* Meta */}
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className={categoryConfig.color}>
                {categoryConfig.label}
              </Badge>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {guide.readTime} min read
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(guide.publishedAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
              {guide.title}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              {guide.description}
            </p>

            {/* Content */}
            <div className="guide-content prose prose-invert prose-lg max-w-none">
              <GuideContent />
            </div>

            {/* Related Guides */}
            <GuideReadNext 
              guides={relatedGuides.map(g => ({
                slug: g.slug,
                title: g.title,
                category: getCategoryConfig(g.category).label,
                readTime: g.readTime,
              }))} 
            />
          </article>

          {/* Sidebar - TOC */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-36">
              {tocItems.length > 0 && (
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-4">
                    <TableOfContents items={tocItems} activeId={activeSection} />
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Back to Top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
          aria-label="Back to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
