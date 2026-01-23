import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Thermometer, Flame } from 'lucide-react';
import { GuideRelatedProducts } from '../GuideComponents';

export default function GuideTemperatureSettings() {
  return (
    <article>
      <h2 id="introduction">Introduction</h2>
      <p>
        Temperature is one of the most critical variables in 3D printing. Getting it wrong 
        can lead to poor layer adhesion, stringing, warping, or even damage to your printer. 
        Getting it right means strong, beautiful prints.
      </p>
      <p>
        In this guide, we'll explain how nozzle and bed temperatures affect your prints 
        and how to find the perfect settings for any filament.
      </p>

      <h2 id="nozzle-temperature">Understanding Nozzle Temperature</h2>
      <p>
        The nozzle (or hotend) temperature determines how fluid the filament becomes as it's 
        extruded. This affects layer adhesion, stringing, and overall print quality.
      </p>

      <h3 id="too-cold">Signs Your Nozzle is Too Cold</h3>
      <div className="not-prose my-4">
        <ul className="space-y-2">
          {[
            'Weak layer adhesion - layers separate easily',
            'Under-extrusion - gaps in walls or infill',
            'Clicking or grinding from the extruder',
            'Filament not flowing smoothly',
            'Poor surface quality on top layers',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Thermometer className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <h3 id="too-hot">Signs Your Nozzle is Too Hot</h3>
      <div className="not-prose my-4">
        <ul className="space-y-2">
          {[
            'Excessive stringing between parts',
            'Blobs and zits on the surface',
            'Glossy or "wet" looking layers',
            'Drooping or sagging on overhangs',
            'Color changes in the filament',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Flame className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <h2 id="material-temps">Temperature Ranges by Material</h2>
      
      <div className="not-prose my-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Material</th>
                <th className="text-center py-3 px-4 font-semibold">Nozzle Temp</th>
                <th className="text-center py-3 px-4 font-semibold">Bed Temp</th>
                <th className="text-center py-3 px-4 font-semibold">Enclosure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 px-4 font-medium">PLA</td>
                <td className="text-center py-3 px-4">190-220°C</td>
                <td className="text-center py-3 px-4">50-70°C</td>
                <td className="text-center py-3 px-4">Optional</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">PETG</td>
                <td className="text-center py-3 px-4">220-250°C</td>
                <td className="text-center py-3 px-4">70-90°C</td>
                <td className="text-center py-3 px-4">Optional</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">ABS</td>
                <td className="text-center py-3 px-4">220-260°C</td>
                <td className="text-center py-3 px-4">90-110°C</td>
                <td className="text-center py-3 px-4">Required</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">ASA</td>
                <td className="text-center py-3 px-4">230-260°C</td>
                <td className="text-center py-3 px-4">90-110°C</td>
                <td className="text-center py-3 px-4">Required</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">TPU</td>
                <td className="text-center py-3 px-4">210-240°C</td>
                <td className="text-center py-3 px-4">40-60°C</td>
                <td className="text-center py-3 px-4">Optional</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">Nylon (PA)</td>
                <td className="text-center py-3 px-4">240-280°C</td>
                <td className="text-center py-3 px-4">70-100°C</td>
                <td className="text-center py-3 px-4">Required</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">PC</td>
                <td className="text-center py-3 px-4">260-300°C</td>
                <td className="text-center py-3 px-4">100-120°C</td>
                <td className="text-center py-3 px-4">Required</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="not-prose my-8">
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-400">Important Note</p>
              <p className="text-sm text-muted-foreground">
                These are general ranges. Always check your specific filament's recommended 
                settings - they can vary significantly between brands and even colors.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 id="bed-temperature">Understanding Bed Temperature</h2>
      <p>
        Bed temperature affects first layer adhesion and warping. It keeps the bottom of 
        your print warm enough to stick but not so hot that it deforms.
      </p>

      <h3 id="bed-too-cold">Signs Your Bed is Too Cold</h3>
      <ul>
        <li>First layer doesn't stick</li>
        <li>Corners lifting (warping)</li>
        <li>Print coming loose during printing</li>
        <li>Poor first layer quality</li>
      </ul>

      <h3 id="bed-too-hot">Signs Your Bed is Too Hot</h3>
      <ul>
        <li>"Elephant foot" - first layer bulging outward</li>
        <li>Difficult to remove prints after cooling</li>
        <li>Bottom layers look melted or distorted</li>
        <li>Warping on larger prints (thermal gradients)</li>
      </ul>

      <h2 id="temperature-tower">How to Find the Perfect Temperature</h2>
      <p>
        The best way to find optimal settings is to print a temperature tower. This 
        is a test print that prints sections at different temperatures so you can 
        visually compare the results.
      </p>

      <h3 id="tower-steps">Steps to Print a Temperature Tower</h3>
      <ol>
        <li>Download a temperature tower model (search "temperature tower STL")</li>
        <li>Set up your slicer with temperature changes at each section</li>
        <li>Print the tower and examine each section</li>
        <li>Look for the section with best layer adhesion and minimal stringing</li>
        <li>Use that temperature as your baseline</li>
      </ol>

      <h2 id="first-layer">First Layer Settings</h2>
      <p>
        Many slicers allow different temperatures for the first layer. A slightly 
        higher temperature (5-10°C) can improve adhesion without affecting overall 
        print quality.
      </p>

      <h2 id="speed-relationship">Temperature and Speed Relationship</h2>
      <p>
        Higher print speeds often require higher temperatures. When the filament moves 
        through the hotend faster, it has less time to heat up. If you're printing fast, 
        you may need to increase temperature by 5-15°C.
      </p>

      <h2 id="conclusion">Conclusion</h2>
      <p>
        Temperature settings are not set-and-forget values. They depend on your specific 
        printer, filament brand, ambient conditions, and print settings. Start with the 
        manufacturer's recommendations, print a temperature tower for fine-tuning, and 
        adjust based on the results you see.
      </p>
      <p>
        Remember: if your prints suddenly start having issues with a filament that 
        worked before, check if ambient temperature or humidity has changed - these 
        can affect optimal settings!
      </p>
    </article>
  );
}
