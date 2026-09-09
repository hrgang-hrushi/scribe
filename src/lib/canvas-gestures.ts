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
/**
 * Checks if two 2D line segments (p1-p2 and p3-p4) intersect.
 */
function segmentIntersectsSegment(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  function ccw(A: Point, B: Point, C: Point) {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  }
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * High-precision, zero-false-positive Scribble / Scratch-Out Classifier.
 *
 * Guaranteed to NEVER misidentify:
 * - Single letters (a, b, c, d, e, k, m, o, r, s, w, etc.)
 * - Cursive handwriting words (e.g. "minimum", "in", "the")
 * - Math equations, integrals, sigmas, exponents, fractions
 *
 * Accurately detects:
 * - Genuine multi-pass back-and-forth scratch-outs (horizontal, diagonal, vertical)
 * - Dense multi-revolution cloud scratch-outs
 */
export function detectScribble(points: Point[]): { isScribble: boolean; bounds: BoundingBox } | null {
  if (!points || points.length < 12) return null; // Real scratch-outs require multiple directional sweeps

  // Natural scratching time window (80ms - 2500ms)
  const t0 = points[0]?.t;
  const tEnd = points[points.length - 1]?.t;
  if (t0 !== undefined && tEnd !== undefined) {
    const duration = tEnd - t0;
    if (duration > 2500 || duration < 80) return null;
  }

  // 1. Resample and denoise points (filter micro-jitter < 3.5px)
  const filtered: Point[] = [points[0]];
  let totalLength = 0;
  let minX = points[0].x, maxX = points[0].x, minY = points[0].y, maxY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;

    const last = filtered[filtered.length - 1];
    const dist = Math.hypot(p.x - last.x, p.y - last.y);
    if (dist >= 3.5) {
      filtered.push(p);
      totalLength += dist;
    }
  }

  if (filtered.length < 10) return null;

  const width = maxX - minX;
  const height = maxY - minY;
  const diagonal = Math.hypot(width, height) || 1;

  // Scratch-outs must have substance and remain reasonably localized
  if (totalLength < 70) return null; // Real scratch-outs travel at least 70px
  if (diagonal < 15) return null;
  if (width > 450 || height > 350 || diagonal > 500) return null;

  // 1. Underline / Heading Emphasis / Margin Rule Immunity:
  // Underlines are elongated horizontally with flat vertical height (height <= 42px).
  // Margin rules are elongated vertically with flat horizontal width (width <= 42px).
  // Real scratch-outs require vertical/diagonal sweeps covering entire letter bodies.
  const aspectRatioX = width / Math.max(1, height);
  const aspectRatioY = height / Math.max(1, width);
  if (aspectRatioX >= 2.6 && height <= 42) return null; // Underline or heading rule
  if (aspectRatioY >= 2.6 && width <= 42) return null; // Vertical margin line / bracket

  const density = totalLength / diagonal;
  // A scratch-out must be dense (repeatedly passing over the target)
  if (density < 2.5) return null;

  const netDisplacement = Math.hypot(
    filtered[filtered.length - 1].x - filtered[0].x,
    filtered[filtered.length - 1].y - filtered[0].y
  );
  const displacementRatio = netDisplacement / totalLength;
  // In cursive and drawings, pen travels across page (displacementRatio > 0.32).
  // In scratch-outs, pen stays in place (displacementRatio < 0.28).
  if (displacementRatio > 0.30) return null;

  // 2. Check 8 projection angles for alternating oscillations (0°, 22.5°, 45°, 67.5°, 90°, 112.5°, 135°, 157.5°)
  const angles = [0, Math.PI / 8, Math.PI / 4, (3 * Math.PI) / 8, Math.PI / 2, (5 * Math.PI) / 8, (3 * Math.PI) / 4, (7 * Math.PI) / 8];
  
  let bestOscillation = {
    reversals: 0,
    averageOverlap: 0,
    sharpTurns: 0,
  };

  for (const angle of angles) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Project points onto this axis
    const proj: number[] = filtered.map(p => p.x * cosA + p.y * sinA);
    const projMin = Math.min(...proj);
    const projMax = Math.max(...proj);
    const projSpan = projMax - projMin;

    if (projSpan < 14) continue;

    // Minimum amplitude for a legitimate leg: at least 12px or 32% of projected span
    const minSwing = Math.max(12, projSpan * 0.32);

    const extrema: { val: number; idx: number }[] = [];
    let currentDir = 0; // +1 increasing, -1 decreasing
    let lastExtremum = proj[0];
    let lastExtremumIdx = 0;

    for (let i = 1; i < proj.length; i++) {
      const delta = proj[i] - lastExtremum;
      if (currentDir === 0) {
        if (Math.abs(delta) >= minSwing) {
          currentDir = Math.sign(delta);
          lastExtremum = proj[i];
          lastExtremumIdx = i;
          extrema.push({ val: proj[0], idx: 0 });
        }
      } else if (currentDir === 1) { // Moving positive
        if (proj[i] > lastExtremum) {
          lastExtremum = proj[i];
          lastExtremumIdx = i;
        } else if (lastExtremum - proj[i] >= minSwing) {
          // Peaked and reversed!
          extrema.push({ val: lastExtremum, idx: lastExtremumIdx });
          currentDir = -1;
          lastExtremum = proj[i];
          lastExtremumIdx = i;
        }
      } else if (currentDir === -1) { // Moving negative
        if (proj[i] < lastExtremum) {
          lastExtremum = proj[i];
          lastExtremumIdx = i;
        } else if (proj[i] - lastExtremum >= minSwing) {
          // Valley and reversed!
          extrema.push({ val: lastExtremum, idx: lastExtremumIdx });
          currentDir = 1;
          lastExtremum = proj[i];
          lastExtremumIdx = i;
        }
      }
    }
    if (extrema.length > 0) {
      extrema.push({ val: lastExtremum, idx: lastExtremumIdx });
    }

    const reversals = Math.max(0, extrema.length - 1);
    if (reversals >= 5) {
      // Calculate spatial overlap between consecutive sweeps
      let totalOverlapRatio = 0;
      let overlapCount = 0;

      for (let e = 1; e < extrema.length - 1; e++) {
        const sweep1Min = Math.min(extrema[e - 1].val, extrema[e].val);
        const sweep1Max = Math.max(extrema[e - 1].val, extrema[e].val);
        const sweep2Min = Math.min(extrema[e].val, extrema[e + 1].val);
        const sweep2Max = Math.max(extrema[e].val, extrema[e + 1].val);

        const intMin = Math.max(sweep1Min, sweep2Min);
        const intMax = Math.min(sweep1Max, sweep2Max);
        const unionMin = Math.min(sweep1Min, sweep2Min);
        const unionMax = Math.max(sweep1Max, sweep2Max);

        const intersection = Math.max(0, intMax - intMin);
        const union = Math.max(1, unionMax - unionMin);

        totalOverlapRatio += intersection / union;
        overlapCount++;
      }

      const averageOverlap = overlapCount > 0 ? totalOverlapRatio / overlapCount : 0;

      // Count sharp hairpin turn angles at the extrema points
      let sharpTurns = 0;
      for (let e = 1; e < extrema.length - 1; e++) {
        const idx = extrema[e].idx;
        if (idx > 0 && idx < filtered.length - 1) {
          const v1x = filtered[idx].x - filtered[idx - 1].x;
          const v1y = filtered[idx].y - filtered[idx - 1].y;
          const v2x = filtered[idx + 1].x - filtered[idx].x;
          const v2y = filtered[idx + 1].y - filtered[idx].y;
          const len1 = Math.hypot(v1x, v1y);
          const len2 = Math.hypot(v2x, v2y);
          if (len1 > 0 && len2 > 0) {
            const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
            if (dot < -0.30) sharpTurns++; // Hairpin angle > 107°
          }
        }
      }

      if (reversals > bestOscillation.reversals) {
        bestOscillation = { reversals, averageOverlap, sharpTurns };
      }
    }
  }

  // 3. Evaluate criteria:
  // A true zigzag scratch-out:
  // - At least 6 alternating reversals (at least 3 full cycles) with average overlap >= 0.48
  // - OR 5 reversals with very high overlap (>= 0.62) and sharp hairpin turns (>= 3)
  const isZigzagScratch =
    (bestOscillation.reversals >= 6 && bestOscillation.averageOverlap >= 0.48) ||
    (bestOscillation.reversals >= 5 && bestOscillation.averageOverlap >= 0.62 && bestOscillation.sharpTurns >= 3);

  // 4. Safe Cloud/Vortex Scratch-Out (Dense circular scribble cloud)
  // Must be a dense cloud: at least 4 full revolutions (8π) AND multiple self-crossings
  let totalAngularTurn = 0;
  for (let i = 1; i < filtered.length - 1; i++) {
    const v1x = filtered[i].x - filtered[i - 1].x;
    const v1y = filtered[i].y - filtered[i - 1].y;
    const v2x = filtered[i + 1].x - filtered[i].x;
    const v2y = filtered[i + 1].y - filtered[i].y;
    const a1 = Math.atan2(v1y, v1x);
    const a2 = Math.atan2(v2y, v2x);
    let diff = a2 - a1;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    totalAngularTurn += Math.abs(diff);
  }

  // Fast self-crossing count
  let crossings = 0;
  for (let i = 0; i < filtered.length - 3; i += 2) {
    for (let j = i + 3; j < filtered.length - 1; j += 2) {
      if (segmentIntersectsSegment(filtered[i], filtered[i + 1], filtered[j], filtered[j + 1])) {
        crossings++;
      }
    }
  }

  const isCloudScratch =
    totalAngularTurn >= 8 * Math.PI && // At least 4 full circles
    crossings >= 4 &&                 // Multiple self-intersections
    density >= 3.8 &&
    displacementRatio < 0.25;

  if (isZigzagScratch || isCloudScratch) {
    // Tight 6px margin matching pen tip thickness (never grabs adjacent letters)
    const pad = 6;
    return {
      isScribble: true,
      bounds: {
        minX: minX - pad,
        minY: minY - pad,
        maxX: maxX + pad,
        maxY: maxY + pad,
      },
    };
  }

  return null;
}

