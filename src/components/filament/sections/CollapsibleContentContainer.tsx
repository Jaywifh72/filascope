import React, { useState } from 'react';
import { 
  FileText, 
  Settings, 
  TrendingDown, 
  Cpu,
  HelpCircle,
  Thermometer,
  Package
} from 'lucide-react';
import { ExpandableSection } from '@/components/filament/ExpandableSection';
import { SpecificationsContent } from './SpecificationsContent';
import { PrintSettingsContent } from './PrintSettingsContent';
import { TechnicalContent } from './TechnicalContent';
import { FAQContent } from './FAQContent';
import { Database } from '@/integrations/supabase/types';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface CollapsibleContentContainerProps {
  filament: Filament;
  className?: string;
}

export function CollapsibleContentContainer({ filament, className }: CollapsibleContentContainerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const handleSectionToggle = (id: string, isExpanded: boolean) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (isExpanded) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  // Define sections configuration
  const sections = [
    {
      id: 'specifications',
      title: 'Detailed Specifications',
      icon: <FileText size={20} />,
      show: true,
      component: <SpecificationsContent filament={filament} />
    },
    {
      id: 'print-settings',
      title: 'Recommended Print Settings',
      icon: <Thermometer size={20} />,
      show: filament.nozzle_temp_min_c || filament.bed_temp_min_c,
      component: <PrintSettingsContent filament={filament} />
    },
    {
      id: 'moisture-care',
      title: 'Storage & Care',
      icon: <Package size={20} />,
      show: filament.moisture_care || filament.drying_temp_c,
      component: <TechnicalContent filament={filament} type="moisture" />
    },
    {
      id: 'technical',
      title: 'Technical Deep Dive',
      icon: <Cpu size={20} />,
      show: filament.tensile_strength_xy_mpa || filament.density_g_cm3,
      component: <TechnicalContent filament={filament} type="mechanical" />
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      icon: <HelpCircle size={20} />,
      show: true,
      component: <FAQContent
        material={filament.material}
        brand={filament.vendor}
        productName={filament.product_title}
        nozzleTempMin={filament.nozzle_temp_min_c}
        nozzleTempMax={filament.nozzle_temp_max_c}
        bedTempMin={filament.bed_temp_min_c}
        bedTempMax={filament.bed_temp_max_c}
        transmissionDistance={(filament as any).transmission_distance}
        price={filament.variant_price}
      />
    }
  ].filter(section => section.show);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap mb-5">
        <h2 className="text-xl font-bold text-foreground">Learn More</h2>
        <span className="text-sm font-medium text-muted-foreground">
          Click any section to expand
        </span>
        {expandedSections.size > 0 && (
          <button 
            onClick={collapseAll}
            className="ml-auto px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
          >
            Collapse All
          </button>
        )}
      </div>
      
      {/* Sections Stack */}
      <div className="flex flex-col gap-3">
        {sections.map((section) => (
          <ExpandableSection
            key={section.id}
            id={section.id}
            title={section.title}
            icon={section.icon}
            defaultExpanded={false}
            onToggle={handleSectionToggle}
          >
            {section.component}
          </ExpandableSection>
        ))}
      </div>
    </div>
  );
}
