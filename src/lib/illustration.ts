import type { IllustrationSpec } from "./types";

/**
 * Geometry for the built-in hairstyle illustrations, in a 200×240 coordinate space.
 * The same SVG path strings are rendered by React (cards) and by canvas Path2D
 * (try-on shape guide), so both stay consistent.
 */
export const ILLUSTRATION_SIZE = { width: 200, height: 240 } as const;

/** Head ellipse used by the illustration; the try-on guide maps a detected face onto it. */
export const HEAD = { cx: 100, cy: 112, rx: 40, ry: 50 } as const;

export interface HairGeometry {
  /** Hair drawn behind the head (long lengths, volume). */
  back: string[];
  /** Hair drawn over the head (cap, fringe, quiff). */
  front: string[];
  /** Short/faded side areas drawn with reduced opacity. */
  faded: string[];
  /** Opacity used for the main hair when the whole cut is very short (buzz). */
  frontOpacity: number;
}

const FALL_BOTTOM: Record<IllustrationSpec["fall"], number> = { 0: 0, 1: 0, 2: 150, 3: 170, 4: 202, 5: 234 };

function capPath(top: number, sideBottom: number, hairline: number): string {
  const l = HEAD.cx - HEAD.rx - 2;
  const r = HEAD.cx + HEAD.rx + 2;
  return [
    `M ${l} ${sideBottom}`,
    `C ${l - 4} ${top + 16} ${HEAD.cx - 30} ${top} ${HEAD.cx} ${top}`,
    `C ${HEAD.cx + 30} ${top} ${r + 4} ${top + 16} ${r} ${sideBottom}`,
    `C ${r - 6} ${hairline + 6} ${HEAD.cx + 24} ${hairline} ${HEAD.cx} ${hairline}`,
    `C ${HEAD.cx - 24} ${hairline} ${l + 6} ${hairline + 6} ${l} ${sideBottom}`,
    "Z",
  ].join(" ");
}

function backPath(spec: IllustrationSpec, top: number): string | null {
  const bottom = FALL_BOTTOM[spec.fall];
  if (!bottom) return null;
  const extra = spec.shape === "mullet" ? -6 : spec.fall >= 4 ? 8 : 2;
  const w = HEAD.rx + 6 + spec.volume * 3 + extra;
  const l = HEAD.cx - w;
  const r = HEAD.cx + w;
  const flare = spec.shape === "bob" ? 4 : spec.shape === "sleek" ? -4 : 0;
  let bottomEdge: string;
  if (spec.shape === "shag" || spec.shape === "mullet") {
    // Choppy ends.
    const steps = 6;
    const pts: string[] = [];
    for (let i = 1; i <= steps; i += 1) {
      const x = r + flare - ((r - l + 2 * flare) * i) / steps;
      const y = bottom - (i % 2 === 0 ? 0 : 12);
      pts.push(`L ${x.toFixed(1)} ${y}`);
    }
    bottomEdge = pts.join(" ");
  } else if (spec.shape === "bob") {
    bottomEdge = `Q ${HEAD.cx} ${bottom + 8} ${l - flare} ${bottom}`;
  } else {
    bottomEdge = `Q ${HEAD.cx} ${bottom + 10} ${l - flare} ${bottom - 4}`;
  }
  return [
    `M ${l} ${HEAD.cy - 10}`,
    `C ${l} ${top + 6} ${HEAD.cx - 26} ${top - 4} ${HEAD.cx} ${top - 4}`,
    `C ${HEAD.cx + 26} ${top - 4} ${r} ${top + 6} ${r} ${HEAD.cy - 10}`,
    `L ${r + flare} ${bottom - 4}`,
    bottomEdge,
    "Z",
  ].join(" ");
}

function fringePath(fringe: NonNullable<IllustrationSpec["fringe"]>, hairline: number): string | null {
  const cx = HEAD.cx;
  switch (fringe) {
    case "straight":
      return `M ${cx - 38} ${hairline + 4} C ${cx - 30} ${hairline - 8} ${cx + 30} ${hairline - 8} ${cx + 38} ${hairline + 4} L ${cx + 37} ${hairline + 20} L ${cx - 37} ${hairline + 20} Z`;
    case "curtain":
      return [
        `M ${cx} ${hairline - 2} C ${cx - 14} ${hairline + 4} ${cx - 30} ${hairline + 18} ${cx - 37} ${hairline + 40} L ${cx - 42} ${hairline + 14} C ${cx - 34} ${hairline - 2} ${cx - 16} ${hairline - 6} ${cx} ${hairline - 2} Z`,
        `M ${cx} ${hairline - 2} C ${cx + 14} ${hairline + 4} ${cx + 30} ${hairline + 18} ${cx + 37} ${hairline + 40} L ${cx + 42} ${hairline + 14} C ${cx + 34} ${hairline - 2} ${cx + 16} ${hairline - 6} ${cx} ${hairline - 2} Z`,
      ].join(" ");
    case "side":
      return `M ${cx + 40} ${hairline + 12} C ${cx + 20} ${hairline - 6} ${cx - 24} ${hairline - 4} ${cx - 40} ${hairline + 28} C ${cx - 26} ${hairline + 12} ${cx + 6} ${hairline + 8} ${cx + 40} ${hairline + 18} Z`;
    case "textured": {
      const pts: string[] = [`M ${cx - 38} ${hairline + 2}`];
      for (let i = 0; i <= 8; i += 1) {
        const x = cx - 36 + i * 9;
        pts.push(`L ${x} ${hairline + (i % 2 === 0 ? 16 : 8)}`);
      }
      pts.push(`L ${cx + 38} ${hairline + 2} C ${cx + 20} ${hairline - 8} ${cx - 20} ${hairline - 8} ${cx - 38} ${hairline + 2} Z`);
      return pts.join(" ");
    }
    case "wispy": {
      const pts: string[] = [`M ${cx - 36} ${hairline + 2}`];
      for (let i = 0; i <= 12; i += 1) {
        const x = cx - 34 + i * 5.7;
        pts.push(`L ${x.toFixed(1)} ${hairline + (i % 2 === 0 ? 22 : 10)}`);
      }
      pts.push(`L ${cx + 36} ${hairline + 2} Z`);
      return pts.join(" ");
    }
    case "swept-back":
    case "none":
    default:
      return null;
  }
}

