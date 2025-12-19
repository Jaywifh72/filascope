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

interface PersistedQueueState {
  pending: string[];
  current: string | null;
  currentJobId: string | null;
  completed: string[];
  failed: string[];
  dryRun: boolean;
}

const ALL_MATERIALS = ['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'PA', 'PC', 'Support'];
const STORAGE_KEY = 'bambuScrapeQueue';

function saveQueueToStorage(state: PersistedQueueState | null) {
  if (state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function loadQueueFromStorage(): PersistedQueueState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load queue from storage:', e);
  }
  return null;
}

export function useBambuScrapeQueue(dryRun: boolean) {
  const [queueState, setQueueState] = useState<QueueState>(() => {
    // Initialize from localStorage if available
    const saved = loadQueueFromStorage();
    if (saved && saved.currentJobId) {
      return {
        pending: saved.pending,
        current: saved.current,
        currentJobId: saved.currentJobId,
        completed: saved.completed,
        failed: saved.failed,
        results: {},
      };
    }
    return {
      pending: [],
      current: null,
      currentJobId: null,
      completed: [],
      failed: [],
      results: {},
    };
  });
  
  const isStartingNextRef = useRef(false);
  const { startJob, isStarting } = useStartBambuScrapeJob();
  const { job, isComplete } = useBambuScrapeJob(queueState.currentJobId);

  const isQueueRunning = queueState.current !== null || queueState.pending.length > 0;
  const isQueueComplete = !isQueueRunning && (queueState.completed.length > 0 || queueState.failed.length > 0);
  const totalMaterials = queueState.pending.length + (queueState.current ? 1 : 0) + queueState.completed.length + queueState.failed.length;
  const completedCount = queueState.completed.length + queueState.failed.length;
  const overallProgress = totalMaterials > 0 ? (completedCount / totalMaterials) * 100 : 0;

  // Persist queue state to localStorage whenever it changes
  useEffect(() => {
    if (queueState.currentJobId || queueState.pending.length > 0) {
      saveQueueToStorage({
        pending: queueState.pending,
        current: queueState.current,
        currentJobId: queueState.currentJobId,
        completed: queueState.completed,
        failed: queueState.failed,
        dryRun,
      });
    }
  }, [queueState.pending, queueState.current, queueState.currentJobId, queueState.completed, queueState.failed, dryRun]);

  const startNextMaterial = useCallback(async () => {
    if (isStartingNextRef.current) return;
    
    setQueueState(prev => {
      if (prev.pending.length === 0) {
        // Queue complete - clear storage
        saveQueueToStorage(null);
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
    saveQueueToStorage(null);
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
    saveQueueToStorage(null);
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
