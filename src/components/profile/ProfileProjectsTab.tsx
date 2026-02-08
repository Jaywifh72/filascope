import { Link } from "react-router-dom";
import { Layers, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PublicProject } from "@/hooks/usePublicProfile";

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-amber-500/20 text-amber-400",
  completed: "bg-green-500/20 text-green-400",
  archived: "bg-muted text-muted-foreground",
};

const TYPE_LABELS: Record<string, string> = {
  single_print: "Single Print",
  multi_part: "Multi-Part",
  collection: "Collection",
  custom: "Custom",
};

interface ProfileProjectsTabProps {
  projects: PublicProject[];
}

export function ProfileProjectsTab({ projects }: ProfileProjectsTabProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No public projects yet</p>
        <p className="text-sm mt-1">Projects will appear here when shared publicly.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: PublicProject }) {
  const statusClass = STATUS_COLORS[project.status] || STATUS_COLORS.planning;

  return (
    <Link
      to={`/vault?tab=projects&project=${project.id}`}
      className="group rounded-lg border border-border/50 bg-card/50 overflow-hidden hover:border-primary/50 transition-colors"
    >
      {/* Cover */}
      <div className="aspect-[3/2] bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-primary/20" />
          </div>
        )}
        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
            {TYPE_LABELS[project.project_type] || project.project_type}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="font-medium text-sm truncate">{project.name}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusClass}`}>
            {project.status.replace("_", " ")}
          </span>
          {project.material_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="w-3 h-3" />
              {project.material_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
