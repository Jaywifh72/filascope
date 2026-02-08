import { useProject } from "@/hooks/useProject";
import { ProjectHeader } from "./ProjectHeader";
import { ProjectMaterials } from "./ProjectMaterials";
import { ProjectAccessories } from "./ProjectAccessories";
import { ProjectLog } from "./ProjectLog";
import { ProjectCostSummary } from "./ProjectCostSummary";

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-32 rounded-lg bg-muted" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} onBack={onBack} onDeleted={onBack} />

      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        <div className="space-y-6">
          <ProjectMaterials
            projectId={project.id}
            materials={project.materials || []}
            accessories={project.accessories || []}
          />
          <ProjectAccessories
            projectId={project.id}
            accessories={project.accessories || []}
          />
          <ProjectLog
            projectId={project.id}
            entries={project.log_entries || []}
          />
        </div>

        <div className="space-y-4">
          <ProjectCostSummary
            project={project}
            materials={project.materials || []}
            accessories={project.accessories || []}
          />
        </div>
      </div>
    </div>
  );
}
