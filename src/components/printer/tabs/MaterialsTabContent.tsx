import React, { useState } from 'react';
import { Palette, Layers, Package, Cpu, ExternalLink, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import SpecsDrawer, { SpecTable, SpecRow, ContentSection } from '../SpecsDrawer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AccessoryCompatibilityBadge } from '@/components/AccessoryCompatibilityBadge';
import { AccessoryPriceChart } from '@/components/AccessoryPriceChart';
import {
  checkHotendPrinterCompatibility,
  checkBuildPlatePrinterCompatibility,
  checkAmsPrinterCompatibility,
} from '@/lib/accessoryCompatibility';
import { generateMaterialsFeaturesPreview, generateAccessoriesPreview } from '@/lib/specsPreviewGenerator';

interface MaterialsTabContentProps {
  printer: any;
  accessories: any[];
}

export function MaterialsTabContent({ printer, accessories }: MaterialsTabContentProps) {
  const [expandedDrawers, setExpandedDrawers] = useState<Set<string>>(new Set(['materials']));

  const toggleDrawer = (id: string) => {
    setExpandedDrawers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Multi-material systems for compatibility check
  const allSystems = [
    { name: 'Bambu Lab AMS', key: 'ams' },
    { name: 'Bambu Lab AMS Lite', key: 'ams lite' },
    { name: 'Prusa MMU2S', key: 'mmu2s' },
    { name: 'Prusa MMU3', key: 'mmu3' },
    { name: 'E3D ToolChanger', key: 'toolchanger' },
    { name: 'Mosaic Palette', key: 'palette' },
    { name: 'ERCF (Enraged Rabbit)', key: 'ercf' },
    { name: '3DChameleon', key: '3dchameleon' },
  ];

  const compatibleSystems = printer.compatible_multi_material_systems
    ? printer.compatible_multi_material_systems.toLowerCase().split(/[,;|]/).map((s: string) => s.trim())
    : [];

  const isSystemCompatible = (key: string) => {
    return compatibleSystems.some(
      (cs: string) => cs.includes(key.toLowerCase()) || key.toLowerCase().includes(cs)
    );
  };

  // Filter accessories by type
  const hotends = accessories.filter((a) => a.accessory_type === 'nozzle' || a.accessory_type === 'hotend');
  const buildPlates = accessories.filter((a) => a.accessory_type === 'build_plate');
  const amsMmu = accessories.filter((a) => a.accessory_type === 'ams_mmu');

  return (
    <div className="space-y-3">
      {/* Materials & Features */}
      <SpecsDrawer
        id="materials"
        icon={<Palette className="w-5 h-5" />}
        title="Materials & Features"
        preview={generateMaterialsFeaturesPreview(printer)}
        isExpanded={expandedDrawers.has('materials')}
        onToggle={() => toggleDrawer('materials')}
      >
        <ContentSection title="Material Support">
          <SpecTable>
            <SpecRow label="Official Supported Materials" value={printer.official_supported_materials} />
            <SpecRow label="Recommended Materials" value={printer.recommended_materials} />
            <SpecRow label="Abrasive Materials Supported" value={printer.abrasive_materials_supported} />
            <SpecRow label="Max Material Temp" value={printer.max_recommended_material_temp_c} unit="°C" />
          </SpecTable>
        </ContentSection>

        <ContentSection title="Multi-Material System Compatibility">
          <div className="space-y-2 mb-4">
            {allSystems.map((system) => {
              const isCompatible = isSystemCompatible(system.key);
              return (
                <div key={system.key} className="flex items-center justify-between py-2.5 px-3 border border-border/30 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-muted-foreground">{system.name}</span>
                  <div className="flex items-center gap-2">
                    {isCompatible ? (
                      <span className="text-xs text-green-500 font-medium px-2 py-0.5 rounded-full border border-green-500/30 bg-green-500/10">
                        Compatible
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 font-medium px-2 py-0.5 rounded-full border border-border/40 bg-muted/30">
                        Incompatible
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <SpecTable>
            <SpecRow label="Multi-Material Supported" value={printer.multi_material_supported} />
            <SpecRow label="Native Multi-Material System" value={printer.native_multi_material_system} />
            <SpecRow label="Max Spools" value={printer.multi_material_max_spools} />
            <SpecRow label="Spool Chamber Max Temp" value={printer.multi_material_spool_chamber_max_temp_c} unit="°C" />
            <SpecRow label="Drying Capability" value={printer.multi_material_drying_capability} />
          </SpecTable>
        </ContentSection>
      </SpecsDrawer>

      {/* Accessories */}
      <SpecsDrawer
        id="accessories"
        icon={<Package className="w-5 h-5" />}
        title="Compatible Accessories"
        preview={generateAccessoriesPreview(accessories)}
        isExpanded={expandedDrawers.has('accessories')}
        onToggle={() => toggleDrawer('accessories')}
      >
        {!accessories || accessories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No accessories found. Accessories are automatically discovered when the printer is scraped.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hotends Section */}
            {hotends.length > 0 && (
              <ContentSection title={`Hotends (${hotends.length})`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hotends.map((acc) => {
                    const specs = acc.specs as any;
                    const compatibility = checkHotendPrinterCompatibility(acc, printer);
                    return (
                      <Card key={acc.id} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-[360px]">
                        <CardContent className="p-0 flex flex-col h-full">
                          <div className="relative h-28 flex-shrink-0">
                            {acc.image_url ? (
                              <div className="h-full bg-muted/30 flex items-center justify-center p-3">
                                <img
                                  src={acc.image_url}
                                  alt={acc.name}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="h-full bg-muted/30 flex items-center justify-center">
                                <Cpu className="h-12 w-12 text-muted-foreground/30" />
                              </div>
                            )}
                            {acc.brand && (
                              <Badge className="absolute top-2 right-2 text-xs" variant="secondary">
                                {acc.brand}
                              </Badge>
                            )}
                          </div>
                          <div className="p-3 flex flex-col flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h5 className="font-semibold text-sm line-clamp-2">{acc.name}</h5>
                              <AccessoryCompatibilityBadge compatibility={compatibility} compact />
                            </div>
                            <div className="space-y-1 text-xs flex-1">
                              {specs?.diameter_mm && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Diameter:</span>
                                  <span className="font-medium">{specs.diameter_mm}mm</span>
                                </div>
                              )}
                              {specs?.material && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Material:</span>
                                  <span className="font-medium capitalize">{specs.material}</span>
                                </div>
                              )}
                              {specs?.max_temp_c && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Max Temp:</span>
                                  <span className="font-medium">{specs.max_temp_c}°C</span>
                                </div>
                              )}
                              {acc.price && (
                                <div className="flex justify-between pt-1 border-t mt-1">
                                  <span className="text-muted-foreground">Price:</span>
                                  <span className="font-bold text-primary">
                                    ${acc.price} {acc.currency || 'USD'}
                                  </span>
                                </div>
                              )}
                            </div>
                            {acc.product_url && (
                              <a href={acc.product_url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-2">
                                <Button size="sm" variant="outline" className="w-full gap-2">
                                  <ExternalLink className="h-3 w-3" />
                                  View Product
                                </Button>
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ContentSection>
            )}

            {/* Build Plates Section */}
            {buildPlates.length > 0 && (
              <ContentSection title={`Build Plates (${buildPlates.length})`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buildPlates.map((acc) => {
                    const specs = acc.specs as any;
                    const compatibility = checkBuildPlatePrinterCompatibility(acc, printer);
                    return (
                      <Card key={acc.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-sm capitalize">{acc.name}</h5>
                            <AccessoryCompatibilityBadge compatibility={compatibility} compact />
                          </div>
                          <div className="space-y-1 text-xs">
                            {specs?.surface && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Surface:</span>
                                <span className="font-medium">{specs.surface}</span>
                              </div>
                            )}
                            {specs?.magnetic !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Magnetic:</span>
                                <span className="font-medium">{specs.magnetic ? 'Yes' : 'No'}</span>
                              </div>
                            )}
                            {acc.price && (
                              <div className="flex justify-between pt-2 border-t">
                                <span className="text-muted-foreground">Price:</span>
                                <span className="font-bold text-primary">
                                  ${acc.price} {acc.currency || 'USD'}
                                </span>
                              </div>
                            )}
                            {acc.price_change_percent !== null && acc.price_change_percent !== undefined && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Change:</span>
                                <span
                                  className={`flex items-center gap-1 font-semibold ${
                                    acc.price_change_percent > 0
                                      ? 'text-red-500'
                                      : acc.price_change_percent < 0
                                      ? 'text-green-500'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {acc.price_change_percent > 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : acc.price_change_percent < 0 ? (
                                    <TrendingDown className="h-3 w-3" />
                                  ) : null}
                                  {acc.price_change_percent > 0 ? '+' : ''}
                                  {acc.price_change_percent.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                          <AccessoryPriceChart accessoryId={acc.id} currentPrice={acc.price} currency={acc.currency || 'USD'} />
                          {acc.product_url && (
                            <a href={acc.product_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="w-full mt-2 gap-2">
                                <ExternalLink className="h-3 w-3" />
                                View Product
                              </Button>
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ContentSection>
            )}

            {/* AMS/MMU Section */}
            {amsMmu.length > 0 && (
              <ContentSection title={`Multi-Material Systems (${amsMmu.length})`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {amsMmu.map((acc) => {
                    const specs = (acc.specs || {}) as any;
                    const compatibility = checkAmsPrinterCompatibility(acc, printer);
                    return (
                      <Card key={acc.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold capitalize">{acc.name || 'Unknown'}</h5>
                            <AccessoryCompatibilityBadge compatibility={compatibility} compact />
                          </div>
                          <div className="space-y-2 text-sm">
                            {specs.spool_capacity != null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Spool Capacity:</span>
                                <span className="font-medium">{specs.spool_capacity} spools</span>
                              </div>
                            )}
                            {specs.heated !== undefined && specs.heated !== null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Heated:</span>
                                <span className="font-medium">{specs.heated ? 'Yes' : 'No'}</span>
                              </div>
                            )}
                            {specs.max_temp_c != null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Max Temperature:</span>
                                <span className="font-medium">{specs.max_temp_c}°C</span>
                              </div>
                            )}
                            {specs.power_requirements && (
                              <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Power:</span>
                                <span className="font-medium text-xs bg-muted/50 p-2 rounded">{specs.power_requirements}</span>
                              </div>
                            )}
                            {specs.filament_drying !== undefined && specs.filament_drying !== null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Filament Drying:</span>
                                <span className="font-medium">{specs.filament_drying ? 'Yes' : 'No'}</span>
                              </div>
                            )}
                            {acc.price && (
                              <div className="flex justify-between pt-2 border-t">
                                <span className="text-muted-foreground">Price:</span>
                                <span className="font-bold text-primary">
                                  ${acc.price} {acc.currency || 'USD'}
                                </span>
                              </div>
                            )}
                            {acc.price_change_percent !== null && acc.price_change_percent !== undefined && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Change:</span>
                                <span
                                  className={`flex items-center gap-1 font-semibold ${
                                    acc.price_change_percent > 0
                                      ? 'text-red-500'
                                      : acc.price_change_percent < 0
                                      ? 'text-green-500'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {acc.price_change_percent > 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : acc.price_change_percent < 0 ? (
                                    <TrendingDown className="h-3 w-3" />
                                  ) : null}
                                  {acc.price_change_percent > 0 ? '+' : ''}
                                  {acc.price_change_percent.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                          <AccessoryPriceChart accessoryId={acc.id} currentPrice={acc.price} currency={acc.currency || 'USD'} />
                          {acc.product_url && (
                            <a href={acc.product_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="w-full mt-2 gap-2">
                                <ExternalLink className="h-3 w-3" />
                                View Product
                              </Button>
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ContentSection>
            )}
          </div>
        )}
      </SpecsDrawer>
    </div>
  );
}
