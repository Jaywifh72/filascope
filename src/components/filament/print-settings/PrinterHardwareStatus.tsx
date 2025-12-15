import { Check, X, AlertTriangle, Lightbulb, Scan, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { checkHardwareCompatibility } from "@/lib/printerStockHardware";
import { cn } from "@/lib/utils";

interface PrinterHardwareStatusProps {
  printerModel: string;
  filamentMaterial: string;
  isAbrasive: boolean;
  requiredNozzleTemp: number;
}

export function PrinterHardwareStatus({
  printerModel,
  filamentMaterial,
  isAbrasive,
  requiredNozzleTemp,
}: PrinterHardwareStatusProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const status = checkHardwareCompatibility(
    printerModel,
    filamentMaterial,
    isAbrasive,
    requiredNozzleTemp
  );

  const StatusIcon = ({ compatible }: { compatible: boolean }) => {
    if (compatible) {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    return <X className="w-4 h-4 text-red-500" />;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <Scan className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Your Printer: {printerModel}</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pt-3">
        <div className="space-y-3 p-3 bg-background/50 border border-border rounded-lg">
          <div className="text-xs text-muted-foreground mb-3">
            Currently installed (based on stock configuration):
          </div>
          
          {/* Hotend Status */}
          <div className="flex items-start gap-3 pb-3 border-b border-border/50">
            <StatusIcon compatible={status.hotend.compatible} />
            <div className="flex-1">
              <div className="text-sm font-medium">Hotend: {status.hotend.installed}</div>
              <div className={cn(
                "text-xs mt-0.5",
                status.hotend.compatible ? "text-green-400" : "text-red-400"
              )}>
                {status.hotend.compatible ? '✓' : '✗'} {status.hotend.reason}
              </div>
              {status.hotend.upgradeNeeded && (
                <div className="text-xs text-amber-400 mt-1">
                  Upgrade to: {status.hotend.upgradeNeeded}
                </div>
              )}
            </div>
          </div>
          
          {/* Build Plate Status */}
          <div className="flex items-start gap-3 pb-3 border-b border-border/50">
            <StatusIcon compatible={status.buildPlate.compatible} />
            <div className="flex-1">
              <div className="text-sm font-medium">Build Plate: {status.buildPlate.installed}</div>
              <div className={cn(
                "text-xs mt-0.5",
                status.buildPlate.compatible ? "text-green-400" : "text-red-400"
              )}>
                {status.buildPlate.compatible ? '✓' : '✗'} {status.buildPlate.reason}
              </div>
            </div>
          </div>
          
          {/* AMS Status */}
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 flex items-center justify-center">
              {status.ams.compatible ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">
                Multi-material: {status.ams.installed ? 'Installed' : 'Not installed'}
              </div>
              <div className={cn(
                "text-xs mt-0.5",
                status.ams.compatible ? "text-muted-foreground" : "text-muted-foreground/70"
              )}>
                {status.ams.reason}
              </div>
            </div>
          </div>
          
          {/* Overall Status */}
          <div className={cn(
            "rounded-lg p-3 mt-3",
            status.overallCompatible 
              ? "bg-green-500/10 border border-green-500/20" 
              : "bg-red-500/10 border border-red-500/20"
          )}>
            <div className="flex items-center gap-2">
              {status.overallCompatible ? (
                <>
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-400">
                    All hardware compatible - ready to print!
                  </span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-400">
                    Hardware upgrade needed before printing
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Future suggestion */}
          {status.futureSuggestion && status.overallCompatible && (
            <div className="flex items-start gap-2 pt-3 border-t border-border/50">
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-amber-400">Future-proofing tip:</span>{' '}
                {status.futureSuggestion}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
