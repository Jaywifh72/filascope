import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight, X, Loader2, Star, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';

interface Props {
  filamentId: string;
}

interface FilamentProperties {
  heat_resistance_c: number | null;
  glass_transition_c: number | null;
  print_temp_min: number | null;
  print_temp_max: number | null;
  bed_temp_min: number | null;
  bed_temp_max: number | null;
  flexibility_score: number | null;
  layer_adhesion_score: number | null;
  impact_strength_score: number | null;
  uv_resistance_score: number | null;
  moisture_resistance_score: number | null;
  warping_risk: string | null;
  support_removal: string | null;
  translucency: string | null;
  surface_finish: string | null;
  food_safe: boolean;
  outdoor_suitable: boolean;
  biodegradable: boolean;
  enclosure_required: boolean;
  abrasive: boolean;
  drying_required: boolean;
}

interface TraitTag {
  id: string;
  trait: string;
  trait_category: string | null;
  confidence: number | null;
}

interface UseCase {
  id: string;
  use_case: string;
  suitability: string | null;
  notes: string | null;
}

interface EmbeddingStatus {
  exists: boolean;
  generated_at: string | null;
  char_count: number;
}

const defaultProps: FilamentProperties = {
  heat_resistance_c: null, glass_transition_c: null,
  print_temp_min: null, print_temp_max: null,
  bed_temp_min: null, bed_temp_max: null,
  flexibility_score: null, layer_adhesion_score: null,
  impact_strength_score: null, uv_resistance_score: null,
  moisture_resistance_score: null,
  warping_risk: null, support_removal: null,
  translucency: null, surface_finish: null,
  food_safe: false, outdoor_suitable: false, biodegradable: false,
  enclosure_required: false, abrasive: false, drying_required: false,
};

