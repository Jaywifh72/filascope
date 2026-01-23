import React from 'react';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface ReposFilterSidebarProps {
  priceFilter: string;
  bestForFilter: string;
  fileFormatFilter: string;
  onPriceChange: (value: string) => void;
  onBestForChange: (value: string) => void;
  onFileFormatChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const ReposFilterSidebar: React.FC<ReposFilterSidebarProps> = ({
  priceFilter,
  bestForFilter,
  fileFormatFilter,
  onPriceChange,
  onBestForChange,
  onFileFormatChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-20 space-y-6">
        <div className="p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 text-foreground font-semibold">
            <Filter className="w-4 h-4 text-primary" />
            Filter Platforms
          </div>

          <div className="space-y-4">
            {/* Price Filter */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Price
              </label>
              <Select value={priceFilter} onValueChange={onPriceChange}>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue placeholder="All Pricing" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="all">All Pricing</SelectItem>
                  <SelectItem value="free">Free Only</SelectItem>
                  <SelectItem value="paid">Paid Options</SelectItem>
                  <SelectItem value="hybrid">Free & Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Best For Filter */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Best For
              </label>
              <Select value={bestForFilter} onValueChange={onBestForChange}>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="beginners">Beginners</SelectItem>
                  <SelectItem value="hobbyists">Hobbyists</SelectItem>
                  <SelectItem value="designers">Designers</SelectItem>
                  <SelectItem value="engineers">Engineers</SelectItem>
                  <SelectItem value="sellers">Sellers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Format Filter */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                File Format
              </label>
              <Select value={fileFormatFilter} onValueChange={onFileFormatChange}>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue placeholder="All Formats" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="stl">STL</SelectItem>
                  <SelectItem value="3mf">3MF</SelectItem>
                  <SelectItem value="obj">OBJ</SelectItem>
                  <SelectItem value="gcode">G-code</SelectItem>
                  <SelectItem value="cad">CAD/STEP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ReposFilterSidebar;
