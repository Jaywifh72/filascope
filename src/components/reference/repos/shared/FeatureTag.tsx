import React from 'react';
import { Check, X } from 'lucide-react';

interface FeatureTagProps {
  label: string;
  active: boolean;
}

const FeatureTag: React.FC<FeatureTagProps> = ({ label, active }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
        active 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
          : 'bg-muted/30 text-muted-foreground/50 border border-border/30'
      }`}
    >
      {active ? <Check size={12} /> : <X size={12} />}
      {label}
    </span>
  );
};

export default FeatureTag;
