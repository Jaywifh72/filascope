import { Database, Palette, Wand2, Layers, Pipette, ArrowLeftRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface HueForgeTool {
  key: string;
  name: string;
  shortName: string;
  description: string;
  shortDescription: string;
  href: string;
  icon: LucideIcon;
  badge?: "Popular" | "New" | "Beta";
  accentClass: string; // border accent for cards
}

export const HUEFORGE_TOOLS: HueForgeTool[] = [
  {
    key: "td-database",
    name: "TD Value Database",
    shortName: "TD Database",
    description: "Search and filter 111+ filaments by transmissivity data. The foundation for all HueForge planning.",
    shortDescription: "Search filaments by TD value.",
    href: "/hueforge-td-database",
    icon: Database,
    badge: "Popular",
    accentClass: "border-l-primary",
  },
  {
    key: "palette-builder",
    name: "Palette Builder",
    shortName: "Palette Builder",
    description: "Build and analyze multi-filament palettes. Check TD coverage, find gaps, and share your palette.",
    shortDescription: "Build & analyze filament palettes.",
    href: "/hueforge-palette-builder",
    icon: Palette,
    badge: "New",
    accentClass: "border-l-amber-500",
  },
  {
    key: "project-planner",
    name: "Project Planner",
    shortName: "Project Planner",
    description: "Step-by-step wizard to plan your HueForge project. Get a complete filament shopping list.",
    shortDescription: "Plan projects & get a shopping list.",
    href: "/hueforge-project-planner",
    icon: Wand2,
    badge: "New",
    accentClass: "border-l-green-500",
  },
  {
    key: "layer-preview",
    name: "Layer Stacking Preview",
    shortName: "Layer Preview",
    description: "Visualize how filament layers blend based on TD values before you print.",
    shortDescription: "Preview layer stacking visually.",
    href: "/hueforge-layer-preview",
    icon: Layers,
    badge: "New",
    accentClass: "border-l-violet-500",
  },
  {
    key: "color-matcher",
    name: "Color Matcher",
    shortName: "Color Matcher",
    description: "Find filaments matching any hex color or image sample, filtered by TD value.",
    shortDescription: "Match colors to real filaments.",
    href: "/hueforge-color-matcher",
    icon: Pipette,
    badge: "New",
    accentClass: "border-l-rose-500",
  },
  {
    key: "substitution-finder",
    name: "Substitution Finder",
    shortName: "Substitution Finder",
    description: "Find TD-equivalent alternatives from other brands when your filament is out of stock.",
    shortDescription: "Find TD-equivalent alternatives.",
    href: "/hueforge-filament-substitute-finder",
    icon: ArrowLeftRight,
    badge: "New",
    accentClass: "border-l-cyan-500",
  },
];