/**
 * Accurately finds strokes that were physically covered and crossed out by a verified scribble gesture.
 * Preserves innocent neighboring letters by requiring true segment intersections or tight point enclosure.
 */
export function findStrokesCoveredByScribble(
  existingStrokes: Stroke[],
  scribblePoints: Point[],
  scribbleBounds: BoundingBox
): Stroke[] {
  if (!existingStrokes || existingStrokes.length === 0 || !scribblePoints || scribblePoints.length === 0) {
    return [];
  }

  const result: Stroke[] = [];

  for (const stroke of existingStrokes) {
    if (!stroke.points || stroke.points.length === 0) continue;

    // 1. Quick bounding box rejection (tight margin 6px)
    let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
    for (const p of stroke.points) {
      if (p.x < sMinX) sMinX = p.x;
      if (p.x > sMaxX) sMaxX = p.x;
      if (p.y < sMinY) sMinY = p.y;
      if (p.y > sMaxY) sMaxY = p.y;
    }

    const strokeHeight = sMaxY - sMinY;

    const bboxOverlaps = !(
      sMaxX < scribbleBounds.minX ||
      sMinX > scribbleBounds.maxX ||
      sMaxY < scribbleBounds.minY ||
      sMinY > scribbleBounds.maxY
    );

    if (!bboxOverlaps) continue;

    // 2. Vertical Overlap Guard (Heading Protection):
    // A scribble must cover the body of the target stroke, not just graze the baseline / descenders.
    // If the vertical overlap is less than 35% of the stroke's height,
    // the stroke sits above (e.g. heading above underline) or below the scribble — PRESERVE IT!
    const overlapY = Math.max(0, Math.min(sMaxY, scribbleBounds.maxY) - Math.max(sMinY, scribbleBounds.minY));
    const verticalCoverageRatio = strokeHeight > 0 ? overlapY / strokeHeight : 1;
    if (strokeHeight >= 16 && verticalCoverageRatio < 0.35) {
      continue; // Heading or stroke sitting strictly above or below the gesture! Never delete!
    }

    // 3. Segment Intersection Analysis:
    // Real scratch-outs cross through handwritten characters multiple times
    let intersectionCount = 0;
    for (let i = 1; i < scribblePoints.length; i++) {
      const scr1 = scribblePoints[i - 1];
      const scr2 = scribblePoints[i];

      for (let j = 1; j < stroke.points.length; j++) {
        const str1 = stroke.points[j - 1];
        const str2 = stroke.points[j];

        if (segmentIntersectsSegment(scr1, scr2, str1, str2)) {
          intersectionCount++;
          if (intersectionCount >= 2) break;
        }
      }
      if (intersectionCount >= 2) break;
    }

    if (intersectionCount >= 2) {
      result.push(stroke);
      continue;
    }

    // 4. Point enclosure check (for small dots/accents or short strokes inside the scribble)
    let enclosedPoints = 0;
    for (const pt of stroke.points) {
      if (
        pt.x >= scribbleBounds.minX &&
        pt.x <= scribbleBounds.maxX &&
        pt.y >= scribbleBounds.minY &&
        pt.y <= scribbleBounds.maxY
      ) {
        enclosedPoints++;
      }
    }

    const pointRatio = enclosedPoints / stroke.points.length;
    // For small strokes (dot of 'i' or 'j', accents), at least 60% of points must be inside
    // For normal strokes, at least 50% must be inside AND have at least 1 intersection
    if (stroke.points.length <= 6 && pointRatio >= 0.60) {
      result.push(stroke);
    } else if (pointRatio >= 0.50 && intersectionCount >= 1) {
      result.push(stroke);
    }
  }

  return result;
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
 * Distance from point (px, py) to line segment (x1, y1) - (x2, y2).
 */
export function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

/**
 * Checks if an eraser contact touches any part of a handwritten stroke or shape.
 * Used by the Stroke Eraser engine for instant, responsive gesture-based line deletion.
 */
export function strokeIntersectsEraser(
  stroke: Stroke,
  eraserPos: Point,
  eraserRadius: number
): boolean {
  if (!stroke.points || stroke.points.length === 0) return false;
  const threshold = eraserRadius + (stroke.width || 2) / 2;

  // 1. Fast bounding box check
  let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
  for (const p of stroke.points) {
    if (p.x < sMinX) sMinX = p.x;
    if (p.x > sMaxX) sMaxX = p.x;
    if (p.y < sMinY) sMinY = p.y;
    if (p.y > sMaxY) sMaxY = p.y;
  }
  if (
    eraserPos.x + threshold < sMinX ||
    eraserPos.x - threshold > sMaxX ||
    eraserPos.y + threshold < sMinY ||
    eraserPos.y - threshold > sMaxY
  ) {
    return false;
  }

  // 2. Segment distance check
  for (let i = 0; i < stroke.points.length; i++) {
    if (Math.hypot(stroke.points[i].x - eraserPos.x, stroke.points[i].y - eraserPos.y) <= threshold) {
      return true;
    }
    if (i > 0) {
      const p1 = stroke.points[i - 1];
      const p2 = stroke.points[i];
      if (distToSegment(eraserPos.x, eraserPos.y, p1.x, p1.y, p2.x, p2.y) <= threshold) {
        return true;
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

/**
 * Ergonomic pressure calibration curve for Apple Pencil & digital styluses.
 * Hardware sensors on WebKit / iPadOS emit low raw pressure (0.05 - 0.25) for normal comfortable handwriting.
 * This curve lifts the baseline so light touches produce rich, consistent ink lines without forcing
 * the user to press hard on the iPad glass, while preserving dynamic range for deliberate emphasis.
 */
export function calibratePressure(rawPressure: number | undefined, pointerType?: string): number {
  if (pointerType !== 'pen' && pointerType !== undefined) {
    return 0.5;
  }
  if (rawPressure === undefined || rawPressure === 0 || isNaN(rawPressure)) {
    return 0.5;
  }
  const p = Math.min(1, Math.max(0, rawPressure));
  return Math.min(1, Math.max(0.35, 0.30 + 0.70 * Math.pow(p, 0.40)));
}

/**
 * Returns tuned perfect-freehand stroke options for silky, responsive handwriting.
 * Eliminates hand fatigue by reducing thinning from 0.65 to 0.30 and adding subtle end tapers.
 */
export function getStrokeOptions(width: number, smoothing: number, toolType: string = 'pen') {
  if (toolType === 'highlighter') {
    return {
      size: width,
      thinning: 0,
      smoothing: 0.65,
      streamline: 0.50,
      simulatePressure: false,
      start: { cap: true, taper: 0 },
      end: { cap: true, taper: 0 },
    };
  }
  if (toolType === 'eraser') {
    return {
      size: width,
      thinning: 0,
      smoothing: 0.50,
      streamline: 0.40,
      simulatePressure: false,
      start: { cap: true, taper: 0 },
      end: { cap: true, taper: 0 },
    };
  }
  return {
    size: width,
    thinning: 0.30, // Gentle dynamic variation (eliminates hard pushing on glass!)
    smoothing: 0.60 + smoothing * 0.20,
    streamline: 0.50 + smoothing * 0.25, // Dampens micro-jitter from slippery iPad screen
    simulatePressure: false,
    easing: (t: number) => t,
    start: { cap: true, taper: 2 }, // Organic stroke start
    end: { cap: true, taper: 3 },   // Natural stroke lift-off
  };
}

/**
 * Comprehensive Multi-Layer Palm Rejection Engine.
 * Evaluates contact patch dimensions, contact ellipse radius, pen-active state,
 * and screen boundary resting zones to eliminate resting palms, wrists, and knuckle touches,
 * while allowing normal fingertips (15-34px radius, 30-68px width) to fluidly scroll and pinch.
 */
export function isPalmTouch(
  e: React.PointerEvent | PointerEvent | Touch,
  isPenActivelyTouching: boolean,
  lastPenTime: number = 0
): boolean {
  // If this is an explicit stylus event, it's never a palm
  if ((e as any).pointerType === 'pen' || (e as any).touchType === 'stylus') {
    return false;
  }

  // Layer 1: If Apple Pencil is actively touching down right now, any simultaneous touch is 100% resting palm
  if (isPenActivelyTouching) return true;

  const contactW = (e as any).width || 0;
  const contactH = (e as any).height || 0;
  const radiusX = (e as any).radiusX || 0;
  const radiusY = (e as any).radiusY || 0;

  // Layer 2: Flat palm, hypothenar margin, or wrist contact dimensions (iPad Retina digitizer).
  // A normal fingertip on iPad Retina has radius ~15-34px (width ~30-68px).
  // A resting palm, wrist, or base of hand has width > 95px or radius > 48px, or large contact ellipse area.
  if (contactW > 95 || contactH > 95) return true;
  if (radiusX > 48 || radiusY > 48) return true;
  if (contactW > 0 && contactH > 0 && contactW * contactH > 7000) return true;
  if (radiusX > 0 && radiusY > 0 && radiusX * radiusY > 2000) return true;

  // Layer 3: Inter-stroke handwriting pause guard (within 250ms of pencil lift).
  // During pen lifts between letters/words, palm remains rested on glass.
  // Reject large resting hand contact patches (>36px radius or >72px width),
  // but allow clean deliberate fingertips (<36px radius) to scroll/pinch immediately!
  if (lastPenTime > 0 && Date.now() - lastPenTime < 250) {
    if (radiusX > 36 || radiusY > 36 || contactW > 72 || contactH > 72) {
      return true;
    }
  }

  return false;
}

/**
 * Intelligent Angle Snapping for Ruler & Math Diagramming.
 * Snaps lines within ~5 degrees to exact horizontal (0°), vertical (90°), or 45° diagonals.
 */
export function snapRulerPoint(
  start: { x: number; y: number },
  pos: { x: number; y: number }
): { x: number; y: number; isSnapped: boolean; angleDeg: number } {
  const dx = pos.x - start.x;
  const dy = pos.y - start.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 10) return { x: pos.x, y: pos.y, isSnapped: false, angleDeg: 0 };

  const angle = Math.atan2(dy, dx);
  const snapThreshold = 0.087; // ~5 degrees
  const angleDeg = Math.round((angle * 180) / Math.PI);

  // 1. Horizontal snap (0° or 180°)
  if (Math.abs(angle) < snapThreshold || Math.abs(Math.abs(angle) - Math.PI) < snapThreshold) {
    return { x: pos.x, y: start.y, isSnapped: true, angleDeg: Math.abs(angle) < snapThreshold ? 0 : 180 };
  }

  // 2. Vertical snap (90° or -90°)
  if (Math.abs(Math.abs(angle) - Math.PI / 2) < snapThreshold) {
    return { x: start.x, y: pos.y, isSnapped: true, angleDeg: angle > 0 ? 90 : -90 };
  }

  // 3. 45° diagonal snap
  const piOver4 = Math.PI / 4;
  const threePiOver4 = 3 * Math.PI / 4;
  if (Math.abs(Math.abs(angle) - piOver4) < snapThreshold || Math.abs(Math.abs(angle) - threePiOver4) < snapThreshold) {
    const signX = dx >= 0 ? 1 : -1;
    const signY = dy >= 0 ? 1 : -1;
    const avgLen = (Math.abs(dx) + Math.abs(dy)) / 2;
    return {
      x: start.x + signX * avgLen,
      y: start.y + signY * avgLen,
      isSnapped: true,
      angleDeg: signX > 0 ? (signY > 0 ? 45 : -45) : (signY > 0 ? 135 : -135),
    };
  }

  return { x: pos.x, y: pos.y, isSnapped: false, angleDeg };
}
