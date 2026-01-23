export interface SpecialtyTool {
  id: string;
  name: string;
  tagline: string;
  category: 'ai-generation' | 'filament-art' | 'farm-management' | 'calibration' | 'cad' | 'repository' | 'remote-control' | 'mesh-tools';
  pricingModel: 'free' | 'freemium' | 'one-time' | 'subscription';
  website: string;
  
  // Tier designation for 2-tier card system
  tier: 'featured' | 'standard';
  
  // Skill level and use case for filtering
  skillLevel: ('beginner' | 'intermediate' | 'advanced')[];
  useCase: ('print-quality' | 'productivity' | 'creative' | 'management')[];
  
  // Standout feature for card display
  standoutFeature: {
    title: string;
    description: string;
  };
  
  // Quick summary for decision-making (50 words max)
  bottomLine: string;
  
  // Best for context (array of user types/scenarios)
  bestFor: string[];
  
  // Not ideal for scenarios
  notIdealFor: string[];
  
  // Key ratings to display on cards (top 2)
  keyRatings: ('easeOfUse' | 'featureDepth' | 'valueForMoney' | 'communitySupport' | 'printFocus')[];
  
  // Matrix ratings (1-5)
  ratings: {
    easeOfUse: number;
    featureDepth: number;
    valueForMoney: number;
    communitySupport: number;
    printFocus: number; // How focused on 3D printing specifically
  };
  
  // Pricing tiers
  pricing: {
    tier: string;
    price: string;
    features: string[];
  }[];
  
  // Detailed content
  overview: string;
  keyFeatures: string[];
  technicalDetails: string;
  economicModel: string;
  competitivePosition: string;
  futureOutlook: string;
}

