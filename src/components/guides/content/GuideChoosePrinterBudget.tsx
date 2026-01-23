import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, DollarSign, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function GuideChoosePrinterBudget() {
  return (
    <article>
      <h2 id="introduction">Introduction</h2>
      <p>
        The 3D printer market has exploded with options at every price point. Whether you 
        have $200 or $2000 to spend, there's a printer that's right for you. But with so 
        many choices, how do you decide?
      </p>
      <p>
        In this guide, we'll break down what features matter at each price tier and 
        recommend specific printers that offer the best value for your money.
      </p>

      <h2 id="price-tiers">Understanding Price Tiers</h2>
      
      <div className="not-prose my-6">
        <div className="space-y-4">
          {[
            { 
              tier: 'Entry Level', 
              range: '$150-300', 
              color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
              features: ['Basic printing capability', 'Manual bed leveling', 'Slower print speeds', 'Good for learning'],
            },
            { 
              tier: 'Mid-Range', 
              range: '$300-600', 
              color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
              features: ['Auto bed leveling', 'Better build quality', 'Faster printing', 'More reliable'],
            },
            { 
              tier: 'Prosumer', 
              range: '$600-1500', 
              color: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
              features: ['Enclosed chambers', 'Multi-material capability', 'High-speed printing', 'Premium features'],
            },
            { 
              tier: 'Professional', 
              range: '$1500+', 
              color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
              features: ['Industrial reliability', 'Advanced materials support', 'Large build volumes', 'Business-ready'],
            },
          ].map((item, i) => (
            <Card key={i} className={`border ${item.color.split(' ')[1]}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className={item.color}>
                    {item.tier}
                  </Badge>
                  <span className="text-lg font-bold">{item.range}</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {item.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <h2 id="entry-level">Entry Level ($150-300)</h2>
      <p>
        Entry-level printers are perfect for learning the basics of 3D printing. They 
        typically require more hands-on calibration but can produce excellent results 
        once dialed in.
      </p>

      <h3 id="entry-what-to-expect">What to Expect</h3>
      <ul>
        <li>Manual bed leveling (check before each print)</li>
        <li>Slower print speeds (40-60mm/s typical)</li>
        <li>Basic features - no auto-leveling or enclosure</li>
        <li>May require modifications for best results</li>
        <li>Excellent community support and upgrade paths</li>
      </ul>

      <h3 id="entry-recommendations">Our Recommendations</h3>
      <p>
        The <strong>Creality Ender 3 V3 SE</strong> is our top pick in this category. It 
        offers auto bed leveling at an entry-level price, making it much more beginner-friendly 
        than previous generations.
      </p>

      <h2 id="mid-range">Mid-Range ($300-600)</h2>
      <p>
        Mid-range printers offer the best balance of price and features for most hobbyists. 
        Auto bed leveling becomes standard, print quality improves, and reliability increases.
      </p>

      <h3 id="mid-what-to-expect">What to Expect</h3>
      <ul>
        <li>Automatic bed leveling and calibration</li>
        <li>Better print quality out of the box</li>
        <li>Faster print speeds (80-150mm/s)</li>
        <li>More rigid frames and better components</li>
        <li>Quieter operation</li>
      </ul>

      <h3 id="mid-recommendations">Our Recommendations</h3>
      <p>
        The <strong>Bambu Lab A1</strong> has revolutionized this price bracket. It offers 
        features previously only found in much more expensive machines, including high-speed 
        printing and excellent reliability.
      </p>

      <h2 id="prosumer">Prosumer ($600-1500)</h2>
      <p>
        Prosumer printers are for serious hobbyists and small businesses. They handle 
        engineering materials, offer multi-color printing, and provide production-ready 
        reliability.
      </p>

      <h3 id="prosumer-what-to-expect">What to Expect</h3>
      <ul>
        <li>Enclosed build chambers for ABS/ASA/PA</li>
        <li>Multi-color/multi-material capability</li>
        <li>Very high print speeds (200-500mm/s)</li>
        <li>Advanced features like cameras and remote monitoring</li>
        <li>Minimal calibration required</li>
      </ul>

      <h3 id="prosumer-recommendations">Our Recommendations</h3>
      <p>
        The <strong>Bambu Lab P1S Combo</strong> is our top prosumer choice. With its 
        enclosed chamber, AMS (Automatic Material System) capability, and industry-leading 
        speeds, it handles everything from PLA to nylon with ease.
      </p>

      <h2 id="professional">Professional ($1500+)</h2>
      <p>
        Professional-grade printers are investments for businesses and advanced users 
        who need absolute reliability, large build volumes, or specialized capabilities.
      </p>

      <h3 id="professional-recommendations">Our Recommendations</h3>
      <p>
        The <strong>Bambu Lab X1 Carbon Combo</strong> represents the pinnacle of consumer 
        3D printing. With an integrated carbon fiber LIDAR system, hardened steel nozzle, 
        and the most advanced sensors available, it handles the most demanding materials 
        and applications.
      </p>

      <h2 id="key-features">Key Features to Consider</h2>

      <h3 id="build-volume">Build Volume</h3>
      <p>
        Consider what you'll actually print. A 220x220x250mm bed handles most projects. 
        Larger build volumes are nice but increase cost and footprint.
      </p>

      <h3 id="print-speed">Print Speed</h3>
      <p>
        Modern high-speed printers (300-500mm/s) can dramatically reduce print times. 
        However, slower printers can still produce excellent quality - it just takes longer.
      </p>

      <h3 id="material-compatibility">Material Compatibility</h3>
      <p>
        If you only plan to print PLA and PETG, you don't need an enclosed printer. 
        For ABS, ASA, PC, or nylon, look for enclosed chambers with heated beds up to 110°C+.
      </p>

      <h2 id="conclusion">Conclusion</h2>
      <p>
        For most beginners, we recommend starting in the mid-range ($300-600) category. 
        The Bambu Lab A1 offers incredible value and a smooth learning experience. 
        If budget is tight, entry-level machines like the Ender 3 V3 SE are capable 
        machines that will grow with you.
      </p>
      <p>
        Remember: the best printer is one you'll actually use. Don't overinvest in 
        features you don't need, but don't cheap out on reliability if you'll be printing frequently.
      </p>

      <div className="not-prose my-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Ready to Browse Printers?</h3>
            <p className="text-muted-foreground mb-4">
              Check out our comprehensive printer database with detailed specs and comparisons.
            </p>
            <Button asChild>
              <Link to="/printers">Browse All Printers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
