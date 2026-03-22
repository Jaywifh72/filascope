import { useState } from "react";
import { ExternalLink, Clock } from "lucide-react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersonalizedNews } from "@/hooks/useNewsArticles";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";
import type { NewsArticle, NewsCategory, NEWS_CATEGORY_COLORS } from "@/types/news";

const PAGE_SIZE = 12;

function NewsCardSkeleton() {
  return (
    <Card className="h-full bg-card">
      <Skeleton className="aspect-video w-full rounded-t-lg" />
      <CardContent className="p-4 flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  const isNewToday = differenceInHours(new Date(), new Date(article.published_date)) < 24;
  const categoryBorder = article.category ? CATEGORY_BORDER[article.category] : "";

  return (
    <a
      href={article.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <Card className={cn(
        "h-full transition-colors hover:border-primary/40 bg-card",
        categoryBorder && `border-t-2 ${categoryBorder}`
      )}>
        {article.image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={article.image_url}
              alt=""
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {article.source_logo_url && (
              <img src={article.source_logo_url} alt="" className="w-4 h-4 rounded-sm" loading="lazy" />
            )}
            <Badge variant="secondary" className="text-xs">
              {article.source_name}
            </Badge>
            {isNewToday && (
              <Badge className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">New</Badge>
            )}
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
          </div>

          <h3 className="font-semibold leading-snug line-clamp-2">
            {article.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.summary}
          </p>

          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(article.published_date), { addSuffix: true })}
              </span>
              {article.read_time_min && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.read_time_min} min
                  </span>
                </>
              )}
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-end">
                {article.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

const CATEGORIES: { value: NewsCategory | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "filament", label: "Filament" },
  { value: "printer", label: "Printer" },
  { value: "software", label: "Software" },
  { value: "industry", label: "Industry" },
  { value: "community", label: "Community" },
];

const CATEGORY_BORDER: Record<string, string> = {
  filament: "border-t-cyan-500",
  printer: "border-t-green-500",
  software: "border-t-purple-500",
  industry: "border-t-amber-500",
  community: "border-t-pink-500",
};

const News = () => {
  const [categoryFilter, setCategoryFilter] = useState<NewsCategory | undefined>();
  const { articles, isLoading } = usePersonalizedNews(PAGE_SIZE, categoryFilter);

  return (
    <>
      <DocumentHead
        title="3D Printing News — Latest Industry Updates | FilaScope"
        description="Stay up to date with the latest 3D printing news. AI-curated articles about new filaments, printers, firmware updates, and industry trends."
        canonicalPath="/news"
      />

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <Breadcrumbs
          items={[{ name: "News", url: "/news" }]}
          className="mb-4"
        />

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          3D Printing News
        </h1>
        <p className="text-muted-foreground mb-6">
          AI-curated articles about new filaments, printers, firmware updates,
          and industry trends.
        </p>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat.label}
              variant={categoryFilter === cat.value ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap shrink-0"
              onClick={() => setCategoryFilter(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>

        {/* Article grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium mb-1">No articles found</p>
            <p className="text-sm">
              {tagFilter
                ? "Try removing the tag filter to see more results."
                : "Check back soon for the latest 3D printing news."}
            </p>
          </div>
        ) : (
          <>
            {/* Hero card — first article spans full width */}
            {articles.length > 0 && (
              <a
                href={articles[0].source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block mb-6"
              >
                <Card className="transition-colors hover:border-primary/40 bg-card overflow-hidden">
                  <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary" className="text-xs">{articles[0].source_name}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(articles[0].published_date), { addSuffix: true })}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-3 group-hover:text-primary transition-colors">
                        {articles[0].title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {articles[0].summary}
                      </p>
                      {articles[0].tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {articles[0].tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                  </CardContent>
                </Card>
              </a>
            )}

            {/* Remaining articles in 3-column grid */}
            {articles.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.slice(1).map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Article count */}
        {articles.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-6">
            Showing {articles.length} articles · Ranked by relevance to your interests
          </p>
        )}
      </div>
    </>
  );
};

export default News;