export const specialtyTools: SpecialtyTool[] = [
  {
    id: 'meshy',
    name: 'Meshy.ai',
    tagline: 'The Vanguard of Generative AI for Fabrication',
    category: 'ai-generation',
    pricingModel: 'freemium',
    website: 'https://meshy.ai',
    tier: 'featured',
    skillLevel: ['beginner', 'intermediate'],
    useCase: ['creative'],
    standoutFeature: {
      title: 'Text-to-3D AI Generation',
      description: 'Create print-ready 3D models from text descriptions or images using cutting-edge AI in under a minute'
    },
    bottomLine: "Skip the CAD learning curve entirely. Describe what you want in plain English, and Meshy generates a print-ready 3D model in under a minute. Perfect for custom figurines, props, and artistic pieces when you have a vision but lack modeling skills.",
    bestFor: [
      'Makers who want custom models but lack CAD skills',
      'Prop makers and cosplayers needing unique pieces',
      'Rapid prototyping of organic shapes',
      'Creating custom figurines and decorations'
    ],
    notIdealFor: [
      'Precise mechanical parts with tight tolerances',
      'Engineering components requiring exact dimensions',
      'Users needing full creative control over geometry',
      'Those who prefer deterministic design processes'
    ],
    keyRatings: ['easeOfUse', 'featureDepth'],
    ratings: {
      easeOfUse: 5,
      featureDepth: 4,
      valueForMoney: 4,
      communitySupport: 3,
      printFocus: 4
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['100 credits/month', 'Low queue priority', 'CC BY 4.0 license (Public)'] },
      { tier: 'Pro', price: '$16/mo', features: ['1,000 credits/month', 'Standard priority', 'Private ownership'] },
      { tier: 'Studio', price: '$48/mo', features: ['4,000 credits/month', 'High priority', 'Private ownership'] },
      { tier: 'Enterprise', price: 'Custom', features: ['Custom credits', 'Highest priority', 'Private ownership'] }
    ],
    overview: `Meshy.ai marks a pivotal moment in the democratization of 3D modeling. Historically, the creation of printable assets required steep learning curves in CAD software like Fusion 360 or sculpting suites like ZBrush. This skill gap effectively bifurcated the community into a small group of "creators" and a massive majority of "consumers." Meshy dismantles this barrier by utilizing generative adversarial networks (GANs) and large language models (LLMs) to convert natural language prompts and 2D images into 3D geometry.

Meshy represents the 3D equivalent of the 2D generative AI revolution. Just as tools like Midjourney disrupted graphic design, Meshy disrupts digital sculpting. The platform's ability to interpret semantic descriptors—such as "a weathered stone gargoyle" or "a futuristic cybernetic helmet"—and output a watertight, textured 3D mesh in under a minute fundamentally changes the asset supply chain.`,
    keyFeatures: [
      'Text-to-3D generation with semantic understanding',
      'Image-to-3D conversion for concept art reproduction',
      'Native remeshing tools for print-ready topology',
      'Quad or triangle topology selection',
      'Focus on manifold/watertight geometry for printing'
    ],
    technicalDetails: `The critical differentiator for Meshy in the context of additive manufacturing is its focus on geometric integrity. While many AI 3D generators prioritize visual fidelity for virtual environments (often relying on texture maps to hide poor geometry), Meshy has increasingly optimized its algorithms for "manifold" geometry. A printable object must be a single, watertight shell with no holes or self-intersecting faces. Meshy's "Meshy-4" and subsequent model iterations have demonstrated significant improvements in producing topology that slicers can process without catastrophic errors.

**Text-to-3D:** This mode leverages semantic understanding to generate objects from scratch. The AI infers 360-degree geometry from textual descriptions, making critical assumptions about occluded areas. For 3D printing, the resulting models often require "remeshing" to ensure the printer can trace valid paths.

**Image-to-3D:** This function is particularly potent for reproducing specific artistic concepts. By uploading a single concept sketch or photograph, the AI infers depth maps and constructs a volumetric representation. This is invaluable for costumers and prop makers who may possess 2D concept art but lack the skills to manually model complex organic shapes.`,
    economicModel: `Meshy operates on a "credit-based" freemium model, a standard economic structure for AI services due to the high computational cost of GPU-based inference. The limitations of the Free tier are strategic. By mandating a Creative Commons Attribution (CC BY 4.0) license for assets generated on the free plan, Meshy effectively crowdsources its marketing. Every free user who shares a model inadvertently advertises the platform's capabilities.

Furthermore, free users are limited to the queue, meaning during peak times, their generation tasks may take longer as paid "Pro" and "Studio" users are prioritized. For professional workflows, the "Pro" tier is essential not just for the credit volume, but for the legal rights to the generated assets. Professionals require private ownership to sell physical prints or digital files, a right reserved for paid subscribers.`,
    competitivePosition: `While Meshy is a market leader, it faces stiff competition from platforms like Rodin (Hyper 3D) and Tripo AI. Rodin is frequently cited for producing higher fidelity geometry suitable for production environments, often scoring higher in quality benchmarks (9.5/10 compared to Meshy's 8.5/10). However, Meshy creates a compelling value proposition through its speed and lower cost. Benchmarks indicate that Meshy is significantly faster than Rodin, generating models in 20-45 seconds compared to Rodin's 85 seconds.`,
    futureOutlook: `The future of Meshy lies in the refinement of "hard surface" modeling. Currently, AI excels at organic shapes (monsters, rocks, plants) but struggles with the precise geometric constraints of mechanical parts. As these models evolve, Meshy has the potential to move from an artistic tool to a functional engineering assistant, potentially integrating with CAD workflows to generate optimized brackets or housings based on load-bearing requirements.`
  },
  {
    id: 'hueforge',
    name: 'HueForge',
    tagline: 'The Renaissance of Filament Painting',
    category: 'filament-art',
    pricingModel: 'one-time',
    website: 'https://hueforge.com',
    tier: 'featured',
    skillLevel: ['beginner', 'intermediate'],
    useCase: ['creative'],
    standoutFeature: {
      title: 'Photo-to-3D Lithophanes',
      description: 'Transform any image into stunning multi-color lithophane art using filament layering and transmission distance science'
    },
    bottomLine: "Turn any photograph into a stunning 3D printed artwork using clever filament layering. One-time $24.99 purchase unlocks the ability to create gallery-worthy lithophanes, custom portraits, and photo reproductions that look professionally made.",
    bestFor: [
      'Creative makers wanting unique artistic prints',
      'Gift-givers creating custom portraits and pet photos',
      'Multi-color printer owners (AMS, MMU)',
      'Users who want impressive results without CAD skills'
    ],
    notIdealFor: [
      'Those seeking functional/mechanical prints',
      'Single-color printer owners (very limited options)',
      'Users who dislike artistic/decorative prints',
      'Budget-conscious makers (filament usage is high)'
    ],
    keyRatings: ['featureDepth', 'valueForMoney'],
    ratings: {
      easeOfUse: 4,
      featureDepth: 5,
      valueForMoney: 5,
      communitySupport: 5,
      printFocus: 5
    },
    pricing: [
      { tier: 'Personal', price: '$12-18', features: ['One-time purchase', 'Personal use only', 'Full feature access'] },
      { tier: 'Professional', price: 'Higher tier', features: ['Sell digital files', 'Commercial use', 'Priority support'] },
      { tier: 'Merchant', price: 'Higher tier', features: ['Sell physical prints', 'Full commercial rights', 'Bulk licensing'] }
    ],
    overview: `HueForge represents a radical departure from traditional multi-color 3D printing. Historically, printing an image with color required complex hardware: multi-nozzle extruders, tool changers, or splicing devices like the Palette. These solutions were expensive and prone to mechanical failure. HueForge, a software utility and associated community site, circumvented these hardware limitations by treating the 3D printer as a mechanism for applying translucent layers of pigment, creating a technique now known as "Filament Painting".

The fundamental innovation of HueForge is its utilization of "Transmission Distance" (TD). In the context of 3D printing filaments, most plastics are not perfectly opaque. HueForge calculates exactly how light passes through thin layers of plastic. By stacking a semi-translucent red filament over a yellow filament, the eye perceives orange. By modulating the thickness of the white layer over a black base, the printer can produce hundreds of shades of gray.`,
    keyFeatures: [
      'Transmission Distance (TD) calculation for filaments',
      'Photorealistic image printing with 3-5 filament swaps',
      'Extensive filament database with TD values',
      'User-contributed filament calibration data',
      'Standard STL output with layer swap instructions'
    ],
    technicalDetails: `The HueForge workflow is a synthesis of image processing and material science. The software analyzes a source 2D image and creates a height map, where lighter areas are physically thicker (if using light filament) or thinner (if using dark filament to reveal a light background).

The core intellectual property of the platform is its library of filament data. A user cannot simply select "Blue"; they must select a specific brand and color, such as "Polymaker PolyLite Blue," because the software needs to know that specific material's TD value. A filament with a high TD is very translucent and suited for subtle blending, while a low TD filament is opaque and used for blocking light. The site provides resources and tutorials for users to calibrate their own filaments, effectively crowdsourcing a massive database of material optical properties.

The software generates a standard STL file for the geometry and a text file describing the layer swaps. For example, the instructions might read: "Start with Black. At Layer 12, swap to Dark Blue. At Layer 24, swap to Light Blue. At Layer 36, swap to White".`,
    economicModel: `HueForge utilizes a one-time purchase model for personal use, priced around $12-$18, which contrasts with the subscription-heavy industry trend. However, it has introduced a "Professional" and "Merchant" tier for users who wish to sell the digital files or physical prints generated by the software.

This has spawned a secondary economy. The "HueForge" tag has become a dominant category on file repositories, with designers selling "HueForge-compatible" STLs. Furthermore, the platform has influenced the filament market itself. Manufacturers are now marketing "HueForge Packs"—bundles of filaments with varying transmission distances specifically curated for filament painting. This symbiosis between software utility and material hardware underscores HueForge's impact: it has not just provided a tool, but altered the consumption patterns of 3D printing materials.`,
    competitivePosition: `HueForge has effectively created and dominated its own category. While slicers can create basic lithophanes, no competitor offers the same depth of filament-specific transmission distance data or the sophisticated blending algorithms. The community-driven filament database creates a significant moat—new competitors would need to build this library from scratch.`,
    futureOutlook: `As multi-material printing becomes more accessible through systems like AMS, HueForge's techniques could evolve to automate filament swaps entirely. The platform's extensive filament data could also expand into other material properties, potentially becoming a comprehensive material science database for the 3D printing community.`
  },
  {
    id: 'simplyprint',
    name: 'SimplyPrint',
    tagline: 'The Cloud Infrastructure for Print Farms',
    category: 'farm-management',
    pricingModel: 'freemium',
    website: 'https://simplyprint.io',
    tier: 'standard',
    skillLevel: ['intermediate', 'advanced'],
    useCase: ['management', 'productivity'],
    standoutFeature: {
      title: 'Multi-Printer Fleet Management',
      description: 'Manage multiple printers from one dashboard with queue management, analytics, and cloud slicing'
    },
    bottomLine: "The control center for running multiple 3D printers. If you have 2+ printers and want unified queue management, automatic job assignment, and filament tracking from one dashboard, SimplyPrint turns chaos into a streamlined operation.",
    bestFor: [
      'Print farms and commercial operations',
      'Makerspaces and educational institutions',
      'Makers with 2+ printers wanting centralized control',
      'Teams needing user permissions and audit trails'
    ],
    notIdealFor: [
      'Single printer hobbyists (overkill)',
      'Users who prefer local-only control',
      'Those without reliable internet connectivity',
      'Makers who rarely queue multiple jobs'
    ],
    keyRatings: ['featureDepth', 'printFocus'],
    ratings: {
      easeOfUse: 4,
      featureDepth: 5,
      valueForMoney: 4,
      communitySupport: 4,
      printFocus: 5
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['2 printers', '1GB storage', 'Non-priority slicing'] },
      { tier: 'Basic', price: '$5.99/mo', features: ['3 printers', 'Priority slicing', 'AI detection'] },
      { tier: 'Print Farm', price: '$39.99/mo', features: ['10 printers', 'User permissions', 'Analytics', 'API access'] },
      { tier: 'Schools', price: 'Custom', features: ['Educational pricing', 'Chromebook support', 'Classroom management'] }
    ],
    overview: `As the 3D printing demographic expands from singular hobbyists to "print farms"—commercial operations running dozens or hundreds of machines—the need for centralized management becomes acute. SimplyPrint serves as the "Operating System" for these distributed factories. It is a cloud-based management platform that unifies the control of disparate printers into a single dashboard, solving the logistical nightmare of managing SD cards or local networks for large fleets.

A critical specialty of SimplyPrint is its hardware agnosticism. In a typical print farm, an operator might possess a mix of Creality, Prusa, and Bambu Lab machines. Each of these brands often pushes its own proprietary cloud solution. SimplyPrint acts as a middleware layer, integrating with OctoPrint, Klipper, and various proprietary APIs to provide a "Single Pane of Glass" view.`,
    keyFeatures: [
      'Universal printer compatibility (OctoPrint, Klipper, proprietary)',
      'Cloud-based slicing in browser',
      'AutoPrint queue management',
      'Filament inventory tracking',
      'Multi-user permissions and audit trails',
      'API access for custom integrations'
    ],
    technicalDetails: `This integration extends to slicing. SimplyPrint includes a cloud-based slicer, allowing users to upload a raw STL and generate G-code directly in the browser. This is particularly transformative for the education sector (Schools tier), where students often use Chromebooks or tablets that lack the computational power to run local slicing software like Cura or OrcaSlicer.

**Queue Management:** The "AutoPrint" and queue logic allow operators to upload a job and have the system automatically assign it to the next available printer matching the material profile. This maximizes machine uptime, a key metric for profitability.

**Inventory Tracking:** The platform tracks filament usage across the fleet. If a 1kg spool is loaded onto Printer A, SimplyPrint subtracts the mass of each print. When the spool is near empty, the system prevents new jobs from starting on that machine, avoiding the costly failure of running out of material mid-print.`,
    economicModel: `SimplyPrint's pricing reflects its focus on commercial scalability. The "Print Farm" tier introduces "Panel" features, allowing multiple users (e.g., employees) to access the farm with granular permissions. This creates an audit trail—critical for businesses that need to track who authorized a print or who cleared a failure. The "OEM" tier further reveals SimplyPrint's ambition to be the white-label backend for printer manufacturers who want to offer "smart" features without developing their own software stack.`,
    competitivePosition: `SimplyPrint competes with OctoPrint (self-hosted, free but requires technical setup), 3DPrinterOS (enterprise-focused), and manufacturer-specific clouds (Bambu Cloud, Prusa Connect). Its strength lies in hardware agnosticism and the sweet spot between hobbyist OctoPrint and expensive enterprise solutions.`,
    futureOutlook: `As print farms become more common in small businesses and makerspaces, SimplyPrint is positioned to become essential infrastructure. The platform may expand into predictive maintenance (using AI to detect when a printer needs service) and deeper ERP integrations for manufacturing workflows.`
  },
  {
    id: 'ellis-guide',
    name: "Ellis' Print Tuning Guide",
    tagline: 'The Physics of Calibration',
    category: 'calibration',
    pricingModel: 'free',
    website: 'https://ellis3dp.com/Print-Tuning-Guide/',
    tier: 'featured',
    skillLevel: ['intermediate', 'advanced'],
    useCase: ['print-quality'],
    standoutFeature: {
      title: 'Interactive Calibration Patterns',
      description: 'Generate custom G-code test patterns for Pressure Advance and Max Volumetric Flow tuning with scientific methodology'
    },
    bottomLine: "The definitive calibration guide for high-speed 3D printing. If you own a Klipper-based printer and want to eliminate corner bulging, dial in perfect flow, and print faster without sacrificing quality—this is where you start. Completely free.",
    bestFor: [
      'Speed-focused printers (Voron, Ratrig, etc.)',
      'Klipper firmware users',
      'Print quality perfectionists',
      'Anyone with corner bulging or flow issues'
    ],
    notIdealFor: [
      'Complete beginners on stock machines',
      'Users who prefer not to tweak settings',
      'Marlin-only users (limited support)',
      'Those looking for visual/video guides'
    ],
    keyRatings: ['featureDepth', 'valueForMoney'],
    ratings: {
      easeOfUse: 3,
      featureDepth: 5,
      valueForMoney: 5,
      communitySupport: 5,
      printFocus: 5
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['Full guide access', 'G-code generators', 'Community support', 'Open source'] }
    ],
    overview: `While not a software tool in the executable sense, "Ellis' Print Tuning Guide" (ellis3dp.com) is arguably the most vital "utility site" for the modern high-performance 3D printing enthusiast. As printers have become faster—pushed by the Klipper firmware revolution—the physics of extrusion have become more volatile. Default "slicer profiles" provided by manufacturers often fail to account for environmental variables or specific material rheology. Ellis' Guide serves as the interactive, scientific manual for tuning these variables.

The guide is distinct because it moves beyond basic "bed leveling" into complex fluid dynamics. A core focus is Pressure Advance (PA). In high-speed printing, the filament acts like a spring; there is a delay between the extruder motor pushing and the plastic actually exiting the nozzle.`,
    keyFeatures: [
      'Pressure Advance calibration methodology',
      'Max Volumetric Flow testing',
      'Interactive G-code generators',
      'Empirical testing patterns',
      'Klipper-optimized workflows'
    ],
    technicalDetails: `Ellis' Guide provides specific g-code generators and test patterns to calibrate Pressure Advance. By printing a series of lines with varying PA values, users can identify the precise coefficient that eliminates "bulging" corners, resulting in dimensionally accurate parts.

Another critical utility is the Max Volumetric Flow test. As printing speeds exceed 300mm/s, the limiting factor is often the hotend's ability to melt plastic fast enough. Ellis' site provides a methodology to empirically determine the maximum cubic millimeters per second a specific hotend/nozzle combination can process. This prevents users from setting speeds that physically outrun the melting capacity of their hardware, a common cause of under-extrusion in modern high-speed printing.

The site's influence is so profound that its methodologies (like the "Pattern Method" for Pressure Advance) have been integrated directly into slicers like OrcaSlicer.`,
    economicModel: `Ellis' Guide operates on a pure open-source model with no monetization. It represents community contribution at its finest—a resource created by an expert for the benefit of all. The "economic" value is derived from reputation and community standing within the Voron and Klipper ecosystems.`,
    competitivePosition: `No direct competitors exist at this level of depth and community trust. While YouTube tutorials cover calibration, Ellis' Guide is the authoritative written reference. It has become the de facto standard that other resources reference.`,
    futureOutlook: `As high-speed printing becomes mainstream (driven by Bambu Lab, Creality K-series), the calibration techniques pioneered here will need to be adapted for closed-source firmware. The methodology may evolve into automated calibration routines built into slicers or printer firmware.`
  },
  {
    id: 'onshape',
    name: 'Onshape',
    tagline: 'Democratizing Professional CAD',
    category: 'cad',
    pricingModel: 'freemium',
    website: 'https://www.onshape.com',
    tier: 'standard',
    skillLevel: ['intermediate', 'advanced'],
    useCase: ['creative', 'productivity'],
    standoutFeature: {
      title: 'Cloud-Native Parametric CAD',
      description: 'Professional-grade CAD that runs entirely in your browser with real-time collaboration and version control'
    },
    bottomLine: "Full professional CAD in your browser—no installation, works on any device. Free tier gives you SolidWorks-level parametric modeling with Git-like version control. The catch: free designs must be public.",
    bestFor: [
      'Designers who need real CAD without expensive software',
      'Teams needing real-time collaboration',
      'Students and educators (free for education)',
      'Users who want to work from any device'
    ],
    notIdealFor: [
      'Those needing private designs on free tier',
      'Users without reliable internet',
      'Hobbyists who prefer simpler tools',
      'Offline-first workflows'
    ],
    keyRatings: ['featureDepth', 'valueForMoney'],
    ratings: {
      easeOfUse: 3,
      featureDepth: 5,
      valueForMoney: 4,
      communitySupport: 4,
      printFocus: 3
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['Full CAD features', 'Public documents only', '5 active documents'] },
      { tier: 'Standard', price: '$1,500/yr', features: ['Private documents', 'Unlimited storage', 'Priority support'] },
      { tier: 'Professional', price: '$2,500/yr', features: ['Advanced simulation', 'Release management', 'API access'] }
    ],
    overview: `Onshape represents a radical rethinking of the CAD industry's business model. For decades, professional parametric modeling was synonymous with expensive, annually-licensed software installed on powerful workstations (SolidWorks, Inventor, Fusion 360). Onshape, founded by former SolidWorks executives, delivered a full-fledged parametric CAD kernel that runs entirely in a web browser.

For the 3D printing community, Onshape offers several strategic advantages. First, platform independence: a user can design on a Mac, a Chromebook, or even a tablet. Second, native version control: every edit is saved automatically, and the entire history can be branched and merged like software code. Third, real-time collaboration: multiple users can edit the same part simultaneously.`,
    keyFeatures: [
      'Browser-based parametric modeling',
      'Real-time multi-user collaboration',
      'Git-like version control for designs',
      'Native simulation and rendering',
      'Direct STL/STEP export for printing'
    ],
    technicalDetails: `Onshape's technical architecture is built on a streaming model where the geometry kernel runs on cloud servers and only the visual representation is sent to the browser. This means a low-powered laptop can manipulate complex assemblies that would choke a local installation of SolidWorks.

**Free Tier Limitations:** The primary catch of the free tier is that all documents must be public. This makes it unsuitable for proprietary commercial work, but perfect for the open-source ethos of the maker community. For educators, this is a non-issue, and for hobbyists designing personal projects, public visibility is often acceptable.

**FeatureScript:** Advanced users can extend Onshape's capabilities with FeatureScript, a proprietary scripting language for creating custom features and tools.`,
    economicModel: `The free tier acts as a powerful lead-generation funnel. Students who learn Onshape in educational settings become advocates for adopting the platform in their future professional roles. The paid tiers are priced competitively against SolidWorks (~$4,000/year) and Fusion 360 (~$500/year), targeting the professional market.`,
    competitivePosition: `Onshape competes directly with Fusion 360 (Autodesk) and SolidWorks (Dassault). Its browser-first approach is both a strength (accessibility) and weakness (requires internet). For 3D printing hobbyists, Fusion 360's free tier is often preferred due to better offline support and direct slicer integration.`,
    futureOutlook: `As 5G and improved internet infrastructure spread, Onshape's cloud-native approach becomes more viable. The platform may integrate AI-assisted design features and deeper CAM (computer-aided manufacturing) capabilities.`
  },
  {
    id: 'thangs',
    name: 'Thangs',
    tagline: 'The Search Engine for Physical Objects',
    category: 'repository',
    pricingModel: 'freemium',
    website: 'https://thangs.com',
    tier: 'standard',
    skillLevel: ['beginner', 'intermediate'],
    useCase: ['productivity'],
    standoutFeature: {
      title: 'Geometric AI Model Search',
      description: 'Search for 3D models by shape using AI, not just keywords, across 30+ sources and millions of models'
    },
    bottomLine: "Google for 3D models. Upload any STL and find similar shapes across 30+ repositories using AI—no more guessing keywords. When you know what something looks like but not what it's called, Thangs finds it.",
    bestFor: [
      'Finding specific models by shape, not keywords',
      'Searching across multiple repositories at once',
      'Discovering alternatives to models you already have',
      'Researchers and designers seeking similar parts'
    ],
    notIdealFor: [
      'Users who prefer single-repository browsing',
      'Those who want curated collections over search',
      'Makers who rarely search for models',
      'Offline workflows'
    ],
    keyRatings: ['easeOfUse', 'featureDepth'],
    ratings: {
      easeOfUse: 5,
      featureDepth: 4,
      valueForMoney: 4,
      communitySupport: 4,
      printFocus: 5
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['Unlimited downloads', 'Geometric search', 'Basic hosting'] },
      { tier: 'Pro', price: '$9.99/mo', features: ['Private models', 'Advanced analytics', 'Priority support'] },
      { tier: 'Teams', price: 'Custom', features: ['Team collaboration', 'Enterprise features', 'API access'] }
    ],
    overview: `Thangs enters the repository market with a technological differentiator: Geometric Deep Learning. While Thingiverse and Printables rely on text-based tags and titles for search, Thangs trains neural networks to understand the actual 3D shape of objects. Users can upload an STL file and ask "find models similar to this," and the AI returns geometrically related results regardless of how they were named or tagged.

This solves a significant pain point. How many times has a user searched for a "phone stand" only to wade through hundreds of irrelevant results because designers use inconsistent naming conventions? Thangs' geometric search bypasses this linguistic ambiguity.`,
    keyFeatures: [
      'AI-powered geometric search',
      'Multi-source aggregation (30+ repositories)',
      'Shape similarity matching',
      'Desktop sync application',
      'Direct slicer integration'
    ],
    technicalDetails: `Thangs' core technology involves converting 3D meshes into high-dimensional vector embeddings using machine learning. When a user uploads a model, the system calculates its geometric "fingerprint" and compares it against millions of pre-indexed models. This allows for discovery that text search cannot achieve.

**Multi-Source Aggregation:** Thangs indexes models from Thingiverse, MyMiniFactory, Cults3D, and dozens of other sources. This positions it as a "Google for 3D models"—a single entry point to the fragmented ecosystem.

**Desktop App:** The Thangs desktop application can monitor local folders and automatically sync models to the cloud, providing backup and organization features.`,
    economicModel: `Thangs monetizes through its Pro tier for creators wanting private hosting and analytics, while the free tier is generous enough to attract users. The company likely monetizes aggregate data about search trends and user behavior, valuable for understanding the 3D printing market.`,
    competitivePosition: `Thangs competes with established repositories on discoverability rather than library size. Its geometric search is a genuine technological moat. However, adoption requires users to change their search habits, which is a significant behavioral challenge.`,
    futureOutlook: `As AI continues to advance, Thangs could expand into automated model categorization, printability analysis, and even text-to-search ("find me a vase with a spiral pattern"). The geometric understanding could also power tools for detecting intellectual property violations.`
  },
  {
    id: 'octoeverywhere',
    name: 'OctoEverywhere',
    tagline: 'Universal Remote Access for Any Printer',
    category: 'remote-control',
    pricingModel: 'freemium',
    website: 'https://octoeverywhere.com',
    tier: 'featured',
    skillLevel: ['beginner', 'intermediate', 'advanced'],
    useCase: ['productivity', 'management'],
    standoutFeature: {
      title: 'Universal Remote Monitoring',
      description: 'Monitor, control, and get AI failure detection for OctoPrint, Klipper, or Bambu printers from anywhere'
    },
    bottomLine: "Monitor and control your printer from anywhere without the security headaches of port forwarding. AI failure detection catches spaghetti and layer shifts automatically, pausing prints before they waste hours of filament.",
    bestFor: [
      'Anyone who wants to monitor prints remotely',
      'Users worried about print failures when away',
      'OctoPrint, Klipper, and Bambu Lab owners',
      'Those who want AI failure detection without setup'
    ],
    notIdealFor: [
      'Users who only print while at home',
      'Those with existing secure remote setups',
      'Makers without webcams on their printers',
      'Privacy-conscious users avoiding cloud services'
    ],
    keyRatings: ['valueForMoney', 'printFocus'],
    ratings: {
      easeOfUse: 4,
      featureDepth: 4,
      valueForMoney: 5,
      communitySupport: 4,
      printFocus: 5
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['Remote access', 'Basic monitoring', 'Community support'] },
      { tier: 'Supporter', price: '$4/mo', features: ['Priority access', 'AI failure detection', 'Advanced features'] },
      { tier: 'Pro', price: '$8/mo', features: ['Multiple printers', 'Full AI suite', 'API access'] }
    ],
    overview: `OctoEverywhere solves one of 3D printing's most annoying problems: secure remote access. While OctoPrint provides excellent local printer control, exposing it to the internet safely requires technical knowledge of port forwarding, dynamic DNS, and SSL certificates. OctoEverywhere provides a zero-configuration tunnel that securely connects your printer to a cloud relay.

Beyond basic remote access, OctoEverywhere has invested heavily in AI-powered failure detection. The "Gadget" system monitors webcam feeds and uses computer vision to detect common failure modes like spaghetti (failed adhesion), layer shifts, and blob formations.`,
    keyFeatures: [
      'Secure remote access without port forwarding',
      'AI-powered print failure detection (Gadget)',
      'Works with OctoPrint, Klipper, and Bambu Lab',
      'Mobile apps for iOS and Android',
      'Smart notifications and alerts'
    ],
    technicalDetails: `OctoEverywhere creates an encrypted tunnel between your local OctoPrint/Klipper instance and their cloud servers. When you access your printer remotely, traffic is securely relayed without exposing your home network. This is similar to services like ngrok or Cloudflare Tunnel but optimized specifically for 3D printing workflows.

**AI Failure Detection:** The Gadget AI analyzes webcam frames in real-time, comparing them against trained models of failure modes. When detected, it can automatically pause the print and send notifications. This prevents the nightmare scenario of returning home to a failed print that wasted hours of time and filament.

**Bambu Integration:** Recently expanded beyond OctoPrint to support Bambu Lab printers, broadening its market significantly.`,
    economicModel: `The freemium model provides basic remote access free, with AI features and priority access behind the paid tiers. Pricing is aggressive compared to alternatives, making it accessible to hobbyists while providing enough value to justify subscription for serious users.`,
    competitivePosition: `Competes with Obico (formerly The Spaghetti Detective) and native cloud solutions from printer manufacturers. Its strength is broad compatibility across multiple printer ecosystems and competitive pricing.`,
    futureOutlook: `As more printers ship with built-in cloud connectivity, OctoEverywhere's value proposition may shift toward AI features and multi-printer management rather than basic remote access.`
  },
  {
    id: 'makerworld',
    name: 'MakerWorld / MakerLab',
    tagline: 'The Integrated Bambu Ecosystem',
    category: 'repository',
    pricingModel: 'free',
    website: 'https://makerworld.com',
    tier: 'standard',
    skillLevel: ['beginner', 'intermediate'],
    useCase: ['productivity'],
    standoutFeature: {
      title: 'Bambu-Optimized Print Profiles',
      description: 'One-click 3MF files with pre-configured settings for Bambu printers, plus AI-powered model generation'
    },
    bottomLine: "The Apple Store of 3D printing for Bambu owners. Download a 3MF file and it's ready to print with optimal settings already configured—no slicer tweaking required. Includes free AI model generation via MakerLab.",
    bestFor: [
      'Bambu Lab printer owners',
      'Users who want zero-friction downloads',
      'Those wanting AI model generation (MakerLab)',
      'Makers who value curated, tested content'
    ],
    notIdealFor: [
      'Non-Bambu printer owners (limited benefit)',
      'Users who prefer cross-platform repositories',
      'Those avoiding ecosystem lock-in',
      'Makers who want maximum model variety'
    ],
    keyRatings: ['easeOfUse', 'printFocus'],
    ratings: {
      easeOfUse: 5,
      featureDepth: 4,
      valueForMoney: 5,
      communitySupport: 4,
      printFocus: 5
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['Unlimited downloads', 'Print profiles', 'Community features', 'MakerLab AI (credits)'] }
    ],
    overview: `MakerWorld represents Bambu Lab's strategic move to create a vertically integrated ecosystem. Rather than relying on third-party repositories like Thingiverse, Bambu built its own platform optimized for its hardware. The key differentiator is native 3MF support with embedded print profiles—users can download a model and send it directly to their Bambu printer with optimal settings already configured.

MakerLab, the AI-powered companion, allows users to generate 3D models from text prompts directly within the ecosystem. This creates a complete loop: ideate → generate → print without leaving the Bambu world.`,
    keyFeatures: [
      'Native 3MF files with embedded print profiles',
      'Direct-to-printer integration',
      'MakerLab AI model generation',
      'Creator rewards program',
      'Curated collections and challenges'
    ],
    technicalDetails: `MakerWorld's technical advantage is the 3MF file format. Unlike STL (which only contains geometry), 3MF can embed print settings, materials, colors, and even support structures. When a Bambu user downloads a 3MF from MakerWorld, they're getting not just the shape but the exact settings the creator used.

**MakerLab Integration:** The AI model generation is powered by partnerships with AI providers, allowing text-to-3D generation. Credits are provided free to Bambu owners, making it accessible for experimentation.

**Creator Economy:** MakerWorld includes a points system that rewards popular designs, with points convertible to Bambu store credit. This incentivizes quality content creation.`,
    economicModel: `MakerWorld is free to use, funded by Bambu Lab as a strategic asset to increase hardware sales. By making the Bambu ecosystem more valuable, it reduces the appeal of competitor printers. The creator rewards program also generates goodwill and quality content.`,
    competitivePosition: `MakerWorld's "walled garden" approach is both strength and weakness. For Bambu owners, it's incredibly convenient. For non-Bambu users, it's largely irrelevant. This contrasts with platform-agnostic repositories like Printables or Thangs.`,
    futureOutlook: `As Bambu's market share grows, MakerWorld may become one of the largest repositories by user activity. The integration with MakerLab positions it at the forefront of AI-assisted design workflows.`
  },
  {
    id: 'lithophanemaker',
    name: 'LithophaneMaker.com',
    tagline: 'One-Click Image to Printable Art',
    category: 'mesh-tools',
    pricingModel: 'free',
    website: 'https://lithophanemaker.com',
    tier: 'standard',
    skillLevel: ['beginner'],
    useCase: ['creative'],
    standoutFeature: {
      title: 'One-Click Complex Lithophanes',
      description: 'Turn photos into printable lithophanes with various shapes including globes, night lights, and curved panels'
    },
    bottomLine: "Upload a photo, pick a shape, download an STL. The simplest possible path to creating backlit photo art—no software to install, no account required, completely free. Perfect for quick gifts.",
    bestFor: [
      'Quick lithophane creation without learning curves',
      'Gift-makers wanting personalized photo items',
      'Users who want globe, lamp, or curved lithophanes',
      'Beginners to 3D printing decoration'
    ],
    notIdealFor: [
      'Those wanting multi-color lithophanes (use HueForge)',
      'Users needing advanced customization',
      'High-resolution detailed artwork',
      'Commercial lithophane production'
    ],
    keyRatings: ['easeOfUse', 'valueForMoney'],
    ratings: {
      easeOfUse: 5,
      featureDepth: 4,
      valueForMoney: 5,
      communitySupport: 3,
      printFocus: 5
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['All lithophane shapes', 'Basic customization', 'Immediate STL download'] }
    ],
    overview: `LithophaneMaker.com is a specialized web utility that converts 2D images into 3D lithophane models. A lithophane is a thin panel where the image appears when backlit—thicker areas are darker, thinner areas are brighter. It's a classic photographic technique dating back to the 1820s, now revived through 3D printing.

The site's brilliance is its simplicity. Upload an image, select a shape (flat, curved, globe, lamp shade), adjust a few parameters, and download an STL ready for printing. No software installation, no learning curve, no cost.`,
    keyFeatures: [
      'Multiple lithophane shapes (flat, curved, globe, lamp)',
      'Image-to-STL conversion in browser',
      'Adjustable thickness and resolution',
      'Night light and lamp shade templates',
      'Completely free with no account required'
    ],
    technicalDetails: `The site uses JavaScript-based image processing to analyze each pixel's brightness and map it to a corresponding thickness value. The resulting geometry is a height field that can be exported as STL.

**Shape Options:** Beyond flat panels, the site offers curved panels (for wrapping around cylinders), spherical "moon lamp" globes, and specialized night light housings with integrated bases.

**Quality Settings:** Users can adjust the number of pixels converted, trading off file size against detail. For large prints, higher resolution is essential; for small items, lower resolution prints faster.`,
    economicModel: `The site is entirely free, supported by donations and affiliate links to printing supplies. It represents the best of maker community generosity—a useful tool created and maintained for public benefit.`,
    competitivePosition: `LithophaneMaker competes with similar generators (ItsLitho, 3DP Rocks) and with HueForge for image-based printing. Its advantage is zero friction—no accounts, no software, no cost.`,
    futureOutlook: `The site may expand into more shapes (hexagonal tiles, multi-panel displays) and potentially integrate with AI image enhancement to improve source photo quality before conversion.`
  },
  {
    id: 'formware',
    name: 'Formware Online',
    tagline: 'Browser-Based Mesh Surgery',
    category: 'mesh-tools',
    pricingModel: 'free',
    website: 'https://formware.co/onlinemeshrepair',
    tier: 'standard',
    skillLevel: ['intermediate', 'advanced'],
    useCase: ['print-quality'],
    standoutFeature: {
      title: 'Browser-Based Mesh Repair',
      description: 'Fix broken STL files directly in your browser—repair holes, fix normals, and merge shells without installing software'
    },
    bottomLine: "The emergency room for broken STL files. When a downloaded model won't slice due to mesh errors, upload it here and get a fixed version in seconds. No installation, no account, no cost.",
    bestFor: [
      'Quick fixes when models fail to slice',
      'Repairing non-manifold geometry errors',
      'Users who download models from various sources',
      'Those without mesh editing software installed'
    ],
    notIdealFor: [
      'Complex mesh editing or sculpting',
      'Users with Meshmixer or Blender skills',
      'Large files (browser memory limits)',
      'Batch processing multiple files'
    ],
    keyRatings: ['easeOfUse', 'valueForMoney'],
    ratings: {
      easeOfUse: 5,
      featureDepth: 3,
      valueForMoney: 5,
      communitySupport: 2,
      printFocus: 5
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['Basic mesh repair', 'Hole filling', 'Normal correction', 'STL export'] },
      { tier: 'Desktop', price: '$149', features: ['Full feature set', 'Advanced repair', 'Batch processing', 'Support removal'] }
    ],
    overview: `Formware's Online Mesh Repair tool is the emergency room for broken 3D files. When a downloaded STL refuses to slice due to non-manifold edges, inverted normals, or holes in the mesh, this browser-based utility can often fix it in seconds.

The tool is a stripped-down version of Formware's desktop application, offered free as a lead-generation tool. For occasional use, the online version is sufficient; for regular mesh work, the desktop version offers more power.`,
    keyFeatures: [
      'Non-manifold edge repair',
      'Hole detection and filling',
      'Normal vector correction',
      'Shell merging and separation',
      'No installation required'
    ],
    technicalDetails: `The mesh repair algorithms identify topological errors that prevent proper slicing:

**Non-Manifold Edges:** Edges shared by more than two faces, which confuse slicer algorithms about which side is "inside" vs "outside."

**Inverted Normals:** When face normals point inward instead of outward, causing slicers to misinterpret solid vs void.

**Holes:** Missing faces that create gaps in what should be a watertight shell.

The online tool applies heuristic algorithms to automatically detect and fix these issues.`,
    economicModel: `The free online tool serves as marketing for Formware's paid desktop software and SLA printing solutions. Users who encounter mesh issues frequently are converted to paying customers.`,
    competitivePosition: `Competes with Meshmixer (discontinued), Microsoft 3D Builder (Windows only), and slicer-built-in repair tools. Its advantage is zero friction—works on any device with a browser.`,
    futureOutlook: `As 3D model quality improves (better AI generation, better scan processing), the need for manual mesh repair may decrease. However, there will always be edge cases requiring surgical intervention.`
  }
];

