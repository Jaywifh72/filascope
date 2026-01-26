import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, RotateCcw, ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useUpdateFilament, useUpdatePrinter } from '@/hooks/useProductMutations';
import { useSaveRegionalUrls, useSaveRegionalPrices, useFetchRegionalData } from '@/hooks/useRegionalMutations';
import { RegionalUrlEditor, RegionalUrlData } from './RegionalUrlEditor';
import { RegionalPriceEditor, RegionalPriceData } from './RegionalPriceEditor';
import { RegionCode, CurrencyCode } from '@/types/regional';

const MATERIALS = ['PLA', 'ABS', 'PETG', 'TPU', 'ASA', 'Nylon', 'PC', 'PVA', 'HIPS', 'Carbon Fiber', 'Wood', 'Metal', 'Other'];
const DIAMETERS = ['1.75mm', '2.85mm'];

const baseSchema = {
  display_name: z.string().min(1, 'Display name is required').max(255),
  product_url: z.string().url('Invalid URL').or(z.literal('')).optional(),
  msrp: z.coerce.number().min(0, 'Must be positive').nullable().optional(),
  current_price: z.coerce.number().min(0, 'Must be positive').nullable().optional(),
  image_url: z.string().url('Invalid URL').or(z.literal('')).optional(),
  sync_enabled: z.boolean().optional(),
  admin_notes: z.string().max(1000).optional(),
};

const filamentSchema = z.object({
  ...baseSchema,
  material: z.string().optional(),
  diameter: z.string().optional(),
  weight_grams: z.coerce.number().min(0).nullable().optional(),
  color_name: z.string().max(100).optional(),
});

const printerSchema = z.object({
  ...baseSchema,
  build_volume: z.string().max(100).optional(),
  max_print_speed: z.coerce.number().min(0).nullable().optional(),
});

type FilamentFormData = z.infer<typeof filamentSchema>;
type PrinterFormData = z.infer<typeof printerSchema>;

export interface FilamentProduct {
  id: string;
  display_name: string | null;
  product_title: string;
  product_url: string | null;
  msrp: number | null;
  variant_price: number | null;
  material: string | null;
  diameter: string | null;
  weight_grams: number | null;
  color_name: string | null;
  image_url: string | null;
  sync_enabled?: boolean;
  admin_notes?: string | null;
}

export interface PrinterProduct {
  id: string;
  display_name: string | null;
  model_name: string;
  official_product_url: string | null;
  msrp_usd: number | null;
  current_price_usd_store: number | null;
  image_url: string | null;
  build_volume: string | null;
  max_print_speed_mm_s: number | null;
  sync_enabled?: boolean;
  admin_notes?: string | null;
}

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: FilamentProduct | PrinterProduct | null;
  type: 'filament' | 'printer';
}

