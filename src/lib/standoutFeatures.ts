export interface StandoutFeature {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  category: 'workflow' | 'content' | 'community' | 'monetization' | 'technology' | 'search';
}

export const platformStandouts: Record<string, StandoutFeature> = {
  'makerworld': {
    id: 'one-click-print',
    title: 'One-Click Print Profiles',
    shortDescription: 'Zero-friction Bambu workflow',
    fullDescription: "Skip the slicer entirely. MakerWorld's pre-configured 3MF files include optimal settings for your exact Bambu printer—just click 'Print' and go. This is the lowest barrier to entry in the entire 3D printing ecosystem.",
    icon: 'MousePointerClick',
    category: 'workflow'
  },
  'printables': {
    id: 'prusameters-clubs',
    title: 'Prusameters & Clubs',
    shortDescription: 'Printer-specific settings + community',
    fullDescription: "Prusameters automatically apply optimal print settings based on your Prusa printer model. Clubs create focused communities around interests (cosplay, functional prints, miniatures) with dedicated curation and contests.",
    icon: 'Settings2',
    category: 'community'
  },
  'thingiverse': {
    id: 'largest-archive',
    title: 'Largest Archive (6.7M+ Models)',
    shortDescription: 'Unmatched catalog size',
    fullDescription: "With over 6.7 million models, Thingiverse has the largest searchable archive in 3D printing. If it exists as a 3D model, it's probably on Thingiverse somewhere—often with multiple versions and remixes.",
    icon: 'Archive',
    category: 'content'
  },
  'cults3d': {
    id: 'best-commission',
    title: '80/20 Commission Split',
    shortDescription: 'Best rates for sellers',
    fullDescription: "Cults3D offers the most favorable commission structure for designers: you keep 80% of every sale. Combined with a global audience and no exclusivity requirements, it's the top choice for monetizing your designs.",
    icon: 'Percent',
    category: 'monetization'
  },
  'myminifactory': {
    id: 'guaranteed-printable',
    title: 'Guaranteed Printable',
    shortDescription: 'Every model tested & verified',
    fullDescription: "MyMiniFactory manually tests and verifies every model before listing. If a model is on the platform, it's been confirmed to print successfully. This curation eliminates the 'will this actually print?' uncertainty.",
    icon: 'BadgeCheck',
    category: 'content'
  },
  'thangs': {
    id: 'geometric-ai-search',
    title: 'Geometric AI Search',
    shortDescription: 'Search by shape, not keywords',
    fullDescription: "Upload a 3D model or image, and Thangs uses AI to find geometrically similar models across 30+ platforms. Perfect when you know what shape you want but not what it's called—or when you need variations of an existing design.",
    icon: 'Shapes',
    category: 'search'
  },
  'creality-cloud': {
    id: 'phone-to-print',
    title: 'Phone-to-Print Workflow',
    shortDescription: 'Mobile-first printing experience',
    fullDescription: "Browse, slice, and send prints to your Creality printer entirely from your phone. No computer required. The mobile app handles everything from model discovery to print monitoring.",
    icon: 'Smartphone',
    category: 'workflow'
  },
  'grabcad': {
    id: 'engineering-cad-files',
    title: 'Engineering CAD Files',
    shortDescription: 'Professional STEP/IGES formats',
    fullDescription: "Unlike mesh-only repositories, GrabCAD specializes in parametric CAD files (STEP, IGES, SOLIDWORKS, Fusion 360). Engineers can download editable source files, not just printable meshes—essential for modification and manufacturing.",
    icon: 'Cog',
    category: 'technology'
  }
};

export const getStandoutForPlatform = (platformId: string): StandoutFeature | null => {
  return platformStandouts[platformId] || null;
};

export const getStandoutByName = (platformName: string): StandoutFeature | null => {
  const nameToId: Record<string, string> = {
    'MakerWorld': 'makerworld',
    'Printables': 'printables',
    'Thingiverse': 'thingiverse',
    'Cults3D': 'cults3d',
    'MyMiniFactory': 'myminifactory',
    'Thangs': 'thangs',
    'Creality Cloud': 'creality-cloud',
    'GrabCAD': 'grabcad'
  };
  
  const id = nameToId[platformName];
  return id ? platformStandouts[id] : null;
};
