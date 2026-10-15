import { ellipseDistance, type Ellipse } from "./geometry";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const HAIR_TONES = {
  black: { r: 34, g: 28, b: 26 },
  brown: { r: 112, g: 66, b: 38 },
  copper: { r: 176, g: 88, b: 40 },
  blonde: { r: 214, g: 170, b: 98 },
  burgundy: { r: 118, g: 28, b: 46 },
  ash: { r: 150, g: 146, b: 140 },
} as const satisfies Record<string, Rgb>;

export type HairTone = keyof typeof HAIR_TONES;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export interface TintStats {
  hairPixels: number;
  changedPixels: number;
}

/**
 * Tints only pixels the segmentation model marks as hair, keeping the original
 * shading. Pixels inside the protected face ellipse are left byte-for-byte
 * identical. `mask` holds per-pixel hair confidence (0–1) at the same size.
 */
export function applyHairTint(
  pixels: Uint8ClampedArray,
  mask: Float32Array,
  width: number,
  height: number,
  tone: Rgb,
  options: { strength?: number; protect?: Ellipse | null } = {},
): TintStats {
  const strength = options.strength ?? 0.7;
  const protect = options.protect ?? null;
  let hairPixels = 0;
  let changedPixels = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const confidence = mask[i] ?? 0;
      if (confidence > 0.5) hairPixels += 1;
      let alpha = smoothstep(0.3, 0.8, confidence) * strength;
      if (alpha <= 0) continue;
      if (protect) {
        const d = ellipseDistance(protect, x, y);
        if (d <= 1) continue;
        // Feather the 15% band just outside the protected area.
        alpha *= smoothstep(1, 1.15, d);
        if (alpha <= 0) continue;
      }
      const p = i * 4;
      const r = pixels[p];
      const g = pixels[p + 1];
      const b = pixels[p + 2];
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const shade = 0.35 + luminance * 1.15;
      pixels[p] = r + (Math.min(255, tone.r * shade) - r) * alpha;
      pixels[p + 1] = g + (Math.min(255, tone.g * shade) - g) * alpha;
      pixels[p + 2] = b + (Math.min(255, tone.b * shade) - b) * alpha;
      changedPixels += 1;
    }
  }
  return { hairPixels, changedPixels };
}
