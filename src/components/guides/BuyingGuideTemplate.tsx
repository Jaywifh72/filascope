import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, Clock, Calendar, ChevronRight, 
  BookOpen, Sparkles, ShoppingBag 
} from 'lucide-react';
import { useGuideFilaments } from '@/hooks/useGuideFilaments';
import { type GuideConfig } from './guideConfigs';
import { GuideProductCard } from './GuideProductCard';
import { GuideComparisonTable } from './GuideComparisonTable';
import { GuideVSComparison } from './GuideVSComparison';
import { ArticleSchema } from '@/components/seo/ArticleSchema';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { BUYING_GUIDE_CONFIGS } from './guideConfigs';

interface BuyingGuideTemplateProps {
  config: GuideConfig;
}

function getCategoryBadgeStyle(category: string) {
  switch (category) {
    case 'buying-guide': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'comparison': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'beginner': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default: return 'bg-primary/10 text-primary border-primary/20';
  }
}

function getCategoryLabel(category: string) {
  switch (category) {
    case 'buying-guide': return 'Buying Guide';
    case 'comparison': return 'Comparison';
    case 'beginner': return 'Beginner';
    default: return category;
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Skeleton className="w-20 h-20 rounded-lg" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function BuyingGuideTemplate({ config }: BuyingGuideTemplateProps) {
  const { data: filaments, isLoading } = useGuideFilaments(config.filters);

  const beforeSections = config.editorialSections.filter(s => s.position === 'before');
  const afterSections = config.editorialSections.filter(s => s.position === 'after');

  const relatedConfigs = config.relatedSlugs
    .map(slug => BUYING_GUIDE_CONFIGS[slug])
    .filter(Boolean);

  const breadcrumbs = [
    { name: 'Home', url: 'https://filascope.com/' },
    { name: 'Guides', url: 'https://filascope.com/learn' },
    { name: config.title, url: `https://filascope.com/guides/${config.slug}` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* SEO */}
      <Helmet>
        <title>{config.seoTitle}</title>
        <meta name="description" content={config.seoDescription} />
        <meta name="keywords" content={config.keywords.join(', ')} />
        <link rel="canonical" href={`https://filascope.com/guides/${config.slug}`} />
        <meta property="og:title" content={config.seoTitle} />
        <meta property="og:description" content={config.seoDescription} />
        <meta property="og:url" content={`https://filascope.com/guides/${config.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://filascope.com/og-image.png" />
        <meta name="twitter:title" content={config.seoTitle} />
        <meta name="twitter:description" content={config.seoDescription} />
        <meta name="twitter:image" content="https://filascope.com/og-image.png" />
      </Helmet>
      <ArticleSchema
        headline={config.title}
        description={config.seoDescription}
        datePublished={config.publishedAt}
        dateModified={config.updatedAt}
        url={`/guides/${config.slug}`}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      {config.faqs.length > 0 && <FAQSchema faqs={config.faqs} />}

      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/learn">
              <ArrowLeft className="w-4 h-4" />
              All Guides
            </Link>
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        {/* Hero */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="outline" className={getCategoryBadgeStyle(config.category)}>
              <ShoppingBag className="w-3 h-3 mr-1" />
              {getCategoryLabel(config.category)}
            </Badge>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {config.readTime} min read
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Updated {new Date(config.updatedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight">
            {config.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            {config.description}
          </p>
        </div>

        {/* Editorial: Before Sections */}
        {beforeSections.map((section, i) => (
          <section key={i} className="mb-8">
            <h2 className="text-xl font-bold mb-3">{section.heading}</h2>
            <div 
              className="prose prose-invert prose-sm max-w-none text-muted-foreground [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content, { ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br', 'h3', 'h4'], ALLOWED_ATTR: ['href', 'class', 'target', 'rel'] }) }}
            />
          </section>
        ))}

        {/* Comparison Table (for ranked-list layouts) */}
        {config.layout === 'ranked-list' && filaments && filaments.length > 0 && (
          <GuideComparisonTable filaments={filaments} />
        )}

        {/* Product List / VS Comparison */}
        <section className="mb-12">
          {isLoading ? (
            <LoadingSkeleton />
          ) : config.layout === 'vs-comparison' && filaments ? (
            <GuideVSComparison filaments={filaments} materialA={config.vsMaterials?.[0]} materialB={config.vsMaterials?.[1]} />
          ) : filaments && filaments.length > 0 ? (
            <div className="space-y-4">
              {config.layout === 'ranked-list' && (
                <h2 className="text-xl font-bold mb-4">
                  {config.filters.requireTD ? 'Top Filaments by TD' : 'Full Rankings'}
                </h2>
              )}
              {config.layout === 'editorial' && (
                <h2 className="text-xl font-bold mb-4">Our Top Picks for Beginners</h2>
              )}
              {filaments.map((f, i) => (
                <GuideProductCard key={f.id} filament={f} rank={i + 1} />
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 border-dashed">
              <CardContent className="p-8 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No filaments match the criteria for this guide.</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Editorial: After Sections */}
        {afterSections.map((section, i) => (
          <section key={i} className="mb-8">
            <h2 className="text-xl font-bold mb-3">{section.heading}</h2>
            <div 
              className="prose prose-invert prose-sm max-w-none text-muted-foreground [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content, { ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br', 'h3', 'h4'], ALLOWED_ATTR: ['href', 'class', 'target', 'rel'] }) }}
            />
          </section>
        ))}

        {/* FAQ Section */}
        {config.faqs.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {config.faqs.map((faq, i) => (
                <Card key={i} className="bg-card/50 border-border">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Related Guides */}
        {relatedConfigs.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4">Related Guides</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedConfigs.map(related => (
                <Link key={related.slug} to={`/guides/${related.slug}`} className="group">
                  <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors h-full">
                    <CardContent className="p-5">
                      <Badge variant="outline" className={`mb-3 text-xs ${getCategoryBadgeStyle(related.category)}`}>
                        {getCategoryLabel(related.category)}
                      </Badge>
                      <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {related.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{related.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Need Personalized Recommendations?</h3>
            <p className="text-muted-foreground mb-5 max-w-lg mx-auto">
              Our Material Wizard analyzes your specific needs and recommends the best filaments in under 2 minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/wizard">
                  <Sparkles className="w-4 h-4" />
                  Try Material Wizard
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/">
                  Browse All Filaments
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
