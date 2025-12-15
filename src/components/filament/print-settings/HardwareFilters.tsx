import { useState } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { HARDWARE_FILTER_OPTIONS, type HardwareFilterOptions } from "@/lib/hardwareRecommendations";

export interface FilterState {
  search: string;
  materials: string[];
  priceRange: { min: number; max: number } | null;
  features: string[];
  sort: string;
}

interface HardwareFiltersProps {
  accessoryType: 'hotend' | 'build_plate' | 'ams_mmu';
  filterState: FilterState;
  onFilterChange: (state: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export function HardwareFilters({
  accessoryType,
  filterState,
  onFilterChange,
  totalCount,
  filteredCount,
}: HardwareFiltersProps) {
  const options = HARDWARE_FILTER_OPTIONS[accessoryType] || HARDWARE_FILTER_OPTIONS.hotend;
  
  const activeFiltersCount = 
    filterState.materials.length + 
    filterState.features.length + 
    (filterState.priceRange ? 1 : 0);

  const clearAllFilters = () => {
    onFilterChange({
      search: "",
      materials: [],
      priceRange: null,
      features: [],
      sort: "recommended",
    });
  };

  const toggleMaterial = (material: string) => {
    const materials = filterState.materials.includes(material)
      ? filterState.materials.filter(m => m !== material)
      : [...filterState.materials, material];
    onFilterChange({ ...filterState, materials });
  };

  const toggleFeature = (feature: string) => {
    const features = filterState.features.includes(feature)
      ? filterState.features.filter(f => f !== feature)
      : [...filterState.features, feature];
    onFilterChange({ ...filterState, features });
  };

  const setPriceRange = (range: { min: number; max: number } | null) => {
    onFilterChange({ ...filterState, priceRange: range });
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, brand, features..."
          value={filterState.search}
          onChange={(e) => onFilterChange({ ...filterState, search: e.target.value })}
          className="pl-10 bg-muted/50"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Material Filter */}
        {options.materials.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                Material
                {filterState.materials.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {filterState.materials.length}
                  </Badge>
                )}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Filter by material</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {options.materials.map((material) => (
                <DropdownMenuCheckboxItem
                  key={material}
                  checked={filterState.materials.includes(material)}
                  onCheckedChange={() => toggleMaterial(material)}
                >
                  {material}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Price Range Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              Price
              {filterState.priceRange && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">1</Badge>
              )}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Filter by price</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {options.priceRanges.map((range) => (
              <DropdownMenuCheckboxItem
                key={range.label}
                checked={
                  filterState.priceRange?.min === range.min && 
                  filterState.priceRange?.max === range.max
                }
                onCheckedChange={(checked) => 
                  setPriceRange(checked ? { min: range.min, max: range.max } : null)
                }
              >
                {range.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Features Filter */}
        {options.features.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                Features
                {filterState.features.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {filterState.features.length}
                  </Badge>
                )}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Filter by feature</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {options.features.map((feature) => (
                <DropdownMenuCheckboxItem
                  key={feature.id}
                  checked={filterState.features.includes(feature.id)}
                  onCheckedChange={() => toggleFeature(feature.id)}
                >
                  {feature.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              Sort: {options.sortOptions.find(s => s.value === filterState.sort)?.label || 'Recommended'}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {options.sortOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filterState.sort === option.value}
                onCheckedChange={() => onFilterChange({ ...filterState, sort: option.value })}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear All */}
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-muted-foreground"
            onClick={clearAllFilters}
          >
            <X className="w-3 h-3 mr-1" />
            Clear all
          </Button>
        )}

        {/* Results count */}
        <span className="text-xs text-muted-foreground ml-auto">
          Showing {filteredCount} of {totalCount}
        </span>
      </div>

      {/* Active Filter Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filterState.materials.map((material) => (
            <Badge
              key={material}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20"
              onClick={() => toggleMaterial(material)}
            >
              {material}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
          {filterState.priceRange && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20"
              onClick={() => setPriceRange(null)}
            >
              {options.priceRanges.find(
                r => r.min === filterState.priceRange?.min && r.max === filterState.priceRange?.max
              )?.label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {filterState.features.map((featureId) => (
            <Badge
              key={featureId}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20"
              onClick={() => toggleFeature(featureId)}
            >
              {options.features.find(f => f.id === featureId)?.label}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
