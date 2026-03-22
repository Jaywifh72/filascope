import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewsPaginated, useNewsTags } from "@/hooks/useNewsArticles";
import { formatDistanceToNow } from "date-fns";
import type { NewsArticle } from "@/types/news";

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
  return (
    <a
      href={article.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <Card className="h-full transition-colors hover:border-primary/40 bg-card">
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
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {article.source_name}
            </Badge>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <h3 className="font-semibold leading-snug line-clamp-2">
            {article.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.summary}
          </p>

          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(article.published_date), {
                addSuffix: true,
              })}
            </span>
            {article.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-end">
                {article.tags.slice(0, 3).map((tag) => (
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

const News = () => {
  const [page, setPage] = useState(1);
  const [tagFilter, setTagFilter] = useState<string | undefined>();

  const { data: tagsData } = useNewsTags();
  const { data, isLoading } = useNewsPaginated(page, PAGE_SIZE, tagFilter);

  const articles = data?.articles ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const tags = tagsData ?? [];

  const handleTagClick = (tag: string) => {
    setPage(1);
    setTagFilter((prev) => (prev === tag ? undefined : tag));
  };

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

        {/* Tag filter bar */}
        {tags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            <Badge
              variant={tagFilter === undefined ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap shrink-0"
              onClick={() => {
                setTagFilter(undefined);
                setPage(1);
              }}
            >
              All
            </Badge>
            {tags.slice(0, 12).map((tag) => (
              <Badge
                key={tag}
                variant={tagFilter === tag ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap shrink-0"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default News;
