import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link, Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingBag, FolderOpen, Trash2, Plus, MessageSquare, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { LikeButton } from "@/components/LikeButton";

const Vault = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isCommentPrivate, setIsCommentPrivate] = useState(false);
  const [selectedFilamentForComment, setSelectedFilamentForComment] = useState<string | null>(null);

  // Fetch liked filaments
  const { data: likedFilaments } = useQuery({
    queryKey: ["likedFilaments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("*, filaments(*)")
        .eq("user_id", user!.id);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch purchased filaments
  const { data: purchases } = useQuery({
    queryKey: ["purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_purchases")
        .select("*, filaments(*)")
        .eq("user_id", user!.id)
        .order("purchase_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, project_filaments(*, filaments(*))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch comments
  const { data: comments } = useQuery({
    queryKey: ["comments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filament_comments")
        .select("*, filaments(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Create project mutation
  const createProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("projects")
        .insert({
          user_id: user!.id,
          name: newProjectName,
          description: newProjectDescription,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setNewProjectName("");
      setNewProjectDescription("");
      toast.success("Project created");
    },
    onError: () => toast.error("Failed to create project"),
  });

  // Delete project mutation
  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: () => toast.error("Failed to delete project"),
  });

  // Add comment mutation
  const addComment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("filament_comments")
        .insert({
          filament_id: selectedFilamentForComment!,
          user_id: user!.id,
          comment_text: commentText,
          is_private: isCommentPrivate,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      setCommentText("");
      setIsCommentPrivate(false);
      setSelectedFilamentForComment(null);
      toast.success("Comment added");
    },
    onError: () => toast.error("Failed to add comment"),
  });

  // Mark as purchased mutation
  const markAsPurchased = useMutation({
    mutationFn: async (filamentId: string) => {
      const { error } = await supabase
        .from("user_purchases")
        .insert({
          user_id: user!.id,
          filament_id: filamentId,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success("Marked as purchased");
    },
    onError: () => toast.error("Failed to mark as purchased"),
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const FilamentCard = ({ filament, showActions = true }: any) => (
    <Card className="group hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <Link to={`/filament/${filament.id}`} className="block">
          <div className="flex gap-4">
            {filament.featured_image && (
              <img
                src={filament.featured_image}
                alt={filament.product_title}
                className="w-20 h-20 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{filament.product_title}</h3>
              <p className="text-sm text-muted-foreground">{filament.vendor}</p>
              <div className="flex gap-2 mt-2">
                {filament.material && <Badge variant="secondary">{filament.material}</Badge>}
                {filament.variant_price && filament.net_weight_g && (
                  <Badge variant="outline">
                    ${((filament.variant_price / filament.net_weight_g) * 1000).toFixed(2)}/kg
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Link>
        {showActions && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <LikeButton filamentId={filament.id} size="sm" />
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFilamentForComment(filament.id)}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Comment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Your comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isCommentPrivate}
                      onChange={(e) => setIsCommentPrivate(e.target.checked)}
                      id="private"
                    />
                    <label htmlFor="private" className="text-sm flex items-center gap-1">
                      {isCommentPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {isCommentPrivate ? "Private" : "Public"}
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => addComment.mutate()}>Add Comment</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {!purchases?.some(p => p.filament_id === filament.id) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAsPurchased.mutate(filament.id)}
              >
                <ShoppingBag className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          My Vault
        </h1>
        <p className="text-muted-foreground">Manage your filament collection and projects</p>
      </div>

      <Tabs defaultValue="liked" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="liked" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Liked ({likedFilaments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="purchased" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Purchased ({purchases?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Projects ({projects?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments ({comments?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liked" className="space-y-4">
          {!likedFilaments?.length ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No liked filaments yet. Start exploring and like filaments to save them here!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {likedFilaments.map((fav) => (
                <FilamentCard key={fav.id} filament={fav.filaments} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchased" className="space-y-4">
          {!purchases?.length ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No purchases recorded yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {purchases.map((purchase) => (
                <FilamentCard key={purchase.id} filament={purchase.filaments} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createProject.mutate()}
                  disabled={!newProjectName}
                >
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {!projects?.length ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No projects yet. Create one to organize filaments for specific prints!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{project.name}</CardTitle>
                        {project.description && (
                          <CardDescription>{project.description}</CardDescription>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProject.mutate(project.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.project_filaments?.length ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {project.project_filaments.map((pf: any) => (
                          <div key={pf.id} className="text-sm p-2 border rounded">
                            {pf.filaments?.product_title}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No filaments in this project yet</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {!comments?.length ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No comments yet. Add notes to filaments to track your experience!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {comment.filaments?.product_title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {comment.is_private ? (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Private
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <Globe className="w-3 h-3 mr-1" />
                              Public
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{comment.comment_text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Vault;
