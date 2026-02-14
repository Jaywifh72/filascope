import { type GuideFilament } from '@/hooks/useGuideFilaments';
import { GuideProductCard } from './GuideProductCard';
import { Check, X } from 'lucide-react';

interface GuideVSComparisonProps {
  filaments: GuideFilament[];
  materialA?: string;
  materialB?: string;
}

interface PropertyRow {
  label: string;
  a: string | boolean;
  b: string | boolean;
  winner: 'a' | 'b' | 'tie';
}

const VS_DATA: Record<string, PropertyRow[]> = {
  'PLA|PETG': [
    { label: 'Ease of Printing', a: '★★★★★', b: '★★★☆☆', winner: 'a' },
    { label: 'Impact Strength', a: '★★☆☆☆', b: '★★★★☆', winner: 'b' },
    { label: 'Heat Resistance', a: '~60°C', b: '~80°C', winner: 'b' },
    { label: 'Flexibility', a: 'Brittle', b: 'Semi-flexible', winner: 'b' },
    { label: 'Surface Quality', a: '★★★★★', b: '★★★☆☆', winner: 'a' },
    { label: 'Stringing', a: 'Minimal', b: 'Moderate', winner: 'a' },
    { label: 'Bed Adhesion', a: 'Easy (50–60°C)', b: 'Aggressive (70–80°C)', winner: 'a' },
    { label: 'Enclosure Needed', a: false, b: false, winner: 'tie' },
    { label: 'Chemical Resistance', a: 'Low', b: 'Moderate', winner: 'b' },
    { label: 'UV Resistance', a: 'Poor', b: 'Moderate', winner: 'b' },
    { label: 'Price Range', a: '$15–25/kg', b: '$18–30/kg', winner: 'a' },
    { label: 'Color Options', a: 'Extensive', b: 'Good', winner: 'a' },
    { label: 'Food Safe (raw)', a: true, b: true, winner: 'tie' },
    { label: 'Biodegradable', a: true, b: false, winner: 'a' },
  ],
  'PLA+|PLA Pro': [
    { label: 'Impact Resistance', a: '★★★★☆', b: '★★★★☆', winner: 'tie' },
    { label: 'Layer Adhesion', a: '★★★★☆', b: '★★★★☆', winner: 'tie' },
    { label: 'Heat Resistance', a: '~62°C', b: '~65°C', winner: 'b' },
    { label: 'Ease of Printing', a: '★★★★☆', b: '★★★★☆', winner: 'tie' },
    { label: 'Surface Quality', a: '★★★★☆', b: '★★★★★', winner: 'b' },
    { label: 'Nozzle Temp', a: '205–230°C', b: '210–230°C', winner: 'tie' },
    { label: 'Brittleness', a: 'Reduced', b: 'Reduced', winner: 'tie' },
    { label: 'Price Premium', a: '~10% over PLA', b: '~15% over PLA', winner: 'a' },
    { label: 'Brand Availability', a: 'Very wide', b: 'Moderate', winner: 'a' },
    { label: 'Color Options', a: 'Extensive', b: 'Good', winner: 'a' },
    { label: 'Documentation', a: 'Varies', b: 'Usually better', winner: 'b' },
    { label: 'Standardized Formula', a: false, b: false, winner: 'tie' },
  ],
  'ASA|ABS': [
    { label: 'UV Resistance', a: '★★★★★', b: '★★☆☆☆', winner: 'a' },
    { label: 'Weathering', a: 'Excellent', b: 'Poor', winner: 'a' },
    { label: 'Heat Resistance', a: '~100°C', b: '~100°C', winner: 'tie' },
    { label: 'Impact Strength', a: '★★★★☆', b: '★★★★☆', winner: 'tie' },
    { label: 'Ease of Printing', a: '★★★☆☆', b: '★★★☆☆', winner: 'tie' },
    { label: 'Warping Tendency', a: 'Moderate', b: 'High', winner: 'a' },
    { label: 'Enclosure Required', a: true, b: true, winner: 'tie' },
    { label: 'Nozzle Temp', a: '240–270°C', b: '230–260°C', winner: 'b' },
    { label: 'Fumes / Ventilation', a: 'Required', b: 'Required', winner: 'tie' },
    { label: 'Acetone Smoothing', a: 'Difficult', b: 'Easy', winner: 'b' },
    { label: 'Price Range', a: '$22–35/kg', b: '$18–28/kg', winner: 'b' },
    { label: 'Color Options', a: 'Moderate', b: 'Extensive', winner: 'b' },
    { label: 'Outdoor Durability', a: '★★★★★', b: '★★☆☆☆', winner: 'a' },
  ],
};

