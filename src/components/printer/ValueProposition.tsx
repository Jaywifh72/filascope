import { Check } from "lucide-react";

interface ValuePropositionProps {
  benefits: string[];
}

export function ValueProposition({ benefits }: ValuePropositionProps) {
  if (!benefits || benefits.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-primary/80">
        WHY THIS PRINTER:
      </h3>
      <ul className="space-y-2.5">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check 
              className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" 
              strokeWidth={3}
            />
            <span className="text-[15px] leading-relaxed text-foreground/90">
              {benefit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
