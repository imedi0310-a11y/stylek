import type { MessageKey } from "@/i18n/messages";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_FILE_MB = 15;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
export const MIN_DIMENSION = 200;
/** Photos are downscaled to this size before processing to keep phones responsive. */
export const MAX_PROCESS_DIMENSION = 1280;

export type ImageErrorKey = Extract<MessageKey, `file.${string}`>;

export class ImageInputError extends Error {
  constructor(public readonly key: ImageErrorKey) {
    super(key);
    this.name = "ImageInputError";
  }
}

/** Identifies JPEG, PNG and WebP from the file's first bytes, so a renamed file can't slip through. */
export function sniffImageType(bytes: Uint8Array): (typeof ACCEPTED_TYPES)[number] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "RIFF" &&
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/** Validates declared type, size and real content type. Throws ImageInputError. */
export async function validateImageFile(file: File | null | undefined): Promise<void> {
  if (!file) throw new ImageInputError("file.cancelled");
  if (file.type && !(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    throw new ImageInputError("file.invalidType");
  }
  if (file.size > MAX_FILE_BYTES) throw new ImageInputError("file.tooLarge");
  if (file.size === 0) throw new ImageInputError("file.decodeFailed");
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!sniffImageType(head)) throw new ImageInputError("file.invalidType");
}

export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Draws any image source onto a new canvas, downscaled to MAX_PROCESS_DIMENSION. */
export function sourceToCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) throw new ImageInputError("file.tooSmall");
  const size = fitWithin(width, height, MAX_PROCESS_DIMENSION);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageInputError("file.decodeFailed");
  ctx.drawImage(source, 0, 0, size.width, size.height);
  return canvas;
}

/** Decodes a validated file in memory (EXIF orientation is applied by the browser). */
export async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  await validateImageFile(file);
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      try {
        return sourceToCanvas(bitmap, bitmap.width, bitmap.height);
      } finally {
        bitmap.close();
      }
    } catch (error) {
      if (error instanceof ImageInputError) throw error;
      // Fall back to <img> decoding below.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode().catch(() => {
      throw new ImageInputError("file.decodeFailed");
    });
    return sourceToCanvas(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), type, quality);
  });
}

/** Frees the canvas backing store promptly (helps low-memory phones). */
export function releaseCanvas(canvas: HTMLCanvasElement | null | undefined): void {
  if (!canvas) return;
  canvas.width = 0;
  canvas.height = 0;
}
