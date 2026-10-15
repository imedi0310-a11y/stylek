import { HEAD } from "@/lib/illustration";

export interface Point {
  x: number;
  y: number;
}

/** MediaPipe face detector keypoint order (pixel coordinates). */
export interface FaceKeypoints {
  rightEye: Point;
  leftEye: Point;
  nose: Point;
  mouth: Point;
  rightEar: Point;
  leftEar: Point;
}

export interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Rotation in radians. */
  angle: number;
}

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * Ellipse covering brows, eyes, nose and mouth. Pixels inside it are always
 * restored from the original photo so the core facial features are never altered.
 */
export function protectedFaceEllipse(k: FaceKeypoints): Ellipse {
  const eyes = mid(k.rightEye, k.leftEye);
  const eyeDistance = Math.max(dist(k.rightEye, k.leftEye), 1);
  const eyeToMouth = Math.max(dist(eyes, k.mouth), eyeDistance * 0.6);
  const angle = Math.atan2(k.leftEye.y - k.rightEye.y, k.leftEye.x - k.rightEye.x);
  const center = mid(eyes, k.mouth);
  return {
    cx: center.x,
    cy: center.y,
    rx: eyeDistance * 1.0,
    ry: eyeToMouth * 1.3,
    angle,
  };
}

/** True when (x, y) lies inside the ellipse scaled by `scale`. */
export function insideEllipse(e: Ellipse, x: number, y: number, scale = 1): boolean {
  return ellipseDistance(e, x, y) <= scale;
}

/** Normalised distance from the ellipse centre: 1 = on the boundary. */
export function ellipseDistance(e: Ellipse, x: number, y: number): number {
  const cos = Math.cos(-e.angle);
  const sin = Math.sin(-e.angle);
  const dx = x - e.cx;
  const dy = y - e.cy;
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;
  return Math.sqrt((rx * rx) / (e.rx * e.rx) + (ry * ry) / (e.ry * e.ry));
}

export interface GuideTransform {
  /** Photo-space point that the illustration's ear line centre maps to. */
  tx: number;
  ty: number;
  scale: number;
  angle: number;
}

/** Maps the illustration's head (ears at HEAD.cx ± HEAD.rx) onto the detected face. */
export function guideTransform(k: FaceKeypoints): GuideTransform {
  const eyeDistance = Math.max(dist(k.rightEye, k.leftEye), 1);
  const earDistance = dist(k.rightEar, k.leftEar);
  // Ear keypoints are unreliable on turned faces; fall back to an eye-based estimate.
  const headWidth = earDistance > eyeDistance * 1.6 && earDistance < eyeDistance * 3.2 ? earDistance : eyeDistance * 2.3;
  const ears = earDistance > eyeDistance * 1.6 ? mid(k.rightEar, k.leftEar) : mid(k.rightEye, k.leftEye);
  return {
    tx: ears.x,
    ty: ears.y,
    scale: headWidth / (HEAD.rx * 2),
    angle: Math.atan2(k.leftEye.y - k.rightEye.y, k.leftEye.x - k.rightEye.x),
  };
}

/** Illustration y coordinate of the ear line (matches the drawn ears). */
export const ILLUSTRATION_EAR_Y = 116;
