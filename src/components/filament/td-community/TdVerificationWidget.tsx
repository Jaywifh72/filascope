import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTdVerification, useUserVote } from '@/hooks/useTdVerification';
import { useTdCommunityStats } from '@/hooks/useTdCommunityStats';
import { Check, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  filamentId: string;
}

export function TdVerificationWidget({ filamentId }: Props) {
  const { user } = useAuth();
  const { data: stats } = useTdCommunityStats(filamentId);
  const { data: userVote } = useUserVote(filamentId);
  const { vote, isPending } = useTdVerification(filamentId);

  const hasVoted = !!userVote;

  if (!user) {
    return (
      <p className="text-xs text-muted-foreground mt-1">
        <a href="/auth" className="text-primary hover:underline">Sign in</a> to verify this TD value
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-xs text-muted-foreground font-medium">Community Verification</p>
      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className={`text-xs gap-1 h-7 ${userVote?.vote === 'accurate' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : ''}`}
          disabled={isPending || hasVoted}
          onClick={() => vote({ vote: 'accurate' })}
        >
          <Check className="w-3 h-3" /> Accurate
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`text-xs gap-1 h-7 ${userVote?.vote === 'too_high' ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' : ''}`}
          disabled={isPending || hasVoted}
          onClick={() => vote({ vote: 'too_high' })}
        >
          <ArrowUp className="w-3 h-3" /> Seems High
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`text-xs gap-1 h-7 ${userVote?.vote === 'too_low' ? 'bg-red-500/15 border-red-500/40 text-red-400' : ''}`}
          disabled={isPending || hasVoted}
          onClick={() => vote({ vote: 'too_low' })}
        >
          <ArrowDown className="w-3 h-3" /> Seems Low
        </Button>
      </div>
      {stats && stats.verification_count > 0 && (
        <p className="text-xs text-muted-foreground">
          {stats.accurate_votes} verified accurate · {stats.too_high_votes} say too high · {stats.too_low_votes} say too low
        </p>
      )}
      {hasVoted && (
        <p className="text-xs text-emerald-400">You voted: {userVote!.vote === 'accurate' ? 'Accurate' : userVote!.vote === 'too_high' ? 'Too High' : 'Too Low'}</p>
      )}
    </div>
  );
}
