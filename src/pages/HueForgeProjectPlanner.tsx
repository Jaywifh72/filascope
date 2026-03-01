import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { Breadcrumbs, BreadcrumbSchema } from '@/components/seo';
import { useColorFinderFilaments } from '@/hooks/useColorFinderFilaments';
import { WizardStepIndicator } from '@/components/admin/inventory/wizard/WizardStepIndicator';
import { useProjectPlannerState } from '@/components/hueforge/project-planner/useProjectPlannerState';
import { PlannerStepProjectType } from '@/components/hueforge/project-planner/PlannerStepProjectType';
import { PlannerStepColorCount } from '@/components/hueforge/project-planner/PlannerStepColorCount';
import { PlannerStepPickFilaments } from '@/components/hueforge/project-planner/PlannerStepPickFilaments';
import { PlannerStepReview } from '@/components/hueforge/project-planner/PlannerStepReview';
import { Skeleton } from '@/components/ui/skeleton';

const STEP_LABELS = ['Project Type', 'Colors', 'Filaments', 'Plan'];

export default function HueForgeProjectPlanner() {
  const { state, dispatch, allSlotsFilled, setProjectType } = useProjectPlannerState();
  const { data: allFilaments, isLoading } = useColorFinderFilaments();
  const [searchParams] = useSearchParams();

  // Hydrate from URL params on mount
  useEffect(() => {
    const type = searchParams.get('type');
    if (type && searchParams.get('f1')) {
      const filamentIds: (string | null)[] = [];
      for (let i = 1; i <= 8; i++) {
        filamentIds.push(searchParams.get(`f${i}`));
      }
      const validIds = filamentIds.filter(Boolean);
      if (validIds.length > 0) {
        dispatch({ type: 'SET_PROJECT_TYPE', payload: { projectType: type, colorCount: validIds.length } });
        validIds.forEach((id, i) => {
          dispatch({ type: 'SET_SLOT_FILAMENT', payload: { index: i, filamentId: id } });
        });
        dispatch({ type: 'SET_STEP', payload: 4 });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filaments = (allFilaments ?? []).filter((f) => f.transmission_distance != null);

  const completedSteps = new Set<number>();
  if (state.projectType) completedSteps.add(1);
  if (state.projectType && state.colorCount > 0) completedSteps.add(2);
  if (allSlotsFilled) completedSteps.add(3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DocumentHead
        title="HueForge Project Planner — Build Your Filament Shopping List | FilaScope"
        description="Plan your HueForge multicolor print with our guided wizard. Choose project type, set colors, pick TD-verified filaments, and get a ready-to-buy shopping list."
      />
      <BreadcrumbSchema
        items={[
          { name: 'HueForge TD Database', url: '/hueforge-td-database' },
          { name: 'Project Planner', url: '/hueforge-project-planner' },
        ]}
      />
      <Breadcrumbs
        items={[
          { name: 'HueForge TD Database', url: '/hueforge-td-database' },
          { name: 'Project Planner', url: '/hueforge-project-planner' },
        ]}
        className="max-w-5xl mx-auto px-4 pt-6 pb-1"
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <WizardStepIndicator
          currentStep={state.step}
          totalSteps={4}
          stepLabels={STEP_LABELS}
          completedSteps={completedSteps}
          onStepClick={(step) => {
            if (step <= state.step || completedSteps.has(step - 1) || step === 1) {
              dispatch({ type: 'SET_STEP', payload: step });
            }
          }}
        />

        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-64 mx-auto" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
              </div>
            </div>
          ) : (
            <>
              {state.step === 1 && (
                <PlannerStepProjectType
                  selectedType={state.projectType}
                  onSelect={setProjectType}
                />
              )}
              {state.step === 2 && (
                <PlannerStepColorCount
                  colorCount={state.colorCount}
                  slots={state.slots}
                  customRoles={state.customRoles}
                  onCountChange={(c) => dispatch({ type: 'SET_COLOR_COUNT', payload: c })}
                  onToggleCustom={() => dispatch({ type: 'TOGGLE_CUSTOM_ROLES' })}
                  onSlotUpdate={(i, s) => dispatch({ type: 'UPDATE_SLOT_ROLE', payload: { index: i, slot: s } })}
                  onNext={() => dispatch({ type: 'SET_STEP', payload: 3 })}
                />
              )}
              {state.step === 3 && (
                <PlannerStepPickFilaments
                  slots={state.slots}
                  filaments={filaments}
                  allFilled={allSlotsFilled}
                  onSelectFilament={(i, id) => dispatch({ type: 'SET_SLOT_FILAMENT', payload: { index: i, filamentId: id } })}
                  onNext={() => dispatch({ type: 'SET_STEP', payload: 4 })}
                  onBack={() => dispatch({ type: 'SET_STEP', payload: 2 })}
                />
              )}
              {state.step === 4 && (
                <PlannerStepReview
                  projectType={state.projectType}
                  slots={state.slots}
                  filaments={filaments}
                  onBack={() => dispatch({ type: 'SET_STEP', payload: 3 })}
                  onReset={() => dispatch({ type: 'RESET' })}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
