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
    <div className="bg-[#0A0C10] border border-primary/20 p-5 flex flex-col gap-4">
      <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-[0.15em]">
        &gt;&gt; OPERATOR_FEEDBACK
      </h3>

      <div className="flex justify-center items-center gap-1">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} size={18} className="fill-amber-400 text-amber-400" />
        ))}
        {partialStar > 0 && (
          <div className="relative">
            <Star size={18} className="text-white/20" />
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${partialStar * 100}%` }}>
              <Star size={18} className="fill-amber-400 text-amber-400" />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} size={18} className="text-white/20" />
        ))}
      </div>

      <div className="font-mono text-2xl font-bold text-primary text-center">
        {rating.toFixed(1)}
      </div>
      {reviewCount && (
        <div className="font-mono text-[10px] text-muted-foreground text-center -mt-2 uppercase tracking-wider">
          {reviewCount} OPERATOR_SUBMISSIONS
        </div>
      )}

      {onReadReviews && (
        <button 
          onClick={onReadReviews}
          className="w-full h-10 bg-transparent border border-primary/30 font-mono text-xs uppercase tracking-wider text-primary flex items-center justify-center gap-2 transition-all hover:bg-primary/10 hover:border-primary/50"
        >
          ACCESS_LOGS
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
      className="bg-[#0A0C10] border border-white/10 p-4 flex flex-col gap-3 hover:border-primary/20 transition-colors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header with avatar and rating */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 bg-primary/20 border border-primary/40 flex items-center justify-center font-mono text-[10px] font-bold text-primary"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
          >
            {initials}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            {currentReview.author}
          </div>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={10} className={i < currentReview.rating ? "fill-amber-400 text-amber-400" : "text-white/20"} />
          ))}
        </div>
      </div>

      <blockquote className="font-mono text-xs text-muted-foreground italic line-clamp-3 pl-3 border-l-2 border-primary/30">
        "{currentReview.text}"
      </blockquote>

      {currentReview.verified && (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-500 font-mono text-[9px] uppercase tracking-wider self-start">
          <Check size={10} />
          VERIFIED_BUYER
        </div>
      )}

      {reviews.length > 1 && (
        <div className="flex justify-center gap-2 mt-1">
          {reviews.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 transition-all",
                index === currentIndex 
                  ? "bg-primary" 
                  : "bg-white/20 hover:bg-white/40"
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
    <div className="bg-[#0A0C10] border border-amber-500/30 p-5 flex flex-col gap-4">
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 font-mono text-xs font-bold text-amber-400 uppercase tracking-wider self-start">
        <Award size={14} />
        <span>UNIT_RECOMMENDED</span>
      </div>

      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
        RECOMMENDED_FOR:
      </div>

      <ul className="flex flex-col gap-2">
        {recommendations.map((rec, index) => (
          <li key={index} className="font-mono text-xs text-foreground/90 flex gap-2 items-start">
            <span className="text-primary flex-shrink-0">[+]</span>
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

  return (
    <div className="bg-[#0A0C10] border border-white/10 p-5 flex flex-col gap-4">
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider border self-start",
        badge.className
      )}>
        <span>{badge.text}</span>
      </div>

      {stockStatus !== 'out-of-stock' && stockStatus !== 'discontinued' && (
        <div className="font-mono text-xs text-muted-foreground">
          <span className="text-primary/60">&gt;</span> {shippingTime}
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {trustSignals.map((signal, index) => (
          <li key={index} className="font-mono text-xs text-foreground/90 flex items-center gap-2">
            <span className="text-green-500">[✓]</span>
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
    <div className="bg-[#0A0C10] border border-white/10 p-4 flex flex-col gap-2">
      <div className="font-mono text-[10px] text-primary/60 uppercase tracking-wider mb-1">
        &gt;&gt; ACTIVITY_METRICS
      </div>
      
      {activity.views > 0 && (
        <div className="font-mono text-xs text-foreground/90 flex items-center gap-2">
          <span className="text-orange-500">[HOT]</span>
          <span>
            <span className="font-bold text-primary">{activity.views}</span>{' '}
            OPERATORS_VIEWING
          </span>
        </div>
      )}

      {activity.comparisons > 0 && (
        <div className="font-mono text-xs text-foreground/90 flex items-center gap-2">
          <span className="text-primary">[CMP]</span>
          <span>
            <span className="font-bold text-primary">{activity.comparisons}</span>{' '}
            DIAGNOSTIC_QUEUED
          </span>
        </div>
      )}

      {activity.purchases > 0 && (
        <div className="font-mono text-xs text-foreground/90 flex items-center gap-2">
          <span className="text-green-500">[REQ]</span>
          <span>
            <span className="font-bold text-primary">{activity.purchases}</span>{' '}
            REQUISITIONS_WEEK
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
    <div className="bg-[#0A0C10] border border-white/10 p-5 flex flex-col gap-4">
      <div className="font-mono text-xs font-bold text-primary uppercase tracking-[0.15em] flex items-center gap-2">
        <span className="text-primary/60">&gt;&gt;</span>
        <span>DECISION_SUPPORT</span>
      </div>

      {onTakeQuiz && (
        <button 
          onClick={onTakeQuiz}
          className="w-full h-10 bg-primary border-none font-mono text-xs font-semibold text-primary-foreground uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-primary/90 hover:-translate-y-0.5"
        >
          RUN_DIAGNOSTIC_MATCH
          <ArrowRight size={14} />
        </button>
      )}

      {onStartChat && (
        <>
          <div className="font-mono text-[10px] text-muted-foreground text-center uppercase tracking-wider">
            // ALTERNATE_CHANNEL
          </div>

          <button 
            onClick={onStartChat}
            className="w-full h-10 bg-transparent border border-primary/30 font-mono text-xs uppercase tracking-wider text-primary flex items-center justify-center gap-2 transition-all hover:bg-primary/10 hover:border-primary/50"
          >
            <MessageCircle size={14} />
            INITIATE_COMMS
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

        {/* Card 5: Social Activity */}
        <SocialActivityCard activity={data.activity} />

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
        className="w-full h-[56px] px-5 bg-[#0A0C10] border border-white/10 flex items-center justify-between cursor-pointer transition-all hover:border-primary/30"
      >
        <div className="flex items-center gap-3 font-mono text-xs font-bold text-primary uppercase tracking-[0.15em]">
          <span>&gt;&gt;</span>
          <span>OPERATOR_SIGNALS</span>
        </div>
        <ChevronDown 
          size={18} 
          className={cn(
            "text-primary/60 transition-transform duration-200",
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

          <SocialActivityCard activity={data.activity} />

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
