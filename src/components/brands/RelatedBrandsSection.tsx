import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { toBrandSlug } from "@/utils/brandSlug";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getBrandLogo } from "@/lib/brandLogos";

// Static adjacency map — curated competitors for major brands.
// Each entry: [brand name, context tag explaining why related]
const RELATED_BRANDS_MAP: Record<string, [string, string][]> = {
  "Bambu Lab":      [["Creality", "Printer ecosystem"], ["Polymaker", "Premium PLA"], ["Overture", "Budget alternative"], ["Prusament", "Quality focus"], ["eSun", "Wide catalog"]],
  "Polymaker":      [["Bambu Lab", "Partner brand"], ["Hatchbox", "Popular PLA"], ["Overture", "Budget alternative"], ["ColorFabb", "Specialty materials"], ["Prusament", "Quality focus"]],
  "Prusament":      [["Polymaker", "Premium competitor"], ["Bambu Lab", "Printer ecosystem"], ["ColorFabb", "European maker"], ["Fillamentum", "Czech neighbor"], ["eSun", "Wide catalog"]],
  "Hatchbox":       [["Overture", "Budget rival"], ["eSun", "Similar range"], ["Inland", "Store brand"], ["Sunlu", "Value pick"], ["Bambu Lab", "Printer ecosystem"]],
  "Overture":       [["Hatchbox", "Budget rival"], ["eSun", "Similar range"], ["Bambu Lab", "Printer ecosystem"], ["Sunlu", "Value pick"], ["Polymaker", "Premium step-up"]],
  "eSun":           [["Sunlu", "Chinese maker"], ["Overture", "Budget rival"], ["Hatchbox", "Popular PLA"], ["Polymaker", "Premium step-up"], ["Bambu Lab", "Printer ecosystem"]],
  "Sunlu":          [["eSun", "Chinese maker"], ["Jayo", "Budget brand"], ["Overture", "Similar range"], ["Hatchbox", "Popular PLA"], ["Bambu Lab", "Printer ecosystem"]],
  "Jayo":           [["Sunlu", "Budget brand"], ["eSun", "Chinese maker"], ["Overture", "Similar range"], ["Bambu Lab", "Printer ecosystem"], ["Kingroon", "Value pick"]],
  "ColorFabb":      [["Fillamentum", "European maker"], ["Prusament", "Quality focus"], ["Polymaker", "Specialty materials"], ["Fiberlogy", "Polish maker"], ["3DXTech", "Engineering grade"]],
  "Fillamentum":    [["ColorFabb", "European maker"], ["Prusament", "Czech neighbor"], ["Polymaker", "Specialty materials"], ["Fiberlogy", "Polish maker"], ["3DXTech", "Engineering grade"]],
  "3DXTech":        [["ColorFabb", "Engineering grade"], ["Fillamentum", "Specialty materials"], ["NinjaTek", "Flexible expert"], ["Taulman3D", "Nylon specialist"], ["Polymaker", "Wide catalog"]],
  "NinjaTek":       [["Recreus", "Flexible expert"], ["3DXTech", "Engineering grade"], ["Fiberlogy", "Specialty materials"], ["Polymaker", "Wide catalog"], ["ColorFabb", "European maker"]],
  "Recreus":        [["NinjaTek", "Flexible expert"], ["Fiberlogy", "Specialty materials"], ["ColorFabb", "European maker"], ["Polymaker", "Wide catalog"]],
  "Fiberlogy":      [["ColorFabb", "European maker"], ["Fillamentum", "European maker"], ["Polymaker", "Specialty materials"], ["Prusament", "Quality focus"], ["3DXTech", "Engineering grade"]],
  "Inland":         [["Hatchbox", "Store brand"], ["Overture", "Budget rival"], ["eSun", "Similar range"], ["Sunlu", "Value pick"], ["Bambu Lab", "Printer ecosystem"]],
  "MatterHackers":  [["Polymaker", "Premium pick"], ["ColorFabb", "Specialty materials"], ["Fillamentum", "European maker"], ["Prusament", "Quality focus"], ["3DXTech", "Engineering grade"]],
  "Kingroon":       [["Sunlu", "Value pick"], ["eSun", "Chinese maker"], ["Overture", "Budget rival"], ["Bambu Lab", "Printer ecosystem"], ["Creality", "Printer maker"]],
  "Creality":       [["Bambu Lab", "Printer rival"], ["Overture", "Budget filament"], ["eSun", "Chinese maker"], ["Sunlu", "Value pick"], ["Kingroon", "Budget printer"]],
  "Amolen":         [["Polymaker", "Specialty colors"], ["eSun", "Chinese maker"], ["Sunlu", "Value pick"], ["Overture", "Budget rival"], ["Bambu Lab", "Printer ecosystem"]],
  "Proto-Pasta":    [["ColorFabb", "Specialty materials"], ["Fillamentum", "European maker"], ["MatterHackers", "Retailer brand"], ["3DXTech", "Engineering grade"], ["Polymaker", "Premium pick"]],
  "Spectrum Filaments": [["Fiberlogy", "Polish maker"], ["Fillamentum", "European maker"], ["ColorFabb", "European maker"], ["Polymaker", "Wide catalog"]],
  "Siraya Tech":    [["NinjaTek", "Specialty materials"], ["Polymaker", "Wide catalog"], ["Prusament", "Quality focus"], ["ColorFabb", "European maker"]],
  "AzureFilm":      [["Fiberlogy", "European maker"], ["Fillamentum", "European maker"], ["ColorFabb", "European maker"], ["Polymaker", "Wide catalog"]],
  "Extrudr":        [["ColorFabb", "European maker"], ["Fillamentum", "European maker"], ["Fiberlogy", "European maker"], ["Polymaker", "Wide catalog"], ["Prusament", "Quality focus"]],
  "Eryone":         [["eSun", "Chinese maker"], ["Sunlu", "Value pick"], ["Overture", "Budget rival"], ["Bambu Lab", "Printer ecosystem"], ["Hatchbox", "Popular PLA"]],
  "Push Plastic":   [["ColorFabb", "Specialty materials"], ["Fillamentum", "European maker"], ["Polymaker", "Premium pick"], ["MatterHackers", "Retailer brand"]],
  "IC3D":           [["ColorFabb", "Specialty materials"], ["Fillamentum", "European maker"], ["Polymaker", "Premium pick"], ["MatterHackers", "Retailer brand"]],
};

interface RelatedBrandsSectionProps {
  brandName: string;
}

export function RelatedBrandsSection({ brandName }: RelatedBrandsSectionProps) {
  const key = Object.keys(RELATED_BRANDS_MAP).find(
    k => k.toLowerCase() === brandName.toLowerCase()
  );
  const related = key ? RELATED_BRANDS_MAP[key] : null;

  if (!related || related.length === 0) return null;

  return (
    <section className="mt-12 pt-10 border-t border-border">
      <h2 className="text-xl font-bold mb-1">Related Brands</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Explore similar filament manufacturers and competitors
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {related.map(([name, context]) => {
          const slug = toBrandSlug(name);
          const logo = getBrandLogo(name);
          return (
            <Link
              key={name}
              to={`/brands/${slug}`}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-accent/40 hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted/50 p-1 flex items-center justify-center">
                <BrandLogo src={logo} brandName={name} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground block truncate">
                  {name}
                </span>
                <span className="text-[10px] text-muted-foreground/60 block">
                  {context}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
