import { Link } from "react-router-dom";
import { toBrandSlug } from "@/utils/brandSlug";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getBrandLogo } from "@/lib/brandLogos";

// Static adjacency map — curated competitors for major brands.
// Fall-through: any brand not listed here will get nothing (component hides itself).
const RELATED_BRANDS_MAP: Record<string, string[]> = {
  "Bambu Lab":      ["Creality", "Polymaker", "Overture", "Prusament", "eSun"],
  "Polymaker":      ["Bambu Lab", "Hatchbox", "Overture", "ColorFabb", "Prusament"],
  "Prusament":      ["Polymaker", "Bambu Lab", "ColorFabb", "Fillamentum", "eSun"],
  "Hatchbox":       ["Overture", "eSun", "Inland", "Sunlu", "Bambu Lab"],
  "Overture":       ["Hatchbox", "eSun", "Bambu Lab", "Sunlu", "Polymaker"],
  "eSun":           ["Sunlu", "Overture", "Hatchbox", "Polymaker", "Bambu Lab"],
  "Sunlu":          ["eSun", "Jayo", "Overture", "Hatchbox", "Bambu Lab"],
  "Jayo":           ["Sunlu", "eSun", "Overture", "Bambu Lab", "Kingroon"],
  "ColorFabb":      ["Fillamentum", "Prusament", "Polymaker", "Fiberlogy", "3DXTech"],
  "Fillamentum":    ["ColorFabb", "Prusament", "Polymaker", "Fiberlogy", "3DXTech"],
  "3DXTech":        ["ColorFabb", "Fillamentum", "NinjaTek", "Taulman3D", "Polymaker"],
  "NinjaTek":       ["Recreus", "3DXTech", "Fiberlogy", "Polymaker", "ColorFabb"],
  "Recreus":        ["NinjaTek", "Fiberlogy", "ColorFabb", "Polymaker"],
  "Fiberlogy":      ["ColorFabb", "Fillamentum", "Polymaker", "Prusament", "3DXTech"],
  "Inland":         ["Hatchbox", "Overture", "eSun", "Sunlu", "Bambu Lab"],
  "MatterHackers":  ["Polymaker", "ColorFabb", "Fillamentum", "Prusament", "3DXTech"],
  "Kingroon":       ["Sunlu", "eSun", "Overture", "Bambu Lab", "Creality"],
  "Creality":       ["Bambu Lab", "Overture", "eSun", "Sunlu", "Kingroon"],
  "Amolen":         ["Polymaker", "eSun", "Sunlu", "Overture", "Bambu Lab"],
  "Proto-Pasta":    ["ColorFabb", "Fillamentum", "MatterHackers", "3DXTech", "Polymaker"],
  "Spectrum Filaments": ["Fiberlogy", "Fillamentum", "ColorFabb", "Polymaker"],
  "Siraya Tech":    ["NinjaTek", "Polymaker", "Prusament", "ColorFabb"],
  "AzureFilm":      ["Fiberlogy", "Fillamentum", "ColorFabb", "Polymaker"],
  "Extrudr":        ["ColorFabb", "Fillamentum", "Fiberlogy", "Polymaker", "Prusament"],
  "Eryone":         ["eSun", "Sunlu", "Overture", "Bambu Lab", "Hatchbox"],
  "Push Plastic":   ["ColorFabb", "Fillamentum", "Polymaker", "MatterHackers"],
  "IC3D":           ["ColorFabb", "Fillamentum", "Polymaker", "MatterHackers"],
};

interface RelatedBrandsSectionProps {
  brandName: string;
}

export function RelatedBrandsSection({ brandName }: RelatedBrandsSectionProps) {
  // Normalised key lookup
  const key = Object.keys(RELATED_BRANDS_MAP).find(
    k => k.toLowerCase() === brandName.toLowerCase()
  );
  const related = key ? RELATED_BRANDS_MAP[key] : null;

  if (!related || related.length === 0) return null;

  return (
    <section className="mt-12 pt-10 border-t border-border">
      <h2 className="text-xl font-bold mb-6">Related Brands</h2>
      <div className="flex flex-wrap gap-3">
        {related.map((name) => {
          const slug = toBrandSlug(name);
          const logo = getBrandLogo(name);
          return (
            <Link
              key={name}
              to={`/brands/${slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors group"
            >
              <BrandLogo src={logo} brandName={name} size="sm" />
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
