import { useState, useEffect } from "react";
import { StickyNote, X, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductNote, useNoteMutations, type NoteStatus } from "@/hooks/useUserNotes";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: NoteStatus; label: string }[] = [
  { value: "want_to_try", label: "Want to Try" },
  { value: "currently_using", label: "Currently Using" },
  { value: "used_before", label: "Used Before" },
  { value: "not_recommended", label: "Not Recommended" },
];

const SUGGESTED_TAGS = [
  "Easy to print",
  "Great colors",
  "Good adhesion",
  "Minimal stringing",
  "Fast shipping",
  "Warps easily",
  "Poor adhesion",
  "Inconsistent diameter",
];

interface PrivateNotePopoverProps {
  productId: string;
  productType: "filament" | "printer";
  productTitle?: string;
  /** Compact mode for sidebar (just an icon button) */
  compact?: boolean;
}

export function PrivateNotePopover({
  productId,
  productType,
  productTitle,
  compact = false,
}: PrivateNotePopoverProps) {
  const { user } = useAuth();
  const { data: existingNote, isLoading } = useProductNote(productId, productType);
  const { saveNote, deleteNote } = useNoteMutations();

  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<NoteStatus | "">("");

  // Sync form with existing note when opened
  useEffect(() => {
    if (open && existingNote) {
      setNoteText(existingNote.note_text);
      setTags(existingNote.tags || []);
      setStatus(existingNote.status || "");
    } else if (open && !existingNote) {
      setNoteText("");
      setTags([]);
      setTagInput("");
      setStatus("");
    }
  }, [open, existingNote]);

  if (!user) return null;

  const hasNote = !!existingNote;

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!noteText.trim() && tags.length === 0 && !status) {
      toast.error("Please add a note, tag, or status");
      return;
    }

    saveNote.mutate(
      {
        product_id: productId,
        product_type: productType,
        note_text: noteText.trim(),
        tags,
        status: status ? (status as NoteStatus) : null,
      },
      {
        onSuccess: () => {
          toast.success(hasNote ? "Note updated" : "Note saved");
          setOpen(false);
        },
        onError: () => {
          toast.error("Failed to save note");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!existingNote) return;
    deleteNote.mutate(
      { noteId: existingNote.id, productId, productType },
      {
        onSuccess: () => {
          toast.success("Note deleted");
          setOpen(false);
          setNoteText("");
          setTags([]);
          setStatus("");
        },
        onError: () => {
          toast.error("Failed to delete note");
        },
      }
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {compact ? (
          <button
            className={cn(
              "inline-flex items-center gap-1.5 text-sm transition-colors",
              hasNote
                ? "text-amber-400 hover:text-amber-300"
                : "text-muted-foreground hover:text-primary"
            )}
            aria-label={hasNote ? "Edit your note" : "Add a note"}
          >
            <StickyNote className="w-4 h-4" />
            <span className="hidden sm:inline">{hasNote ? "Your Note" : "Add Note"}</span>
          </button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full gap-2",
              hasNote && "border-amber-500/40 text-amber-400 hover:text-amber-300 hover:border-amber-500/60"
            )}
          >
            <StickyNote className="w-4 h-4" />
            {hasNote ? "📝 Edit Note" : "📝 Add Note"}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-[340px] p-0"
        align="start"
        side="bottom"
        sideOffset={8}
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              {hasNote ? "Edit Private Note" : "Add Private Note"}
            </h4>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Note text */}
          <div>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value.slice(0, 1000))}
              placeholder={`Your private note about this ${productType}...`}
              className="min-h-[100px] text-sm resize-none"
              maxLength={1000}
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              {noteText.length}/1000
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as NoteStatus | "")}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tag and press Enter..."
              className="h-8 text-xs"
            />
            {/* Suggested tags */}
            {tags.length < 5 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {SUGGESTED_TAGS.filter((t) => !tags.includes(t))
                  .slice(0, 4)
                  .map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Privacy notice */}
          <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
            🔒 This note is private — only visible to you in My Vault
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saveNote.isPending}
              size="sm"
              className="flex-1"
            >
              {saveNote.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {hasNote ? "Update Note" : "Save Note"}
            </Button>
            {hasNote && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteNote.isPending}
                className="text-destructive hover:text-destructive"
              >
                {deleteNote.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
