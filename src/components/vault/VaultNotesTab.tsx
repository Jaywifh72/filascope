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
      const { data, error } = await supabase
        .from("filament_comments")
        .select("*, filaments(id, product_title, vendor, featured_image)")
        .eq("user_id", user!.id)
        .eq("is_private", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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
      {notes.map((note: any) => (
        <Card key={note.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 min-w-0">
              {note.filaments?.featured_image && (
                <img
                  src={note.filaments.featured_image}
                  alt=""
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
              )}
              <div className="min-w-0">
                <Link
                  to={`/filament/${note.filaments?.id}`}
                  className="hover:text-primary transition-colors"
                >
                  <CardTitle className="text-base truncate">
                    {note.filaments?.product_title}
                  </CardTitle>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-foreground/80">{note.comment_text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
