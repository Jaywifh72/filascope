import { useState } from "react";
import { useMultiplePrinters, UserPrinter } from "@/hooks/useMultiplePrinters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Printer,
  Plus,
  Star,
  Trash2,
  Edit3,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiPrinterManagerProps {
  onAddPrinter: () => void;
  onSelectPrinter: (printerId: string) => void;
  selectedPrinterId?: string;
}

export function MultiPrinterManager({
  onAddPrinter,
  onSelectPrinter,
  selectedPrinterId,
}: MultiPrinterManagerProps) {
  const {
    printers,
    primaryPrinter,
    isLoading,
    removePrinter,
    setPrimaryPrinter,
    updatePrinter,
  } = useMultiplePrinters();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState("");

  const handleStartEdit = (printer: UserPrinter) => {
    setEditingId(printer.id);
    setEditNickname(printer.nickname || printer.printer?.model_name || "");
  };

  const handleSaveEdit = (id: string) => {
    updatePrinter({ id, nickname: editNickname || undefined });
    setEditingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (printers.length === 0) {
    return (
      <Button
        variant="outline"
        onClick={onAddPrinter}
        className="w-full gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Your First Printer
      </Button>
    );
  }

  // Quick switch dropdown for multiple printers
  if (printers.length > 1) {
    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 flex-1 justify-between">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-primary" />
                <span className="truncate max-w-[150px]">
                  {primaryPrinter?.nickname ||
                    primaryPrinter?.printer?.model_name ||
                    "Select Printer"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {printers.map((printer) => (
              <DropdownMenuItem
                key={printer.id}
                onClick={() => {
                  setPrimaryPrinter(printer.id);
                  onSelectPrinter(printer.printer_id);
                }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {printer.is_primary && (
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  )}
                  <span className="truncate">
                    {printer.nickname || printer.printer?.model_name}
                  </span>
                </div>
                {printer.printer_id === selectedPrinterId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onAddPrinter} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Another Printer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Manage Printers Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0" aria-label="Manage printers">
              <Edit3 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Your Printers</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {printers.map((printer) => (
                <div
                  key={printer.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    printer.is_primary
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 bg-card"
                  )}
                >
                  {/* Printer image */}
                  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {printer.printer?.scraped_data?.images?.product_images?.[0] ? (
                      <img
                        src={printer.printer.scraped_data.images.product_images[0]}
                        alt={printer.printer.model_name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Printer className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Name/Nickname */}
                  <div className="flex-1 min-w-0">
                    {editingId === printer.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editNickname}
                          onChange={(e) => setEditNickname(e.target.value)}
                          className="h-8"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(printer.id)}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          {printer.is_primary && (
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          )}
                          <span className="font-medium truncate">
                            {printer.nickname || printer.printer?.model_name}
                          </span>
                        </div>
                        {printer.nickname && (
                          <p className="text-xs text-muted-foreground truncate">
                            {printer.printer?.model_name}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== printer.id && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(printer)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      {!printer.is_primary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPrimaryPrinter(printer.id)}
                          title="Set as primary"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removePrinter(printer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                onClick={onAddPrinter}
                className="w-full gap-2 mt-4"
              >
                <Plus className="h-4 w-4" />
                Add Another Printer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Single printer view
  const printer = printers[0];
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border flex-1",
          "border-primary/30 bg-primary/5"
        )}
      >
        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {printer.printer?.scraped_data?.images?.product_images?.[0] ? (
            <img
              src={printer.printer.scraped_data.images.product_images[0]}
              alt={printer.printer.model_name}
              className="w-full h-full object-contain"
            />
          ) : (
            <Printer className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium truncate block">
            {printer.nickname || printer.printer?.model_name}
          </span>
          <p className="text-xs text-muted-foreground">
            {printer.printer?.brand?.brand}
          </p>
        </div>
      </div>
      <Button variant="outline" size="icon" onClick={onAddPrinter} aria-label="Add printer">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
