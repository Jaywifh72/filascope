import React from 'react';
import { Database } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  Star,
  Camera,
  Upload,
  Users,
  MessagesSquare,
  MessageSquare,
  ImageIcon,
} from 'lucide-react';
import { useProductReviews } from '@/hooks/useProductReviews';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewSummaryBar, ReviewList } from '@/components/reviews/ReviewDisplay';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface CommunityTabContentProps {
  filament: Filament;
}

function getRedditSearchUrl(filament: Filament): string {
  const searchTerms = [filament.vendor, filament.material, 'filament'].filter(Boolean).join(' ');
  return `https://www.reddit.com/search/?q=${encodeURIComponent(searchTerms)}&type=link&sort=relevance`;
}

function getSubredditSearchUrl(subreddit: string, filament: Filament): string {
  const searchTerms = [filament.vendor, filament.material].filter(Boolean).join(' ');
  return `https://www.reddit.com/r/${subreddit}/search/?q=${encodeURIComponent(searchTerms)}&restrict_sr=1&sort=relevance`;
}

export function CommunityTabContent({ filament }: CommunityTabContentProps) {
  const {
    reviews,
    summary,
    isLoading,
    existingReview,
    submitReview,
    isSubmitting,
    voteHelpful,
    isVoting,
  } = useProductReviews(filament.id, "filament");

  const forumLinks = [
    {
      name: 'r/3Dprinting',
      description: 'General 3D printing discussions',
      url: getSubredditSearchUrl('3Dprinting', filament),
      icon: <MessagesSquare className="w-5 h-5" />,
    },
    {
      name: 'r/FixMyPrint',
      description: 'Troubleshooting and print issues',
      url: getSubredditSearchUrl('FixMyPrint', filament),
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      name: 'r/BambuLab',
      description: 'Bambu Lab printer community',
      url: getSubredditSearchUrl('BambuLab', filament),
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: 'Reddit Search',
      description: 'Search all of Reddit',
      url: getRedditSearchUrl(filament),
      icon: <ExternalLink className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Reviews Section */}
      <Card className="bg-card/50 border-border overflow-hidden">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Star className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Reviews</h3>
              <p className="text-xs text-muted-foreground">
                Share your experience with {filament.vendor} {filament.material}
              </p>
            </div>
            {summary.totalCount > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="font-semibold">{summary.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({summary.totalCount})</span>
              </div>
            )}
          </div>

          {/* Summary Bar */}
          <ReviewSummaryBar summary={summary} />

          {/* Review Form */}
          <ReviewForm
            productId={filament.id}
            productType="filament"
            onSubmit={submitReview}
            isSubmitting={isSubmitting}
            hasExistingReview={!!existingReview}
          />

          {/* Review List */}
          <ReviewList
            reviews={reviews}
            onVoteHelpful={voteHelpful}
            isVoting={isVoting}
          />

          {reviews.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Star className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No reviews yet. Be the first to share your experience!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forum Discussions */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <MessagesSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Community Discussions</h3>
              <p className="text-xs text-muted-foreground">
                Find discussions about {filament.vendor} {filament.material}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {forumLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 border border-border hover:bg-muted/40 hover:border-primary/30 transition-colors group"
              >
                <div className="p-2 bg-[hsl(var(--color-warning)/0.1)] rounded-lg text-[hsl(var(--color-warning))] group-hover:bg-[hsl(var(--color-warning)/0.2)] transition-colors">
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {link.name}
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {link.description}
                  </div>
                </div>
              </a>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Links open in a new tab and search for "{filament.vendor} {filament.material}"
          </p>
        </CardContent>
      </Card>

      {/* Share Your Experience CTA */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Share Your Experience</h4>
              <p className="text-sm text-muted-foreground">
                Have you used this filament? Help others by sharing your prints and experiences in the community!
              </p>
            </div>
            <Button asChild variant="outline">
              <a href={getRedditSearchUrl(filament)} target="_blank" rel="noopener noreferrer">
                Join Discussion
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
