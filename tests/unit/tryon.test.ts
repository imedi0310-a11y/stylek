import { describe, expect, it } from "vitest";
import { cameraErrorKey, cameraUnavailableReason } from "@/lib/tryon/camera";
import { protectedFaceEllipse, insideEllipse, guideTransform, type FaceKeypoints } from "@/lib/tryon/geometry";
import { fitWithin, ImageInputError, sniffImageType, validateImageFile, MAX_FILE_BYTES } from "@/lib/tryon/image";
import { applyHairTint, HAIR_TONES } from "@/lib/tryon/tint";
import { barberCardRows, barberCardText, sanitizeNote } from "@/lib/barberCard";
import { getHairstyleBySlug } from "@/data/hairstyles";
import { translate } from "@/i18n/messages";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = new Uint8Array([...new TextEncoder().encode("RIFF"), 0, 0, 0, 0, ...new TextEncoder().encode("WEBP")]);

/** jsdom's Blob lacks arrayBuffer in some versions; build a minimal File-like object. */
function fakeFile(bytes: Uint8Array, type: string, size = bytes.length): File {
  return {
    type,
    size,
    slice: () => ({ arrayBuffer: async () => bytes.buffer.slice(0) }),
  } as unknown as File;
}

describe("image validation", () => {
  it("sniffs real image signatures", () => {
    expect(sniffImageType(JPEG)).toBe("image/jpeg");
    expect(sniffImageType(PNG)).toBe("image/png");
    expect(sniffImageType(WEBP)).toBe("image/webp");
    expect(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });

  it("rejects missing, wrong-type, spoofed and oversized files", async () => {
    await expect(validateImageFile(null)).rejects.toMatchObject({ key: "file.cancelled" });
    await expect(validateImageFile(fakeFile(JPEG, "image/heic"))).rejects.toMatchObject({ key: "file.invalidType" });
    await expect(validateImageFile(fakeFile(new TextEncoder().encode("hello world!"), "image/jpeg"))).rejects.toBeInstanceOf(ImageInputError);
    await expect(validateImageFile(fakeFile(JPEG, "image/jpeg", MAX_FILE_BYTES + 1))).rejects.toMatchObject({ key: "file.tooLarge" });
    await expect(validateImageFile(fakeFile(PNG, "image/png"))).resolves.toBeUndefined();
  });

  it("downscales large photos proportionally", () => {
    expect(fitWithin(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
    expect(fitWithin(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });
});

describe("camera errors", () => {
  it("maps browser errors to helpful messages", () => {
    expect(cameraErrorKey(new DOMException("x", "NotAllowedError"))).toBe("camera.denied");
    expect(cameraErrorKey(new DOMException("x", "NotFoundError"))).toBe("camera.notFound");
    expect(cameraErrorKey(new DOMException("x", "NotReadableError"))).toBe("camera.inUse");
    expect(cameraErrorKey(new Error("weird"))).toBe("camera.failed");
  });

  it("detects insecure and unsupported contexts before asking for permission", () => {
    expect(cameraUnavailableReason({ isSecureContext: false, hasGetUserMedia: true })).toBe("camera.insecure");
    expect(cameraUnavailableReason({ isSecureContext: true, hasGetUserMedia: false })).toBe("camera.unsupported");
    expect(cameraUnavailableReason({ isSecureContext: true, hasGetUserMedia: true })).toBeNull();
  });
});

const face: FaceKeypoints = {
  rightEye: { x: 40, y: 40 },
  leftEye: { x: 60, y: 40 },
  nose: { x: 50, y: 50 },
  mouth: { x: 50, y: 60 },
  rightEar: { x: 28, y: 46 },
  leftEar: { x: 72, y: 46 },
};

describe("face protection", () => {
  it("covers eyes, nose and mouth", () => {
    const e = protectedFaceEllipse(face);
    for (const p of [face.rightEye, face.leftEye, face.nose, face.mouth]) expect(insideEllipse(e, p.x, p.y)).toBe(true);
    expect(insideEllipse(e, 0, 0)).toBe(false);
  });

  it("never changes protected pixels, even if the mask marks them as hair", () => {
    const w = 100;
    const h = 100;
    const pixels = new Uint8ClampedArray(w * h * 4).fill(120);
    const original = pixels.slice();
    const mask = new Float32Array(w * h).fill(1); // worst case: everything "is hair"
    const protect = protectedFaceEllipse(face);
    const stats = applyHairTint(pixels, mask, w, h, HAIR_TONES.copper, { protect });
    expect(stats.changedPixels).toBeGreaterThan(0);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        if (!insideEllipse(protect, x, y)) continue;
        const i = (y * w + x) * 4;
        expect([pixels[i], pixels[i + 1], pixels[i + 2]]).toEqual([original[i], original[i + 1], original[i + 2]]);
      }
    }
  });

  it("leaves non-hair pixels untouched", () => {
    const pixels = new Uint8ClampedArray(4 * 4 * 4).fill(200);
    const before = pixels.slice();
    const stats = applyHairTint(pixels, new Float32Array(16), 4, 4, HAIR_TONES.black);
    expect(stats.changedPixels).toBe(0);
    expect(pixels).toEqual(before);
  });

  it("aligns the shape guide to the detected head", () => {
    const tr = guideTransform(face);
    expect(tr.tx).toBe(50);
    expect(tr.scale).toBeCloseTo(44 / 80);
    expect(tr.angle).toBeCloseTo(0);
  });
});

describe("barber card", () => {
  it("uses the style's metadata and marks unknown sections as not specified", () => {
    const style = getHairstyleBySlug("classic-bob")!;
    const rows = barberCardRows(style, "en");
    expect(rows[0].value).toBe(style.barber.overall.en);
    const fade = rows.find((r) => r.label === "Fade / taper")!;
    expect(fade.specified).toBe(false);
    expect(fade.value).toBe(translate("en", "card.notSpecified"));
  });

  it("includes the reference message and sanitized note", () => {
    const style = getHairstyleBySlug("low-taper-fade")!;
    const text = barberCardText(style, "ar", "خط\u0007 جانبي", "https://example.com/x");
    expect(text).toContain(style.name.ar);
    expect(text).toContain(translate("ar", "card.message"));
    expect(text).toContain("خط جانبي");
    expect(sanitizeNote("a".repeat(900))).toHaveLength(500);
  });
});
