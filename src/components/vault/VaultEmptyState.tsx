import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface VaultEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  tip?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
}

export function VaultEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  tip,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
}: VaultEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionLabel &&
        (actionHref ? (
          <Button asChild>
            <Link to={actionHref}>{actionLabel}</Link>
          </Button>
        ) : onAction ? (
          <Button onClick={onAction}>{actionLabel}</Button>
        ) : null)}
      {secondaryActionLabel && (
        secondaryActionHref ? (
          <Link to={secondaryActionHref} className="text-sm text-cyan-400 hover:text-cyan-300 mt-3 transition-colors">
            {secondaryActionLabel}
          </Link>
        ) : onSecondaryAction ? (
          <button onClick={onSecondaryAction} className="text-sm text-cyan-400 hover:text-cyan-300 mt-3 transition-colors">
            {secondaryActionLabel}
          </button>
        ) : null
      )}
      {tip && (
        <p className="text-xs text-slate-500 mt-3 max-w-sm">{tip}</p>
      )}
    </div>
  );
}
