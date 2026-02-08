import { type GuideFilament } from '@/hooks/useGuideFilaments';
import { GuideProductCard } from './GuideProductCard';
import { Check, X, Minus } from 'lucide-react';

interface GuideVSComparisonProps {
  filaments: GuideFilament[];
}

interface PropertyRow {
  label: string;
  pla: string | boolean;
  petg: string | boolean;
  winner: 'pla' | 'petg' | 'tie';
}

const COMPARISON_DATA: PropertyRow[] = [
  { label: 'Ease of Printing', pla: '★★★★★', petg: '★★★☆☆', winner: 'pla' },
  { label: 'Impact Strength', pla: '★★☆☆☆', petg: '★★★★☆', winner: 'petg' },
  { label: 'Heat Resistance', pla: '~60°C', petg: '~80°C', winner: 'petg' },
  { label: 'Flexibility', pla: 'Brittle', petg: 'Semi-flexible', winner: 'petg' },
  { label: 'Surface Quality', pla: '★★★★★', petg: '★★★☆☆', winner: 'pla' },
  { label: 'Stringing', pla: 'Minimal', petg: 'Moderate', winner: 'pla' },
  { label: 'Bed Adhesion', pla: 'Easy (50–60°C)', petg: 'Aggressive (70–80°C)', winner: 'pla' },
  { label: 'Enclosure Needed', pla: false, petg: false, winner: 'tie' },
  { label: 'Chemical Resistance', pla: 'Low', petg: 'Moderate', winner: 'petg' },
  { label: 'UV Resistance', pla: 'Poor', petg: 'Moderate', winner: 'petg' },
  { label: 'Price Range', pla: '$15–25/kg', petg: '$18–30/kg', winner: 'pla' },
  { label: 'Color Options', pla: 'Extensive', petg: 'Good', winner: 'pla' },
  { label: 'Food Safe (raw)', pla: true, petg: true, winner: 'tie' },
  { label: 'Biodegradable', pla: true, petg: false, winner: 'pla' },
];

function ValueCell({ value, isWinner }: { value: string | boolean; isWinner: boolean }) {
  if (typeof value === 'boolean') {
    return (
      <div className={`flex items-center justify-center ${isWinner ? 'text-emerald-400' : ''}`}>
        {value ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-400" />}
      </div>
    );
  }

  return (
    <span className={`text-sm ${isWinner ? 'text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
      {value}
    </span>
  );
}

export function GuideVSComparison({ filaments }: GuideVSComparisonProps) {
  const plaFilaments = filaments.filter(f => f.material?.toUpperCase().includes('PLA')).slice(0, 3);
  const petgFilaments = filaments.filter(f => f.material?.toUpperCase().includes('PETG')).slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Comparison Table */}
      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        <div className="grid grid-cols-3 bg-muted/30 border-b border-border">
          <div className="p-4 text-sm font-medium text-muted-foreground">Property</div>
          <div className="p-4 text-center">
            <span className="text-base font-bold text-blue-400">PLA</span>
          </div>
          <div className="p-4 text-center">
            <span className="text-base font-bold text-emerald-400">PETG</span>
          </div>
        </div>

        {COMPARISON_DATA.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-3 border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-card/30' : ''}`}
          >
            <div className="p-3 sm:p-4 text-sm font-medium flex items-center">{row.label}</div>
            <div className={`p-3 sm:p-4 flex items-center justify-center ${row.winner === 'pla' ? 'bg-blue-500/5' : ''}`}>
              <ValueCell value={row.pla} isWinner={row.winner === 'pla'} />
            </div>
            <div className={`p-3 sm:p-4 flex items-center justify-center ${row.winner === 'petg' ? 'bg-emerald-500/5' : ''}`}>
              <ValueCell value={row.petg} isWinner={row.winner === 'petg'} />
            </div>
          </div>
        ))}

        {/* Tally */}
        <div className="grid grid-cols-3 bg-muted/50 border-t border-border">
          <div className="p-4 text-sm font-semibold">Wins</div>
          <div className="p-4 text-center">
            <span className="text-lg font-bold text-blue-400">
              {COMPARISON_DATA.filter(r => r.winner === 'pla').length}
            </span>
          </div>
          <div className="p-4 text-center">
            <span className="text-lg font-bold text-emerald-400">
              {COMPARISON_DATA.filter(r => r.winner === 'petg').length}
            </span>
          </div>
        </div>
      </div>

      {/* Top picks per material */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* PLA picks */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400" />
            Top PLA Picks
          </h3>
          <div className="space-y-3">
            {plaFilaments.map((f, i) => (
              <GuideProductCard key={f.id} filament={f} rank={i + 1} />
            ))}
            {plaFilaments.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No PLA filaments found</p>
            )}
          </div>
        </div>

        {/* PETG picks */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            Top PETG Picks
          </h3>
          <div className="space-y-3">
            {petgFilaments.map((f, i) => (
              <GuideProductCard key={f.id} filament={f} rank={i + 1} />
            ))}
            {petgFilaments.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No PETG filaments found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
