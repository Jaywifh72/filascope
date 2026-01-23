import { Helmet } from 'react-helmet-async';
import { BrandComparisonView } from '@/components/brands/BrandCompare';

export default function BrandComparePage() {
  return (
    <>
      <Helmet>
        <title>Compare Filament Brands — Side-by-Side Analysis | FilaScope</title>
        <meta 
          name="description" 
          content="Compare 3D printing filament brands side-by-side. Analyze product variety, pricing, material options, and ratings to find the best brand for your needs." 
        />
        <link rel="canonical" href="https://filascope.com/brands/compare" />
      </Helmet>
      <BrandComparisonView />
    </>
  );
}
