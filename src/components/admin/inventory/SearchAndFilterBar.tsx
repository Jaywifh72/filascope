import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Brand {
  brand_name: string;
  brand_slug: string;
}

interface SearchAndFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedBrand: string;
  onBrandChange: (value: string) => void;
  brands: Brand[];
}

export function SearchAndFilterBar({
  searchTerm,
  onSearchChange,
  selectedBrand,
  onBrandChange,
  brands,
}: SearchAndFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search name, vendor, URL..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={selectedBrand || 'all'} onValueChange={(val) => onBrandChange(val === 'all' ? '' : val)}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="All Brands" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Brands</SelectItem>
          {brands.map((brand) => (
            <SelectItem key={brand.brand_slug} value={brand.brand_slug}>
              {brand.brand_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
