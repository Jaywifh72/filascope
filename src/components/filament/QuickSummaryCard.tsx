import React from 'react';
import { Check, X, Zap, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickFact {
  label: string;
  value: string;
}

interface QuickSummaryProps {
  quickFacts: QuickFact[];
  recommendation: {
    summary: string;
    confidence: 'high' | 'medium' | 'low';
  };
  perfectFor: string[];
  notIdealFor: string[];
  standoutFeature?: {
    title: string;
    description: string;
  };
  className?: string;
}

export function QuickSummaryCard({
  quickFacts,
  recommendation,
  perfectFor,
  notIdealFor,
  standoutFeature,
  className
}: QuickSummaryProps) {
  return (
    <div className={cn(
      "flex flex-col gap-6",
      "p-7 my-8",
      "bg-gradient-to-br from-white/[0.03] to-white/[0.01]",
      "border border-white/[0.08] rounded-[20px]",
      "max-md:p-5 max-md:my-6 max-md:gap-5",
      className
    )}>
      {/* Quick Facts Grid */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-3">
          <Zap size={16} />
          Quick Facts
        </div>
        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[500px]:grid-cols-1 max-[500px]:gap-3">
          {quickFacts.map((fact, idx) => (
            <div 
              key={idx}
              className="p-3.5 px-4 bg-white/[0.02] border border-white/[0.06] rounded-xl"
            >
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {fact.label}
              </div>
              <div className="text-[15px] font-bold text-foreground">
                {fact.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="pt-5 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-3">
          <Target size={16} />
          Our Take
        </div>
        <p className="text-[15px] font-medium text-slate-200 leading-relaxed m-0 mb-3">
          {recommendation.summary}
        </p>
        {recommendation.confidence === 'high' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-400">
            <Check size={14} />
            Highly Recommended
          </div>
        )}
        {recommendation.confidence === 'medium' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-400">
            <Check size={14} />
            Recommended
          </div>
        )}
      </div>

      {/* Perfect For / Not Ideal For */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-6 pt-5 border-t border-white/[0.06] max-[700px]:grid-cols-1 max-[700px]:gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-bold text-emerald-400 mb-3">
            <Check size={16} />
            Perfect For
          </div>
          <div className="flex flex-col gap-2">
            {perfectFor.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm font-medium text-slate-400">
                <Check size={14} className="flex-shrink-0 mt-0.5 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
        
        <div className="w-px bg-white/[0.08] max-[700px]:hidden" />
        
        <div>
          <div className="flex items-center gap-2 text-[13px] font-bold text-amber-400 mb-3">
            <AlertTriangle size={16} />
            Not Ideal For
          </div>
          <div className="flex flex-col gap-2">
            {notIdealFor.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm font-medium text-slate-400">
                <X size={14} className="flex-shrink-0 mt-0.5 text-slate-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Standout Feature */}
      {standoutFeature && (
        <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl">
          <div className="text-2xl leading-none">⚡</div>
          <div>
            <div className="text-sm font-bold text-amber-400 mb-1">
              {standoutFeature.title}
            </div>
            <div className="text-[13px] font-medium text-slate-400 leading-relaxed">
              {standoutFeature.description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
