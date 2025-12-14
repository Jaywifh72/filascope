export interface SlicerData {
  id: string;
  name: string;
  logo?: string;
  summary: string;
  history: string;
  keyStrengths: {
    title: string;
    description: string;
  }[];
  technicalSpecs: {
    price: string;
    supportedOS: string;
    fileSupport: string;
    connectivity: string;
    status?: string;
  };
  links: {
    label: string;
    url: string;
  }[];
}

export const slicerData: SlicerData[] = [
  {
    id: "ultimaker-cura",
    name: "UltiMaker Cura",
    summary: "UltiMaker Cura is the most widely used 3D printing software in the world. It serves as the bridge between the digital model and the physical print, known for its \"dual-mode\" interface that caters to both absolute beginners (Recommended Mode) and advanced engineers (Custom Mode). It enables granular control over every aspect of the printing process, from line widths to complex infill patterns.",
    history: "Originally developed by David Braam, Cura was acquired by Ultimaker to drive their hardware ecosystem. It has since become the industry standard for open-source slicing. Major milestones include the release of the \"Arachne\" slicing engine in version 5.0, which revolutionized wall generation by using variable line widths to eliminate gaps, significantly increasing part strength.",
    keyStrengths: [
      { title: "Arachne Engine", description: "Generates variable line widths for superior structural integrity and dimensional accuracy." },
      { title: "Marketplace Ecosystem", description: "An extensive plugin library that allows users to add features (like custom supports) and download verified material profiles from major chemical manufacturers (BASF, Polymaker)." },
      { title: "Intent Profiles", description: "\"One-click\" profiles that automatically adjust hundreds of settings based on the user's goal (e.g., \"Visual Quality\" vs. \"Engineering Strength\")." }
    ],
    technicalSpecs: {
      price: "Free (Open Source LGPLv3). Enterprise subscriptions available for fleet management.",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, 3MF, X3D. (STEP supported via plugin or Enterprise)",
      connectivity: "WiFi/LAN (Ultimaker printers), OctoPrint (via plugin), USB"
    },
    links: [
      { label: "Website", url: "https://ultimaker.com/software/ultimaker-cura" },
      { label: "Source Code", url: "https://github.com/Ultimaker/Cura" }
    ]
  },
  {
    id: "prusaslicer",
    name: "PrusaSlicer",
    summary: "PrusaSlicer is a feature-rich, open-source slicer optimized for the Prusa ecosystem but fully compatible with third-party printers. It is celebrated for its stability, clean user interface, and frequent updates that often introduce cutting-edge features to the general market.",
    history: "Forked from the original Slic3r project in 2016, \"Slic3r Prusa Edition\" was rebranded to PrusaSlicer in 2019 following a complete rewrite of the code from Perl to C++. This transition drastically improved performance. It has since pioneered features like \"Organic Supports\" and \"Paint-on Seams.\"",
    keyStrengths: [
      { title: "Paint-on Features", description: "Allows users to manually \"paint\" supports, seams, and multi-material colors directly onto the 3D model." },
      { title: "Organic Supports", description: "Generates tree-like support structures that save material and are easy to remove." },
      { title: "Modifier Meshes", description: "Enables users to change print settings (e.g., infill density) for only specific geometric regions of a model." }
    ],
    technicalSpecs: {
      price: "Free (Open Source AGPLv3)",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, 3MF, STEP (Native import)",
      connectivity: "Prusa Connect, OctoPrint, Repetier-Server, FlashAir"
    },
    links: [
      { label: "Website", url: "https://prusa3d.com/page/prusaslicer" },
      { label: "Source Code", url: "https://github.com/prusa3d/PrusaSlicer" }
    ]
  },
  {
    id: "orcaslicer",
    name: "OrcaSlicer",
    summary: "OrcaSlicer is a community-driven fork that combines the project-based workflow of Bambu Studio with the granular control of SuperSlicer. It is rapidly becoming the favorite for Klipper-based printers (Voron, Creality K-series) due to its built-in calibration tools and modern interface.",
    history: "Tracing its lineage from Slic3r -> PrusaSlicer -> Bambu Studio, OrcaSlicer (formerly BambuStudio-SoftFever) was created to open up the Bambu Studio features to a wider range of third-party printers. It has grown into a robust standalone project with unique features like \"Sandwich Mode\" (Inner-Outer-Inner wall ordering).",
    keyStrengths: [
      { title: "Built-in Calibration", description: "Includes automated generators for Flow Rate, Pressure Advance, Max Volumetric Speed, and Temp Towers, eliminating the need for manual G-code editing." },
      { title: "Multi-Plate Projects", description: "Saves multiple build plates and calibration settings in a single project file." },
      { title: "Klipper Integration", description: "Native support for Mainsail/Fluidd interfaces within the slicer \"Device\" tab." }
    ],
    technicalSpecs: {
      price: "Free (Open Source AGPLv3)",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, 3MF, STEP",
      connectivity: "WiFi/LAN (Klipper, OctoPrint, Bambu)"
    },
    links: [
      { label: "Website", url: "https://orcaslicer.com" },
      { label: "Source Code", url: "https://github.com/SoftFever/OrcaSlicer" }
    ]
  },
  {
    id: "bambu-studio",
    name: "Bambu Studio",
    summary: "Bambu Studio is the dedicated software for Bambu Lab printers, introducing a \"Project-Based\" workflow. It integrates slicing, remote management, and model coloring into a seamless suite. While optimized for Bambu hardware, it supports other printers and is based on open-source foundations.",
    history: "Released in 2022 alongside the X1 Carbon printer, Bambu Studio is a fork of PrusaSlicer. It was developed to handle the specific needs of high-speed CoreXY printing and the AMS (Automatic Material System) for multi-color printing.",
    keyStrengths: [
      { title: "Multi-Color Painting", description: "Best-in-class tools for coloring models for multi-material printing, including automatic purge volume calculation." },
      { title: "Arc Move", description: "Converts linear paths into G2/G3 arcs, resulting in smoother printer movements and less vibration." },
      { title: "Remote Monitoring", description: "Integrated live camera feed, spaghetti failure detection, and timelapse management." }
    ],
    technicalSpecs: {
      price: "Free (Open Source AGPLv3 Core)",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "3MF, STL, STEP, OBJ, AMF",
      connectivity: "Bambu Cloud, LAN Mode"
    },
    links: [
      { label: "Website", url: "https://bambulab.com/en-us/download/studio" },
      { label: "Source Code", url: "https://github.com/bambulab/BambuStudio" }
    ]
  },
  {
    id: "simplify3d",
    name: "Simplify3D",
    summary: "Simplify3D (S3D) is a premium, professional-grade slicer known for its simulation speed and \"Process\" architecture. It allows different settings to be applied to different parts or vertical sections of a print, offering extreme control for complex manufacturing.",
    history: "Launched in 2013, S3D was long considered the gold standard for reliable supports. After a period of stagnation, Version 5.0 was released in 2023, introducing a new engine and modern features to compete with free alternatives.",
    keyStrengths: [
      { title: "Process Architecture", description: "Unmatched ability to vary print settings (infill, speed, layer height) across different regions of a single part or build plate." },
      { title: "Simulation", description: "Extremely fast and accurate pre-print simulation that visualizes travel moves and speed changes." },
      { title: "Support Customization", description: "Famous for its manual support placement tools, allowing users to place or remove individual support pillars with precision." }
    ],
    technicalSpecs: {
      price: "~$199 USD (Perpetual License), Paid upgrades for major versions",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, 3MF",
      connectivity: "USB, WiFi (limited machines)"
    },
    links: [
      { label: "Website", url: "https://simplify3d.com" },
      { label: "Compatibility Check", url: "https://simplify3d.com/products/simplify3d-software/check-compatibility" }
    ]
  },
  {
    id: "creality-print",
    name: "Creality Print",
    summary: "Creality Print is the proprietary slicer designed for the Creality ecosystem, particularly the high-speed K-series and Ender-3 V3 series. It integrates cloud slicing, model library access, and LAN print farm management into a single dashboard.",
    history: "Creality initially relied on older, skinned versions of Cura. With the release of their Klipper-based high-speed printers (K1), they pivoted to \"Creality Print,\" a more modern, self-developed platform (recent versions heavily reference Orca/Prusa algorithms) capable of handling high flow rates and acceleration.",
    keyStrengths: [
      { title: "Cloud Integration", description: "Direct access to the Creality Cloud model repository and remote \"Cloud Slicing\" capabilities." },
      { title: "LAN Control", description: "Built-in management for print farms, allowing users to control multiple printers simultaneously." },
      { title: "High-Speed Optimization", description: "Profiles specifically tuned for Creality's \"Hyper PLA\" and high-velocity motion systems (up to 600mm/s)." }
    ],
    technicalSpecs: {
      price: "Free",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, 3MF, STEP",
      connectivity: "Creality Cloud (WiFi), LAN, USB"
    },
    links: [
      { label: "Website", url: "https://creality.com/pages/download-software" },
      { label: "Cloud", url: "https://crealitycloud.com" }
    ]
  },
  {
    id: "ideamaker",
    name: "ideaMaker",
    summary: "ideaMaker is a powerful slicer developed by Raise3D but compatible with most FDM printers. It is unique for integrating CAD-like texturing tools directly into the slicing workflow, allowing users to modify surface finishes without external modeling software.",
    history: "Released in 2016 for the Raise3D N-series, ideaMaker has evolved into a robust independent slicer. It is particularly noted for its excellence in handling IDEX (Independent Dual Extruder) printing modes like Mirror and Duplication.",
    keyStrengths: [
      { title: "Texture Generation", description: "Can apply grayscale images to model surfaces to create 3D textures (e.g., wood grain, carbon fiber pattern) automatically." },
      { title: "Boolean Operations", description: "Allows users to cut, split, and merge models directly on the build plate." },
      { title: "Belt Printer Support", description: "Native support for infinite-Z belt printers (like the CR-30)." }
    ],
    technicalSpecs: {
      price: "Free",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, 3MF, OLTP",
      connectivity: "RaiseCloud, OctoPrint"
    },
    links: [
      { label: "Website", url: "https://raise3d.com/download/ideamaker-all-versions" },
      { label: "Library", url: "https://ideamaker.io" }
    ]
  },
  {
    id: "superslicer",
    name: "SuperSlicer",
    summary: "SuperSlicer is an open-source fork of PrusaSlicer designed for power users. It exposes nearly every variable of the slicing engine, offering granular control over acceleration, jerk, and flow for every specific feature type (infill, perimeters, bridges).",
    history: "Created by the developer \"supermerill,\" SuperSlicer emerged to serve the Klipper community (specifically Voron users) who needed more control than PrusaSlicer offered at the time. It pioneered the built-in calibration menu that was later adopted by OrcaSlicer.",
    keyStrengths: [
      { title: "Granular Control", description: "Independent acceleration and jerk settings for top surfaces, internal infill, external perimeters, etc." },
      { title: "Dense Infill", description: "Increases infill density only near top surfaces to ensure smooth ceilings without wasting material." },
      { title: "Calibration Tools", description: "Integrated generators for tuning flow, retraction, and temperature." }
    ],
    technicalSpecs: {
      price: "Free (Open Source AGPLv3)",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, 3MF, AMF",
      connectivity: "Klipper (Moonraker), OctoPrint, Duet"
    },
    links: [
      { label: "GitHub", url: "https://github.com/supermerill/SuperSlicer" },
      { label: "Documentation", url: "https://github.com/supermerill/SuperSlicer/wiki" }
    ]
  },
  {
    id: "flashprint",
    name: "FlashPrint",
    summary: "FlashPrint is the dedicated slicing software for FlashForge printers. It prioritizes stability and ease of use, offering a guided workflow that is ideal for educational and enterprise environments where reliability is paramount.",
    history: "FlashPrint has evolved alongside FlashForge hardware. Version 5 marked a major overhaul, modernizing the UI and incorporating advanced features like Tree Supports and dimensional compensation, bringing it closer to open-source standards while maintaining its \"appliance-like\" simplicity.",
    keyStrengths: [
      { title: "IDEX Optimization", description: "Simplified modes for \"Mirror\" and \"Duplicate\" printing for dual-extruder machines." },
      { title: "Dimensional Accuracy", description: "Specialized \"Wall Compensation\" algorithms to adjust for thermal shrinkage of ABS/ASA." },
      { title: "Safety Constraints", description: "Prevents users from selecting dangerous settings combinations, reducing hardware failure rates." }
    ],
    technicalSpecs: {
      price: "Free (Proprietary)",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, 3MF, FPP",
      connectivity: "FlashCloud, Polar Cloud, USB, WiFi"
    },
    links: [
      { label: "Website", url: "https://flashforge.com/download-center" },
      { label: "Wiki", url: "https://wiki.flashforge.com/en/flashprint" }
    ]
  },
  {
    id: "anycubic-slicer",
    name: "Anycubic Slicer / Photon Workshop",
    summary: "Anycubic offers two distinct software solutions: Anycubic Slicer (based on Prusa/Orca) for their high-speed FDM printers, and Photon Workshop for their resin (SLA/DLP) printers.",
    history: "Anycubic historically used generic Cura profiles. With the Kobra 2/3 series, they released \"Anycubic Slicer\" (often called Slicer Next) to leverage modern input shaping. Photon Workshop has been the standard resin utility, evolving to include advanced repair and hollowing tools.",
    keyStrengths: [
      { title: "Photon Workshop (Resin)", description: "Features \"FaceGen\" (creates 3D faces from photos) and intelligent island detection for resin supports." },
      { title: "Anycubic Slicer (FDM)", description: "Supports \"Arachne\" walls and high-speed motion planning for Kobra series." },
      { title: "Remote Management", description: "Both integrate with the Anycubic Cloud app for remote print start and monitoring." }
    ],
    technicalSpecs: {
      price: "Free",
      supportedOS: "Windows, macOS",
      fileSupport: "STL, OBJ; (Resin outputs: .pwmo, .pm3m, .dlp)",
      connectivity: "Anycubic Cloud"
    },
    links: [
      { label: "FDM Download", url: "https://www.anycubic.com/fdmDownload" },
      { label: "Resin Download", url: "https://www.anycubic.com/lcdDownload" }
    ]
  },
  {
    id: "lychee-slicer",
    name: "Lychee Slicer",
    summary: "Lychee Slicer is a popular third-party slicer for both Resin and FDM printing, though it is most famous for its Resin capabilities. It is known for its \"Magic Menu\" automation and visually rich, modern interface.",
    history: "Developed by Mango3D, Lychee rose to prominence as the user-friendly alternative to ChiTuBox. It focuses on visual feedback (color-coded supports) and has recently expanded to become a unified platform for both filament and resin workflows.",
    keyStrengths: [
      { title: "Magic Menu", description: "One-click automation for orientation, hollowing, and supporting." },
      { title: "3D Hollowing", description: "Advanced hollowing algorithms that create internal lattices and drain holes to prevent suction cup failures." },
      { title: "Community Profiles", description: "A cloud database of user-rated resin exposure settings for thousands of printer/resin combinations." }
    ],
    technicalSpecs: {
      price: "Free (Lite), Pro (~€10/mo), Premium (Library)",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, 3MF",
      connectivity: "WiFi (select printers)"
    },
    links: [
      { label: "Website", url: "https://mango3d.io" },
      { label: "Pricing", url: "https://mango3d.io/pricing-and-subscription" }
    ]
  },
  {
    id: "chitubox",
    name: "ChiTuBox",
    summary: "ChiTuBox is the industry-standard slicer for consumer resin printing, developed by the company that makes the mainboards for most resin printers (Elegoo, Phrozen, Anycubic). It is the default choice for reliability and file compatibility.",
    history: "Created by CBD-Tech, ChiTuBox Basic became the universal tool for resin printing due to its native support for the encrypted file formats (.ctb) required by Chitu hardware. The \"Pro\" version was launched in 2021 to offer CAD-compatible file support and advanced repair tools.",
    keyStrengths: [
      { title: "Multi-Parameter Slicing (Pro)", description: "Allows different exposure settings for different height ranges of the model (e.g., solid base vs. detailed top)." },
      { title: "Native Compatibility", description: "Guaranteed support for almost all consumer resin printers using Chitu hardware." },
      { title: "Auto-Support", description: "Robust \"Island Detection\" and support generation algorithms." }
    ],
    technicalSpecs: {
      price: "Basic (Free), Pro (~$169/year)",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ; (Pro adds STEP, 3MF, etc.)",
      connectivity: "LAN (WiFi enabled Chitu boards)"
    },
    links: [
      { label: "Website", url: "https://chitubox.com" },
      { label: "Download", url: "https://chitubox.com/en/download/chitubox-free" }
    ]
  },
  {
    id: "voxeldance-tango",
    name: "VoxelDance Tango",
    summary: "VoxelDance Tango is a premium resin slicer that brings industrial-grade algorithms to the consumer market. It focuses on speed and \"Smart\" automated workflows that adapt supports based on the geometry type (e.g., dental vs. jewelry).",
    history: "VoxelDance originally developed software for industrial SLM/SLS (metal) printing. Tango allows consumer users to access their high-performance geometry engine, which is significantly faster at processing large meshes than competitors.",
    keyStrengths: [
      { title: "Smart Support Scripts", description: "Industry-specific automation scripts (Dental, Figure, Jewelry) that optimize support tips and bracing." },
      { title: "Tree Supports for Resin", description: "Implements branching supports in resin printing to minimize surface scarring." },
      { title: "Performance", description: "Optimized rendering kernel capable of handling heavy files (1GB+) smoothly." }
    ],
    technicalSpecs: {
      price: "Subscription (~$15 - $60/month tiers) or Annual. Free Trial available.",
      supportedOS: "Windows, macOS",
      fileSupport: "STL, OBJ, 3MF, SLC, CLI",
      connectivity: "WiFi (select printers)"
    },
    links: [
      { label: "Website", url: "https://voxeldance.com/voxeldance_tango" },
      { label: "Pricing", url: "https://voxeldance.com/voxeldance_tango_pricing" }
    ]
  },
  {
    id: "repetier-host",
    name: "Repetier-Host",
    summary: "Repetier-Host is a veteran \"Host\" application rather than just a slicer. It acts as a control center that integrates multiple slicing engines (CuraEngine, Slic3r, Skeinforge) and provides direct USB control, monitoring, and G-code editing for the printer.",
    history: "Developed by Hot-World GmbH, it was a staple of the RepRap era. It remains essential for users building custom machines or those who need to visualize and manually edit G-code line-by-line before printing.",
    keyStrengths: [
      { title: "Multi-Slicer Support", description: "Slice the same model with Cura, Slic3r, or Skeinforge within one window to compare results." },
      { title: "Velocity Painting", description: "A post-processing feature that modulates extrusion speed to create patterns/images on the surface of the print." },
      { title: "Manual Control", description: "Full access to EEPROM settings, manual motor jogging, and temperature curves." }
    ],
    technicalSpecs: {
      price: "Free (Donationware). Pro branding available for OEMs.",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, 3DS",
      connectivity: "USB, TCP/IP, Repetier-Server"
    },
    links: [
      { label: "Website", url: "https://repetier.com" },
      { label: "Download", url: "https://repetier.com/download-now" }
    ]
  },
  {
    id: "slic3r",
    name: "Slic3r",
    summary: "Slic3r is the open-source pioneer that laid the foundation for modern slicing. While its development has slowed, it remains a powerful tool for command-line automation and is the biological parent of PrusaSlicer, SuperSlicer, and Bambu Studio.",
    history: "Created by Alessandro Ranellucci in 2011, Slic3r introduced critical technologies like microlayering, bridge detection, and modifier meshes. The last stable release was in 2018, but it remains a reference implementation for the industry.",
    keyStrengths: [
      { title: "Modifier Meshes", description: "The original implementation of applying settings to local intersections of geometry." },
      { title: "Command Line Interface", description: "Robust CLI for server-side slicing and automated workflows." },
      { title: "G-Code Macros", description: "High flexibility for inserting custom code logic." }
    ],
    technicalSpecs: {
      price: "Free (Open Source AGPLv3)",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, AMF",
      connectivity: "N/A",
      status: "Legacy/Stable (Last release 1.3.0)"
    },
    links: [
      { label: "Website", url: "https://slic3r.org" },
      { label: "GitHub", url: "https://github.com/slic3r/Slic3r" }
    ]
  },
  {
    id: "kisslicer",
    name: "KISSlicer",
    summary: "KISSlicer (Keep It Simple Slicer) is a technical slicer that prioritizes precision over user-friendly graphics. It is favored by engineers for its \"Stepover Control\" and path planning algorithms that maximize part strength.",
    history: "Developed by Jonathan Drummer, KISSlicer contradicts its name by being one of the most complex and capable tools available. It operates on a Freemium model and has a dedicated following among users of precision industrial printers.",
    keyStrengths: [
      { title: "Stepover Control", description: "Precise management of path overlap for superior layer bonding." },
      { title: "Adaptive Layer Height", description: "One of the first implementations of dynamic layer thickness based on model slope." },
      { title: "Preload", description: "Advanced pressure management features similar to \"Pressure Advance\" in firmware." }
    ],
    technicalSpecs: {
      price: "Free (Single Extruder), Pro (~$42), Premium (~$82)",
      supportedOS: "Windows, macOS, Linux, FreeBSD",
      fileSupport: "STL",
      connectivity: "None (Offline workflow)"
    },
    links: [
      { label: "Website", url: "https://kisslicer.com" },
      { label: "Forum", url: "https://kisslicer.com/forum" }
    ]
  },
  {
    id: "mattercontrol",
    name: "MatterControl",
    summary: "MatterControl is an all-in-one desktop application that combines CAD modeling, slicing, and printer control. It allows users to create designs from scratch using primitives and print them without ever leaving the software.",
    history: "Developed by MatterHackers, version 2.0 transformed it from a simple host into a creative suite. It aims to lower the barrier to entry by integrating \"Design Apps\" that automate creating text, gears, and lithophanes.",
    keyStrengths: [
      { title: "Integrated CAD", description: "Drag-and-drop boolean operations and design primitives within the slicer." },
      { title: "Image Converter", description: "Instantly converts 2D images (JPG/PNG) into 3D extrusions or lithophanes." },
      { title: "Print Recovery", description: "Hardware-integrated features to resume prints after power failure (when connected via USB)." }
    ],
    technicalSpecs: {
      price: "Free (Open Source)",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, AMF, MCX",
      connectivity: "USB (Direct Control), Cloud Sync"
    },
    links: [
      { label: "Website", url: "https://matterhackers.com/store/l/mattercontrol" },
      { label: "Source", url: "https://github.com/MatterHackers/MatterControl" }
    ]
  },
  {
    id: "craftware",
    name: "CraftWare",
    summary: "CraftWare (now CraftWare Pro) is a slicer developed for CraftBot printers but compatible with others. It is legendary for its G-code Visualizer, which allows users to inspect print moves with color-coded clarity that few other slicers match.",
    history: "Originally a free utility, CraftWare transitioned to \"CraftWare Pro\" with a new engine. It now targets the industrial sector with \"Enterprise\" features for print farm management, though a free version remains available.",
    keyStrengths: [
      { title: "G-code Visualization", description: "Best-in-class preview mode allows for easy debugging of slicing errors before printing." },
      { title: "IDEX Support", description: "Optimized for \"Parallel\" and \"Mirror\" modes on dual-head printers." },
      { title: "Custom Supports", description: "Interactive support structure management." }
    ],
    technicalSpecs: {
      price: "Standard (Free), Premium (~$99/yr), Enterprise (~$499/yr)",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "STL, OBJ, 3MF",
      connectivity: "CraftBot Cloud"
    },
    links: [
      { label: "Website", url: "https://craftbot.com/craftware" },
      { label: "Pro Info", url: "https://craftbot.com/software" }
    ]
  },
  {
    id: "kiri-moto",
    name: "Kiri:Moto",
    summary: "Kiri:Moto is a unique, browser-based CAM engine. It is not just a 3D slicer; it also generates toolpaths for CNC milling and Laser cutting. It runs entirely in the browser using local processing, meaning files are not uploaded to a cloud server.",
    history: "Developed by Stewart Allen, Kiri:Moto was designed to remove installation barriers for education. It is integrated into Onshape (CAD) as a plugin, allowing for a seamless workflow from design to manufacturing.",
    keyStrengths: [
      { title: "Browser-Based", description: "Runs on any device with a modern browser (Chromebooks, tablets) without installation." },
      { title: "Multi-Modal", description: "Switch between FDM Slicer, CNC CAM, and Laser modes instantly." },
      { title: "Privacy", description: "Local processing ensures intellectual property never leaves the user's computer." }
    ],
    technicalSpecs: {
      price: "Free (Open Source / Donation)",
      supportedOS: "Web Browser (Platform Agnostic)",
      fileSupport: "STL, OBJ, SVG (for Laser)",
      connectivity: "Export G-code, Integration with Onshape"
    },
    links: [
      { label: "App", url: "https://grid.space/kiri" },
      { label: "Source", url: "https://github.com/GridSpace/grid-apps" }
    ]
  },
  {
    id: "3dprinteros",
    name: "3DPrinterOS",
    summary: "3DPrinterOS is a cloud-based operating system designed for managing large fleets of printers in universities and enterprises. It centralizes file management, slicing, and user permissions into a single web dashboard.",
    history: "Founded to solve the \"Sneakernet\" problem (using SD cards) in computer labs, it has become the standard for institutional 3D printing. It incorporates cloud versions of other slicers (like Cura and Slic3r) within its platform.",
    keyStrengths: [
      { title: "Fleet Management", description: "Controls queues, user access, and reporting for hundreds of printers across different locations." },
      { title: "Cloud Slicing", description: "Slices files on the server using various engines, ensuring consistent settings across an organization." },
      { title: "Compatibility", description: "Connects standard USB printers to the cloud via a client application or Raspberry Pi." }
    ],
    technicalSpecs: {
      price: "Premium (~$15/mo), Enterprise/Edu (Custom pricing)",
      supportedOS: "Web-based (Client available for Win/Mac/Linux/Pi)",
      fileSupport: "STL, OBJ, STEP, 3MF",
      connectivity: "Cloud-to-Printer (via USB bridge)"
    },
    links: [
      { label: "Website", url: "https://3dprinteros.com" },
      { label: "Login", url: "https://cloud.3dprinteros.com" }
    ]
  }
];
