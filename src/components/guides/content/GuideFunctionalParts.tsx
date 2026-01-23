import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Star, Zap } from 'lucide-react';
import { GuideRelatedProducts } from '../GuideComponents';

export default function GuideFunctionalParts() {
  const recommendedProducts = [
    {
      id: 'polymaker-polylite-petg',
      name: 'PolyLite PETG',
      brand: 'Polymaker',
      material: 'PETG',
      pricePerKg: 24.99,
      badge: "Best All-Around",
    },
    {
      id: 'bambu-petg-cf',
      name: 'PETG-CF',
      brand: 'Bambu Lab',
      material: 'PETG-CF',
      pricePerKg: 34.99,
      badge: "Maximum Strength",
    },
    {
      id: 'polymaker-pla-cf',
      name: 'PolyLite PLA-CF',
      brand: 'Polymaker',
      material: 'PLA-CF',
      pricePerKg: 39.99,
      badge: "High Stiffness",
    },
  ];

  const materials = [
    {
      rank: 1,
      name: 'PETG',
      description: 'The best all-around choice for functional parts',
      strengths: ['Excellent layer adhesion', 'Good impact resistance', 'Chemical resistant', 'No enclosure needed'],
      weaknesses: ['Can string', 'Lower stiffness than ABS'],
      tempResist: '~80°C',
      difficulty: 'Easy',
    },
    {
      rank: 2,
      name: 'Carbon Fiber PETG',
      description: 'PETG reinforced with carbon fibers for extra stiffness',
      strengths: ['Very stiff', 'Excellent dimensional accuracy', 'Low warping', 'Matte finish'],
      weaknesses: ['Requires hardened nozzle', 'More brittle than pure PETG'],
      tempResist: '~85°C',
      difficulty: 'Moderate',
    },
    {
      rank: 3,
      name: 'ABS',
      description: 'Classic engineering material with excellent durability',
      strengths: ['High impact strength', 'Heat resistant', 'Can be vapor smoothed', 'Proven material'],
      weaknesses: ['Warps easily', 'Requires enclosure', 'Strong fumes'],
      tempResist: '~100°C',
      difficulty: 'Moderate',
    },
    {
      rank: 4,
      name: 'ASA',
      description: 'ABS alternative with UV resistance for outdoor use',
      strengths: ['UV stable', 'Weather resistant', 'Similar to ABS properties', 'Good for outdoor parts'],
      weaknesses: ['Requires enclosure', 'Fumes (less than ABS)', 'More expensive'],
      tempResist: '~95°C',
      difficulty: 'Moderate',
    },
    {
      rank: 5,
      name: 'Nylon (PA)',
      description: 'Ultimate strength and wear resistance',
      strengths: ['Extremely strong', 'Excellent wear resistance', 'Flexible yet tough', 'Self-lubricating'],
      weaknesses: ['Highly hygroscopic', 'Warps significantly', 'Requires dry box'],
      tempResist: '~80-120°C',
      difficulty: 'Advanced',
    },
    {
      rank: 6,
      name: 'PLA-CF',
      description: 'Carbon fiber PLA for stiff, dimensional parts',
      strengths: ['Very stiff', 'Easy to print', 'Excellent accuracy', 'No enclosure needed'],
      weaknesses: ['Lower heat resistance', 'Brittle', 'Needs hardened nozzle'],
      tempResist: '~55°C',
      difficulty: 'Easy',
    },
    {
      rank: 7,
      name: 'Polycarbonate (PC)',
      description: 'Industrial-grade strength and heat resistance',
      strengths: ['Extremely strong', 'Very high heat resistance', 'Impact resistant', 'Transparent options'],
      weaknesses: ['Difficult to print', 'High temps required', 'Warps significantly'],
      tempResist: '~135°C',
      difficulty: 'Advanced',
    },
  ];

  return (
    <article>
      <h2 id="introduction">Introduction</h2>
      <p>
        When you need 3D printed parts that actually work - brackets, gears, enclosures, 
        tools, or mechanical components - material choice is critical. The right filament 
        can mean the difference between a part that lasts years and one that breaks on first use.
      </p>
      <p>
        In this guide, we rank the best filaments for functional parts based on strength, 
        durability, ease of printing, and value.
      </p>

      <h2 id="what-makes-functional">What Makes a Filament "Functional"?</h2>
      
      <div className="not-prose my-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Layer Adhesion', desc: 'Strong bonds between layers' },
            { title: 'Impact Resistance', desc: "Won't shatter under stress" },
            { title: 'Heat Resistance', desc: 'Maintains shape when warm' },
            { title: 'Dimensional Accuracy', desc: 'Precise, predictable parts' },
          ].map((item, i) => (
            <Card key={i} className="bg-card/50 border-border">
              <CardContent className="p-4 text-center">
                <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <h2 id="top-10-ranking">Top 10 Filaments for Functional Parts</h2>
      
      <div className="not-prose my-8 space-y-6">
        {materials.slice(0, 7).map((mat, i) => (
          <Card key={i} className="bg-card/50 border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                {/* Rank Badge */}
                <div className="w-16 flex-shrink-0 bg-primary/10 flex items-center justify-center border-r border-border">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-primary">#{mat.rank}</span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{mat.name}</h3>
                    <Badge variant="outline" className={
                      mat.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                      mat.difficulty === 'Moderate' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }>
                      {mat.difficulty}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400">
                      {mat.tempResist}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{mat.description}</p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-emerald-400 mb-1">Strengths</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {mat.strengths.map((s, j) => (
                          <li key={j} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-400 mb-1">Considerations</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {mat.weaknesses.map((w, j) => (
                          <li key={j}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 id="choosing-right-material">Choosing the Right Material</h2>

      <h3 id="for-indoor-use">For Indoor Functional Parts</h3>
      <p>
        <strong>PETG</strong> is your best bet. It's easy to print, strong, and handles moderate 
        heat. If you need extra stiffness, go for <strong>Carbon Fiber PETG</strong>.
      </p>

      <h3 id="for-outdoor-use">For Outdoor Applications</h3>
      <p>
        <strong>ASA</strong> is the king of outdoor materials. It's UV stable and weather 
        resistant. Avoid PLA and regular PETG for outdoor use.
      </p>

      <h3 id="for-high-heat">For High-Heat Applications</h3>
      <p>
        If your part will experience temperatures above 80°C, you need <strong>ABS</strong>, 
        <strong>ASA</strong>, or <strong>Polycarbonate</strong>. These require enclosed printers.
      </p>

      <h3 id="for-wear-resistance">For Maximum Wear Resistance</h3>
      <p>
        <strong>Nylon</strong> excels in high-wear applications like gears, bearings, and 
        sliding parts. Its self-lubricating properties reduce friction.
      </p>

      <h2 id="printing-tips">Tips for Strong Functional Prints</h2>
      
      <div className="not-prose my-6">
        <div className="grid gap-3">
          {[
            { tip: 'Increase wall count', desc: 'Use 4-6 walls instead of 2-3 for maximum strength' },
            { tip: 'Use 100% infill strategically', desc: 'Full infill in high-stress areas only' },
            { tip: 'Orient parts properly', desc: 'Layer lines should be parallel to forces, not perpendicular' },
            { tip: 'Consider annealing', desc: 'Heat-treating PLA or PETG can increase strength 20-40%' },
            { tip: 'Use concentric top/bottom', desc: 'For load-bearing surfaces' },
          ].map((item, i) => (
            <Card key={i} className="bg-card/50 border-border">
              <CardContent className="p-3 flex items-start gap-3">
                <Star className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{item.tip}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <h2 id="conclusion">Conclusion</h2>
      <p>
        For most functional parts, <strong>PETG</strong> is the best starting point - it's 
        strong, easy to print, and works on any printer. As your needs become more specific, 
        move to carbon fiber variants for stiffness, ASA for outdoor use, or nylon for 
        maximum toughness.
      </p>
      <p>
        Remember that print settings matter as much as material choice. A well-tuned PETG 
        print can outperform a poorly-printed nylon part. Master the basics first, then 
        experiment with advanced materials.
      </p>

      <GuideRelatedProducts 
        title="Top Filaments for Functional Parts"
        products={recommendedProducts}
      />
    </article>
  );
}
