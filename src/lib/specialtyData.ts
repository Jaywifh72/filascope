export interface SpecialtyTool {
  id: string;
  name: string;
  tagline: string;
  category: 'ai-generation' | 'filament-art' | 'farm-management' | 'calibration' | 'cad' | 'repository' | 'remote-control' | 'mesh-tools';
  pricingModel: 'free' | 'freemium' | 'one-time' | 'subscription';
  website: string;
  
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
    ratings: {
      easeOfUse: 3,
      featureDepth: 5,
      valueForMoney: 4,
      communitySupport: 4,
      printFocus: 3
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['Full CAD functionality', 'Version control', 'Multi-part assemblies', 'Public documents only'] },
      { tier: 'Standard', price: '$1,500/year', features: ['Private documents', 'Priority support', 'Commercial use'] },
      { tier: 'Professional', price: '$2,500/year', features: ['Advanced simulation', 'Release management', 'Enterprise features'] }
    ],
    overview: `Onshape has disrupted the computer-aided design (CAD) market by moving the entire engineering workflow to the browser. In an industry dominated by heavy, desktop-bound legacy software like SolidWorks, Onshape's cloud-native architecture eliminates the concept of "files" and "installations." For the 3D printing community, Onshape is the "Specialty Site" of choice for engineering-grade design because it offers a robust Free Tier that includes powerful parametric tools, provided the user creates public, open-source models.`,
    keyFeatures: [
      'Browser-based professional CAD',
      'Git-like version control for designs',
      'Real-time collaboration',
      'Multi-part assemblies',
      'Works on Linux, Chromebooks, tablets',
      'Parametric modeling'
    ],
    technicalDetails: `Onshape's specialty lies in its database-driven architecture. Traditional CAD suffers from file management issues—users confuse version_1.stl with version_final.stl. Onshape utilizes a version control system similar to Git for software development. Users can "branch" a design to test a new tolerance for a 3D printed hinge, and if it works, "merge" it back into the main design. If it fails, they simply discard the branch. This non-destructive workflow is ideal for the iterative nature of 3D printing prototyping.

Furthermore, because it runs in a browser, it is accessible on Linux, Chromebooks, and tablets—devices that historically could not run professional CAD. This makes it the standard tool for educational robotics teams and open-source hardware developers.`,
    economicModel: `The cost of Onshape's free tier is privacy. All documents must be public—anyone in the Onshape community can view, copy, and export your data. This "copyleft" approach has created a massive library of engineering data. However, for users wishing to design patentable products, the upgrade to the "Standard" plan ($1,500/year) is a steep cliff, driving a clear wedge between the hobbyist/open-source maker and the commercial engineer.`,
    competitivePosition: `Onshape competes with Fusion 360 (which also has a free tier but with desktop software), FreeCAD (fully free but steeper learning curve), and SolidWorks (industry standard but expensive). Onshape's browser-based approach and version control are unique differentiators.`,
    futureOutlook: `As more engineering moves to the cloud and remote collaboration becomes standard, Onshape's architecture positions it well. The platform may expand into integrated manufacturing workflows, directly connecting CAD designs to print farms or CNC machines.`
  },
  {
    id: 'thangs',
    name: 'Thangs',
    tagline: 'The Geometric Search Engine',
    category: 'repository',
    pricingModel: 'freemium',
    website: 'https://thangs.com',
    ratings: {
      easeOfUse: 5,
      featureDepth: 4,
      valueForMoney: 4,
      communitySupport: 4,
      printFocus: 5
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['Geometric search', 'Model downloads', 'Basic Sync'] },
      { tier: 'Thangs Bundle', price: '$14.99/mo', features: ['Access to premium models', 'Hundreds of creators', 'Netflix-style access'] },
      { tier: 'Creator', price: 'Revenue share', features: ['50% of subscription revenue', 'Based on download volume', 'Premium model hosting'] }
    ],
    overview: `Traditional 3D model repositories like Thingiverse rely on textual metadata. If a user uploads a model of a specific gear but names it "Project_Gear_Final," a search for "involute gear" might fail to find it. Thangs helps 3D printer users by implementing a geometric search engine. Using deep learning algorithms, Thangs analyzes the topological shape of 3D models. Users can upload a generic STL file of a bracket, and Thangs will search its index of millions of models to find parts that are geometrically similar, regardless of their filename.

This "visual search" capability is a massive utility for reverse engineering. It allows users to find the original source of a remix or locate compatible parts based on shape alone.`,
    keyFeatures: [
      'Geometric deep learning search',
      'Visual/shape-based model discovery',
      'Thangs Sync for local file backup',
      'Version control for local files',
      'Thangs Bundle subscription model',
      'Creator revenue sharing (50%)'
    ],
    technicalDetails: `Thangs attempts to solve the "digital hoarding" problem common to 3D printing enthusiasts who have thousands of STLs scattered across local hard drives. Thangs Sync is a client utility that automatically backs up and version-controls local 3D files to the cloud. It provides a history of changes, allowing users to revert to previous versions of a model if an edit makes it unprintable.

The geometric search uses neural networks trained on 3D topology to create "embeddings"—mathematical representations of shape. When you search, your query (whether text or an uploaded model) is converted to an embedding and matched against the database.`,
    economicModel: `Thangs has aggressively innovated in monetization with its Thangs Bundle. Recognizing "subscription fatigue" where users cannot afford to support 20 different designers on Patreon, Thangs offers a flat subscription ($14.99/month) that grants access to premium models from hundreds of creators.

The platform employs a revenue-sharing model where 50% of the subscription revenue is distributed to the designers based on download volume. This aligns incentives: designers are paid to create high-quality, printable models that people actually want to use, rather than just generating engagement. For the end-user, it provides a "Netflix-style" access to high-quality files, moving the value proposition away from individual file purchases.`,
    competitivePosition: `Thangs competes with Thingiverse (legacy, declining), Printables (Prusa-backed, strong community), MyMiniFactory (premium focus), and Cults3D (European market). The geometric search is a unique differentiator that no competitor has replicated at scale.`,
    futureOutlook: `As AI-generated 3D models flood the market, Thangs' geometric search becomes more valuable for finding quality, human-designed models. The platform may expand into AI-assisted model recommendations and automated remix detection.`
  },
  {
    id: 'octoeverywhere',
    name: 'OctoEverywhere',
    tagline: 'Secure Remote Tunneling & AI Failure Detection',
    category: 'remote-control',
    pricingModel: 'freemium',
    website: 'https://octoeverywhere.com',
    ratings: {
      easeOfUse: 4,
      featureDepth: 4,
      valueForMoney: 5,
      communitySupport: 4,
      printFocus: 5
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['3 printers', 'Unlimited AI detection', '20-second webcam streams'] },
      { tier: 'Elite', price: '$11.99/mo', features: ['10 printers', 'Unlimited webcam streaming', '5GB file transfers'] }
    ],
    overview: `As 3D printers have become network-connected appliances, they have also become security vulnerabilities. Early remote management solutions often required users to "port forward" their routers, exposing their local networks to the open internet—a practice that led to hackers taking control of printers. OctoEverywhere is a specialty utility that solves this by providing secure, encrypted tunneling. It connects a local printer instance (running OctoPrint or Klipper) to the cloud via a secure socket, allowing remote control from anywhere in the world without compromising network security.`,
    keyFeatures: [
      'Secure encrypted tunneling (no port forwarding)',
      'Gadget AI spaghetti detection',
      'Layer shift detection',
      'Adhesion loss detection',
      'Automatic print pausing on failure',
      'Multi-platform notifications (SMS, Discord, Email)'
    ],
    technicalDetails: `The "killer app" within OctoEverywhere is its Gadget AI system. This computer vision utility monitors the printer's webcam feed in real-time to detect failures.

**Spaghetti Detection:** Identifying when the print has detached from the bed and is extruding plastic into thin air.

**Layer Shift Detection:** Noticing if the print head has lost its position, causing the geometry to be offset.

**Adhesion Loss:** Detecting warping corners before the print fails completely.

Upon detecting a failure, the system can automatically pause the printer and trigger notifications via SMS, Discord, or Email. This utility saves users money (by stopping wasted filament) and increases safety (by preventing the heater block from being encased in a "blob of death").`,
    economicModel: `OctoEverywhere offers a robust free tier, making safety accessible to all. The free tier includes unlimited AI failure detection but limits webcam streaming to 20 seconds at a time to save bandwidth. The Elite tier unlocks unlimited streaming and larger file transfers, targeting power users who monitor prints remotely throughout the day.`,
    competitivePosition: `OctoEverywhere competes with Obico (formerly The Spaghetti Detective), ngrok (generic tunneling), and manufacturer clouds. Its strength is the combination of secure tunneling AND AI detection in one package, with a generous free tier.`,
    futureOutlook: `As AI vision models improve, OctoEverywhere could expand into quality prediction (detecting issues before they become failures) and material usage optimization. Integration with newer printer platforms beyond OctoPrint/Klipper is likely.`
  },
  {
    id: 'makerworld',
    name: 'MakerWorld / MakerLab',
    tagline: 'The Parametric Ecosystem',
    category: 'repository',
    pricingModel: 'free',
    website: 'https://makerworld.com',
    ratings: {
      easeOfUse: 5,
      featureDepth: 4,
      valueForMoney: 5,
      communitySupport: 4,
      printFocus: 5
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['Full access', 'MakerLab tools', 'Direct printer integration', 'Optimized for Bambu Lab'] }
    ],
    overview: `MakerWorld, launched by hardware giant Bambu Lab, represents the trend of vertical integration. While it serves as a repository, its "Specialty" status comes from MakerLab—a suite of browser-based parametric generators integrated directly into the printing workflow. Unlike standalone tools that generate an STL which must then be downloaded, sliced, and transferred, MakerLab tools can send sliced code directly to Bambu printers, creating a seamless "app-like" experience.`,
    keyFeatures: [
      'AI Scanner (photogrammetry to 3D)',
      'Parametric Model Maker (boxes, gears, organizers)',
      'Make My Sign (multi-color signage)',
      'Direct integration with Bambu printers',
      'One-click print from browser',
      'AMS color mapping automation'
    ],
    technicalDetails: `MakerLab includes specialized tools that abstract complex modeling tasks:

**AI Scanner:** A photogrammetry tool that converts video of an object into a printable 3D model using cloud processing. This competes directly with apps like Polycam but is optimized specifically for the constraints of FDM printing.

**Parametric Model Maker:** A tool for generating functional parts like boxes, gears, and organizers. Users input dimensions (e.g., "Length: 100mm", "Compartments: 4"), and the script generates the geometry in real-time. This replaces the need for OpenSCAD scripting for the average user.

**Make My Sign:** A dedicated utility for multi-color signage. It automatically handles the layer swaps or multi-material mapping required to print text in a different color than the background, utilizing Bambu's AMS (Automatic Material System).`,
    economicModel: `MakerWorld is free because it's a strategic asset for Bambu Lab. By creating the best repository experience for Bambu printers, they increase the value proposition of their hardware. The seamless workflow creates switching costs—users who invest in MakerWorld's ecosystem are less likely to switch to competing printer brands.`,
    competitivePosition: `MakerWorld competes with Printables, Thangs, and Thingiverse as a repository, but its MakerLab tools are unique. The tight hardware integration is both a strength (seamless UX for Bambu users) and weakness (less useful for other printer brands).`,
    futureOutlook: `As Bambu Lab expands its printer lineup, MakerWorld will likely add more specialized tools. The AI Scanner could evolve into full 3D scanning workflows, and parametric tools could expand to cover more use cases like cable management, enclosures, and functional parts.`
  },
  {
    id: 'lithophanemaker',
    name: 'LithophaneMaker.com',
    tagline: 'The Geometry of Light',
    category: 'mesh-tools',
    pricingModel: 'free',
    website: 'https://lithophanemaker.com',
    ratings: {
      easeOfUse: 5,
      featureDepth: 4,
      valueForMoney: 5,
      communitySupport: 3,
      printFocus: 5
    },
    pricing: [
      { tier: 'Free', price: '$0', features: ['All geometry generators', 'Client-side processing', 'Privacy-focused'] },
      { tier: 'Kits', price: 'Varies', features: ['Physical components', 'Night light hardware', 'Matching brackets'] }
    ],
    overview: `LithophaneMaker.com is a prime example of a "single-purpose" specialty site that executes its niche better than generalist tools. While standard slicers can create flat lithophanes, LithophaneMaker specializes in complex, mathematically generated forms that are difficult to model manually, such as globes, curved night light shields, and ceiling fan pulls.

The utility of the site lies in its "Interface Generation." When a user wants to make a lithophane night light, the site doesn't just generate the image panel; it generates the specific mounting bracket and clips required to attach that panel to standard, off-the-shelf night light hardware. This integration of the aesthetic (the image) with the mechanical (the clip) saves users hours of trial-and-error in CAD.`,
    keyFeatures: [
      'Globe lithophanes',
      'Curved night light shields',
      'Ceiling fan pulls',
      'Integrated mounting brackets',
      'Client-side image processing',
      'Privacy-focused (no server storage)'
    ],
    technicalDetails: `The site uses JavaScript-based image processing to convert photos into height-mapped 3D geometry. Unlike cloud services, the processing happens in your browser—images are not uploaded to a server. This is particularly important for personal family photos.

The mathematical generation of curved surfaces (spherical, cylindrical, conical) is handled through parametric equations that map 2D image coordinates to 3D surface positions while maintaining the correct grayscale-to-thickness relationship for the backlit effect.`,
    economicModel: `In an era of data harvesting, LithophaneMaker stands out for its privacy-centric approach. The tool processes images largely client-side (in the browser), meaning personal family photos used for lithophanes are not stored permanently on a server. The economic model relies on the sale of physical kits (cords, bulbs) that match the generated STL files, creating a sustainable loop where the free software drives sales of the necessary hardware components.`,
    competitivePosition: `LithophaneMaker competes with slicer-integrated lithophane modes (Cura, PrusaSlicer) and general-purpose tools like ItsLitho. Its strength is the focus on complex geometries (globes, night lights) with matching physical hardware kits.`,
    futureOutlook: `The site may expand to include more lighting fixture types and potentially integrate with HueForge-style transmission distance data for multi-color lithophanes. LED integration guides and smart home connectivity could also be future additions.`
  },
  {
    id: 'formware',
    name: 'Formware Online',
    tagline: 'The Digital Repair Shop',
    category: 'mesh-tools',
    pricingModel: 'free',
    website: 'https://formware.co/onlinetool',
    ratings: {
      easeOfUse: 5,
      featureDepth: 3,
      valueForMoney: 5,
      communitySupport: 2,
      printFocus: 5
    },
    pricing: [
      { tier: 'Free Online', price: '$0', features: ['50MB file limit', '4-minute timeout', 'Basic mesh repair'] },
      { tier: 'Formware Desktop', price: 'Paid', features: ['No file limits', 'Advanced repair', 'Full slicing suite'] }
    ],
    overview: `A pervasive problem in 3D printing is "non-manifold" geometry. Files generated by 3D scanners, game rips, or inexperienced CAD users often contain holes, inverted normals (where the software thinks the "inside" is the "outside"), or self-intersecting shells. If fed into a slicer, these files cause print failures. Formware Online provides a critical, free browser-based service to sanitize these files.`,
    keyFeatures: [
      'Automatic hole stitching',
      'Normal repair (inside/outside)',
      'Self-intersection fixing',
      'Browser-based processing',
      'No installation required'
    ],
    technicalDetails: `Formware utilizes industrial-grade mesh repair algorithms (likely derivatives of Netfabb or similar logic) to automatically stitch holes and fix normals. It is a "black box" utility: users upload a broken file, and the server returns a fixed one.

**File Size Cap:** 50MB. This makes it unsuitable for high-resolution 3D scans or extremely complex art pieces.

**Time Out:** 4 minutes. If the repair calculation exceeds this window, the process is terminated to preserve server resources.

Despite these limits, for the vast majority of "broken" STLs found on the internet, Formware acts as the essential "Digital Repair Shop," bridging the gap between a corrupt file and a successful print.`,
    economicModel: `The free online tool is designed to upsell Formware's paid desktop slicing software. By demonstrating the quality of their mesh repair algorithms for free, they build trust with potential customers who may need more advanced features.`,
    competitivePosition: `Formware competes with Microsoft 3D Builder (free, Windows only), Meshmixer (discontinued but still used), Blender (powerful but complex), and Netfabb (expensive, professional). Formware's browser-based approach with no installation is a key differentiator for quick fixes.`,
    futureOutlook: `As AI-generated 3D models become more common (and often have mesh issues), tools like Formware become more essential. The platform may integrate AI-powered repair that understands semantic geometry (e.g., knowing that a hole in a statue's arm is an error, not a feature).`
  }
];

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