// Helper functions for tier filtering
export const getFeaturedTools = (): SpecialtyTool[] => 
  specialtyTools.filter(t => t.tier === 'featured');

export const getStandardTools = (): SpecialtyTool[] => 
  specialtyTools.filter(t => t.tier === 'standard');

export const categoryLabels: Record<SpecialtyTool['category'], string> = {
  'ai-generation': 'AI Generation',
  'filament-art': 'Filament Art',
  'farm-management': 'Farm Management',
  'calibration': 'Calibration',
  'cad': 'CAD Software',
  'repository': 'Repository',
  'remote-control': 'Remote Control',
  'mesh-tools': 'Mesh Tools'
};

export const pricingLabels: Record<SpecialtyTool['pricingModel'], string> = {
  'free': 'Free',
  'freemium': 'Freemium',
  'one-time': 'One-Time',
  'subscription': 'Subscription'
};

// Category colors for visual styling
export const categoryColors: Record<SpecialtyTool['category'], string> = {
  'ai-generation': '#A855F7',      // Purple/violet for AI
  'filament-art': '#EC4899',       // Pink/magenta for art
  'farm-management': '#3B82F6',    // Blue for farm
  'calibration': '#F59E0B',        // Orange/amber for calibration
  'cad': '#06B6D4',                // Cyan for CAD
  'repository': '#8B5CF6',         // Violet for repos
  'remote-control': '#22C55E',     // Green for remote
  'mesh-tools': '#6B7280'          // Gray for mesh tools
};

// Pricing colors
export const pricingColors: Record<SpecialtyTool['pricingModel'], string> = {
  'free': '#22C55E',               // Green
  'freemium': '#3B82F6',           // Blue
  'one-time': '#A855F7',           // Purple
  'subscription': '#F59E0B'        // Orange
};
