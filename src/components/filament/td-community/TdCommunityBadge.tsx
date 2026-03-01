import { CheckCircle, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTdCommunityStats } from '@/hooks/useTdCommunityStats';

interface Props {
  filamentId: string;
}

export function TdCommunityBadge({ filamentId }: Props) {
  const { data: stats } = useTdCommunityStats(filamentId);

  if (!stats) return null;

  const hasVerification = stats.accurate_votes >= 3;
  const hasCommunitySubmission = stats.submission_count > 0;

  if (!hasVerification && !hasCommunitySubmission) return null;

  if (hasVerification) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 inline ml-1" />
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          Verified by {stats.accurate_votes} community members
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Users className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        Community-measured ({stats.submission_count} submission{stats.submission_count > 1 ? 's' : ''}, avg TD: {stats.community_avg_td?.toFixed(2)})
      </TooltipContent>
    </Tooltip>
  );
}
