import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Pencil, Check } from "lucide-react";
import { useRegion } from "@/contexts/RegionContext";
import { useProjectMutations } from "@/hooks/useProject";
import type { Project, ProjectMaterial, ProjectAccessory } from "@/hooks/useProject";
import { useProjectCost } from "@/hooks/useProjectCost";

interface ProjectCostSummaryProps {
  project: Project;
  materials: ProjectMaterial[];
  accessories: ProjectAccessory[];
}

export function ProjectCostSummary({ project, materials, accessories }: ProjectCostSummaryProps) {
  const { formatPrice, currency } = useRegion();
  const { updateProject } = useProjectMutations();
  const costData = useProjectCost(materials, accessories);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(project.budget?.toString() || "");

  const handleSaveBudget = () => {
    const val = budgetInput ? Number(budgetInput) : null;
    updateProject.mutate({
      id: project.id,
      budget: val as any,
      budget_currency: val ? currency : null,
    });
    setEditingBudget(false);
  };

  const budgetProgress =
    project.budget && project.budget > 0
      ? Math.min((costData.totalCost / project.budget) * 100, 100)
      : null;

  const isOverBudget = project.budget ? costData.totalCost > project.budget : false;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Cost Summary
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Materials ({materials.length})</span>
          <span>{formatPrice(costData.materialsCost)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Accessories ({accessories.length})</span>
          <span>{formatPrice(costData.accessoriesCost)}</span>
        </div>
        <div className="border-t border-border pt-2">
          <div className="flex justify-between text-sm font-semibold">
            <span>Total Estimated</span>
            <span className="text-primary">{formatPrice(costData.totalCost)}</span>
          </div>
        </div>

        {costData.hasUnavailablePrices && (
          <p className="text-xs text-muted-foreground italic">
            Some filament prices are unavailable and excluded from the total
          </p>
        )}

        {/* Budget */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Budget</span>
            {editingBudget ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-24 h-7 text-xs"
                  placeholder="Amount"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSaveBudget}>
                  <Check className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBudgetInput(project.budget?.toString() || "");
                  setEditingBudget(true);
                }}
                className="text-xs h-7"
              >
                {project.budget ? formatPrice(project.budget) : "Set budget"}
                <Pencil className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>

          {budgetProgress !== null && (
            <div className="space-y-1">
              <Progress
                value={budgetProgress}
                className={`h-2 ${isOverBudget ? "[&>div]:bg-destructive" : ""}`}
              />
              <p className={`text-xs ${isOverBudget ? "text-destructive" : "text-muted-foreground"}`}>
                {Math.round(budgetProgress)}% of budget used
                {isOverBudget && " — over budget!"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
