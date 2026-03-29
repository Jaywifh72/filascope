import { useJsonLd, JsonLd } from './useJsonLd';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface RelatedQuestion {
  question: string;
  answer: string;
}

interface RelatedQuestionsSectionProps {
  questions: RelatedQuestion[];
  title?: string;
  className?: string;
  /** When true, skip injecting a FAQPage JSON-LD (caller handles the merged schema). */
  suppressSchema?: boolean;
}

export function RelatedQuestionsSection({
  questions,
  title = 'People Also Ask',
  className,
  suppressSchema = false,
}: RelatedQuestionsSectionProps) {
  // Inject FAQPage schema only when not suppressed (i.e. standalone usage).
  const jsonLd = !suppressSchema && questions?.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map((q) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: { '@type': 'Answer', text: q.answer },
        })),
      }
    : null;

  useJsonLd(jsonLd);

  if (!questions?.length) return null;

  return (
    <>
      <JsonLd jsonLd={jsonLd} />
      <section className={cn('mt-12 border-t border-border pt-8', className)}>
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      <Accordion type="single" collapsible className="space-y-2">
        {questions.map((q, i) => (
          <AccordionItem
            key={i}
            value={`rq-${i}`}
            className="border border-border rounded-lg px-4 bg-card"
          >
            <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
              {q.question}
            </AccordionTrigger>
            <AccordionContent forceMount className="data-[state=closed]:hidden text-muted-foreground pb-4 leading-relaxed">
              {q.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
    </>
  );
}
