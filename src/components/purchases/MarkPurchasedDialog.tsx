import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ShoppingBag, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { usePurchaseCheck } from "@/hooks/useUserPurchases";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MarkPurchasedDialogProps {
  productId: string;
  productType: "filament" | "printer";
  productName: string;
  currentPrice?: number | null;
  storeName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarkPurchasedDialog({
  productId,
  productType,
  productName,
  currentPrice,
  storeName,
  open,
  onOpenChange,
}: MarkPurchasedDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [store, setStore] = useState(storeName || "");
  const [price, setPrice] = useState(currentPrice?.toString() || "");

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Must be logged in");

      const { error } = await supabase.from("user_purchases").insert({
        user_id: user.id,
        filament_id: productId,
        product_type: productType,
        purchase_date: format(date, "yyyy-MM-dd"),
        store_name: store || null,
        price_paid: price ? parseFloat(price) : null,
        currency: "USD",
      });
      if (error) throw error;

      // Auto-verify existing reviews
      await supabase
        .from("product_reviews")
        .update({ verified_purchase: true })
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .eq("product_type", productType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["vault-counts"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-check"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      toast.success("Purchase recorded!");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to save purchase");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Mark as Purchased
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground truncate">
          {productName}
        </p>

        <div className="space-y-4 py-2">
          {/* Date picker */}
          <div className="space-y-2">
            <Label>When did you buy this?</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(d) => d > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Store */}
          <div className="space-y-2">
            <Label>Where did you buy it?</Label>
            <Input
              placeholder="e.g. Amazon, Official Store"
              value={store}
              onChange={(e) => setStore(e.target.value)}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label>Price paid (optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            {addMutation.isPending ? "Saving..." : "Save Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Compact button shown on product pages — opens dialog or shows purchased state */
export function MarkPurchasedButton({
  productId,
  productType,
  productName,
  currentPrice,
  storeName,
}: {
  productId: string;
  productType: "filament" | "printer";
  productName: string;
  currentPrice?: number | null;
  storeName?: string;
}) {
  const { user } = useAuth();
  const { data: existingPurchase, isLoading } = usePurchaseCheck(productId, productType);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!user) return null;
  if (isLoading) return null;

  if (existingPurchase) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Check className="w-4 h-4" />
          <span className="font-medium">
            Purchased {existingPurchase.purchase_date
              ? format(new Date(existingPurchase.purchase_date), "MMM d, yyyy")
              : ""}
          </span>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Edit
        </button>
        <MarkPurchasedDialog
          productId={productId}
          productType={productType}
          productName={productName}
          currentPrice={currentPrice}
          storeName={storeName}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setDialogOpen(true)}
        className="w-full h-8 text-xs font-medium whitespace-nowrap"
      >
        <ShoppingBag className="w-4 h-4 mr-1" />
        Purchased
      </Button>
      <MarkPurchasedDialog
        productId={productId}
        productType={productType}
        productName={productName}
        currentPrice={currentPrice}
        storeName={storeName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
