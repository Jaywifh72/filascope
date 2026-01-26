import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { WizardStepIndicator } from './wizard/WizardStepIndicator';
import { FilamentWizardStep1 } from './wizard/FilamentWizardStep1';
import { FilamentWizardStep2 } from './wizard/FilamentWizardStep2';
import { FilamentWizardStep3 } from './wizard/FilamentWizardStep3';
import { FilamentWizardStep4 } from './wizard/FilamentWizardStep4';
import { FilamentWizardStep5 } from './wizard/FilamentWizardStep5';
import { useCreateFilament } from '@/hooks/useCreateFilament';

const WIZARD_STORAGE_KEY = 'add-filament-wizard-progress';
const STORAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const wizardSchema = z.object({
  // Step 1: Source
  product_url: z.string().url('Invalid URL').min(1, 'Product URL is required'),
  vendor: z.string().min(1, 'Brand/Vendor is required'),
  source_type: z.enum(['manufacturer', 'retailer', 'amazon', 'other']),

  // Step 2: Basic Info
  product_title: z.string().min(1, 'Display name is required').max(255),
  material: z.string().optional(),
  diameter: z.enum(['1.75', '2.85']),
  net_weight_g: z.coerce.number().min(0).default(1000),
  color_name: z.string().max(100).optional(),
  color_hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional()
    .or(z.literal('')),

  // Step 3: Pricing
  msrp: z.coerce.number().min(0.01, 'MSRP must be greater than 0'),
  variant_price: z.coerce.number().min(0).optional(),
  variant_compare_at_price: z.coerce.number().min(0).optional(),

  // Step 4: Details
  featured_image: z.string().url('Invalid URL').optional().or(z.literal('')),
  nozzle_temp_min_c: z.coerce.number().min(150).max(500).optional(),
  nozzle_temp_max_c: z.coerce.number().min(150).max(500).optional(),
  bed_temp_min_c: z.coerce.number().min(0).max(150).optional(),
  bed_temp_max_c: z.coerce.number().min(0).max(150).optional(),
  admin_notes: z.string().max(1000).optional(),
});

export type WizardFormValues = z.infer<typeof wizardSchema>;

const STEP_LABELS = ['Source', 'Basic', 'Pricing', 'Details', 'Review'];
const TOTAL_STEPS = 5;

// Validation fields per step
const STEP_FIELDS: Record<number, (keyof WizardFormValues)[]> = {
  1: ['product_url', 'vendor', 'source_type'],
  2: ['product_title', 'material', 'diameter', 'net_weight_g', 'color_name', 'color_hex'],
  3: ['msrp', 'variant_price', 'variant_compare_at_price'],
  4: ['featured_image', 'nozzle_temp_min_c', 'nozzle_temp_max_c', 'bed_temp_min_c', 'bed_temp_max_c', 'admin_notes'],
  5: [],
};

interface AddFilamentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (filamentId: string) => void;
}

