import type { Point, Stroke } from './types';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Detects if a stroke is a rapid scratch-out / scribble gesture meant to erase.
 * A scribble has multiple directional reversals within a compact bounding box
 * and high path length relative to bounding box diagonal.
 */
export function detectScribble(points: Point[]): { isScribble: boolean; bounds: BoundingBox } | null {
  if (points.length < 16) return null;

  const duration = points[points.length - 1].t - points[0].t;
  if (duration > 1100 || duration < 120) return null; // Scribbles are quick scratch gestures

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let totalLength = 0;
  let reversalsX = 0;
  let reversalsY = 0;
  let lastDx = 0;
  let lastDy = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;

    if (i > 0) {
      const prev = points[i - 1];
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      totalLength += Math.hypot(dx, dy);

      // Track reversals in X (scratching horizontally back and forth)
      if (Math.abs(dx) > 4) {
        if (lastDx !== 0 && Math.sign(dx) !== Math.sign(lastDx)) {
          reversalsX++;
        }
        lastDx = dx;
      }

      // Track reversals in Y (scratching vertically back and forth)
      if (Math.abs(dy) > 4) {
        if (lastDy !== 0 && Math.sign(dy) !== Math.sign(lastDy)) {
          reversalsY++;
        }
        lastDy = dy;
      }
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const diagonal = Math.hypot(width, height) || 1;

  // Criteria for an authentic scratch-out gesture:
  // 1. High oscillation: At least 5 reversals in X or Y and total reversals >= 6
  // 2. High path density: total length traversed is at least 4.2x the bounding box diagonal
  // 3. Substantial motion: totalLength > 100px and reasonable scribble box size
  const isHighOscillation = (reversalsX >= 5 || reversalsY >= 5) && (reversalsX + reversalsY >= 6);
  const isHighDensity = (totalLength / diagonal) >= 4.2 && totalLength > 100;
  const isReasonableSize = width >= 15 && height >= 10 && width < 450 && height < 450;

  if (isHighOscillation && isHighDensity && isReasonableSize) {
    return {
      isScribble: true,
      bounds: {
        minX: minX - 12,
        minY: minY - 12,
        maxX: maxX + 12,
        maxY: maxY + 12,
      },
    };
  }

  return null;
}

/**
 * Checks if a stroke intersects with or lies inside a bounding box.
 */
export function strokeIntersectsBox(stroke: Stroke, box: BoundingBox): boolean {
  if ((stroke as any).shape && stroke.points.length === 0) {
    return false;
  }

  for (const pt of stroke.points) {
    if (pt.x >= box.minX && pt.x <= box.maxX && pt.y >= box.minY && pt.y <= box.maxY) {
      return true;
    }
  }

  return false;
}

/**
 * Detects shapes only when a user intentionally holds still at the end of a stroke.
 */
export function detectHoldShape(points: Point[]): { type: string; path: string } | null {
  if (points.length < 8) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const directDist = Math.hypot(last.x - first.x, last.y - first.y);

  let totalPath = 0;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;

    if (i > 0) {
      totalPath += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const diagonal = Math.hypot(width, height) || 1;

  // 1. Straight Line: End-to-end distance is almost equal to total path length
  if (directDist > totalPath * 0.85 && directDist > 20) {
    return {
      type: 'line',
      path: `M ${first.x} ${first.y} L ${last.x} ${last.y}`,
    };
  }

  // Check if closed (first point close to last point)
  const isClosed = (directDist / diagonal) < 0.32 && totalPath > 40;

  if (isClosed) {
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;
    const avgRadius = (radiusX + radiusY) / 2;

    // Check if points are roughly equidistant from center (Circle / Ellipse)
    let radiusVariance = 0;
    for (const p of points) {
      const r = Math.hypot(p.x - centerX, p.y - centerY);
      radiusVariance += Math.abs(r - avgRadius);
    }
    const avgVarianceRatio = (radiusVariance / points.length) / avgRadius;

    if (avgVarianceRatio < 0.3) {
      // Circle or Ellipse
      if (Math.abs(width - height) < Math.max(width, height) * 0.3) {
        // Circle
        const r = avgRadius;
        return {
          type: 'circle',
          path: `M ${centerX - r} ${centerY} A ${r} ${r} 0 1 1 ${centerX + r} ${centerY} A ${r} ${r} 0 1 1 ${centerX - r} ${centerY} Z`,
        };
      } else {
        // Ellipse
        return {
          type: 'circle',
          path: `M ${centerX - radiusX} ${centerY} A ${radiusX} ${radiusY} 0 1 1 ${centerX + radiusX} ${centerY} A ${radiusX} ${radiusY} 0 1 1 ${centerX - radiusX} ${centerY} Z`,
        };
      }
    }

    // Otherwise, Rectangle / Box
    return {
      type: 'rect',
      path: `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z`,
    };
  }

  return null;
}

/**
 * Checks if a point is inside a polygon (Ray casting algorithm for Lasso)
 */
export function isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
