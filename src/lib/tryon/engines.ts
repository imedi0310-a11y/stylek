import { buildHairGeometry, HEAD } from "@/lib/illustration";
import type { IllustrationSpec } from "@/lib/types";
import { guideTransform, ILLUSTRATION_EAR_Y, protectedFaceEllipse, type Ellipse } from "./geometry";
import { detectFace, segmentHair } from "./mediapipe";
import { applyHairTint, HAIR_TONES, type HairTone } from "./tint";

/**
 * Try-on engines. Each one declares honestly what it produces:
 *  - "reference": no processing, side-by-side only.
 *  - "prototype": a local, clearly-labelled visual aid — not a realistic result.
 * A future realistic hairstyle-transfer engine would use kind "realistic" and must
 * keep the face-protection step below.
 */
export type EngineId = "reference" | "tone" | "guide";
export type EngineKind = "reference" | "prototype" | "realistic";

export const ENGINE_KIND: Record<EngineId, EngineKind> = {
  reference: "reference",
  tone: "prototype",
  guide: "prototype",
};

export interface EngineResult {
  canvas: HTMLCanvasElement;
  faceProtected: boolean;
}

export class EngineError extends Error {
  constructor(public readonly reason: "noFace" | "noHair" | "load" | "process", message?: string) {
    super(message ?? reason);
    this.name = "EngineError";
  }
}

function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  canvas.getContext("2d")!.drawImage(source, 0, 0);
  return canvas;
}

/**
 * Copies the original pixels back inside the protected ellipse. The core is
 * copied at full opacity (pixel-identical); a narrow band outside it fades out
 * so there is no visible seam.
 */
export function restoreFace(target: HTMLCanvasElement, original: HTMLCanvasElement, e: Ellipse, feather = 0.15) {
  const temp = document.createElement("canvas");
  temp.width = original.width;
  temp.height = original.height;
  const tctx = temp.getContext("2d")!;
  tctx.drawImage(original, 0, 0);
  tctx.globalCompositeOperation = "destination-in";
  tctx.save();
  tctx.translate(e.cx, e.cy);
  tctx.rotate(e.angle);
  const outer = 1 + feather;
  tctx.scale(e.rx * outer, e.ry * outer);
  const gradient = tctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, "rgba(0,0,0,1)");
  gradient.addColorStop(1 / outer, "rgba(0,0,0,1)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  tctx.fillStyle = gradient;
  tctx.fillRect(-1, -1, 2, 2);
  tctx.restore();
  target.getContext("2d")!.drawImage(temp, 0, 0);
  temp.width = 0;
  temp.height = 0;
}

async function safeDetectFace(canvas: HTMLCanvasElement) {
  try {
    return await detectFace(canvas);
  } catch (error) {
    throw new EngineError("load", error instanceof Error ? error.message : String(error));
  }
}

/** Hair colour preview: recolours only segmented hair; face core is restored from the original. */
export async function runToneEngine(original: HTMLCanvasElement, tone: HairTone): Promise<EngineResult> {
  let mask: Float32Array;
  try {
    mask = await segmentHair(original);
  } catch (error) {
    throw new EngineError("load", error instanceof Error ? error.message : String(error));
  }
  const face = await safeDetectFace(original).catch(() => null);
  const protect = face ? protectedFaceEllipse(face) : null;

  const canvas = cloneCanvas(original);
  const ctx = canvas.getContext("2d")!;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const stats = applyHairTint(image.data, mask, canvas.width, canvas.height, HAIR_TONES[tone], { protect });
  if (stats.hairPixels < canvas.width * canvas.height * 0.005) throw new EngineError("noHair");
  ctx.putImageData(image, 0, 0);
  if (protect) restoreFace(canvas, original, protect);
  return { canvas, faceProtected: Boolean(protect) };
}

/** Shape guide prototype: draws a translucent silhouette of the style aligned to the detected head. */
export async function runGuideEngine(
  original: HTMLCanvasElement,
  spec: IllustrationSpec,
  options: { color?: string } = {},
): Promise<EngineResult> {
  const face = await safeDetectFace(original);
  if (!face) throw new EngineError("noFace");
  const transform = guideTransform(face);
  const protect = protectedFaceEllipse(face);
  const geometry = buildHairGeometry(spec);
  // A tinted guide colour (not a hair colour) so it reads as an overlay, not an edit.
  const color = options.color ?? "#14b8a6";

  const canvas = cloneCanvas(original);
  const ctx = canvas.getContext("2d")!;
  ctx.save();
  ctx.translate(transform.tx, transform.ty);
  ctx.rotate(transform.angle);
  ctx.scale(transform.scale, transform.scale);
  ctx.translate(-HEAD.cx, -ILLUSTRATION_EAR_Y);

  // Back hair, excluding the head itself so it never paints over the face.
  ctx.save();
  const outside = new Path2D();
  outside.rect(-400, -400, 1000, 1000);
  outside.ellipse(HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry, 0, 0, Math.PI * 2);
  ctx.clip(outside, "evenodd");
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.35;
  for (const d of geometry.back) ctx.fill(new Path2D(d));
  ctx.restore();

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.25;
  for (const d of geometry.faded) ctx.fill(new Path2D(d));
  ctx.globalAlpha = 0.4 * geometry.frontOpacity;
  for (const d of geometry.front) ctx.fill(new Path2D(d));

  // Dashed outline makes it obvious this is a guide, not a photo edit.
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  for (const d of [...geometry.back, ...geometry.front]) ctx.stroke(new Path2D(d));
  ctx.restore();

  restoreFace(canvas, original, protect);
  return { canvas, faceProtected: true };
}

/** Puts the photo and the style reference side by side for saving. */
export async function composeReference(original: HTMLCanvasElement, svg: SVGSVGElement | null): Promise<HTMLCanvasElement> {
  const height = original.height;
  const refWidth = Math.round(height * (200 / 240));
  const canvas = document.createElement("canvas");
  canvas.width = original.width + refWidth;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f7f5f2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(original, 0, 0);
  if (svg) {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(refWidth));
    clone.setAttribute("height", String(height));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      ctx.drawImage(img, original.width, 0, refWidth, height);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return canvas;
}
