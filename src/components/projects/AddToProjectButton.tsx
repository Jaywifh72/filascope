import { useState } from "react";
import { FolderPlus, Plus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { useProjects, useProjectMutations } from "@/hooks/useProject";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddToProjectButtonProps {
  filamentId: string;
  productTitle: string;
  className?: string;
}

export function AddToProjectButton({
  filamentId,
  productTitle,
  className,
}: AddToProjectButtonProps) {
  const { user } = useAuth();
  const { data: projects, isLoading } = useProjects("all");
  const { addMaterial, createProject } = useProjectMutations();

  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState("");
  const [quantityMode, setQuantityMode] = useState<"spools" | "grams">("spools");
  const [quantityValue, setQuantityValue] = useState("1");

  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  if (!user) {
    return (
      <Button
        variant="outline"
        className={cn("w-full h-11 text-sm font-medium", className)}
        onClick={() => toast.info("Sign in to add to a project")}
      >
        <FolderPlus className="w-4 h-4 mr-2" />
        Add to Project
      </Button>
    );
  }

  const handleSelectProject = (projectId: string, projectName: string) => {
    setSelectedProjectId(projectId);
    setSelectedProjectName(projectName);
    setQuantityValue("1");
    setQuantityMode("spools");
    setQuantityDialogOpen(true);
  };

  const handleAddToProject = () => {
    if (!selectedProjectId) return;

    const qty = parseInt(quantityValue) || 1;
    addMaterial.mutate(
      {
        project_id: selectedProjectId,
        filament_id: filamentId,
        quantity_grams: quantityMode === "grams" ? qty : undefined,
        quantity_spools: quantityMode === "spools" ? qty : 1,
      },
      {
        onSuccess: () => {
          toast.success(`Added ${productTitle} to '${selectedProjectName}'`);
          setQuantityDialogOpen(false);
        },
      }
    );
  };

  const handleCreateNewProject = () => {
    if (!newProjectName.trim()) return;
    createProject.mutate(
      {
        name: newProjectName.trim(),
        project_type: "single_print",
      },
      {
        onSuccess: (data) => {
          setNewProjectDialogOpen(false);
          handleSelectProject(data.id, newProjectName.trim());
          setNewProjectName("");
        },
      }
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full h-11 text-sm font-medium", className)}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Add to Project
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {isLoading ? (
            <DropdownMenuItem disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </DropdownMenuItem>
          ) : projects && projects.length > 0 ? (
            projects.slice(0, 10).map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => handleSelectProject(p.id, p.name)}
              >
                <FolderPlus className="w-4 h-4 mr-2 text-muted-foreground" />
                {p.name}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled className="text-muted-foreground">
              No projects yet
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setNewProjectDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2 text-primary" />
            <span className="text-primary font-medium">New Project</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quantity Dialog */}
      <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>How much do you need?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Adding <span className="font-medium text-foreground">{productTitle}</span> to{" "}
              <span className="font-medium text-foreground">{selectedProjectName}</span>
            </p>
            <RadioGroup
              value={quantityMode}
              onValueChange={(v) => setQuantityMode(v as "spools" | "grams")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spools" id="spools" />
                <Label htmlFor="spools">Spools</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grams" id="grams" />
                <Label htmlFor="grams">Grams</Label>
              </div>
            </RadioGroup>
            <Input
              type="number"
              min="1"
              value={quantityValue}
              onChange={(e) => setQuantityValue(e.target.value)}
              placeholder={quantityMode === "spools" ? "Number of spools" : "Weight in grams"}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQuantityDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToProject} disabled={addMaterial.isPending}>
              {addMaterial.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Cosplay Helmet"
              className="mt-2"
              onKeyDown={(e) => e.key === "Enter" && handleCreateNewProject()}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNewProject} disabled={createProject.isPending || !newProjectName.trim()}>
              {createProject.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create & Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
