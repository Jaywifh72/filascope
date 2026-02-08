import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { VaultEmptyState } from "./VaultEmptyState";

export function VaultProjectsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

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
      queryClient.invalidateQueries({ queryKey: ["vault-counts"] });
      setNewProjectName("");
      setNewProjectDescription("");
      toast.success("Project created");
    },
    onError: () => toast.error("Failed to create project"),
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["vault-counts"] });
      toast.success("Project deleted");
    },
    onError: () => toast.error("Failed to delete project"),
  });

  return (
    <div className="space-y-4">
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
        <VaultEmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Organize filaments by print project to plan your builds."
          actionLabel="Create First Project"
          onAction={() => {}}
        />
      ) : (
        <div className="grid gap-4">
          {projects.map((project: any) => (
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
    </div>
  );
}
