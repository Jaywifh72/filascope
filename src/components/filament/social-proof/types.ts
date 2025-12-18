export interface FeaturedReview {
  id: string;
  text: string;
  author: string;
  rating: number;
  verified: boolean;
  date: string;
  helpful: number;
}

export interface RatingData {
  average: number;
  count: number;
  distribution?: Record<number, number>;
}

export interface PurchaseStats {
  totalBuyers: number;
  boughtThisMonth: number;
  boughtThisWeek: number;
  repeatBuyers: number;
}

export interface TrustIndicators {
  verifiedReviews: boolean;
  priceMatchGuarantee: boolean;
  editorsPick: boolean;
  topRated: boolean;
  bestSeller: boolean;
  bestSellerRank?: number;
  bestSellerCategory?: string;
}

export interface RetailerRating {
  retailerId: string;
  retailerName: string;
  rating: number;
  reviewCount: number;
}

export interface SocialProofData {
  rating: RatingData;
  featuredReviews: FeaturedReview[];
  purchaseStats: PurchaseStats;
  trustIndicators: TrustIndicators;
  retailerRatings?: RetailerRating[];
}

export interface SocialProofConfig {
  showReviewSnippet: boolean;
  showRatingSummary: boolean;
  showPurchaseCount: boolean;
  showTrustBadges: boolean;
  rotateReviews: boolean;
  rotationInterval: number;
}
