import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ABTestVariant {
  id: string;
  test_name: string;
  variant_name: string;
  config: Record<string, unknown> | null;
  weight: number;
  is_control: boolean;
}

interface ABTestAssignment {
  test_name: string;
  variant_id: string;
  variant_name: string;
  config: Record<string, unknown> | null;
}

const getSessionId = () => {
  let sessionId = sessionStorage.getItem('ab_test_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('ab_test_session_id', sessionId);
  }
  return sessionId;
};

// Local cache for assignments within session
const assignmentCache = new Map<string, ABTestAssignment>();

export function useABTest(testName: string) {
  const { user } = useAuth();
  const sessionId = getSessionId();
  const [assignment, setAssignment] = useState<ABTestAssignment | null>(
    assignmentCache.get(testName) || null
  );
  
  // Fetch existing assignment or active variants
  const { data: existingAssignment } = useQuery({
    queryKey: ['ab-test-assignment', testName, user?.id, sessionId],
    queryFn: async () => {
      // Check for existing assignment
      const { data: existing } = await supabase
        .from('ab_test_assignments')
        .select(`
          test_name,
          variant_id,
          ab_test_variants (
            variant_name,
            config
          )
        `)
        .eq('test_name', testName)
        .or(`user_id.eq.${user?.id || 'null'},session_id.eq.${sessionId}`)
        .maybeSingle();
      
      if (existing?.variant_id) {
        const variant = existing.ab_test_variants as unknown as { variant_name: string; config: Record<string, unknown> | null };
        return {
          test_name: existing.test_name,
          variant_id: existing.variant_id,
          variant_name: variant?.variant_name || 'control',
          config: variant?.config || null,
        };
      }
      
      return null;
    },
    staleTime: Infinity,
  });
  
  // Fetch active variants for this test
  const { data: variants } = useQuery({
    queryKey: ['ab-test-variants', testName],
    queryFn: async () => {
      const { data } = await supabase
        .from('ab_test_variants')
        .select('*')
        .eq('test_name', testName)
        .eq('is_active', true);
      
      return data as ABTestVariant[] | null;
    },
    enabled: !existingAssignment,
    staleTime: 5 * 60 * 1000,
  });
  
  // Assign variant based on weights
  const assignVariant = useCallback(async () => {
    if (!variants || variants.length === 0) return null;
    
    // Weighted random selection
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    let selectedVariant = variants[0];
    for (const variant of variants) {
      random -= variant.weight || 1;
      if (random <= 0) {
        selectedVariant = variant;
        break;
      }
    }
    
    // Save assignment
    const { error } = await supabase.from('ab_test_assignments').insert({
      test_name: testName,
      variant_id: selectedVariant.id,
      user_id: user?.id || null,
      session_id: sessionId,
    });
    
    if (error) {
      console.error('Failed to save AB test assignment:', error);
    }
    
    const newAssignment: ABTestAssignment = {
      test_name: testName,
      variant_id: selectedVariant.id,
      variant_name: selectedVariant.variant_name,
      config: selectedVariant.config as Record<string, unknown> | null,
    };
    
    assignmentCache.set(testName, newAssignment);
    return newAssignment;
  }, [variants, testName, user?.id, sessionId]);
  
  // Set assignment on mount
  useEffect(() => {
    if (existingAssignment) {
      assignmentCache.set(testName, existingAssignment);
      setAssignment(existingAssignment);
    } else if (variants && variants.length > 0 && !assignment) {
      assignVariant().then(newAssignment => {
        if (newAssignment) setAssignment(newAssignment);
      });
    }
  }, [existingAssignment, variants, assignment, assignVariant, testName]);
  
  // Track conversion
  const trackConversion = useMutation({
    mutationFn: async ({ conversionType, value, metadata }: { 
      conversionType: string; 
      value?: number;
      metadata?: Record<string, unknown>;
    }) => {
      if (!assignment) return;
      
      const { error } = await supabase.from('ab_test_conversions').insert({
        test_name: testName,
        variant_id: assignment.variant_id,
        user_id: user?.id || null,
        session_id: sessionId,
        conversion_type: conversionType,
        conversion_value: value || null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      });
      
      if (error) throw error;
    },
  });
  
  return {
    variant: assignment?.variant_name || null,
    config: assignment?.config || null,
    isControl: assignment?.variant_name === 'control',
    trackConversion: trackConversion.mutate,
  };
}

// Hook to get all active tests for admin
export function useActiveABTests() {
  return useQuery({
    queryKey: ['ab-tests-active'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ab_test_variants')
        .select('test_name')
        .eq('is_active', true);
      
      const uniqueTests = [...new Set(data?.map(d => d.test_name) || [])];
      return uniqueTests;
    },
  });
}
