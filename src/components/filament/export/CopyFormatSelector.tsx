import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Copy, FileText, Braces, Hash, Code, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { formatSettings, FORMAT_INFO, type PrintSettings, type ExportFormat } from '@/lib/settingsFormatters';

interface CopyFormatSelectorProps {
  settings: PrintSettings;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  plain: <FileText className="h-4 w-4" />,
  json: <Braces className="h-4 w-4" />,
  markdown: <Hash className="h-4 w-4" />,
  html: <Code className="h-4 w-4" />,
};

export function CopyFormatSelector({ settings, variant = 'outline', size = 'sm' }: CopyFormatSelectorProps) {
  const [lastFormat, setLastFormat] = useState<ExportFormat>(() => {
    return (localStorage.getItem('filascope_copy_format') as ExportFormat) || 'plain';
  });
  const [justCopied, setJustCopied] = useState(false);

  const handleCopy = async (format: ExportFormat) => {
    const formatted = formatSettings(settings, format);
    
    try {
      await navigator.clipboard.writeText(formatted);
      setLastFormat(format);
      localStorage.setItem('filascope_copy_format', format);
      setJustCopied(true);
      toast.success(`Copied as ${FORMAT_INFO[format].label}`);
      
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleQuickCopy = async () => {
    await handleCopy(lastFormat);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleQuickCopy}
        className="gap-2"
      >
        {justCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Copy</span>
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" className="h-8 w-6 px-0" aria-label="Select copy format">
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {(Object.keys(FORMAT_INFO) as ExportFormat[]).map((format) => (
            <DropdownMenuItem
              key={format}
              onClick={() => handleCopy(format)}
              className="flex items-center gap-3"
            >
              {FORMAT_ICONS[format]}
              <div className="flex flex-col">
                <span className="font-medium">{FORMAT_INFO[format].label}</span>
                <span className="text-xs text-muted-foreground">
                  {FORMAT_INFO[format].description}
                </span>
              </div>
              {format === lastFormat && (
                <Check className="ml-auto h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
