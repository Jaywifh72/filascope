import { useJsonLd, JsonLd } from './useJsonLd';

interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string;
  image?: string;
  supply?: string[];
  tool?: string[];
}

export function HowToSchema({
  name,
  description,
  steps,
  totalTime,
  image,
  supply,
  tool,
}: HowToSchemaProps) {
  const jsonLd = steps && steps.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name,
        description,
        ...(totalTime && { totalTime }),
        ...(image && { image }),
        ...(supply && {
          supply: supply.map((item) => ({ '@type': 'HowToSupply', name: item })),
        }),
        ...(tool && {
          tool: tool.map((item) => ({ '@type': 'HowToTool', name: item })),
        }),
        step: steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.text,
          ...(step.image && { image: step.image }),
          ...(step.url && { url: step.url }),
        })),
      }
    : null;

  useJsonLd(jsonLd);

  return <JsonLd jsonLd={jsonLd} />;
}
