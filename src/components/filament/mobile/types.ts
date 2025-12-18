// Mobile-specific configuration
export interface MobileConfig {
  // Touch targets
  minTouchTarget: number; // 48px
  touchTargetSpacing: number; // 8px
  
  // Gestures
  swipeThreshold: number; // minimum px to trigger swipe
  swipeVelocityThreshold: number; // minimum velocity
  longPressDelay: number; // ms
  
  // Layout
  galleryMaxHeight: string; // '60vh'
  bottomBarHeight: number; // 72px
  safeAreaBottom: number; // for notched phones
  
  // Animation
  springConfig: {
    tension: number;
    friction: number;
  };
}

// Swipe gesture state
export interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  isActive: boolean;
}

// Bottom sheet state
export interface BottomSheetState {
  isOpen: boolean;
  snapPoints: number[]; // percentage of screen height
  currentSnap: number;
  contentType: 'retailers' | 'colors' | 'reviews' | 'share' | null;
}

// Gallery image
export interface GalleryImage {
  url: string;
  alt: string;
  thumbnail?: string;
}

// Mobile product info
export interface MobileProductData {
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockLevel?: 'high' | 'medium' | 'low' | 'critical';
  price: number;
  originalPrice?: number;
  isLowestPrice?: boolean;
  discountPercent?: number;
}

// Quick fact for horizontal scroll
export interface QuickFact {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

// Default mobile config
export const DEFAULT_MOBILE_CONFIG: MobileConfig = {
  minTouchTarget: 48,
  touchTargetSpacing: 8,
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.5,
  longPressDelay: 500,
  galleryMaxHeight: '60vh',
  bottomBarHeight: 72,
  safeAreaBottom: 34,
  springConfig: {
    tension: 300,
    friction: 30,
  },
};
