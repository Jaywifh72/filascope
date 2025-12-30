import { Helmet } from 'react-helmet-async';

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
  totalTime?: string; // ISO 8601 duration (e.g., "PT30M" for 30 minutes)
  image?: string;
  supply?: string[];
  tool?: string[];
}

/**
 * HowTo Schema.org structured data component
 * Helps tutorial content appear in Google's rich results
 */
export function HowToSchema({
  name,
  description,
  steps,
  totalTime,
  image,
  supply,
  tool,
}: HowToSchemaProps) {
  if (!steps || steps.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(totalTime && { totalTime }),
    ...(image && { image }),
    ...(supply && {
      supply: supply.map((item) => ({
        '@type': 'HowToSupply',
        name: item,
      })),
    }),
    ...(tool && {
      tool: tool.map((item) => ({
        '@type': 'HowToTool',
        name: item,
      })),
    }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
      ...(step.url && { url: step.url }),
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
