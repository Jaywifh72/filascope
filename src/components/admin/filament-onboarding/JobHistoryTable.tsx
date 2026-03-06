import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { PostImportResults } from './PostImportSummaryCard';

interface Job {
  id: string;
  brand_id: string;
  source_url: string;
  status: string;
  inserted_count: number | null;
  skipped_count: number | null;
  duplicate_count: number | null;
  created_at: string | null;
  post_import_results?: PostImportResults | null;
}

interface Props {
  jobs: Job[];
  activeJobId: string | null;
  onJobClick: (id: string) => void;
}

function statusVariant(status: string) {
  if (status === 'extracted') return 'bg-green-500/10 text-green-500';
  if (status === 'failed') return 'bg-red-500/10 text-red-500';
  if (status === 'pending' || status === 'extracting') return 'bg-yellow-500/10 text-yellow-500';
  return 'bg-muted text-muted-foreground';
}

export function JobHistoryTable({ jobs, activeJobId, onJobClick }: Props) {
  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No jobs yet</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead>Source URL</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Inserted</TableHead>
          <TableHead className="text-right">Skipped</TableHead>
          <TableHead className="text-right">Duplicates</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map(job => {
          const hasPostResults = !!job.post_import_results;
          const hasInserts = (job.inserted_count ?? 0) > 0;

          return (
            <TableRow
              key={job.id}
              className={cn(
                'cursor-pointer transition-colors',
                activeJobId === job.id && 'bg-primary/5'
              )}
              onClick={() => onJobClick(job.id)}
            >
              <TableCell className="text-sm">
                {job.created_at ? format(new Date(job.created_at), 'MMM d, HH:mm') : '—'}
              </TableCell>
              <TableCell className="font-medium">{job.brand_id}</TableCell>
              <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                <a
                  href={job.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  {job.source_url}
                </a>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge className={statusVariant(job.status)}>{job.status}</Badge>
                  {job.status === 'extracted' && hasPostResults && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/30 text-green-500">
                      ✓ Setup done
                    </Badge>
                  )}
                  {job.status === 'extracted' && !hasPostResults && hasInserts && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-500">
                      ⏳ Setup pending
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{job.inserted_count ?? 0}</TableCell>
              <TableCell className="text-right tabular-nums">{job.skipped_count ?? 0}</TableCell>
              <TableCell className="text-right tabular-nums">{job.duplicate_count ?? 0}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
