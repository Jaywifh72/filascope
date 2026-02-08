import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserPurchase } from "@/hooks/useUserPurchases";
import { format } from "date-fns";

interface PurchaseExportButtonProps {
  purchases: UserPurchase[];
}

export function PurchaseExportButton({ purchases }: PurchaseExportButtonProps) {
  const handleExport = () => {
    const headers = ["Product", "Brand", "Material", "Date", "Store", "Price", "Currency"];
    const rows = purchases.map((p) => [
      p.filament?.product_title || "Unknown",
      p.filament?.vendor || "",
      p.filament?.material || "",
      p.purchased_at ? format(new Date(p.purchased_at), "yyyy-MM-dd") : "",
      p.store_name || "",
      p.price_paid?.toFixed(2) || "",
      p.currency || "USD",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join(
      "\n"
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filascope-purchases-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
      <Download className="w-4 h-4" />
      Export CSV
    </Button>
  );
}
