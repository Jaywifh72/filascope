import { useState, useEffect, useCallback, useRef } from "react";
import { useStartBambuScrapeJob, useBambuScrapeJob, ScrapeJob } from "./useBambuScrapeJob";

export interface QueueState {
  pending: string[];
  current: string | null;
  currentJobId: string | null;
  completed: string[];
  failed: string[];
  results: Record<string, ScrapeJob>;
}

const ALL_MATERIALS = ['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'PA', 'PC', 'Support'];

export function useBambuScrapeQueue(dryRun: boolean) {
  const [queueState, setQueueState] = useState<QueueState>({
    pending: [],
    current: null,
    currentJobId: null,
    completed: [],
    failed: [],
    results: {},
  });
  
  const isStartingNextRef = useRef(false);
  const { startJob, isStarting } = useStartBambuScrapeJob();
  const { job, isComplete } = useBambuScrapeJob(queueState.currentJobId);

  const isQueueRunning = queueState.current !== null || queueState.pending.length > 0;
  const isQueueComplete = !isQueueRunning && (queueState.completed.length > 0 || queueState.failed.length > 0);
  const totalMaterials = queueState.pending.length + (queueState.current ? 1 : 0) + queueState.completed.length + queueState.failed.length;
  const completedCount = queueState.completed.length + queueState.failed.length;
  const overallProgress = totalMaterials > 0 ? (completedCount / totalMaterials) * 100 : 0;

  const startNextMaterial = useCallback(async () => {
    if (isStartingNextRef.current) return;
    
    setQueueState(prev => {
      if (prev.pending.length === 0) {
        return { ...prev, current: null, currentJobId: null };
      }
      
      const [next, ...rest] = prev.pending;
      isStartingNextRef.current = true;
      
      // Start job asynchronously
      startJob([next], dryRun).then(jobId => {
        isStartingNextRef.current = false;
        if (jobId) {
          setQueueState(p => ({ ...p, currentJobId: jobId }));
        } else {
          // Failed to start job
          setQueueState(p => ({
            ...p,
            current: null,
            failed: [...p.failed, next],
          }));
        }
      });
      
      return { ...prev, pending: rest, current: next };
    });
  }, [startJob, dryRun]);

  // Watch for job completion
  useEffect(() => {
    if (isComplete && job && queueState.current && !isStartingNextRef.current) {
      const material = queueState.current;
      
      setQueueState(prev => {
        if (prev.current !== material) return prev; // Already processed
        
        const newResults = { ...prev.results, [material]: job };
        
        if (job.status === 'completed') {
          return {
            ...prev,
            completed: [...prev.completed, material],
            current: null,
            currentJobId: null,
            results: newResults,
          };
        } else {
          return {
            ...prev,
            failed: [...prev.failed, material],
            current: null,
            currentJobId: null,
            results: newResults,
          };
        }
      });
    }
  }, [isComplete, job, queueState.current]);

  // Start next job when current completes
  useEffect(() => {
    if (queueState.current === null && queueState.pending.length > 0 && !isStartingNextRef.current) {
      startNextMaterial();
    }
  }, [queueState.current, queueState.pending.length, startNextMaterial]);

  const startQueue = useCallback(async (materials: string[] = ALL_MATERIALS) => {
    if (materials.length === 0) return;
    
    const [first, ...rest] = materials;
    isStartingNextRef.current = true;
    
    const jobId = await startJob([first], dryRun);
    isStartingNextRef.current = false;
    
    if (jobId) {
      setQueueState({
        pending: rest,
        current: first,
        currentJobId: jobId,
        completed: [],
        failed: [],
        results: {},
      });
    }
  }, [startJob, dryRun]);

  const cancelQueue = useCallback(() => {
    setQueueState({
      pending: [],
      current: null,
      currentJobId: null,
      completed: queueState.completed,
      failed: queueState.failed,
      results: queueState.results,
    });
  }, [queueState.completed, queueState.failed, queueState.results]);

  const resetQueue = useCallback(() => {
    setQueueState({
      pending: [],
      current: null,
      currentJobId: null,
      completed: [],
      failed: [],
      results: {},
    });
  }, []);

  return {
    queueState,
    isQueueRunning,
    isQueueComplete,
    isStarting,
    overallProgress,
    totalMaterials,
    completedCount,
    currentJob: job,
    startQueue,
    cancelQueue,
    resetQueue,
    ALL_MATERIALS,
  };
}
