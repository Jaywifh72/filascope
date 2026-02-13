import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Pencil, Trash2, StickyNote, ChevronDown, ChevronUp } from "lucide-react";
import { VaultEmptyState } from "./VaultEmptyState";
import { useAllUserNotes, useNoteMutations, type NoteStatus } from "@/hooks/useUserNotes";
import { toast } from "sonner";
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
  not_recommended: "bg-destructive/10 text-destructive border-destructive/30",
};

export function VaultNotesTab() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const { deleteNote } = useNoteMutations();

  const { data: notes, isLoading } = useAllUserNotes({
    status: statusFilter !== "all" ? (statusFilter as NoteStatus) : null,
    sortBy: sortBy as "date" | "name" | "status",
  });

  // Also fetch legacy private comments + private reviews
  const { data: legacyNotes } = useQuery({
    queryKey: ["vault-legacy-notes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Fetch private reviews from product_reviews
      const { data: privateReviews, error: prError } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_public", false)
        .order("created_at", { ascending: false });
      if (prError) throw prError;

      // Also fetch legacy private comments from filament_comments
      const { data: legacyComments, error: lcError } = await supabase
        .from("filament_comments")
        .select("*, filaments(id, product_title, vendor, featured_image)")
        .eq("user_id", user!.id)
        .eq("is_private", true)
        .order("created_at", { ascending: false });
      if (lcError) throw lcError;

      // Enrich private reviews with filament data
      const filamentIds = (privateReviews || [])
        .filter((r: any) => r.product_type === "filament")
        .map((r: any) => r.product_id);

      let filamentMap = new Map();
      if (filamentIds.length > 0) {
        const { data: filaments } = await supabase
          .from("filaments")
          .select("id, product_title, vendor, featured_image")
          .in("id", filamentIds);
        filamentMap = new Map((filaments || []).map((f: any) => [f.id, f]));
      }

      return [
        ...(privateReviews || []).map((r: any) => ({
          id: r.id,
          source: "review" as const,
          text: `${r.headline}\n\n${r.body}`,
          created_at: r.created_at,
          product: filamentMap.get(r.product_id) || null,
          product_id: r.product_id,
          product_type: r.product_type || "filament",
        })),
        ...(legacyComments || []).map((n: any) => ({
          id: n.id,
          source: "comment" as const,
          text: n.comment_text,
          created_at: n.created_at,
          product: n.filaments || null,
          product_id: n.filament_id,
          product_type: "filament" as const,
        })),
      ];
    },
  });

  const handleDelete = (noteId: string, productId: string, productType: string) => {
    deleteNote.mutate(
      { noteId, productId, productType },
      {
        onSuccess: () => toast.success("Note deleted"),
        onError: () => toast.error("Failed to delete note"),
      }
    );
  };

  const allEmpty = (!notes || notes.length === 0) && (!legacyNotes || legacyNotes.length === 0);

  if (!isLoading && allEmpty) {
    return (
      <VaultEmptyState
        icon={FileText}
        title="No private notes"
        description="Add personal notes to filaments and printers to track your experience and preferences. Visit any product page and click '📝 Add Note' in the sidebar."
        actionLabel="Browse Filaments"
        actionHref="/"
        tip="💡 Notes are private and only visible to you — perfect for print settings and observations"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="want_to_try">Want to Try</SelectItem>
            <SelectItem value="currently_using">Currently Using</SelectItem>
            <SelectItem value="used_before">Used Before</SelectItem>
            <SelectItem value="not_recommended">Not Recommended</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date Added</SelectItem>
            <SelectItem value="name">Product Name</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Notes (new system) */}
      {notes && notes.length > 0 && (
        <div className="space-y-3">
          {notes.map((note) => {
            const isExpanded = expandedNote === note.id;
            const product = note.product;
            const href = note.product_type === "filament"
              ? `/filament/${note.product_id}`
              : `/printers/${note.product_id}`;

            return (
              <Card key={note.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {product?.featured_image && (
                      <img
                        src={product.featured_image}
                        alt=""
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link to={href} className="hover:text-primary transition-colors">
                        <CardTitle className="text-base truncate">
                          {product?.product_title || "Product"}
                        </CardTitle>
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {product?.vendor && <span>{product.vendor}</span>}
                        {product?.material && (
                          <>
                            <span>·</span>
                            <span>{product.material}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    {note.status && (
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] shrink-0", STATUS_COLORS[note.status])}
                      >
                        {STATUS_LABELS[note.status]}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {/* Note preview / expanded */}
                  {note.note_text && (
                    <p
                      className={cn(
                        "text-sm text-foreground/80 whitespace-pre-line",
                        !isExpanded && "line-clamp-2"
                      )}
                    >
                      {note.note_text}
                    </p>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setExpandedNote(isExpanded ? null : note.id)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          More
                        </>
                      )}
                    </button>
                    <Link
                      to={href}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit on page
                    </Link>
                    <button
                      onClick={() => handleDelete(note.id, note.product_id, note.product_type)}
                      className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Legacy notes (private reviews + comments) */}
      {legacyNotes && legacyNotes.length > 0 && (
        <div className="space-y-3">
          {notes && notes.length > 0 && (
            <h3 className="text-sm font-medium text-muted-foreground pt-4">
              Legacy Notes
            </h3>
          )}
          {legacyNotes.map((note) => (
            <Card key={note.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {note.product?.featured_image && (
                    <img
                      src={note.product.featured_image}
                      alt=""
                      className="w-10 h-10 rounded object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <Link
                      to={`/filament/${note.product_id}`}
                      className="hover:text-primary transition-colors"
                    >
                      <CardTitle className="text-base truncate">
                        {note.product?.product_title || "Filament"}
                      </CardTitle>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-foreground/80 whitespace-pre-line">{note.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
