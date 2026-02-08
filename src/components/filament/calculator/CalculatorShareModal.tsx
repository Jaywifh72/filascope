import React, { useState } from 'react';
import { Copy, Check, Link2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface CalculatorShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculationData: {
    filamentName: string;
    filamentMaterial: string;
    usageGrams: number;
    totalCost: number;
    printsPerSpool: number;
    costPerPrint: number;
    currencySymbol?: string;
    currencyCode?: string;
    isConverted?: boolean;
    spoolWeight?: number;
  };
}

export const CalculatorShareModal: React.FC<CalculatorShareModalProps> = ({
  isOpen,
  onClose,
  calculationData,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sym = calculationData.currencySymbol || '$';
  const code = calculationData.currencyCode || 'USD';
  const prefix = calculationData.isConverted ? '~' : '';
  const spoolKg = ((calculationData.spoolWeight || 1000) / 1000).toFixed(0);

  // Generate shareable text with proper currency
  const shareText = `🖨️ Print Calculator Results
━━━━━━━━━━━━━━━━━━━━
📦 Filament: ${calculationData.filamentName}
🧪 Material: ${calculationData.filamentMaterial}
⚖️ Usage: ${calculationData.usageGrams}g per print
💰 Cost: ${prefix}${sym}${calculationData.totalCost.toFixed(2)} ${code} per print
🎯 Prints/Spool: ~${calculationData.printsPerSpool} (${spoolKg}kg spool)

Calculated with FilaScope`;

  // Generate URL with encoded calculator state
  const baseUrl = window.location.origin;
  const currentPath = window.location.pathname;
  const params = new URLSearchParams({
    calc: 'open',
    usage: calculationData.usageGrams.toString(),
    material: calculationData.filamentMaterial,
    cost: calculationData.totalCost.toFixed(2),
    currency: code,
  });
  const shareUrl = `${baseUrl}${currentPath}?${params.toString()}`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success('Calculation copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([shareText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `print-calculation-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Calculation saved!');
  };

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Share Calculation</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Preview */}
          <div className="bg-muted/30 rounded-xl p-4 font-mono text-xs text-muted-foreground whitespace-pre-wrap">
            {shareText}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button 
              onClick={handleCopyText} 
              className="w-full gap-2"
              variant={copied ? "default" : "outline"}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button 
                onClick={handleCopyLink} 
                variant="outline"
                className="flex-1 gap-2"
              >
                <Link2 className="w-4 h-4" />
                Copy Link
              </Button>
              <Button 
                onClick={handleDownload} 
                variant="outline"
                className="flex-1 gap-2"
              >
                <Download className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>

          {/* Share Link Input */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Share Link</label>
            <Input 
              value={shareUrl} 
              readOnly 
              className="bg-muted/30 text-xs"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
