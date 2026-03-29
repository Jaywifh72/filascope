import { useJsonLd, JsonLd } from './useJsonLd';

interface VariableMeasured {
  '@type': 'PropertyValue';
  name: string;
  unitText?: string;
}

interface DatasetSchemaProps {
  name: string;
  description: string;
  url: string;
  keywords?: string[];
  creator?: { '@type': string; name: string; url: string } | string;
  dateModified?: string;
  license?: string;
  recordCount?: number;
  temporalCoverage?: string;
  spatialCoverage?: string;
  variableMeasured?: VariableMeasured[];
  distribution?: {
    '@type': string;
    encodingFormat: string;
    contentUrl: string;
  };
  isAccessibleForFree?: boolean;
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
  temporalCoverage,
  spatialCoverage,
  variableMeasured,
  distribution,
  isAccessibleForFree,
}: DatasetSchemaProps) {
  const resolvedCreator =
    typeof creator === 'string'
      ? { '@type': 'Organization', name: creator, url: 'https://filascope.com' }
      : creator;

  const resolvedDistribution =
    distribution ??
    (recordCount
      ? { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${url}/export` }
      : undefined);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url,
    keywords: keywords.length > 0 ? keywords : undefined,
    creator: resolvedCreator,
    dateModified: dateModified || new Date().toISOString().split('T')[0],
    license,
    ...(temporalCoverage && { temporalCoverage }),
    ...(spatialCoverage && { spatialCoverage }),
    ...(variableMeasured && { variableMeasured }),
    ...(resolvedDistribution && { distribution: resolvedDistribution }),
    ...(isAccessibleForFree !== undefined && { isAccessibleForFree }),
    ...(recordCount && { size: `${recordCount} filament records` }),
    includedInDataCatalog: { '@type': 'DataCatalog', name: 'FilaScope 3D Printing Database' },
  };

  useJsonLd(jsonLd);

  return <JsonLd jsonLd={jsonLd} />;
}
