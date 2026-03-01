import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { Breadcrumbs, BreadcrumbSchema } from '@/components/seo';
import { TdSubstituteFinder } from '@/components/hueforge/TdSubstituteFinder';
import { Skeleton } from '@/components/ui/skeleton';

export default function HueForgeSubstituteFinder() {
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['hueforge-td-database'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select(
          'id, product_title, vendor, material, color_family, color_hex, transmission_distance, variant_price, net_weight_g, product_handle, featured_image'
        )
        .not('transmission_distance', 'is', null)
        .order('transmission_distance', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DocumentHead
        title="HueForge Filament Substitute Finder — Find TD-Matched Alternatives | FilaScope"
        description="Find alternative filaments with matching TD values and colors for your HueForge projects. Compare substitutes by brand, price, and transmissivity distance."
        keywords="HueForge substitute, filament alternative, TD match, filament replacement, HueForge filament finder"
      />
      <Breadcrumbs
        items={[
          { name: 'HueForge TD Database', url: '/hueforge-td-database' },
          { name: 'Substitute Finder', url: '/hueforge-filament-substitute-finder' },
        ]}
        className="max-w-7xl mx-auto px-4 pt-6 pb-1"
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://filascope.com/' },
          { name: 'HueForge TD Database', url: 'https://filascope.com/hueforge-td-database' },
          { name: 'Substitute Finder', url: 'https://filascope.com/hueforge-filament-substitute-finder' },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : filaments ? (
          <TdSubstituteFinder filaments={filaments} compact={false} />
        ) : null}
      </div>
    </div>
  );
}
