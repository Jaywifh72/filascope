import { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  X,
  Settings,
  Wrench,
  Package,
  CheckCircle2,
  Palette,
  Thermometer,
} from "lucide-react";

// Color family definitions
const COLOR_FAMILIES = [
  { name: "Red", hex: "#DC2626", families: ["Red", "Burgundy", "Maroon", "Crimson"] },
  { name: "Orange", hex: "#EA580C", families: ["Orange", "Coral", "Peach"] },
  { name: "Yellow", hex: "#EAB308", families: ["Yellow", "Gold", "Amber", "Mustard"] },
  { name: "Green", hex: "#16A34A", families: ["Green", "Olive", "Lime", "Forest", "Mint", "Sage"] },
  { name: "Teal", hex: "#0D9488", families: ["Teal", "Turquoise", "Aqua"] },
  { name: "Blue", hex: "#2563EB", families: ["Blue", "Navy", "Sky", "Royal", "Cobalt"] },
  { name: "Purple", hex: "#9333EA", families: ["Purple", "Violet", "Lavender", "Plum"] },
  { name: "Pink", hex: "#EC4899", families: ["Pink", "Magenta", "Rose", "Fuchsia"] },
  { name: "Brown", hex: "#92400E", families: ["Brown", "Tan", "Chocolate", "Coffee", "Mocha"] },
  { name: "Beige", hex: "#D4A574", families: ["Beige", "Cream", "Ivory", "Natural", "Nude"] },
  { name: "Black", hex: "#1A1A1A", families: ["Black", "Charcoal", "Ebony"] },
  { name: "White", hex: "#F5F5F5", families: ["White", "Ivory", "Snow"] },
  { name: "Gray", hex: "#6B7280", families: ["Gray", "Grey", "Silver", "Slate", "Ash"] },
  { name: "Clear", hex: "#E0F2FE", families: ["Clear", "Transparent", "Translucent", "Crystal"] },
  { name: "Multi", hex: "linear-gradient(135deg, #DC2626, #EA580C, #EAB308, #16A34A, #2563EB, #9333EA)", families: ["Rainbow", "Multi", "Multicolor", "Gradient", "Silk"] },
  { name: "Glow", hex: "#84CC16", families: ["Glow", "Phosphorescent", "Luminous"] },
];

interface MoreFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Special Properties
  highSpeed: boolean;
  onHighSpeedChange: (value: boolean) => void;
  matte: boolean;
  onMatteChange: (value: boolean) => void;
  glow: boolean;
  onGlowChange: (value: boolean) => void;
  
  // Physical Properties (Composites)
  carbonFiber: boolean;
  onCarbonFiberChange: (value: boolean) => void;
  glassFiber: boolean;
  onGlassFiberChange: (value: boolean) => void;
  woodFilled: boolean;
  onWoodFilledChange: (value: boolean) => void;
  
  // Spool & Packaging
  plasticSpool: boolean;
  onPlasticSpoolChange: (value: boolean) => void;
  cardboardSpool: boolean;
  onCardboardSpoolChange: (value: boolean) => void;
  singleSpool: boolean;
  onSingleSpoolChange: (value: boolean) => void;
  multiPack: boolean;
  onMultiPackChange: (value: boolean) => void;
  
  // Compatibility
  brassOnly: boolean;
  onBrassOnlyChange: (value: boolean) => void;
  foodContact: boolean;
  onFoodContactChange: (value: boolean) => void;
  amsOnly: boolean;
  onAmsOnlyChange: (value: boolean) => void;
  
  // Color
  selectedColorFamilies: string[];
  onColorFamiliesChange: (families: string[]) => void;
}

const FilterCheckbox = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) => (
  <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
    <Checkbox 
      checked={checked} 
      onCheckedChange={(c) => onChange(c as boolean)}
      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
    />
    <span className="text-sm text-foreground group-hover:text-foreground/90">{label}</span>
  </label>
);

