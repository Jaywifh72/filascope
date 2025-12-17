export interface PriceDataPoint {
  date: string;
  price: number;
}

export interface PriceInsight {
  currentPrice: number;
  trend: {
    direction: 'down' | 'up' | 'stable';
    percentage: number;
    period: string;
  };
  priceRange: {
    low: number;
    high: number;
  };
  historicalLow: {
    price: number;
    date: string;
  };
  trendStatus: 'rising' | 'falling' | 'stable' | 'volatile';
  dealIndicator: 'buy' | 'wait' | null;
}

export function calculatePriceInsights(
  currentPrice: number,
  priceHistory: PriceDataPoint[]
): PriceInsight {
  if (!priceHistory || priceHistory.length === 0) {
    return {
      currentPrice,
      trend: { direction: 'stable', percentage: 0, period: '30 days' },
      priceRange: { low: currentPrice, high: currentPrice },
      historicalLow: { price: currentPrice, date: 'Now' },
      trendStatus: 'stable',
      dealIndicator: null,
    };
  }

  // Sort by date (newest first)
  const sorted = [...priceHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate 30-day trend
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const priceThirtyDaysAgo =
    sorted.find((p) => new Date(p.date) <= thirtyDaysAgo)?.price || sorted[sorted.length - 1]?.price || currentPrice;

  const percentageChange =
    priceThirtyDaysAgo > 0
      ? ((currentPrice - priceThirtyDaysAgo) / priceThirtyDaysAgo) * 100
      : 0;

  let direction: 'down' | 'up' | 'stable';
  if (Math.abs(percentageChange) < 1) {
    direction = 'stable';
  } else if (percentageChange < 0) {
    direction = 'down';
  } else {
    direction = 'up';
  }

  // Calculate price range (min/max over last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentPrices = sorted
    .filter((p) => new Date(p.date) >= sixMonthsAgo)
    .map((p) => p.price);

  const allPricesWithCurrent = [...recentPrices, currentPrice];
  const priceRange = {
    low: Math.min(...allPricesWithCurrent),
    high: Math.max(...allPricesWithCurrent),
  };

  // Find historical low
  const allPrices = sorted.map((p) => ({ price: p.price, date: p.date }));
  const lowestEntry = allPrices.reduce(
    (min, p) => (p.price < min.price ? p : min),
    { price: currentPrice, date: new Date().toISOString() }
  );

  const historicalLow = {
    price: Math.min(lowestEntry.price, currentPrice),
    date:
      currentPrice <= lowestEntry.price
        ? 'Now'
        : new Date(lowestEntry.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
  };

  // Determine trend status based on recent price movements
  const recentTrend = sorted.slice(0, Math.min(10, sorted.length));
  let increases = 0;
  let decreases = 0;

  for (let i = 0; i < recentTrend.length - 1; i++) {
    if (recentTrend[i].price > recentTrend[i + 1].price) {
      increases++;
    } else if (recentTrend[i].price < recentTrend[i + 1].price) {
      decreases++;
    }
  }

  let trendStatus: 'rising' | 'falling' | 'stable' | 'volatile';
  if (recentTrend.length < 2) {
    trendStatus = 'stable';
  } else if (increases >= decreases * 2) {
    trendStatus = 'rising';
  } else if (decreases >= increases * 2) {
    trendStatus = 'falling';
  } else {
    const prices = recentTrend.map((p) => p.price);
    const variance = calculateVariance(prices);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const coefficientOfVariation = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
    trendStatus = coefficientOfVariation > 5 ? 'volatile' : 'stable';
  }

  // Determine deal indicator
  let dealIndicator: 'buy' | 'wait' | null = null;
  const isAtOrNearLow = currentPrice <= historicalLow.price * 1.02;
  const isPriceDown = direction === 'down' && Math.abs(percentageChange) > 3;
  const isPriceUp = direction === 'up' && percentageChange > 5;

  if (isAtOrNearLow || isPriceDown) {
    dealIndicator = 'buy';
  } else if (isPriceUp) {
    dealIndicator = 'wait';
  }

  return {
    currentPrice,
    trend: {
      direction,
      percentage: Math.abs(parseFloat(percentageChange.toFixed(1))),
      period: '30 days',
    },
    priceRange,
    historicalLow,
    trendStatus,
    dealIndicator,
  };
}

function calculateVariance(prices: number[]): number {
  if (prices.length === 0) return 0;
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const squareDiffs = prices.map((price) => Math.pow(price - mean, 2));
  return squareDiffs.reduce((a, b) => a + b, 0) / prices.length;
}
