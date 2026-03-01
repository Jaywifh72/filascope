import { useLocation, Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { HUEFORGE_TOOLS } from './HueForgeToolsData';
import { cn } from '@/lib/utils';

interface HueForgeToolsNavProps {
  onExportCsv?: () => void;
}

export function HueForgeToolsNav({ onExportCsv }: HueForgeToolsNavProps) {
  const { pathname } = useLocation();

  const handleExport = () => {
    onExportCsv?.();
    toast.success('✓ CSV exported');
  };

  return (
    <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="relative max-w-7xl mx-auto">
        <nav
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
          aria-label="HueForge tools"
        >
          {HUEFORGE_TOOLS.map((tool) => {
            const isActive = pathname === tool.href;
            const Icon = tool.icon;
            return (
              <Link
                key={tool.key}
                to={tool.href}
                className={cn(
                  'snap-start px-4 py-3 text-sm whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors shrink-0',
                  isActive
                    ? 'border-cyan-500 text-cyan-400 font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden min-[480px]:inline">{tool.shortName}</span>
              </Link>
            );
          })}

          {/* Export CSV action tab — only shown when callback provided */}
          {onExportCsv && (
            <button
              onClick={handleExport}
              className="snap-start px-4 py-3 text-sm whitespace-nowrap flex items-center gap-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              <span className="hidden min-[480px]:inline">Export CSV</span>
            </button>
          )}
        </nav>

        {/* Right-edge fade gradient to hint at scrollability */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/80 to-transparent pointer-events-none min-[900px]:hidden" />
      </div>
    </div>
  );
}
