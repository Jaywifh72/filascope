import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, ShoppingCart } from 'lucide-react';
import { GuideRelatedProducts } from '../GuideComponents';

export default function GuidePLAvsPETGvsABS() {
  const recommendedProducts = [
    {
      id: 'bambu-pla-basic',
      name: 'PLA Basic',
      brand: 'Bambu Lab',
      material: 'PLA',
      pricePerKg: 19.99,
      badge: "Best for Beginners",
    },
    {
      id: 'overture-petg',
      name: 'PETG Filament',
      brand: 'Overture',
      material: 'PETG',
      pricePerKg: 21.99,
      badge: "Best Value PETG",
    },
    {
      id: 'polymaker-asa',
      name: 'PolyLite ASA',
      brand: 'Polymaker',
      material: 'ASA',
      pricePerKg: 29.99,
      badge: "Outdoor Use",
    },
  ];

  return (
    <article>
      <h2 id="introduction">Introduction</h2>
      <p>
        Choosing the right filament is one of the most important decisions you'll make in 3D printing. 
        PLA, PETG, and ABS are the three most popular materials, each with distinct characteristics 
        that make them ideal for different applications.
      </p>
      <p>
        In this comprehensive guide, we'll break down the pros and cons of each material, 
        help you understand when to use each one, and recommend our top picks for 2025.
      </p>

      <h2 id="quick-comparison">Quick Comparison</h2>
      <div className="not-prose my-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Property</th>
                <th className="text-center py-3 px-4 font-semibold text-emerald-400">PLA</th>
                <th className="text-center py-3 px-4 font-semibold text-blue-400">PETG</th>
                <th className="text-center py-3 px-4 font-semibold text-amber-400">ABS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 px-4">Ease of Printing</td>
                <td className="text-center py-3 px-4">⭐⭐⭐⭐⭐</td>
                <td className="text-center py-3 px-4">⭐⭐⭐⭐</td>
                <td className="text-center py-3 px-4">⭐⭐⭐</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Strength</td>
                <td className="text-center py-3 px-4">⭐⭐⭐</td>
                <td className="text-center py-3 px-4">⭐⭐⭐⭐</td>
                <td className="text-center py-3 px-4">⭐⭐⭐⭐</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Heat Resistance</td>
                <td className="text-center py-3 px-4">⭐⭐</td>
                <td className="text-center py-3 px-4">⭐⭐⭐</td>
                <td className="text-center py-3 px-4">⭐⭐⭐⭐⭐</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Flexibility</td>
                <td className="text-center py-3 px-4">⭐⭐</td>
                <td className="text-center py-3 px-4">⭐⭐⭐⭐</td>
                <td className="text-center py-3 px-4">⭐⭐⭐</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Nozzle Temp</td>
                <td className="text-center py-3 px-4">190-220°C</td>
                <td className="text-center py-3 px-4">220-250°C</td>
                <td className="text-center py-3 px-4">220-260°C</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Bed Temp</td>
                <td className="text-center py-3 px-4">50-70°C</td>
                <td className="text-center py-3 px-4">70-90°C</td>
                <td className="text-center py-3 px-4">90-110°C</td>
              </tr>
              <tr>
                <td className="py-3 px-4">Enclosure Required</td>
                <td className="text-center py-3 px-4">No</td>
                <td className="text-center py-3 px-4">No</td>
                <td className="text-center py-3 px-4">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h2 id="pla-polylactic-acid">PLA (Polylactic Acid)</h2>
      <p>
        PLA is the most popular 3D printing material and for good reason. Made from renewable 
        resources like corn starch, it's biodegradable and produces minimal odor when printing.
      </p>

      <h3 id="pla-pros">Pros of PLA</h3>
      <div className="not-prose my-4">
        <ul className="space-y-2">
          {[
            'Easiest material to print - perfect for beginners',
            'No heated bed required (though recommended)',
            'No enclosure needed',
            'Excellent detail and surface finish',
            'Wide color selection',
            'Low warping and minimal shrinkage',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <h3 id="pla-cons">Cons of PLA</h3>
      <div className="not-prose my-4">
        <ul className="space-y-2">
          {[
            'Low heat resistance (softens at ~60°C)',
            'Brittle compared to PETG/ABS',
            'Not suitable for outdoor use',
            'Can degrade over time in humid conditions',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <h3 id="pla-best-for">Best Uses for PLA</h3>
      <p>
        PLA excels at decorative items, prototypes, cosplay props, figurines, and any print 
        that won't be exposed to heat or significant mechanical stress.
      </p>

      <h2 id="petg">PETG (Polyethylene Terephthalate Glycol)</h2>
      <p>
        PETG combines the ease of PLA with improved mechanical properties. It's the go-to 
        choice for functional parts that need more durability than PLA can offer.
      </p>

      <h3 id="petg-pros">Pros of PETG</h3>
      <div className="not-prose my-4">
        <ul className="space-y-2">
          {[
            'Excellent layer adhesion and strength',
            'More flexible than PLA - less likely to crack',
            'Good chemical resistance',
            'Better heat resistance than PLA (~80°C)',
            'Food-safe options available',
            'No enclosure required',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <h3 id="petg-cons">Cons of PETG</h3>
      <div className="not-prose my-4">
        <ul className="space-y-2">
          {[
            'More prone to stringing than PLA',
            'Can be scratched more easily',
            'Hygroscopic - absorbs moisture from air',
            'Slightly harder to dial in settings',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <h2 id="abs">ABS (Acrylonitrile Butadiene Styrene)</h2>
      <p>
        ABS is an industrial-grade thermoplastic known for its toughness and heat resistance. 
        It's what LEGO bricks are made of, which speaks to its durability.
      </p>

      <h3 id="abs-pros">Pros of ABS</h3>
      <div className="not-prose my-4">
        <ul className="space-y-2">
          {[
            'Excellent heat resistance (~100°C+)',
            'Very tough and impact resistant',
            'Can be vapor smoothed with acetone',
            'Good for mechanical parts',
            'Long-term durability',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <h3 id="abs-cons">Cons of ABS</h3>
      <div className="not-prose my-4">
        <ul className="space-y-2">
          {[
            'Requires enclosed printer',
            'Strong fumes - needs ventilation',
            'Prone to warping',
            'Higher bed temperatures required',
            'More challenging to print successfully',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="not-prose my-8">
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-400">Safety Note</p>
              <p className="text-sm text-muted-foreground">
                ABS releases fumes during printing that can be harmful with prolonged exposure. 
                Always use in a well-ventilated area or with an enclosure and filtration system.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 id="which-should-you-choose">Which Should You Choose?</h2>
      
      <h3 id="choose-pla">Choose PLA If...</h3>
      <p>
        You're a beginner, printing decorative items, prototyping designs, or don't have 
        an enclosed printer. It's the safest choice for most hobbyist applications.
      </p>

      <h3 id="choose-petg">Choose PETG If...</h3>
      <p>
        You need functional parts with good strength, water resistance, or moderate heat 
        resistance. It's the best "upgrade" from PLA for most users.
      </p>

      <h3 id="choose-abs">Choose ABS If...</h3>
      <p>
        You have an enclosed printer and need maximum heat resistance or parts that will 
        be vapor smoothed. Ideal for automotive parts and high-temperature applications.
      </p>

      <h2 id="conclusion">Conclusion</h2>
      <p>
        For most users, we recommend starting with PLA and moving to PETG as your skills 
        improve. ABS is best reserved for specific applications where its heat resistance 
        is truly needed. Consider ASA as an alternative to ABS - it offers similar properties 
        with better UV resistance and easier printing.
      </p>

      <GuideRelatedProducts 
        title="Recommended Filaments"
        products={recommendedProducts}
      />
    </article>
  );
}
