import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, User, Printer, Check, ChevronDown, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Review {
  id: string;
  rating: number;
  reviewText: string;
  wouldRecommend: boolean;
  authorName: string;
  authorAvatar?: string;
  printerUsed?: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

interface ProductReviewsProps {
  filamentId: string;
  productTitle: string;
}

// Placeholder data for mockup
const MOCK_REVIEWS: Review[] = [
  {
    id: "1",
    rating: 5,
    reviewText: "Absolutely love this filament! Prints beautifully with minimal stringing. Color is exactly as shown. I've gone through 3 rolls now and consistency is excellent.",
    wouldRecommend: true,
    authorName: "PrinterPro",
    printerUsed: "Bambu Lab P1S",
    verifiedPurchase: true,
    helpfulCount: 24,
    createdAt: "2 weeks ago",
  },
  {
    id: "2",
    rating: 4,
    reviewText: "Great value for the price. Layer adhesion is good, though I had to bump up the temp by 5°C from what's recommended. Matte finish looks professional.",
    wouldRecommend: true,
    authorName: "MakerMike",
    printerUsed: "Prusa MK4",
    verifiedPurchase: true,
    helpfulCount: 18,
    createdAt: "1 month ago",
  },
  {
    id: "3",
    rating: 3,
    reviewText: "Decent filament but had some moisture issues out of the box. After drying it printed fine. Would recommend storing in a dry box.",
    wouldRecommend: true,
    authorName: "3DNewbie",
    printerUsed: "Ender 3 V2",
    verifiedPurchase: false,
    helpfulCount: 12,
    createdAt: "3 weeks ago",
  },
];

const RATING_DISTRIBUTION = [
  { stars: 5, count: 45, percent: 60 },
  { stars: 4, count: 22, percent: 29 },
  { stars: 3, count: 5, percent: 7 },
  { stars: 2, count: 2, percent: 3 },
  { stars: 1, count: 1, percent: 1 },
];

export function ProductReviews({ filamentId, productTitle }: ProductReviewsProps) {
  const { user } = useAuth();
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [printerFilter, setPrinterFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("helpful");
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  const averageRating = 4.3;
  const totalReviews = 75;
  const recommendPercent = 89;

  const renderStars = (rating: number, interactive = false, size = "sm") => {
    const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setNewRating(star)}
            className={cn(!interactive && "cursor-default")}
          >
            <Star
              className={cn(
                sizeClass,
                star <= rating
                  ? "fill-[#FFB800] text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Reviews & Ratings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Section */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Average Rating */}
          <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg min-w-[140px]">
            <span className="text-4xl font-bold">{averageRating}</span>
            <div className="mt-1">{renderStars(Math.round(averageRating))}</div>
            <span className="text-sm text-muted-foreground mt-1">{totalReviews} reviews</span>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
              <ThumbsUp className="w-3 h-3" />
              {recommendPercent}% recommend
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-1.5">
            {RATING_DISTRIBUTION.map((dist) => (
              <div key={dist.stars} className="flex items-center gap-2">
                <span className="text-xs w-3">{dist.stars}</span>
                <Star className="w-3 h-3 fill-[#FFB800] text-[#FFB800]" />
                <Progress value={dist.percent} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-8">{dist.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review CTA */}
        {!showWriteReview ? (
          <Button
            onClick={() => setShowWriteReview(true)}
            className="w-full"
            variant="outline"
          >
            Write a Review
          </Button>
        ) : (
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border">
            <h4 className="font-medium">Share Your Experience</h4>
            
            {!user && (
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                <a href="/auth" className="text-primary hover:underline">Sign in</a> to submit your review
              </div>
            )}
            
            {/* Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Rating</label>
              <div className="flex items-center gap-2">
                {renderStars(newRating, true, "lg")}
                {newRating > 0 && (
                  <span className="text-sm text-primary font-medium">{newRating}/5</span>
                )}
              </div>
            </div>

            {/* Review Text */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Review</label>
              <Textarea
                placeholder="Share your experience with this filament..."
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                rows={4}
              />
            </div>

            {/* Would Recommend */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Would you recommend this?</label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={wouldRecommend === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWouldRecommend(true)}
                  className="gap-1"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={wouldRecommend === false ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setWouldRecommend(false)}
                  className="gap-1"
                >
                  <ThumbsDown className="w-4 h-4" />
                  No
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button disabled={!user} className="flex-1">Submit Review</Button>
              <Button variant="ghost" onClick={() => setShowWriteReview(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={printerFilter} onValueChange={setPrinterFilter}>
            <SelectTrigger className="w-[180px]">
              <Printer className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by printer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Printers</SelectItem>
              <SelectItem value="bambu">Bambu Lab</SelectItem>
              <SelectItem value="prusa">Prusa</SelectItem>
              <SelectItem value="creality">Creality</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="helpful">Most Helpful</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {MOCK_REVIEWS.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-muted/20 rounded-lg border border-border space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{review.authorName}</span>
                      {review.verifiedPurchase && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Check className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    {review.printerUsed && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Printer className="w-3 h-3" />
                        {review.printerUsed}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{review.createdAt}</span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                {renderStars(review.rating)}
                {review.wouldRecommend && (
                  <Badge variant="outline" className="text-[10px] text-green-400 border-green-400/30">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    Recommends
                  </Badge>
                )}
              </div>

              {/* Review Text */}
              <p className="text-sm text-muted-foreground">{review.reviewText}</p>

              {/* Helpful */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs text-muted-foreground">
                  {review.helpfulCount} found this helpful
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                    <ThumbsUp className="w-3 h-3" />
                    Helpful
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                    <ThumbsDown className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <Button variant="outline" className="w-full gap-2">
          <ChevronDown className="w-4 h-4" />
          Load More Reviews
        </Button>
      </CardContent>
    </Card>
  );
}
