import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bookmark, 
  MoreVertical, 
  Trash2, 
  Pencil, 
  Share2, 
  Copy,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useComparePresets, ComparePreset } from "@/hooks/useComparePresets";
import { formatDistanceToNow } from "date-fns";

interface PresetGalleryProps {
  onRestore?: (filamentIds: string[]) => void;
}

export function PresetGallery({ onRestore }: PresetGalleryProps) {
  const navigate = useNavigate();
  const { presets, deletePreset, renamePreset, getShareUrl } = useComparePresets();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  if (presets.length === 0) {
    return null;
  }

  const handleRestore = (preset: ComparePreset) => {
    if (onRestore) {
      onRestore(preset.filamentIds);
    } else {
      navigate(`/compare?ids=${preset.filamentIds.join(',')}`);
    }
  };

  const handleShare = async (preset: ComparePreset) => {
    const url = getShareUrl(preset);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleStartRename = (preset: ComparePreset) => {
    setEditingId(preset.id);
    setEditName(preset.name);
  };

  const handleConfirmRename = (id: string) => {
    if (editName.trim()) {
      renamePreset(id, editName);
    }
    setEditingId(null);
    setEditName("");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-8">
          <Bookmark className="w-4 h-4" />
          Presets
          <Badge variant="secondary" className="ml-1 text-xs px-1.5">
            {presets.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b border-border">
          <h4 className="font-semibold text-sm">Saved Presets</h4>
          <p className="text-xs text-muted-foreground">
            Click to restore a saved comparison
          </p>
        </div>
        <ScrollArea className="max-h-72">
          <div className="p-2 space-y-1">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <button
                  onClick={() => handleRestore(preset)}
                  className="flex-1 text-left"
                >
                  {editingId === preset.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleConfirmRename(preset.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmRename(preset.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="h-6 text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate">{preset.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(preset.createdAt, { addSuffix: true })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {preset.filamentIds.length} items
                        </span>
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {preset.materials.slice(0, 3).map((mat, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] px-1 py-0">
                            {mat}
                          </Badge>
                        ))}
                        {preset.materials.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            +{preset.materials.length - 3}
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStartRename(preset)}>
                      <Pencil className="w-3 h-3 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare(preset)}>
                      <Share2 className="w-3 h-3 mr-2" />
                      Share Link
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deletePreset(preset.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