const SectionIcon = ({ 
  icon: Icon, 
  color 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) => (
  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
    <Icon className="h-4 w-4" />
  </div>
);

export function MoreFiltersModal({
  open,
  onOpenChange,
  highSpeed,
  onHighSpeedChange,
  matte,
  onMatteChange,
  glow,
  onGlowChange,
  carbonFiber,
  onCarbonFiberChange,
  glassFiber,
  onGlassFiberChange,
  woodFilled,
  onWoodFilledChange,
  plasticSpool,
  onPlasticSpoolChange,
  cardboardSpool,
  onCardboardSpoolChange,
  singleSpool,
  onSingleSpoolChange,
  multiPack,
  onMultiPackChange,
  brassOnly,
  onBrassOnlyChange,
  foodContact,
  onFoodContactChange,
  amsOnly,
  onAmsOnlyChange,
  selectedColorFamilies,
  onColorFamiliesChange,
}: MoreFiltersModalProps) {
  
  const handleResetAll = () => {
    onHighSpeedChange(false);
    onMatteChange(false);
    onGlowChange(false);
    onCarbonFiberChange(false);
    onGlassFiberChange(false);
    onWoodFilledChange(false);
    onPlasticSpoolChange(false);
    onCardboardSpoolChange(false);
    onSingleSpoolChange(false);
    onMultiPackChange(false);
    onBrassOnlyChange(false);
    onFoodContactChange(false);
    onAmsOnlyChange(false);
    onColorFamiliesChange([]);
  };

  const handleColorToggle = (colorName: string) => {
    if (selectedColorFamilies.includes(colorName)) {
      onColorFamiliesChange(selectedColorFamilies.filter(c => c !== colorName));
    } else {
      onColorFamiliesChange([...selectedColorFamilies, colorName]);
    }
  };

  // Count active filters
  const activeCount = [
    highSpeed, matte, glow,
    carbonFiber, glassFiber, woodFilled,
    plasticSpool, cardboardSpool, singleSpool, multiPack,
    brassOnly, foodContact, amsOnly,
    selectedColorFamilies.length > 0
  ].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[400px] p-0 flex flex-col gap-0 [&>button]:hidden"
      >
        {/* Custom Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Advanced Filters</h2>
              {activeCount > 0 && (
                <p className="text-xs text-muted-foreground">{activeCount} filter{activeCount !== 1 ? 's' : ''} active</p>
              )}
            </div>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <Accordion 
            type="multiple" 
            defaultValue={["special", "physical", "spool", "compatibility", "color"]}
            className="w-full"
          >
            {/* Special Properties */}
            <AccordionItem value="special" className="border-b border-border/50">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={Settings} color="bg-cyan-500/10 text-cyan-500" />
                  <span className="font-medium text-foreground">Special Properties</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-1">
                  <FilterCheckbox 
                    checked={highSpeed} 
                    onChange={onHighSpeedChange} 
                    label="High Speed" 
                  />
                  <FilterCheckbox 
                    checked={matte} 
                    onChange={onMatteChange} 
                    label="Matte Finish" 
                  />
                  <FilterCheckbox 
                    checked={glow} 
                    onChange={onGlowChange} 
                    label="Glow in Dark" 
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Physical Properties */}
            <AccordionItem value="physical" className="border-b border-border/50">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={Wrench} color="bg-orange-500/10 text-orange-500" />
                  <span className="font-medium text-foreground">Physical Properties</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-1">
                  <FilterCheckbox 
                    checked={carbonFiber} 
                    onChange={onCarbonFiberChange} 
                    label="Carbon Fiber" 
                  />
                  <FilterCheckbox 
                    checked={glassFiber} 
                    onChange={onGlassFiberChange} 
                    label="Glass Fiber" 
                  />
                  <FilterCheckbox 
                    checked={woodFilled} 
                    onChange={onWoodFilledChange} 
                    label="Wood Filled" 
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Spool & Packaging */}
            <AccordionItem value="spool" className="border-b border-border/50">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={Package} color="bg-green-500/10 text-green-500" />
                  <span className="font-medium text-foreground">Spool & Packaging</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">Spool Type</p>
                    <div className="grid grid-cols-2 gap-1">
                      <FilterCheckbox 
                        checked={plasticSpool} 
                        onChange={onPlasticSpoolChange} 
                        label="Plastic Spool" 
                      />
                      <FilterCheckbox 
                        checked={cardboardSpool} 
                        onChange={onCardboardSpoolChange} 
                        label="Cardboard Spool" 
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">Pack Size</p>
                    <div className="grid grid-cols-2 gap-1">
                      <FilterCheckbox 
                        checked={singleSpool} 
                        onChange={onSingleSpoolChange} 
                        label="Single Spool" 
                      />
                      <FilterCheckbox 
                        checked={multiPack} 
                        onChange={onMultiPackChange} 
                        label="Multi-Pack" 
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Compatibility */}
            <AccordionItem value="compatibility" className="border-b border-border/50">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={CheckCircle2} color="bg-blue-500/10 text-blue-500" />
                  <span className="font-medium text-foreground">Compatibility</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="grid grid-cols-1 gap-1">
                  <FilterCheckbox 
                    checked={brassOnly} 
                    onChange={onBrassOnlyChange} 
                    label="Brass Safe (Non-Abrasive)" 
                  />
                  <FilterCheckbox 
                    checked={foodContact} 
                    onChange={onFoodContactChange} 
                    label="Food Contact Safe" 
                  />
                  <FilterCheckbox 
                    checked={amsOnly} 
                    onChange={onAmsOnlyChange} 
                    label="AMS/MMU Compatible" 
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Color Selection */}
            <AccordionItem value="color" className="border-b border-border/50">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <SectionIcon icon={Palette} color="bg-purple-500/10 text-purple-500" />
                  <span className="font-medium text-foreground">Color Selection</span>
                  {selectedColorFamilies.length > 0 && (
                    <span className="ml-auto mr-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {selectedColorFamilies.length}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="grid grid-cols-8 gap-2">
                  {COLOR_FAMILIES.map((color) => {
                    const isSelected = selectedColorFamilies.includes(color.name);
                    const isGradient = color.hex.startsWith('linear-gradient');
                    return (
                      <Tooltip key={color.name}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleColorToggle(color.name)}
                            className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                              isSelected 
                                ? 'border-primary ring-2 ring-primary/50 scale-105' 
                                : 'border-border/50 hover:border-muted-foreground'
                            }`}
                            style={{
                              background: isGradient ? color.hex : color.hex,
                              ...(color.name === 'White' ? { border: '2px solid hsl(var(--border))' } : {}),
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {color.name}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
                {selectedColorFamilies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedColorFamilies.map((colorName) => {
                      const color = COLOR_FAMILIES.find(c => c.name === colorName);
                      return (
                        <span 
                          key={colorName}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs"
                        >
                          <span 
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ background: color?.hex || '#888' }}
                          />
                          {colorName}
                          <button 
                            onClick={() => handleColorToggle(colorName)}
                            className="ml-0.5 hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-border px-6 py-4 bg-card flex items-center justify-between shrink-0">
          <Button
            variant="ghost"
            onClick={handleResetAll}
            className="text-muted-foreground hover:text-foreground"
          >
            Reset All
          </Button>
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-primary hover:bg-primary/90 px-6"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
