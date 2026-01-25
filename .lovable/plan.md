

# Create `AdminPriceRefreshButton` Component

## Overview

Create an admin-only button component that allows manual price refresh for filament products. The button displays a refresh icon, shows loading/success/error states with visual feedback, and integrates with the existing `useAdminPriceRefresh` hook.

---

## File to Create

### `src/components/admin/AdminPriceRefreshButton.tsx`

---

## Component Structure

### Props Interface

```typescript
interface AdminPriceRefreshButtonProps {
  productUrl: string;
  filamentId: string;
  onRefreshComplete?: (success: boolean, newPrice?: number) => void;
  className?: string;
}
```

### State Management

- **Visual state**: `'idle' | 'refreshing' | 'success' | 'error'`
- Tracks current visual state for icon/animation display
- Success/error states auto-reset to idle after brief display (1.5s)

---

## Implementation Details

### 1. Admin-Only Rendering
```typescript
const { user, isAdmin, loading } = useAuth();

// Return null if not authenticated or not admin
if (loading || !user || !isAdmin) {
  return null;
}
```

### 2. Icon States

| State | Icon | Visual |
|-------|------|--------|
| `idle` | `RefreshCw` | Default muted color |
| `refreshing` | `RefreshCw` | Spinning animation, disabled |
| `success` | `Check` | Green color, brief display |
| `error` | `X` | Red color, brief display |

### 3. Button Styling
- Uses `Button` component with `size="icon"` and `variant="ghost"`
- Small size: `h-6 w-6` with smaller icon `w-3.5 h-3.5`
- Muted styling that becomes visible on hover
- CSS classes for state colors: `text-green-500`, `text-destructive`

### 4. Tooltip Integration
- Wraps button in `TooltipProvider` + `Tooltip`
- Default tooltip: "Refresh price from store"
- On error: Shows error message in tooltip content

### 5. Animation Classes
```css
/* Spinning animation for refreshing state */
animate-spin

/* Brief success/error flash */
transition-colors duration-200
```

### 6. Click Handler Flow
```typescript
const handleClick = async () => {
  setVisualState('refreshing');
  
  const result = await refreshPrice();
  
  if (result.success) {
    setVisualState('success');
    toast.success(`Price updated to $${result.newPrice?.toFixed(2)}`);
    onRefreshComplete?.(true, result.newPrice);
    
    // Reset to idle after 1.5s
    setTimeout(() => setVisualState('idle'), 1500);
  } else {
    setVisualState('error');
    toast.error(result.error || 'Failed to refresh price');
    onRefreshComplete?.(false);
    
    // Reset to idle after 2s (longer for error)
    setTimeout(() => setVisualState('idle'), 2000);
  }
};
```

---

## Dependencies

| Import | From |
|--------|------|
| `useState` | `react` |
| `Button` | `@/components/ui/button` |
| `Tooltip, TooltipContent, TooltipProvider, TooltipTrigger` | `@/components/ui/tooltip` |
| `toast` | `sonner` |
| `RefreshCw, Check, X` | `lucide-react` |
| `useAuth` | `@/hooks/useAuth` |
| `useAdminPriceRefresh` | `@/hooks/useAdminPriceRefresh` |
| `cn` | `@/lib/utils` |

---

## Full Component Code

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { RefreshCw, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPriceRefresh } from '@/hooks/useAdminPriceRefresh';
import { cn } from '@/lib/utils';

interface AdminPriceRefreshButtonProps {
  productUrl: string;
  filamentId: string;
  onRefreshComplete?: (success: boolean, newPrice?: number) => void;
  className?: string;
}

type VisualState = 'idle' | 'refreshing' | 'success' | 'error';

export function AdminPriceRefreshButton({
  productUrl,
  filamentId,
  onRefreshComplete,
  className,
}: AdminPriceRefreshButtonProps) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { refreshPrice, isRefreshing, lastRefreshError } = useAdminPriceRefresh(
    productUrl,
    filamentId
  );
  const [visualState, setVisualState] = useState<VisualState>('idle');

  // Only render for authenticated admin users
  if (authLoading || !user || !isAdmin) {
    return null;
  }

  const handleClick = async () => {
    if (isRefreshing) return;
    
    setVisualState('refreshing');
    
    const result = await refreshPrice();
    
    if (result.success) {
      setVisualState('success');
      toast.success(`Price updated to $${result.newPrice?.toFixed(2)}`);
      onRefreshComplete?.(true, result.newPrice);
      
      // Reset to idle after brief success display
      setTimeout(() => setVisualState('idle'), 1500);
    } else {
      setVisualState('error');
      toast.error(result.error || 'Failed to refresh price');
      onRefreshComplete?.(false);
      
      // Reset to idle after error display
      setTimeout(() => setVisualState('idle'), 2000);
    }
  };

  const getIcon = () => {
    switch (visualState) {
      case 'refreshing':
        return <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
      case 'success':
        return <Check className="w-3.5 h-3.5 text-green-500" />;
      case 'error':
        return <X className="w-3.5 h-3.5 text-destructive" />;
      default:
        return <RefreshCw className="w-3.5 h-3.5" />;
    }
  };

  const getTooltipContent = () => {
    if (visualState === 'error' && lastRefreshError) {
      return lastRefreshError;
    }
    if (visualState === 'success') {
      return 'Price updated!';
    }
    if (visualState === 'refreshing') {
      return 'Refreshing price...';
    }
    return 'Refresh price from store';
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 text-muted-foreground hover:text-foreground',
              visualState === 'success' && 'text-green-500 hover:text-green-500',
              visualState === 'error' && 'text-destructive hover:text-destructive',
              className
            )}
            onClick={handleClick}
            disabled={isRefreshing}
            aria-label="Refresh price from store"
          >
            {getIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

## Usage Example

```tsx
// In FilamentPurchaseSidebar or similar component
import { AdminPriceRefreshButton } from '@/components/admin/AdminPriceRefreshButton';

// Positioned next to "Last checked X ago" text
<div className="flex items-center gap-2 text-xs text-muted-foreground">
  <span>Last checked {formatDistanceToNow(lastCheckedAt)} ago</span>
  <AdminPriceRefreshButton
    productUrl={product.product_url}
    filamentId={product.id}
    onRefreshComplete={(success, newPrice) => {
      if (success) {
        // Optionally trigger a refetch or state update
      }
    }}
  />
</div>
```

---

## Visual Behavior Summary

1. **Default (idle)**: Subtle gray refresh icon, shows tooltip "Refresh price from store"
2. **On click (refreshing)**: Icon spins, button disabled, tooltip shows "Refreshing price..."
3. **On success**: Green checkmark briefly, toast "Price updated to $X.XX", resets after 1.5s
4. **On error**: Red X briefly, toast with error message, tooltip shows error, resets after 2s

