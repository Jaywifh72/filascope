import { useState } from 'react';
import { Star, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserRatingSectionProps {
  filamentId: string;
  scoreType: string;
  existingRating?: {
    rating: number;
    issues: string[];
    createdAt: string;
  };
  onSubmit?: (rating: number, issues: string[]) => Promise<void>;
}

const PRINT_ISSUES = [
  { id: 'warping', label: 'Warping' },
  { id: 'stringing', label: 'Stringing' },
  { id: 'poor_adhesion', label: 'Poor adhesion' },
  { id: 'clogs', label: 'Clogs' },
  { id: 'layer_separation', label: 'Layer separation' },
  { id: 'inconsistent_extrusion', label: 'Inconsistent extrusion' },
];

function StarRating({ 
  value, 
  onChange, 
  readonly = false,
  size = 'md'
}: { 
  value: number; 
  onChange?: (v: number) => void; 
  readonly?: boolean;
  size?: 'sm' | 'md';
}) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div 
      className="flex items-center gap-0.5"
      onMouseLeave={() => !readonly && setHoverValue(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          className={cn(
            "transition-colors",
            !readonly && "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            className={cn(
              starSize,
              "transition-colors",
              star <= displayValue 
                ? "fill-primary text-primary" 
                : "fill-transparent text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function UserRatingSection({ 
  filamentId, 
  scoreType,
  existingRating,
  onSubmit 
}: UserRatingSectionProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingRating?.rating ?? 0);
  const [selectedIssues, setSelectedIssues] = useState<string[]>(existingRating?.issues ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!existingRating);

  const handleIssueToggle = (issueId: string) => {
    setSelectedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(i => i !== issueId)
        : [...prev, issueId]
    );
  };

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(rating, selectedIssues);
      toast.success('Thanks for your rating!', {
        description: 'Your feedback will be included in the next score update.'
      });
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          Rate This Material
        </h4>
        
        <div className="bg-muted/30 rounded-lg p-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Sign in to rate this material and help improve our scores.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/auth">Sign In to Rate</a>
          </Button>
        </div>
      </div>
    );
  }

  if (existingRating && !isEditing) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          Your Rating
        </h4>
        
        <div className="bg-primary/10 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StarRating value={existingRating.rating} readonly size="sm" />
              <span className="text-sm font-medium">{existingRating.rating}/5</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              Change
            </Button>
          </div>
          
          {existingRating.issues.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {existingRating.issues.map(issue => (
                <span 
                  key={issue}
                  className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                >
                  {PRINT_ISSUES.find(i => i.id === issue)?.label || issue}
                </span>
              ))}
            </div>
          )}
          
          <p className="text-[10px] text-muted-foreground">
            Submitted {existingRating.createdAt}
          </p>
        </div>

        <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground">
          <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
          <p>
            Your rating is included in our score calculations. 
            Community ratings contribute 30% of the final score.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Star className="w-4 h-4 text-primary" />
        Rate This Material
      </h4>
      
      <p className="text-xs text-muted-foreground">
        Have you printed with this filament? Share your experience!
      </p>

      {/* Star Rating */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          How easy was it to print?
        </label>
        <div className="flex items-center gap-3">
          <StarRating value={rating} onChange={setRating} />
          {rating > 0 && (
            <span className="text-sm font-medium text-primary">{rating}/5</span>
          )}
        </div>
      </div>

      {/* Issues */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Any issues you encountered? (optional)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRINT_ISSUES.map(issue => (
            <label
              key={issue.id}
              className={cn(
                "flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer transition-colors",
                selectedIssues.includes(issue.id)
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/20 border-border hover:bg-muted/40"
              )}
            >
              <Checkbox
                checked={selectedIssues.includes(issue.id)}
                onCheckedChange={() => handleIssueToggle(issue.id)}
              />
              {issue.label}
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button 
        onClick={handleSubmit} 
        disabled={!rating || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
      </Button>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground">
        <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p>
          Your rating will be included in next month's score calculation. 
          Community ratings contribute 30% of the final Ease of Printing score.
        </p>
      </div>
    </div>
  );
}
