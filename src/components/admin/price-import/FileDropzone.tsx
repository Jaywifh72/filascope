import { useRef, useState, useCallback } from 'react';
import { Upload, FileJson, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  hasFile?: boolean;
  onClear?: () => void;
}

export function FileDropzone({ 
  onFileSelect, 
  disabled = false,
  hasFile = false,
  onClear,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    if (!file.name.endsWith('.json')) {
      setError('Only .json files are accepted');
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File size must be less than 50MB');
      return;
    }

    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [disabled, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFile]);

  if (hasFile) {
    return (
      <div className="relative">
        <div className="flex items-center justify-center gap-2 p-4 border border-dashed rounded-lg border-primary/50 bg-primary/5">
          <FileJson className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">File loaded</span>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={disabled}
              className="ml-2"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed',
        error && 'border-destructive'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      <div className={cn(
        'p-4 rounded-full transition-colors',
        isDragging ? 'bg-primary/10' : 'bg-muted'
      )}>
        <Upload className={cn(
          'w-8 h-8',
          isDragging ? 'text-primary' : 'text-muted-foreground'
        )} />
      </div>
      
      <div className="text-center">
        <p className="font-medium">
          {isDragging ? 'Drop file here' : 'Drag & drop a JSON file here'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Accepts .json files only (max 50MB)
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
