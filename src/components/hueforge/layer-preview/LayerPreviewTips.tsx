import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const TIPS = [
  'Start with 3–4 layers of your darkest (lowest TD) filament as the base.',
  'Mid-tones typically need 1–2 layers.',
  'Highlights (highest TD) often need only 1 layer.',
  'Total layer count for a typical HueForge print: 6–12 layers.',
  'Layer height affects TD interaction — 0.08mm layers blend differently than 0.2mm.',
];

export function LayerPreviewTips() {
  return (
    <Accordion type="single" collapsible defaultValue="tips">
      <AccordionItem value="tips" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-semibold">
          HueForge Layer Tips
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
          <Link
            to="/guides/what-is-hueforge-td"
            className="inline-block mt-3 text-sm text-primary hover:underline"
          >
            Full HueForge guide →
          </Link>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
