import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export interface MaterialComparison {
  materialA: string;
  materialB: string;
  slugB: string;
  text: string;
}

// Static comparison data keyed by material slug
const COMPARISON_DATA: Record<string, MaterialComparison[]> = {
  pla: [
    {
      materialA: 'PLA',
      materialB: 'PETG',
      slugB: 'petg',
      text: "PLA prints at 190–220°C while PETG requires 220–250°C. PLA offers easier printability and sharper detail but PETG provides better impact resistance and heat tolerance (~80°C vs ~60°C). According to FilaScope's database, PLA filaments average $22/kg compared to PETG at $25/kg — compare specific options in FilaScope's PLA catalog.",
    },
    {
      materialA: 'PLA',
      materialB: 'ABS',
      slugB: 'abs',
      text: "PLA prints at 190–220°C while ABS requires 230–260°C with an enclosed printer. PLA offers easier bed adhesion and no warping but ABS provides superior heat resistance (~100°C) and impact strength. According to FilaScope's database, PLA filaments average $22/kg compared to ABS at $24/kg — compare specific options in FilaScope's PLA catalog.",
    },
    {
      materialA: 'PLA',
      materialB: 'PLA+',
      slugB: 'pla-plus',
      text: "Both PLA and PLA+ print at similar temperatures (190–220°C). PLA+ offers improved layer adhesion and slightly better impact resistance but standard PLA provides more consistent surface finish. According to FilaScope's database, PLA+ filaments average $24/kg compared to standard PLA at $22/kg — compare specific options in FilaScope's PLA catalog.",
    },
  ],
  petg: [
    {
      materialA: 'PETG',
      materialB: 'PLA',
      slugB: 'pla',
      text: "PETG prints at 220–250°C while PLA requires only 190–220°C. PETG offers better chemical resistance and flexibility but PLA provides easier printability and finer detail. According to FilaScope's database, PETG filaments average $25/kg compared to PLA at $22/kg — compare specific options in FilaScope's PETG catalog.",
    },
    {
      materialA: 'PETG',
      materialB: 'ABS',
      slugB: 'abs',
      text: "PETG prints at 220–250°C while ABS requires 230–260°C plus an enclosure. PETG offers easier printing and UV stability but ABS provides higher heat resistance (~100°C vs ~80°C). According to FilaScope's database, PETG filaments average $25/kg compared to ABS at $24/kg — compare specific options in FilaScope's PETG catalog.",
    },
    {
      materialA: 'PETG',
      materialB: 'ASA',
      slugB: 'asa',
      text: "PETG prints at 220–250°C while ASA requires 235–260°C with an enclosure. PETG offers easier printing without enclosure but ASA provides superior UV resistance for outdoor parts. According to FilaScope's database, PETG filaments average $25/kg compared to ASA at $30/kg — compare specific options in FilaScope's PETG catalog.",
    },
  ],
  abs: [
    {
      materialA: 'ABS',
      materialB: 'PLA',
      slugB: 'pla',
      text: "ABS prints at 230–260°C while PLA requires only 190–220°C. ABS offers superior heat resistance (~100°C) and impact strength but PLA provides easier printing with no enclosure needed. According to FilaScope's database, ABS filaments average $24/kg compared to PLA at $22/kg — compare specific options in FilaScope's ABS catalog.",
    },
    {
      materialA: 'ABS',
      materialB: 'PETG',
      slugB: 'petg',
      text: "ABS prints at 230–260°C while PETG requires 220–250°C. ABS offers higher heat resistance and easier post-processing (acetone smoothing) but PETG provides better chemical resistance and doesn't require an enclosure. According to FilaScope's database, ABS filaments average $24/kg compared to PETG at $25/kg — compare specific options in FilaScope's ABS catalog.",
    },
    {
      materialA: 'ABS',
      materialB: 'ASA',
      slugB: 'asa',
      text: "ABS and ASA print at similar temperatures (230–260°C) and both require enclosures. ABS offers lower cost and wider availability but ASA provides significantly better UV resistance for outdoor use. According to FilaScope's database, ABS filaments average $24/kg compared to ASA at $30/kg — compare specific options in FilaScope's ABS catalog.",
    },
  ],
  tpu: [
    {
      materialA: 'TPU',
      materialB: 'PETG',
      slugB: 'petg',
      text: "TPU prints at 210–230°C while PETG requires 220–250°C. TPU offers extreme flexibility and vibration dampening but PETG provides rigidity with some impact resistance. According to FilaScope's database, TPU filaments average $32/kg compared to PETG at $25/kg — compare specific options in FilaScope's TPU catalog.",
    },
    {
      materialA: 'TPU',
      materialB: 'Nylon',
      slugB: 'nylon',
      text: "TPU prints at 210–230°C while Nylon requires 240–270°C with dry storage. TPU offers rubber-like flexibility but Nylon provides superior abrasion resistance and tensile strength. According to FilaScope's database, TPU filaments average $32/kg compared to Nylon at $38/kg — compare specific options in FilaScope's TPU catalog.",
    },
  ],
  asa: [
    {
      materialA: 'ASA',
      materialB: 'ABS',
      slugB: 'abs',
      text: "ASA and ABS print at similar temperatures (235–260°C) and both require enclosures. ASA offers significantly better UV resistance for outdoor parts but ABS provides lower cost and acetone smoothing compatibility. According to FilaScope's database, ASA filaments average $30/kg compared to ABS at $24/kg — compare specific options in FilaScope's ASA catalog.",
    },
    {
      materialA: 'ASA',
      materialB: 'PETG',
      slugB: 'petg',
      text: "ASA prints at 235–260°C with an enclosure while PETG requires 220–250°C without one. ASA offers superior UV stability and heat resistance but PETG provides easier printability and lower cost. According to FilaScope's database, ASA filaments average $30/kg compared to PETG at $25/kg — compare specific options in FilaScope's ASA catalog.",
    },
  ],
  nylon: [
    {
      materialA: 'Nylon',
      materialB: 'PETG',
      slugB: 'petg',
      text: "Nylon prints at 240–270°C while PETG requires 220–250°C. Nylon offers exceptional abrasion resistance and tensile strength but PETG provides easier printing with less moisture sensitivity. According to FilaScope's database, Nylon filaments average $38/kg compared to PETG at $25/kg — compare specific options in FilaScope's Nylon catalog.",
    },
    {
      materialA: 'Nylon',
      materialB: 'PC',
      slugB: 'pc',
      text: "Nylon prints at 240–270°C while PC requires 260–310°C. Nylon offers better flexibility and abrasion resistance but PC provides higher heat deflection temperature and rigidity. According to FilaScope's database, Nylon filaments average $38/kg compared to PC at $45/kg — compare specific options in FilaScope's Nylon catalog.",
    },
  ],
  pc: [
    {
      materialA: 'PC',
      materialB: 'Nylon',
      slugB: 'nylon',
      text: "PC prints at 260–310°C while Nylon requires 240–270°C. PC offers superior heat resistance (~140°C) and optical clarity but Nylon provides better flexibility and abrasion resistance. According to FilaScope's database, PC filaments average $45/kg compared to Nylon at $38/kg — compare specific options in FilaScope's PC catalog.",
    },
    {
      materialA: 'PC',
      materialB: 'ABS',
      slugB: 'abs',
      text: "PC prints at 260–310°C while ABS requires 230–260°C. PC offers dramatically higher heat resistance (~140°C vs ~100°C) and impact strength but ABS provides easier printing at lower cost. According to FilaScope's database, PC filaments average $45/kg compared to ABS at $24/kg — compare specific options in FilaScope's PC catalog.",
    },
  ],
};

