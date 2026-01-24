import { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load Recharts components
const LazyLineChart = lazy(() =>
  import('recharts').then((m) => ({ default: m.LineChart }))
);

const LazyAreaChart = lazy(() =>
  import('recharts').then((m) => ({ default: m.AreaChart }))
);

const LazyBarChart = lazy(() =>
  import('recharts').then((m) => ({ default: m.BarChart }))
);

const LazyPieChart = lazy(() =>
  import('recharts').then((m) => ({ default: m.PieChart }))
);

const LazyResponsiveContainer = lazy(() =>
  import('recharts').then((m) => ({ default: m.ResponsiveContainer }))
);

interface ChartSkeletonProps {
  height?: number | string;
  className?: string;
}

function ChartSkeleton({ height = 256, className }: ChartSkeletonProps) {
  return (
    <Skeleton 
      className={className}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}

interface LazyChartWrapperProps {
  height?: number | string;
  className?: string;
  children: ReactNode;
}

/**
 * Wrapper component that provides suspense boundary for lazy-loaded charts.
 * Use this around any Recharts component to enable code splitting.
 */
export function LazyChartWrapper({ height = 256, className, children }: LazyChartWrapperProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} className={className} />}>
      {children}
    </Suspense>
  );
}

// Re-export lazy components for direct use
export {
  LazyLineChart,
  LazyAreaChart,
  LazyBarChart,
  LazyPieChart,
  LazyResponsiveContainer,
  ChartSkeleton,
};

// Export type for responsive container
export type LazyResponsiveContainerType = ComponentType<{
  width?: number | string;
  height?: number | string;
  children: ReactNode;
}>;
