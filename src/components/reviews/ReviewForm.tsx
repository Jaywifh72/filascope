import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  Star,
  ChevronDown,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ReviewFormProps {
  productId: string;
  productType?: string;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  hasExistingReview: boolean;
}

const SUGGESTED_PROS = [
  "Easy to print",
  "Great colors",
  "Good adhesion",
  "Minimal stringing",
  "Fast shipping",
  "Consistent quality",
  "Great finish",
  "Strong parts",
];

const SUGGESTED_CONS = [
  "Warps easily",
  "Poor adhesion",
  "Inconsistent diameter",
  "Brittle",
  "Excessive stringing",
  "Poor packaging",
  "Color mismatch",
  "Moisture sensitive",
];

function StarRating({
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
      {value > 0 && (
        <span className="text-xs text-muted-foreground">{value}/5</span>
      )}
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
      if (!tags.includes(input.trim())) {
        onAdd(input.trim());
      }
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

export function ReviewForm({
  productId,
  productType = "filament",
  onSubmit,
  isSubmitting,
  hasExistingReview,
}: ReviewFormProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [easeRating, setEaseRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [printerUsedId, setPrinterUsedId] = useState<string>("");
  const [nozzleTemp, setNozzleTemp] = useState("");
  const [bedTemp, setBedTemp] = useState("");
  const [printSpeed, setPrintSpeed] = useState("");
  const [layerHeight, setLayerHeight] = useState("");
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch printers for dropdown
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

  // Auto-calculate overall rating
  const autoOverall = qualityRating && easeRating && valueRating
    ? Math.round((qualityRating + easeRating + valueRating) / 3)
    : 0;

  const effectiveOverall = overallRating || autoOverall;

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);

    setPhotos((prev) => [...prev, ...toAdd]);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const isValid =
    effectiveOverall >= 1 &&
    headline.trim().length > 0 &&
    headline.length <= 100 &&
    body.trim().length >= 50 &&
    body.length <= 2000;

  const handleSubmit = () => {
    if (!isValid) return;

    onSubmit({
      overall_rating: effectiveOverall,
      quality_rating: qualityRating || undefined,
      ease_rating: easeRating || undefined,
      value_rating: valueRating || undefined,
      headline: headline.trim(),
      body: body.trim(),
      printer_used_id: printerUsedId || undefined,
      nozzle_temp: nozzleTemp ? parseInt(nozzleTemp) : undefined,
      bed_temp: bedTemp ? parseInt(bedTemp) : undefined,
      print_speed: printSpeed ? parseInt(printSpeed) : undefined,
      layer_height: layerHeight ? parseFloat(layerHeight) : undefined,
      pros,
      cons,
      is_public: isPublic,
      photos,
    });
  };

  if (!user) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6 text-center">
          <Star className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Sign in to write a review
          </p>
          <Button asChild size="sm">
            <Link to="/auth">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (hasExistingReview) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center gap-3">
          <Star className="w-5 h-5 text-primary fill-primary" />
          <p className="text-sm">You've already reviewed this product.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Star className="w-4 h-4" />
        Write a Review
      </Button>
    );
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Write a Review</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Star Ratings */}
        <div className="space-y-3">
          <StarRating value={qualityRating} onChange={setQualityRating} label="Print Quality" size="sm" />
          <StarRating value={easeRating} onChange={setEaseRating} label="Ease of Use" size="sm" />
          <StarRating value={valueRating} onChange={setValueRating} label="Value for Money" size="sm" />
          <div className="pt-2 border-t border-border/40">
            <StarRating
              value={overallRating || autoOverall}
              onChange={setOverallRating}
              label="Overall"
              size="md"
            />
            {autoOverall > 0 && !overallRating && (
              <p className="text-xs text-muted-foreground ml-[108px] mt-1">
                Auto-calculated from categories
              </p>
            )}
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

        {/* Printer Used */}
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

        {/* Print Settings (collapsible) */}
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
                <Input
                  type="number"
                  value={nozzleTemp}
                  onChange={(e) => setNozzleTemp(e.target.value)}
                  placeholder="210"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bed Temp (°C)</Label>
                <Input
                  type="number"
                  value={bedTemp}
                  onChange={(e) => setBedTemp(e.target.value)}
                  placeholder="60"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Print Speed (mm/s)</Label>
                <Input
                  type="number"
                  value={printSpeed}
                  onChange={(e) => setPrintSpeed(e.target.value)}
                  placeholder="50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Layer Height (mm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={layerHeight}
                  onChange={(e) => setLayerHeight(e.target.value)}
                  placeholder="0.20"
                />
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

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label>Photos (optional, up to 5)</Label>
          <div className="flex flex-wrap gap-2">
            {photoPreviews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Add</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoAdd}
            className="hidden"
          />
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <Label>Visibility</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={cn(
                "flex-1 p-3 rounded-lg border text-sm text-center transition-colors",
                isPublic
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              )}
            >
              <span className="font-medium">Public Review</span>
              <p className="text-xs mt-0.5 opacity-70">Visible to everyone</p>
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={cn(
                "flex-1 p-3 rounded-lg border text-sm text-center transition-colors",
                !isPublic
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              )}
            >
              <span className="font-medium">Private Note</span>
              <p className="text-xs mt-0.5 opacity-70">Only visible to you</p>
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
