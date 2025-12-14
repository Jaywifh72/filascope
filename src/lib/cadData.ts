export interface CADSoftware {
  id: string;
  name: string;
  logo?: string;
  summary: string;
  architectureOverview: string;
  additiveWorkflow: string[];
  pricing: {
    tier: string;
    cost: string;
    features: string;
  }[];
  strengths: string[];
  weaknesses: string[];
  technicalSpecs: {
    price: string;
    supportedOS: string;
    fileSupport: string;
    connectivity: string;
  };
  links: {
    website?: string;
    download?: string;
    source?: string;
    documentation?: string;
  };
}

export const cadData: CADSoftware[] = [
  {
    id: "fusion-360",
    name: "Autodesk Fusion 360",
    summary: "Autodesk Fusion 360 stands as the quintessential integrated cloud platform for product development in 2025. It unifies Computer-Aided Design (CAD), Computer-Aided Manufacturing (CAM), and Computer-Aided Engineering (CAE) into a singular environment.",
    architectureOverview: "Unlike traditional desktop-bound applications, Fusion 360 utilizes a hybrid local/cloud architecture. While heavy geometric calculations can run locally, data management, versioning, and complex simulations (like generative design) leverage Autodesk's cloud infrastructure. This positions it as the industry standard for \"prosumers,\" startups, and agile engineering teams who require collaborative workflows without the immense IT overhead of enterprise PLM systems. Its modeling kernel allows for a seamless blend of parametric history-based modeling and T-Spline freeform sculpting, enabling users to create ergonomic, organic shapes that retain dimensional precision—a critical requirement for functional 3D printing.",
    additiveWorkflow: [
      "Parametric Design History: The software maintains a linear timeline of all operations. For 3D printing, where tolerance adjustments are frequent (e.g., offsetting a hole diameter by 0.2mm to account for thermal shrinkage), this feature is invaluable. A user can modify a single sketch dimension, and the entire 3D model updates automatically, ready for re-export.",
      "Mesh Workspace Integration: Following the strategic sunsetting of Meshmixer, Fusion 360 has absorbed significant mesh manipulation capabilities. Users can now import STL or OBJ files, repair non-manifold geometry, and convert meshes into B-Rep (Boundary Representation) solids.",
      "Manufacturing Extension: Fusion's manufacturing workspace supports direct integration with 3D printers. It offers tools for automatic orientation optimization to minimize support structures, nesting parts to maximize build plate usage, and generating support structures directly within the CAD environment before exporting to G-code or 3MF."
    ],
    pricing: [
      { tier: "Personal Use", cost: "Free", features: "Limited to 10 active editable documents; standard STL export; no commercial use; limited CAM/Simulation." },
      { tier: "Commercial Subscription", cost: "~$680 - $850 / year", features: "Unlimited active files; commercial rights; full file translation (STEP, IGES, etc.); collaborative cloud data management." },
      { tier: "Extensions", cost: "~$1,600+ / year", features: "Unlocks generative design, advanced fluid simulation, and multi-axis additive manufacturing tools." }
    ],
    strengths: [
      "Watertight Geometry: As a solid modeler, Fusion 360 generates mathematically watertight geometry by default, virtually eliminating the \"non-manifold\" errors that plague surface modelers.",
      "Integrated Simulation: The ability to run Finite Element Analysis (FEA) on a part to test its structural integrity before printing saves significant material and time, allowing optimization of infill and wall thickness based on stress data.",
      "Collaboration: Cloud-native file management ensures that teams always work on the latest version of a file, preventing version control conflicts."
    ],
    weaknesses: [
      "Subscription Fatigue: The lack of a permanent license option means users essentially rent their access to their own intellectual property. If the subscription lapses, edit access is lost.",
      "Cloud Dependency: The software requires an internet connection for verifying licenses and performing cloud translations. Outages or slow connections can cripple the workflow.",
      "Mesh Performance: Despite improvements, Fusion 360 struggles with high-poly meshes (e.g., >100k triangles) typical of high-res 3D scans, often requiring pre-processing in software like Blender."
    ],
    technicalSpecs: {
      price: "Free (Personal) / ~$680-850/year (Commercial)",
      supportedOS: "Windows, macOS",
      fileSupport: "F3D, STEP, IGES, STL, OBJ, 3MF, DXF, DWG",
      connectivity: "Autodesk Cloud, Local Network"
    },
    links: {
      website: "https://www.autodesk.com/products/fusion-360",
      download: "https://www.autodesk.com/products/fusion-360/free-trial"
    }
  },
  {
    id: "blender",
    name: "Blender",
    summary: "Blender is the preeminent open-source 3D creation suite, rivaling enterprise-grade software in the entertainment industry. Unlike CAD tools based on mathematical curves (NURBS), Blender is a polygon-based surface modeler.",
    architectureOverview: "While historically known for a steep learning curve and idiosyncratic interface, the 4.x series releases (current in 2025) have streamlined the user experience significantly. It dominates the \"artistic\" side of the 3D printing market—character design, miniatures, and organic props—where visual fidelity takes precedence over micron-level mechanical tolerance. Its architecture is built on a comprehensive pipeline that includes sculpting, rigging, animation, and rendering, making it a \"Swiss Army Knife\" for digital artists.",
    additiveWorkflow: [
      "3D Print Toolbox: This essential add-on (bundled with Blender) transforms the software into a print preparation powerhouse. It provides statistical analysis of volume and surface area and automates checks for non-manifold elements, intersecting faces, and zero-thickness walls. The \"Make Manifold\" function attempts to auto-repair geometry errors, ensuring the mesh is \"watertight\" for slicers.",
      "Sculpting and Remeshing: Blender's sculpting workflow, powered by dynamic topology (Dyntopo), allows users to add detail to models organically. The Voxel Remesher is particularly useful for 3D printing, as it can unify multiple intersecting objects into a single, continuous mesh with uniform density, effectively welding complex assemblies into a printable solid.",
      "Geometry Nodes: The procedural modeling system allows for the creation of complex, mathematical structures (like lattices and reaction-diffusion patterns) that are modifiable and ideal for advanced additive manufacturing applications."
    ],
    pricing: [
      { tier: "Open Source (GPL)", cost: "$0.00", features: "Full feature set; commercial use allowed; source code available; no cloud lock-in." }
    ],
    strengths: [
      "Zero Cost: Accessibility is unmatched, with no risk of vendor lock-in or future licensing changes.",
      "Mesh Control: It offers unparalleled flexibility in repairing and modifying \"broken\" STLs that CAD software cannot open. It can handle millions of polygons with relative ease.",
      "Non-Destructive Modifiers: The modifier stack (Boolean, Bevel, Solidify) allows for a flexible workflow where changes can be reverted or adjusted at any stage before the final export."
    ],
    weaknesses: [
      "Non-Parametric: Blender lacks a parametric history tree. Changing the diameter of a screw hole after modeling complex surrounding geometry often requires destructive editing, making it poor for iterative mechanical engineering.",
      "Dimensional Precision: While it supports metric units, it does not strictly enforce dimensional constraints. Users must be diligent to apply scale transformations, otherwise, exported STLs may appear microscopic or gigantic in the slicer.",
      "Steep Learning Curve: Despite UI improvements, the reliance on hotkeys and the sheer density of features can be overwhelming for beginners accustomed to standard CAD interfaces."
    ],
    technicalSpecs: {
      price: "Free (Open Source GPL)",
      supportedOS: "Windows, macOS, Linux",
      fileSupport: "BLEND, STL, OBJ, FBX, GLTF, 3MF, PLY",
      connectivity: "Local Only"
    },
    links: {
      website: "https://www.blender.org",
      download: "https://www.blender.org/download",
      source: "https://github.com/blender/blender"
    }
  },
  {
    id: "solidworks",
    name: "SolidWorks",
    summary: "SolidWorks remains the global standard for mechanical engineering and industrial design. It utilizes a parametric, feature-based architecture that enables the creation of highly complex assemblies with rigorous dimensional control.",
    architectureOverview: "In 2025, SolidWorks continues to be the preferred tool for professional engineers designing functional parts—such as automotive components, robotics, and medical devices—where precision and manufacturability are non-negotiable. While primarily a desktop application, integration with the 3DEXPERIENCE platform has introduced cloud data management and collaboration features to the ecosystem.",
    additiveWorkflow: [
      "Print3D Feature: This native utility analyzes the geometry for specific 3D printing constraints. It checks for minimum wall thickness, identifies gaps that are too small for the printer resolution, and highlights areas requiring support structures. It allows users to select their specific printer from a database to tailor the analysis.",
      "Assembly Validation: The ability to simulate the mechanical assembly of parts allows users to check for interferences and clearances. For 3D printing, where tolerances must account for material expansion or contraction, the ability to globally adjust \"clearance\" variables via equations is critical.",
      "File Formats: SolidWorks offers industry-leading support for exporting STEP and 3MF files, which carry significantly more data (such as unit information and separate body definition) than the legacy STL format, reducing errors in the slicing stage."
    ],
    pricing: [
      { tier: "3DEXPERIENCE SolidWorks for Makers", cost: "~$48 / year", features: "Full CAD functionality; files are digitally watermarked (cannot open in commercial version); limited commercial revenue (<$2,000/yr); cloud login required." },
      { tier: "Commercial Standard", cost: "~$2,820 / year", features: "Perpetual license options (with maintenance); full commercial rights; local file storage without watermarks." },
      { tier: "Commercial Premium", cost: "~$4,716 / year", features: "Includes advanced simulation (FEA) and routing tools." }
    ],
    strengths: [
      "Engineering Precision: It is the undisputed champion for creating parts that must fit together perfectly. The constraint-based sketching ensures design intent is maintained.",
      "Simulation (FEA): The ability to simulate physical loads on a part allows engineers to optimize internal structures (infill) for strength-to-weight ratios before printing.",
      "Industry Standard: Proficiency in SolidWorks is a highly marketable professional skill, making it valuable for students and career-focused users."
    ],
    weaknesses: [
      "Watermarking (Maker): The digital watermark on Maker files limits collaboration with job shops or professional services that use commercial licenses.",
      "Hardware Requirements: It is a resource-heavy application requiring a certified GPU and Windows OS. There is no native macOS support, forcing Mac users to use virtualization or Bootcamp.",
      "UX Complexity: The interface is dense with distinct icons and menus, presenting a steeper learning curve than modern cloud CAD tools like Onshape."
    ],
    technicalSpecs: {
      price: "~$48/year (Makers) / ~$2,820/year (Standard)",
      supportedOS: "Windows Only",
      fileSupport: "SLDPRT, SLDASM, STEP, IGES, STL, 3MF, DXF, DWG",
      connectivity: "3DEXPERIENCE Cloud, Local Network"
    },
    links: {
      website: "https://www.solidworks.com",
      download: "https://www.solidworks.com/sw/support/downloads.htm"
    }
  },
  {
    id: "tinkercad",
    name: "Tinkercad",
    summary: "Tinkercad, an Autodesk product, represents the entry point for 3D literacy. It is a browser-based, Constructive Solid Geometry (CSG) tool that utilizes a \"primitive-building\" workflow.",
    architectureOverview: "Instead of drawing 2D sketches and extruding them, users drag and drop 3D shapes (cylinders, cubes, spheres) and combine them as either \"solids\" or \"holes\". It dominates the K-12 education market and the absolute beginner segment due to its accessibility and zero-install requirement.",
    additiveWorkflow: [
      "Guaranteed Manifold: Because users are combining pre-defined solids, it is mathematically difficult to create \"non-manifold\" geometry (holes in the mesh). This means Tinkercad exports are almost always 100% printable without needing repair.",
      "Codeblocks: This workspace introduces computational design. Users can write scripts using visual blocks (similar to Scratch) to generate geometry. This is useful for creating parametric patterns or scalable parts for printing.",
      "Direct Slicer Integration: Tinkercad features direct integration with cloud printing services and can export directly to slicer software, streamlining the classroom workflow."
    ],
    pricing: [
      { tier: "Free", cost: "$0.00", features: "Full feature set; account-based (Autodesk ID); no premium tiers or hidden costs; serves as funnel into broader Autodesk ecosystem." }
    ],
    strengths: [
      "Zero Barrier to Entry: It requires no installation, runs on Chromebooks (ubiquitous in schools), and requires no prior CAD knowledge.",
      "Reliability: The boolean engine is robust; parts combine predictably, and exports are print-ready.",
      "Smart Features: Despite its simplicity, features like the \"ruler\" allow for precise placement and sizing, making it surprisingly capable for simple functional brackets."
    ],
    weaknesses: [
      "Polygon Faceting: Tinkercad's cylinders are defined by a set number of sides (max 64). For large 3D prints, this results in visible faceting (polygonal edges) rather than smooth curves, which cannot be fixed within the software.",
      "Complexity Ceiling: As designs become complex (hundreds of primitives), the browser performance degrades significantly. It lacks advanced tools like fillets, chamfers (beyond basic radius), or lofts.",
      "Internet Dependency: It is entirely cloud-based; loss of internet connectivity means loss of access to the tool."
    ],
    technicalSpecs: {
      price: "Free",
      supportedOS: "Web Browser (Platform Agnostic)",
      fileSupport: "STL, OBJ, SVG, GLTF",
      connectivity: "Autodesk Cloud"
    },
    links: {
      website: "https://www.tinkercad.com",
      documentation: "https://www.tinkercad.com/learn"
    }
  }
];