function volumeFront(spec: IllustrationSpec, top: number): string | null {
  const cx = HEAD.cx;
  if (spec.shape === "pompadour") {
    return `M ${cx - 36} ${top + 26} C ${cx - 36} ${top - 18} ${cx + 30} ${top - 26} ${cx + 38} ${top + 18} C ${cx + 20} ${top + 10} ${cx - 10} ${top + 14} ${cx - 36} ${top + 26} Z`;
  }
  if (spec.shape === "quiff") {
    return `M ${cx - 30} ${top + 24} C ${cx - 24} ${top - 12} ${cx + 18} ${top - 18} ${cx + 30} ${top + 6} C ${cx + 12} ${top + 4} ${cx - 8} ${top + 12} ${cx - 30} ${top + 24} Z`;
  }
  return null;
}

export function buildHairGeometry(spec: IllustrationSpec): HairGeometry {
  const back: string[] = [];
  const front: string[] = [];
  const faded: string[] = [];
  const fade = spec.fade ?? "none";
  const top = HEAD.cy - HEAD.ry - 4 - spec.volume * 5;
  const hairline = spec.fringe === "swept-back" ? 74 : 80;

  if (spec.shape === "afro") {
    back.push(`M ${HEAD.cx - 68} 104 A 68 66 0 1 1 ${HEAD.cx + 68} 104 A 68 60 0 0 1 ${HEAD.cx + 50} 150 L ${HEAD.cx - 50} 150 A 68 60 0 0 1 ${HEAD.cx - 68} 104 Z`);
  } else if (spec.shape === "round") {
    const r = 50 + spec.volume * 3;
    back.push(`M ${HEAD.cx - r} 108 A ${r} ${r - 2} 0 1 1 ${HEAD.cx + r} 108 L ${HEAD.cx + r - 4} ${Math.max(FALL_BOTTOM[spec.fall], 130)} Q ${HEAD.cx} ${Math.max(FALL_BOTTOM[spec.fall], 130) + 10} ${HEAD.cx - r + 4} ${Math.max(FALL_BOTTOM[spec.fall], 130)} Z`);
  } else {
    const b = backPath(spec, top);
    if (b) back.push(b);
  }

  if (fade === "buzz") {
    front.push(capPath(HEAD.cy - HEAD.ry - 2, 112, 76));
    return { back, front, faded, frontOpacity: 0.55 };
  }

  const sideBottom = { none: spec.fall >= 2 ? 128 : 112, low: 104, mid: 96, high: 88 }[fade];
  front.push(capPath(top, sideBottom, hairline));

  if (fade !== "none") {
    const l = HEAD.cx - HEAD.rx - 2;
    const r = HEAD.cx + HEAD.rx + 2;
    faded.push(
      `M ${l} ${sideBottom - 4} C ${l - 3} ${sideBottom + 10} ${l - 1} 118 ${l + 3} 128 L ${l + 10} 124 C ${l + 7} 112 ${l + 7} ${sideBottom + 4} ${l + 9} ${sideBottom - 6} Z`,
      `M ${r} ${sideBottom - 4} C ${r + 3} ${sideBottom + 10} ${r + 1} 118 ${r - 3} 128 L ${r - 10} 124 C ${r - 7} 112 ${r - 7} ${sideBottom + 4} ${r - 9} ${sideBottom - 6} Z`,
    );
  }

  const v = volumeFront(spec, top);
  if (v) front.push(v);

  if (spec.shape === "parted") {
    // A slightly heavier sweep across the top for side-part styles.
    front.push(`M ${HEAD.cx - 18} ${top + 4} C ${HEAD.cx + 10} ${top - 4} ${HEAD.cx + 36} ${top + 8} ${HEAD.cx + 42} ${top + 30} C ${HEAD.cx + 26} ${top + 16} ${HEAD.cx} ${top + 12} ${HEAD.cx - 18} ${top + 14} Z`);
  }

  const f = fringePath(spec.fringe ?? "none", hairline);
  if (f) front.push(f);

  return { back, front, faded, frontOpacity: 1 };
}

const SKIN_TONES = ["#f3d2b3", "#e2b48a", "#c68e5e", "#9a6440", "#6b4329"];
const BACKGROUNDS = ["#ece7e1", "#e6ebe8", "#e9e5ee", "#efe8df", "#e4e9ee", "#eee6e6"];
const HAIR_COLORS = ["#2a211c", "#3b2a20", "#1f1a17", "#4a3326", "#2e2522"];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic palette per style so the catalogue shows a variety of skin and hair tones. */
export function illustrationPalette(id: string, spec: IllustrationSpec) {
  const h = hash(id);
  return {
    skin: SKIN_TONES[h % SKIN_TONES.length],
    background: BACKGROUNDS[(h >>> 3) % BACKGROUNDS.length],
    hair: spec.color ?? HAIR_COLORS[(h >>> 5) % HAIR_COLORS.length],
  };
}
