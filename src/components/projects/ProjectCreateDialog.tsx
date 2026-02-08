import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Printer, Search, Plus, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProjectMutations, type ProjectType } from "@/hooks/useProject";
import { FilamentSearchDialog } from "./FilamentSearchDialog";

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (projectId: string) => void;
}

const PROJECT_TYPES: { value: ProjectType; label: string; desc: string }[] = [
  { value: "single_print", label: "Single Print", desc: "One model, one print" },
  { value: "multi_part", label: "Multi-Part Build", desc: "Multiple pieces assembled together" },
  { value: "collection", label: "Collection / Series", desc: "A set of related prints" },
  { value: "custom", label: "Custom", desc: "Define your own workflow" },
];

interface PendingFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  color_hex: string | null;
  quantity_spools: number;
  note: string;
}

export function ProjectCreateDialog({ open, onOpenChange, onCreated }: ProjectCreateDialogProps) {
  const [step, setStep] = useState(1);
  const { createProject, addMaterial } = useProjectMutations();

  // Step 1
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("single_print");
  const [isPublic, setIsPublic] = useState(false);

  // Step 2
  const [printerSearch, setPrinterSearch] = useState("");
  const [selectedPrinter, setSelectedPrinter] = useState<{ id: string; model_name: string; brand: string } | null>(null);

  // Step 3
  const [filamentSearchOpen, setFilamentSearchOpen] = useState(false);
  const [pendingFilaments, setPendingFilaments] = useState<PendingFilament[]>([]);

  const { data: printers } = useQuery({
    queryKey: ["printer-search", printerSearch],
    enabled: printerSearch.length >= 2 && step === 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers")
        .select("id, model_name, brand:printer_brands(brand)")
        .ilike("model_name", `%${printerSearch}%`)
        .limit(10);
      if (error) throw error;
      return data as any[];
    },
    staleTime: 1000 * 30,
  });

  const reset = () => {
    setStep(1);
    setName("");
    setDescription("");
    setProjectType("single_print");
    setIsPublic(false);
    setPrinterSearch("");
    setSelectedPrinter(null);
    setPendingFilaments([]);
  };

  const handleCreate = async () => {
    try {
      const result = await createProject.mutateAsync({
        name,
        description,
        project_type: projectType,
        is_public: isPublic,
        printer_id: selectedPrinter?.id || null,
      });

      // Add pending filaments
      for (const f of pendingFilaments) {
        await addMaterial.mutateAsync({
          project_id: result.id,
          filament_id: f.id,
          quantity_spools: f.quantity_spools,
          note: f.note,
        });
      }

      onCreated?.(result.id);
      onOpenChange(false);
      reset();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "New Project — Basics"}
            {step === 2 && "New Project — Printer"}
            {step === 3 && "New Project — Materials"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Project Name *</Label>
              <Input
                placeholder="e.g. Mandalorian Helmet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="What are you building?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Project Type</Label>
              <RadioGroup
                value={projectType}
                onValueChange={(v) => setProjectType(v as ProjectType)}
                className="grid grid-cols-2 gap-2 mt-1"
              >
                {PROJECT_TYPES.map((t) => (
                  <label
                    key={t.value}
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                      projectType === t.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <RadioGroupItem value={t.value} className="sr-only" />
                    <span className="text-sm font-medium">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.desc}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label>Visibility</Label>
              <RadioGroup
                value={isPublic ? "public" : "private"}
                onValueChange={(v) => setIsPublic(v === "public")}
                className="flex gap-4 mt-1"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="private" />
                  <span className="text-sm">Private</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="public" />
                  <span className="text-sm">Public</span>
                </label>
              </RadioGroup>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              What printer will you use for this project?
            </p>

            {selectedPrinter ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-primary bg-primary/5">
                <Printer className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedPrinter.model_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPrinter.brand}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPrinter(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search printers..."
                    value={printerSearch}
                    onChange={(e) => setPrinterSearch(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {printers?.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() =>
                        setSelectedPrinter({
                          id: p.id,
                          model_name: p.model_name,
                          brand: p.brand?.brand || "",
                        })
                      }
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <Printer className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{p.model_name}</p>
                        <p className="text-xs text-muted-foreground">{p.brand?.brand}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add filaments you'll need. You can always add more later.
            </p>

            {pendingFilaments.map((f, idx) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div
                  className="w-6 h-6 rounded border border-border shrink-0"
                  style={{ backgroundColor: f.color_hex || "#888" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.product_title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min={1}
                      value={f.quantity_spools}
                      onChange={(e) => {
                        const updated = [...pendingFilaments];
                        updated[idx].quantity_spools = Number(e.target.value) || 1;
                        setPendingFilaments(updated);
                      }}
                      className="w-20 h-7 text-xs"
                      placeholder="Qty"
                    />
                    <span className="text-xs text-muted-foreground">spool(s)</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingFilaments(pendingFilaments.filter((_, i) => i !== idx))}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={() => setFilamentSearchOpen(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Filament
            </Button>

            <FilamentSearchDialog
              open={filamentSearchOpen}
              onOpenChange={setFilamentSearchOpen}
              excludeIds={pendingFilaments.map((f) => f.id)}
              onSelect={(f) => {
                setPendingFilaments([
                  ...pendingFilaments,
                  { ...f, quantity_spools: 1, note: "" },
                ]);
                setFilamentSearchOpen(false);
              }}
            />
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 3 ? (
              <>
                {step === 2 && (
                  <Button variant="ghost" onClick={() => setStep(3)}>
                    Skip
                  </Button>
                )}
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !name.trim()}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={createProject.isPending || !name.trim()}
              >
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