export function getComparisonData(slug: string): MaterialComparison[] {
  return COMPARISON_DATA[slug] || [];
}

export function getComparisonFAQs(slug: string, label: string): { question: string; answer: string }[] {
  const comparisons = COMPARISON_DATA[slug];
  if (!comparisons || comparisons.length === 0) return [];
  return comparisons.map((c) => ({
    question: `What is the difference between ${c.materialA} and ${c.materialB} for 3D printing?`,
    answer: c.text,
  }));
}

interface MaterialComparisonSectionProps {
  slug: string;
  label: string;
}

export function MaterialComparisonSection({ slug, label }: MaterialComparisonSectionProps) {
  const comparisons = getComparisonData(slug);
  if (comparisons.length === 0) return null;

  return (
    <section className="mb-10" aria-labelledby="material-comparison-h2">
      <h2 id="material-comparison-h2" className="text-xl font-semibold mb-4 text-foreground">
        {label} vs Other 3D Printing Materials
      </h2>

      <div className="space-y-6">
        {comparisons.map((c) => (
          <div key={`${c.materialA}-${c.materialB}`}>
            <h3 className="text-base font-semibold mb-2 text-foreground/90">
              {c.materialA} vs {c.materialB} — What's the Difference?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {c.text}
            </p>
            <Link
              to={`/materials/${c.slugB}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              Learn more about {c.materialB} →
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link
          to="/compare"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
        >
          Compare specific filaments side by side
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
