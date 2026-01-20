import { Package, AlertTriangle, XCircle } from "lucide-react";

interface InventoryStatusProps {
  status?: 'available' | 'low-stock' | 'discontinued' | 'out-of-stock';
  isDiscontinued?: boolean;
}

export function InventoryStatus({ status = 'available', isDiscontinued }: InventoryStatusProps) {
  if (isDiscontinued) {
    return (
      <div className="flex items-center gap-3 font-mono text-sm">
        <XCircle className="h-4 w-4 text-destructive" />
        <span className="text-muted-foreground uppercase tracking-wider">INVENTORY:</span>
        <span className="text-destructive font-bold uppercase">DISCONTINUED</span>
      </div>
    );
  }

  const statusConfig = {
    'available': {
      icon: <Package className="h-4 w-4 text-green-500" />,
      text: 'AVAILABLE',
      subtext: '// READY FOR DEPLOYMENT',
      textClass: 'text-green-500'
    },
    'low-stock': {
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      text: 'LOW_STOCK',
      subtext: '// LIMITED UNITS',
      textClass: 'text-amber-500'
    },
    'out-of-stock': {
      icon: <XCircle className="h-4 w-4 text-destructive" />,
      text: 'OUT_OF_STOCK',
      subtext: '// BACKORDER QUEUE',
      textClass: 'text-destructive'
    },
    'discontinued': {
      icon: <XCircle className="h-4 w-4 text-muted-foreground" />,
      text: 'DISCONTINUED',
      subtext: '// END OF LIFE',
      textClass: 'text-muted-foreground'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-3 font-mono text-sm">
      {config.icon}
      <span className="text-muted-foreground uppercase tracking-wider">INVENTORY:</span>
      <span className={`font-bold uppercase ${config.textClass}`}>{config.text}</span>
      <span className="text-muted-foreground/50 text-xs">{config.subtext}</span>
    </div>
  );
}
