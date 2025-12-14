import { Factory, ExternalLink, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ManufacturerResponseProps {
  statement: string | null;
  contact: string | null;
  recallUrl: string | null;
  replacementProcess: string | null;
  brand: string;
}

export function ManufacturerResponse({
  statement,
  contact,
  recallUrl,
  replacementProcess,
  brand,
}: ManufacturerResponseProps) {
  if (!statement && !contact && !recallUrl) return null;

  // Parse contact info
  const contactParts = contact?.split("|").map((s) => s.trim()) || [];
  const email = contactParts.find((p) => p.includes("@"));
  const phone = contactParts.find((p) => p.match(/^\+?[\d\s()-]+$/) || p.match(/^\d/));

  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Factory className="h-3.5 w-3.5" />
        Manufacturer Response
      </div>

      {statement && (
        <p className="text-xs text-foreground/80 leading-relaxed">
          "{statement}"
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {recallUrl && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            asChild
          >
            <a href={recallUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Official Statement
            </a>
          </Button>
        )}

        {email && (
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Mail className="h-3 w-3" />
            {email}
          </a>
        )}

        {phone && (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Phone className="h-3 w-3" />
            {phone}
          </a>
        )}
      </div>

      {replacementProcess && (
        <details className="group">
          <summary className="text-xs text-primary cursor-pointer hover:text-primary/80">
            View replacement instructions
          </summary>
          <p className="text-xs text-muted-foreground mt-2 pl-2 border-l-2 border-border">
            {replacementProcess}
          </p>
        </details>
      )}
    </div>
  );
}
