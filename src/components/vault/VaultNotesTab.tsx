import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { VaultEmptyState } from "./VaultEmptyState";

export function VaultNotesTab() {
  const { user } = useAuth();

  const { data: notes } = useQuery({
    queryKey: ["vault-notes", user?.id],
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
      const { data: legacyNotes, error: lcError } = await supabase
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

      // Combine both sources
      const combined = [
        ...(privateReviews || []).map((r: any) => ({
          id: r.id,
          type: "review" as const,
          text: `${r.headline}\n\n${r.body}`,
          created_at: r.created_at,
          filament: filamentMap.get(r.product_id) || null,
          product_id: r.product_id,
        })),
        ...(legacyNotes || []).map((n: any) => ({
          id: n.id,
          type: "comment" as const,
          text: n.comment_text,
          created_at: n.created_at,
          filament: n.filaments || null,
          product_id: n.filament_id,
        })),
      ];

      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return combined;
    },
  });

  if (!notes?.length) {
    return (
      <VaultEmptyState
        icon={FileText}
        title="No private notes"
        description="Add personal notes to filaments to track your experience and preferences."
        actionLabel="Browse Filaments"
        actionHref="/"
      />
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 min-w-0">
              {note.filament?.featured_image && (
                <img
                  src={note.filament.featured_image}
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
                    {note.filament?.product_title || "Filament"}
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
  );
}
