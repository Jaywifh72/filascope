import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface InlineEditableCellProps {
  value: string | number | null | undefined;
  onSave: (value: string) => Promise<void>;
  type?: 'text' | 'number' | 'price';
  placeholder?: string;
  className?: string;
  validate?: (value: string) => string | null; // Returns error message or null if valid
  formatDisplay?: (value: string | number | null | undefined) => string;
  disabled?: boolean;
}

export function InlineEditableCell({
  value,
  onSave,
  type = 'text',
  placeholder = '—',
  className,
  validate,
  formatDisplay,
  disabled = false,
}: InlineEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = formatDisplay
    ? formatDisplay(value)
    : value != null
    ? String(value)
    : placeholder;

  const startEditing = useCallback(() => {
    if (disabled) return;
    setEditValue(value != null ? String(value) : '');
    setError(null);
    setIsEditing(true);
  }, [value, disabled]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setError(null);
    setEditValue('');
  }, []);

  const saveValue = useCallback(async () => {
    // Validate
    if (validate) {
      const validationError = validate(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Default validation for number/price types
    if (type === 'number' || type === 'price') {
      const numValue = parseFloat(editValue);
      if (editValue !== '' && (isNaN(numValue) || numValue < 0)) {
        setError('Must be a positive number');
        return;
      }
    }

    // Check if value changed
    const currentValue = value != null ? String(value) : '';
    if (editValue === currentValue) {
      cancelEditing();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, validate, type, onSave, cancelEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveValue();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
    },
    [saveValue, cancelEditing]
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            type={type === 'text' ? 'text' : 'number'}
            step={type === 'price' ? '0.01' : type === 'number' ? '1' : undefined}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Small delay to allow click on save button
              setTimeout(() => {
                if (!isSaving) cancelEditing();
              }, 150);
            }}
            className={cn('h-8 w-full min-w-[100px]', error && 'border-destructive')}
            disabled={isSaving}
          />
          {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-1 cursor-pointer rounded px-1 py-0.5 -mx-1 hover:bg-muted/50 transition-colors',
        disabled && 'cursor-default hover:bg-transparent',
        className
      )}
      onDoubleClick={startEditing}
    >
      <span className={cn(value == null && 'text-muted-foreground')}>{displayValue}</span>
      {!disabled && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            startEditing();
          }}
        >
          <Pencil className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
