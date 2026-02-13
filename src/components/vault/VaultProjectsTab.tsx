import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Plus, Printer } from "lucide-react";
import { format } from "date-fns";
import { VaultEmptyState } from "./VaultEmptyState";
import { ProjectCreateDialog } from "@/components/projects/ProjectCreateDialog";
import { ProjectDetail } from "@/components/projects/ProjectDetail";
import { useProjects, type ProjectStatus } from "@/hooks/useProject";
import { useSearchParams } from "react-router-dom";

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
  single_print: "from-primary/30 to-primary/10",
  multi_part: "from-amber-500/30 to-orange-500/10",
  collection: "from-violet-500/30 to-purple-500/10",
  custom: "from-emerald-500/30 to-teal-500/10",
};

export function VaultProjectsTab() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");

  // Check if URL has a project param for detail view
  const selectedProjectId = searchParams.get("project");

  const { data: projects, isLoading } = useProjects(statusFilter);

  const setSelectedProject = (id: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (id) {
      params.set("project", id);
    } else {
      params.delete("project");
    }
    params.set("tab", "projects");
    setSearchParams(params);
  };

  // Detail view
  if (selectedProjectId) {
    return (
      <ProjectDetail
        projectId={selectedProjectId}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProjectStatus | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : !projects?.length ? (
        <VaultEmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Plan your 3D print builds with materials, costs, and progress tracking."
          actionLabel="Create First Project"
          onAction={() => setCreateOpen(true)}
          tip="💡 Organize filaments by print project to track materials and costs"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project: any) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:border-primary/40 transition-all group overflow-hidden"
              onClick={() => setSelectedProject(project.id)}
            >
              {/* Gradient header */}
              <div
                className={`h-16 bg-gradient-to-r ${
                  GRADIENT_MAP[project.project_type] || GRADIENT_MAP.custom
                } transition-all group-hover:h-20`}
              />
              <CardContent className="p-4 -mt-4">
                <h3 className="font-semibold truncate">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[project.project_type] || project.project_type}
                  </Badge>
                  <Badge
                    className={`text-xs border ${
                      STATUS_COLORS[project.status as ProjectStatus] || STATUS_COLORS.planning
                    }`}
                  >
                    {STATUS_LABELS[project.status as ProjectStatus] || project.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>
                    {project.project_materials?.length || 0} material
                    {(project.project_materials?.length || 0) !== 1 ? "s" : ""}
                  </span>
                  <span>{format(new Date(project.created_at), "MMM d, yyyy")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => setSelectedProject(id)}
      />
    </div>
  );
}
