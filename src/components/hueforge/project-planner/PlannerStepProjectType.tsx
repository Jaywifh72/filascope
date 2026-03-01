import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const PROJECT_TYPES = [
  { key: 'portrait', icon: '🧑', title: 'Portrait / Face', desc: 'Detailed human face or figure. Needs precise skin tones and strong contrast.', rec: '4–6 colors' },
  { key: 'landscape', icon: '🏔️', title: 'Landscape / Scenery', desc: 'Nature scene, skyline, or environment. Needs range of greens, blues, earth tones.', rec: '4–5 colors' },
  { key: 'pet', icon: '🐕', title: 'Pet / Animal', desc: 'Animal portrait. Needs fur/feather tones and good contrast.', rec: '3–5 colors' },
  { key: 'logo', icon: '✏️', title: 'Logo / Text / Graphic', desc: 'Flat graphic, logo, or text design. Needs high contrast, fewer colors.', rec: '2–3 colors' },
  { key: 'lithophane', icon: '💡', title: 'Lithophane', desc: 'Traditional single-color lithophane for backlighting.', rec: '1 color' },
  { key: 'custom', icon: '🎨', title: 'Custom / Experimental', desc: "I know what I want, just help me find filaments.", rec: 'any' },
];

interface Props {
  selectedType: string | null;
  onSelect: (type: string) => void;
}

export function PlannerStepProjectType({ selectedType, onSelect }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">What are you making?</h2>
        <p className="text-muted-foreground">Select your project type to get tailored filament recommendations.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROJECT_TYPES.map((pt) => (
          <Card
            key={pt.key}
            className={cn(
              'cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg',
              selectedType === pt.key && 'border-primary ring-2 ring-primary/20'
            )}
            onClick={() => onSelect(pt.key)}
          >
            <CardContent className="p-6 text-center space-y-3">
              <span className="text-4xl block">{pt.icon}</span>
              <h3 className="text-lg font-semibold">{pt.title}</h3>
              <p className="text-sm text-muted-foreground">{pt.desc}</p>
              <span className="text-xs text-primary font-medium">Recommended: {pt.rec}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