const CATEGORIES = [
  { value: 'strength', label: 'Strength', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'weakness', label: 'Weakness', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'use_case', label: 'Use Case', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'avoid_if', label: 'Avoid If', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
];

const SUITABILITY_COLORS: Record<string, string> = {
  ideal: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  good: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  acceptable: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  not_recommended: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function SearchIntelligenceTab({ filamentId }: Props) {
  // Section open states
  const [specsOpen, setSpecsOpen] = useState(true);
  const [traitsOpen, setTraitsOpen] = useState(false);
  const [useCasesOpen, setUseCasesOpen] = useState(false);

  // Physical specs
  const [props, setProps] = useState<FilamentProperties>(defaultProps);
  const [savingSpecs, setSavingSpecs] = useState(false);

  // Trait tags
  const [traits, setTraits] = useState<TraitTag[]>([]);
  const [newTrait, setNewTrait] = useState('');
  const [newTraitCategory, setNewTraitCategory] = useState('strength');
  const [newTraitConfidence, setNewTraitConfidence] = useState(3);
  const [traitSuggestions, setTraitSuggestions] = useState<string[]>([]);
  const [addingTrait, setAddingTrait] = useState(false);

  // Use cases
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [newUseCase, setNewUseCase] = useState('');
  const [newSuitability, setNewSuitability] = useState('good');
  const [newNotes, setNewNotes] = useState('');
  const [addingUseCase, setAddingUseCase] = useState(false);

  // Embedding status
  const [embedding, setEmbedding] = useState<EmbeddingStatus>({ exists: false, generated_at: null, char_count: 0 });
  const [regenerating, setRegenerating] = useState(false);

  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    if (!filamentId) return;
    setLoading(true);
    Promise.all([
      supabase.from('filament_properties').select('*').eq('filament_id', filamentId).maybeSingle(),
      supabase.from('filament_trait_tags').select('*').eq('filament_id', filamentId),
      supabase.from('filament_use_cases').select('*').eq('filament_id', filamentId),
      supabase.from('filament_search_embeddings').select('generated_at, embedding_text').eq('filament_id', filamentId).maybeSingle(),
    ]).then(([propsRes, traitsRes, ucRes, embRes]) => {
      if (propsRes.data) {
        const d = propsRes.data as any;
        setProps({
          heat_resistance_c: d.heat_resistance_c, glass_transition_c: d.glass_transition_c,
          print_temp_min: d.print_temp_min, print_temp_max: d.print_temp_max,
          bed_temp_min: d.bed_temp_min, bed_temp_max: d.bed_temp_max,
          flexibility_score: d.flexibility_score, layer_adhesion_score: d.layer_adhesion_score,
          impact_strength_score: d.impact_strength_score, uv_resistance_score: d.uv_resistance_score,
          moisture_resistance_score: d.moisture_resistance_score,
          warping_risk: d.warping_risk, support_removal: d.support_removal,
          translucency: d.translucency, surface_finish: d.surface_finish,
          food_safe: d.food_safe ?? false, outdoor_suitable: d.outdoor_suitable ?? false,
          biodegradable: d.biodegradable ?? false, enclosure_required: d.enclosure_required ?? false,
          abrasive: d.abrasive ?? false, drying_required: d.drying_required ?? false,
        });
      }
      setTraits((traitsRes.data || []) as TraitTag[]);
      setUseCases((ucRes.data || []) as UseCase[]);
      if (embRes.data) {
        setEmbedding({ exists: true, generated_at: embRes.data.generated_at, char_count: embRes.data.embedding_text?.length || 0 });
      }
    }).finally(() => setLoading(false));
  }, [filamentId]);

  const regenerateEmbedding = useCallback(async () => {
    setRegenerating(true);
    try {
      await supabase.functions.invoke('generate-filament-embedding', { body: { filament_id: filamentId } });
      const { data } = await supabase.from('filament_search_embeddings').select('generated_at, embedding_text').eq('filament_id', filamentId).maybeSingle();
      if (data) setEmbedding({ exists: true, generated_at: data.generated_at, char_count: data.embedding_text?.length || 0 });
      toast.success('Embedding regenerated');
    } catch { toast.error('Failed to regenerate embedding'); }
    finally { setRegenerating(false); }
  }, [filamentId]);

  // Save specs
  const saveSpecs = async () => {
    setSavingSpecs(true);
    try {
      const { error } = await supabase.from('filament_properties').upsert({
        filament_id: filamentId, ...props, updated_at: new Date().toISOString(),
      }, { onConflict: 'filament_id' } as any);
      if (error) throw error;
      toast.success('Specifications saved');
      regenerateEmbedding();
    } catch (e: any) { toast.error(e.message || 'Failed to save'); }
    finally { setSavingSpecs(false); }
  };

  // Trait autocomplete
  const searchTraits = async (q: string) => {
    if (q.length < 2) { setTraitSuggestions([]); return; }
    const { data } = await supabase.from('trait_taxonomy').select('trait').ilike('trait', `%${q}%`).limit(8);
    setTraitSuggestions((data || []).map((d: any) => d.trait));
  };

  const addTrait = async () => {
    if (!newTrait.trim()) return;
    setAddingTrait(true);
    try {
      const { error } = await supabase.from('filament_trait_tags').insert({
        filament_id: filamentId, trait: newTrait.trim(), trait_category: newTraitCategory, confidence: newTraitConfidence,
      });
      if (error) throw error;
      const { data } = await supabase.from('filament_trait_tags').select('*').eq('filament_id', filamentId);
      setTraits((data || []) as TraitTag[]);
      setNewTrait(''); setNewTraitConfidence(3); setTraitSuggestions([]);
      toast.success('Trait added');
      regenerateEmbedding();
    } catch (e: any) { toast.error(e.message); }
    finally { setAddingTrait(false); }
  };

  const deleteTrait = async (id: string) => {
    const { error } = await supabase.from('filament_trait_tags').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setTraits(prev => prev.filter(t => t.id !== id));
    toast.success('Trait removed');
    regenerateEmbedding();
  };

  const addUseCase = async () => {
    if (!newUseCase.trim()) return;
    setAddingUseCase(true);
    try {
      const { error } = await supabase.from('filament_use_cases').insert({
        filament_id: filamentId, use_case: newUseCase.trim(), suitability: newSuitability, notes: newNotes || null,
      });
      if (error) throw error;
      const { data } = await supabase.from('filament_use_cases').select('*').eq('filament_id', filamentId);
      setUseCases((data || []) as UseCase[]);
      setNewUseCase(''); setNewNotes('');
      toast.success('Use case added');
      regenerateEmbedding();
    } catch (e: any) { toast.error(e.message); }
    finally { setAddingUseCase(false); }
  };

  const deleteUseCase = async (id: string) => {
    const { error } = await supabase.from('filament_use_cases').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setUseCases(prev => prev.filter(u => u.id !== id));
    toast.success('Use case removed');
    regenerateEmbedding();
  };

  const updateProp = <K extends keyof FilamentProperties>(key: K, value: FilamentProperties[K]) => {
    setProps(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* SECTION A: Physical Specifications */}
      <Collapsible open={specsOpen} onOpenChange={setSpecsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left font-semibold text-sm py-2 hover:text-primary transition-colors">
          {specsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Physical Specifications
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 pt-2">
          {/* Thermal */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Thermal Properties</h4>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['heat_resistance_c', 'Heat Resistance (°C)', 'Max continuous service temperature'],
                ['glass_transition_c', 'Glass Transition (°C)', 'Tg — softening point'],
                ['print_temp_min', 'Print Temp Min (°C)', ''],
                ['print_temp_max', 'Print Temp Max (°C)', ''],
                ['bed_temp_min', 'Bed Temp Min (°C)', ''],
                ['bed_temp_max', 'Bed Temp Max (°C)', ''],
              ] as const).map(([key, label, helper]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Input type="number" value={props[key] ?? ''} onChange={e => updateProp(key, e.target.value ? parseInt(e.target.value) : null)} placeholder="—" className="h-8 text-sm" />
                  {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Mechanical */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Mechanical Properties</h4>
            <div className="grid grid-cols-2 gap-4">
              {([
                ['flexibility_score', 'Flexibility'],
                ['layer_adhesion_score', 'Layer Adhesion'],
                ['impact_strength_score', 'Impact Strength'],
                ['uv_resistance_score', 'UV Resistance'],
                ['moisture_resistance_score', 'Moisture Resistance'],
              ] as const).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}: {props[key] ?? '—'}/10</Label>
                  <Slider min={1} max={10} step={1} value={[props[key] ?? 5]} onValueChange={([v]) => updateProp(key, v)} />
                </div>
              ))}
            </div>
          </div>

          {/* Categorical */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Print Characteristics</h4>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['warping_risk', 'Warping Risk', ['Low', 'Medium', 'High']],
                ['support_removal', 'Support Removal', ['Easy', 'Moderate', 'Difficult']],
                ['translucency', 'Translucency', ['Opaque', 'Translucent', 'Transparent']],
                ['surface_finish', 'Surface Finish', ['Matte', 'Satin', 'Glossy']],
              ] as const).map(([key, label, options]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Select value={props[key] || ''} onValueChange={v => updateProp(key, v || null)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {options.map(o => <SelectItem key={o} value={o.toLowerCase()}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Booleans */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Key Properties</h4>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['food_safe', 'Food Safe'],
                ['outdoor_suitable', 'Outdoor Suitable'],
                ['biodegradable', 'Biodegradable'],
                ['enclosure_required', 'Enclosure Required'],
                ['abrasive', 'Abrasive (hardened nozzle)'],
                ['drying_required', 'Drying Required'],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-xs">{label}</Label>
                  <Switch checked={props[key]} onCheckedChange={v => updateProp(key, v)} />
                </div>
              ))}
            </div>
          </div>

          <Button onClick={saveSpecs} disabled={savingSpecs} className="w-full">
            {savingSpecs && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Specifications
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* SECTION B: Trait Tags */}
      <Collapsible open={traitsOpen} onOpenChange={setTraitsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left font-semibold text-sm py-2 hover:text-primary transition-colors">
          {traitsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Trait Tags ({traits.length})
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          {/* Grouped tags */}
          {CATEGORIES.map(cat => {
            const catTraits = traits.filter(t => t.trait_category === cat.value);
            if (catTraits.length === 0) return null;
            return (
              <div key={cat.value}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{cat.label}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {catTraits.map(t => (
                    <span key={t.id} className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 border ${cat.color}`}>
                      {t.trait}
                      {t.confidence && <span className="opacity-60">({t.confidence}★)</span>}
                      <button onClick={() => deleteTrait(t.id)} className="ml-0.5 hover:opacity-80"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Add trait form */}
          <div className="border border-border rounded-lg p-3 space-y-3">
            <h4 className="text-xs font-semibold">Add Trait</h4>
            <div className="relative">
              <Input value={newTrait} onChange={e => { setNewTrait(e.target.value); searchTraits(e.target.value); }} placeholder="Type a trait..." className="h-8 text-sm" />
              {traitSuggestions.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-32 overflow-y-auto">
                  {traitSuggestions.map(s => (
                    <button key={s} className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onClick={() => { setNewTrait(s); setTraitSuggestions([]); }}>{s}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setNewTraitCategory(c.value)}
                  className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${newTraitCategory === c.value ? c.color : 'border-border text-muted-foreground hover:text-foreground'}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Confidence:</Label>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setNewTraitConfidence(n)}>
                    <Star className={`w-4 h-4 ${n <= newTraitConfidence ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>
            <Button size="sm" onClick={addTrait} disabled={addingTrait || !newTrait.trim()}>
              {addingTrait && <Loader2 className="w-3 h-3 mr-1 animate-spin" />} Add Trait
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* SECTION C: Use Cases */}
      <Collapsible open={useCasesOpen} onOpenChange={setUseCasesOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left font-semibold text-sm py-2 hover:text-primary transition-colors">
          {useCasesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Use Cases ({useCases.length})
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          {useCases.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Use Case</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Suitability</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Notes</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {useCases.map(uc => (
                    <tr key={uc.id} className="border-t border-border">
                      <td className="px-3 py-2">{uc.use_case}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs rounded-full px-2 py-0.5 border ${SUITABILITY_COLORS[uc.suitability || ''] || 'border-border'}`}>
                          {uc.suitability?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground max-w-[150px] truncate">{uc.notes || '—'}</td>
                      <td className="px-2"><button onClick={() => deleteUseCase(uc.id)} className="text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border border-border rounded-lg p-3 space-y-3">
            <h4 className="text-xs font-semibold">Add Use Case</h4>
            <Input value={newUseCase} onChange={e => setNewUseCase(e.target.value)} placeholder="e.g. functional mechanical parts" className="h-8 text-sm" />
            <Select value={newSuitability} onValueChange={setNewSuitability}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ideal">Ideal</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="acceptable">Acceptable</SelectItem>
                <SelectItem value="not_recommended">Not Recommended</SelectItem>
              </SelectContent>
            </Select>
            <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Notes (optional)" className="min-h-[60px] text-sm" />
            <Button size="sm" onClick={addUseCase} disabled={addingUseCase || !newUseCase.trim()}>
              {addingUseCase && <Loader2 className="w-3 h-3 mr-1 animate-spin" />} Add Use Case
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Embedding Status */}
      <div className="border border-border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium">Search Embedding</span>
          </div>
          {embedding.exists ? (
            <span className="text-xs rounded-full px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ✓ Indexed
            </span>
          ) : (
            <span className="text-xs rounded-full px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ⚠ Not indexed
            </span>
          )}
        </div>
        {embedding.exists && (
          <p className="text-xs text-muted-foreground">
            Generated: {new Date(embedding.generated_at!).toLocaleString()} · {embedding.char_count} chars
          </p>
        )}
        <Button variant="outline" size="sm" onClick={regenerateEmbedding} disabled={regenerating} className="w-full">
          {regenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          Regenerate Embedding
        </Button>
      </div>
    </div>
  );
}
