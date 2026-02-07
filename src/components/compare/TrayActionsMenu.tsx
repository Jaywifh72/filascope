import { useState } from "react";
import { 
  MoreHorizontal, 
  Save, 
  FileDown, 
  Share2, 
  History, 
  Trash2, 
  Keyboard,
  FileText,
  FileSpreadsheet,
  Image,
  Copy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";
import { CompareItem } from "@/hooks/useCompare";

interface TrayActionsMenuProps {
  items: CompareItem[];
  onSavePreset: () => void;
  onViewHistory: () => void;
  onClearAll: () => void;
  onShowKeyboardHints: () => void;
}

export function TrayActionsMenu({
  items,
  onSavePreset,
  onViewHistory,
  onClearAll,
  onShowKeyboardHints,
}: TrayActionsMenuProps) {
  const canExport = items.length >= 2;

  const handleCopyLink = async () => {
    if (items.length < 2) {
      toast.info("Add at least 2 materials to share");
      return;
    }
    
    const ids = items.map(i => i.id).join(',');
    const url = `${window.location.origin}/compare?ids=${ids}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleExportCSV = () => {
    if (!canExport) return;
    
    const headers = ['Name', 'Brand', 'Material', 'Price/kg'];
    const rows = items.map(item => {
      const ppkg = item.variant_price
        ? computePricePerKg(item.variant_price, item.net_weight_g, (item as any).pack_quantity)
        : null;
      return [
        item.product_title,
        item.vendor || '',
        item.material || '',
        ppkg ? `$${ppkg.toFixed(2)}` : '',
      ];
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filament-comparison.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Exported as CSV");
  };

  const handleExportJSON = () => {
    if (!canExport) return;
    
    const data = items.map(item => ({
      name: item.product_title,
      brand: item.vendor,
      material: item.material,
      color: item.color_hex,
      pricePerKg: item.variant_price
        ? computePricePerKg(item.variant_price, item.net_weight_g, (item as any).pack_quantity)
        : null,
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filament-comparison.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Exported as JSON");
  };

  const handleExportMarkdown = () => {
    if (!canExport) return;
    
    const lines = [
      '# Filament Comparison',
      '',
      '| Name | Brand | Material | Price/kg |',
      '|------|-------|----------|----------|',
      ...items.map(item => {
        const ppkg = item.variant_price
          ? computePricePerKg(item.variant_price, item.net_weight_g, (item as any).pack_quantity)
          : null;
        return `| ${item.product_title} | ${item.vendor || '-'} | ${item.material || '-'} | ${
          ppkg ? `$${ppkg.toFixed(2)}` : '-'
        } |`;
      }),
    ];
    
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filament-comparison.md';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Exported as Markdown");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
          <span className="sr-only">More actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onSavePreset} disabled={items.length < 2}>
          <Save className="w-4 h-4 mr-2" />
          Save as Preset
        </DropdownMenuItem>
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={!canExport}>
            <FileDown className="w-4 h-4 mr-2" />
            Export
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportJSON}>
              <FileText className="w-4 h-4 mr-2" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportMarkdown}>
              <FileText className="w-4 h-4 mr-2" />
              Export as Markdown
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuItem onClick={handleCopyLink} disabled={items.length < 2}>
          <Share2 className="w-4 h-4 mr-2" />
          Share Link
          <DropdownMenuShortcut>⇧⌘C</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onViewHistory}>
          <History className="w-4 h-4 mr-2" />
          View History
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onShowKeyboardHints}>
          <Keyboard className="w-4 h-4 mr-2" />
          Keyboard Shortcuts
          <DropdownMenuShortcut>?</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onClearAll} 
          className="text-destructive focus:text-destructive"
          disabled={items.length === 0}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
