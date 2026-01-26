import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { PrinterWizardStep4Regional } from './wizard/PrinterWizardStep4Regional';
import { PrinterWizardStep5Pricing } from './wizard/PrinterWizardStep5Pricing';
import { PrinterWizardStep6Details } from './wizard/PrinterWizardStep6Details';
import { PrinterWizardStep7Review } from './wizard/PrinterWizardStep7Review';
import { useCreatePrinter } from '@/hooks/useCreatePrinter';
import { useSaveRegionalUrls, useSaveRegionalPrices } from '@/hooks/useRegionalMutations';
import { RegionCode, CurrencyCode } from '@/types/regional';

const WIZARD_STORAGE_KEY = 'add-printer-wizard-progress';
const STORAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Regional URL schema
const regionalUrlSchema = z.object({
  region_code: z.string(),
  store_url: z.string().optional().default(''),
  store_name: z.string().optional().default(''),
  currency_code: z.string().default('USD'),
  is_primary: z.boolean().default(false),
  is_verified: z.boolean().default(false),
});

// Regional MSRP schema
const regionalMsrpSchema = z.object({
  region_code: z.string(),
  currency_code: z.string(),
  msrp: z.number().nullable(),
});

const printerWizardSchema = z.object({
  // Step 1: Source
  product_url: z.string().url('Invalid URL').min(1, 'Product URL is required'),
  vendor: z.string().min(1, 'Brand/Vendor is required'),
  source_type: z.enum(['manufacturer', 'retailer', 'amazon', 'other']),
  detected_region: z.string().optional(),

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

  // Step 4: Regional URLs
  regional_urls: z.array(regionalUrlSchema).optional().default([]),

  // Step 5: Pricing
  msrp: z.coerce.number().min(0.01, 'MSRP must be greater than 0'),
  current_price: z.coerce.number().min(0).optional(),
  compare_at_price: z.coerce.number().min(0).optional(),
  regional_msrps: z.array(regionalMsrpSchema).optional().default([]),
  sync_after_create: z.boolean().optional().default(false),

  // Step 6: Details
  description: z.string().max(2000).optional(),
  image_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  specifications: z.record(z.string()).optional(),
  admin_notes: z.string().max(1000).optional(),
});

export type PrinterWizardFormValues = z.infer<typeof printerWizardSchema>;

const STEP_LABELS = ['Source', 'Basic', 'Features', 'Regional URLs', 'Pricing', 'Details', 'Review'];
const TOTAL_STEPS = 7;

// Validation fields per step
const STEP_FIELDS: Record<number, (keyof PrinterWizardFormValues)[]> = {
  1: ['product_url', 'vendor', 'source_type'],
  2: ['model_name', 'printer_type', 'build_volume_x', 'build_volume_y', 'build_volume_z', 'max_print_speed'],
  3: ['connectivity', 'features', 'filament_compatibility'],
  4: ['regional_urls'],
  5: ['msrp', 'current_price', 'compare_at_price'],
  6: ['description', 'image_url', 'specifications', 'admin_notes'],
  7: [],
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
  const saveRegionalUrls = useSaveRegionalUrls();
  const saveRegionalPrices = useSaveRegionalPrices();

  const form = useForm<PrinterWizardFormValues>({
    resolver: zodResolver(printerWizardSchema),
    defaultValues: {
      product_url: '',
      vendor: '',
      source_type: 'manufacturer',
      detected_region: undefined,
      model_name: '',
      printer_type: '',
      build_volume_x: undefined,
      build_volume_y: undefined,
      build_volume_z: undefined,
      max_print_speed: undefined,
      connectivity: [],
      features: [],
      filament_compatibility: [],
      regional_urls: [],
      msrp: 0,
      current_price: undefined,
      compare_at_price: undefined,
      regional_msrps: [],
      sync_after_create: false,
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
    const regionalUrls = values.regional_urls || [];
    
    // Build available regions array
    const availableRegions: string[] = [];
    if (values.detected_region) {
      availableRegions.push(values.detected_region);
    }
    regionalUrls.forEach((u) => {
      if (u.store_url && !availableRegions.includes(u.region_code)) {
        availableRegions.push(u.region_code);
      }
    });

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
      onSuccess: async (result) => {
        sessionStorage.removeItem(WIZARD_STORAGE_KEY);

        // Save regional URLs if any configured
        const allUrls = [
          // Primary URL
          ...(values.detected_region ? [{
            product_id: result.id,
            product_type: 'printer' as const,
            region_code: values.detected_region as RegionCode,
            store_url: values.product_url,
            store_name: values.vendor,
            currency_code: 'USD' as CurrencyCode,
            is_primary: true,
            is_verified: true,
          }] : []),
          // Additional regional URLs
          ...regionalUrls.filter((u) => u.store_url).map((u) => ({
            product_id: result.id,
            product_type: 'printer' as const,
            region_code: u.region_code as RegionCode,
            store_url: u.store_url || '',
            store_name: u.store_name || '',
            currency_code: (u.currency_code || 'USD') as CurrencyCode,
            is_primary: u.is_primary,
            is_verified: u.is_verified,
          })),
        ];

        if (allUrls.length > 0) {
          try {
            await saveRegionalUrls.mutateAsync({
              productId: result.id,
              productType: 'printer',
              urls: allUrls,
            });
          } catch (err) {
            console.error('Failed to save regional URLs:', err);
          }
        }

        // Save regional prices if any configured
        const regionalMsrps = values.regional_msrps || [];
        if (regionalMsrps.length > 0) {
          try {
            await saveRegionalPrices.mutateAsync({
              productId: result.id,
              productType: 'printer',
              prices: regionalMsrps.filter((p) => p.msrp != null).map((p) => ({
                product_id: result.id,
                product_type: 'printer' as const,
                region_code: p.region_code as RegionCode,
                currency_code: p.currency_code as CurrencyCode,
                msrp: p.msrp,
                current_price: null,
              })),
            });
          } catch (err) {
            console.error('Failed to save regional prices:', err);
          }
        }

        // Show sync message if requested
        if (values.sync_after_create) {
          toast.info('Price sync queued for configured regions');
        }

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
        return <PrinterWizardStep4Regional form={form} />;
      case 5:
        return <PrinterWizardStep5Pricing form={form} />;
      case 6:
        return <PrinterWizardStep6Details form={form} />;
      case 7:
        return <PrinterWizardStep7Review form={form} onGoToStep={handleGoToStep} />;
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