export function AddFilamentWizard({
  open,
  onOpenChange,
  onSuccess,
}: AddFilamentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [savedData, setSavedData] = useState<{ data: WizardFormValues; step: number } | null>(null);

  const createFilament = useCreateFilament();

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      product_url: '',
      vendor: '',
      source_type: 'manufacturer',
      product_title: '',
      material: '',
      diameter: '1.75',
      net_weight_g: 1000,
      color_name: '',
      color_hex: '',
      msrp: 0,
      variant_price: undefined,
      variant_compare_at_price: undefined,
      featured_image: '',
      nozzle_temp_min_c: undefined,
      nozzle_temp_max_c: undefined,
      bed_temp_min_c: undefined,
      bed_temp_max_c: undefined,
      admin_notes: '',
    },
    mode: 'onChange',
  });

  // Check for saved progress on mount
  useEffect(() => {
    if (open) {
      const saved = sessionStorage.getItem(WIZARD_STORAGE_KEY);
      if (saved) {
        try {
          const { data, step, timestamp } = JSON.parse(saved);
          if (Date.now() - timestamp < STORAGE_MAX_AGE_MS) {
            setSavedData({ data, step });
            setShowRestorePrompt(true);
          } else {
            sessionStorage.removeItem(WIZARD_STORAGE_KEY);
          }
        } catch {
          sessionStorage.removeItem(WIZARD_STORAGE_KEY);
        }
      }
    }
  }, [open]);

  // Save progress on form change
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (form.formState.isDirty && open) {
        sessionStorage.setItem(
          WIZARD_STORAGE_KEY,
          JSON.stringify({
            data: values,
            step: currentStep,
            timestamp: Date.now(),
          })
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [form, currentStep, open]);

  const handleRestore = () => {
    if (savedData) {
      form.reset(savedData.data);
      setCurrentStep(savedData.step);
    }
    setShowRestorePrompt(false);
    setSavedData(null);
  };

  const handleDiscardSaved = () => {
    sessionStorage.removeItem(WIZARD_STORAGE_KEY);
    setShowRestorePrompt(false);
    setSavedData(null);
  };

  const handleClose = useCallback(() => {
    if (form.formState.isDirty) {
      setShowCloseConfirm(true);
    } else {
      resetAndClose();
    }
  }, [form.formState.isDirty]);

  const resetAndClose = () => {
    form.reset();
    setCurrentStep(1);
    sessionStorage.removeItem(WIZARD_STORAGE_KEY);
    onOpenChange(false);
  };

  const validateCurrentStep = async () => {
    const fields = STEP_FIELDS[currentStep];
    if (fields.length === 0) return true;
    const result = await form.trigger(fields);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleGoToStep = (step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS && step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleCreate = async (addAnother = false) => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    const insertData = {
      product_url: values.product_url,
      vendor: values.vendor,
      source_type: values.source_type,
      product_title: values.product_title,
      material: values.material,
      diameter: values.diameter,
      net_weight_g: values.net_weight_g,
      color_name: values.color_name,
      color_hex: values.color_hex,
      msrp: values.msrp,
      variant_price: values.variant_price,
      variant_compare_at_price: values.variant_compare_at_price,
      featured_image: values.featured_image,
      nozzle_temp_min_c: values.nozzle_temp_min_c,
      nozzle_temp_max_c: values.nozzle_temp_max_c,
      bed_temp_min_c: values.bed_temp_min_c,
      bed_temp_max_c: values.bed_temp_max_c,
      admin_notes: values.admin_notes,
    };
    createFilament.mutate(insertData, {
      onSuccess: (result) => {
        sessionStorage.removeItem(WIZARD_STORAGE_KEY);
        onSuccess?.(result.id);
        if (addAnother) {
          form.reset();
          setCurrentStep(1);
        } else {
          resetAndClose();
        }
      },
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <FilamentWizardStep1 form={form} />;
      case 2:
        return <FilamentWizardStep2 form={form} />;
      case 3:
        return <FilamentWizardStep3 form={form} />;
      case 4:
        return <FilamentWizardStep4 form={form} />;
      case 5:
        return <FilamentWizardStep5 form={form} onGoToStep={handleGoToStep} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open && !showRestorePrompt} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Filament</DialogTitle>
          </DialogHeader>

          <WizardStepIndicator
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            stepLabels={STEP_LABELS}
            onStepClick={handleGoToStep}
          />

          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {renderStepContent()}

              <div className="flex justify-between pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  Back
                </Button>

                <div className="flex gap-2">
                  {currentStep < TOTAL_STEPS ? (
                    <Button type="button" onClick={handleNext}>
                      Next
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleCreate(true)}
                        disabled={createFilament.isPending}
                      >
                        {createFilament.isPending && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Create & Add Another
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleCreate(false)}
                        disabled={createFilament.isPending}
                      >
                        {createFilament.isPending && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Create Filament
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Your progress will be saved and you can resume later.
              Are you sure you want to close?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={resetAndClose}>
              Discard & Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Progress Prompt */}
      <AlertDialog open={showRestorePrompt} onOpenChange={setShowRestorePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Previous Progress?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved progress from a previous session. Would you like to continue
              where you left off?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardSaved}>
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Resume Progress
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
