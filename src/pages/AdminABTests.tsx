import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, FlaskConical, Play, Pause, Trophy, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ABTestVariant {
  id: string;
  test_name: string;
  variant_name: string;
  description: string | null;
  config: Record<string, unknown> | null;
  weight: number;
  is_control: boolean;
  is_active: boolean;
  created_at: string;
}

interface TestMetrics {
  variant_name: string;
  users: number;
  conversions: number;
  conversion_rate: number;
  total_value: number;
}

export default function AdminABTests() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    test_name: '',
    variants: [
      { name: 'control', description: 'Original version', weight: 50, is_control: true },
      { name: 'variant_b', description: 'Test version', weight: 50, is_control: false },
    ],
  });
  
  // Fetch all tests
  const { data: tests, isLoading } = useQuery({
    queryKey: ['ab-tests-admin'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ab_test_variants')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Group by test name
      const grouped = new Map<string, ABTestVariant[]>();
      (data || []).forEach(variant => {
        const existing = grouped.get(variant.test_name) || [];
        existing.push(variant as ABTestVariant);
        grouped.set(variant.test_name, existing);
      });
      
      return Array.from(grouped.entries()).map(([name, variants]) => ({
        name,
        variants,
        is_active: variants.some(v => v.is_active),
        created_at: variants[0]?.created_at,
      }));
    },
  });
  
  // Fetch metrics for selected test
  const { data: testMetrics } = useQuery({
    queryKey: ['ab-test-metrics', selectedTest],
    queryFn: async () => {
      if (!selectedTest) return null;
      
      // Get assignments count per variant
      const { data: assignments } = await supabase
        .from('ab_test_assignments')
        .select('variant_id')
        .eq('test_name', selectedTest);
      
      // Get conversions per variant
      const { data: conversions } = await supabase
        .from('ab_test_conversions')
        .select('variant_id, conversion_value')
        .eq('test_name', selectedTest);
      
      // Get variant names
      const test = tests?.find(t => t.name === selectedTest);
      if (!test) return null;
      
      const metrics: TestMetrics[] = test.variants.map(variant => {
        const variantAssignments = assignments?.filter(a => a.variant_id === variant.id) || [];
        const variantConversions = conversions?.filter(c => c.variant_id === variant.id) || [];
        const totalValue = variantConversions.reduce((sum, c) => sum + (c.conversion_value || 0), 0);
        
        return {
          variant_name: variant.variant_name,
          users: variantAssignments.length,
          conversions: variantConversions.length,
          conversion_rate: variantAssignments.length > 0 
            ? (variantConversions.length / variantAssignments.length) * 100 
            : 0,
          total_value: totalValue,
        };
      });
      
      return metrics;
    },
    enabled: !!selectedTest,
  });
  
  // Create test mutation
  const createTest = useMutation({
    mutationFn: async () => {
      const variants = formData.variants.map(v => ({
        test_name: formData.test_name,
        variant_name: v.name,
        description: v.description,
        weight: v.weight,
        is_control: v.is_control,
        is_active: true,
        config: {},
      }));
      
      const { error } = await supabase.from('ab_test_variants').insert(variants);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests-admin'] });
      toast.success('Test created');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create test'),
  });
  
  // Toggle test active state
  const toggleTest = useMutation({
    mutationFn: async ({ testName, isActive }: { testName: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('ab_test_variants')
        .update({ is_active: !isActive })
        .eq('test_name', testName);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests-admin'] });
      toast.success('Test updated');
    },
  });
  
  const resetForm = () => {
    setFormData({
      test_name: '',
      variants: [
        { name: 'control', description: 'Original version', weight: 50, is_control: true },
        { name: 'variant_b', description: 'Test version', weight: 50, is_control: false },
      ],
    });
  };
  
  const addVariant = () => {
    setFormData(f => ({
      ...f,
      variants: [...f.variants, { 
        name: `variant_${String.fromCharCode(97 + f.variants.length)}`, 
        description: '', 
        weight: 50, 
        is_control: false 
      }],
    }));
  };
  
  const getWinner = (metrics: TestMetrics[]) => {
    if (!metrics || metrics.length === 0) return null;
    const sorted = [...metrics].sort((a, b) => b.conversion_rate - a.conversion_rate);
    const best = sorted[0];
    const control = metrics.find(m => m.variant_name === 'control');
    
    if (!control || best.variant_name === 'control') return null;
    if (best.users < 100) return null; // Not enough data
    
    const improvement = ((best.conversion_rate - control.conversion_rate) / control.conversion_rate) * 100;
    return improvement > 10 ? { variant: best.variant_name, improvement } : null;
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">A/B Tests</h1>
            <p className="text-muted-foreground">Create and manage experiments</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create A/B Test</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Test Name</Label>
                  <Input 
                    value={formData.test_name}
                    onChange={(e) => setFormData(f => ({ ...f, test_name: e.target.value }))}
                    placeholder="module_order_test"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Variants</Label>
                    <Button variant="ghost" size="sm" onClick={addVariant}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Variant
                    </Button>
                  </div>
                  
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="p-3 rounded-lg border space-y-2">
                      <div className="flex items-center gap-2">
                        <Input 
                          value={variant.name}
                          onChange={(e) => {
                            const newVariants = [...formData.variants];
                            newVariants[index].name = e.target.value;
                            setFormData(f => ({ ...f, variants: newVariants }));
                          }}
                          placeholder="Variant name"
                          className="flex-1"
                        />
                        <Input 
                          type="number"
                          value={variant.weight}
                          onChange={(e) => {
                            const newVariants = [...formData.variants];
                            newVariants[index].weight = parseInt(e.target.value) || 50;
                            setFormData(f => ({ ...f, variants: newVariants }));
                          }}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        {variant.is_control && (
                          <Badge variant="secondary">Control</Badge>
                        )}
                      </div>
                      <Textarea 
                        value={variant.description}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].description = e.target.value;
                          setFormData(f => ({ ...f, variants: newVariants }));
                        }}
                        placeholder="Description"
                        rows={1}
                      />
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={() => createTest.mutate()} 
                  className="w-full" 
                  disabled={!formData.test_name || formData.variants.length < 2}
                >
                  Create Test
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : tests?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No A/B tests yet. Create your first test to start experimenting.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {tests?.map(test => {
              const winner = selectedTest === test.name && testMetrics ? getWinner(testMetrics) : null;
              
              return (
                <Card key={test.name} className={selectedTest === test.name ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5" />
                        {test.name}
                        <Badge variant={test.is_active ? 'default' : 'secondary'}>
                          {test.is_active ? 'Running' : 'Paused'}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTest(selectedTest === test.name ? null : test.name)}
                        >
                          {selectedTest === test.name ? 'Hide Details' : 'View Details'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTest.mutate({ testName: test.name, isActive: test.is_active })}
                        >
                          {test.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span>{test.variants.length} variants</span>
                      <span>•</span>
                      <span>Created {new Date(test.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {selectedTest === test.name && testMetrics && (
                      <div className="space-y-4 mt-4 pt-4 border-t">
                        {winner && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <Trophy className="h-5 w-5 text-green-500" />
                            <span className="font-medium text-green-500">
                              {winner.variant} is winning with +{winner.improvement.toFixed(1)}% conversion rate
                            </span>
                          </div>
                        )}
                        
                        <div className="grid gap-4">
                          {testMetrics.map(metric => (
                            <div key={metric.variant_name} className="p-4 rounded-lg border bg-muted/30">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{metric.variant_name}</span>
                                  {metric.variant_name === 'control' && (
                                    <Badge variant="outline">Control</Badge>
                                  )}
                                  {winner?.variant === metric.variant_name && (
                                    <Trophy className="h-4 w-4 text-amber-500" />
                                  )}
                                </div>
                                <span className="text-lg font-bold">
                                  {metric.conversion_rate.toFixed(2)}%
                                </span>
                              </div>
                              
                              <Progress value={metric.conversion_rate} className="h-2 mb-3" />
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {metric.users} users
                                </div>
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {metric.conversions} conversions
                                </div>
                                <div className="flex items-center gap-1">
                                  ${metric.total_value.toFixed(2)} value
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Statistical significance requires ~95% confidence. Keep the test running until one variant shows consistent improvement.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
