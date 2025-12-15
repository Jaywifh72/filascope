import { useState } from 'react';
import { ScoreCard } from './ScoreCard';
import { ScoreMethodologyModal } from './ScoreMethodologyModal';
import { getScoreCardData, ScoreCardData, ScoreType } from '@/lib/scoreCardService';
import type { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';

type Filament = Database['public']['Tables']['filaments']['Row'];

interface ScoreCardsSectionProps {
  filament: Filament;
}

function ScoreCardSkeleton() {
  return (
    <div className="rounded-xl p-6 border-2 border-muted bg-muted/10 min-h-[320px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
      <div className="text-center mb-4">
        <Skeleton className="w-24 h-10 mx-auto mb-2" />
        <Skeleton className="w-20 h-5 mx-auto mb-3" />
        <Skeleton className="w-28 h-6 mx-auto rounded-full" />
      </div>
      <Skeleton className="w-full h-16 mb-4" />
      <Skeleton className="w-full h-24 rounded-lg mb-4" />
      <Skeleton className="w-24 h-4 mt-auto" />
    </div>
  );
}

function ScoresPendingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      <div className="col-span-full text-center py-8 text-muted-foreground">
        <p className="text-sm">Score data is being calculated...</p>
      </div>
    </div>
  );
}

export function ScoreCardsSection({ filament }: ScoreCardsSectionProps) {
  const [methodologyOpen, setMethodologyOpen] = useState<ScoreType | null>(null);
  
  // Get score card data
  const scoreCards = getScoreCardData(filament);
  
  // If no scores available, don't render anything
  if (scoreCards.length === 0) {
    return null;
  }
  
  const openMethodology = scoreCards.find(c => c.id === methodologyOpen) || null;
  
  return (
    <>
      {/* Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 pt-2">
        {scoreCards.map((card, index) => (
          <div 
            key={card.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ScoreCard
              data={card}
              filamentId={filament.id}
              material={filament.material}
              onMethodologyClick={() => setMethodologyOpen(card.id)}
              animationDelay={index * 100}
            />
          </div>
        ))}
      </div>
      
      {/* Methodology Modal */}
      <ScoreMethodologyModal
        isOpen={!!methodologyOpen}
        onClose={() => setMethodologyOpen(null)}
        scoreData={openMethodology}
        filamentId={filament.id}
      />
    </>
  );
}
