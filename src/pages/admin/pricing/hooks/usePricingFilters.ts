import { useState, useMemo } from 'react';
import type { ProductType, ProductGroup } from '../types';
import { PRODUCT_TYPE_CONFIGS } from '../types';

export function usePricingFilters(productGroups: ProductGroup[], productType: ProductType) {
  const config = PRODUCT_TYPE_CONFIGS[productType];
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return productGroups.filter(g => {
      if (vendorFilter !== 'all' && g.brand !== vendorFilter) return false;
      if (statusFilter !== 'all') {
        const hasMatch = g.stores.some(s => {
          if (statusFilter === 'stale') return s.linkStatus === 'stale' || s.linkStatus === 'unknown';
          return s.linkStatus === statusFilter;
        });
        if (!hasMatch) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const matchesName = g.cleanName?.toLowerCase().includes(q);
        const matchesBrand = g.brand?.toLowerCase().includes(q);
        const matchesSubtype = g.productSubtype?.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesSubtype) return false;
      }
      return true;
    });
  }, [productGroups, vendorFilter, statusFilter, search]);

  return {
    search,
    setSearch,
    vendorFilter,
    setVendorFilter,
    statusFilter,
    setStatusFilter,
    filtered,
    searchPlaceholder: config.searchPlaceholder,
  };
}
