import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { HUEFORGE_TOOLS } from "./HueForgeToolsData";

export function HueForgeToolsCrossLinks() {
  const { pathname } = useLocation();
  const otherTools = HUEFORGE_TOOLS.filter((t) => t.href !== pathname);

  return (
    <section className="mt-16 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Other HueForge Tools</h2>
        <Link to="/hueforge-tools" className="text-sm text-primary hover:underline flex items-center gap-1">
          All Tools <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {otherTools.slice(0, 5).map((tool) => (
          <Link
            key={tool.key}
            to={tool.href}
            className={`group p-3 rounded-lg border border-border hover:border-primary/40 bg-card/50 hover:bg-muted/50 transition-all border-l-2 ${tool.accentClass}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <tool.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium group-hover:text-primary transition-colors">{tool.shortName}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{tool.shortDescription}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
