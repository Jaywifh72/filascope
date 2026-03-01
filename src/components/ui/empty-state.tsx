import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LucideIcon, Package, HelpCircle, ExternalLink, Pencil } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
    variant?: 'default' | 'outline' | 'ghost' | 'link';
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  secondaryAction,
  compact,
  size = 'md',
  className,
}: EmptyStateProps) {
  // compact prop overrides size to sm behavior
  const effectiveSize = compact ? 'sm' : size;

  const sizeClasses = {
    sm: 'py-8 px-3',
    md: 'py-12 px-4',
    lg: 'py-16 px-6',
  };

  const iconContainerSizes = {
    sm: 'w-14 h-14 rounded-xl',
    md: 'w-20 h-20 rounded-2xl',
    lg: 'w-20 h-20 rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border/50 bg-muted/10',
        sizeClasses[effectiveSize],
        className
      )}
    >
      {Icon && (
        <div className={cn(
          'mb-4 flex items-center justify-center bg-white/[0.04] border border-white/[0.08]',
          iconContainerSizes[effectiveSize]
        )}>
          <Icon className={cn(iconSizes[effectiveSize], 'text-muted-foreground')} strokeWidth={1.5} />
        </div>
      )}
      
      {title && (
        <h4 className={cn(
          'font-semibold text-foreground mb-1',
          effectiveSize === 'sm' ? 'text-base' : effectiveSize === 'md' ? 'text-lg' : 'text-lg'
        )}>
          {title}
        </h4>
      )}
      
      <p className={cn('text-muted-foreground max-w-sm mt-1', textSizes[effectiveSize])}>
        {message}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {action && (
            <Button
              variant={action.variant || 'outline'}
              size={effectiveSize === 'lg' ? 'default' : 'sm'}
              asChild={!!action.href}
            >
              {action.href ? (
                <a href={action.href} target="_blank" rel="noopener noreferrer" className="gap-2">
                  {action.icon && <action.icon className="w-4 h-4" />}
                  {action.label}
                </a>
              ) : (
                <span onClick={action.onClick} className="gap-2 cursor-pointer inline-flex items-center">
                  {action.icon && <action.icon className="w-4 h-4" />}
                  {action.label}
                </span>
              )}
            </Button>
          )}
          
          {secondaryAction && (
            secondaryAction.href ? (
              <a 
                href={secondaryAction.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline',
                  textSizes[effectiveSize]
                )}
              >
                {secondaryAction.label}
              </a>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className={cn(
                  'text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline',
                  textSizes[effectiveSize]
                )}
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// Specialized empty state for accessories
export function AccessoriesEmptyState({ 
  printerSlug,
  className 
}: { 
  printerSlug?: string;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Package}
      title="Compatible Accessories"
      message="Compatible filaments and accessories will be listed here as we gather data for this printer."
      action={{
        label: 'Suggest compatible materials',
        icon: Pencil,
        href: `mailto:feedback@filascope.com?subject=Material%20suggestion%20for%20${encodeURIComponent(printerSlug || 'printer')}&body=I%20would%20like%20to%20suggest%20compatible%20materials%20or%20accessories%20for%20this%20printer.`,
        variant: 'outline',
      }}
      size="md"
      className={className}
    />
  );
}

// Specialized empty state for price data
export function PriceEmptyState({ 
  amazonSearchUrl,
  className 
}: { 
  amazonSearchUrl?: string;
  className?: string;
}) {
  return (
    <EmptyState
      icon={HelpCircle}
      message="Price data not available"
      action={amazonSearchUrl ? {
        label: 'Check Amazon',
        icon: ExternalLink,
        href: amazonSearchUrl,
        variant: 'link',
      } : undefined}
      size="sm"
      className={cn('border-0 bg-transparent py-2', className)}
    />
  );
}

export default EmptyState;
