import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Share2,
  Copy,
  Trash2,
  Pencil,
  Check,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import type { Project, ProjectStatus } from "@/hooks/useProject";
import { useProjectMutations } from "@/hooks/useProject";

interface ProjectHeaderProps {
  project: Project;
  onBack: () => void;
  onDeleted: () => void;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};

const TYPE_LABELS: Record<string, string> = {
  single_print: "Single Print",
  multi_part: "Multi-Part",
  collection: "Collection",
  custom: "Custom",
};

const GRADIENT_MAP: Record<string, string> = {
  single_print: "from-primary/20 to-primary/5",
  multi_part: "from-amber-500/20 to-orange-500/5",
  collection: "from-violet-500/20 to-purple-500/5",
  custom: "from-emerald-500/20 to-teal-500/5",
};

export function ProjectHeader({ project, onBack, onDeleted }: ProjectHeaderProps) {
  const { updateProject, deleteProject, duplicateProject } = useProjectMutations();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);

  const handleSaveName = () => {
    if (editName.trim() && editName !== project.name) {
      updateProject.mutate({ id: project.id, name: editName.trim() });
    }
    setEditing(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/vault?tab=projects&project=${project.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Project link copied to clipboard");
  };

  const handleDelete = () => {
    deleteProject.mutate(project.id, { onSuccess: onDeleted });
  };

  const handleDuplicate = () => {
    duplicateProject.mutate(project.id);
  };

  return (
    <div className="space-y-4">
      {/* Cover gradient */}
      <div
        className={`h-24 rounded-xl bg-gradient-to-r ${
          GRADIENT_MAP[project.project_type] || GRADIENT_MAP.custom
        } flex items-end p-4`}
      >
        <Button variant="ghost" size="sm" onClick={onBack} className="text-foreground/80">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Projects
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xl font-bold"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <Button size="sm" onClick={handleSaveName}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold truncate">{project.name}</h2>
              <Button variant="ghost" size="sm" onClick={() => { setEditName(project.name); setEditing(true); }}>
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
          )}

          {project.description && (
            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {TYPE_LABELS[project.project_type] || project.project_type}
            </Badge>
            <Badge className={`text-xs border ${STATUS_COLORS[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </Badge>
            {project.printer && (
              <Badge variant="outline" className="text-xs">
                <Printer className="w-3 h-3 mr-1" />
                {project.printer.model_name}
              </Badge>
            )}
            {project.is_public && (
              <Badge variant="outline" className="text-xs text-primary border-primary/30">
                Public
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={project.status}
            onValueChange={(v) =>
              updateProject.mutate({ id: project.id, status: v as ProjectStatus })
            }
          >
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="w-4 h-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{project.name}" and all its materials, accessories, and log entries.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
