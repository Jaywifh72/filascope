import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Star } from 'lucide-react';
import { GuideRelatedProducts } from '../GuideComponents';

export default function GuideBestFilamentBeginners() {
  const recommendedProducts = [
    {
      id: 'bambu-pla-basic',
      name: 'PLA Basic',
      brand: 'Bambu Lab',
      material: 'PLA',
      pricePerKg: 19.99,
      badge: "Editor's Choice",
    },
    {
      id: 'hatchbox-pla',
      name: 'PLA Filament',
      brand: 'Hatchbox',
      material: 'PLA',
      pricePerKg: 22.99,
      badge: "Best Value",
    },
    {
      id: 'overture-pla',
      name: 'PLA Pro',
      brand: 'Overture',
      material: 'PLA',
      pricePerKg: 18.99,
      badge: "Budget Pick",
    },
  ];

  return (
    <article>
      <h2 id="introduction">Introduction</h2>
      <p>
        Starting your 3D printing journey? Choosing the right filament can make the difference 
        between frustration and success. The good news is that modern filaments are more 
        forgiving than ever, and there are excellent options at every price point.
      </p>
      <p>
        In this guide, we'll walk you through the best filaments for beginners in 2025, 
        explain what makes a filament "beginner-friendly," and share our top picks.
      </p>

      <h2 id="what-makes-filament-beginner-friendly">What Makes a Filament Beginner-Friendly?</h2>
      
      <div className="not-prose my-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Forgiving Temperature Range', desc: 'Works well across a wide range of settings' },
            { title: 'Low Warping', desc: "Stays flat on the bed without curling up" },
            { title: 'Minimal Stringing', desc: 'Fewer thin strings between parts of your print' },
            { title: 'Good Bed Adhesion', desc: 'Sticks to the build plate without issues' },
            { title: 'No Special Requirements', desc: "No enclosure, special nozzle, or drying needed" },
            { title: 'Consistent Diameter', desc: 'High-quality filament with minimal variation' },
          ].map((item, i) => (
            <Card key={i} className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <h2 id="why-pla-is-best">Why PLA is the Best Choice for Beginners</h2>
      <p>
        PLA (Polylactic Acid) is universally recommended as the first material for new 3D printer 
        owners. Here's why it dominates the beginner market:
      </p>
      <ul>
        <li><strong>Easy to print</strong> - Works at lower temperatures with minimal issues</li>
        <li><strong>No heated bed required</strong> - Though it helps, you can print on unheated beds</li>
        <li><strong>Low odor</strong> - Smells slightly sweet rather than chemical</li>
        <li><strong>Biodegradable</strong> - Made from corn starch or sugarcane</li>
        <li><strong>Huge color selection</strong> - Available in virtually any color imaginable</li>
        <li><strong>Affordable</strong> - Quality PLA is available from $15-25/kg</li>
      </ul>

      <h2 id="top-picks-2025">Our Top Picks for 2025</h2>

      <h3 id="best-overall">Best Overall: Bambu Lab PLA Basic</h3>
      <p>
        Bambu Lab's PLA Basic is our top recommendation for beginners. It's specifically 
        engineered for reliable printing with excellent consistency and a wide operating window.
      </p>
      <div className="not-prose my-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="font-semibold">Why We Love It</span>
            </div>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Excellent dimensional accuracy</li>
              <li>• Works perfectly with default settings on most printers</li>
              <li>• Consistent spool-to-spool quality</li>
              <li>• Good selection of colors</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <h3 id="best-value">Best Value: Hatchbox PLA</h3>
      <p>
        Hatchbox has been a trusted name in the 3D printing community for years. Their PLA 
        offers excellent quality at a competitive price point, making it perfect for beginners 
        who want to print a lot without breaking the bank.
      </p>

      <h3 id="budget-pick">Budget Pick: Overture PLA Pro</h3>
      <p>
        Overture's PLA Pro punches above its weight class. Despite the low price, it prints 
        consistently and comes in many colors. The included build surface sample is a nice bonus.
      </p>

      <h2 id="tips-for-success">Tips for Success with Your First Filament</h2>
      
      <h3 id="storage">Store It Properly</h3>
      <p>
        Even PLA can absorb moisture over time. Keep your filament in sealed bags with 
        desiccant when not in use. If prints start looking rough or you hear popping 
        sounds, the filament may need drying.
      </p>

      <h3 id="start-with-defaults">Start with Default Settings</h3>
      <p>
        Modern slicers have excellent default profiles for PLA. Start with these before 
        making adjustments. If something isn't working, it's often a mechanical issue 
        rather than a settings problem.
      </p>

      <h3 id="level-your-bed">Level Your Bed</h3>
      <p>
        The most common beginner issue is poor bed leveling. Take time to properly level 
        your bed - it makes more difference than any other setting. Many failed prints 
        are blamed on filament when the real culprit is bed adhesion.
      </p>

      <h2 id="when-to-upgrade">When to Upgrade from PLA</h2>
      <p>
        Once you've mastered PLA printing, you might want to explore other materials:
      </p>
      <ul>
        <li><strong>PETG</strong> - For stronger functional parts with moderate heat resistance</li>
        <li><strong>Silk PLA</strong> - For beautiful shiny prints (still easy to print)</li>
        <li><strong>PLA+/PLA Pro</strong> - Enhanced PLA with better strength</li>
        <li><strong>TPU</strong> - Flexible material for phone cases, gaskets, etc.</li>
      </ul>

      <h2 id="conclusion">Conclusion</h2>
      <p>
        For beginners in 2025, PLA remains the undisputed champion. Start with a quality 
        brand like Bambu Lab, Hatchbox, or Overture, learn your printer's behavior, and 
        you'll be creating amazing prints in no time. Once you're comfortable, the world 
        of engineering materials awaits!
      </p>

      <GuideRelatedProducts 
        title="Shop Beginner-Friendly Filaments"
        products={recommendedProducts}
      />
    </article>
  );
}
