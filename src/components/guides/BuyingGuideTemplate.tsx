import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Clock, Calendar, ChevronRight,
  BookOpen, Sparkles, ShoppingBag, List, Zap
} from 'lucide-react';
import { useGuideFilaments } from '@/hooks/useGuideFilaments';
import { type GuideConfig } from './guideConfigs';
import { GuideProductCard } from './GuideProductCard';
import { GuideComparisonTable } from './GuideComparisonTable';
import { GuideVSComparison } from './GuideVSComparison';
import { ArticleSchema } from '@/components/seo/ArticleSchema';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { HowToSchema } from '@/components/seo/HowToSchema';

import { ItemListSchema } from '@/components/seo/ItemListSchema';
import { generateFilamentSlug } from '@/lib/seoSlugUtils';
import { BUYING_GUIDE_CONFIGS } from './guideConfigs';
import { AiSnippetZone } from './AiSnippetZone';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { useRelatedFilaments } from '@/hooks/useRelatedFilaments';

function getCategoryBadgeStyle(category: string) {
  switch (category) {
    case 'buying-guide': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'material-guide': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    case 'comparison': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'beginner': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'how-to': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    default: return 'bg-primary/10 text-primary border-primary/20';
  }
}

function getCategoryLabel(category: string) {
  switch (category) {
    case 'buying-guide': return 'Buying Guide';
    case 'material-guide': return 'Material Guide';
    case 'comparison': return 'Comparison';
    case 'beginner': return 'Beginner';
    case 'how-to': return 'How-To Guide';
    default: return category;
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

export function BuyingGuideTemplate({ config }: { config: GuideConfig }) {
  const { data: filaments, isLoading } = useGuideFilaments(config.filters);
  const primaryMaterial = config.filters.material ?? config.filters.materials?.[0];
  const { data: relatedFilaments } = useRelatedFilaments({ material: primaryMaterial, limit: 6 });

  useDocumentHead({
    title: config.seoTitle,
    description: config.seoDescription,
    canonical: `https://filascope.com/guides/${config.slug}`,
    ogTitle: config.seoTitle,
    ogDescription: config.seoDescription,
    ogUrl: `https://filascope.com/guides/${config.slug}`,
    ogType: 'article',
    ogImage: 'https://filascope.com/og-image.png',
    ogSiteName: 'FilaScope',
    twitterCard: 'summary_large_image',
    twitterSite: '@FilaScope',
    twitterTitle: config.seoTitle,
    twitterDescription: config.seoDescription,
    twitterImage: 'https://filascope.com/og-image.png',
    keywords: config.keywords.join(', '),
  });

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

  // Derive topic label for FAQ/related headings (e.g. "PLA", "PETG")
  const topicLabel = config.faqHeadingTopic || primaryMaterial || '';

  // Merge FAQ + PAA, deduplicate by keeping the version with the longer answer
  const allFaqs = useMemo(() => {
    const merged = [...config.faqs, ...(config.relatedQuestions ?? [])];
    const seen = new Map<string, { question: string; answer: string }>();
    for (const faq of merged) {
      const key = faq.question.toLowerCase().replace(/[^a-z0-9]/g, '');
      const existing = seen.get(key);
      if (!existing || faq.answer.length > existing.answer.length) {
        seen.set(key, faq);
      }
    }
    return Array.from(seen.values());
  }, [config.faqs, config.relatedQuestions]);

  // Build ToC from editorial sections + fixed sections
  const tocItems: { label: string; anchor: string }[] = [
    ...beforeSections.map(s => ({ label: s.heading, anchor: slugify(s.heading) })),
    ...(config.layout === 'ranked-list' ? [{ label: config.filters.requireTD ? 'Top Filaments by TD' : 'Full Rankings', anchor: 'rankings' }] : []),
    ...(config.layout === 'vs-comparison' ? [{ label: 'Side-by-Side Comparison', anchor: 'comparison' }] : []),
    ...(config.layout === 'editorial' ? [{ label: 'Our Top Picks for Beginners', anchor: 'picks' }] : []),
    ...afterSections.map(s => ({ label: s.heading, anchor: slugify(s.heading) })),
    ...(allFaqs.length > 0 ? [{ label: `Frequently Asked Questions${topicLabel ? ` About ${topicLabel} Filaments` : ''}`, anchor: 'faq' }] : []),
    ...(relatedConfigs.length > 0 ? [{ label: topicLabel ? `Related ${topicLabel} Guides` : 'More Filament Guides', anchor: 'related-guides' }] : []),
  ];

  const updatedLabel = new Date(config.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Structured Data */}
      <ArticleSchema
        headline={config.title}
        description={config.seoDescription}
        datePublished={config.publishedAt}
        dateModified={config.updatedAt}
        url={`/guides/${config.slug}`}
      />
      {/* BreadcrumbList JSON-LD is injected by <Breadcrumbs> below */}
      {/* Single merged FAQPage schema for both FAQ + People Also Ask */}
      {(config.faqs.length > 0 || (config.relatedQuestions && config.relatedQuestions.length > 0)) && (
        <FAQSchema faqs={[...config.faqs, ...(config.relatedQuestions ?? [])]} />
      )}
      {config.howTo && (
        <HowToSchema
          name={config.howTo.name}
          description={config.howTo.description}
          steps={config.howTo.steps}
        />
      )}
      {config.layout === 'ranked-list' && filaments && filaments.length > 0 && (
        <ItemListSchema
          name={config.title}
          description={config.seoDescription}
          itemListOrder="Descending"
          items={filaments.map((f, i) => {
            const slug = f.product_handle || generateFilamentSlug(f.vendor, f.material, f.product_title, f.color_family);
            return {
              position: i + 1,
              name: f.product_title,
              url: `https://filascope.com/filament/${slug}`,
              image: f.featured_image ?? undefined,
              brand: f.vendor ?? undefined,
              material: f.material ?? undefined,
              price: f.variant_price ?? undefined,
              priceCurrency: 'USD',
            };
          })}
        />
      )}

      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Breadcrumbs
            items={[
              { name: "Guides", url: "/learn" },
              { name: config.title, url: `/guides/${config.slug}` },
            ]}
          />
        </div>
      </header>

      <article role="article" className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        {/* Hero */}
        <div className="mb-8">
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
              <time dateTime={config.updatedAt} className="flex items-center gap-1 font-medium text-foreground/80">
                <Calendar className="w-3.5 h-3.5" />
                Updated {updatedLabel}
              </time>
            </div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight">
            {config.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            {config.description}
          </p>
        </div>

        {/* AI Snippet Zone — only if guide config provides snippet data */}
        {config.aiSnippet && (
          <AiSnippetZone
            summaryText={config.aiSnippet.summaryText}
            topPick={config.aiSnippet.topPick}
            runnerUp={config.aiSnippet.runnerUp}
            budgetPick={config.aiSnippet.budgetPick}
          />
        )}

        {/* Quick Answer block — text-only variant for guides without product picks */}
        {!config.aiSnippet && config.quickAnswer && (
          <div role="region" aria-label="Quick answer summary" className="mb-8" data-ai-summary="true">
            <div className="rounded-lg border border-border bg-card/60 border-l-2 border-l-primary pl-0 overflow-hidden">
              <div className="pl-4 pr-5 py-4">
                <header className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span className="text-primary text-xs font-semibold uppercase tracking-wider">
                    Quick Answer
                  </span>
                </header>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {config.quickAnswer}
                </p>
              </div>
            </div>
            <p className="sr-only">Quick Answer: {config.quickAnswer}</p>
          </div>
        )}

        {/* Table of Contents */}
        {tocItems.length > 2 && (
          <nav aria-label="Table of contents" className="mb-10">
            <Card className="bg-card/60 border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground">
                  <List className="w-4 h-4 text-primary" />
                  In This Guide
                </div>
                <ol className="space-y-1.5 list-none">
                  {tocItems.map((item, i) => (
                    <li key={item.anchor} className="flex items-baseline gap-2">
                      <span className="text-xs text-muted-foreground/60 font-mono w-4 shrink-0">{i + 1}.</span>
                      <a
                        href={`#${item.anchor}`}
                        className="text-sm text-primary/80 hover:text-primary underline-offset-2 hover:underline transition-colors"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </nav>
        )}

        {/* Editorial: Before Sections */}
        {beforeSections.map((section, i) => (
          <section key={i} id={slugify(section.heading)} className="mb-8 scroll-mt-24">
            <h2 className="text-xl font-bold mb-3">{section.heading}</h2>
            <div
              className="prose prose-invert prose-sm max-w-none text-muted-foreground [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-muted/50 [&_th]:font-semibold [&_th]:text-foreground [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content, { ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br', 'h3', 'h4', 'table', 'thead', 'tbody', 'tr', 'th', 'td'], ALLOWED_ATTR: ['href', 'class', 'target', 'rel'] }) }}
            />
          </section>
        ))}

        {/* Comparison Table (for ranked-list layouts) */}
        {config.layout === 'ranked-list' && filaments && filaments.length > 0 && (
          <GuideComparisonTable filaments={filaments} />
        )}

        {/* Product List / VS Comparison */}
        <section id={config.layout === 'ranked-list' ? 'rankings' : config.layout === 'vs-comparison' ? 'comparison' : 'picks'} className="mb-12 scroll-mt-24">
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
                <GuideProductCard key={f.id} filament={f} rank={i + 1} annotation={config.rankAnnotations?.[i + 1]} />
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
          <section key={i} id={slugify(section.heading)} className="mb-8 scroll-mt-24">
            <h2 className="text-xl font-bold mb-3">{section.heading}</h2>
            <div
              className="prose prose-invert prose-sm max-w-none text-muted-foreground [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-muted/50 [&_th]:font-semibold [&_th]:text-foreground [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content, { ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br', 'h3', 'h4', 'table', 'thead', 'tbody', 'tr', 'th', 'td'], ALLOWED_ATTR: ['href', 'class', 'target', 'rel'] }) }}
            />
          </section>
        ))}

        {/* Consolidated FAQ Section */}
        {allFaqs.length > 0 && (
          <section id="faq" className="mb-12 scroll-mt-24">
            <h2 className="text-xl font-bold mb-6">
              Frequently Asked Questions{topicLabel ? ` About ${topicLabel} Filaments` : ''}
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {allFaqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border rounded-lg px-4 bg-card"
                >
                  <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent forceMount className="data-[state=closed]:hidden text-muted-foreground pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* Related Filaments */}
        {relatedFilaments && relatedFilaments.length > 0 && (
          <section id="related-filaments" className="mb-12 scroll-mt-24">
            <h2 className="text-xl font-bold mb-4">
              {primaryMaterial ? `Top-Rated ${primaryMaterial} Filaments` : 'Top-Rated Filaments'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {relatedFilaments.map((f) => (
                <a
                  key={f.id}
                  href={`/filament/${f.product_handle || f.id}`}
                  className="group block"
                >
                  <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors h-full">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {f.color_hex && (
                          <span
                            className="w-5 h-5 rounded-full border border-border shrink-0"
                            style={{ backgroundColor: f.color_hex }}
                            aria-hidden="true"
                          />
                        )}
                        {f.transmission_distance && (
                          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20 shrink-0">
                            TD {f.transmission_distance}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{f.vendor}</p>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2 leading-snug mt-0.5">
                        {f.product_title}
                      </p>
                      {f.variant_price && (
                        <p className="text-xs text-primary mt-1.5 font-semibold">
                          ${f.variant_price.toFixed(2)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
            <div className="mt-3 text-right">
              <a
                href={primaryMaterial ? `/?material=${encodeURIComponent(primaryMaterial)}` : '/'}
                className="text-sm text-primary hover:underline"
              >
                Browse all {primaryMaterial} filaments →
              </a>
            </div>
          </section>
        )}

        {/* Related Guides */}
        {relatedConfigs.length > 0 && (
          <section id="related-guides" className="mb-12 scroll-mt-24">
            <h2 className="text-xl font-bold mb-4">
              {topicLabel ? `Related ${topicLabel} Guides` : 'More Filament Guides'}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedConfigs.map(related => (
                <a key={related.slug} href={`/guides/${related.slug}`} className="group block">
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
                </a>
              ))}
            </div>
          </section>
        )}

      </article>

      {/* CTA — outside article */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
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
