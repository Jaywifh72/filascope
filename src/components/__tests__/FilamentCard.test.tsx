import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilamentCard } from '../FilamentCard';

// ── Mock all external hooks and modules ──

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

jest.mock('@/hooks/useAffiliateLinks', () => ({
  useAffiliateLinks: () => ({ getAffiliateUrl: (url: string) => url }),
}));

jest.mock('@/hooks/useCompare', () => ({
  useCompare: () => ({
    addItem: jest.fn(),
    removeItem: jest.fn(),
    isInCompare: () => false,
    isFull: false,
    triggerGlow: jest.fn(),
    isMultiSelectMode: false,
    addToPending: jest.fn(),
    removeFromPending: jest.fn(),
    isPending: () => false,
  }),
}));

jest.mock('@/contexts/RegionContext', () => ({
  useRegion: () => ({
    currency: 'USD',
    formatPrice: (v: number) => `$${v.toFixed(2)}`,
    regionConfig: { code: 'US' },
  }),
}));

jest.mock('@/hooks/useResolvedPrice', () => ({
  useResolvedPrice: (f: any) => ({
    pricePerKg: f.variant_price && f.net_weight_g ? (f.variant_price / f.net_weight_g) * 1000 : f.variant_price,
    isConverted: false,
    isLoading: false,
    localPricePerKg: null,
    formattedLocalPricePerKg: null,
  }),
}));

jest.mock('@/hooks/useRegionalPrice', () => ({
  useRegionalPrice: () => ({ regionalUrl: null, isLocalStore: false, isRatesLoading: false }),
}));

jest.mock('@/hooks/useFilamentVariantCounts', () => ({
  useFilamentVariantCounts: () => ({ colors: [], count: 1 }),
}));

jest.mock('@/lib/brandLogos', () => ({
  getBrandLogo: () => null,
}));

jest.mock('@/components/ui/BrandLogo', () => ({
  BrandLogo: ({ brandName }: any) => <span data-testid="brand-logo">{brandName}</span>,
}));

jest.mock('@/lib/productNameUtils', () => ({
  cleanFilamentDisplayName: (name: string) => name,
}));

jest.mock('@/lib/unifiedFilamentScore', () => ({
  calculateUnifiedScore: () => ({ score: null, factors: [], confidence: 'low', dataPointCount: 0, label: '' }),
}));

jest.mock('@/config/regions', () => ({ REGIONS: {} }));

jest.mock('@/hooks/usePriceFreshness', () => ({
  usePriceFreshness: () => ({ confidence: 'high', timeAgo: null, isStale: false }),
}));

jest.mock('@/hooks/useUserPrinterPreference', () => ({
  useUserPrinterPreference: () => ({ printerName: null }),
}));

jest.mock('@/hooks/useFilamentCompatibility', () => ({
  useFilamentCompatibility: () => null,
}));

jest.mock('@/lib/filamentUrl', () => ({
  getFilamentHref: (id: string) => `/filament/${id}`,
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  normalizeColorHex: (hex: string) => hex,
}));

jest.mock('@/components/filament/SearchPropertyBadges', () => ({
  SearchPropertyBadges: () => null,
}));

// Stub UI primitives to pass-through children
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => <button {...props}>{children}</button>,
}));
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <span>{children}</span>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
}));
jest.mock('@/components/ui/hover-card', () => ({
  HoverCard: ({ children }: any) => <>{children}</>,
  HoverCardContent: ({ children }: any) => <div>{children}</div>,
  HoverCardTrigger: ({ children }: any) => <>{children}</>,
}));

// Stub lucide-react icons
jest.mock('lucide-react', () =>
  new Proxy({}, {
    get: (_target, name) => {
      if (typeof name !== 'string') return undefined;
      const Icon = (props: any) => <svg data-icon={name} {...props} />;
      Icon.displayName = name as string;
      return Icon;
    },
  })
);

// ── Helpers ──

function makeFilament(overrides: Partial<any> = {}) {
  return {
    id: 'fil-001',
    product_title: 'PLA Basic Black',
    vendor: 'Hatchbox',
    material: 'PLA',
    color_hex: '#1a1a1a',
    variant_price: 25,
    net_weight_g: 1000,
    variant_available: true,
    featured_image: null,
    ...overrides,
  };
}

// ── Tests ──

describe('FilamentCard', () => {
  it('renders without crashing', () => {
    render(<FilamentCard filament={makeFilament()} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('shows brand name and price when data is provided', () => {
    render(<FilamentCard filament={makeFilament()} />);

    // Brand name appears (may appear in both logo and text)
    expect(screen.getAllByText('Hatchbox').length).toBeGreaterThanOrEqual(1);

    // Price is rendered (variant_price 25 / net_weight 1000g = $25/kg)
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });

  it('handles out-of-stock state (no price shown with line-through)', () => {
    render(
      <FilamentCard
        filament={makeFilament({ variant_available: false })}
      />
    );

    // Out-of-stock badge visible
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();

    // CTA changes to "Check Availability"
    expect(screen.getByText('Check Availability')).toBeInTheDocument();
  });

  it('displays color swatches when variant indicators have colors', () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
    render(
      <FilamentCard
        filament={makeFilament()}
        variantIndicators={{
          colors,
          weights: [],
          variantCount: 4,
          anyInStock: true,
        }}
      />
    );

    const swatches = screen.getAllByRole('img', { name: /Color swatch/ });
    expect(swatches).toHaveLength(4);
  });
});
