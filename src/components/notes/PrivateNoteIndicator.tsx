import { StickyNote } from "lucide-react";
import { useProductNote, type NoteStatus } from "@/hooks/useUserNotes";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { PrivateNotePopover } from "./PrivateNotePopover";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<NoteStatus, string> = {
  want_to_try: "Want to Try",
  currently_using: "Currently Using",
  used_before: "Used Before",
  not_recommended: "Not Recommended",
};

const STATUS_COLORS: Record<NoteStatus, string> = {
  want_to_try: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  currently_using: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  used_before: "bg-muted text-muted-foreground border-border/60",
  not_recommended: "bg-red-500/10 text-red-400 border-red-500/30",
};

interface PrivateNoteIndicatorProps {
  productId: string;
  productType: "filament" | "printer";
  productTitle?: string;
}

/**
 * Compact indicator shown on product pages when user has an existing note.
 * If no note exists, shows nothing.
 */
export function PrivateNoteIndicator({
  productId,
  productType,
  productTitle,
}: PrivateNoteIndicatorProps) {
  const { user } = useAuth();
  const { data: note } = useProductNote(productId, productType);

  if (!user || !note) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-amber-400">
          <StickyNote className="w-4 h-4" />
          <span>Your Note</span>
        </div>
        <PrivateNotePopover
          productId={productId}
          productType={productType}
          productTitle={productTitle}
          compact
        />
      </div>

      {/* Status badge */}
      {note.status && (
        <Badge
          variant="outline"
          className={cn("text-[10px]", STATUS_COLORS[note.status])}
        >
          {STATUS_LABELS[note.status]}
        </Badge>
      )}

      {/* Note text preview */}
      {note.note_text && (
        <p className="text-xs text-foreground/70 line-clamp-2 whitespace-pre-line">
          {note.note_text}
        </p>
      )}

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
