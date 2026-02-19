import { cn } from '@/lib/utils';
import { FAQSchema } from './FAQSchema';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FAQSectionProps {
  faqs: { question: string; answer: string }[];
  title?: string;
  className?: string;
}

export function FAQSection({ faqs, title = 'Frequently Asked Questions', className }: FAQSectionProps) {
  if (!faqs?.length) return null;
  return (
    <section className={cn('mt-12 border-t border-border pt-8', className)}>
      <FAQSchema faqs={faqs} />
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border border-border rounded-lg px-4 bg-card"
          >
            <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
