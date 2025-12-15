import { AlertTriangle, ArrowRight, Wrench, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkUpgradeRequirements, type UpgradeRequirement } from "@/lib/hardwareRecommendations";
import type { Database } from "@/integrations/supabase/types";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];
type Printer = Database["public"]["Tables"]["printers"]["Row"];

interface CompatibilityWarningBannerProps {
  printer: Printer | null;
  filament: Filament;
  onShopUpgrade?: (upgradeType: string) => void;
}

export function CompatibilityWarningBanner({
  printer,
  filament,
  onShopUpgrade,
}: CompatibilityWarningBannerProps) {
  const upgrades = checkUpgradeRequirements(printer, filament);
  
  const requiredUpgrades = upgrades.filter(u => u.urgency === 'required');
  const recommendedUpgrades = upgrades.filter(u => u.urgency === 'recommended');
  
  if (upgrades.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Required upgrades - Red banner */}
      {requiredUpgrades.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-medium text-red-400">Upgrade Required</h4>
                <p className="text-sm text-red-300/80 mt-1">
                  Your current hardware cannot print this material safely.
                </p>
              </div>
              
              {requiredUpgrades.map((upgrade, i) => (
                <div key={i} className="bg-background/30 rounded-lg p-3">
                  <div className="text-sm text-foreground mb-2">
                    {upgrade.reason}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>Current: {upgrade.currentLimit}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-red-400">Required: {upgrade.required}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={() => onShopUpgrade?.(upgrade.upgradeType)}
                  >
                    Shop {upgrade.upgradeType === 'hotend' ? 'Hotends' : 'Upgrades'}
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              {/* Installation options */}
              <div className="text-xs text-muted-foreground pt-2 border-t border-red-500/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wrench className="w-3 h-3" />
                  Installation options:
                </div>
                <ul className="space-y-0.5 ml-4.5">
                  <li>• DIY install (30 min) - Free with purchase</li>
                  <li>• Professional install - Contact local makerspace (~$50)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended upgrades - Amber banner */}
      {recommendedUpgrades.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-400">Upgrade Recommended</h4>
              {recommendedUpgrades.map((upgrade, i) => (
                <div key={i} className="mt-2">
                  <p className="text-sm text-amber-300/80">
                    {upgrade.reason}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      onClick={() => onShopUpgrade?.(upgrade.upgradeType)}
                    >
                      View Options
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
