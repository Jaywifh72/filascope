import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Star, ChevronDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { VaultReview } from "@/hooks/useVaultReviews";

interface ReviewEditDialogProps {
  review: VaultReview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reviewId: string, data: any) => void;
  isSaving: boolean;
}

const SUGGESTED_PROS = [
  "Easy to print", "Great colors", "Good adhesion", "Minimal stringing",
  "Fast shipping", "Consistent quality", "Great finish", "Strong parts",
];
const SUGGESTED_CONS = [
  "Warps easily", "Poor adhesion", "Inconsistent diameter", "Brittle",
  "Excessive stringing", "Poor packaging", "Color mismatch", "Moisture sensitive",
];

function InteractiveStarRating({
  value,
  onChange,
  label,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const iconSize = size === "sm" ? "w-4 h-4" : "w-6 h-6";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground min-w-[100px]">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                iconSize,
                "transition-colors",
                star <= (hover || value)
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
      {value > 0 && <span className="text-xs text-muted-foreground">{value}/5</span>}
    </div>
  );
}

function TagInput({
  tags,
  onAdd,
  onRemove,
  suggestions,
  placeholder,
  label,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  suggestions: string[];
  placeholder: string;
  label: string;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) onAdd(input.trim());
      setInput("");
    }
  };

  const unusedSuggestions = suggestions.filter((s) => !tags.includes(s));

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button type="button" onClick={() => onRemove(tag)} className="hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="text-sm"
      />
      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {unusedSuggestions.slice(0, 4).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onAdd(s)}
              className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReviewEditDialog({
  review,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: ReviewEditDialogProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [easeRating, setEaseRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [printerUsedId, setPrinterUsedId] = useState("");
  const [nozzleTemp, setNozzleTemp] = useState("");
  const [bedTemp, setBedTemp] = useState("");
  const [printSpeed, setPrintSpeed] = useState("");
  const [layerHeight, setLayerHeight] = useState("");
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Pre-fill form when review changes
  const [loadedReviewId, setLoadedReviewId] = useState<string | null>(null);
  if (review && review.id !== loadedReviewId) {
    setLoadedReviewId(review.id);
    setOverallRating(review.overall_rating);
    setQualityRating(review.quality_rating || 0);
    setEaseRating(review.ease_rating || 0);
    setValueRating(review.value_rating || 0);
    setHeadline(review.headline);
    setBody(review.body);
    setPrinterUsedId(review.printer_used_id || "");
    setNozzleTemp(review.nozzle_temp?.toString() || "");
    setBedTemp(review.bed_temp?.toString() || "");
    setPrintSpeed(review.print_speed?.toString() || "");
    setLayerHeight(review.layer_height?.toString() || "");
    setPros(review.pros || []);
    setCons(review.cons || []);
  }

  // Reset when dialog closes
  const handleOpenChange = (o: boolean) => {
    if (!o) setLoadedReviewId(null);
    onOpenChange(o);
  };

  const { data: printers } = useQuery({
    queryKey: ["printers-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers")
        .select("id, model_name, display_name")
        .eq("status", "active")
        .order("model_name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const autoOverall =
    qualityRating && easeRating && valueRating
      ? Math.round((qualityRating + easeRating + valueRating) / 3)
      : 0;
  const effectiveOverall = overallRating || autoOverall;

  const isValid =
    effectiveOverall >= 1 &&
    headline.trim().length > 0 &&
    headline.length <= 100 &&
    body.trim().length >= 50 &&
    body.length <= 2000;

  const handleSave = () => {
    if (!isValid || !review) return;
    onSave(review.id, {
      overall_rating: effectiveOverall,
      quality_rating: qualityRating || null,
      ease_rating: easeRating || null,
      value_rating: valueRating || null,
      headline: headline.trim(),
      body: body.trim(),
      pros,
      cons,
      printer_used_id: printerUsedId || null,
      nozzle_temp: nozzleTemp ? parseInt(nozzleTemp) : null,
      bed_temp: bedTemp ? parseInt(bedTemp) : null,
      print_speed: printSpeed ? parseInt(printSpeed) : null,
      layer_height: layerHeight ? parseFloat(layerHeight) : null,
    });
  };

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Star Ratings */}
          <div className="space-y-3">
            <InteractiveStarRating value={qualityRating} onChange={setQualityRating} label="Print Quality" size="sm" />
            <InteractiveStarRating value={easeRating} onChange={setEaseRating} label="Ease of Use" size="sm" />
            <InteractiveStarRating value={valueRating} onChange={setValueRating} label="Value for Money" size="sm" />
            <div className="pt-2 border-t border-border/40">
              <InteractiveStarRating
                value={overallRating || autoOverall}
                onChange={setOverallRating}
                label="Overall"
                size="md"
              />
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <Label>Headline <span className="text-destructive">*</span></Label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">{headline.length}/100</p>
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>Review <span className="text-destructive">*</span></Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tell other makers what you think (min 50 characters)"
              rows={5}
              maxLength={2000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={body.length < 50 && body.length > 0 ? "text-destructive" : ""}>
                {body.length < 50 ? `${50 - body.length} more characters needed` : ""}
              </span>
              <span>{body.length}/2000</span>
            </div>
          </div>

          {/* Printer */}
          <div className="space-y-2">
            <Label>Printer Used (optional)</Label>
            <Select value={printerUsedId} onValueChange={setPrinterUsedId}>
              <SelectTrigger>
                <SelectValue placeholder="Select your printer" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {(printers || []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name || p.model_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Print Settings */}
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 w-full justify-start px-0">
                <ChevronDown className={cn("w-4 h-4 transition-transform", settingsOpen && "rotate-180")} />
                Print Settings (optional)
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Nozzle Temp (°C)</Label>
                  <Input type="number" value={nozzleTemp} onChange={(e) => setNozzleTemp(e.target.value)} placeholder="210" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bed Temp (°C)</Label>
                  <Input type="number" value={bedTemp} onChange={(e) => setBedTemp(e.target.value)} placeholder="60" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Print Speed (mm/s)</Label>
                  <Input type="number" value={printSpeed} onChange={(e) => setPrintSpeed(e.target.value)} placeholder="50" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Layer Height (mm)</Label>
                  <Input type="number" step="0.01" value={layerHeight} onChange={(e) => setLayerHeight(e.target.value)} placeholder="0.20" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Pros / Cons */}
          <div className="grid md:grid-cols-2 gap-4">
            <TagInput
              tags={pros}
              onAdd={(tag) => setPros((p) => [...p, tag])}
              onRemove={(tag) => setPros((p) => p.filter((t) => t !== tag))}
              suggestions={SUGGESTED_PROS}
              placeholder="Type a pro and press Enter"
              label="Pros"
            />
            <TagInput
              tags={cons}
              onAdd={(tag) => setCons((c) => [...c, tag])}
              onRemove={(tag) => setCons((c) => c.filter((t) => t !== tag))}
              suggestions={SUGGESTED_CONS}
              placeholder="Type a con and press Enter"
              label="Cons"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isValid || isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
