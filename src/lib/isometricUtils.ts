/**
 * Isometric projection utilities for 3D visualization
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface CubeDimensions {
  width: number;  // X
  depth: number;  // Y
  height: number; // Z
}

export interface CubeVertex {
  id: string;
  point3D: { x: number; y: number; z: number };
  point2D: Point2D;
}

export interface CubeEdge {
  from: string;
  to: string;
  path: string;
}

/**
 * Convert 3D coordinates to 2D isometric projection
 * Uses standard 30° isometric angle
 */
export function toIsometric(x: number, y: number, z: number): Point2D {
  const angle = Math.PI / 6; // 30 degrees
  return {
    x: (x - y) * Math.cos(angle),
    y: (x + y) * Math.sin(angle) - z
  };
}

/**
 * Generate all 8 vertices of a cube in isometric projection
 */
export function generateCubeVertices(
  dimensions: CubeDimensions,
  origin: Point2D,
  scale: number
): CubeVertex[] {
  const { width, depth, height } = dimensions;
  const w = width * scale;
  const d = depth * scale;
  const h = height * scale;

  const vertices: Array<{ id: string; x: number; y: number; z: number }> = [
    { id: 'fbl', x: 0, y: 0, z: 0 },      // front-bottom-left
    { id: 'fbr', x: w, y: 0, z: 0 },      // front-bottom-right
    { id: 'bbl', x: 0, y: d, z: 0 },      // back-bottom-left
    { id: 'bbr', x: w, y: d, z: 0 },      // back-bottom-right
    { id: 'ftl', x: 0, y: 0, z: h },      // front-top-left
    { id: 'ftr', x: w, y: 0, z: h },      // front-top-right
    { id: 'btl', x: 0, y: d, z: h },      // back-top-left
    { id: 'btr', x: w, y: d, z: h },      // back-top-right
  ];

  return vertices.map(v => {
    const iso = toIsometric(v.x, v.y, v.z);
    return {
      id: v.id,
      point3D: { x: v.x, y: v.y, z: v.z },
      point2D: {
        x: origin.x + iso.x,
        y: origin.y + iso.y
      }
    };
  });
}

/**
 * Generate SVG paths for cube edges
 */
export function generateCubeEdges(vertices: CubeVertex[]): CubeEdge[] {
  const getVertex = (id: string) => vertices.find(v => v.id === id)!;

  const edgeDefinitions = [
    // Bottom face
    ['fbl', 'fbr'],
    ['fbr', 'bbr'],
    ['bbr', 'bbl'],
    ['bbl', 'fbl'],
    // Top face
    ['ftl', 'ftr'],
    ['ftr', 'btr'],
    ['btr', 'btl'],
    ['btl', 'ftl'],
    // Vertical edges
    ['fbl', 'ftl'],
    ['fbr', 'ftr'],
    ['bbl', 'btl'],
    ['bbr', 'btr'],
  ];

  return edgeDefinitions.map(([from, to]) => {
    const v1 = getVertex(from);
    const v2 = getVertex(to);
    return {
      from,
      to,
      path: `M ${v1.point2D.x} ${v1.point2D.y} L ${v2.point2D.x} ${v2.point2D.y}`
    };
  });
}

/**
 * Calculate optimal scale to fit cubes in viewBox
 */
export function calculateScale(
  buildVolume: CubeDimensions,
  machineDimensions: CubeDimensions | null,
  viewBoxSize: number
): number {
  const maxDim = Math.max(
    buildVolume.width,
    buildVolume.depth,
    buildVolume.height,
    machineDimensions?.width || 0,
    machineDimensions?.depth || 0,
    machineDimensions?.height || 0
  );

  // Leave padding for labels and effects
  const usableSize = viewBoxSize * 0.6;
  
  // Account for isometric projection (diagonal is ~1.73x larger)
  return usableSize / (maxDim * 1.73);
}

/**
 * Calculate volume in liters from mm dimensions
 */
export function calculateVolume(x: number, y: number, z: number): number {
  return (x * y * z) / 1_000_000; // mm³ to liters
}

/**
 * Format volume for display
 */
export function formatVolume(liters: number): string {
  if (liters < 1) {
    return `${(liters * 1000).toFixed(0)} mL`;
  }
  return `${liters.toFixed(1)} L`;
}

/**
 * Get axis label position for a dimension
 */
export function getAxisLabelPosition(
  vertices: CubeVertex[],
  axis: 'x' | 'y' | 'z'
): { position: Point2D; anchor: string } {
  const getVertex = (id: string) => vertices.find(v => v.id === id)!;

  switch (axis) {
    case 'x': {
      // X-axis: along front bottom edge
      const v1 = getVertex('fbl');
      const v2 = getVertex('fbr');
      return {
        position: {
          x: (v1.point2D.x + v2.point2D.x) / 2,
          y: (v1.point2D.y + v2.point2D.y) / 2 + 15
        },
        anchor: 'middle'
      };
    }
    case 'y': {
      // Y-axis: along right bottom edge
      const v1 = getVertex('fbr');
      const v2 = getVertex('bbr');
      return {
        position: {
          x: (v1.point2D.x + v2.point2D.x) / 2 + 15,
          y: (v1.point2D.y + v2.point2D.y) / 2 + 5
        },
        anchor: 'start'
      };
    }
    case 'z': {
      // Z-axis: along front left vertical edge
      const v1 = getVertex('fbl');
      const v2 = getVertex('ftl');
      return {
        position: {
          x: (v1.point2D.x + v2.point2D.x) / 2 - 15,
          y: (v1.point2D.y + v2.point2D.y) / 2
        },
        anchor: 'end'
      };
    }
  }
}

/**
 * Generate Benchy silhouette path scaled to fit in cube
 */
export function getBenchyPath(
  vertices: CubeVertex[],
  buildHeight: number,
  scale: number
): { path: string; transform: string } {
  const getVertex = (id: string) => vertices.find(v => v.id === id)!;
  
  // Standard Benchy is ~48mm long, ~31mm wide, ~48mm tall
  const benchyHeight = 48;
  const benchyScale = (buildHeight * scale * 0.4) / benchyHeight;
  
  // Position at center-bottom of cube
  const fbl = getVertex('fbl');
  const bbr = getVertex('bbr');
  const centerX = (fbl.point2D.x + bbr.point2D.x) / 2;
  const baseY = (fbl.point2D.y + bbr.point2D.y) / 2;

  // Simplified Benchy silhouette (recognizable boat shape)
  const path = `
    M 0 48 
    L 5 48 L 8 45 L 10 48 L 48 48 
    L 48 42 L 45 40 L 48 38 L 48 30 
    L 42 28 L 40 25 L 42 22 L 40 18 
    L 35 15 L 32 12 L 28 12 L 25 10 
    L 22 8 L 20 5 L 18 8 L 15 12 
    L 10 14 L 8 18 L 5 22 L 3 28 
    L 0 35 Z
  `;

  return {
    path,
    transform: `translate(${centerX - 24 * benchyScale}, ${baseY - 48 * benchyScale}) scale(${benchyScale})`
  };
}
