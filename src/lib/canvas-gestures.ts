import type { Point, Stroke } from './types';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Checks if a line segment between (x1, y1) and (x2, y2) intersects an axis-aligned bounding box.
 */
function segmentIntersectsBox(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  box: BoundingBox
): boolean {
  // Check if either endpoint is inside the box
  if (x1 >= box.minX && x1 <= box.maxX && y1 >= box.minY && y1 <= box.maxY) return true;
  if (x2 >= box.minX && x2 <= box.maxX && y2 >= box.minY && y2 <= box.maxY) return true;

  // Segment bounding box check for quick rejection
  const segMinX = Math.min(x1, x2);
  const segMaxX = Math.max(x1, x2);
  const segMinY = Math.min(y1, y2);
  const segMaxY = Math.max(y1, y2);

  if (segMaxX < box.minX || segMinX > box.maxX || segMaxY < box.minY || segMinY > box.maxY) {
    return false;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;

  // Test intersection with the 4 box boundary lines
  if (dy !== 0) {
    const tTop = (box.minY - y1) / dy;
    if (tTop >= 0 && tTop <= 1) {
      const x = x1 + tTop * dx;
      if (x >= box.minX && x <= box.maxX) return true;
    }
    const tBottom = (box.maxY - y1) / dy;
    if (tBottom >= 0 && tBottom <= 1) {
      const x = x1 + tBottom * dx;
      if (x >= box.minX && x <= box.maxX) return true;
    }
  }

  if (dx !== 0) {
    const tLeft = (box.minX - x1) / dx;
    if (tLeft >= 0 && tLeft <= 1) {
      const y = y1 + tLeft * dy;
      if (y >= box.minY && y <= box.maxY) return true;
    }
    const tRight = (box.maxX - x1) / dx;
    if (tRight >= 0 && tRight <= 1) {
      const y = y1 + tRight * dy;
      if (y >= box.minY && y <= box.maxY) return true;
    }
  }

  return false;
}

/**
 * Detects if a stroke is a rapid scratch-out / scribble gesture meant to erase.
 * Recognizes multi-angle zigzags (horizontal, vertical, diagonal) and tight loops,
 * while strictly preventing accidental triggers on cursive handwriting or drawings.
 */
export function detectScribble(points: Point[]): { isScribble: boolean; bounds: BoundingBox } | null {
  if (!points || points.length < 5) return null;

  // If timestamps are present, scribbles must occur within a natural scratch time window (50ms - 2500ms)
  if (points[0].t && points[points.length - 1].t) {
    const duration = points[points.length - 1].t - points[0].t;
    if (duration > 2500) return null; // Too slow to be an intentional scratch-out
    if (duration > 0 && duration < 50) return null; // Accidental micro-tap/spike
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let totalLength = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) {
      totalLength += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const diagonal = Math.hypot(width, height) || 1;

  // Gesture must have intentional motion and remain localized (not scratching the whole screen)
  if (totalLength < 35) return null;
  if (diagonal < 10) return null;
  if (width > 600 || height > 600) return null;

  const density = totalLength / diagonal;

  // Filter out micro-jitter points (< 3px apart) for robust reversal counting
  const filtered: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const last = filtered[filtered.length - 1];
    if (Math.hypot(points[i].x - last.x, points[i].y - last.y) >= 3) {
      filtered.push(points[i]);
    }
  }

  if (filtered.length < 4) return null;

  // 1. Sharp Direction Reversals & Angular Turning
  let sharpReversals = 0;
  let totalAngularTurn = 0;

  for (let i = 1; i < filtered.length - 1; i++) {
    const pPrev = filtered[i - 1];
    const pCurr = filtered[i];
    const pNext = filtered[i + 1];

    const v1x = pCurr.x - pPrev.x;
    const v1y = pCurr.y - pPrev.y;
    const v2x = pNext.x - pCurr.x;
    const v2y = pNext.y - pCurr.y;

    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);

    if (len1 > 0 && len2 > 0) {
      const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
      // Sharp hairpin turn (cosine < -0.32 corresponds to an angle > 108°)
      if (dot < -0.32) {
        sharpReversals++;
      }

      // Track angular turning for circular / spiral scribbles
      const a1 = Math.atan2(v1y, v1x);
      const a2 = Math.atan2(v2y, v2x);
      let diff = a2 - a1;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      totalAngularTurn += Math.abs(diff);
    }
  }

  // 2. Multi-Directional 1D Projected Extrema Check
  // Check 4 projection axes: 0° (horizontal), 45° (diagonal), 90° (vertical), 135° (slanted)
  const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
  let maxProjectedReversals = 0;

  for (const angle of angles) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    let reversals = 0;
    let lastDelta = 0;
    let accumDelta = 0;

    for (let i = 1; i < filtered.length; i++) {
      const sPrev = filtered[i - 1].x * cosA + filtered[i - 1].y * sinA;
      const sCurr = filtered[i].x * cosA + filtered[i].y * sinA;
      const ds = sCurr - sPrev;

      if (Math.abs(ds) > 0.5) {
        if (lastDelta === 0) {
          lastDelta = ds;
          accumDelta = ds;
        } else if (Math.sign(ds) === Math.sign(lastDelta)) {
          accumDelta += ds;
        } else {
          // Changed direction! Ensure previous swing was substantial (>= 6px) to avoid jitter
          if (Math.abs(accumDelta) >= 6) {
            reversals++;
            lastDelta = ds;
            accumDelta = ds;
          }
        }
      }
    }
    if (reversals > maxProjectedReversals) {
      maxProjectedReversals = reversals;
    }
  }

  // Criteria for genuine scratch-out:
  // - Zigzag scratch: at least 3 reversals (>= 3 back-and-forth passes) and density >= 1.7
  // - High oscillation scratch: at least 4 reversals (even if density is slightly lower)
  // - Looping/circular scratch: cumulative turning >= 3.5π and density >= 2.0 within compact area
  const isZigzagScribble = (maxProjectedReversals >= 3 || sharpReversals >= 3) && density >= 1.7;
  const isHighOscillation = maxProjectedReversals >= 4 || sharpReversals >= 4;
  const isLoopingScribble = totalAngularTurn >= 3.5 * Math.PI && density >= 2.0 && diagonal <= 250;

  if (isZigzagScribble || isHighOscillation || isLoopingScribble) {
    // Generous padding around the scratch so strokes underneath are reliably caught
    const padX = Math.max(16, width * 0.15);
    const padY = Math.max(16, height * 0.15);
    return {
      isScribble: true,
      bounds: {
        minX: minX - padX,
        minY: minY - padY,
        maxX: maxX + padX,
        maxY: maxY + padY,
      },
    };
  }

  return null;
}

