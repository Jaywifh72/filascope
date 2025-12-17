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
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
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
    <div className="bg-white/[0.05] border border-white/10 rounded-xl p-5 flex flex-col gap-4">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
        Customer Reviews
      </h3>

      <div className="flex justify-center items-center gap-1">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} size={20} fill="#FFD700" color="#FFD700" />
        ))}
        {partialStar > 0 && (
          <div className="relative">
            <Star size={20} fill="rgba(255,255,255,0.2)" color="rgba(255,255,255,0.2)" />
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${partialStar * 100}%` }}>
              <Star size={20} fill="#FFD700" color="#FFD700" />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} size={20} fill="rgba(255,255,255,0.2)" color="rgba(255,255,255,0.2)" />
        ))}
      </div>

      <div className="text-lg font-bold text-foreground text-center">
        {rating.toFixed(1)} out of 5
      </div>
      {reviewCount && (
        <div className="text-sm font-medium text-muted-foreground text-center -mt-2">
          Based on {reviewCount} reviews
        </div>
      )}

      {onReadReviews && (
        <button 
          onClick={onReadReviews}
          className="w-full h-10 bg-primary/10 border border-primary/30 rounded-lg text-sm font-semibold text-primary flex items-center justify-center gap-2 transition-all hover:bg-primary/15 hover:border-primary/50"
        >
          Read All Reviews
          <ArrowRight size={16} />
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

  return (
    <div 
      className="bg-white/[0.05] border border-white/10 rounded-xl p-5 flex flex-col gap-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex gap-0.5">
        {Array.from({ length: currentReview.rating }).map((_, i) => (
          <Star key={i} size={14} fill="#FFD700" color="#FFD700" />
        ))}
      </div>

      <blockquote className="text-sm font-medium text-muted-foreground italic line-clamp-3">
        "{currentReview.text}"
      </blockquote>

      <div className="text-xs font-medium text-muted-foreground flex items-center gap-2 flex-wrap">
        — {currentReview.author}
        {currentReview.verified && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 rounded text-[11px] font-semibold text-green-500">
            <Check size={12} />
            Verified Buyer
          </span>
        )}
      </div>

      {reviews.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {reviews.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
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
    <div className="bg-white/[0.05] border border-white/10 rounded-xl p-5 flex flex-col gap-4">
      <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[15px] font-bold text-amber-400 self-start">
        <Award size={16} />
        <span>STAFF PICK</span>
      </div>

      <p className="text-sm font-medium text-muted-foreground">
        Our team recommends this for:
      </p>

      <ul className="flex flex-col gap-2">
        {recommendations.map((rec, index) => (
          <li key={index} className="text-sm font-medium text-foreground/90 flex gap-2 items-start">
            <span className="text-primary flex-shrink-0">•</span>
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
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  shippingTime: string;
  trustSignals: string[];
}) {
  const stockConfig = {
    'in-stock': {
      icon: <Package size={14} />,
      text: 'IN STOCK',
      className: 'bg-green-500/10 border-green-500/30 text-green-500'
    },
    'low-stock': {
      icon: <Clock size={14} />,
      text: 'LOW STOCK',
      className: 'bg-orange-500/10 border-orange-500/30 text-orange-500'
    },
    'out-of-stock': {
      icon: <X size={14} />,
      text: 'OUT OF STOCK',
      className: 'bg-red-500/10 border-red-500/30 text-red-500'
    }
  };

  const badge = stockConfig[stockStatus];

  return (
    <div className="bg-white/[0.05] border border-white/10 rounded-xl p-5 flex flex-col gap-4">
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold border self-start",
        badge.className
      )}>
        {badge.icon}
        <span>{badge.text}</span>
      </div>

      {stockStatus !== 'out-of-stock' && (
        <div className="text-sm font-medium text-muted-foreground">
          {shippingTime}
        </div>
      )}

      <ul className="flex flex-col gap-2.5">
        {trustSignals.map((signal, index) => (
          <li key={index} className="text-sm font-medium text-foreground/90 flex items-center gap-2.5">
            <Check size={16} strokeWidth={3} className="text-green-500 flex-shrink-0" />
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
    <div className="bg-white/[0.05] border border-white/10 rounded-xl p-5 flex flex-col gap-3">
      {activity.views > 0 && (
        <div className="text-sm font-medium text-foreground/90 flex items-start gap-2.5">
          <span className="text-base flex-shrink-0">🔥</span>
          <span>
            <span className="font-bold text-primary">{activity.views}</span>{' '}
            {activity.views === 1 ? 'person' : 'people'} viewed in last hour
          </span>
        </div>
      )}

      {activity.comparisons > 0 && (
        <div className="text-sm font-medium text-foreground/90 flex items-start gap-2.5">
          <span className="text-base flex-shrink-0">👁</span>
          <span>
            <span className="font-bold text-primary">{activity.comparisons}</span>{' '}
            added to comparison today
          </span>
        </div>
      )}

      {activity.purchases > 0 && (
        <div className="text-sm font-medium text-foreground/90 flex items-start gap-2.5">
          <span className="text-base flex-shrink-0">🛒</span>
          <span>
            <span className="font-bold text-primary">{activity.purchases}</span>{' '}
            purchased this week
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
    <div className="bg-white/[0.05] border border-white/10 rounded-xl p-5 flex flex-col gap-4">
      <div className="text-sm font-bold text-foreground flex items-center gap-2">
        <Lightbulb size={16} className="text-amber-400" />
        <span>NEED HELP DECIDING?</span>
      </div>

      {onTakeQuiz && (
        <button 
          onClick={onTakeQuiz}
          className="w-full h-11 bg-primary border-none rounded-lg text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 transition-all hover:bg-primary/90 hover:-translate-y-0.5"
        >
          Take Our Printer Quiz
          <ArrowRight size={16} />
        </button>
      )}

      {onStartChat && (
        <>
          <div className="text-xs font-medium text-muted-foreground text-center">
            Or chat with an expert:
          </div>

          <button 
            onClick={onStartChat}
            className="w-full h-11 bg-transparent border border-primary/30 rounded-lg text-sm font-semibold text-primary flex items-center justify-center gap-2 transition-all hover:bg-primary/10 hover:border-primary/50"
          >
            <MessageCircle size={16} />
            Start Live Chat
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
        className="w-full h-[60px] px-5 bg-white/[0.05] border border-white/10 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-white/[0.08] hover:border-primary/30"
      >
        <div className="flex items-center gap-3 text-[15px] font-bold text-foreground">
          <span className="text-xl">🏆</span>
          <span>Reviews & Trust Signals</span>
        </div>
        <ChevronDown 
          size={20} 
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
