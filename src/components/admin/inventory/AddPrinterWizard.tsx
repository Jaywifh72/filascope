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
import { PrinterWizardStep1 } from './wizard/PrinterWizardStep1';
import { PrinterWizardStep2 } from './wizard/PrinterWizardStep2';
import { PrinterWizardStep3 } from './wizard/PrinterWizardStep3';
import { PrinterWizardStep4 } from './wizard/PrinterWizardStep4';
import { PrinterWizardStep5 } from './wizard/PrinterWizardStep5';
import { PrinterWizardStep6 } from './wizard/PrinterWizardStep6';
import { useCreatePrinter } from '@/hooks/useCreatePrinter';

const WIZARD_STORAGE_KEY = 'add-printer-wizard-progress';
const STORAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const printerWizardSchema = z.object({
  // Step 1: Source
  product_url: z.string().url('Invalid URL').min(1, 'Product URL is required'),
  vendor: z.string().min(1, 'Brand/Vendor is required'),
  source_type: z.enum(['manufacturer', 'retailer', 'amazon', 'other']),

  // Step 2: Basic Info
  model_name: z.string().min(1, 'Display name is required').max(255),
  printer_type: z.string().min(1, 'Printer type is required'),
  build_volume_x: z.coerce.number().min(0).optional(),
  build_volume_y: z.coerce.number().min(0).optional(),
  build_volume_z: z.coerce.number().min(0).optional(),
  max_print_speed: z.coerce.number().min(0).optional(),

  // Step 3: Features & Connectivity
  connectivity: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  filament_compatibility: z.array(z.string()).default([]),

  // Step 4: Pricing
  msrp: z.coerce.number().min(0.01, 'MSRP must be greater than 0'),
  current_price: z.coerce.number().min(0).optional(),
  compare_at_price: z.coerce.number().min(0).optional(),

  // Step 5: Details
  description: z.string().max(2000).optional(),
  image_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  specifications: z.record(z.string()).optional(),
  admin_notes: z.string().max(1000).optional(),
});

export type PrinterWizardFormValues = z.infer<typeof printerWizardSchema>;

const STEP_LABELS = ['Source', 'Basic', 'Features', 'Pricing', 'Details', 'Review'];
const TOTAL_STEPS = 6;

// Validation fields per step
const STEP_FIELDS: Record<number, (keyof PrinterWizardFormValues)[]> = {
  1: ['product_url', 'vendor', 'source_type'],
  2: ['model_name', 'printer_type', 'build_volume_x', 'build_volume_y', 'build_volume_z', 'max_print_speed'],
  3: ['connectivity', 'features', 'filament_compatibility'],
  4: ['msrp', 'current_price', 'compare_at_price'],
  5: ['description', 'image_url', 'specifications', 'admin_notes'],
  6: [],
};

interface AddPrinterWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (printerId: string) => void;
}

export function AddPrinterWizard({
  open,
  onOpenChange,
  onSuccess,
}: AddPrinterWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [savedData, setSavedData] = useState<{ data: PrinterWizardFormValues; step: number } | null>(null);

  const createPrinter = useCreatePrinter();

  const form = useForm<PrinterWizardFormValues>({
    resolver: zodResolver(printerWizardSchema),
    defaultValues: {
      product_url: '',
      vendor: '',
      source_type: 'manufacturer',
      model_name: '',
      printer_type: '',
      build_volume_x: undefined,
      build_volume_y: undefined,
      build_volume_z: undefined,
      max_print_speed: undefined,
      connectivity: [],
      features: [],
      filament_compatibility: [],
      msrp: 0,
      current_price: undefined,
      compare_at_price: undefined,
      description: '',
      image_url: '',
      specifications: {},
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
      model_name: values.model_name,
      printer_type: values.printer_type,
      build_volume_x_mm: values.build_volume_x,
      build_volume_y_mm: values.build_volume_y,
      build_volume_z_mm: values.build_volume_z,
      max_print_speed_mm_s: values.max_print_speed,
      connectivity: values.connectivity,
      features: values.features,
      filament_compatibility: values.filament_compatibility,
      msrp_usd: values.msrp,
      current_price_usd: values.current_price,
      compare_at_price_usd: values.compare_at_price,
      description: values.description,
      image_url: values.image_url,
      specifications: values.specifications,
      admin_notes: values.admin_notes,
    };

    createPrinter.mutate(insertData, {
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
        return <PrinterWizardStep1 form={form} />;
      case 2:
        return <PrinterWizardStep2 form={form} />;
      case 3:
        return <PrinterWizardStep3 form={form} />;
      case 4:
        return <PrinterWizardStep4 form={form} />;
      case 5:
        return <PrinterWizardStep5 form={form} />;
      case 6:
        return <PrinterWizardStep6 form={form} onGoToStep={handleGoToStep} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open && !showRestorePrompt} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Printer</DialogTitle>
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
                        disabled={createPrinter.isPending}
                      >
                        {createPrinter.isPending && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Create & Add Another
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleCreate(false)}
                        disabled={createPrinter.isPending}
                      >
                        {createPrinter.isPending && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Create Printer
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
