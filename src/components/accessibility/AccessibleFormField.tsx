import { useId, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface AccessibleFormFieldProps {
  /** Field label text */
  label: string;
  /** Optional description/help text */
  description?: string;
  /** Error message to display */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** The form input/textarea/select element */
  children: React.ReactElement;
  /** Hide the label visually (still accessible to screen readers) */
  hideLabel?: boolean;
}

/**
 * Accessible Form Field Wrapper
 * 
 * WCAG 2.1 AA Requirements:
 * - Labels or Instructions (3.3.2): Provides visible labels
 * - Error Identification (3.3.1): Links error messages to inputs
 * - Error Suggestion (3.3.3): Provides clear error messages
 * 
 * @example
 * <AccessibleFormField 
 *   label="Email address" 
 *   required 
 *   error={errors.email}
 * >
 *   <Input type="email" {...register("email")} />
 * </AccessibleFormField>
 */
export const AccessibleFormField = forwardRef<HTMLDivElement, AccessibleFormFieldProps>(
  ({ 
    label, 
    description, 
    error, 
    required = false, 
    className, 
    children,
    hideLabel = false,
  }, ref) => {
    // Generate unique IDs for accessibility attributes
    const baseId = useId();
    const inputId = `${baseId}-input`;
    const descriptionId = description ? `${baseId}-description` : undefined;
    const errorId = error ? `${baseId}-error` : undefined;

    // Build aria-describedby from available descriptions
    const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {/* Label */}
        <label 
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium leading-none",
            error ? "text-destructive" : "text-foreground",
            hideLabel && "sr-only"
          )}
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
          )}
          {required && <span className="sr-only">(required)</span>}
        </label>

        {/* Description */}
        {description && (
          <p 
            id={descriptionId} 
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}

        {/* Input with accessibility props injected */}
        <div className="relative">
          {/* Clone the child element with accessibility props */}
          {(() => {
            const child = children;
            return (
              <child.type
                {...child.props}
                id={inputId}
                aria-describedby={ariaDescribedBy}
                aria-invalid={error ? "true" : undefined}
                aria-required={required}
                className={cn(
                  child.props.className,
                  error && "border-destructive focus-visible:ring-destructive"
                )}
              />
            );
          })()}
        </div>

        {/* Error Message */}
        {error && (
          <div 
            id={errorId} 
            role="alert"
            className="flex items-center gap-2 text-sm font-medium text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

AccessibleFormField.displayName = "AccessibleFormField";

/**
 * Fieldset with Legend for grouping related form fields
 * 
 * WCAG 2.1 AA Requirement: Info and Relationships (1.3.1)
 */
export const AccessibleFieldset = ({
  legend,
  description,
  children,
  className,
}: {
  legend: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const descriptionId = useId();

  return (
    <fieldset 
      className={cn("space-y-4", className)}
      aria-describedby={description ? descriptionId : undefined}
    >
      <legend className="text-base font-semibold text-foreground">
        {legend}
      </legend>
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground -mt-2">
          {description}
        </p>
      )}
      {children}
    </fieldset>
  );
};

/**
 * Required Field Indicator
 * Use this for consistent required field marking
 */
export const RequiredIndicator = () => (
  <>
    <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
    <span className="sr-only">(required)</span>
  </>
);