export function EditProductModal({
  open,
  onOpenChange,
  product,
  type,
}: EditProductModalProps) {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [regionalUrls, setRegionalUrls] = useState<RegionalUrlData[]>([]);
  const [regionalPrices, setRegionalPrices] = useState<RegionalPriceData[]>([]);
  const [isLoadingRegional, setIsLoadingRegional] = useState(false);

  const updateFilament = useUpdateFilament();
  const updatePrinter = useUpdatePrinter();
  const saveRegionalUrls = useSaveRegionalUrls();
  const saveRegionalPrices = useSaveRegionalPrices();

  const isFilament = type === 'filament';
  const filamentProduct = product as FilamentProduct | null;
  const printerProduct = product as PrinterProduct | null;

  const { fetchUrls, fetchPrices } = useFetchRegionalData(product?.id || null, type);

  const form = useForm<FilamentFormData | PrinterFormData>({
    resolver: zodResolver(isFilament ? filamentSchema : printerSchema),
    defaultValues: getDefaultValues(),
  });

  function getDefaultValues(): FilamentFormData | PrinterFormData {
    if (!product) {
      return isFilament
        ? { display_name: '', material: '', diameter: '1.75mm', sync_enabled: true }
        : { display_name: '', sync_enabled: true };
    }

    if (isFilament && filamentProduct) {
      return {
        display_name: filamentProduct.display_name || filamentProduct.product_title || '',
        product_url: filamentProduct.product_url || '',
        msrp: filamentProduct.msrp,
        current_price: filamentProduct.variant_price,
        image_url: filamentProduct.image_url || '',
        sync_enabled: filamentProduct.sync_enabled ?? true,
        admin_notes: filamentProduct.admin_notes || '',
        material: filamentProduct.material || '',
        diameter: filamentProduct.diameter || '1.75mm',
        weight_grams: filamentProduct.weight_grams,
        color_name: filamentProduct.color_name || '',
      };
    }

    if (!isFilament && printerProduct) {
      return {
        display_name: printerProduct.display_name || printerProduct.model_name || '',
        product_url: printerProduct.official_product_url || '',
        msrp: printerProduct.msrp_usd,
        current_price: printerProduct.current_price_usd_store,
        image_url: printerProduct.image_url || '',
        sync_enabled: printerProduct.sync_enabled ?? true,
        admin_notes: printerProduct.admin_notes || '',
        build_volume: printerProduct.build_volume || '',
        max_print_speed: printerProduct.max_print_speed_mm_s,
      };
    }

    return { display_name: '' };
  }

  // Load regional data when modal opens
  useEffect(() => {
    if (open && product?.id) {
      setIsLoadingRegional(true);
      setActiveTab('basic');
      
      Promise.all([fetchUrls(), fetchPrices()])
        .then(([urls, prices]) => {
          setRegionalUrls(
            urls.map((u: any) => ({
              id: u.id,
              region_code: u.region_code as RegionCode,
              store_url: u.store_url || '',
              store_name: u.store_name || '',
              currency_code: u.currency_code as CurrencyCode,
              is_primary: u.is_primary || false,
              is_verified: u.is_verified || false,
            }))
          );
          setRegionalPrices(
            prices.map((p: any) => ({
              id: p.id,
              region_code: p.region_code as RegionCode,
              currency_code: p.currency_code as CurrencyCode,
              current_price: p.current_price,
              msrp: p.msrp,
              compare_at_price: p.compare_at_price,
              last_sync_at: p.last_sync_at,
              last_sync_status: p.last_sync_status,
              last_sync_error: p.last_sync_error,
            }))
          );
        })
        .finally(() => setIsLoadingRegional(false));
    } else if (!open) {
      setRegionalUrls([]);
      setRegionalPrices([]);
    }
  }, [open, product?.id]);

  useEffect(() => {
    if (product) {
      form.reset(getDefaultValues());
    }
  }, [product, type]);

  const handleClose = () => {
    if (form.formState.isDirty) {
      setPendingClose(true);
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const confirmClose = () => {
    setShowUnsavedDialog(false);
    setPendingClose(false);
    form.reset();
    onOpenChange(false);
  };

  const cancelClose = () => {
    setShowUnsavedDialog(false);
    setPendingClose(false);
  };

  const handleReset = () => {
    form.reset(getDefaultValues());
    toast.info('Form reset to original values');
  };

  const handleSaveRegionalUrls = async () => {
    if (!product) return;
    
    await saveRegionalUrls.mutateAsync({
      productId: product.id,
      productType: type,
      urls: regionalUrls.map((u) => ({
        product_id: product.id,
        product_type: type,
        region_code: u.region_code,
        store_url: u.store_url,
        store_name: u.store_name,
        currency_code: u.currency_code,
        is_primary: u.is_primary,
        is_verified: u.is_verified,
      })),
    });
  };

  const handleSaveRegionalPrices = async () => {
    if (!product) return;
    
    await saveRegionalPrices.mutateAsync({
      productId: product.id,
      productType: type,
      prices: regionalPrices
        .filter((p) => p.current_price != null || p.msrp != null)
        .map((p) => ({
          product_id: product.id,
          product_type: type,
          region_code: p.region_code,
          currency_code: p.currency_code,
          current_price: p.current_price,
          msrp: p.msrp,
          compare_at_price: p.compare_at_price,
        })),
    });
  };

  const onSubmit = async (data: FilamentFormData | PrinterFormData) => {
    if (!product) return;

    try {
      if (isFilament) {
        const filamentData = data as FilamentFormData;
        await updateFilament.mutateAsync({
          id: product.id,
          display_name: filamentData.display_name,
          product_url: filamentData.product_url || undefined,
          msrp: filamentData.msrp ?? undefined,
          variant_price: filamentData.current_price ?? undefined,
          material: filamentData.material || undefined,
          diameter: filamentData.diameter || undefined,
          weight_grams: filamentData.weight_grams ?? undefined,
          color_name: filamentData.color_name || undefined,
          image_url: filamentData.image_url || undefined,
          sync_enabled: filamentData.sync_enabled,
          admin_notes: filamentData.admin_notes || undefined,
        });
      } else {
        const printerData = data as PrinterFormData;
        await updatePrinter.mutateAsync({
          id: product.id,
          display_name: printerData.display_name,
          official_product_url: printerData.product_url || undefined,
          msrp_usd: printerData.msrp ?? undefined,
          current_price_usd_store: printerData.current_price ?? undefined,
          build_volume: (printerData as any).build_volume || undefined,
          max_print_speed_mm_s: (printerData as any).max_print_speed ?? undefined,
          image_url: printerData.image_url || undefined,
          sync_enabled: printerData.sync_enabled,
          admin_notes: printerData.admin_notes || undefined,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const isSaving = updateFilament.isPending || updatePrinter.isPending || saveRegionalUrls.isPending || saveRegionalPrices.isPending;
  const imageUrl = form.watch('image_url');
  const configuredRegions = regionalUrls.map((u) => u.region_code);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {isFilament ? 'Filament' : 'Printer'}
            </DialogTitle>
            <DialogDescription>
              Update product information. Changes will be visible across the site.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="regional-urls">Regional URLs</TabsTrigger>
              <TabsTrigger value="regional-prices">Regional Prices</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Basic Information
                </h3>
                
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Product display name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="product_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product URL</FormLabel>
                      <FormControl>
                        <Input {...field} type="url" placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="msrp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MSRP ($)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="current_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormDescription>Manual override</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Image Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Image
                </h3>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" placeholder="https://..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {imageUrl && (
                    <div className="w-20 h-20 border border-border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <ImageIcon className="w-8 h-8 text-muted-foreground hidden" />
                    </div>
                  )}
                </div>
              </div>

              {/* Type-specific fields */}
              {isFilament && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Filament Details
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="material"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select material" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MATERIALS.map((mat) => (
                                <SelectItem key={mat} value={mat}>
                                  {mat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="diameter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diameter</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select diameter" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DIAMETERS.map((d) => (
                                <SelectItem key={d} value={d}>
                                  {d}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weight_grams"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (grams)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="1000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="color_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Matte Black" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {!isFilament && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Printer Details
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="build_volume"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Build Volume</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 256x256x256mm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_print_speed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Print Speed (mm/s)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Settings Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Settings
                </h3>
                
                <FormField
                  control={form.control}
                  name="sync_enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Sync Enabled</FormLabel>
                        <FormDescription>
                          Automatically update price and availability data
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="admin_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Internal notes (not shown to users)"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={!form.formState.isDirty || isSaving}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="regional-urls" className="mt-4 space-y-4">
              <RegionalUrlEditor
                productId={product?.id || ''}
                productType={type}
                urls={regionalUrls}
                onChange={setRegionalUrls}
                disabled={isLoadingRegional}
              />
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSaveRegionalUrls} disabled={isSaving}>
                  {saveRegionalUrls.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save URLs
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="regional-prices" className="mt-4 space-y-4">
              <RegionalPriceEditor
                productId={product?.id || ''}
                productType={type}
                prices={regionalPrices}
                configuredRegions={configuredRegions}
                baseMsrp={isFilament ? filamentProduct?.msrp || null : printerProduct?.msrp_usd || null}
                onChange={setRegionalPrices}
                disabled={isLoadingRegional}
              />
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSaveRegionalPrices} disabled={isSaving}>
                  {saveRegionalPrices.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Prices
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelClose}>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