/**
 * Checks if a stroke intersects with or lies inside a bounding box.
 * Fully supports handwriting strokes, tape, shape boundaries, and SVG path shapes.
 */
export function strokeIntersectsBox(stroke: Stroke, box: BoundingBox): boolean {
  // 1. Direct point containment
  for (const pt of stroke.points) {
    if (pt.x >= box.minX && pt.x <= box.maxX && pt.y >= box.minY && pt.y <= box.maxY) {
      return true;
    }
  }

  // 2. Line segment intersection for handwriting & tape
  for (let i = 1; i < stroke.points.length; i++) {
    const p1 = stroke.points[i - 1];
    const p2 = stroke.points[i];
    if (segmentIntersectsBox(p1.x, p1.y, p2.x, p2.y, box)) {
      return true;
    }
  }

  // 3. Shape boundary and bounding box intersection
  const shape = (stroke as any).shape as { type: string; path: string } | undefined;
  if (shape) {
    // If shape stroke has points (e.g. [start, pos] or captured stroke points)
    if (stroke.points && stroke.points.length >= 2) {
      let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
      for (const pt of stroke.points) {
        if (pt.x < sMinX) sMinX = pt.x;
        if (pt.x > sMaxX) sMaxX = pt.x;
        if (pt.y < sMinY) sMinY = pt.y;
        if (pt.y > sMaxY) sMaxY = pt.y;
      }
      const overlaps = !(sMaxX < box.minX || sMinX > box.maxX || sMaxY < box.minY || sMinY > box.maxY);
      if (overlaps) return true;
    }

    // Inspect SVG path coordinates
    if (shape.path) {
      const numbers = shape.path.match(/-?\d+(\.\d+)?/g);
      if (numbers && numbers.length >= 4) {
        let pMinX = Infinity, pMaxX = -Infinity, pMinY = Infinity, pMaxY = -Infinity;
        for (let i = 0; i < numbers.length - 1; i += 2) {
          const x = parseFloat(numbers[i]);
          const y = parseFloat(numbers[i + 1]);
          if (!isNaN(x) && !isNaN(y)) {
            if (x < pMinX) pMinX = x;
            if (x > pMaxX) pMaxX = x;
            if (y < pMinY) pMinY = y;
            if (y > pMaxY) pMaxY = y;
          }
        }
        if (pMinX !== Infinity) {
          const overlaps = !(pMaxX < box.minX || pMinX > box.maxX || pMaxY < box.minY || pMinY > box.maxY);
          if (overlaps) return true;
        }
      }
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

    // Verify if points actually conform to a rectangle (must be close to bounding box edges)
    let edgeDeviations = 0;
    for (const p of points) {
      const distToEdge = Math.min(
        Math.abs(p.x - minX),
        Math.abs(p.x - maxX),
        Math.abs(p.y - minY),
        Math.abs(p.y - maxY)
      );
      edgeDeviations += distToEdge;
    }
    const avgEdgeDev = edgeDeviations / points.length;

    // Only convert to rectangle if points genuinely trace along the 4 edges
    if (avgEdgeDev < diagonal * 0.12 && width > 25 && height > 25) {
      return {
        type: 'rect',
        path: `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z`,
      };
    }
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
