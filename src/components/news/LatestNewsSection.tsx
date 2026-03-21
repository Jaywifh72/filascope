import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLatestNews } from "@/hooks/useNewsArticles";
import { formatDistanceToNow } from "date-fns";

export function LatestNewsSection() {
  const { data: articles, isLoading } = useLatestNews(4);

  if (isLoading || !articles || articles.length === 0) return null;

  return (
    <section className="max-w-[1600px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight">
          Latest in 3D Printing
        </h2>
        <Link
          to="/news"
          className="text-sm text-primary hover:underline whitespace-nowrap"
        >
          View all &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.map((article) => (
          <a
            key={article.id}
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

                <h3 className="font-semibold leading-snug line-clamp-2 text-sm">
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
        ))}
      </div>
    </section>
  );
}
