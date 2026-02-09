import { getImageUrl } from '@/lib/imageUrl';

// Logo mapping for CAD software - shared across all CAD reference components
export const cadLogos: Record<string, string> = {
  // Table names
  "Fusion 360": getImageUrl("cad/fusion360.png"),
  "Blender": getImageUrl("cad/blender.png"),
  "SolidWorks": getImageUrl("cad/solidworks.png"),
  "Tinkercad": getImageUrl("cad/tinkercad.png"),
  "ZBrush": getImageUrl("cad/zbrush.png"),
  "Meshmixer": getImageUrl("cad/meshmixer.png"),
  "FreeCAD": getImageUrl("cad/freecad.svg"),
  "Rhino 3D": getImageUrl("cad/rhino3d.png"),
  "OpenSCAD": getImageUrl("cad/openscad.png"),
  "Onshape": getImageUrl("cad/onshape.png"),
  "Shapr3D": getImageUrl("cad/shapr3d.png"),
  "SketchUp": getImageUrl("cad/sketchup.png"),
  "Plasticity": getImageUrl("cad/plasticity.png"),
  "Maya": getImageUrl("cad/maya.png"),
  "3ds Max": getImageUrl("cad/3dsmax.svg"),
  "Cinema 4D": getImageUrl("cad/cinema4d.png"),
  "Nomad Sculpt": getImageUrl("cad/nomadsculpt.png"),
  "AutoCAD": getImageUrl("cad/autocad.svg"),
  "SelfCAD": getImageUrl("cad/selfcad.png"),
  "BlocksCAD": getImageUrl("cad/blockscad.png"),
  // Accordion names (from cadData)
  "Autodesk Fusion 360": getImageUrl("cad/fusion360.png"),
  "Maxon ZBrush": getImageUrl("cad/zbrush.png"),
  "Autodesk Meshmixer": getImageUrl("cad/meshmixer.png"),
  "Trimble SketchUp": getImageUrl("cad/sketchup.png"),
  "Maxon Cinema 4D": getImageUrl("cad/cinema4d.png"),
  "Autodesk Maya": getImageUrl("cad/maya.png"),
  "Autodesk 3ds Max": getImageUrl("cad/3dsmax.svg"),
  "Autodesk AutoCAD": getImageUrl("cad/autocad.svg"),
  "Rhino 3D (Rhinoceros)": getImageUrl("cad/rhino3d.png"),
};

export const darkLogos = [
  "Fusion 360", "Autodesk Fusion 360",
  "AutoCAD", "Autodesk AutoCAD",
  "3ds Max", "Autodesk 3ds Max",
  "Maya", "Autodesk Maya",
  "Meshmixer", "Autodesk Meshmixer",
];

export const needsBrightness = (name: string) => darkLogos.includes(name);
