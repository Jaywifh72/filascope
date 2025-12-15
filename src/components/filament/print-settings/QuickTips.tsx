import { Lightbulb } from "lucide-react";
import { getMaterialTips } from "@/lib/printSettingsData";

interface QuickTipsProps {
  material: string | null;
}

export function QuickTips({ material }: QuickTipsProps) {
  const tips = getMaterialTips(material);

  return (
    <div className="bg-muted/30 border border-border rounded-lg p-4">
      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        Quick Tips for This Material
      </h4>
      <ul className="space-y-2">
        {tips.map((tip, index) => (
          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