function getComparisonKey(materialA: string, materialB: string): string {
  const key = `${materialA}|${materialB}`;
  if (VS_DATA[key]) return key;
  const reverseKey = `${materialB}|${materialA}`;
  if (VS_DATA[reverseKey]) return reverseKey;
  return key;
}

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

function detectMaterials(filaments: GuideFilament[]): [string, string] {
  const materialSet = new Set<string>();
  for (const f of filaments) {
    if (f.material) materialSet.add(f.material.trim());
  }
  const arr = Array.from(materialSet);
  if (arr.length >= 2) return [arr[0], arr[1]];
  if (arr.length === 1) return [arr[0], arr[0]];
  return ['Material A', 'Material B'];
}

export function GuideVSComparison({ filaments, materialA, materialB }: GuideVSComparisonProps) {
  // Auto-detect materials if not provided
  const [detectedA, detectedB] = detectMaterials(filaments);
  const matA = materialA || detectedA;
  const matB = materialB || detectedB;

  const comparisonKey = getComparisonKey(matA, matB);
  const comparisonData = VS_DATA[comparisonKey];
  const isReversed = comparisonKey !== `${matA}|${matB}` && VS_DATA[comparisonKey];

  // Split filaments into two groups
  const groupA = filaments.filter(f => f.material?.toUpperCase().includes(matA.toUpperCase())).slice(0, 3);
  const groupB = filaments.filter(f => f.material?.toUpperCase().includes(matB.toUpperCase())).slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Comparison Table */}
      {comparisonData && (
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="grid grid-cols-3 bg-muted/30 border-b border-border">
            <div className="p-4 text-sm font-medium text-muted-foreground">Property</div>
            <div className="p-4 text-center">
              <span className="text-base font-bold text-blue-400">
                {isReversed ? matB : matA}
              </span>
            </div>
            <div className="p-4 text-center">
              <span className="text-base font-bold text-emerald-400">
                {isReversed ? matA : matB}
              </span>
            </div>
          </div>

          {comparisonData.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-card/30' : ''}`}
            >
              <div className="p-3 sm:p-4 text-sm font-medium flex items-center">{row.label}</div>
              <div className={`p-3 sm:p-4 flex items-center justify-center ${row.winner === 'a' ? 'bg-blue-500/5' : ''}`}>
                <ValueCell value={row.a} isWinner={row.winner === 'a'} />
              </div>
              <div className={`p-3 sm:p-4 flex items-center justify-center ${row.winner === 'b' ? 'bg-emerald-500/5' : ''}`}>
                <ValueCell value={row.b} isWinner={row.winner === 'b'} />
              </div>
            </div>
          ))}

          {/* Tally */}
          <div className="grid grid-cols-3 bg-muted/50 border-t border-border">
            <div className="p-4 text-sm font-semibold">Wins</div>
            <div className="p-4 text-center">
              <span className="text-lg font-bold text-blue-400">
                {comparisonData.filter(r => r.winner === 'a').length}
              </span>
            </div>
            <div className="p-4 text-center">
              <span className="text-lg font-bold text-emerald-400">
                {comparisonData.filter(r => r.winner === 'b').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top picks per material */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400" />
            Top {matA} Picks
          </h3>
          <div className="space-y-3">
            {groupA.map((f, i) => (
              <GuideProductCard key={f.id} filament={f} rank={i + 1} />
            ))}
            {groupA.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No {matA} filaments found</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            Top {matB} Picks
          </h3>
          <div className="space-y-3">
            {groupB.map((f, i) => (
              <GuideProductCard key={f.id} filament={f} rank={i + 1} />
            ))}
            {groupB.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No {matB} filaments found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
