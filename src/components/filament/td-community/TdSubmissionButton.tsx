import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Ruler, CheckCircle } from 'lucide-react';
import { TdSubmissionModal } from './TdSubmissionModal';

interface Props {
  filamentId: string;
  filamentName: string;
  currentTd: number | null;
}

export function TdSubmissionButton({ filamentId, filamentName, currentTd }: Props) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const hasTd = currentTd != null;
  const label = hasTd ? 'Verify This TD Value' : 'Submit TD Measurement';
  const Icon = hasTd ? CheckCircle : Ruler;

  if (!user) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
        <a href="/auth">
          <Icon className="w-3.5 h-3.5" />
          Sign in to submit TD
        </a>
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setOpen(true)}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </Button>
      <TdSubmissionModal
        open={open}
        onOpenChange={setOpen}
        filamentId={filamentId}
        filamentName={filamentName}
        currentTd={currentTd}
      />
    </>
  );
}
