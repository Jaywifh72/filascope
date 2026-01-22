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
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-4 px-3',
    md: 'py-6 px-4',
    lg: 'py-10 px-6',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const ActionButton = action?.href ? 'a' : 'button';
  const actionProps = action?.href 
    ? { href: action.href, target: '_blank', rel: 'noopener noreferrer' }
    : { onClick: action?.onClick };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border/50 bg-muted/10',
        sizeClasses[size],
        className
      )}
    >
      {Icon && (
        <div className="mb-3 text-muted-foreground/40">
          <Icon className={iconSizes[size]} strokeWidth={1.5} />
        </div>
      )}
      
      {title && (
        <h4 className={cn(
          'font-medium text-foreground mb-1',
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
        )}>
          {title}
        </h4>
      )}
      
      <p className={cn('text-muted-foreground max-w-sm', textSizes[size])}>
        {message}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {action && (
            <Button
              variant={action.variant || 'outline'}
              size={size === 'lg' ? 'default' : 'sm'}
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
                  textSizes[size]
                )}
              >
                {secondaryAction.label}
              </a>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className={cn(
                  'text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline',
                  textSizes[size]
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
      title="No accessories data yet"
      message="We're still gathering compatible accessories for this printer. Help us improve this listing."
      action={{
        label: 'Suggest an edit',
        icon: Pencil,
        href: `mailto:feedback@filascope.com?subject=Accessory%20suggestion%20for%20${encodeURIComponent(printerSlug || 'printer')}`,
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
