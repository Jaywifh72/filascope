import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Heart,
  ShoppingBag,
  FolderOpen,
  Trash2,
  Plus,
  MessageSquare,
  Lock,
  Globe,
  Link2,
  Grid3X3,
  List,
  ArrowUpDown,
  Filter,
  Bell,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/hooks/useWishlist";
import { useWishlistCollections } from "@/hooks/useWishlistCollections";
import { WishlistItemCard } from "@/components/wishlist/WishlistItem";
import { CollectionTabs } from "@/components/wishlist/CollectionTabs";
import { CollectionDialog } from "@/components/wishlist/CollectionDialog";
import { ShareWishlistDialog } from "@/components/wishlist/ShareWishlistDialog";
import { VaultSkeleton } from "@/components/skeletons/VaultSkeleton";
import { PriceAlertsSection } from "@/components/account/PriceAlertsSection";
import { useDatabasePriceAlerts } from "@/hooks/useDatabasePriceAlerts";
import { ViewHistorySection } from "@/components/account/ViewHistorySection";
import { useBrowseHistory } from "@/hooks/useBrowseHistory";

const Vault = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { items, stats, updateItem, removeFromWishlist, refetch: refetchWishlist } = useWishlist();
  const { collections, createCollection, updateCollection, deleteCollection, refetch: refetchCollections } = useWishlistCollections();
  const { alerts: priceAlerts } = useDatabasePriceAlerts();
  const { history: browseHistory } = useBrowseHistory(20);
  
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isCommentPrivate, setIsCommentPrivate] = useState(false);
  const [selectedFilamentForComment, setSelectedFilamentForComment] = useState<string | null>(null);
  
  // Wishlist state
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"date" | "price" | "name">("date");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Filter and sort wishlist items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by collection
    if (selectedCollectionId) {
      result = result.filter((item) => item.collection_id === selectedCollectionId);
    }

    // Filter by tag
    if (filterTag) {
      result = result.filter((item) => item.tags?.includes(filterTag));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return (a.filament?.variant_price || 0) - (b.filament?.variant_price || 0);
        case "name":
          return (a.filament?.product_title || "").localeCompare(b.filament?.product_title || "");
        case "date":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [items, selectedCollectionId, filterTag, sortBy]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => {
      item.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  }, [items]);

  // Fetch purchases
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
      const { error } = await supabase.from("projects").insert({
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
      const { error } = await supabase.from("projects").delete().eq("id", projectId);

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
      const { error } = await supabase.from("filament_comments").insert({
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

  // Handle batch actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleRemoveSelected = async () => {
    for (const itemId of selectedItems) {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        await removeFromWishlist(item.filament_id);
      }
    }
    setSelectedItems(new Set());
  };

  const handleCreateCollection = async (data: any) => {
    await createCollection(data.name, {
      description: data.description,
      icon: data.icon,
      color: data.color,
    });
    setShowCollectionDialog(false);
    refetchCollections();
  };

  const handleUpdateCollection = async (data: any) => {
    if (editingCollection) {
      await updateCollection(editingCollection.id, data);
      setEditingCollection(null);
      refetchCollections();
    }
  };

  const handleDeleteCollection = async () => {
    if (editingCollection) {
      await deleteCollection(editingCollection.id);
      setEditingCollection(null);
      setSelectedCollectionId(null);
      refetchCollections();
    }
  };

  const handleItemTagAdd = async (itemId: string, tag: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const newTags = [...(item.tags || []), tag];
      await updateItem(itemId, { tags: newTags });
      refetchWishlist();
    }
  };

  const handleItemTagRemove = async (itemId: string, tag: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const newTags = (item.tags || []).filter((t) => t !== tag);
      await updateItem(itemId, { tags: newTags });
      refetchWishlist();
    }
  };

  if (loading) {
    return <VaultSkeleton />;
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
                    ${((filament.variant_price / filament.net_weight_g) * 1000).toFixed(2)} USD/kg
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Link>
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="liked" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Wishlist ({stats.totalItems})
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
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alerts ({priceAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History ({browseHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Wishlist Tab */}
        <TabsContent value="liked" className="space-y-6">
          {/* Collection Tabs */}
          <CollectionTabs
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            totalCount={items.length}
            onSelectCollection={setSelectedCollectionId}
            onCreateCollection={() => setShowCollectionDialog(true)}
          />

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedItems.size > 0
                  ? `${selectedItems.size} selected`
                  : `${filteredItems.length} items`}
              </span>
              {selectedItems.size > 0 && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/compare?ids=${Array.from(selectedItems).join(",")}`}>
                      Add to Compare
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveSelected}
                    className="text-destructive"
                  >
                    Remove Selected
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Tag Filter */}
              {allTags.length > 0 && (
                <Select
                  value={filterTag || "all"}
                  onValueChange={(v) => setFilterTag(v === "all" ? null : v)}
                >
                  <SelectTrigger className="w-36">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        #{tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort */}
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-36">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date Added</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex border border-border rounded-md">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>

              {/* Share Button */}
              <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                <Link2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Items */}
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {selectedCollectionId
                  ? "No items in this collection yet."
                  : "No items in your wishlist yet. Start exploring and like filaments to save them here!"}
              </CardContent>
            </Card>
          ) : viewMode === "list" ? (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  collections={collections}
                  isSelected={selectedItems.has(item.id)}
                  onSelect={(selected) => {
                    const newSet = new Set(selectedItems);
                    if (selected) {
                      newSet.add(item.id);
                    } else {
                      newSet.delete(item.id);
                    }
                    setSelectedItems(newSet);
                  }}
                  onRemove={() => removeFromWishlist(item.filament_id)}
                  onMoveToCollection={(collectionId) => {
                    updateItem(item.id, { collection_id: collectionId });
                    refetchWishlist();
                  }}
                  onAddTag={(tag) => handleItemTagAdd(item.id, tag)}
                  onRemoveTag={(tag) => handleItemTagRemove(item.id, tag)}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <FilamentCard key={item.id} filament={item.filament} showActions={false} />
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
                <Button onClick={() => createProject.mutate()} disabled={!newProjectName}>
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
                        {project.description && <CardDescription>{project.description}</CardDescription>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteProject.mutate(project.id)}>
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
                        <CardTitle className="text-base">{comment.filaments?.product_title}</CardTitle>
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

        <TabsContent value="alerts" className="space-y-4">
          <PriceAlertsSection />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ViewHistorySection />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CollectionDialog
        open={showCollectionDialog || !!editingCollection}
        onOpenChange={(open) => {
          if (!open) {
            setShowCollectionDialog(false);
            setEditingCollection(null);
          }
        }}
        collection={editingCollection}
        onSave={editingCollection ? handleUpdateCollection : handleCreateCollection}
        onDelete={editingCollection ? handleDeleteCollection : undefined}
      />

      <ShareWishlistDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        collections={collections}
      />
    </div>
  );
};

export default Vault;
