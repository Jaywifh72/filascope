import { useState, useEffect } from "react";
import { 
  Star, 
  ArrowRight, 
  Check, 
  Package, 
  Clock, 
  X, 
  Award, 
  Lightbulb, 
  MessageCircle,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Review {
  id: string;
  rating: number;
  text: string;
  author: string;
  verified: boolean;
}

interface SidebarData {
  rating: number | null;
  reviewCount: number | null;
  recentReviews: Review[];
  staffPick: boolean;
  staffPickReasons: string[];
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' | 'discontinued';
  shippingTime: string;
  trustSignals: string[];
  activity: {
    views: number;
    comparisons: number;
    purchases: number;
  };
}

interface SocialProofSidebarProps {
  data: SidebarData;
  onReadReviews?: () => void;
  onTakeQuiz?: () => void;
  onStartChat?: () => void;
}

// Ratings & Reviews Card
function RatingsReviewsCard({ 
  rating, 
  reviewCount, 
  onReadReviews 
}: { 
  rating: number | null; 
  reviewCount: number | null; 
  onReadReviews?: () => void;
}) {
  if (!rating) return null;
  
  const fullStars = Math.floor(rating);
  const partialStar = rating % 1;
  const emptyStars = 5 - Math.ceil(rating);

  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">
        Customer Reviews
      </h3>

      <div className="flex justify-center items-center gap-1">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} size={18} className="fill-amber-400 text-amber-400" />
        ))}
        {partialStar > 0 && (
          <div className="relative">
            <Star size={18} className="text-muted-foreground/30" />
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${partialStar * 100}%` }}>
              <Star size={18} className="fill-amber-400 text-amber-400" />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} size={18} className="text-muted-foreground/30" />
        ))}
      </div>

      <div className="text-2xl font-bold text-foreground text-center">
        {rating.toFixed(1)}
      </div>
      {reviewCount && (
        <div className="text-xs text-muted-foreground text-center -mt-2">
          {reviewCount} reviews
        </div>
      )}

      {onReadReviews && (
        <button 
          onClick={onReadReviews}
          className="w-full h-10 bg-transparent border border-border rounded-lg text-sm font-medium text-foreground flex items-center justify-center gap-2 transition-all hover:bg-muted/50"
        >
          Read Reviews
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

// Recent Reviews Card with Auto-Rotation
function RecentReviewsCard({ reviews }: { reviews: Review[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || reviews.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isPaused, reviews.length]);

  if (reviews.length === 0) return null;
  const currentReview = reviews[currentIndex];

  // Extract initials
  const initials = currentReview.author
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div 
      className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 hover:border-primary/20 transition-colors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header with avatar and rating */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs font-semibold text-primary"
          >
            {initials}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentReview.author}
          </div>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={10} className={i < currentReview.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} />
          ))}
        </div>
      </div>

      <blockquote className="text-sm text-muted-foreground italic line-clamp-3 pl-3 border-l-2 border-primary/30">
        "{currentReview.text}"
      </blockquote>

      {currentReview.verified && (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-medium rounded self-start">
          <Check size={10} />
          Verified
        </div>
      )}

      {reviews.length > 1 && (
        <div className="flex justify-center gap-2 mt-1">
          {reviews.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex 
                  ? "bg-primary" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Staff Pick Badge Card
function StaffPickCard({ recommendations }: { recommendations: string[] }) {
  return (
    <div className="bg-card border border-amber-500/30 rounded-lg p-5 flex flex-col gap-4">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-sm font-semibold text-amber-400 rounded-md self-start">
        <Award size={14} />
        <span>Staff Pick</span>
      </div>

      <div className="text-xs text-muted-foreground">
        Recommended for:
      </div>

      <ul className="flex flex-col gap-2">
        {recommendations.map((rec, index) => (
          <li key={index} className="text-sm text-foreground/90 flex gap-2 items-start">
            <Check size={14} className="text-primary flex-shrink-0 mt-0.5" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Stock & Shipping Info Card
function StockShippingCard({ 
  stockStatus, 
  shippingTime, 
  trustSignals 
}: { 
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' | 'discontinued';
  shippingTime: string;
  trustSignals: string[];
}) {
  const stockConfig = {
    'in-stock': {
      text: 'INVENTORY: AVAILABLE',
      className: 'border-green-500/30 text-green-500 bg-green-500/10'
    },
    'low-stock': {
      text: 'INVENTORY: LIMITED',
      className: 'border-orange-500/30 text-orange-500 bg-orange-500/10'
    },
    'out-of-stock': {
      text: 'INVENTORY: DEPLETED',
      className: 'border-red-500/30 text-red-500 bg-red-500/10'
    },
    'discontinued': {
      text: 'INVENTORY: DISCONTINUED',
      className: 'border-destructive/30 text-destructive bg-destructive/10'
    }
  };

  const badge = stockConfig[stockStatus];

  const stockLabels = {
    'in-stock': 'In Stock',
    'low-stock': 'Low Stock',
    'out-of-stock': 'Out of Stock',
    'discontinued': 'Discontinued'
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">Inventory</h3>
      
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border self-start",
        badge.className
      )}>
        <span>{stockLabels[stockStatus]}</span>
      </div>

      {stockStatus !== 'out-of-stock' && stockStatus !== 'discontinued' && (
        <div className="text-sm text-muted-foreground">
          {shippingTime}
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {trustSignals.map((signal, index) => (
          <li key={index} className="text-sm text-foreground/90 flex items-center gap-2">
            <Check size={14} className="text-green-500 flex-shrink-0" />
            <span>{signal}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Social Activity Indicators Card
function SocialActivityCard({ activity }: { activity: { views: number; comparisons: number; purchases: number; } }) {
  const hasActivity = activity.views > 0 || activity.comparisons > 0 || activity.purchases > 0;
  if (!hasActivity) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Activity
      </h3>
      
      {activity.views > 0 && (
        <div className="text-sm text-foreground/90 flex items-center gap-2">
          <span className="text-orange-500 text-xs font-medium">Popular</span>
          <span>
            <span className="font-semibold">{activity.views}</span> people viewing
          </span>
        </div>
      )}

      {activity.comparisons > 0 && (
        <div className="text-sm text-foreground/90 flex items-center gap-2">
          <span>
            <span className="font-semibold">{activity.comparisons}</span> comparing
          </span>
        </div>
      )}

      {activity.purchases > 0 && (
        <div className="text-sm text-foreground/90 flex items-center gap-2">
          <span>
            <span className="font-semibold">{activity.purchases}</span> bought this week
          </span>
        </div>
      )}
    </div>
  );
}

// Decision Support CTAs Card
function DecisionSupportCard({ 
  onTakeQuiz, 
  onStartChat 
}: { 
  onTakeQuiz?: () => void; 
  onStartChat?: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">
        Need Help Deciding?
      </h3>

      {onTakeQuiz && (
        <button 
          onClick={onTakeQuiz}
          className="w-full h-10 bg-primary rounded-lg text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 transition-all hover:bg-primary/90 hover:-translate-y-0.5"
        >
          Take the Quiz
          <ArrowRight size={14} />
        </button>
      )}

      {onStartChat && (
        <>
          <div className="text-xs text-muted-foreground text-center">
            or
          </div>

          <button 
            onClick={onStartChat}
            className="w-full h-10 bg-transparent border border-border rounded-lg text-sm font-medium text-foreground flex items-center justify-center gap-2 transition-all hover:bg-muted/50"
          >
            <MessageCircle size={14} />
            Chat with Us
          </button>
        </>
      )}
    </div>
  );
}

// Main Desktop Sidebar Component
export function SocialProofSidebar({
  data,
  onReadReviews,
  onTakeQuiz,
  onStartChat
}: SocialProofSidebarProps) {
  return (
    <aside className="relative w-[300px] hidden xl:block">
      <div className="sticky top-5 w-[300px] flex flex-col gap-5">
        {/* Card 1: Ratings & Reviews */}
        <RatingsReviewsCard
          rating={data.rating}
          reviewCount={data.reviewCount}
          onReadReviews={onReadReviews}
        />

        {/* Card 2: Recent Reviews */}
        {data.recentReviews.length > 0 && (
          <RecentReviewsCard reviews={data.recentReviews} />
        )}

        {/* Card 3: Staff Pick */}
        {data.staffPick && data.staffPickReasons.length > 0 && (
          <StaffPickCard recommendations={data.staffPickReasons} />
        )}

        {/* Card 4: Stock & Shipping */}
        <StockShippingCard
          stockStatus={data.stockStatus}
          shippingTime={data.shippingTime}
          trustSignals={data.trustSignals}
        />


        {/* Card 6: Decision Support */}
        <DecisionSupportCard
          onTakeQuiz={onTakeQuiz}
          onStartChat={onStartChat}
        />
      </div>
    </aside>
  );
}

// Mobile Accordion Component
export function MobileSocialProof({
  data,
  onReadReviews,
  onTakeQuiz,
  onStartChat
}: SocialProofSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full my-8 xl:hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full h-14 px-5 bg-card border border-border rounded-lg flex items-center justify-between cursor-pointer transition-all hover:border-primary/30"
      >
        <span className="text-sm font-semibold text-foreground">
          Reviews & More
        </span>
        <ChevronDown 
          size={18} 
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      <div className={cn(
        "overflow-hidden transition-all duration-400",
        isExpanded ? "max-h-[3000px] opacity-100 pt-5" : "max-h-0 opacity-0"
      )}>
        <div className="flex flex-col gap-4">
          <RatingsReviewsCard
            rating={data.rating}
            reviewCount={data.reviewCount}
            onReadReviews={onReadReviews}
          />

          {data.recentReviews.length > 0 && (
            <RecentReviewsCard reviews={data.recentReviews} />
          )}

          {data.staffPick && data.staffPickReasons.length > 0 && (
            <StaffPickCard recommendations={data.staffPickReasons} />
          )}

          <StockShippingCard
            stockStatus={data.stockStatus}
            shippingTime={data.shippingTime}
            trustSignals={data.trustSignals}
          />

          

          <DecisionSupportCard
            onTakeQuiz={onTakeQuiz}
            onStartChat={onStartChat}
          />
        </div>
      </div>
    </div>
  );
}

export default SocialProofSidebar;
