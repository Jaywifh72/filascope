import { DocumentHead } from '@/components/seo/DocumentHead';
import { BrandComparisonView } from '@/components/brands/BrandCompare';

export default function BrandComparePage() {
  return (
    <>
      <DocumentHead
        title="Compare Filament Brands — Side-by-Side Analysis | FilaScope"
        description="Compare 3D printing filament brands side-by-side. Analyze product variety, pricing, material options, and ratings to find the best brand for your needs."
      />
      <BrandComparisonView />
    </>
  );
}
