import { useJsonLd } from './useJsonLd';

interface DatasetSchemaProps {
  name: string;
  description: string;
  url: string;
  keywords?: string[];
  creator?: string;
  dateModified?: string;
  license?: string;
  recordCount?: number;
}

export function DatasetSchema({
  name,
  description,
  url,
  keywords = [],
  creator = 'FilaScope',
  dateModified,
  license = 'https://creativecommons.org/licenses/by/4.0/',
  recordCount,
}: DatasetSchemaProps) {
  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url,
    keywords: keywords.length > 0 ? keywords : undefined,
    creator: { '@type': 'Organization', name: creator, url: 'https://filascope.com' },
    dateModified: dateModified || new Date().toISOString().split('T')[0],
    license,
    ...(recordCount && {
      distribution: { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${url}/export` },
      size: `${recordCount} filament records`,
    }),
    includedInDataCatalog: { '@type': 'DataCatalog', name: 'FilaScope 3D Printing Database' },
  });

  return null;
}
