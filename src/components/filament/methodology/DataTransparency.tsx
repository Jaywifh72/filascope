import { ExternalLink, Bell, Shield, Calendar, Users, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface DataTransparencyProps {
  sampleSize?: {
    total: number;
    userReviews: { positive: number; mixed: number; negative: number };
    labTests: number;
  };
  confidence?: {
    level: 'high' | 'medium' | 'low';
    interval: [number, number];
    marginOfError: number;
  };
  lastTested?: string;
  testingFrequency?: string;
  nextUpdate?: string;
  methodologyUrl?: string;
}

// Default values for demo
const DEFAULT_SAMPLE_SIZE = {
  total: 243,
  userReviews: { positive: 137, mixed: 94, negative: 12 },
  labTests: 47,
};

const DEFAULT_CONFIDENCE = {
  level: 'high' as const,
  interval: [9.7, 10.0] as [number, number],
  marginOfError: 0.3,
};

export function DataTransparency({
  sampleSize = DEFAULT_SAMPLE_SIZE,
  confidence = DEFAULT_CONFIDENCE,
  lastTested = 'December 2024',
  testingFrequency = 'Monthly',
  nextUpdate = 'January 2025',
  methodologyUrl = '/reference/methodology',
}: DataTransparencyProps) {
  const confidenceColors = {
    high: 'text-green-500 bg-green-500/10 border-green-500/30',
    medium: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    low: 'text-red-500 bg-red-500/10 border-red-500/30',
  };

  const totalReviews = sampleSize.userReviews.positive + sampleSize.userReviews.mixed + sampleSize.userReviews.negative;

  return (
    <div className="space-y-5">
      {/* Testing Methodology */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" />
          Testing Methodology
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This score combines standardized print tests with community feedback 
          to measure real-world performance across different printers and conditions.
        </p>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary" asChild>
          <a href={methodologyUrl} target="_blank" rel="noopener noreferrer">
            Read full testing methodology
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </Button>
      </div>

      {/* Sample Size & Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Sample Size & Confidence
        </h4>
        
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total data points:</span>
            <span className="font-medium">{sampleSize.total}</span>
          </div>
          
          {/* Review Breakdown */}
          <div className="pl-4 space-y-1.5 border-l-2 border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">User reviews:</span>
              <span className="font-medium">{totalReviews}</span>
            </div>
            <div className="flex items-center gap-1">
              <div 
                className="h-2 bg-green-500 rounded-l"
                style={{ width: `${(sampleSize.userReviews.positive / totalReviews) * 100}%` }}
              />
              <div 
                className="h-2 bg-amber-500"
                style={{ width: `${(sampleSize.userReviews.mixed / totalReviews) * 100}%` }}
              />
              <div 
                className="h-2 bg-red-500 rounded-r"
                style={{ width: `${(sampleSize.userReviews.negative / totalReviews) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="text-green-500">{sampleSize.userReviews.positive} positive</span>
              <span className="text-amber-500">{sampleSize.userReviews.mixed} mixed</span>
              <span className="text-red-500">{sampleSize.userReviews.negative} negative</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pl-4 border-l-2 border-border">
            <span className="text-muted-foreground">Lab tests:</span>
            <span className="font-medium">{sampleSize.labTests} standardized prints</span>
          </div>
        </div>

        {/* Confidence Interval */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">95% Confidence interval:</span>
            <span className="font-medium tabular-nums">
              [{confidence.interval[0].toFixed(1)} - {confidence.interval[1].toFixed(1)}]
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Margin of error:</span>
            <span className="font-medium">±{confidence.marginOfError} points</span>
          </div>
          
          {/* Confidence Badge */}
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            confidenceColors[confidence.level]
          )}>
            <Shield className="w-3 h-3" />
            {confidence.level.charAt(0).toUpperCase() + confidence.level.slice(1)} confidence - large sample size
          </div>
        </div>
      </div>

      {/* Update Schedule */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Update Schedule
        </h4>
        
        <div className="grid gap-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last tested:</span>
            <span className="font-medium">{lastTested}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Testing frequency:</span>
            <span className="font-medium">{testingFrequency}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Next update:</span>
            <span className="font-medium">{nextUpdate}</span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full h-8 text-xs">
          <Bell className="w-3 h-3 mr-1.5" />
          Notify me when score updates
        </Button>
      </div>
    </div>
  );
}
