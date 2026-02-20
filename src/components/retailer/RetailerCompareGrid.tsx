import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpDown, Check, X, Truck, Clock, RotateCcw, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Retailer } from "@/hooks/useRetailerData";
import { InventoryBadge } from "./InventoryBadge";
import { ShippingEstimate, formatDeliveryRange } from "@/lib/shippingZones";
import { useUserShipping } from "@/hooks/useUserShipping";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { PrimeBadge } from "./MembershipBenefits";

interface RetailerWithData {
  retailer: Retailer;
  productUrl?: string;
  price?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder' | 'unknown';
  stockQuantity?: number | null;
  shippingEstimate?: ShippingEstimate;
}

interface RetailerCompareGridProps {
  retailers: RetailerWithData[];
  className?: string;
}

type SortKey = 'price' | 'shipping' | 'total' | 'speed' | 'rating';

export function RetailerCompareGrid({ retailers, className }: RetailerCompareGridProps) {
  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [sortAsc, setSortAsc] = useState(true);
  const { preferences } = useUserShipping();
  const { getAffiliateUrl, getAmazonUrl } = useAffiliateLinks();

  const sortedRetailers = useMemo(() => {
    return [...retailers].sort((a, b) => {
      let aVal = 0, bVal = 0;
      
      switch (sortKey) {
        case 'price':
          aVal = a.price ?? Infinity;
          bVal = b.price ?? Infinity;
          break;
        case 'shipping':
          aVal = a.shippingEstimate?.cost ?? Infinity;
          bVal = b.shippingEstimate?.cost ?? Infinity;
          break;
        case 'total':
          aVal = (a.price ?? 0) + (a.shippingEstimate?.cost ?? 0);
          bVal = (b.price ?? 0) + (b.shippingEstimate?.cost ?? 0);
          break;
        case 'speed':
          aVal = a.shippingEstimate?.minDays ?? Infinity;
          bVal = b.shippingEstimate?.minDays ?? Infinity;
          break;
        case 'rating':
          aVal = a.retailer.trust_score ?? 0;
          bVal = b.retailer.trust_score ?? 0;
          break;
      }
      
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [retailers, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const SortButton = ({ column, label }: { column: SortKey; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(column)}
      className={cn(
        "h-8 px-2 text-xs font-medium",
        sortKey === column && "text-primary"
      )}
    >
      {label}
      <ArrowUpDown className={cn(
        "ml-1 h-3 w-3",
        sortKey === column && (sortAsc ? "rotate-180" : "")
      )} />
    </Button>
  );

  if (retailers.length === 0) {
    return null;
  }

  return (
    <Card className={cn("bg-card/50 border-border/30", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Compare Retailers</span>
          <div className="flex gap-1">
            <SortButton column="total" label="Total" />
            <SortButton column="price" label="Price" />
            <SortButton column="speed" label="Speed" />
            <SortButton column="rating" label="Rating" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="w-[180px]">Retailer</TableHead>
                <TableHead className="text-center">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Shipping</TableHead>
                <TableHead className="text-center">Arrives</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead className="text-center">Returns</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRetailers.map(({ retailer, productUrl, price, stockStatus, stockQuantity, shippingEstimate }, index) => {
                const isAmazon = retailer.slug === 'amazon';
                const isPrimeMember = preferences.amazonPrimeMember;
                const totalCost = (price ?? 0) + (shippingEstimate?.isFree ? 0 : (shippingEstimate?.cost ?? 0));
                const isBestValue = index === 0 && sortKey === 'total';
                
                const affiliateUrl = productUrl
                  ? isAmazon ? getAmazonUrl(productUrl) : getAffiliateUrl(productUrl, retailer.name)
                  : retailer.website_url;

                return (
                  <TableRow 
                    key={retailer.id} 
                    className={cn(
                      "border-border/30",
                      isBestValue && "bg-primary/5"
                    )}
                  >
                    {/* Retailer */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {retailer.logo_url && (
                          <img 
                            src={retailer.logo_url} 
                            alt={retailer.name}
                            className="h-6 w-6 object-contain rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm">{retailer.name}</span>
                            {isAmazon && isPrimeMember && <PrimeBadge small />}
                          </div>
                          {isBestValue && (
                            <Badge className="text-[10px] px-1 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              Best Value
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Price */}
                    <TableCell className="text-center">
                      {price !== undefined ? (
                        <span className="font-semibold">${price.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Stock */}
                    <TableCell className="text-center">
                      <InventoryBadge 
                        status={stockStatus || 'unknown'} 
                        quantity={stockQuantity}
                      />
                    </TableCell>

                    {/* Shipping */}
                    <TableCell className="text-center">
                      {shippingEstimate ? (
                        <span className={shippingEstimate.isFree ? "text-emerald-400 font-medium" : ""}>
                          {shippingEstimate.isFree 
                            ? (isAmazon && isPrimeMember ? 'Free (Prime)' : 'Free')
                            : `$${shippingEstimate.cost.toFixed(2)}`
                          }
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Arrives */}
                    <TableCell className="text-center">
                      {shippingEstimate ? (
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDeliveryRange(shippingEstimate.arrivalDate.min, shippingEstimate.arrivalDate.max)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Rating */}
                    <TableCell className="text-center">
                      {retailer.trust_score ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-sm">{retailer.trust_score.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Returns */}
                    <TableCell className="text-center">
                      {retailer.return_policy_days ? (
                        <div className="flex items-center justify-center gap-1 text-xs">
                          <RotateCcw className="h-3 w-3 text-muted-foreground" />
                          <span>{retailer.return_policy_days}d</span>
                          {retailer.return_policy_type === 'no_questions' && (
                            <Check className="h-3 w-3 text-emerald-400" />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Total */}
                    <TableCell className="text-center">
                      {price !== undefined ? (
                        <span className={cn(
                          "font-bold",
                          isBestValue && "text-emerald-400"
                        )}>
                          ${totalCost.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Buy Button */}
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => affiliateUrl && window.open(affiliateUrl, '_blank', 'noopener,noreferrer')}
                        disabled={stockStatus === 'out_of_stock' || !affiliateUrl}
                        className="w-full gap-1"
                      >
                        Buy
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
